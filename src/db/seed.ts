import type { ExerciseKind, MuscleGroup } from './schema';

type SeedExercise = { name: string; group: MuscleGroup; kind: ExerciseKind; libraryId?: string };

/**
 * Exercices présents dès le premier lancement. Ceux qui ont un `libraryId` sont complétés
 * (photos, muscles, consignes) par la bibliothèque au démarrage de l'app.
 */
export const SEED_EXERCISES: readonly SeedExercise[] = [
  { name: 'Presse à cuisses', group: 'jambes', kind: 'charge', libraryId: 'Leg_Press' },
  { name: 'Leg extension', group: 'jambes', kind: 'charge', libraryId: 'Leg_Extensions' },
  { name: 'Leg curl', group: 'jambes', kind: 'charge', libraryId: 'Seated_Leg_Curl' },
  { name: 'Squat', group: 'jambes', kind: 'charge', libraryId: 'Barbell_Full_Squat' },
  { name: 'Mollets debout', group: 'jambes', kind: 'charge', libraryId: 'Standing_Calf_Raises' },
  { name: 'Abducteurs (machine)', group: 'jambes', kind: 'charge', libraryId: 'Thigh_Abductor' },

  { name: 'Tirage vertical', group: 'dos', kind: 'charge', libraryId: 'Wide-Grip_Lat_Pulldown' },
  { name: 'Rowing assis', group: 'dos', kind: 'charge', libraryId: 'Leverage_Iso_Row' },
  { name: 'Tirage horizontal à la poulie', group: 'dos', kind: 'charge', libraryId: 'Seated_Cable_Rows' },
  { name: 'Tractions', group: 'dos', kind: 'poids_du_corps', libraryId: 'Pullups' },
  { name: 'Lombaires (banc)', group: 'dos', kind: 'poids_du_corps' },

  { name: 'Développé couché', group: 'pecs', kind: 'charge', libraryId: 'Barbell_Bench_Press_-_Medium_Grip' },
  { name: 'Développé incliné haltères', group: 'pecs', kind: 'charge', libraryId: 'Incline_Dumbbell_Press' },
  { name: 'Butterfly (pec deck)', group: 'pecs', kind: 'charge', libraryId: 'Butterfly' },
  { name: 'Pompes', group: 'pecs', kind: 'poids_du_corps', libraryId: 'Pushups' },

  { name: 'Développé épaules (machine)', group: 'epaules', kind: 'charge', libraryId: 'Machine_Shoulder_Military_Press' },
  { name: 'Élévations latérales', group: 'epaules', kind: 'charge', libraryId: 'Side_Lateral_Raise' },
  { name: 'Oiseau (arrière d’épaule)', group: 'epaules', kind: 'charge', libraryId: 'Seated_Bent-Over_Rear_Delt_Raise' },

  { name: 'Curl biceps haltères', group: 'bras', kind: 'charge', libraryId: 'Dumbbell_Bicep_Curl' },
  { name: 'Curl à la poulie', group: 'bras', kind: 'charge', libraryId: 'Standing_Biceps_Cable_Curl' },
  { name: 'Extension triceps à la poulie', group: 'bras', kind: 'charge', libraryId: 'Triceps_Pushdown' },
  { name: 'Dips', group: 'bras', kind: 'poids_du_corps', libraryId: 'Dips_-_Triceps_Version' },

  { name: 'Crunch', group: 'abdos', kind: 'poids_du_corps', libraryId: 'Crunches' },
  { name: 'Gainage (planche)', group: 'abdos', kind: 'poids_du_corps', libraryId: 'Plank' },
  { name: 'Crunch à la machine', group: 'abdos', kind: 'charge', libraryId: 'Ab_Crunch_Machine' },

  { name: 'Tapis de course', group: 'cardio', kind: 'cardio' },
  { name: 'Vélo', group: 'cardio', kind: 'cardio' },
  { name: 'Rameur', group: 'cardio', kind: 'cardio' },
];

/** Nom d'un exercice pré-rempli → id dans la bibliothèque (pour la migration v1 → v2). */
export const SEED_LIBRARY_IDS = new Map(
  SEED_EXERCISES.flatMap((e) => (e.libraryId ? [[e.name, e.libraryId] as const] : [])),
);
