CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`statement_type` text NOT NULL,
	`date` text NOT NULL,
	`account_iban` text NOT NULL,
	`currency` text NOT NULL,
	`amount` real NOT NULL,
	`credit_debit_indicator` text NOT NULL,
	`signed_amount` real NOT NULL,
	`transaction_additional_details` text NOT NULL,
	`transaction_subtype` text NOT NULL,
	`created_at` integer NOT NULL
);
