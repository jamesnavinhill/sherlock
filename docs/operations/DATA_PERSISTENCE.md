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
- `workspaces`
- `artifacts`
- `key_findings`
- `follow_ups`
- `artifact_sections`
- `artifact_evidence`
- `entities`
- `sources`
- `signals`
- `workspace_runs`
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

- `WorkspaceRepository`
- `WorkspaceRunRepository`
- `ScopeRepository`
- `TemplateRepository`
- `ManualDataRepository`
- `SettingsRepository`
- `ChatRepository`
- `BoardAgentRepository`
- `WorkspaceSearchRepository`
- `WorkspaceItemRepository`
- `WorkspaceBoardRepository`

Critical multi-table writes now use one shared transaction helper in `src/services/db/client.ts`: `runWriteTransaction(...)`.

Durable transaction rule:

- repository helpers may accept and reuse an existing write executor/transaction
- repository helpers must not implicitly open a second transaction when they were already called inside one
- top-level callers still use `runWriteTransaction(...)` to preserve atomic restore/import/delete flows

Repository hydration and serialization now follow a shared helper contract in `src/services/db/repositories/json.ts`:

- JSON parsing should use labeled helpers so malformed persisted payloads warn consistently and fall back predictably
- row hydration should prefer the shared row-mapping guard so a corrupted row can be skipped with a labeled warning instead of aborting the full repository read
- JSON serialization for nullable/update fields should use the same helper module so `null` vs `undefined` behavior stays consistent across create/update paths

Artifact persistence now has an explicit helper split under `src/services/db/repositories/`:

- `artifactHydration.ts` owns canonical row-to-domain artifact hydration
- `artifactPersistence.ts` owns domain artifact to persistence-row planning plus write execution
- `artifactCompatibility.ts` bounds legacy raw-payload parsing and legacy `agendas` / `leads` reconstruction used during hydration compatibility

Workspace-data import normalization now follows the same boundary style under `src/services/maintenance/`:

- `workspaceData.ts` owns canonical backup assembly and the normalized return shape
- `workspaceDataCompatibility.ts` owns legacy backup/export shape acceptance and compatibility normalization

That helper is the canonical repository pattern for:

- artifact saves plus dependent key findings, follow-ups, sections, evidence, entities, sources, and lineage updates
- chat message saves plus attachment rows
- workspace/board/session delete flows that span multiple tables
- workspace-data restore flows that clear and replay the persisted workspace domain

## Current Runtime Model

Runtime code now treats persisted records as:

- `Workspace` -> stored in `workspaces`
- `Artifact` -> stored in `artifacts` plus `key_findings`, `follow_ups`, `artifact_sections`, `artifact_evidence`, `entities`, and `sources`
- `WorkspaceRun` -> stored in `workspace_runs`
- `Signal` -> stored in `signals`
- `KeyFinding` -> stored in `key_findings`
- `FollowUp` -> stored in `follow_ups`
- `WorkspaceItem` -> stored in `workspace_items`
- `WorkspaceBoard` and `WorkspaceBoardDocument` -> stored in `workspace_boards` and `workspace_board_documents`
- `BoardAgentSession` and `BoardAgentAction` -> stored in `board_agent_sessions` and `board_agent_actions`

Finder/Feed discovery results are transient runtime state in the store and are not persisted as a separate SQLite table.

`workspaces` store workspace-oriented metadata:

- `displayTitle`
- `launchTopic`
- `launchAngle`
- `prioritySourcesSummary`
- `mode`
- `pack_id`
- `purpose_id`
- `label_profile_id`
- `metadata_json`

Runtime code now treats those workspace identity fields as distinct concerns:

- `displayTitle` is the primary user-facing workspace name used in top-level chrome
- `launchTopic`, `launchAngle`, and `prioritySourcesSummary` preserve structured launch metadata for prompts, exports, summaries, and future workspace-home selectors
- legacy tagged `title` values remain readable through compatibility extraction during migration/hydration

`artifacts` store artifact-oriented metadata:

- `artifact_type`
- `pack_id`
- `purpose_id`
- `label_profile_id`
- `metadata_json`
- `config_json`

`artifacts.metadata_json` may include persisted artifact provenance metadata, while `Artifact.metadata` in runtime code remains reserved for non-provenance metadata.

`workspace_runs` store:

- `pack_id`
- `purpose_id`
- `artifact_type`
- `label_profile_id`

`key_findings` persists first-class findings linked to an origin artifact and optional originating section, with stable ids, sort ordering, support refs, and finding-local metadata. Runtime code treats `Artifact.keyFindings` as the canonical findings field.

`follow_ups` persists first-class actionable records linked to their origin artifact, optional originating section, optional source signal, entity/source references, and resolution metadata. Follow-up lineage can now connect `Signal -> Run -> Artifact -> FollowUp -> Run -> Artifact` without relying only on compatibility arrays.

