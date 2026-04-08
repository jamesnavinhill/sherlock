CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`scope_id` text,
	`title` text NOT NULL,
	`status` text NOT NULL,
	`date_opened` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`scope_id`) REFERENCES `scopes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `entities` (
	`id` text PRIMARY KEY NOT NULL,
	`artifact_id` text,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`role` text,
	`sentiment` text,
	FOREIGN KEY (`artifact_id`) REFERENCES `artifacts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `signals` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text,
	`content` text NOT NULL,
	`source` text,
	`type` text,
	`url` text,
	`status` text NOT NULL,
	`threat_level` text,
	`linked_artifact_id` text,
	`timestamp` text,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `artifacts` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text,
	`topic` text NOT NULL,
	`date_str` text,
	`summary` text,
	`raw_text` text,
	`config_json` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scopes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text DEFAULT 'custom',
	`config_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`artifact_id` text,
	`title` text NOT NULL,
	`url` text NOT NULL,
	FOREIGN KEY (`artifact_id`) REFERENCES `artifacts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workspace_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text,
	`topic` text NOT NULL,
	`status` text NOT NULL,
	`error` text,
	`config_json` text,
	`start_time` integer,
	`end_time` integer,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
