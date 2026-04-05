export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "cases" (
	"id" text PRIMARY KEY NOT NULL,
	"scope_id" text,
	"title" text NOT NULL,
	"status" text NOT NULL,
	"date_opened" text NOT NULL,
	"description" text,
	"mode" text,
	"pack_id" text,
	"purpose_id" text,
	"label_profile_id" text,
	"metadata_json" text,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL,
	FOREIGN KEY ("scope_id") REFERENCES "scopes"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "artifact_sections" (
	"id" text NOT NULL,
	"report_id" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"items_json" text,
	"sort_order" integer NOT NULL,
	PRIMARY KEY ("report_id", "id"),
	FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "artifact_evidence" (
	"id" text NOT NULL,
	"report_id" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"quote" text,
	"source_title" text,
	"source_url" text,
	"section_id" text,
	"tags_json" text,
	"metadata_json" text,
	"sort_order" integer NOT NULL,
	PRIMARY KEY ("report_id", "id"),
	FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entities" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"role" text,
	"sentiment" text,
	FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text,
	"content" text NOT NULL,
	"source" text,
	"type" text,
	"url" text,
	"status" text NOT NULL,
	"threat_level" text,
	"linked_report_id" text,
	"timestamp" text,
	FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text,
	"topic" text NOT NULL,
	"date_str" text,
	"summary" text,
	"raw_text" text,
	"artifact_type" text,
	"pack_id" text,
	"purpose_id" text,
	"label_profile_id" text,
	"metadata_json" text,
	"config_json" text,
	"created_at" integer NOT NULL,
	FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scopes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'custom',
	"config_json" text NOT NULL,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text,
	"title" text NOT NULL,
	"url" text NOT NULL,
	FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text,
	"topic" text NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"pack_id" text,
	"purpose_id" text,
	"artifact_type" text,
	"label_profile_id" text,
	"config_json" text,
	"start_time" integer,
	"end_time" integer,
	FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"title" text NOT NULL,
	"status" text NOT NULL,
	"source_report_id" text,
	"pack_id" text,
	"purpose_id" text,
	"provider" text,
	"model_id" text,
	"metadata_json" text,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL,
	FOREIGN KEY ("workspace_id") REFERENCES "cases"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("source_report_id") REFERENCES "reports"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"status" text NOT NULL,
	"citations_json" text,
	"metadata_json" text,
	"error" text,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL,
	FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_message_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"ref_id" text,
	"ref_kind" text,
	"snippet" text,
	"metadata_json" text,
	"created_at" integer NOT NULL,
	FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"message_id" text,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"input_json" text,
	"result_json" text,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL,
	FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"topic" text NOT NULL,
	"config_json" text NOT NULL,
	"created_at" integer NOT NULL,
	"scope_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspace_items" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"text_content" text,
	"url" text,
	"mime_type" text,
	"file_name" text,
	"size_bytes" integer,
	"preview_url" text,
	"tags_json" text,
	"provenance_json" text,
	"metadata_json" text,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL,
	FOREIGN KEY ("workspace_id") REFERENCES "cases"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspace_boards" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer NOT NULL,
	"presentation_mode" integer DEFAULT 0 NOT NULL,
	"metadata_json" text,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL,
	FOREIGN KEY ("workspace_id") REFERENCES "cases"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspace_board_documents" (
	"board_id" text PRIMARY KEY NOT NULL,
	"snapshot_json" text,
	"updated_at" integer NOT NULL,
	FOREIGN KEY ("board_id") REFERENCES "workspace_boards"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "board_agent_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"board_id" text NOT NULL,
	"title" text NOT NULL,
	"status" text NOT NULL,
	"request" text NOT NULL,
	"request_state" text NOT NULL,
	"provider" text,
	"model_id" text,
	"context_snapshot_id" text,
	"last_error" text,
	"metadata_json" text,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL,
	"started_at" integer,
	"completed_at" integer,
	FOREIGN KEY ("workspace_id") REFERENCES "cases"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("board_id") REFERENCES "workspace_boards"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "board_agent_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"board_id" text NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"input_json" text,
	"normalized_input_json" text,
	"result_json" text,
	"affected_canonical_ids_json" text,
	"affected_board_shape_ids_json" text,
	"error" text,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL,
	FOREIGN KEY ("session_id") REFERENCES "board_agent_sessions"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("workspace_id") REFERENCES "cases"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("board_id") REFERENCES "workspace_boards"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "manual_nodes" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"type" text NOT NULL,
	"subtype" text,
	"timestamp" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "manual_links" (
	"source" text NOT NULL,
	"target" text NOT NULL,
	"timestamp" integer NOT NULL,
	PRIMARY KEY("source", "target")
);
`;
