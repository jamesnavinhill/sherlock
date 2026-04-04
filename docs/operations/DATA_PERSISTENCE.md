# Data Persistence

Sherlock persists workspace and artifact data locally in the browser using SQLite (wa-sqlite) backed by IndexedDB.

## Storage Engine

- SQLite runtime: `wa-sqlite`
- VFS: `IDBBatchAtomicVFS`
- Database file name: `sherlock-v1.sqlite`
- init entry point: `src/services/db/client.ts`

## Schema Tables

Defined in `src/services/db/schema.ts`:

- `scopes`
- `cases`
- `reports`
- `artifact_sections`
- `entities`
- `sources`
- `leads` (headline storage)
- `tasks`
- `chat_sessions`
- `chat_messages`
- `chat_message_attachments`
- `chat_actions`
- `settings`
- `templates`
- `manual_nodes`
- `manual_links`

## Repositories

Persistence is routed through repository classes:

- `CaseRepository`
- `TaskRepository`
- `ScopeRepository`
- `TemplateRepository`
- `ManualDataRepository`
- `SettingsRepository`
- `ChatRepository`
- `WorkspaceSearchRepository`

## Current Runtime Model

Runtime code now treats persisted records as:

- `Workspace` -> stored in `cases`
- `Artifact` -> stored in `reports` plus `artifact_sections`, `entities`, and `sources`
- `WorkspaceRun` -> stored in `tasks`

The table names remain for persistence continuity, but the primary runtime model is canonical workspace terminology.

Finder/Feed discovery results are transient runtime state in the store and are not persisted as a separate SQLite table.

`cases` can now store workspace-oriented metadata:

- `mode`
- `pack_id`
- `purpose_id`
- `label_profile_id`
- `metadata_json`

`reports` can now store artifact-oriented metadata:

- `artifact_type`
- `pack_id`
- `purpose_id`
- `label_profile_id`
- `metadata_json`

`tasks` can now store:

- `pack_id`
- `purpose_id`
- `artifact_type`
- `label_profile_id`

`artifact_sections` persists typed section rows for richer artifacts while legacy `summary`, `agendas`, and `leads` fields remain available for compatibility. Section ids are unique within a report, and the table uses a composite primary key of `report_id + id` so repeated section labels from different artifacts do not collide.

The chat implementation adds:

- `chat_sessions` for workspace-bound conversation metadata and model snapshots
- `chat_messages` for persisted transcript turns and citation metadata
- `chat_message_attachments` for retrieved context snippets attached to a turn
- `chat_actions` for auditable retrieval, save, append, and follow-up operations

Stream 3 and 4 behavior built on that model:

- streaming assistant text is transient UI state, while final message state persists back into `chat_messages`
- cancelled turns persist with final message status rather than leaving orphaned partial rows
- guided run mode persists its draft step state in `chat_sessions.metadata_json`
- guided run saves reuse the existing `reports` and `artifact_sections` tables rather than introducing a parallel draft store

## Legacy Migration

On startup, store initialization runs:

1. `initDB()`
2. `migrateLocalStorageToSqlite()`

Migration source:

- legacy Zustand payload key: `sherlock-storage`

Migration completion marker:

- settings key: `migration_v1_complete = true`

Existing local databases are upgraded additively in `src/services/db/client.ts`, including an in-place rebuild of legacy `artifact_sections` tables that still enforce a global primary key on `id`.

## Remaining localStorage Usage

Some non-tabular values are still stored directly in localStorage:

- provider keys (for selected providers)
- `sherlock_config` (system config object)
- `sherlock_livestream_autosave`
- `sherlock_active_workspace_id` (archive selection hint)
- `sherlock_demo_seed_v1_applied` (one-time demo workspace bootstrap marker)

## Backup/Restore

User-facing maintenance tools in Settings:

- export workspace-data JSON snapshot
- import JSON snapshot (replaces current workspace-data domain)
- clear workspace-data domain

Canonical exported shape:

- `workspaces`
- `artifacts`
- `runs`
- `chat`
- `signals`
- `graph`
- `templates`
- `metadata`

Workspace-data backups include:

- workspaces (`cases`)
- artifacts (`reports`, `artifact_sections`, `entities`, `sources`)
- runs (`tasks`)
- chat sessions, messages, attachments, and actions
- saved signals/headlines (`leads`)
- manual graph nodes and links
- templates
- Timeline snapshots saved from `TimelineView` reuse the normal artifact path and persist as `artifactType: TIMELINE` inside `reports`/`artifact_sections`

Workspace-data backups intentionally exclude:

- theme mode and theme surface settings
- provider/model defaults
- API keys
- quiet mode and other device-local preferences

## Hosting Implications

- Workspace data is scoped to the current browser origin, so local data on a Vercel preview URL is separate from local data on the production domain.
- Redeploying the same production domain does not clear IndexedDB or localStorage by itself.
- Clearing browser storage removes the local SQLite database and any browser-stored API keys.
- The current runtime is browser-local only: there is no shared server database, automatic cross-device sync, or multi-user persistence layer.
- If `public/seeds/demo-workspace.json` is present, Sherlock will auto-import it once for a browser profile whose workspace-data domain is still empty.
- The seed file may be either a canonical workspace-data backup or a simpler workspace export JSON with top-level `case` and `reports` keys.
- The demo bootstrap is device-local and origin-local. Updating the JSON file affects only browsers that have not already applied the seed marker.

Maintenance cleanup behavior:

- importing workspace data clears the current workspace-data domain first, then restores the backup payload
- deleting a workspace removes workspace-linked chat sessions and saved signals, while artifacts are unassigned rather than purged
- purging a workspace removes the workspace, its artifacts, saved signals, linked chat history, linked run rows, and directly linked manual graph references
- clearing workspace data removes all persisted workspace-domain records and resets graph hide/flag filters that only reference workspace data

See `src/components/features/Settings/index.tsx`, `src/store/caseStore.ts`, and `src/services/maintenance/workspaceData.ts` for the implemented flow.
