import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Screen } from '../../components/Screen';
import { listActiveExercises } from '../../db/exercises';
import { addExerciseToSession, getActiveSession } from '../../db/sessions';
import { matchesSearch } from '../../lib/search';
import { t } from '../../lib/strings';
import { ExerciseSearch } from '../exercises/ExerciseSearch';
import { GroupedExerciseList } from '../exercises/GroupedExerciseList';
import rowStyles from '../exercises/GroupedExerciseList.module.css';
import styles from './SessionScreen.module.css';

export function SessionAddExerciseScreen() {
  const navigate = useNavigate();
  const session = useLiveQuery(() => getActiveSession().then((s) => s ?? null));
  const exercises = useLiveQuery(listActiveExercises);
  const [query, setQuery] = useState('');

  if (session === undefined || !exercises) return null;

  async function add(exerciseId: string) {
    if (!session) return;
    await addExerciseToSession(session.id, exerciseId);
    navigate('/seance', { replace: true, state: { openLast: true } });
  }

  return (
    <Screen title={t.session.addExerciseTitle} backTo="/seance">
      {session === null ? (
        <p>{t.session.none}</p>
      ) : (
        <div className={styles.pickerTools}>
          <p className={styles.pickerHint}>{t.session.addExerciseHint}</p>
          <ExerciseSearch value={query} onChange={setQuery} />
          <div>
            <GroupedExerciseList
              exercises={exercises.filter((e) => matchesSearch(e.name, query))}
              renderItem={(ex) => (
                <button type="button" className={rowStyles.row} onClick={() => void add(ex.id)}>
                  <span className={rowStyles.text}>
                    <span className={rowStyles.name}>{ex.name}</span>
                  </span>
                  <span className={rowStyles.trailing} aria-hidden="true">
                    +
                  </span>
                </button>
              )}
            />
          </div>
        </div>
      )}
    </Screen>
  );
}
