CREATE TABLE `activity_item_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`amount` real NOT NULL,
	`method` text NOT NULL,
	`collector_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `activity_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`collector_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `activity_item_payments_itemId_idx` ON `activity_item_payments` (`item_id`);