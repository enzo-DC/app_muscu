import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { listActiveExercises } from '../../db/exercises';
import { getTemplate, toggleTemplateExercise } from '../../db/templates';
import { t } from '../../lib/strings';
import { ExerciseBrowser } from '../exercises/ExerciseBrowser';
import exerciseStyles from '../exercises/Exercises.module.css';
import { ExerciseThumb } from '../exercises/ExerciseThumb';
import styles from './Template.module.css';

export function TemplatePickerScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const template = useLiveQuery(() => getTemplate(id).then((tpl) => tpl ?? null), [id]);
  const exercises = useLiveQuery(listActiveExercises);

  if (template === undefined || exercises === undefined) return null;
  if (template === null) {
    return (
      <Screen title={t.templates.pickerTitle} backTo="/">
        <p>{t.templates.notFound}</p>
      </Screen>
    );
  }

  const picked = new Set(template.exercises.map((e) => e.exerciseId));
  const editorPath = `/modeles/${template.id}`;
  const pickedIn = (group: string) => exercises.filter((e) => e.group === group && picked.has(e.id)).length;

  return (
    <Screen title={t.templates.pickerTitle} backTo={editorPath}>
      <div className={styles.form}>
        <p className={styles.pickerHint}>{t.templates.pickerHint}</p>
        <ExerciseBrowser
          exercises={exercises}
          zoneBadge={(group) => {
            const n = pickedIn(group);
            return n > 0 ? t.exercises.addedInZone(n) : undefined;
          }}
          renderItem={(ex) => {
            const isPicked = picked.has(ex.id);
            return (
              <button
                type="button"
                className={`${exerciseStyles.row} ${styles.pickRow} ${isPicked ? styles.picked : ''}`}
                aria-pressed={isPicked}
                onClick={() => void toggleTemplateExercise(template.id, ex.id)}
              >
                <ExerciseThumb exercise={ex} />
                <span className={styles.check}>{isPicked && <Icon name="check" size={20} />}</span>
              </button>
            );
          }}
        />
      </div>
      <div className={styles.doneBar}>
        <Button variant="primary" block onClick={() => navigate(editorPath, { replace: true })}>
          {t.templates.done(picked.size)}
        </Button>
      </div>
    </Screen>
  );
}
