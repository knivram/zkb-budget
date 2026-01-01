import { Transaction } from "@/db/schema";
import { encode } from "@toon-format/toon";

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
