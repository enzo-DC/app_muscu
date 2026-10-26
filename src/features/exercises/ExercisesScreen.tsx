import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { ButtonLink } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { listActiveExercises } from '../../db/exercises';
import { MUSCLE_GROUPS } from '../../db/schema';
import { matchesSearch } from '../../lib/search';
import { t } from '../../lib/strings';
import { ExerciseRow } from './ExerciseRow';
import styles from './Exercises.module.css';
import { ExerciseSearch } from './ExerciseSearch';
import { GroupedExerciseList } from './GroupedExerciseList';
import { ZoneCard } from './ZoneCard';

export function ExercisesScreen() {
  const exercises = useLiveQuery(listActiveExercises);
  const [query, setQuery] = useState('');
  const trimmed = query.trim();

  if (!exercises) return <Screen title={t.exercises.title}>{null}</Screen>;

  const results = trimmed ? exercises.filter((e) => matchesSearch(e.name, query)) : [];

  return (
    <Screen title={t.exercises.title}>
      <div className={styles.tools}>
        <ExerciseSearch value={query} onChange={setQuery} />
        {!trimmed && (
          <ButtonLink to="/exercices/nouveau" block>
            {t.exercises.add}
          </ButtonLink>
        )}
      </div>

      {trimmed ? (
        <>
          <p className={styles.resultCount} aria-live="polite">
            {results.length > 0 ? t.exercises.resultCount(results.length) : t.exercises.noResult}
          </p>
          {results.length === 0 && (
            <ButtonLink to={`/exercices/nouveau?nom=${encodeURIComponent(trimmed)}`} block>
              {t.exercises.addThis(trimmed)}
            </ButtonLink>
          )}
          <GroupedExerciseList exercises={results} renderItem={(ex) => <ExerciseRow exercise={ex} />} />
        </>
      ) : (
        <ul className={styles.zones}>
          {MUSCLE_GROUPS.map((group) => (
            <li key={group}>
              <ZoneCard
                group={group}
                count={exercises.filter((e) => e.group === group).length}
                to={`/exercices/zone/${group}`}
              />
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
