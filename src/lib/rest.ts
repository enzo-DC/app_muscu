import type { RestTimer } from '../db/schema';

/** Combien de temps « Repos terminé » reste affiché avant de disparaître. */
export const REST_DONE_VISIBLE_MS = 5000;
export const REST_ADJUST_SEC = 15;

export type RestState = { phase: 'running' | 'done' | 'gone'; remainingSec: number; progress: number };

export function restState(rest: RestTimer | undefined, now: number): RestState {
  if (!rest) return { phase: 'gone', remainingSec: 0, progress: 0 };
  const total = rest.endsAt - rest.startedAt;
  const left = rest.endsAt - now;
  if (left > 0) {
    // Plafonné : l'horloge de l'écran peut avoir un léger retard sur le début du repos
    const clamped = Math.min(left, total);
    return {
      phase: 'running',
      remainingSec: Math.ceil(clamped / 1000),
      progress: total > 0 ? 1 - clamped / total : 1,
    };
  }
  return { phase: -left < REST_DONE_VISIBLE_MS ? 'done' : 'gone', remainingSec: 0, progress: 1 };
}

