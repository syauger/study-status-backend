ALTER TABLE `locations` ADD `hours` text;--> statement-breakpoint
ALTER TABLE `locations` ADD `noise_level` text DEFAULT 'unknown' NOT NULL;