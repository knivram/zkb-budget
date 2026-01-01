import { BILLING_CYCLES } from "@/db/schema";
import { z } from "zod";

export const detectedSubscriptionSchema = z.object({
  name: z
    .string()
    .describe("Subscription service name (e.g., 'Netflix', 'Spotify')"),
  subscribedAt: z
    .string()
    .describe("ISO 8601 date of first payment detected (e.g., '2024-01-15')"),
  price: z.number().positive().describe("Price in CHF"),
  domain: z
    .string()
    .optional()
    .describe("Domain of the service (e.g., 'netflix.com')"),
  billingCycle: z
    .enum(BILLING_CYCLES)
    .describe("Billing cycle: weekly, monthly, or yearly"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score from 0 to 1 indicating detection certainty"),
  reasoning: z
    .string()
    .optional()
    .describe(
      "Brief explanation of why this was detected as a subscription (helps user understand AI decision)"
    ),
});

export const subscriptionDetectionResponseSchema = z.object({
  subscriptions: z
    .array(detectedSubscriptionSchema)
    .describe(
      "Array of detected subscriptions with confidence scores and details"
    ),
});

export type DetectedSubscription = z.infer<typeof detectedSubscriptionSchema>;

export type SubscriptionDetectionResponse = z.infer<
  typeof subscriptionDetectionResponseSchema
>;
