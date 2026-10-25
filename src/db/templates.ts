import { db, type TemplateExercise, type WorkoutTemplate } from './schema';

export const DEFAULT_TARGET_SETS = 3;
export const MIN_TARGET_SETS = 1;
export const MAX_TARGET_SETS = 10;

export function listTemplates(): Promise<WorkoutTemplate[]> {
  return db.templates.toArray().then((all) => all.sort((a, b) => a.createdAt - b.createdAt));
}

export function getTemplate(id: string): Promise<WorkoutTemplate | undefined> {
  return db.templates.get(id);
}

/** « Séance A », puis la première lettre libre. */
export async function nextTemplateName(): Promise<string> {
  const names = new Set((await db.templates.toArray()).map((t) => t.name));
  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const name = `Séance ${letter}`;
    if (!names.has(name)) return name;
  }
  return 'Nouvelle séance';
}

export async function createTemplate(name: string): Promise<string> {
  const clean = name.trim();
  if (!clean) throw new Error('Le nom du modèle est vide');
  const id = crypto.randomUUID();
  const now = Date.now();
  await db.templates.add({ id, name: clean, exercises: [], createdAt: now, updatedAt: now });
  return id;
}

/** Lit, modifie et réécrit la liste d'exercices d'un modèle dans une transaction. */
function editExercises(id: string, edit: (list: TemplateExercise[]) => TemplateExercise[]): Promise<void> {
  return db.transaction('rw', db.templates, async () => {
    const template = await db.templates.get(id);
    if (!template) return;
    await db.templates.update(id, { exercises: edit([...template.exercises]), updatedAt: Date.now() });
  });
}

export async function renameTemplate(id: string, name: string): Promise<void> {
  const clean = name.trim();
  if (!clean) return;
  await db.templates.update(id, { name: clean, updatedAt: Date.now() });
}

/** Ajoute l'exercice au modèle, ou le retire s'il y est déjà. */
export function toggleTemplateExercise(id: string, exerciseId: string): Promise<void> {
  return editExercises(id, (list) =>
    list.some((e) => e.exerciseId === exerciseId)
      ? list.filter((e) => e.exerciseId !== exerciseId)
      : [...list, { exerciseId, targetSets: DEFAULT_TARGET_SETS }],
  );
}

// Les opérations suivantes ciblent l'exercice par son id (unique dans un modèle) plutôt que
// par sa position : un tap juste après un déplacement ne peut pas viser le mauvais exercice.

export function removeTemplateExercise(id: string, exerciseId: string): Promise<void> {
  return editExercises(id, (list) => list.filter((e) => e.exerciseId !== exerciseId));
}

export function moveTemplateExercise(id: string, exerciseId: string, direction: -1 | 1): Promise<void> {
  return editExercises(id, (list) => {
    const index = list.findIndex((e) => e.exerciseId === exerciseId);
    const target = index + direction;
    const a = list[index];
    const b = list[target];
    if (!a || !b) return list;
    list[index] = b;
    list[target] = a;
    return list;
  });
}

export function setTargetSets(id: string, exerciseId: string, sets: number): Promise<void> {
  const clamped = Math.min(MAX_TARGET_SETS, Math.max(MIN_TARGET_SETS, Math.round(sets)));
  return editExercises(id, (list) =>
    list.map((e) => (e.exerciseId === exerciseId ? { ...e, targetSets: clamped } : e)),
  );
}

/** Supprime le modèle. Les séances déjà faites à partir de lui restent dans l'historique. */
export function deleteTemplate(id: string): Promise<void> {
  return db.templates.delete(id);
}
