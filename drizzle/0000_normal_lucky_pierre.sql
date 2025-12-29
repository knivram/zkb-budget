CREATE TABLE `subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`price` real NOT NULL,
	`billing_cycle` text NOT NULL,
	`created_at` integer NOT NULL,
	`url` text,
	`icon` text
);
