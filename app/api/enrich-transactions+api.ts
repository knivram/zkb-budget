import { transactionEnrichmentResponseSchema } from "@/lib/api/ai-schemas";
import { enrichTransactionsRequestSchema } from "@/lib/api/api-schemas";
import { validateRequest } from "@/lib/api/api-validation";
import { TRANSACTION_ENRICHMENT } from "@/lib/api/promts";
import {
  convertSubscriptionsToToon,
  convertTransactionsToToon,
} from "@/lib/toon-converter";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, Output } from "ai";

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

    return Response.json(result.output);
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
