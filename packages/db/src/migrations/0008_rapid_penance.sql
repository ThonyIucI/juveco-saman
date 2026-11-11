ALTER TABLE `activity_items` ADD `voided_at` integer;--> statement-breakpoint
ALTER TABLE `activity_items` ADD `replaces_id` text REFERENCES activity_items(id);