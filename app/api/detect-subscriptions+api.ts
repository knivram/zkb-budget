import { subscriptionDetectionResponseSchema } from '@/lib/api/ai-schemas';
import { detectSubscriptionsRequestSchema } from '@/lib/api/api-schemas';
import { validateRequest } from '@/lib/api/api-validation';
import { SUBSCRIPTION_DETECTION } from '@/lib/api/promts';
import { convertTransactionsToToon } from '@/lib/toon-converter';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, Output } from 'ai';

export async function POST(request: Request): Promise<Response> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY is not set in environment variables');
    return Response.json({ error: 'Failed to detect subscriptions' }, { status: 500 });
  }
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  try {
    const validation = await validateRequest(request, detectSubscriptionsRequestSchema);
    if (!validation.success) {
      console.error('Validation failed:', validation.response);
      return validation.response;
    }
    const { transactions } = validation.data;

    const toonData = convertTransactionsToToon(transactions);

    const result = await generateText({
      model: openrouter.chat('google/gemini-3-flash-preview'),
      output: Output.object({
        schema: subscriptionDetectionResponseSchema,
      }),
      system: SUBSCRIPTION_DETECTION.system,
      prompt: SUBSCRIPTION_DETECTION.user(toonData),
    });

    return Response.json(result.output);
  } catch (error) {
    console.error('Subscription detection error:', error);
    return Response.json(
      {
        error: 'Failed to detect subscriptions',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
