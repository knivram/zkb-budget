import {
  EnrichedTransaction,
  transactionEnrichmentResponseSchema,
} from "@/lib/api/ai-schemas";
import {
  enrichTransactionsRequestSchema,
  SubscriptionForAI,
  Transaction,
} from "@/lib/api/api-schemas";
import { validateRequest } from "@/lib/api/api-validation";
import { TRANSACTION_ENRICHMENT } from "@/lib/api/promts";
import {
  convertSubscriptionsToToon,
  convertTransactionsToToon,
} from "@/lib/toon-converter";
import { chunkArray } from "@/lib/utils";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, Output } from "ai";

const BATCH_SIZE = 50;

async function processBatch(
  transactions: Transaction[],
  subscriptions: SubscriptionForAI[],
  openrouter: ReturnType<typeof createOpenRouter>
): Promise<EnrichedTransaction[]> {
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
}

async function processWithRetry(
  transactions: Transaction[],
  subscriptions: SubscriptionForAI[],
  openrouter: ReturnType<typeof createOpenRouter>
): Promise<EnrichedTransaction[]> {
  try {
    return await processBatch(transactions, subscriptions, openrouter);
  } catch (error) {
    console.warn(
      `Batch of ${transactions.length} transactions failed, retrying...`,
      error
    );
    return await processBatch(transactions, subscriptions, openrouter);
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY is not set in environment variables");
    return Response.json(
      { error: "Failed to enrich transactions" },
      { status: 500 }
    );
  }
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  try {
    const validation = await validateRequest(
      request,
      enrichTransactionsRequestSchema
    );
    if (!validation.success) {
      console.error("Validation failed:", validation.response);
      return validation.response;
    }
    const { transactions, subscriptions } = validation.data;

    const batches = chunkArray(transactions, BATCH_SIZE);

    const results = await Promise.allSettled(
      batches.map((batch) => processWithRetry(batch, subscriptions, openrouter))
    );

    const enrichedTransactions = results
      .filter(
        (r): r is PromiseFulfilledResult<EnrichedTransaction[]> =>
          r.status === "fulfilled"
      )
      .flatMap((r) => r.value);

    const failedCount = results.filter((r) => r.status === "rejected").length;
    if (failedCount > 0) {
      console.warn(
        `${failedCount}/${batches.length} batches failed after retry`
      );
    }

    return Response.json({ transactions: enrichedTransactions });
  } catch (error) {
    console.error("Transaction enrichment error:", error);
    return Response.json(
      {
        error: "Failed to enrich transactions",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
