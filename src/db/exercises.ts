import { db, type Exercise, type ExerciseKind, type MuscleGroup } from './schema';

type ExerciseInput = { name: string; group: MuscleGroup; kind: ExerciseKind; note?: string };
type ExercisePatch = Partial<Pick<Exercise, 'name' | 'group' | 'kind' | 'note'>>;

export function listActiveExercises(): Promise<Exercise[]> {
  return db.exercises.filter((e) => !e.archived).toArray();
}

/** Tous les exercices, archivés compris, indexés par id (pour afficher les noms dans un modèle ou l'historique). */
export async function getExercisesById(): Promise<Map<string, Exercise>> {
  return new Map((await db.exercises.toArray()).map((e) => [e.id, e]));
}

export function getExercise(id: string): Promise<Exercise | undefined> {
  return db.exercises.get(id);
}

export async function addExercise(input: ExerciseInput): Promise<string> {
  const name = input.name.trim();
  if (!name) throw new Error('Le nom de l’exercice est vide');
  const id = crypto.randomUUID();
  await db.exercises.add({
    id,
    name,
    group: input.group,
    kind: input.kind,
    note: input.note?.trim() || undefined,
    archived: false,
    createdAt: Date.now(),
  });
  return id;
}

export async function updateExercise(id: string, patch: ExercisePatch): Promise<void> {
  const changes: ExercisePatch = { ...patch };
  if (changes.name !== undefined) {
    changes.name = changes.name.trim();
    // Un nom vide ne remplace jamais l'ancien
    if (!changes.name) delete changes.name;
  }
  await db.exercises.update(id, changes);
}

async function isExerciseUsed(id: string): Promise<boolean> {
  const inSessions = await db.sessions.filter((s) => s.exercises.some((e) => e.exerciseId === id)).count();
  if (inSessions > 0) return true;
  const inTemplates = await db.templates.filter((t) => t.exercises.some((e) => e.exerciseId === id)).count();
  return inTemplates > 0;
}

/**
 * Supprime un exercice. S'il apparaît dans l'historique ou un modèle,
 * il est archivé à la place pour ne jamais perdre de données.
 */
export function removeExercise(id: string): Promise<'deleted' | 'archived'> {
  return db.transaction('rw', db.exercises, db.sessions, db.templates, async () => {
    if (await isExerciseUsed(id)) {
      await db.exercises.update(id, { archived: true });
      return 'archived' as const;
    }
    await db.exercises.delete(id);
    return 'deleted' as const;
  });
}
