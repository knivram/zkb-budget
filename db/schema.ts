import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const BILLING_CYCLES = ["weekly", "monthly", "yearly"] as const;
export const TRANSACTION_SUBTYPES = [
  "inflowOutflowDigital",
  "inflowOutflowPhysical",
] as const;
export const CREDIT_DEBIT_INDICATORS = ["debit", "credit"] as const;

export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  price: integer("price").notNull(), // in cents
  billingCycle: text("billing_cycle", {
    enum: BILLING_CYCLES,
  }).notNull(),
  subscribedAt: integer("subscribed_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  domain: text("domain"),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const CATEGORIES = [
  "income",
  "transfer",
  "housing",
  "food",
  "transport",
  "utilities",
  "healthcare",
  "dining",
  "shopping",
  "entertainment",
  "personal_care",
  "other",
] as const;

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  statementType: text("statement_type").notNull(),
  date: text("date").notNull(),
  accountIBAN: text("account_iban").notNull(),
  currency: text("currency").notNull(),
  amount: integer("amount").notNull(),
  creditDebitIndicator: text("credit_debit_indicator", {
    enum: CREDIT_DEBIT_INDICATORS,
  }).notNull(),
  signedAmount: integer("signed_amount").notNull(),
  transactionAdditionalDetails: text(
    "transaction_additional_details"
  ).notNull(),
  transactionSubtype: text("transaction_subtype", {
    enum: TRANSACTION_SUBTYPES,
  }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  category: text("category", {
    enum: CATEGORIES,
  })
    .notNull()
    .default("other"),
  displayName: text("display_name"),
  domain: text("domain"),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id, { onDelete: 'set null' }),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type TransactionSubtype = (typeof TRANSACTION_SUBTYPES)[number];
export type CreditDebitIndicator = (typeof CREDIT_DEBIT_INDICATORS)[number];
export type Category = (typeof CATEGORIES)[number];
