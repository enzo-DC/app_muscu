import { db, DEFAULT_SETTINGS, type Settings } from './schema';

export async function getSettings(): Promise<Settings> {
  return (await db.settings.get('singleton')) ?? DEFAULT_SETTINGS;
}

export const MIN_REST_SECONDS = 15;
export const MAX_REST_SECONDS = 600;

export async function updateSettings(patch: Partial<Omit<Settings, 'id'>>): Promise<void> {
  const current = await getSettings();
  const next = { ...current, ...patch, id: 'singleton' as const };
  next.defaultRestSeconds = Math.min(MAX_REST_SECONDS, Math.max(MIN_REST_SECONDS, next.defaultRestSeconds));
  await db.settings.put(next);
}
