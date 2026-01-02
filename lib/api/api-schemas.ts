import { subscriptions, transactions } from "@/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const transactionSchema = createSelectSchema(transactions, {
  // this is needed, because zod expects a date, but in json it is a string
  createdAt: z.string().pipe(z.coerce.date()),
});

// Request schema for detect-subscriptions endpoint
export const detectSubscriptionsRequestSchema = z.object({
  transactions: z.array(transactionSchema).min(1, {
    error: "At least one transaction is required",
  }),
});

// Subscription schema for AI consumption (simplified)
export const subscriptionForAISchema = createSelectSchema(subscriptions).pick({
  id: true,
  name: true,
  price: true,
  billingCycle: true,
});

export type SubscriptionForAI = z.infer<typeof subscriptionForAISchema>;

// Request schema for enrich-transactions endpoint
export const enrichTransactionsRequestSchema = z.object({
  transactions: z.array(transactionSchema).min(1, {
    error: "At least one transaction is required",
  }),
  subscriptions: z.array(subscriptionForAISchema),
});

export type EnrichTransactionsRequest = z.infer<
  typeof enrichTransactionsRequestSchema
>;
