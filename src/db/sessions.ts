import { db, type ExerciseKind, type Session, type SessionExercise, type SetEntry } from './schema';
import { DEFAULT_TARGET_SETS } from './templates';

const DEFAULT_REPS = 10;
const DEFAULT_CARDIO_SEC = 10 * 60;
const FREE_SESSION_NAME = 'Séance libre';

/** Une série vierge adaptée au type d'exercice. */
function blankSet(kind: ExerciseKind, targetReps?: number): SetEntry {
  switch (kind) {
    case 'charge':
      return { weightKg: undefined, reps: targetReps ?? DEFAULT_REPS, done: false };
    case 'poids_du_corps':
      return { reps: targetReps ?? DEFAULT_REPS, done: false };
    case 'cardio':
      return { durationSec: DEFAULT_CARDIO_SEC, done: false };
  }
}

/** Les valeurs saisies d'une série, sans son état « faite ». */
function valuesOf(set: SetEntry): SetEntry {
  const copy: SetEntry = { done: false };
  if ('weightKg' in set) copy.weightKg = set.weightKg;
  if (set.reps !== undefined) copy.reps = set.reps;
  if (set.durationSec !== undefined) copy.durationSec = set.durationSec;
  return copy;
}

/** La séance en cours (il n'y en a qu'une à la fois), ou undefined. */
export function getActiveSession(): Promise<Session | undefined> {
  return db.sessions.filter((s) => s.finishedAt === undefined).first();
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
      exercises.push({
        exerciseId: item.exerciseId,
        sets: Array.from({ length: item.targetSets }, () => blankSet(exercise.kind, item.targetReps)),
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
export function completeSet(id: string, exIndex: number, setIndex: number): Promise<void> {
  return editSets(id, exIndex, (sets) => {
    const set = sets[setIndex];
    if (!set) return;
    set.done = true;
    set.completedAt = Date.now();
    const next = sets[setIndex + 1];
    if (next && !next.done) sets[setIndex + 1] = valuesOf(set);
  });
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
    await editExercises(id, (list) => [
      ...list,
      { exerciseId, sets: Array.from({ length: DEFAULT_TARGET_SETS }, () => blankSet(kind)) },
    ]);
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
    await db.sessions.update(id, { exercises, finishedAt: Date.now() });
  });
}

export function deleteSession(id: string): Promise<void> {
  return db.sessions.delete(id);
}
