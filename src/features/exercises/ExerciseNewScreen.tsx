import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '../../components/Button';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import fieldStyles from '../../components/Field.module.css';
import { Screen } from '../../components/Screen';
import { addExercise } from '../../db/exercises';
import type { ExerciseKind, MuscleGroup } from '../../db/schema';
import { t } from '../../lib/strings';
import styles from './ExerciseForm.module.css';
import { GROUP_OPTIONS, KIND_OPTIONS } from './options';

export function ExerciseNewScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [name, setName] = useState(params.get('nom') ?? '');
  const [group, setGroup] = useState<MuscleGroup>();
  const [kind, setKind] = useState<ExerciseKind>('charge');
  const [note, setNote] = useState('');

  const canSubmit = name.trim() !== '' && group !== undefined;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    await addExercise({ name, group, kind, note });
    navigate('/exercices', { replace: true });
  }

  return (
    <Screen title={t.exercises.newTitle} backTo="/exercices">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={fieldStyles.field}>
          <label className={fieldStyles.label} htmlFor="exercise-name">
            {t.exercises.nameLabel}
          </label>
          <input
            id="exercise-name"
            className={fieldStyles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.exercises.namePlaceholder}
            autoComplete="off"
            autoCapitalize="sentences"
          />
        </div>

        <ChoiceGroup legend={t.exercises.groupLabel} options={GROUP_OPTIONS} value={group} onChange={setGroup} />
        <ChoiceGroup legend={t.exercises.kindLabel} options={KIND_OPTIONS} value={kind} onChange={setKind} />

        <div className={fieldStyles.field}>
          <label className={fieldStyles.label} htmlFor="exercise-note">
            {t.exercises.noteLabel}
          </label>
          <span className={fieldStyles.hint}>{t.exercises.noteHint}</span>
          <textarea
            id="exercise-note"
            className={fieldStyles.textarea}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.exercises.notePlaceholder}
          />
        </div>

        <Button type="submit" variant="primary" block disabled={!canSubmit}>
          {t.exercises.submit}
        </Button>
      </form>
    </Screen>
  );
}
