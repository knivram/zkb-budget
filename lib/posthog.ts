import type { LanguageModelV2, LanguageModelV3 } from '@ai-sdk/provider';
import { withTracing } from '@posthog/ai';
import { PostHog } from 'posthog-node';

type LanguageModel = LanguageModelV2 | LanguageModelV3;

let posthogClient: PostHog | null = null;

function getPostHogClient(): PostHog | null {
  if (!process.env.POSTHOG_API_KEY || !process.env.POSTHOG_HOST) {
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.POSTHOG_HOST,
    });
  }

  return posthogClient;
}

export interface TracingOptions {
  distinctId?: string;
  properties?: Record<string, unknown>;
}

/**
 * Wraps an AI model with PostHog tracing for analytics.
 * If PostHog is not configured, returns the original model unchanged.
 */
export function wrapModelWithTracing<T extends LanguageModel>(
  model: T,
  spanName: string,
  options: TracingOptions = {}
): T {
  const client = getPostHogClient();

  if (!client) {
    return model;
  }

  return withTracing(model, client, {
    posthogDistinctId: options.distinctId ?? 'server',
    posthogProperties: {
      $ai_span_name: spanName,
      ...options.properties,
    },
  });
}

/**
 * Shuts down the PostHog client gracefully.
 * Call this when the server is shutting down.
 */
export async function shutdownPostHog(): Promise<void> {
  if (posthogClient) {
    await posthogClient.shutdown();
    posthogClient = null;
  }
}
