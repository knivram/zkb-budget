import { Transaction } from '@/db/schema';
import { SubscriptionForAI } from '@/lib/api/api-schemas';
import { encode } from '@toon-format/toon';

/**
 * Converts an array of transactions to Toon format for AI processing.
 * Uses the official @toon-format/toon library for optimal token efficiency.
 *
 * Toon format is a compact, human-readable encoding of the JSON data model
 * that minimizes tokens for LLM input, reducing AI API costs by ~40%.
 *
 * @param transactions - Array of transaction objects from the database
 * @returns Toon-formatted string representation of the transactions
 */
export function convertTransactionsToToon(transactions: Transaction[]): string {
  if (transactions.length === 0) {
    return encode({ transactions: [] });
  }

  const relevantData = transactions.map((t) => ({
    id: t.id,
    statementType: t.statementType,
    date: t.date,
    currency: t.currency,
    amount: t.amount,
    creditDebitIndicator: t.creditDebitIndicator,
    signedAmount: t.signedAmount,
    transactionAdditionalDetails: t.transactionAdditionalDetails,
    transactionSubtype: t.transactionSubtype,
  }));

  return encode({ transactions: relevantData });
}

/**
 * Converts an array of subscriptions to Toon format for AI processing.
 * Includes only the fields needed for transaction-to-subscription matching.
 *
 * @param subscriptions - Array of subscription objects with id, name, price, and billingCycle
 * @returns Toon-formatted string representation of the subscriptions
 */
export function convertSubscriptionsToToon(subscriptions: SubscriptionForAI[]): string {
  if (subscriptions.length === 0) {
    return encode({ subscriptions: [] });
  }

  const relevantData = subscriptions.map((s) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    billingCycle: s.billingCycle,
  }));

  return encode({ subscriptions: relevantData });
}
