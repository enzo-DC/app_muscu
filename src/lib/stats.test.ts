import { describe, expect, it } from 'vitest';
import type { Session } from '../db/schema';
import { lastPerformance, prefillSets, sessionSummary, setsProgress } from './stats';

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

  it('trouve la dernière performance : séance terminée la plus récente, séries faites', () => {
    const old: Session = { ...session, id: 'old', startedAt: -10, finishedAt: -5, exercises: [{ exerciseId: 'a', sets: [{ weightKg: 30, reps: 10, done: true }] }] };
    const running: Session = { ...session, id: 'run', startedAt: 100, finishedAt: undefined };
    const last = lastPerformance([old, session, running], 'a');
    expect(last?.sessionId).toBe('s');
    expect(last?.sets).toEqual([
      { weightKg: 40, reps: 10, done: true },
      { weightKg: 42.5, reps: 8, done: true },
    ]);
    expect(lastPerformance([old, session], 'zzz')).toBeUndefined();
  });

  it('regroupe les séries si l’exercice apparaît deux fois dans la séance', () => {
    const twice: Session = {
      ...session,
      exercises: [
        { exerciseId: 'a', sets: [{ weightKg: 40, reps: 10, done: true }] },
        { exerciseId: 'a', sets: [{ weightKg: 45, reps: 6, done: true }] },
      ],
    };
    expect(lastPerformance([twice], 'a')?.sets.map((s) => s.weightKg)).toEqual([40, 45]);
  });

  it('pré-remplit série par série, puis répète la dernière', () => {
    const last = [
      { weightKg: 40, reps: 10, done: true },
      { weightKg: 42.5, reps: 8, done: true, completedAt: 5 },
    ];
    expect(prefillSets(3, 'charge', last)).toEqual([
      { weightKg: 40, reps: 10, done: false },
      { weightKg: 42.5, reps: 8, done: false },
      { weightKg: 42.5, reps: 8, done: false },
    ]);
  });

  it('sans historique : séries vierges, reps cible du modèle', () => {
    expect(prefillSets(2, 'charge', undefined, 12)).toEqual([
      { weightKg: undefined, reps: 12, done: false },
      { weightKg: undefined, reps: 12, done: false },
    ]);
    expect(prefillSets(1, 'poids_du_corps')).toEqual([{ reps: 10, done: false }]);
    expect(prefillSets(1, 'cardio')).toEqual([{ durationSec: 600, done: false }]);
  });

  it('compte la progression d’un exercice', () => {
    expect(setsProgress(session.exercises[0]!)).toEqual({ done: 2, total: 3, complete: false });
    expect(setsProgress(session.exercises[1]!)).toEqual({ done: 1, total: 1, complete: true });
    expect(setsProgress({ exerciseId: 'c', sets: [] }).complete).toBe(false);
  });
});
