import { beforeEach, describe, expect, it } from 'vitest';
import {
  addExercise,
  getExercise,
  listActiveExercises,
  removeExercise,
  updateExercise,
} from './exercises';
import { db } from './schema';
import { SEED_EXERCISES } from './seed';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('exercices', () => {
  it('ajoute un exercice (nom nettoyé, non archivé)', async () => {
    const id = await addExercise({ name: '  Hip thrust ', group: 'jambes', kind: 'charge' });
    const ex = await getExercise(id);
    expect(ex).toMatchObject({ name: 'Hip thrust', group: 'jambes', kind: 'charge', archived: false });
    expect(await listActiveExercises()).toHaveLength(SEED_EXERCISES.length + 1);
  });

  it('refuse un nom vide', async () => {
    await expect(addExercise({ name: '   ', group: 'dos', kind: 'charge' })).rejects.toThrow();
  });

  it('modifie le nom, la zone et la note', async () => {
    const id = await addExercise({ name: 'Presse', group: 'jambes', kind: 'charge' });
    await updateExercise(id, { name: 'Presse 45°', note: 'réglage siège : cran 4' });
    expect(await getExercise(id)).toMatchObject({ name: 'Presse 45°', note: 'réglage siège : cran 4' });
  });

  it('ignore un renommage vide', async () => {
    const id = await addExercise({ name: 'Presse', group: 'jambes', kind: 'charge' });
    await updateExercise(id, { name: '  ' });
    expect((await getExercise(id))?.name).toBe('Presse');
  });

  it('supprime vraiment un exercice jamais utilisé', async () => {
    const id = await addExercise({ name: 'Test', group: 'bras', kind: 'charge' });
    expect(await removeExercise(id)).toBe('deleted');
    expect(await getExercise(id)).toBeUndefined();
  });

  it('archive un exercice présent dans l’historique', async () => {
    const id = await addExercise({ name: 'Test', group: 'bras', kind: 'charge' });
    await db.sessions.add({
      id: 's1',
      name: 'Séance',
      startedAt: 1,
      finishedAt: 2,
      exercises: [{ exerciseId: id, sets: [{ weightKg: 10, reps: 10, done: true }] }],
    });
    expect(await removeExercise(id)).toBe('archived');
    expect((await getExercise(id))?.archived).toBe(true);
    expect((await listActiveExercises()).some((e) => e.id === id)).toBe(false);
  });

  it('archive un exercice utilisé dans un modèle', async () => {
    const id = await addExercise({ name: 'Test', group: 'bras', kind: 'charge' });
    await db.templates.add({
      id: 't1',
      name: 'Séance A',
      exercises: [{ exerciseId: id, targetSets: 3 }],
      createdAt: 1,
      updatedAt: 1,
    });
    expect(await removeExercise(id)).toBe('archived');
  });
});
