import { Effect } from "effect";
import { subscriptionDetectionResponseSchema } from "@/lib/api/ai-schemas";
import { detectSubscriptionsRequestSchema } from "@/lib/api/api-schemas";
import { inputErrorToResponse, validateRequest } from "@/lib/api/api-validation";
import { SUBSCRIPTION_DETECTION } from "@/lib/api/promts";
import { convertTransactionsToToon } from "@/lib/toon-converter";
import { AIRequestError, MissingEnvVarError } from "@/lib/errors";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, Output } from "ai";

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
 * Detect subscriptions from transactions using AI.
 */
const detectSubscriptionsAI = (
  transactions: unknown[],
  openrouter: ReturnType<typeof createOpenRouter>
): Effect.Effect<unknown, AIRequestError> =>
  Effect.tryPromise({
    try: async () => {
      const toonData = convertTransactionsToToon(transactions);

      const result = await generateText({
        model: openrouter.chat("google/gemini-3-flash-preview"),
        output: Output.object({
          schema: subscriptionDetectionResponseSchema,
        }),
        system: SUBSCRIPTION_DETECTION.system,
        prompt: SUBSCRIPTION_DETECTION.user(toonData),
      });

      return result.output;
    },
    catch: (error) =>
      new AIRequestError({ operation: "subscription detection", cause: error }),
  });

// ============================================================================
// Main API handler
// ============================================================================

/**
 * The main detection pipeline as an Effect.
 * Composes validation, AI detection, and error handling.
 */
const detectSubscriptionsEffect = (
  request: Request
): Effect.Effect<Response, MissingEnvVarError | AIRequestError> =>
  Effect.gen(function* () {
    // Get required API key
    const apiKey = yield* getRequiredEnv("OPENROUTER_API_KEY");
    const openrouter = createOpenRouter({ apiKey });

    // Validate request - handle validation errors by converting to Response
    const validationResult = yield* validateRequest(
      request,
      detectSubscriptionsRequestSchema
    ).pipe(Effect.either);

    if (validationResult._tag === "Left") {
      return inputErrorToResponse(validationResult.left);
    }

    const { transactions } = validationResult.right;

    // Detect subscriptions
    const result = yield* detectSubscriptionsAI(transactions, openrouter);

    return Response.json(result);
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
      { error: "Failed to detect subscriptions" },
      { status: 500 }
    );
  }

  if (error instanceof AIRequestError) {
    console.error("Subscription detection error:", error.cause);
    return Response.json(
      {
        error: "Failed to detect subscriptions",
        details: error.cause instanceof Error ? error.cause.message : String(error.cause),
      },
      { status: 500 }
    );
  }

  console.error("Subscription detection error:", error);
  return Response.json(
    {
      error: "Failed to detect subscriptions",
      details: error instanceof Error ? error.message : String(error),
    },
    { status: 500 }
  );
};

/**
 * POST handler for subscription detection.
 * Runs the Effect pipeline and handles all errors.
 */
export async function POST(request: Request): Promise<Response> {
  const result = await Effect.runPromiseExit(detectSubscriptionsEffect(request));

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
