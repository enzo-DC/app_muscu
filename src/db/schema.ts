import Dexie, { type EntityTable } from 'dexie';
import { SEED_EXERCISES, SEED_LIBRARY_IDS } from './seed';

export const MUSCLE_GROUPS = ['jambes', 'dos', 'pecs', 'epaules', 'bras', 'abdos', 'cardio'] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
export type ExerciseKind = 'charge' | 'poids_du_corps' | 'cardio';

/** Muscles du schéma de corps (noms de body-highlighter). */
export type Muscle =
  | 'trapezius'
  | 'upper-back'
  | 'lower-back'
  | 'chest'
  | 'biceps'
  | 'triceps'
  | 'forearm'
  | 'back-deltoids'
  | 'front-deltoids'
  | 'abs'
  | 'obliques'
  | 'adductor'
  | 'abductors'
  | 'hamstring'
  | 'quadriceps'
  | 'calves'
  | 'gluteal'
  | 'neck';

export type Equipment = 'machine' | 'poulie' | 'halteres' | 'barre' | 'barre_ez' | 'poids_du_corps';
export type Level = 'debutant' | 'intermediaire' | 'avance';

export interface Exercise {
  id: string; // crypto.randomUUID()
  name: string;
  group: MuscleGroup;
  kind: ExerciseKind;
  note?: string; // réglages machine, conseils
  archived: boolean; // on archive au lieu de supprimer si utilisé dans l'historique
  createdAt: number;
  // Champs remplis pour les exercices de la bibliothèque (free-exercise-db), absents pour ceux créés à la main
  libraryId?: string;
  equipment?: Equipment;
  level?: Level;
  primaryMuscles?: Muscle[];
  secondaryMuscles?: Muscle[];
  instructions?: string[];
  images?: string[]; // chemins relatifs, ex. « exercises/Leg_Press/0.webp »
}

export interface TemplateExercise {
  exerciseId: string;
  targetSets: number;
  targetReps?: number;
  restSeconds?: number; // surcharge du repos par défaut
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: TemplateExercise[]; // l'ordre compte
  createdAt: number;
  updatedAt: number;
}

export interface SetEntry {
  weightKg?: number;
  reps?: number;
  durationSec?: number; // cardio
  done: boolean;
  completedAt?: number;
}

export interface SessionExercise {
  exerciseId: string;
  sets: SetEntry[];
  note?: string;
}

export interface RestTimer {
  startedAt: number;
  endsAt: number;
}

export interface Session {
  id: string;
  templateId?: string; // undefined = séance libre
  name: string;
  startedAt: number;
  finishedAt?: number; // undefined = séance en cours
  exercises: SessionExercise[];
  rest?: RestTimer; // minuteur de repos en cours (non indexé : pas de changement de version)
}

export interface Settings {
  id: 'singleton';
  defaultRestSeconds: number;
  weightStep: number;
  vibrate: boolean;
  /** Version de la bibliothèque d'exercices déjà importée (voir library.ts). */
  libraryVersion?: number;
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'singleton',
  defaultRestSeconds: 90,
  weightStep: 2.5,
  vibrate: true,
};

export type CarnetDB = Dexie & {
  exercises: EntityTable<Exercise, 'id'>;
  templates: EntityTable<WorkoutTemplate, 'id'>;
  sessions: EntityTable<Session, 'id'>;
  settings: EntityTable<Settings, 'id'>;
};

export const db = new Dexie('carnet-de-salle') as CarnetDB;

// Pour faire évoluer le schéma : ajouter db.version(n + 1).stores({...}).upgrade(tx => ...)
// sans jamais modifier une version existante.
db.version(1).stores({
  exercises: 'id, group, name',
  templates: 'id, updatedAt',
  sessions: 'id, startedAt, finishedAt, templateId',
  settings: 'id',
});

// Version 2 : lien vers la bibliothèque d'exercices. Les exercices pré-remplis de la v1
// sont reliés à leur équivalent (même id, donc l'historique et les modèles restent intacts).
db.version(2)
  .stores({ exercises: 'id, group, name, libraryId' })
  .upgrade(async (tx) => {
    await tx
      .table<Exercise>('exercises')
      .toCollection()
      .modify((e) => {
        const libraryId = e.libraryId ?? SEED_LIBRARY_IDS.get(e.name);
        if (libraryId) e.libraryId = libraryId;
      });
  });

db.on('populate', async (tx) => {
  const now = Date.now();
  await tx.table('exercises').bulkAdd(
    SEED_EXERCISES.map((e, i) => ({
      ...e,
      id: crypto.randomUUID(),
      archived: false,
      createdAt: now + i, // garde l'ordre du seed
    })),
  );
  await tx.table('settings').add(DEFAULT_SETTINGS);
});
