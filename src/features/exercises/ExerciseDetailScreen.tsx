import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { BodyMap } from '../../components/BodyMap';
import { Button } from '../../components/Button';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import fieldStyles from '../../components/Field.module.css';
import { Screen } from '../../components/Screen';
import { getExercise, removeExercise, updateExercise } from '../../db/exercises';
import type { Exercise } from '../../db/schema';
import { exerciseMuscles, MUSCLE_LABELS, viewsFor } from '../../lib/muscles';
import { t } from '../../lib/strings';
import styles from './Exercises.module.css';
import formStyles from './ExerciseForm.module.css';
import { GROUP_OPTIONS, KIND_OPTIONS } from './options';

export function ExerciseDetailScreen() {
  const { id = '' } = useParams();
  // null = introuvable, undefined = encore en chargement
  const exercise = useLiveQuery(() => getExercise(id).then((e) => (e && !e.archived ? e : null)), [id]);

  if (exercise === undefined) return null;
  if (exercise === null) {
    return (
      <Screen title={t.exercises.title} backTo="/exercices">
        <p>{t.exercises.notFound}</p>
      </Screen>
    );
  }
  // Clé sur l'id : le formulaire repart de zéro si on change d'exercice
  return <ExerciseSheet key={exercise.id} exercise={exercise} />;
}

const PHOTO_STEPS = [t.exercises.photoStart, t.exercises.photoEnd];

function ExerciseSheet({ exercise }: { exercise: Exercise }) {
  const navigate = useNavigate();
  const [name, setName] = useState(exercise.name);
  const [note, setNote] = useState(exercise.note ?? '');
  const [confirming, setConfirming] = useState(false);
  const backTo = `/exercices/zone/${exercise.group}`;

  const { primary, secondary } = exerciseMuscles(exercise);
  const primaryText = primary.map((m) => MUSCLE_LABELS[m]).join(', ');
  const secondaryText = secondary.map((m) => MUSCLE_LABELS[m]).join(', ');
  const meta = [exercise.equipment && t.equipment[exercise.equipment], exercise.level && t.levels[exercise.level]].filter(
    Boolean,
  );

  async function handleDelete() {
    setConfirming(false);
    await removeExercise(exercise.id);
    navigate(backTo, { replace: true });
  }

  return (
    <Screen title={name.trim() || exercise.name} backTo={backTo}>
      <div className={styles.sheet}>
        {meta.length > 0 && <p className={styles.sheetMeta}>{meta.join(' · ')}</p>}

        {exercise.images && exercise.images.length > 0 && (
          <div className={styles.photos}>
            {exercise.images.map((src, i) => (
              <figure key={src} className={styles.photo}>
                <img
                  src={`${import.meta.env.BASE_URL}${src}`}
                  alt={t.exercises.photoAlt(exercise.name, PHOTO_STEPS[i] ?? '')}
                  loading="lazy"
                  width={480}
                  height={320}
                />
                {PHOTO_STEPS[i] && <figcaption>{PHOTO_STEPS[i]}</figcaption>}
              </figure>
            ))}
          </div>
        )}

        <section aria-labelledby="muscles-title" className={styles.sheetSection}>
          <h2 id="muscles-title" className={styles.sheetTitle}>
            {t.exercises.musclesTitle}
          </h2>
          <div className={styles.muscleRow}>
            <div className={styles.muscleBodies} role="img" aria-label={t.exercises.musclesLabel(primaryText, secondaryText)}>
              {viewsFor([...primary, ...secondary]).map((view) => (
                <BodyMap key={view} primary={primary} secondary={secondary} view={view} className={styles.muscleBody} />
              ))}
            </div>
            <dl className={styles.legend}>
              <div>
                <dt>
                  <span className={`${styles.swatch} ${styles.swatchPrimary}`} aria-hidden="true" />
                  {t.exercises.primary}
                </dt>
                <dd>{primaryText}</dd>
              </div>
              {secondary.length > 0 && (
                <div>
                  <dt>
                    <span className={`${styles.swatch} ${styles.swatchSecondary}`} aria-hidden="true" />
                    {t.exercises.secondary}
                  </dt>
                  <dd>{secondaryText}</dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        {exercise.instructions && exercise.instructions.length > 0 && (
          <section aria-labelledby="howto-title" className={styles.sheetSection}>
            <h2 id="howto-title" className={styles.sheetTitle}>
              {t.exercises.howTo}
            </h2>
            <ol className={styles.steps}>
              {exercise.instructions.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        )}

        <section className={styles.sheetSection}>
          <div className={fieldStyles.field}>
            <label className={fieldStyles.label} htmlFor="exercise-note">
              {t.exercises.noteLabel}
            </label>
            <span className={fieldStyles.hint}>{t.exercises.noteHint}</span>
            <textarea
              id="exercise-note"
              className={fieldStyles.textarea}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                void updateExercise(exercise.id, { note: e.target.value });
              }}
              placeholder={t.exercises.notePlaceholder}
            />
          </div>
        </section>

        <details className={styles.edit}>
          <summary>{t.exercises.edit}</summary>
          <div className={formStyles.form}>
            <p className={formStyles.autosaved}>{t.autosaved}</p>
            <div className={fieldStyles.field}>
              <label className={fieldStyles.label} htmlFor="exercise-name">
                {t.exercises.nameLabel}
              </label>
              <input
                id="exercise-name"
                className={fieldStyles.input}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  void updateExercise(exercise.id, { name: e.target.value });
                }}
                autoComplete="off"
              />
            </div>
            <ChoiceGroup
              legend={t.exercises.groupLabel}
              options={GROUP_OPTIONS}
              value={exercise.group}
              onChange={(group) => void updateExercise(exercise.id, { group })}
            />
            <ChoiceGroup
              legend={t.exercises.kindLabel}
              options={KIND_OPTIONS}
              value={exercise.kind}
              onChange={(kind) => void updateExercise(exercise.id, { kind })}
            />
            <Button block className={formStyles.deleteButton} onClick={() => setConfirming(true)}>
              {t.exercises.delete}
            </Button>
          </div>
        </details>

        {exercise.libraryId && <p className={styles.source}>{t.exercises.source}</p>}
      </div>

      <ConfirmDialog
        open={confirming}
        title={t.exercises.deleteTitle}
        message={t.exercises.deleteMessage}
        confirmLabel={t.exercises.deleteConfirm}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirming(false)}
      />
    </Screen>
  );
}
