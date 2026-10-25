import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link } from 'react-router';
import { ButtonLink } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { listActiveExercises } from '../../db/exercises';
import { matchesSearch } from '../../lib/search';
import { t } from '../../lib/strings';
import { ExerciseSearch } from './ExerciseSearch';
import styles from './ExercisesScreen.module.css';
import { GroupedExerciseList } from './GroupedExerciseList';
import rowStyles from './GroupedExerciseList.module.css';

export function ExercisesScreen() {
  const exercises = useLiveQuery(listActiveExercises);
  const [query, setQuery] = useState('');

  const filtered = exercises?.filter((e) => matchesSearch(e.name, query)) ?? [];
  const trimmed = query.trim();

  return (
    <Screen title={t.exercises.title}>
      <div className={styles.tools}>
        <ExerciseSearch value={query} onChange={setQuery} />
        <ButtonLink to="/exercices/nouveau" block>
          {t.exercises.add}
        </ButtonLink>
      </div>

      {exercises && filtered.length === 0 && (
        <div className={styles.empty}>
          <p>{t.exercises.noResult}</p>
          {trimmed && (
            <ButtonLink to={`/exercices/nouveau?nom=${encodeURIComponent(trimmed)}`} block>
              {t.exercises.addThis(trimmed)}
            </ButtonLink>
          )}
        </div>
      )}

      <GroupedExerciseList
        exercises={filtered}
        renderItem={(ex) => (
          <Link to={`/exercices/${ex.id}`} className={rowStyles.row}>
            <span className={rowStyles.text}>
              <span className={rowStyles.name}>{ex.name}</span>
              {ex.note && <span className={rowStyles.note}>{ex.note}</span>}
            </span>
            <span className={rowStyles.trailing}>
              <Icon name="chevron" size={20} />
            </span>
          </Link>
        )}
      />
    </Screen>
  );
}
