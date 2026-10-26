import { describe, expect, it } from 'vitest';
import { restState } from './rest';

const rest = { startedAt: 0, endsAt: 90_000 };

describe('minuteur de repos', () => {
  it('donne le temps restant et la progression', () => {
    const state = restState(rest, 30_000);
    expect(state).toMatchObject({ phase: 'running', remainingSec: 60 });
    expect(state.progress).toBeCloseTo(1 / 3);
  });

  it('arrondit le temps restant au-dessus (pas de « 0:00 » avant la fin)', () => {
    expect(restState(rest, 89_500).remainingSec).toBe(1);
  });

  it('ne dépasse jamais la durée du repos si l’horloge est un peu en retard', () => {
    expect(restState(rest, -200)).toEqual({ phase: 'running', remainingSec: 90, progress: 0 });
  });

  it('passe en « terminé » à la fin, puis disparaît après quelques secondes', () => {
    expect(restState(rest, 90_000)).toEqual({ phase: 'done', remainingSec: 0, progress: 1 });
    expect(restState(rest, 93_000).phase).toBe('done');
    expect(restState(rest, 96_000).phase).toBe('gone');
  });

  it('rien sans repos en cours', () => {
    expect(restState(undefined, 0).phase).toBe('gone');
  });
});
