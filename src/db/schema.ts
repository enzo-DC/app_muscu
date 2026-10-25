import Dexie, { type EntityTable } from 'dexie';
import { SEED_EXERCISES } from './seed';

export const MUSCLE_GROUPS = ['jambes', 'dos', 'pecs', 'epaules', 'bras', 'abdos', 'cardio'] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
export type ExerciseKind = 'charge' | 'poids_du_corps' | 'cardio';

export interface Exercise {
  id: string; // crypto.randomUUID()
  name: string;
  group: MuscleGroup;
  kind: ExerciseKind;
  note?: string; // réglages machine, conseils
  archived: boolean; // on archive au lieu de supprimer si utilisé dans l'historique
  createdAt: number;
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

export interface Session {
  id: string;
  templateId?: string; // undefined = séance libre
  name: string;
  startedAt: number;
  finishedAt?: number; // undefined = séance en cours
  exercises: SessionExercise[];
}

export interface Settings {
  id: 'singleton';
  defaultRestSeconds: number;
  weightStep: number;
  vibrate: boolean;
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

// Version 1. Pour faire évoluer le schéma : ajouter db.version(2).stores({...}).upgrade(tx => ...)
// sans jamais modifier une version existante.
db.version(1).stores({
  exercises: 'id, group, name',
  templates: 'id, updatedAt',
  sessions: 'id, startedAt, finishedAt, templateId',
  settings: 'id',
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
