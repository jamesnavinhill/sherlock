# Data Persistence

Sherlock persists investigation data locally in the browser using SQLite (wa-sqlite) backed by IndexedDB.

## Storage Engine

- SQLite runtime: `wa-sqlite`
- VFS: `IDBBatchAtomicVFS`
- Database file name: `sherlock-v1.sqlite`
- Init entry point: `src/services/db/client.ts`

## Schema Tables

Defined in `src/services/db/schema.ts`:

- `scopes`
- `cases`
- `reports`
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

## Legacy Migration

On startup, store initialization runs:

1. `initDB()`
2. `migrateLocalStorageToSqlite()`

Migration source:

- legacy Zustand payload key: `sherlock-storage`

Migration completion marker:

- settings key: `migration_v1_complete = true`

## Remaining localStorage Usage

Some non-tabular values are still stored directly in localStorage:

- provider keys (for selected providers)
- legacy compatibility key aliases
- `sherlock_config` (system config object)
- `sherlock_livestream_autosave`
- `sherlock_active_case_id` (archive selection hint)

## Backup/Restore

User-facing maintenance tools in Settings:

- Export case/archive JSON snapshot
- Import JSON snapshot (overwrites current case/report data)
- Clear case/report data

See `src/components/features/Settings/index.tsx` for exact behavior.
