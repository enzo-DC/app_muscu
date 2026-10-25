import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './schema';
import {
  addExerciseToSession,
  addSet,
  completeSet,
  deleteSession,
  finishSession,
  getActiveSession,
  startSession,
  uncompleteSet,
  updateSet,
} from './sessions';

let squatId: string;
let pushupId: string;

beforeEach(async () => {
  await db.delete();
  await db.open();
  squatId = (await db.exercises.filter((e) => e.name === 'Squat').first())!.id;
  pushupId = (await db.exercises.filter((e) => e.name === 'Pompes').first())!.id;
  await db.templates.add({
    id: 'tpl',
    name: 'Séance A',
    exercises: [
      { exerciseId: squatId, targetSets: 3 },
      { exerciseId: pushupId, targetSets: 2, targetReps: 15 },
    ],
    createdAt: 1,
    updatedAt: 1,
  });
});

const session = async (id: string) => (await db.sessions.get(id))!;

describe('séance en cours', () => {
  it('démarre une séance à partir d’un modèle', async () => {
    const id = await startSession('tpl');
    const s = await session(id);
    expect(s).toMatchObject({ templateId: 'tpl', name: 'Séance A' });
    expect(s.finishedAt).toBeUndefined();
    expect(s.exercises.map((e) => e.sets.length)).toEqual([3, 2]);
    expect(s.exercises[0]!.sets[0]).toEqual({ weightKg: undefined, reps: 10, done: false });
    // poids du corps : pas de charge, reps cible du modèle
    expect(s.exercises[1]!.sets[0]).toEqual({ reps: 15, done: false });
  });

  it('démarre une séance libre vide', async () => {
    const id = await startSession();
    expect(await session(id)).toMatchObject({ templateId: undefined, name: 'Séance libre', exercises: [] });
  });

  it('n’autorise qu’une séance en cours : redémarrer renvoie la séance active', async () => {
    const first = await startSession('tpl');
    expect(await startSession()).toBe(first);
    expect(await db.sessions.count()).toBe(1);
    expect((await getActiveSession())?.id).toBe(first);
  });

  it('modifie une série', async () => {
    const id = await startSession('tpl');
    await updateSet(id, 0, 0, { weightKg: 40 });
    expect((await session(id)).exercises[0]!.sets[0]).toMatchObject({ weightKg: 40, reps: 10 });
  });

  it('valider une série la marque faite et pré-remplit la suivante', async () => {
    const id = await startSession('tpl');
    await updateSet(id, 0, 0, { weightKg: 40, reps: 8 });
    await completeSet(id, 0, 0);
    const sets = (await session(id)).exercises[0]!.sets;
    expect(sets[0]).toMatchObject({ done: true, weightKg: 40, reps: 8 });
    expect(sets[0]!.completedAt).toBeTypeOf('number');
    expect(sets[1]).toMatchObject({ done: false, weightKg: 40, reps: 8 });
  });

  it('ne touche pas une série suivante déjà faite', async () => {
    const id = await startSession('tpl');
    await updateSet(id, 0, 1, { weightKg: 50 });
    await completeSet(id, 0, 1);
    await updateSet(id, 0, 0, { weightKg: 40 });
    await completeSet(id, 0, 0);
    expect((await session(id)).exercises[0]!.sets[1]).toMatchObject({ weightKg: 50, done: true });
  });

  it('dé-valide une série', async () => {
    const id = await startSession('tpl');
    await completeSet(id, 0, 0);
    await uncompleteSet(id, 0, 0);
    expect((await session(id)).exercises[0]!.sets[0]).toEqual({ weightKg: undefined, reps: 10, done: false });
  });

  it('ajoute une série en recopiant la dernière', async () => {
    const id = await startSession('tpl');
    await updateSet(id, 0, 2, { weightKg: 45 });
    await addSet(id, 0);
    const sets = (await session(id)).exercises[0]!.sets;
    expect(sets).toHaveLength(4);
    expect(sets[3]).toEqual({ weightKg: 45, reps: 10, done: false });
  });

  it('ajoute un exercice à la séance', async () => {
    const id = await startSession();
    await addExerciseToSession(id, squatId);
    expect((await session(id)).exercises).toEqual([
      { exerciseId: squatId, sets: Array(3).fill({ weightKg: undefined, reps: 10, done: false }) },
    ]);
  });

  it('terminer garde seulement les séries faites', async () => {
    const id = await startSession('tpl');
    await updateSet(id, 0, 0, { weightKg: 40 });
    await completeSet(id, 0, 0);
    await finishSession(id);
    const s = await session(id);
    expect(s.finishedAt).toBeTypeOf('number');
    expect(s.exercises).toHaveLength(1);
    expect(s.exercises[0]!.sets).toHaveLength(1);
    expect(await getActiveSession()).toBeUndefined();
  });

  it('supprime une séance', async () => {
    const id = await startSession('tpl');
    await deleteSession(id);
    expect(await db.sessions.get(id)).toBeUndefined();
  });
});
