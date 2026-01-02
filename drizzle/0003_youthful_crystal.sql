ALTER TABLE `transactions` ADD `category` text DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `display_name` text;--> statement-breakpoint
ALTER TABLE `transactions` ADD `domain` text;--> statement-breakpoint
ALTER TABLE `transactions` ADD `subscription_id` integer REFERENCES subscriptions(id);