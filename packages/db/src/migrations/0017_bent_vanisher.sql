CREATE TABLE `dwellings` (
	`id` text PRIMARY KEY NOT NULL,
	`neighborhood_id` text NOT NULL,
	`meter_number` text,
	`local_sequence` integer NOT NULL,
	`latitude` real,
	`longitude` real,
	`maps_url` text,
	`status` text DEFAULT 'NONE' NOT NULL,
	`wall_material` text,
	`photos_url` text,
	`observation` text,
	`note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`neighborhood_id`) REFERENCES `neighborhoods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dwellings_neighborhoodId_localSequence_uidx` ON `dwellings` (`neighborhood_id`,`local_sequence`);--> statement-breakpoint
CREATE INDEX `dwellings_meterNumber_idx` ON `dwellings` (`meter_number`);--> statement-breakpoint
CREATE INDEX `dwellings_status_idx` ON `dwellings` (`status`);--> statement-breakpoint
CREATE TABLE `families` (
	`id` text PRIMARY KEY NOT NULL,
	`dwelling_id` text NOT NULL,
	`contact_name` text,
	`contact_country_prefix` text,
	`contact_phone` text,
	`note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`dwelling_id`) REFERENCES `dwellings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `families_dwellingId_idx` ON `families` (`dwelling_id`);--> statement-breakpoint
CREATE TABLE `family_members` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`user_id` text NOT NULL,
	`relationship` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `family_members_userId_uidx` ON `family_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `family_members_familyId_idx` ON `family_members` (`family_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `family_members_familyId_head_uidx` ON `family_members` (`family_id`) WHERE "family_members"."relationship" = 'HEAD';