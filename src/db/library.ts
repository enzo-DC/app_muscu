import { db, type Equipment, type Exercise, type ExerciseKind, type Level, type Muscle, type MuscleGroup } from './schema';

/** Incrémenter quand library.json change : l'app réimporte alors la bibliothèque au démarrage. */
export const LIBRARY_VERSION = 1;

/** Un exercice de src/db/library.json (généré par scripts/exercise-library/build.mjs). */
export interface LibraryExercise {
  id: string;
  name: string;
  group: MuscleGroup;
  kind: ExerciseKind;
  equipment: Equipment;
  level: Level;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
  instructions: string[];
  images: string[];
}

type LibraryFields = Pick<
  Exercise,
  'equipment' | 'level' | 'primaryMuscles' | 'secondaryMuscles' | 'instructions' | 'images'
>;

function libraryFields(e: LibraryExercise): LibraryFields {
  return {
    equipment: e.equipment,
    level: e.level,
    primaryMuscles: e.primaryMuscles,
    secondaryMuscles: e.secondaryMuscles,
    instructions: e.instructions,
    images: e.images,
  };
}

/**
 * Ce qu'il faut faire pour aligner la base sur la bibliothèque :
 * - les exercices déjà reliés (libraryId) reçoivent photos, muscles et consignes,
 *   mais gardent leur nom, leur zone, ta note et leur état d'archivage ;
 * - les autres sont ajoutés.
 */
export function planLibrarySync(existing: Exercise[], library: LibraryExercise[], now = Date.now()) {
  const linked = new Map(existing.filter((e) => e.libraryId).map((e) => [e.libraryId, e]));
  const toUpdate: { id: string; changes: LibraryFields }[] = [];
  const toAdd: Exercise[] = [];
  library.forEach((lib, i) => {
    const current = linked.get(lib.id);
    if (current) {
      toUpdate.push({ id: current.id, changes: libraryFields(lib) });
      return;
    }
    toAdd.push({
      id: crypto.randomUUID(),
      libraryId: lib.id,
      name: lib.name,
      group: lib.group,
      kind: lib.kind,
      archived: false,
      createdAt: now + i,
      ...libraryFields(lib),
    });
  });
  return { toAdd, toUpdate };
}

/** Importe la bibliothèque si elle ne l'a pas encore été dans cette version. Sans effet sinon. */
export async function ensureLibrary(load: () => Promise<LibraryExercise[]> = loadLibrary): Promise<void> {
  const settings = await db.settings.get('singleton');
  if (settings?.libraryVersion === LIBRARY_VERSION) return;
  // Chargé hors transaction : IndexedDB valide une transaction qui attend autre chose qu'elle-même
  const library = await load();
  await db.transaction('rw', db.exercises, db.settings, async () => {
    const { toAdd, toUpdate } = planLibrarySync(await db.exercises.toArray(), library);
    await db.exercises.bulkAdd(toAdd);
    for (const { id, changes } of toUpdate) await db.exercises.update(id, changes);
    const current = await db.settings.get('singleton');
    if (current) await db.settings.update('singleton', { libraryVersion: LIBRARY_VERSION });
  });
}

async function loadLibrary(): Promise<LibraryExercise[]> {
  // Fichier séparé du code principal : ne ralentit pas le premier affichage
  return (await import('./library.json')).default as LibraryExercise[];
}
