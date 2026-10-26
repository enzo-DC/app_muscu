import { describe, expect, it } from 'vitest';
import { groupByWeek, startOfWeek } from './weeks';

const at = (y: number, m: number, d: number, h = 18) => new Date(y, m - 1, d, h).getTime();
// lundi 26 octobre 2026
const now = at(2026, 10, 26, 12);

describe('semaines', () => {
  it('une semaine commence le lundi à minuit', () => {
    expect(startOfWeek(at(2026, 10, 25))).toBe(new Date(2026, 9, 19).getTime()); // dimanche → lundi 19
    expect(startOfWeek(at(2026, 10, 26))).toBe(new Date(2026, 9, 26).getTime()); // lundi → lui-même
  });

  it('groupe par semaine, du plus récent au plus ancien, avec des titres parlants', () => {
    const items = [
      { id: 'a', startedAt: at(2026, 10, 12) },
      { id: 'b', startedAt: at(2026, 10, 26, 8) },
      { id: 'c', startedAt: at(2026, 10, 21) },
      { id: 'd', startedAt: at(2026, 10, 23) },
    ];
    const groups = groupByWeek(items, now);
    expect(groups.map((g) => g.label)).toEqual(['Cette semaine', 'La semaine dernière', 'Semaine du 12 oct.']);
    expect(groups.map((g) => g.items.map((i) => i.id))).toEqual([['b'], ['d', 'c'], ['a']]);
  });

  it('liste vide → aucun groupe', () => {
    expect(groupByWeek([], now)).toEqual([]);
  });
});
