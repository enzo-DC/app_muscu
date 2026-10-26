import type { Exercise, Muscle, MuscleGroup } from '../db/schema';

export type BodyView = 'anterior' | 'posterior';

/** Muscles dessinés sur chaque vue du schéma (d'après body-highlighter). */
const VIEW_MUSCLES: Record<BodyView, ReadonlySet<Muscle>> = {
  anterior: new Set<Muscle>(['chest', 'obliques', 'abs', 'biceps', 'triceps', 'neck', 'front-deltoids', 'abductors', 'quadriceps', 'calves', 'forearm']),
  posterior: new Set<Muscle>(['trapezius', 'back-deltoids', 'upper-back', 'triceps', 'lower-back', 'forearm', 'gluteal', 'adductor', 'hamstring', 'calves']),
};

/** Muscles coloriés sur la carte de chaque zone. */
export const GROUP_MUSCLES: Record<MuscleGroup, Muscle[]> = {
  jambes: ['quadriceps', 'abductors', 'adductor', 'hamstring', 'gluteal', 'calves'],
  dos: ['trapezius', 'upper-back', 'lower-back'],
  pecs: ['chest'],
  epaules: ['front-deltoids', 'back-deltoids'],
  bras: ['biceps', 'triceps', 'forearm'],
  abdos: ['abs', 'obliques'],
  cardio: ['quadriceps', 'hamstring', 'gluteal', 'calves'],
};

export const MUSCLE_LABELS: Record<Muscle, string> = {
  trapezius: 'Trapèzes',
  'upper-back': 'Dorsaux',
  'lower-back': 'Lombaires',
  chest: 'Pectoraux',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearm: 'Avant-bras',
  'back-deltoids': 'Arrière des épaules',
  'front-deltoids': 'Avant des épaules',
  abs: 'Abdominaux',
  obliques: 'Obliques',
  adductor: 'Adducteurs',
  abductors: 'Abducteurs',
  hamstring: 'Ischio-jambiers',
  quadriceps: 'Quadriceps',
  calves: 'Mollets',
  gluteal: 'Fessiers',
  neck: 'Cou',
};

/** Les vues (face, dos) sur lesquelles au moins un de ces muscles apparaît. */
export function viewsFor(muscles: readonly Muscle[]): BodyView[] {
  const views = (['anterior', 'posterior'] as const).filter((v) => muscles.some((m) => VIEW_MUSCLES[v].has(m)));
  return views.length > 0 ? views : ['anterior'];
}

/** La vue qui montre le plus de muscles principaux (face en cas d'égalité) : pour les vignettes. */
export function bestView(primary: readonly Muscle[]): BodyView {
  const count = (v: BodyView) => primary.filter((m) => VIEW_MUSCLES[v].has(m)).length;
  return count('posterior') > count('anterior') ? 'posterior' : 'anterior';
}

/** Muscles d'un exercice ; pour un exercice créé à la main, ceux de sa zone. */
export function exerciseMuscles(e: Pick<Exercise, 'group' | 'primaryMuscles' | 'secondaryMuscles'>) {
  return {
    primary: e.primaryMuscles?.length ? e.primaryMuscles : GROUP_MUSCLES[e.group],
    secondary: e.secondaryMuscles ?? [],
  };
}
