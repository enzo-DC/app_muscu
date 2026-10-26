import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './schema';
import {
  addExerciseToSession,
  addSet,
  adjustRest,
  clearRest,
  completeSet,
  deleteSession,
  finishSession,
  getActiveSession,
  getLastPerformance,
  listFinishedSessions,
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

  it('pré-remplit avec la dernière séance terminée', async () => {
    const first = await startSession('tpl');
    await updateSet(first, 0, 0, { weightKg: 40, reps: 8 });
    await completeSet(first, 0, 0);
    await updateSet(first, 0, 1, { weightKg: 42.5 });
    await completeSet(first, 0, 1);
    await finishSession(first);

    const second = await startSession('tpl');
    const sets = (await session(second)).exercises[0]!.sets;
    expect(sets).toEqual([
      { weightKg: 40, reps: 8, done: false },
      { weightKg: 42.5, reps: 8, done: false },
      { weightKg: 42.5, reps: 8, done: false }, // 3e série : reprend la dernière
    ]);
    expect((await getLastPerformance(squatId))?.sessionId).toBe(first);
  });

  it('un exercice ajouté reprend le nombre de séries et les valeurs de la dernière fois', async () => {
    const first = await startSession();
    await addExerciseToSession(first, squatId);
    await updateSet(first, 0, 0, { weightKg: 60 });
    await completeSet(first, 0, 0);
    await finishSession(first);

    const second = await startSession();
    await addExerciseToSession(second, squatId);
    expect((await session(second)).exercises[0]!.sets).toEqual([{ weightKg: 60, reps: 10, done: false }]);
  });

  it('refaire comme la dernière fois garde le plan de la dernière fois pour la série suivante', async () => {
    const first = await startSession('tpl');
    await updateSet(first, 0, 0, { weightKg: 40, reps: 10 });
    await completeSet(first, 0, 0);
    await updateSet(first, 0, 1, { weightKg: 42.5, reps: 8 });
    await completeSet(first, 0, 1);
    await finishSession(first);

    const second = await startSession('tpl');
    await completeSet(second, 0, 0); // 40 × 10, comme la dernière fois
    expect((await session(second)).exercises[0]!.sets[1]).toMatchObject({ weightKg: 42.5, reps: 8 });

    await updateSet(second, 0, 1, { weightKg: 45 }); // on fait mieux
    await completeSet(second, 0, 1);
    expect((await session(second)).exercises[0]!.sets[2]).toMatchObject({ weightKg: 45, reps: 8 });
  });

  it('valider une série lance le repos ; on peut l’ajuster puis l’arrêter', async () => {
    const id = await startSession('tpl');
    const before = Date.now();
    await completeSet(id, 0, 0, 90);
    const rest = (await session(id)).rest!;
    expect(rest.endsAt - rest.startedAt).toBe(90_000);
    expect(rest.startedAt).toBeGreaterThanOrEqual(before);

    await adjustRest(id, 15);
    expect((await session(id)).rest!.endsAt).toBe(rest.endsAt + 15_000);
    await adjustRest(id, -600); // jamais avant maintenant
    expect((await session(id)).rest!.endsAt).toBeGreaterThanOrEqual(before);

    await clearRest(id);
    expect((await session(id)).rest).toBeUndefined();
  });

  it('terminer la séance arrête le repos', async () => {
    const id = await startSession('tpl');
    await completeSet(id, 0, 0, 90);
    await finishSession(id);
    expect((await session(id)).rest).toBeUndefined();
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

  it('liste les séances terminées, la plus récente d’abord, sans la séance en cours', async () => {
    await db.sessions.bulkAdd([
      { id: 'old', name: 'A', startedAt: 1, finishedAt: 2, exercises: [] },
      { id: 'new', name: 'B', startedAt: 10, finishedAt: 20, exercises: [] },
      { id: 'running', name: 'C', startedAt: 30, exercises: [] },
    ]);
    expect((await listFinishedSessions()).map((s) => s.id)).toEqual(['new', 'old']);
  });

  it('supprime une séance', async () => {
    const id = await startSession('tpl');
    await deleteSession(id);
    expect(await db.sessions.get(id)).toBeUndefined();
  });
});
