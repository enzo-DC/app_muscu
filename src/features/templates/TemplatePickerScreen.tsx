import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { listActiveExercises } from '../../db/exercises';
import { getTemplate, toggleTemplateExercise } from '../../db/templates';
import { matchesSearch } from '../../lib/search';
import { t } from '../../lib/strings';
import { ExerciseSearch } from '../exercises/ExerciseSearch';
import { GroupedExerciseList } from '../exercises/GroupedExerciseList';
import rowStyles from '../exercises/GroupedExerciseList.module.css';
import styles from './Template.module.css';

export function TemplatePickerScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const template = useLiveQuery(() => getTemplate(id).then((tpl) => tpl ?? null), [id]);
  const exercises = useLiveQuery(listActiveExercises);
  const [query, setQuery] = useState('');

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

  return (
    <Screen title={t.templates.pickerTitle} backTo={editorPath}>
      <div className={styles.form}>
        <p className={styles.pickerHint}>{t.templates.pickerHint}</p>
        <ExerciseSearch value={query} onChange={setQuery} />
        <div>
          <GroupedExerciseList
            exercises={exercises.filter((e) => matchesSearch(e.name, query))}
            renderItem={(ex) => {
              const isPicked = picked.has(ex.id);
              return (
                <button
                  type="button"
                  className={`${rowStyles.row} ${isPicked ? styles.picked : ''}`}
                  aria-pressed={isPicked}
                  onClick={() => void toggleTemplateExercise(template.id, ex.id)}
                >
                  <span className={styles.check}>{isPicked && <Icon name="check" size={20} />}</span>
                  <span className={rowStyles.text}>
                    <span className={rowStyles.name}>{ex.name}</span>
                  </span>
                  {isPicked && <span className={styles.addedLabel}>{t.templates.added}</span>}
                </button>
              );
            }}
          />
        </div>
      </div>
      <div className={styles.doneBar}>
        <Button variant="primary" block onClick={() => navigate(editorPath, { replace: true })}>
          {t.templates.done(picked.size)}
        </Button>
      </div>
    </Screen>
  );
}
