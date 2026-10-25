import type { Session, SessionExercise } from '../db/schema';

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
