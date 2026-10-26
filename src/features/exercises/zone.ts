import type { Equipment, Exercise, MuscleGroup } from '../../db/schema';

export const EQUIPMENT_ORDER: Equipment[] = ['machine', 'poulie', 'halteres', 'barre', 'barre_ez', 'poids_du_corps'];
export type EquipmentFilter = Equipment | 'tout';

const collator = new Intl.Collator('fr-FR', { sensitivity: 'base' });

/** Le matériel présent parmi ces exercices, dans un ordre fixe. */
export function availableEquipment(exercises: Exercise[]): Equipment[] {
  return EQUIPMENT_ORDER.filter((eq) => exercises.some((e) => e.equipment === eq));
}

/**
 * Exercices d'une zone, filtrés par matériel et triés par nom.
 * Les exercices créés à la main (sans matériel connu) restent toujours visibles.
 */
export function zoneExercises(exercises: Exercise[], group: MuscleGroup, equipment: EquipmentFilter): Exercise[] {
  return exercises
    .filter((e) => e.group === group)
    .filter((e) => equipment === 'tout' || e.equipment === equipment || !e.equipment)
    .sort((a, b) => collator.compare(a.name, b.name));
}
