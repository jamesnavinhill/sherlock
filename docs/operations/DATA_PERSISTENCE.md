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
- `feed_items`
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

## Stream 1 Additions

The Stream 1 domain-pack cutover extends persistence without replacing the compatibility tables already used by the UI.

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

`artifact_sections` persists typed section rows for richer artifacts while legacy `summary`, `agendas`, and `leads` fields remain available for compatibility.

## Legacy Migration

On startup, store initialization runs:

1. `initDB()`
2. `migrateLocalStorageToSqlite()`

Migration source:

- legacy Zustand payload key: `sherlock-storage`

Migration completion marker:

- settings key: `migration_v1_complete = true`

Existing local databases are upgraded additively in `src/services/db/client.ts`.

## Remaining localStorage Usage

Some non-tabular values are still stored directly in localStorage:

- provider keys (for selected providers)
- legacy compatibility key aliases
- `sherlock_config` (system config object)
- `sherlock_livestream_autosave`
- `sherlock_active_case_id` (archive selection hint)

## Backup/Restore

User-facing maintenance tools in Settings:

- export case/archive JSON snapshot
- import JSON snapshot (overwrites current case/report data)
- clear case/report data

See `src/components/features/Settings/index.tsx` for exact behavior.
