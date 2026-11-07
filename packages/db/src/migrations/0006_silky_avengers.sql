CREATE TABLE `activity_expenses` (
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
CREATE INDEX `activity_expenses_activityId_idx` ON `activity_expenses` (`activity_id`);--> statement-breakpoint
CREATE TABLE `activity_prizes` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_id` text NOT NULL,
	`name` text NOT NULL,
	`origin` text NOT NULL,
	`donor_id` text,
	`cost` real,
	`note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`donor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `activity_prizes_activityId_idx` ON `activity_prizes` (`activity_id`);--> statement-breakpoint
CREATE INDEX `activity_prizes_donorId_idx` ON `activity_prizes` (`donor_id`);