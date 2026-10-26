import Dexie from 'dexie';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, DEFAULT_SETTINGS } from './schema';
import { SEED_EXERCISES } from './seed';
import { MUSCLE_GROUPS } from './schema';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('base de données', () => {
  it('pré-remplit la bibliothèque au premier lancement', async () => {
    const all = await db.exercises.toArray();
    expect(all).toHaveLength(SEED_EXERCISES.length);
    expect(all.every((e) => e.archived === false)).toBe(true);
    expect(new Set(all.map((e) => e.id)).size).toBe(all.length);
  });

  it('couvre chaque zone musculaire', async () => {
    const groups = new Set((await db.exercises.toArray()).map((e) => e.group));
    for (const g of MUSCLE_GROUPS) expect(groups.has(g)).toBe(true);
  });

  it('crée les réglages par défaut', async () => {
    const settings = await db.settings.get('singleton');
    expect(settings).toEqual(DEFAULT_SETTINGS);
    expect(settings?.defaultRestSeconds).toBe(90);
    expect(settings?.weightStep).toBe(2.5);
  });

  it('migration v1 → v2 : relie les exercices pré-remplis à la bibliothèque, sans rien perdre', async () => {
    db.close();
    await Dexie.delete('carnet-de-salle');
    const v1 = new Dexie('carnet-de-salle');
    v1.version(1).stores({ exercises: 'id, group, name', templates: 'id, updatedAt', sessions: 'id, startedAt, finishedAt, templateId', settings: 'id' });
    await v1.table('exercises').bulkAdd([
      { id: 'press', name: 'Presse à cuisses', group: 'jambes', kind: 'charge', note: 'cran 4', archived: false, createdAt: 1 },
      { id: 'mine', name: 'Mon exo perso', group: 'dos', kind: 'charge', archived: false, createdAt: 2 },
    ]);
    await v1.table('sessions').add({ id: 's', name: 'A', startedAt: 1, finishedAt: 2, exercises: [{ exerciseId: 'press', sets: [] }] });
    v1.close();

    await db.open();
    expect(db.verno).toBe(2);
    expect(await db.exercises.get('press')).toMatchObject({ libraryId: 'Leg_Press', note: 'cran 4' });
    expect((await db.exercises.get('mine'))?.libraryId).toBeUndefined();
    expect(await db.sessions.count()).toBe(1);
  });

  it('ne re-seed pas une base existante', async () => {
    const first = await db.exercises.toCollection().first();
    await db.exercises.delete(first!.id);
    db.close();
    await db.open();
    expect(await db.exercises.count()).toBe(SEED_EXERCISES.length - 1);
  });
});
