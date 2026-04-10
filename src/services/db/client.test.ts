import { describe, expect, it, vi } from 'vitest';
import {
  ARTIFACT_SECTIONS_TABLE_SQL,
  applyPendingDbMigrations,
  artifactSectionsTableRequiresUpgrade,
  ensureArtifactSectionsCompositeKey,
} from './migrations';

describe('database section schema upgrades', () => {
  it('detects legacy artifact section tables that use a global id primary key', () => {
    expect(
      artifactSectionsTableRequiresUpgrade(
        'CREATE TABLE "artifact_sections" ("id" text PRIMARY KEY NOT NULL, "artifact_id" text NOT NULL)'
      )
    ).toBe(true);
    expect(
      artifactSectionsTableRequiresUpgrade(
        'CREATE TABLE "artifact_sections" ("id" text NOT NULL, "artifact_id" text NOT NULL, PRIMARY KEY ("artifact_id", "id"))'
      )
    ).toBe(false);
  });

  it('rebuilds legacy artifact section tables with a composite primary key', async () => {
    const exec = vi.fn(async (_db: number, sql: string, callback?: (row: unknown[]) => void) => {
      if (sql.includes('sqlite_master')) {
        callback?.([
          'CREATE TABLE "artifact_sections" ("id" text PRIMARY KEY NOT NULL, "artifact_id" text NOT NULL, "kind" text NOT NULL, "title" text NOT NULL, "content" text, "items_json" text, "sort_order" integer NOT NULL)',
        ]);
      }
    });

    await ensureArtifactSectionsCompositeKey({ exec } as never, 1);

    expect(exec).toHaveBeenCalledWith(
      1,
      expect.stringContaining('sqlite_master'),
      expect.any(Function)
    );
    expect(exec).toHaveBeenCalledWith(1, 'PRAGMA foreign_keys = OFF;');
    expect(exec).toHaveBeenCalledWith(
      1,
      'ALTER TABLE "artifact_sections" RENAME TO "artifact_sections_legacy";'
    );
    expect(exec).toHaveBeenCalledWith(1, ARTIFACT_SECTIONS_TABLE_SQL.replace(' IF NOT EXISTS', ''));
    expect(exec).toHaveBeenCalledWith(
      1,
      expect.stringContaining('FROM "artifact_sections_legacy";')
    );
    expect(exec).toHaveBeenCalledWith(1, 'DROP TABLE "artifact_sections_legacy";');
    expect(exec).toHaveBeenCalledWith(1, 'PRAGMA foreign_keys = ON;');
  });

  it('skips already-applied database migrations', async () => {
    const exec = vi.fn(async (_db: number, sql: string, callback?: (row: unknown[]) => void) => {
      if (sql.includes('SELECT "id" FROM "__sherlock_schema_migrations"')) {
        callback?.([1]);
        callback?.([2]);
        callback?.([3]);
      }
    });

    await applyPendingDbMigrations({ exec } as never, 1);

    expect(exec).toHaveBeenCalledWith(
      1,
      expect.stringContaining('CREATE TABLE IF NOT EXISTS "__sherlock_schema_migrations"')
    );
    expect(exec).not.toHaveBeenCalledWith(1, 'ALTER TABLE "cases" RENAME TO "workspaces";');
    expect(exec).not.toHaveBeenCalledWith(
      1,
      expect.stringContaining('CREATE TABLE IF NOT EXISTS "workspaces"')
    );
  });

  it('runs post-repair schema backfill even when earlier repairs were already applied', async () => {
    const exec = vi.fn(async (_db: number, sql: string, callback?: (row: unknown[]) => void) => {
      if (sql.includes('SELECT "id" FROM "__sherlock_schema_migrations"')) {
        callback?.([1]);
        callback?.([2]);
        callback?.([3]);
        callback?.([4]);
      }
    });

    await applyPendingDbMigrations({ exec } as never, 1);

    expect(exec).toHaveBeenCalledWith(1, 'ALTER TABLE workspaces ADD COLUMN icon_id text;');
    expect(exec).toHaveBeenCalledWith(1, 'ALTER TABLE manual_nodes ADD COLUMN icon_id text;');
    expect(exec).toHaveBeenCalledWith(
      1,
      expect.stringContaining('INSERT INTO "__sherlock_schema_migrations" ("id", "name", "applied_at")')
    );
  });
});
