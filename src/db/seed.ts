import type { ExerciseKind, MuscleGroup } from './schema';

type SeedExercise = { name: string; group: MuscleGroup; kind: ExerciseKind };

export const SEED_EXERCISES: readonly SeedExercise[] = [
  { name: 'Presse à cuisses', group: 'jambes', kind: 'charge' },
  { name: 'Leg extension', group: 'jambes', kind: 'charge' },
  { name: 'Leg curl', group: 'jambes', kind: 'charge' },
  { name: 'Squat', group: 'jambes', kind: 'charge' },
  { name: 'Mollets debout', group: 'jambes', kind: 'charge' },
  { name: 'Abducteurs (machine)', group: 'jambes', kind: 'charge' },

  { name: 'Tirage vertical', group: 'dos', kind: 'charge' },
  { name: 'Rowing assis', group: 'dos', kind: 'charge' },
  { name: 'Tirage horizontal à la poulie', group: 'dos', kind: 'charge' },
  { name: 'Tractions', group: 'dos', kind: 'poids_du_corps' },
  { name: 'Lombaires (banc)', group: 'dos', kind: 'poids_du_corps' },

  { name: 'Développé couché', group: 'pecs', kind: 'charge' },
  { name: 'Développé incliné haltères', group: 'pecs', kind: 'charge' },
  { name: 'Butterfly (pec deck)', group: 'pecs', kind: 'charge' },
  { name: 'Pompes', group: 'pecs', kind: 'poids_du_corps' },

  { name: 'Développé épaules (machine)', group: 'epaules', kind: 'charge' },
  { name: 'Élévations latérales', group: 'epaules', kind: 'charge' },
  { name: 'Oiseau (arrière d’épaule)', group: 'epaules', kind: 'charge' },

  { name: 'Curl biceps haltères', group: 'bras', kind: 'charge' },
  { name: 'Curl à la poulie', group: 'bras', kind: 'charge' },
  { name: 'Extension triceps à la poulie', group: 'bras', kind: 'charge' },
  { name: 'Dips', group: 'bras', kind: 'poids_du_corps' },

  { name: 'Crunch', group: 'abdos', kind: 'poids_du_corps' },
  { name: 'Gainage (planche)', group: 'abdos', kind: 'poids_du_corps' },
  { name: 'Crunch à la machine', group: 'abdos', kind: 'charge' },

  { name: 'Tapis de course', group: 'cardio', kind: 'cardio' },
  { name: 'Vélo', group: 'cardio', kind: 'cardio' },
  { name: 'Rameur', group: 'cardio', kind: 'cardio' },
];
