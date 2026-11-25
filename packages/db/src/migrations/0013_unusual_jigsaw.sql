CREATE TABLE `activity_incomes` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_id` text NOT NULL,
	`concept` text NOT NULL,
	`amount` real NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `activity_incomes_activityId_idx` ON `activity_incomes` (`activity_id`);--> statement-breakpoint
ALTER TABLE `activity_prizes` ADD `winning_item_id` text REFERENCES activity_items(id);