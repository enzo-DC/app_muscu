import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useParams } from 'react-router';
import { BodyMap } from '../../components/BodyMap';
import { ButtonLink } from '../../components/Button';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { Screen } from '../../components/Screen';
import { listActiveExercises } from '../../db/exercises';
import { MUSCLE_GROUPS, type MuscleGroup } from '../../db/schema';
import { GROUP_MUSCLES, viewsFor } from '../../lib/muscles';
import { t } from '../../lib/strings';
import { NotFound } from '../../NotFound';
import { ExerciseRow } from './ExerciseRow';
import styles from './Exercises.module.css';
import { availableEquipment, zoneExercises, type EquipmentFilter } from './zone';

function isGroup(value: string | undefined): value is MuscleGroup {
  return (MUSCLE_GROUPS as readonly string[]).includes(value ?? '');
}

export function ExerciseGroupScreen() {
  const { group } = useParams();
  if (!isGroup(group)) return <NotFound />;
  // Clé sur la zone : le filtre repart de « Tout » quand on change de zone
  return <GroupList key={group} group={group} />;
}

function GroupList({ group }: { group: MuscleGroup }) {
  const exercises = useLiveQuery(() => listActiveExercises().then((all) => all.filter((e) => e.group === group)), [group]);
  const [equipment, setEquipment] = useState<EquipmentFilter>('tout');
  const muscles = GROUP_MUSCLES[group];

  if (!exercises) return <Screen title={t.groups[group]} backTo="/exercices">{null}</Screen>;

  const available = availableEquipment(exercises);
  const shown = zoneExercises(exercises, group, equipment);

  return (
    <Screen title={t.groups[group]} backTo="/exercices">
      <div className={styles.groupHero} aria-hidden="true">
        {viewsFor(muscles).map((view) => (
          <BodyMap key={view} primary={muscles} view={view} className={styles.heroBody} />
        ))}
      </div>

      {available.length > 1 && (
        <div className={styles.filters}>
          <ChoiceGroup
            legend={t.exercises.equipmentFilter}
            options={[
              { value: 'tout' as const, label: t.exercises.allEquipment },
              ...available.map((eq) => ({ value: eq, label: t.equipment[eq] })),
            ]}
            value={equipment}
            onChange={setEquipment}
          />
        </div>
      )}

      <p className={styles.resultCount} aria-live="polite">
        {shown.length > 0 ? t.exercises.count(shown.length) : t.exercises.noneForFilter}
      </p>
      <ul className={styles.list}>
        {shown.map((ex) => (
          <li key={ex.id} className={styles.item}>
            <ExerciseRow exercise={ex} />
          </li>
        ))}
      </ul>

      <div className={styles.addInZone}>
        <ButtonLink to={`/exercices/nouveau?zone=${group}`} block>
          {t.exercises.addInZone}
        </ButtonLink>
      </div>
    </Screen>
  );
}
