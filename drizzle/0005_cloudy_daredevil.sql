PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`statement_type` text NOT NULL,
	`date` text NOT NULL,
	`account_iban` text NOT NULL,
	`currency` text NOT NULL,
	`amount` integer NOT NULL,
	`credit_debit_indicator` text NOT NULL,
	`signed_amount` integer NOT NULL,
	`transaction_additional_details` text NOT NULL,
	`transaction_subtype` text NOT NULL,
	`created_at` integer NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	`display_name` text,
	`domain` text,
	`subscription_id` integer,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "statement_type", "date", "account_iban", "currency", "amount", "credit_debit_indicator", "signed_amount", "transaction_additional_details", "transaction_subtype", "created_at", "category", "display_name", "domain", "subscription_id") SELECT "id", "statement_type", "date", "account_iban", "currency", "amount", "credit_debit_indicator", "signed_amount", "transaction_additional_details", "transaction_subtype", "created_at", "category", "display_name", "domain", "subscription_id" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;