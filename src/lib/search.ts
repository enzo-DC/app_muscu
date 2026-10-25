import { MUSCLE_GROUPS, type Exercise, type MuscleGroup } from '../db/schema';

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** Vrai si chaque mot de la recherche apparaît dans le texte (sans tenir compte des accents). */
export function matchesSearch(text: string, query: string): boolean {
  const haystack = normalize(text);
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export type ExerciseGroup = { group: MuscleGroup; exercises: Exercise[] };

const collator = new Intl.Collator('fr-FR', { sensitivity: 'base' });

/** Groupe par zone (ordre de MUSCLE_GROUPS), trie par nom, omet les zones vides. */
export function groupExercises(exercises: Exercise[]): ExerciseGroup[] {
  return MUSCLE_GROUPS.map((group) => ({
    group,
    exercises: exercises.filter((e) => e.group === group).sort((a, b) => collator.compare(a.name, b.name)),
  })).filter((g) => g.exercises.length > 0);
}
