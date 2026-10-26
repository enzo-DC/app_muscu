import { db, type Exercise, type Session, type Settings, type WorkoutTemplate } from './schema';

const APP_ID = 'carnet-de-salle';
/** Format du fichier de sauvegarde (indépendant de la version du schéma Dexie). */
export const BACKUP_FORMAT = 1;

export interface Backup {
  app: typeof APP_ID;
  format: number;
  exportedAt: number;
  exercises: Exercise[];
  templates: WorkoutTemplate[];
  sessions: Session[];
  settings: Settings[];
}

export type BackupSummary = { exercises: number; templates: number; sessions: number; exportedAt: number };

export async function exportBackup(now = Date.now()): Promise<Backup> {
  return db.transaction('r', db.exercises, db.templates, db.sessions, db.settings, async () => ({
    app: APP_ID,
    format: BACKUP_FORMAT,
    exportedAt: now,
    exercises: await db.exercises.toArray(),
    templates: await db.templates.toArray(),
    sessions: await db.sessions.toArray(),
    settings: await db.settings.toArray(),
  }));
}

/** « carnet-de-salle-2026-10-26.json » */
export function backupFileName(now = Date.now()): string {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${APP_ID}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

export class BackupError extends Error {}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const hasStringId = (v: unknown) => isObject(v) && typeof v.id === 'string';

/** Lit et vérifie un fichier de sauvegarde. Lève une BackupError lisible si quelque chose ne va pas. */
export function parseBackup(text: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new BackupError('Ce fichier n’est pas une sauvegarde lisible.');
  }
  if (!isObject(data) || data.app !== APP_ID) {
    throw new BackupError('Ce fichier ne vient pas de Carnet de salle.');
  }
  if (typeof data.format !== 'number' || data.format > BACKUP_FORMAT) {
    throw new BackupError('Cette sauvegarde vient d’une version plus récente de l’app. Mets l’app à jour.');
  }
  for (const key of ['exercises', 'templates', 'sessions', 'settings'] as const) {
    const list = data[key];
    if (!Array.isArray(list) || !list.every(hasStringId)) {
      throw new BackupError('Cette sauvegarde est incomplète ou abîmée.');
    }
  }
  return data as unknown as Backup;
}

export function summarize(backup: Backup): BackupSummary {
  return {
    exercises: backup.exercises.filter((e) => !e.archived).length,
    templates: backup.templates.length,
    sessions: backup.sessions.filter((s) => s.finishedAt !== undefined).length,
    exportedAt: backup.exportedAt,
  };
}

/** Remplace toutes les données par celles de la sauvegarde, en une seule transaction (tout ou rien). */
export async function restoreBackup(backup: Backup): Promise<void> {
  await db.transaction('rw', db.exercises, db.templates, db.sessions, db.settings, async () => {
    await Promise.all([db.exercises.clear(), db.templates.clear(), db.sessions.clear(), db.settings.clear()]);
    await db.exercises.bulkAdd(backup.exercises);
    await db.templates.bulkAdd(backup.templates);
    await db.sessions.bulkAdd(backup.sessions);
    await db.settings.bulkAdd(backup.settings);
  });
}
