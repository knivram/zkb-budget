import { Effect, Schedule } from "effect";
import {
  EnrichedTransaction,
  transactionEnrichmentResponseSchema,
} from "@/lib/api/ai-schemas";
import {
  enrichTransactionsRequestSchema,
  SubscriptionForAI,
  Transaction,
} from "@/lib/api/api-schemas";
import { inputErrorToResponse, validateRequest } from "@/lib/api/api-validation";
import { TRANSACTION_ENRICHMENT } from "@/lib/api/promts";
import {
  convertSubscriptionsToToon,
  convertTransactionsToToon,
} from "@/lib/toon-converter";
import { chunkArray } from "@/lib/utils";
import { AIRequestError, MissingEnvVarError } from "@/lib/errors";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, Output } from "ai";

const BATCH_SIZE = 50;

// ============================================================================
// Effect-based helper functions
// ============================================================================

/**
 * Get a required environment variable or fail with MissingEnvVarError.
 */
const getRequiredEnv = (
  name: string
): Effect.Effect<string, MissingEnvVarError> =>
  Effect.fromNullable(process.env[name]).pipe(
    Effect.mapError(() => new MissingEnvVarError({ name }))
  );

/**
 * Process a single batch of transactions through the AI.
 */
const processBatch = (
  transactions: Transaction[],
  subscriptions: SubscriptionForAI[],
  openrouter: ReturnType<typeof createOpenRouter>
): Effect.Effect<EnrichedTransaction[], AIRequestError> =>
  Effect.tryPromise({
    try: async () => {
      const toonTransactions = convertTransactionsToToon(transactions);
      const toonSubscriptions = convertSubscriptionsToToon(subscriptions);

      const result = await generateText({
        model: openrouter.chat("google/gemini-3-flash-preview"),
        output: Output.object({
          schema: transactionEnrichmentResponseSchema,
        }),
        system: TRANSACTION_ENRICHMENT.system,
        prompt: TRANSACTION_ENRICHMENT.user(toonTransactions, toonSubscriptions),
      });

      return result.output?.transactions ?? [];
    },
    catch: (error) =>
      new AIRequestError({ operation: "transaction enrichment", cause: error }),
  });

/**
 * Process a batch with automatic retry on failure.
 * Uses Effect's built-in retry with a simple once policy.
 */
const processBatchWithRetry = (
  transactions: Transaction[],
  subscriptions: SubscriptionForAI[],
  openrouter: ReturnType<typeof createOpenRouter>
): Effect.Effect<EnrichedTransaction[], AIRequestError> =>
  processBatch(transactions, subscriptions, openrouter).pipe(
    Effect.retry(Schedule.once),
    Effect.tapError((error) =>
      Effect.sync(() =>
        console.warn(
          `Batch of ${transactions.length} transactions failed after retry:`,
          error.cause
        )
      )
    )
  );

/**
 * Process all batches, collecting successes and tracking failures.
 * Uses Effect.partition to handle partial failures gracefully.
 */
const processAllBatches = (
  batches: Transaction[][],
  subscriptions: SubscriptionForAI[],
  openrouter: ReturnType<typeof createOpenRouter>
): Effect.Effect<{ enriched: EnrichedTransaction[]; failedCount: number }> =>
  Effect.gen(function* () {
    // Process all batches concurrently, catching errors per-batch
    const results = yield* Effect.forEach(
      batches,
      (batch) =>
        processBatchWithRetry(batch, subscriptions, openrouter).pipe(
          Effect.either
        ),
      { concurrency: "unbounded" }
    );

    // Separate successes and failures
    const enriched: EnrichedTransaction[] = [];
    let failedCount = 0;

    for (const result of results) {
      if (result._tag === "Right") {
        enriched.push(...result.right);
      } else {
        failedCount++;
      }
    }

    return { enriched, failedCount };
  });

// ============================================================================
// Main API handler
// ============================================================================

/**
 * The main enrichment pipeline as an Effect.
 * Composes validation, batch processing, and error handling.
 */
const enrichTransactionsEffect = (
  request: Request
): Effect.Effect<
  Response,
  MissingEnvVarError,
  never
> =>
  Effect.gen(function* () {
    // Get required API key
    const apiKey = yield* getRequiredEnv("OPENROUTER_API_KEY");
    const openrouter = createOpenRouter({ apiKey });

    // Validate request - handle validation errors by converting to Response
    const validationResult = yield* validateRequest(
      request,
      enrichTransactionsRequestSchema
    ).pipe(Effect.either);

    if (validationResult._tag === "Left") {
      return inputErrorToResponse(validationResult.left);
    }

    const { transactions, subscriptions } = validationResult.right;

    // Process in batches
    const batches = chunkArray(transactions, BATCH_SIZE);
    const { enriched, failedCount } = yield* processAllBatches(
      batches,
      subscriptions,
      openrouter
    );

    if (failedCount > 0) {
      console.warn(`${failedCount}/${batches.length} batches failed after retry`);
    }

    return Response.json({ transactions: enriched });
  });

/**
 * Convert any error to an appropriate HTTP Response.
 */
const errorToResponse = (
  error: MissingEnvVarError | AIRequestError | unknown
): Response => {
  if (error instanceof MissingEnvVarError) {
    console.error(error.message);
    return Response.json(
      { error: "Failed to enrich transactions" },
      { status: 500 }
    );
  }

  console.error("Transaction enrichment error:", error);
  return Response.json(
    {
      error: "Failed to enrich transactions",
      details: error instanceof Error ? error.message : String(error),
    },
    { status: 500 }
  );
};

/**
 * POST handler for transaction enrichment.
 * Runs the Effect pipeline and handles all errors.
 */
export async function POST(request: Request): Promise<Response> {
  const result = await Effect.runPromiseExit(enrichTransactionsEffect(request));

  if (result._tag === "Failure") {
    // Extract the error from the Cause
    const cause = result.cause;
    if (cause._tag === "Fail") {
      return errorToResponse(cause.error);
    }
    // Handle defects (unexpected errors)
    if (cause._tag === "Die") {
      return errorToResponse(cause.defect);
    }
    return errorToResponse(new Error("Unknown error"));
  }

  return result.value;
}
