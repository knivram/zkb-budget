import { transactions } from "@/db/schema";
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
