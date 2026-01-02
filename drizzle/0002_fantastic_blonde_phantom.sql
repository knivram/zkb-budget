ALTER TABLE `subscriptions` RENAME COLUMN "url" TO "domain";--> statement-breakpoint
ALTER TABLE `subscriptions` DROP COLUMN `icon`;