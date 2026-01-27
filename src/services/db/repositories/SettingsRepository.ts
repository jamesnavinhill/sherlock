import { eq } from 'drizzle-orm';
import { getDB } from '../client';
import { settings } from '../schema';

export class SettingsRepository {
  static async getSetting<T>(key: string): Promise<T | null> {
    const db = getDB();
    const rows = await db.select().from(settings).where(eq(settings.key, key));
    if (!rows.length) return null;

    try {
      return JSON.parse(rows[0].value) as T;
    } catch (error) {
      console.warn(`Failed to parse setting ${key}.`, error);
      return null;
    }
  }

  static async setSetting<T>(key: string, value: T): Promise<void> {
    const db = getDB();
    const payload = JSON.stringify(value);

    await db
      .insert(settings)
      .values({ key, value: payload })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: payload },
      });
  }
}