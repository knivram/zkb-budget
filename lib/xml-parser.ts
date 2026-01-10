import { NewTransaction, TRANSACTION_SUBTYPES } from '@/db/schema';
import { XMLParser } from 'fast-xml-parser';

export type ParsedTransaction = NewTransaction;

export const parseTransaction = (transaction: any): ParsedTransaction | null => {
  const statement = transaction.statement;
  if (
    !statement ||
    !TRANSACTION_SUBTYPES.includes(statement.transactionSubtype) ||
    statement.transactionType !== 'cash' ||
    statement.bookingType !== 'cash'
  ) {
    return null;
  }

  const amount = Math.round(Number(statement.amountInMaccCurrency) * 100);
  const signedAmount = amount * (statement.creditDebitIndicator === 'debit' ? -1 : 1);

  return {
    id: statement.transactionIdentification,
    statementType: statement.statementType,
    date: statement.valueDate,
    accountIBAN: statement.accountIdentification,
    amount,
    currency: statement.maccCurrency,
    creditDebitIndicator: statement.creditDebitIndicator,
    signedAmount,
    transactionAdditionalDetails: statement.transactionAdditionalDetails,
    transactionSubtype: statement.transactionSubtype,
  };
};

export const parseXMLTransactions = (xmlContent: string): ParsedTransaction[] => {
  const parser = new XMLParser();
  const jObj = parser.parse(xmlContent);
  const xmlTransactions = jObj.zkbDatasetNative.transactionList.transaction;

  // Ensure it's always an array (single transaction case)
  const transactionsArray = Array.isArray(xmlTransactions) ? xmlTransactions : [xmlTransactions];

  return transactionsArray.map(parseTransaction).filter((t): t is ParsedTransaction => t !== null);
};
