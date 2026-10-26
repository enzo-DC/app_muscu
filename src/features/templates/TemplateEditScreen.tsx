import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button, ButtonLink } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import fieldStyles from '../../components/Field.module.css';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Stepper } from '../../components/Stepper';
import { getExercisesById } from '../../db/exercises';
import type { Exercise, WorkoutTemplate } from '../../db/schema';
import {
  deleteTemplate,
  getTemplate,
  MAX_TARGET_SETS,
  MIN_TARGET_SETS,
  moveTemplateExercise,
  removeTemplateExercise,
  renameTemplate,
  setTargetSets,
} from '../../db/templates';
import { spring } from '../../lib/motion';
import { t } from '../../lib/strings';
import styles from './Template.module.css';

export function TemplateEditScreen() {
  const { id = '' } = useParams();
  // null = introuvable, undefined = encore en chargement
  const template = useLiveQuery(() => getTemplate(id).then((tpl) => tpl ?? null), [id]);
  const exercisesById = useLiveQuery(getExercisesById);

  if (template === undefined || exercisesById === undefined) return null;
  if (template === null) {
    return (
      <Screen title={t.templates.newTitle} backTo="/">
        <p>{t.templates.notFound}</p>
      </Screen>
    );
  }
  return <TemplateEditor key={template.id} template={template} exercisesById={exercisesById} />;
}

type EditorProps = { template: WorkoutTemplate; exercisesById: Map<string, Exercise> };

function TemplateEditor({ template, exercisesById }: EditorProps) {
  const navigate = useNavigate();
  const [name, setName] = useState(template.name);
  const [confirming, setConfirming] = useState(false);
  const count = template.exercises.length;

  async function handleDelete() {
    setConfirming(false);
    await deleteTemplate(template.id);
    navigate('/', { replace: true });
  }

  return (
    <Screen title={name.trim() || template.name} backTo="/">
      <div className={styles.form}>
        <p className={styles.autosaved}>{t.autosaved}</p>

        <div className={fieldStyles.field}>
          <label className={fieldStyles.label} htmlFor="template-name">
            {t.templates.nameLabel}
          </label>
          <input
            id="template-name"
            className={fieldStyles.input}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              void renameTemplate(template.id, e.target.value);
            }}
            autoComplete="off"
          />
        </div>

        <section aria-labelledby="template-exercises">
          <h2 id="template-exercises" className={styles.sectionTitle}>
            {t.templates.exercisesTitle}
          </h2>
          {count > 0 && <p className={styles.help}>{t.templates.setsHelp}</p>}

          {count === 0 ? (
            <p className={styles.empty}>{t.templates.noExercises}</p>
          ) : (
            <ol className={styles.list} aria-labelledby="template-exercises">
              {template.exercises.map((item, index) => {
                const exercise = exercisesById.get(item.exerciseId);
                const exName = exercise?.name ?? '?';
                return (
                  <motion.li key={item.exerciseId} layout="position" transition={spring.smooth} className={styles.item}>
                    <span className={styles.index}>{index + 1}</span>
                    <span className={styles.name}>
                      {exName} {exercise?.archived && <span className={styles.archived}>{t.templates.archived}</span>}
                    </span>
                    <button
                      type="button"
                      className={`${styles.iconButton} ${styles.removeButton}`}
                      aria-label={t.templates.remove(exName)}
                      onClick={() => void removeTemplateExercise(template.id, item.exerciseId)}
                    >
                      <Icon name="close" size={20} />
                    </button>
                    <div className={styles.controls}>
                      <Stepper
                        value={item.targetSets}
                        min={MIN_TARGET_SETS}
                        max={MAX_TARGET_SETS}
                        unit={t.templates.sets(item.targetSets)}
                        decreaseLabel={t.templates.lessSets(exName)}
                        increaseLabel={t.templates.moreSets(exName)}
                        onChange={(sets) => void setTargetSets(template.id, item.exerciseId, sets)}
                      />
                      <div className={styles.order}>
                        <button
                          type="button"
                          className={styles.iconButton}
                          aria-label={t.templates.moveUp(exName)}
                          disabled={index === 0}
                          onClick={() => void moveTemplateExercise(template.id, item.exerciseId, -1)}
                        >
                          <Icon name="up" size={20} />
                        </button>
                        <button
                          type="button"
                          className={styles.iconButton}
                          aria-label={t.templates.moveDown(exName)}
                          disabled={index === count - 1}
                          onClick={() => void moveTemplateExercise(template.id, item.exerciseId, 1)}
                        >
                          <Icon name="down" size={20} />
                        </button>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          )}
        </section>

        <ButtonLink to={`/modeles/${template.id}/exercices`} block>
          {t.templates.addExercises}
        </ButtonLink>

        <div className={styles.dangerZone}>
          <Button block className={styles.deleteButton} onClick={() => setConfirming(true)}>
            {t.templates.delete}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title={t.templates.deleteTitle}
        message={t.templates.deleteMessage}
        confirmLabel={t.templates.deleteConfirm}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirming(false)}
      />
    </Screen>
  );
}