`artifact_sections` persists typed section rows for richer artifacts while legacy `summary`, `agendas`, and `leads` fields remain available for compatibility. Section ids are unique within an artifact, and the table uses a composite primary key of `artifact_id + id` so repeated section labels from different artifacts do not collide. `KEY_FINDINGS` rows in this table are a presentation projection of canonical `key_findings` records rather than the source of truth.

`artifact_evidence` persists first-class evidence rows with:

- `artifact_id`
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
- `chat_messages` for persisted transcript turns, citation metadata, and mention-reference metadata in `metadata_json`
- `chat_message_attachments` for retrieved context snippets attached to a turn
- `chat_actions` for auditable retrieval, save, append, and follow-up operations

Artifact save/hydration behavior now treats `Artifact.keyFindings` and `Artifact.followUps` as canonical runtime fields. `WorkspaceRepository` delegates that work through `artifactHydration.ts` and `artifactPersistence.ts`, while legacy flattened `leads` arrays are reconstructed only through the bounded compatibility helper in `artifactCompatibility.ts` when older persisted artifact payloads need hydration. New workspace-level export flows still write canonical workspace/artifact keys rather than legacy `case` / `reports` payloads.

Artifact saves are now atomic across the artifact row, dependent key-finding/follow-up/section/evidence rows, source-signal linkage, and source-follow-up resolution so the database does not keep half-saved artifact bundles.

The foundation cleanup did not introduce a new persistence path for the theme workbench, Operation View reader, board-agent review flow, or Timeline snapshots. Theme templates still persist through `theme_workspace`/`theme_mode` settings records, board-agent audit data still persists through `board_agent_sessions` and `board_agent_actions`, and Timeline snapshots still reuse the canonical artifact persistence path.

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
- guided run saves reuse the existing `artifacts` and `artifact_sections` tables rather than introducing a parallel draft store

## Schema Migration

On startup, store initialization now runs one persistence bootstrap entry point:

1. `initDB()`

`initDB()` opens the SQLite database and then runs the canonical migration pipeline in `src/services/db/migrations.ts`.

After the database opens and migrations complete, bootstrap now upserts the code-defined built-in scopes into the SQLite `scopes` table before workspace hydration continues. This keeps `workspaces.scope_id` foreign keys valid after fresh-profile starts, partial browser-storage resets, and older local databases that predate scope persistence.

The migration runner records applied steps in SQLite table `__sherlock_schema_migrations` and currently applies these steps in order:

- canonical storage cutover for legacy table and column names
- canonical schema bootstrap from `src/services/db/migrations_sql.ts`
- additive schema repairs for missing columns plus the `artifact_sections` composite-primary-key rebuild
- key-findings cutover that backfills first-class finding rows for older saved artifacts

That keeps schema evolution inside SQLite itself rather than layering a second localStorage-to-SQLite import bridge on top of database initialization.

Existing local databases are upgraded through that pipeline:

- legacy tables `cases`, `reports`, `leads`, and `tasks` are renamed to `workspaces`, `artifacts`, `signals`, and `workspace_runs`
- legacy foreign-key columns such as `case_id`, `report_id`, `linked_report_id`, and `source_report_id` are renamed to canonical `workspace_id`, `artifact_id`, `linked_artifact_id`, and `source_artifact_id`
- missing canonical columns such as workspace launch metadata and run/artifact pack metadata are added in place
- `artifact_sections` still gets an in-place rebuild when older installs used a global primary key on `id`
- older artifacts get a one-time findings backfill that prefers structured payload `keyFindings`, then existing `KEY_FINDINGS` section content, and finally legacy mixed-duty `agendas` as a bounded fallback

Legacy `sherlock-storage` Zustand payloads are no longer imported during bootstrap. Workspace maintenance flows now treat canonical workspace-data backup/import as the supported structured transfer path.

## Remaining localStorage Usage

Some non-tabular values still live in browser storage, but runtime code now routes them through the typed helper in `src/utils/localStorage.ts` rather than feature-local `localStorage` calls.

The storage helper now exposes dedicated typed accessors for:

- system config persistence
- cached OpenRouter model-catalog payloads
- recent model selections
- omnibox recent destinations
- active workspace selection
- Live Monitor autosave preference
- one-time demo bootstrap marker

Durable saved timeline views do not use browser storage. They persist through the SQLite `settings` table under workspace-scoped keys so omnibox saved-view results survive reloads and backup/restore flows.

Visual-theme persistence also uses the SQLite `settings` table:

- `theme_workspace` stores saved and draft Sherlock theme templates plus the active template id
- `theme_mode` stores the current app-level light/dark display mode independently from the selected theme template
- each theme template stores mode-scoped divider tone plus divider width, strength, accent tint, and glow values under the shell settings; older saved themes without `dividerTone` hydrate through the default divider tone fallback

Values still kept there:

