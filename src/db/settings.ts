import { db, DEFAULT_SETTINGS, type Settings } from './schema';

export async function getSettings(): Promise<Settings> {
  return (await db.settings.get('singleton')) ?? DEFAULT_SETTINGS;
}
