CREATE TABLE `subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`price` integer NOT NULL,
	`billing_cycle` text NOT NULL,
	`subscribed_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`url` text,
	`icon` text
);
