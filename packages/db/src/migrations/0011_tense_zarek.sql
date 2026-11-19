CREATE TABLE `activity_team_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`amount` real NOT NULL,
	`method` text NOT NULL,
	`collector_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `activity_teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`collector_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `activity_team_payments_teamId_idx` ON `activity_team_payments` (`team_id`);--> statement-breakpoint
CREATE TABLE `activity_team_players` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `activity_teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activity_team_players_teamId_userId_uidx` ON `activity_team_players` (`team_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `activity_team_players_userId_idx` ON `activity_team_players` (`user_id`);--> statement-breakpoint
CREATE TABLE `activity_teams` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_id` text NOT NULL,
	`name` text NOT NULL,
	`delegate_id` text NOT NULL,
	`price` real NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`delegate_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `activity_teams_activityId_idx` ON `activity_teams` (`activity_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `activity_teams_activityId_name_uidx` ON `activity_teams` (`activity_id`,lower("name"));