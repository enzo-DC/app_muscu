import type { ExerciseKind, Session, SessionExercise, SetEntry } from '../db/schema';

const DEFAULT_REPS = 10;
const DEFAULT_CARDIO_SEC = 10 * 60;

/** Une série vierge adaptée au type d'exercice. */
export function blankSet(kind: ExerciseKind, targetReps?: number): SetEntry {
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
export function valuesOf(set: SetEntry): SetEntry {
  const copy: SetEntry = { done: false };
  if ('weightKg' in set) copy.weightKg = set.weightKg;
  if (set.reps !== undefined) copy.reps = set.reps;
  if (set.durationSec !== undefined) copy.durationSec = set.durationSec;
  return copy;
}

export type LastPerformance = { sessionId: string; date: number; sets: SetEntry[] };

/**
 * Ce que l'exercice a donné la dernière fois : la séance terminée la plus récente qui le contient,
 * avec ses séries faites (regroupées si l'exercice y apparaît plusieurs fois).
 */
export function lastPerformance(sessions: Session[], exerciseId: string): LastPerformance | undefined {
  let best: LastPerformance | undefined;
  for (const s of sessions) {
    if (s.finishedAt === undefined || (best && s.startedAt <= best.date)) continue;
    const sets = s.exercises.filter((e) => e.exerciseId === exerciseId).flatMap((e) => e.sets.filter((x) => x.done));
    if (sets.length > 0) best = { sessionId: s.id, date: s.startedAt, sets };
  }
  return best;
}

/**
 * `count` séries pré-remplies : la série n reprend la série n de la dernière fois,
 * les séries en plus reprennent la dernière. Sans historique, séries vierges.
 */
export function prefillSets(count: number, kind: ExerciseKind, last?: SetEntry[], targetReps?: number): SetEntry[] {
  return Array.from({ length: count }, (_, i) => {
    const previous = last?.[Math.min(i, last.length - 1)];
    return previous ? valuesOf(previous) : blankSet(kind, targetReps);
  });
}

export type SessionSummary = { durationSec: number; doneSets: number; volumeKg: number };

/** Durée, nombre de séries faites et volume total (somme charge × reps des séries faites). */
export function sessionSummary(session: Session, now = Date.now()): SessionSummary {
  let doneSets = 0;
  let volumeKg = 0;
  for (const ex of session.exercises) {
    for (const set of ex.sets) {
      if (!set.done) continue;
      doneSets++;
      volumeKg += (set.weightKg ?? 0) * (set.reps ?? 0);
    }
  }
  const end = session.finishedAt ?? now;
  return { durationSec: Math.max(0, Math.round((end - session.startedAt) / 1000)), doneSets, volumeKg };
}

export function setsProgress(exercise: SessionExercise) {
  const done = exercise.sets.filter((s) => s.done).length;
  const total = exercise.sets.length;
  return { done, total, complete: total > 0 && done === total };
}
