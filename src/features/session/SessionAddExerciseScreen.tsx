import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router';
import { Screen } from '../../components/Screen';
import { listActiveExercises } from '../../db/exercises';
import { addExerciseToSession, getActiveSession } from '../../db/sessions';
import { t } from '../../lib/strings';
import { ExerciseBrowser } from '../exercises/ExerciseBrowser';
import exerciseStyles from '../exercises/Exercises.module.css';
import { ExerciseThumb } from '../exercises/ExerciseThumb';
import styles from './SessionScreen.module.css';

export function SessionAddExerciseScreen() {
  const navigate = useNavigate();
  const session = useLiveQuery(() => getActiveSession().then((s) => s ?? null));
  const exercises = useLiveQuery(listActiveExercises);

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
          <ExerciseBrowser
            exercises={exercises}
            renderItem={(ex) => (
              <button type="button" className={exerciseStyles.row} onClick={() => void add(ex.id)}>
                <ExerciseThumb exercise={ex} />
                <span className={styles.addMark} aria-hidden="true">
                  +
                </span>
              </button>
            )}
          />
        </div>
      )}
    </Screen>
  );
}
