import { describe, expect, it } from 'vitest';
import type { Exercise } from '../db/schema';
import { groupExercises, matchesSearch } from './search';

const ex = (name: string, group: Exercise['group']): Exercise => ({
  id: name,
  name,
  group,
  kind: 'charge',
  archived: false,
  createdAt: 0,
});

describe('recherche', () => {
  it('ignore la casse et les accents', () => {
    expect(matchesSearch('Développé couché', 'developpe')).toBe(true);
    expect(matchesSearch('Élévations latérales', 'ELEV')).toBe(true);
    expect(matchesSearch('Leg curl', 'presse')).toBe(false);
    expect(matchesSearch('Leg curl', '  ')).toBe(true);
  });

  it('cherche chaque mot séparément', () => {
    expect(matchesSearch('Curl biceps haltères', 'curl halt')).toBe(true);
  });
});

describe('groupExercises', () => {
  it('groupe par zone dans l’ordre du corps, tri alphabétique fr, zones vides omises', () => {
    const groups = groupExercises([ex('Rowing', 'dos'), ex('Squat', 'jambes'), ex('Élévations', 'epaules'), ex('Abducteurs', 'jambes')]);
    expect(groups.map((g) => g.group)).toEqual(['jambes', 'dos', 'epaules']);
    expect(groups[0]?.exercises.map((e) => e.name)).toEqual(['Abducteurs', 'Squat']);
  });
});
