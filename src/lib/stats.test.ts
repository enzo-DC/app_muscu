import { describe, expect, it } from 'vitest';
import type { Session } from '../db/schema';
import { sessionSummary, setsProgress } from './stats';

const session: Session = {
  id: 's',
  name: 'A',
  startedAt: 0,
  finishedAt: 45 * 60 * 1000,
  exercises: [
    {
      exerciseId: 'a',
      sets: [
        { weightKg: 40, reps: 10, done: true },
        { weightKg: 42.5, reps: 8, done: true },
        { weightKg: 45, reps: 8, done: false },
      ],
    },
    { exerciseId: 'b', sets: [{ reps: 15, done: true }] },
  ],
};

describe('stats', () => {
  it('résume une séance : durée, séries faites, volume (charge × reps)', () => {
    expect(sessionSummary(session)).toEqual({ durationSec: 2700, doneSets: 3, volumeKg: 740 });
  });

  it('calcule la durée d’une séance en cours avec l’heure actuelle', () => {
    expect(sessionSummary({ ...session, finishedAt: undefined }, 60_000).durationSec).toBe(60);
  });

  it('compte la progression d’un exercice', () => {
    expect(setsProgress(session.exercises[0]!)).toEqual({ done: 2, total: 3, complete: false });
    expect(setsProgress(session.exercises[1]!)).toEqual({ done: 1, total: 1, complete: true });
    expect(setsProgress({ exerciseId: 'c', sets: [] }).complete).toBe(false);
  });
});
