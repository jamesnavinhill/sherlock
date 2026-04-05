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
- `follow_ups`
- `artifact_sections`
- `artifact_evidence`
- `entities`
- `sources`
- `leads` (legacy table name for saved signal storage)
- `tasks`
- `chat_sessions`
- `chat_messages`
- `chat_message_attachments`
- `chat_actions`
- `settings`
- `templates`
- `workspace_items`
- `workspace_boards`
- `workspace_board_documents`
- `board_agent_sessions`
- `board_agent_actions`
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
- `BoardAgentRepository`
- `WorkspaceSearchRepository`
- `WorkspaceItemRepository`
- `WorkspaceBoardRepository`

## Current Runtime Model

Runtime code now treats persisted records as:

- `Workspace` -> stored in `cases`
- `Artifact` -> stored in `reports` plus `follow_ups`, `artifact_sections`, `artifact_evidence`, `entities`, and `sources`
- `WorkspaceRun` -> stored in `tasks`
- `Signal` -> stored in `leads`
- `FollowUp` -> stored in `follow_ups`
- `WorkspaceItem` -> stored in `workspace_items`
- `WorkspaceBoard` and `WorkspaceBoardDocument` -> stored in `workspace_boards` and `workspace_board_documents`
- `BoardAgentSession` and `BoardAgentAction` -> stored in `board_agent_sessions` and `board_agent_actions`

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
- `config_json`

`reports.metadata_json` may now include persisted artifact provenance metadata, while `Artifact.metadata` in runtime code remains reserved for non-provenance metadata.

`tasks` can now store:

- `pack_id`
- `purpose_id`
- `artifact_type`
- `label_profile_id`

`follow_ups` persists first-class actionable records linked to their origin artifact, optional originating section, optional source signal, entity/source references, and resolution metadata. Follow-up lineage can now connect `Signal -> Run -> Artifact -> FollowUp -> Run -> Artifact` without relying only on compatibility arrays.

`artifact_sections` persists typed section rows for richer artifacts while legacy `summary`, `agendas`, and `leads` fields remain available for compatibility. Section ids are unique within a report, and the table uses a composite primary key of `report_id + id` so repeated section labels from different artifacts do not collide.

`artifact_evidence` persists first-class evidence rows with:

- `report_id`
- `id`
- `kind`
- `title`
- `summary`
- `quote`
- `source_title`
- `source_url`

These evidence rows are also indexed into workspace search context bundles so chat and retrieval flows can surface evidence-native snippets instead of relying only on section text.

The chat implementation adds:

- `chat_sessions` for workspace-bound conversation metadata and model snapshots
- `chat_messages` for persisted transcript turns and citation metadata
- `chat_message_attachments` for retrieved context snippets attached to a turn
- `chat_actions` for auditable retrieval, save, append, and follow-up operations

Artifact save/hydration behavior now treats `Artifact.followUps` as the canonical runtime field. Legacy flattened `leads` arrays are still written and reconstructed as a compatibility surface for readers that have not finished the cutover.

The research workspace implementation adds:

- `workspace_items` for canonical board-adjacent records such as notes, links, files/media, and promoted chat excerpts
- `workspace_boards` for named board/page shells scoped to a workspace
- `workspace_board_documents` for persisted `tldraw` snapshots kept separate from canonical research objects
- `board_agent_sessions` for persisted board-task lifecycle state, request metadata, and provider/model snapshots
- `board_agent_actions` for auditable board-agent action logs including normalized payloads and affected canonical/board ids

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

Current additive upgrade logic also creates `artifact_evidence` for older local databases that predate the research-output expansion.

Current additive upgrade logic also creates `follow_ups` for older local databases that predate canonical follow-up persistence.

Current additive upgrade logic also creates `board_agent_sessions` and `board_agent_actions` for older local databases that predate the board-agent groundwork.

## Remaining localStorage Usage

Some non-tabular values are still stored directly in localStorage:

- provider keys (for selected providers)
- `sherlock_config` (system config object)
- `sherlock_openrouter_model_catalog_v1` (cached OpenRouter catalog snapshot/live refresh payload)
- `sherlock_recent_model_ids_v1` (recent model selections for compact selectors and browser defaults)
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
- `boardAgent`
- `signals`
- `graph`
- `workspaceSurface`
- `templates`
- `metadata`

Workspace-data backups include:

- workspaces (`cases`)
- artifacts (`reports`, `artifact_sections`, `artifact_evidence`, `entities`, `sources`)
- artifact follow-ups (`follow_ups`, also reflected canonically on artifact payloads)
- runs (`tasks`)
- chat sessions, messages, attachments, and actions
- board-agent sessions and action audit history
- saved signals (`leads`)
- workspace library items (`workspace_items`)
- workspace boards and board documents (`workspace_boards`, `workspace_board_documents`)
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
- deleting a workspace also removes its canonical workspace items, boards, and board documents
- purging a workspace removes the workspace, its artifacts, saved signals, linked chat history, linked run rows, canonical workspace items/boards, and directly linked manual graph references
- clearing workspace data removes all persisted workspace-domain records and resets graph hide/flag filters that only reference workspace data

See `src/components/features/Settings/index.tsx`, `src/store/caseStore.ts`, and `src/services/maintenance/workspaceData.ts` for the implemented flow.
