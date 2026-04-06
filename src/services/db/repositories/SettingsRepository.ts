import { eq } from 'drizzle-orm';
import { getDB, type SherlockWriteExecutor } from '../client';
import { settings } from '../schema';
import { parseStoredJson, serializeStoredJson } from './json';

export class SettingsRepository {
  static async getSetting<T>(key: string): Promise<T | null> {
    const db = getDB();
    const rows = await db.select().from(settings).where(eq(settings.key, key));
    if (!rows.length) return null;

    return parseStoredJson<T | null>(rows[0].value, null, `setting ${key}`);
  }

  static async setSetting<T>(
    key: string,
    value: T,
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    const payload = serializeStoredJson(value);

    await db
      .insert(settings)
      .values({ key, value: payload })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: payload },
      });
  }
}
