export const SCHEMA_SQL = String.raw`
CREATE TABLE IF NOT EXISTS \`cases\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`scope_id\` text,
	\`title\` text NOT NULL,
	\`status\` text NOT NULL,
	\`date_opened\` text NOT NULL,
	\`description\` text,
	\`created_at\` integer NOT NULL,
	\`updated_at\` integer NOT NULL,
	FOREIGN KEY (\`scope_id\`) REFERENCES \`scopes\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`entities\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`report_id\` text,
	\`name\` text NOT NULL,
	\`type\` text NOT NULL,
	\`role\` text,
	\`sentiment\` text,
	FOREIGN KEY (\`report_id\`) REFERENCES \`reports\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`feed_items\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`title\` text NOT NULL,
	\`category\` text NOT NULL,
	\`content\` text,
	\`url\` text,
	\`risk_level\` text DEFAULT 'LOW',
	\`timestamp\` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`leads\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`case_id\` text,
	\`content\` text NOT NULL,
	\`source\` text,
	\`status\` text NOT NULL,
	\`threat_level\` text,
	\`linked_report_id\` text,
	\`timestamp\` text,
	FOREIGN KEY (\`case_id\`) REFERENCES \`cases\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`reports\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`case_id\` text,
	\`topic\` text NOT NULL,
	\`date_str\` text,
	\`summary\` text,
	\`raw_text\` text,
	\`parent_topic\` text,
	\`config_json\` text,
	\`created_at\` integer NOT NULL,
	FOREIGN KEY (\`case_id\`) REFERENCES \`cases\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`scopes\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`description\` text,
	\`type\` text DEFAULT 'custom',
	\`config_json\` text NOT NULL,
	\`created_at\` integer NOT NULL,
	\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`settings\` (
	\`key\` text PRIMARY KEY NOT NULL,
	\`value\` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`sources\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`report_id\` text,
	\`title\` text NOT NULL,
	\`url\` text NOT NULL,
	FOREIGN KEY (\`report_id\`) REFERENCES \`reports\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`tasks\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`case_id\` text,
	\`topic\` text NOT NULL,
	\`status\` text NOT NULL,
	\`error\` text,
	\`config_json\` text,
	\`start_time\` integer,
	\`end_time\` integer,
	FOREIGN KEY (\`case_id\`) REFERENCES \`cases\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`templates\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`description\` text,
	\`topic\` text NOT NULL,
	\`config_json\` text NOT NULL,
	\`created_at\` integer NOT NULL,
	\`scope_id\` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`manual_nodes\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`label\` text NOT NULL,
	\`type\` text NOT NULL,
	\`subtype\` text,
	\`timestamp\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`manual_links\` (
	\`source\` text NOT NULL,
	\`target\` text NOT NULL,
	\`timestamp\` integer NOT NULL,
	PRIMARY KEY(\`source\`, \`target\`)
);
`;
