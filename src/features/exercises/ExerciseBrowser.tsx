import { useState, type ReactNode } from 'react';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { Icon } from '../../components/Icon';
import { MUSCLE_GROUPS, type Exercise, type MuscleGroup } from '../../db/schema';
import { matchesSearch } from '../../lib/search';
import { t } from '../../lib/strings';
import styles from './Exercises.module.css';
import { ExerciseSearch } from './ExerciseSearch';
import { GroupedExerciseList } from './GroupedExerciseList';
import { availableEquipment, zoneExercises, type EquipmentFilter } from './zone';
import { ZoneCard } from './ZoneCard';

type Props = {
  exercises: Exercise[];
  /** Une ligne d'exercice (bouton ajouter, case à cocher…). */
  renderItem: (exercise: Exercise) => ReactNode;
  /** Mention sur la carte d'une zone, ex. « 2 ajoutés ». */
  zoneBadge?: (group: MuscleGroup) => string | undefined;
};

/**
 * Choisir un exercice parmi plusieurs centaines : recherche, ou cartes par zone
 * puis liste de la zone filtrable par matériel. Tout se passe dans le même écran.
 */
export function ExerciseBrowser({ exercises, renderItem, zoneBadge }: Props) {
  const [query, setQuery] = useState('');
  const [zone, setZone] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<EquipmentFilter>('tout');
  const trimmed = query.trim();

  function openZone(group: MuscleGroup | null) {
    setZone(group);
    setEquipment('tout');
    window.scrollTo?.({ top: 0 });
  }

  if (trimmed) {
    const results = exercises.filter((e) => matchesSearch(e.name, query));
    return (
      <div className={styles.browser}>
        <ExerciseSearch value={query} onChange={setQuery} />
        <p className={styles.resultCount} aria-live="polite">
          {results.length > 0 ? t.exercises.resultCount(results.length) : t.exercises.noResult}
        </p>
        <div>
          <GroupedExerciseList exercises={results} renderItem={renderItem} />
        </div>
      </div>
    );
  }

  if (zone) {
    const inZone = exercises.filter((e) => e.group === zone);
    const available = availableEquipment(inZone);
    const shown = zoneExercises(exercises, zone, equipment);
    return (
      <div className={styles.browser}>
        <ExerciseSearch value={query} onChange={setQuery} />
        <div className={styles.zoneHeader}>
          <button type="button" className={styles.allZones} onClick={() => openZone(null)}>
            <Icon name="back" size={20} />
            {t.exercises.allZones}
          </button>
          <h2 className={styles.zoneTitle}>{t.groups[zone]}</h2>
        </div>
        {available.length > 1 && (
          <ChoiceGroup
            legend={t.exercises.equipmentFilter}
            options={[
              { value: 'tout' as const, label: t.exercises.allEquipment },
              ...available.map((eq) => ({ value: eq, label: t.equipment[eq] })),
            ]}
            value={equipment}
            onChange={setEquipment}
          />
        )}
        <div>
          <p className={styles.resultCount} aria-live="polite">
            {shown.length > 0 ? t.exercises.count(shown.length) : t.exercises.noneForFilter}
          </p>
          <ul className={styles.list}>
            {shown.map((ex) => (
              <li key={ex.id} className={styles.item}>
                {renderItem(ex)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.browser}>
      <ExerciseSearch value={query} onChange={setQuery} />
      <ul className={styles.zones}>
        {MUSCLE_GROUPS.map((group) => (
          <li key={group}>
            <ZoneCard
              group={group}
              count={exercises.filter((e) => e.group === group).length}
              badge={zoneBadge?.(group)}
              onSelect={() => openZone(group)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
