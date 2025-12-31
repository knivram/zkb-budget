### Instructions
You will be given a chunk of transactions structured in the toom format. Your task is it, to pars through this data and find all subscriptions the user has based on the transactions. For those subscriptions, you need to specify the following things:

subscription name
date of the first payment occurrence
price of the subscription
domain of the subscription service (e.g. netflix.com)
the rate in which subscriptions are getting paid; ether weekly, monthly or yearly
confidence count (0...1)

### Data
```toom

```


A big change is comming. I want to add a new feature, called transactions. With this he has a screen, that shoes all transactions the user has. For this we need a few things.
  - first we need a new tab. the current called Home should be renamed to subscriptions. The new will be called transactions.
  - we need a new table in the database. this table transactions will have the following fileds for now:
     ```ts
     export type ParsedTransaction = {
        id: string;
        statementType: string;
        date: string;
        accountIBAN: string;
        currency: string;
        amount: number;
        creditDebitIndicator: "debit" | "credit";
        signedAmount: number;
        transactionAdditionalDetails: string;
        transactionSubtype: "inflowOutflowDigital"|"inflowOutflowPhysical";
    };
    ```
In a next step, you need to build a simple import feature. In that the user can import an xml file from his bank. The xml mapping to the above fileds was already created:
```ts
const TRANSACTION_SUBTYPES = [
  "inflowOutflowDigital",
  "inflowOutflowPhysical",
] as const;

export const parseTransaction = (
  transaction: any
): ParsedTransaction | null => {
  const statement = transaction.statement;
  if (
    !statement ||
    !TRANSACTION_SUBTYPES.includes(statement.transactionSubtype) ||
    statement.transactionType !== "cash" ||
    statement.bookingType !== "cash"
  ) {
    return null;
  }

  return {
    id: statement.transactionIdentification,
    statementType: statement.statementType,
    date: statement.bookingDate,
    accountIBAN: statement.accountIdentification,
    amount: statement.amountInMaccCurrency,
    currency: statement.maccCurrency,
    creditDebitIndicator: statement.creditDebitIndicator,
    signedAmount:
      statement.amountInMaccCurrency *
      (statement.creditDebitIndicator === "debit" ? -1 : 1),
    transactionAdditionalDetails: statement.transactionAdditionalDetails,
    transactionSubtype: statement.transactionSubtype,
  };
};
```
For the xml parsing, you should use the library fast-xml-parser. The import button should be on the same position as the add subscription button is but of course on the transactions tab. Also the screen should show a list off all `transactionAdditionalDetails` unstyled.
Lets create a plan for this.