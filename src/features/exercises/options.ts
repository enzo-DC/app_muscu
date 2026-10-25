import { MUSCLE_GROUPS, type ExerciseKind } from '../../db/schema';
import { t } from '../../lib/strings';

export const GROUP_OPTIONS = MUSCLE_GROUPS.map((value) => ({ value, label: t.groups[value] }));

const KINDS: readonly ExerciseKind[] = ['charge', 'poids_du_corps', 'cardio'];
export const KIND_OPTIONS = KINDS.map((value) => ({ value, label: t.kinds[value] }));
