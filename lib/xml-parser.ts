import { Effect, Either } from "effect";
import { NewTransaction, TRANSACTION_SUBTYPES } from "@/db/schema";
import { XmlParseError } from "@/lib/errors";
import { XMLParser } from "fast-xml-parser";

export type ParsedTransaction = NewTransaction;

/**
 * Result of parsing a single transaction.
 * Either a successfully parsed transaction or an error explaining why it failed.
 */
export type TransactionParseResult = Either.Either<
  ParsedTransaction,
  XmlParseError
>;

/**
 * Parse a single transaction from XML data.
 * Returns an Effect that fails with a typed XmlParseError if validation fails.
 */
export const parseTransaction = (
  transaction: unknown
): Effect.Effect<ParsedTransaction, XmlParseError> =>
  Effect.gen(function* () {
    // Type guard for accessing properties safely
    const txn = transaction as Record<string, unknown> | null | undefined;
    const statement = txn?.statement as Record<string, unknown> | null | undefined;

    // Validate statement exists
    if (!statement) {
      return yield* Effect.fail(
        new XmlParseError({ reason: "missing_statement" })
      );
    }

    // Validate transaction subtype
    const subtype = statement.transactionSubtype as string;
    if (!TRANSACTION_SUBTYPES.includes(subtype as typeof TRANSACTION_SUBTYPES[number])) {
      return yield* Effect.fail(
        new XmlParseError({
          reason: "invalid_transaction_subtype",
          details: `Got: ${subtype}`,
        })
      );
    }

    // Validate transaction type
    if (statement.transactionType !== "cash") {
      return yield* Effect.fail(
        new XmlParseError({
          reason: "invalid_transaction_type",
          details: `Got: ${statement.transactionType}`,
        })
      );
    }

    // Validate booking type
    if (statement.bookingType !== "cash") {
      return yield* Effect.fail(
        new XmlParseError({
          reason: "invalid_booking_type",
          details: `Got: ${statement.bookingType}`,
        })
      );
    }

    // Parse amount (stored in cents)
    const amount = Math.round(Number(statement.amountInMaccCurrency) * 100);
    const signedAmount =
      amount * (statement.creditDebitIndicator === "debit" ? -1 : 1);

    return {
      id: statement.transactionIdentification as string,
      statementType: statement.statementType as string,
      date: statement.valueDate as string,
      accountIBAN: statement.accountIdentification as string,
      amount,
      currency: statement.maccCurrency as string,
      creditDebitIndicator: statement.creditDebitIndicator as "debit" | "credit",
      signedAmount,
      transactionAdditionalDetails: statement.transactionAdditionalDetails as string,
      transactionSubtype: subtype as typeof TRANSACTION_SUBTYPES[number],
    };
  });

/**
 * Try to parse a transaction, returning Either instead of failing.
 * This allows collecting both successes and failures.
 */
export const tryParseTransaction = (
  transaction: unknown
): Effect.Effect<TransactionParseResult> =>
  parseTransaction(transaction).pipe(Effect.either);

/**
 * Parse XML content and extract transactions.
 * Returns an Effect that fails with XmlParseError if the XML structure is invalid.
 */
export const parseXMLContent = (
  xmlContent: string
): Effect.Effect<unknown[], XmlParseError> =>
  Effect.try({
    try: () => {
      const parser = new XMLParser();
      const jObj = parser.parse(xmlContent);
      const xmlTransactions =
        jObj?.zkbDatasetNative?.transactionList?.transaction;

      if (!xmlTransactions) {
        throw new Error("No transaction list found");
      }

      // Ensure it's always an array (single transaction case)
      return Array.isArray(xmlTransactions)
        ? xmlTransactions
        : [xmlTransactions];
    },
    catch: (error) =>
      new XmlParseError({
        reason:
          error instanceof Error &&
          error.message === "No transaction list found"
            ? "missing_transaction_list"
            : "invalid_xml",
        details: error instanceof Error ? error.message : String(error),
      }),
  });

/**
 * Parse XML transactions, returning all valid transactions.
 * Invalid transactions are silently filtered (use parseXMLTransactionsWithErrors for detailed results).
 *
 * This is a synchronous function for backward compatibility with existing code.
 */
export const parseXMLTransactions = (
  xmlContent: string
): ParsedTransaction[] => {
  const result = Effect.runSync(
    Effect.gen(function* () {
      const rawTransactions = yield* parseXMLContent(xmlContent).pipe(
        Effect.catchAll(() => Effect.succeed([] as unknown[]))
      );

      const results = yield* Effect.forEach(rawTransactions, tryParseTransaction);

      // Filter to only successful parses
      return results
        .filter((r): r is Either.Right<XmlParseError, ParsedTransaction> =>
          Either.isRight(r)
        )
        .map((r) => r.right);
    })
  );

  return result;
};

/**
 * Parse XML transactions with detailed error reporting.
 * Returns both successfully parsed transactions and parse errors.
 */
export const parseXMLTransactionsWithErrors = (
  xmlContent: string
): Effect.Effect<
  { transactions: ParsedTransaction[]; errors: XmlParseError[] },
  XmlParseError
> =>
  Effect.gen(function* () {
    const rawTransactions = yield* parseXMLContent(xmlContent);

    const results = yield* Effect.forEach(rawTransactions, tryParseTransaction);

    const transactions: ParsedTransaction[] = [];
    const errors: XmlParseError[] = [];

    for (const result of results) {
      if (Either.isRight(result)) {
        transactions.push(result.right);
      } else {
        errors.push(result.left);
      }
    }

    return { transactions, errors };
  });
