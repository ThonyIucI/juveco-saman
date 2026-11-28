ALTER TABLE `users` RENAME COLUMN "last_name" TO "paternal_last_name";--> statement-breakpoint
CREATE TABLE `user_conditions` (
	`user_id` text NOT NULL,
	`condition` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`user_id`, `condition`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_conditions_condition_idx` ON `user_conditions` (`condition`);--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`document_number` text,
	`birth_date` text,
	`gender` text,
	`condition_note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_documentNumber_uidx` ON `user_profiles` (`document_number`);--> statement-breakpoint
ALTER TABLE `users` ADD `maternal_last_name` text;