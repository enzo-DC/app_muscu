import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../../components/Button';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import fieldStyles from '../../components/Field.module.css';
import { Screen } from '../../components/Screen';
import { getExercise, removeExercise, updateExercise } from '../../db/exercises';
import type { Exercise } from '../../db/schema';
import { t } from '../../lib/strings';
import styles from './ExerciseForm.module.css';
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
  return <ExerciseForm key={exercise.id} exercise={exercise} />;
}

function ExerciseForm({ exercise }: { exercise: Exercise }) {
  const navigate = useNavigate();
  const [name, setName] = useState(exercise.name);
  const [note, setNote] = useState(exercise.note ?? '');
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    setConfirming(false);
    await removeExercise(exercise.id);
    navigate('/exercices', { replace: true });
  }

  return (
    <Screen title={name.trim() || exercise.name} backTo="/exercices">
      <div className={styles.form}>
        <p className={styles.autosaved}>{t.autosaved}</p>

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

        <div className={styles.dangerZone}>
          <Button block className={styles.deleteButton} onClick={() => setConfirming(true)}>
            {t.exercises.delete}
          </Button>
        </div>
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
