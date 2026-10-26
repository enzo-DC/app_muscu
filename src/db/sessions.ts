import { blankSet, lastPerformance, prefillSets, valuesOf, type LastPerformance } from '../lib/stats';
import { db, type Session, type SessionExercise, type SetEntry } from './schema';
import { DEFAULT_TARGET_SETS } from './templates';

const FREE_SESSION_NAME = 'Séance libre';

/** Ce que l'exercice a donné lors de la dernière séance terminée qui le contient. */
export async function getLastPerformance(exerciseId: string): Promise<LastPerformance | undefined> {
  const finished = await db.sessions.filter((s) => s.finishedAt !== undefined).toArray();
  return lastPerformance(finished, exerciseId);
}

/** La séance en cours (il n'y en a qu'une à la fois), ou undefined. */
export function getActiveSession(): Promise<Session | undefined> {
  return db.sessions.filter((s) => s.finishedAt === undefined).first();
}

/** Les séances terminées, de la plus récente à la plus ancienne. */
export function listFinishedSessions(): Promise<Session[]> {
  return db.sessions
    .orderBy('startedAt')
    .reverse()
    .filter((s) => s.finishedAt !== undefined)
    .toArray();
}

export function getSession(id: string): Promise<Session | undefined> {
  return db.sessions.get(id);
}

/**
 * Démarre une séance à partir d'un modèle (ou une séance libre sans modèle).
 * S'il y a déjà une séance en cours, on la renvoie au lieu d'en créer une autre.
 */
export function startSession(templateId?: string): Promise<string> {
  return db.transaction('rw', db.sessions, db.templates, db.exercises, async () => {
    const active = await getActiveSession();
    if (active) return active.id;

    const template = templateId ? await db.templates.get(templateId) : undefined;
    const exercises: SessionExercise[] = [];
    for (const item of template?.exercises ?? []) {
      const exercise = await db.exercises.get(item.exerciseId);
      if (!exercise) continue;
      // Pré-rempli avec la dernière fois, pour qu'une série identique se valide en 1 tap
      const last = await getLastPerformance(item.exerciseId);
      exercises.push({
        exerciseId: item.exerciseId,
        sets: prefillSets(item.targetSets, exercise.kind, last?.sets, item.targetReps),
      });
    }

    const id = crypto.randomUUID();
    await db.sessions.add({
      id,
      templateId: template?.id,
      name: template?.name ?? FREE_SESSION_NAME,
      startedAt: Date.now(),
      exercises,
    });
    return id;
  });
}

/** Lit, modifie et réécrit les exercices d'une séance dans une transaction. */
function editExercises(id: string, edit: (list: SessionExercise[]) => SessionExercise[]): Promise<void> {
  return db.transaction('rw', db.sessions, async () => {
    const session = await db.sessions.get(id);
    if (!session) return;
    await db.sessions.update(id, { exercises: edit(structuredClone(session.exercises)) });
  });
}

function editSets(id: string, exIndex: number, edit: (sets: SetEntry[]) => void): Promise<void> {
  return editExercises(id, (list) => {
    const exercise = list[exIndex];
    if (exercise) edit(exercise.sets);
    return list;
  });
}

type SetValues = Pick<SetEntry, 'weightKg' | 'reps' | 'durationSec'>;

export function updateSet(id: string, exIndex: number, setIndex: number, values: SetValues): Promise<void> {
  return editSets(id, exIndex, (sets) => {
    const set = sets[setIndex];
    if (set) Object.assign(set, values);
  });
}

/** Valide une série et recopie ses valeurs dans la suivante si elle n'est pas encore faite. */
function sameValues(a: SetEntry | undefined, b: SetEntry | undefined): boolean {
  return !!a && !!b && a.weightKg === b.weightKg && a.reps === b.reps && a.durationSec === b.durationSec;
}

/**
 * Valide une série et lance le repos (`restSeconds`).
 * La série suivante reprend les valeurs qu'on vient de faire, sauf si on a fait exactement
 * comme la dernière fois : elle garde alors la valeur de la dernière fois (ex. 40 × 10 puis 42,5 × 8).
 */
export function completeSet(id: string, exIndex: number, setIndex: number, restSeconds?: number): Promise<void> {
  return db.transaction('rw', db.sessions, async () => {
    const session = await db.sessions.get(id);
    const exerciseId = session?.exercises[exIndex]?.exerciseId;
    if (!session || !exerciseId) return;
    const last = await getLastPerformance(exerciseId);
    const now = Date.now();

    await editSets(id, exIndex, (sets) => {
      const set = sets[setIndex];
      if (!set) return;
      set.done = true;
      set.completedAt = now;
      const next = sets[setIndex + 1];
      const keepLastTime = sameValues(set, last?.sets[setIndex]) && last?.sets[setIndex + 1] !== undefined;
      if (next && !next.done && !keepLastTime) sets[setIndex + 1] = valuesOf(set);
    });
    if (restSeconds && restSeconds > 0) {
      await db.sessions.update(id, { rest: { startedAt: now, endsAt: now + restSeconds * 1000 } });
    }
  });
}

/** Ajoute (ou retire) du temps au repos en cours. */
export function adjustRest(id: string, deltaSec: number): Promise<void> {
  return db.transaction('rw', db.sessions, async () => {
    const rest = (await db.sessions.get(id))?.rest;
    if (!rest) return;
    const endsAt = Math.max(Date.now(), rest.endsAt + deltaSec * 1000);
    await db.sessions.update(id, { rest: { ...rest, endsAt } });
  });
}

export async function clearRest(id: string): Promise<void> {
  await db.sessions.update(id, { rest: undefined });
}

export function uncompleteSet(id: string, exIndex: number, setIndex: number): Promise<void> {
  return editSets(id, exIndex, (sets) => {
    const set = sets[setIndex];
    if (set) sets[setIndex] = valuesOf(set);
  });
}

/** Ajoute une série en recopiant les valeurs de la dernière. */
export function addSet(id: string, exIndex: number): Promise<void> {
  return db.transaction('rw', db.sessions, db.exercises, async () => {
    const session = await db.sessions.get(id);
    const exercise = session?.exercises[exIndex];
    if (!exercise) return;
    const last = exercise.sets.at(-1);
    const kind = (await db.exercises.get(exercise.exerciseId))?.kind ?? 'charge';
    await editSets(id, exIndex, (sets) => {
      sets.push(last ? valuesOf(last) : blankSet(kind));
    });
  });
}

export function addExerciseToSession(id: string, exerciseId: string): Promise<void> {
  return db.transaction('rw', db.sessions, db.exercises, async () => {
    const kind = (await db.exercises.get(exerciseId))?.kind ?? 'charge';
    const last = await getLastPerformance(exerciseId);
    // Autant de séries que la dernière fois, sinon le nombre par défaut
    const count = last?.sets.length ?? DEFAULT_TARGET_SETS;
    await editExercises(id, (list) => [...list, { exerciseId, sets: prefillSets(count, kind, last?.sets) }]);
  });
}

/** Termine la séance : seules les séries cochées sont gardées dans l'historique. */
export function finishSession(id: string): Promise<void> {
  return db.transaction('rw', db.sessions, async () => {
    const session = await db.sessions.get(id);
    if (!session) return;
    const exercises = session.exercises
      .map((ex) => ({ ...ex, sets: ex.sets.filter((s) => s.done) }))
      .filter((ex) => ex.sets.length > 0);
    await db.sessions.update(id, { exercises, finishedAt: Date.now(), rest: undefined });
  });
}

export function deleteSession(id: string): Promise<void> {
  return db.sessions.delete(id);
}
