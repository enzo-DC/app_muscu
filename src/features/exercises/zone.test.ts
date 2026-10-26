import { describe, expect, it } from 'vitest';
import type { Exercise } from '../../db/schema';
import { availableEquipment, zoneExercises } from './zone';

const ex = (name: string, group: Exercise['group'], equipment?: Exercise['equipment']): Exercise => ({
  id: name,
  name,
  group,
  kind: 'charge',
  archived: false,
  createdAt: 0,
  equipment,
});

const list = [
  ex('Tirage', 'dos', 'poulie'),
  ex('Rowing', 'dos', 'machine'),
  ex('Mon exo', 'dos'),
  ex('Presse', 'jambes', 'machine'),
];

describe('zones', () => {
  it('liste le matériel disponible dans un ordre fixe', () => {
    expect(availableEquipment(list.filter((e) => e.group === 'dos'))).toEqual(['machine', 'poulie']);
  });

  it('filtre une zone par matériel, trie par nom, garde les exercices perso', () => {
    expect(zoneExercises(list, 'dos', 'tout').map((e) => e.name)).toEqual(['Mon exo', 'Rowing', 'Tirage']);
    expect(zoneExercises(list, 'dos', 'machine').map((e) => e.name)).toEqual(['Mon exo', 'Rowing']);
  });
});
