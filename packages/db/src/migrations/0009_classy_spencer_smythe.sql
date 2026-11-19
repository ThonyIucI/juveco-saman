CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`start_date` text NOT NULL,
	`end_date` text,
	`goal_amount` real,
	`beneficiary_count` integer,
	`closed_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `activities` ADD `project_id` text REFERENCES projects(id);--> statement-breakpoint
CREATE INDEX `activities_projectId_idx` ON `activities` (`project_id`);