- provider keys (for selected providers)
- `sherlock_config` (shared runtime defaults, OpenRouter search settings, and browser-local app preferences)
- `sherlock_openrouter_model_catalog_v1` (cached OpenRouter catalog snapshot/live refresh payload)
- `sherlock_recent_model_ids_v1` (recent model selections for compact selectors and browser defaults)
- `sherlock_omnibox_recents_v1` (durable recent workspace/artifact/chat/run/item destinations for the header omnibox)
- `sherlock_livestream_autosave`
- `sherlock_active_workspace_id` (Files selection hint)
- `sherlock_demo_seed_v1_applied` (one-time demo workspace bootstrap marker)

Intentional direct `localStorage` exceptions remain limited to:

- provider key handling in `src/services/providers/keys.ts`

Provider keys are an explicit persistence invariant rather than an accidental implementation detail: they stay device-local, remain outside SQLite, and are excluded from workspace backup/restore on purpose. New persistence work should keep provider-key handling confined to `src/services/providers/keys.ts` rather than introducing a second storage path.

## Backup/Restore

User-facing maintenance tools in Settings:

- export workspace-data JSON snapshot
- import JSON snapshot (replaces current workspace-data domain)
- clear workspace-data domain

Import normalization still accepts older canonical workspace-export payloads and pre-canonical legacy backups, but that compatibility is now isolated to `src/services/maintenance/workspaceDataCompatibility.ts` rather than mixed into canonical backup assembly.

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

- workspaces (`workspaces`)
- artifacts (`artifacts`, `artifact_sections`, `artifact_evidence`, `entities`, `sources`)
- artifact key findings (`key_findings`, also reflected canonically on artifact payloads)
- artifact follow-ups (`follow_ups`, also reflected canonically on artifact payloads)
- runs (`workspace_runs`)
- chat sessions, messages, attachments, and actions
- board-agent sessions and action audit history
- saved signals (`signals`), exported canonically as `signals.signals`
- workspace library items (`workspace_items`)
- workspace boards and board documents (`workspace_boards`, `workspace_board_documents`)
- manual graph nodes and links
- templates
- Timeline snapshots saved from `TimelineView` reuse the normal artifact path and persist as `artifactType: TIMELINE` inside `artifacts`/`artifact_sections`

Workspace rows in those backups preserve both the clean display identity and the structured launch metadata fields (`displayTitle`, `launchTopic`, `launchAngle`, `prioritySourcesSummary`) when present, while older payloads without those fields still restore through compatibility title parsing.

Workspace-data restore now replays that backup inside one SQLite transaction so a failed import does not leave a partially cleared or partially restored workspace domain behind.

Store bootstrap now follows an explicit read-failure policy in `src/store/actions/bootstrapResourceLoader.ts`:

- recoverable resource reads log `[bootstrap][skip]` and fall back to an explicit empty/default value
- fail-fast reads can throw `[bootstrap][fail]` and stop initialization when fallback would hide a critical failure

`initializeStore` still treats DB initialization/migration and post-read theme-setting writes as hard-fail boundaries, while repository/settings hydration reads remain recoverable-by-resource.

Legacy `sherlock_config` parsing during bootstrap now uses the shared JSON helper path (`parseStoredJson`) instead of ad hoc `JSON.parse` blocks so malformed payload warnings and fallbacks are consistent with repository hydration.

Restore/import still accepts older canonical payloads that stored saved signals under `signals.headlines`, plus pre-canonical legacy payloads with top-level `headlines`. Those compatibility paths are bounded to restore/import normalization rather than the primary export format.

Workspace-data backups intentionally exclude:

- visual theme settings (`theme_workspace`, `theme_mode`, and legacy split theme fragments)
- provider/model defaults
- API keys
- quiet mode and other device-local preferences

## Hosting Implications

- Workspace data is scoped to the current browser origin, so local data on a Vercel preview URL is separate from local data on the production domain.
- Redeploying the same production domain does not clear IndexedDB or localStorage by itself.
- Clearing browser storage removes the local SQLite database and any browser-stored API keys.
- The current runtime is browser-local only: there is no shared server database, automatic cross-device sync, or multi-user persistence layer.
- If `public/seeds/demo-workspace.json` is present, Sherlock will auto-import it once for a browser profile whose workspace-data domain is still empty.
- The seed file may be either a canonical workspace-data backup or a canonical single-workspace export JSON with top-level `workspace` and `artifacts` keys.
- The demo bootstrap is device-local and origin-local. Updating the JSON file affects only browsers that have not already applied the seed marker.

Maintenance cleanup behavior:

- importing workspace data clears the current workspace-data domain first, then restores the backup payload
- deleting a workspace removes workspace-linked chat sessions and saved signals, while artifacts are unassigned rather than purged
- deleting a workspace also removes its canonical workspace items, boards, and board documents
- purging a workspace removes the workspace, its artifacts, saved signals, linked chat history, linked run rows, canonical workspace items/boards, and directly linked manual graph references
- clearing workspace data removes all persisted workspace-domain records and resets graph hide/flag filters that only reference workspace data

See `src/components/features/Settings/index.tsx`, `src/store/workspaceStore.ts`, and `src/services/maintenance/workspaceData.ts` for the implemented flow.
