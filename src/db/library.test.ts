import { beforeEach, describe, expect, it } from 'vitest';
import library from './library.json';
import { ensureLibrary, LIBRARY_VERSION, planLibrarySync, type LibraryExercise } from './library';
import { db } from './schema';
import { SEED_EXERCISES } from './seed';

const LIBRARY = library as LibraryExercise[];
const load = () => Promise.resolve(LIBRARY);

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('bibliothèque d’exercices', () => {
  it('chaque exercice a un nom, une zone, des muscles, des consignes et des photos', () => {
    expect(LIBRARY.length).toBeGreaterThan(400);
    for (const e of LIBRARY) {
      expect(e.name.trim()).not.toBe('');
      expect(e.primaryMuscles.length).toBeGreaterThan(0);
      expect(e.instructions.length).toBeGreaterThan(0);
      expect(e.images.length).toBeGreaterThan(0);
      expect(e.secondaryMuscles.some((m) => e.primaryMuscles.includes(m))).toBe(false);
    }
  });

  it('chaque exercice pré-rempli relié existe dans la bibliothèque', () => {
    const ids = new Set(LIBRARY.map((e) => e.id));
    for (const s of SEED_EXERCISES) if (s.libraryId) expect(ids.has(s.libraryId)).toBe(true);
  });

  it('complète les exercices reliés sans toucher au nom ni à la note, ajoute les autres', () => {
    const lib = LIBRARY.slice(0, 2);
    const existing = [
      { id: 'mine', name: 'Ma presse', group: 'jambes' as const, kind: 'charge' as const, note: 'cran 4', archived: false, createdAt: 0, libraryId: lib[0]!.id },
    ];
    const { toAdd, toUpdate } = planLibrarySync(existing, lib, 1000);
    expect(toUpdate).toEqual([{ id: 'mine', changes: expect.objectContaining({ images: lib[0]!.images }) }]);
    expect(toUpdate[0]!.changes).not.toHaveProperty('name');
    expect(toAdd).toHaveLength(1);
    expect(toAdd[0]).toMatchObject({ libraryId: lib[1]!.id, name: lib[1]!.name, archived: false });
  });

  it('importe une seule fois, sans doublon, en reliant les exercices pré-remplis', async () => {
    await ensureLibrary(load);
    const linkedSeeds = SEED_EXERCISES.filter((s) => s.libraryId).length;
    const expected = SEED_EXERCISES.length + LIBRARY.length - linkedSeeds;
    expect(await db.exercises.count()).toBe(expected);
    expect((await db.settings.get('singleton'))?.libraryVersion).toBe(LIBRARY_VERSION);

    const press = await db.exercises.where('libraryId').equals('Leg_Press').toArray();
    expect(press).toHaveLength(1);
    expect(press[0]).toMatchObject({ name: 'Presse à cuisses', equipment: 'machine', primaryMuscles: ['quadriceps'] });

    await ensureLibrary(load); // deuxième lancement
    expect(await db.exercises.count()).toBe(expected);
  });

  it('garde la note et l’archivage d’un exercice déjà relié', async () => {
    const press = (await db.exercises.where('libraryId').equals('Leg_Press').first())!;
    await db.exercises.update(press.id, { note: 'siège cran 4', archived: true });
    await ensureLibrary(load);
    expect(await db.exercises.get(press.id)).toMatchObject({ note: 'siège cran 4', archived: true, images: expect.any(Array) });
  });
});
