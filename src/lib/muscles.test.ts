import { describe, expect, it } from 'vitest';
import { bestView, exerciseMuscles, viewsFor } from './muscles';

describe('muscles', () => {
  it('choisit les vues où les muscles sont visibles', () => {
    expect(viewsFor(['chest'])).toEqual(['anterior']);
    expect(viewsFor(['upper-back', 'lower-back'])).toEqual(['posterior']);
    expect(viewsFor(['quadriceps', 'hamstring'])).toEqual(['anterior', 'posterior']);
    expect(viewsFor([])).toEqual(['anterior']);
  });

  it('vignette : la vue qui montre le plus de muscles principaux', () => {
    expect(bestView(['upper-back'])).toBe('posterior');
    expect(bestView(['quadriceps'])).toBe('anterior');
    expect(bestView(['triceps'])).toBe('anterior'); // visible des deux côtés : face par défaut
  });

  it('un exercice créé à la main prend les muscles de sa zone', () => {
    expect(exerciseMuscles({ group: 'pecs' })).toEqual({ primary: ['chest'], secondary: [] });
    expect(exerciseMuscles({ group: 'pecs', primaryMuscles: ['triceps'], secondaryMuscles: ['chest'] })).toEqual({
      primary: ['triceps'],
      secondary: ['chest'],
    });
  });
});
