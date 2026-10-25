import { useId } from 'react';
import fieldStyles from '../../components/Field.module.css';
import { t } from '../../lib/strings';

export function ExerciseSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <>
      <label className="visually-hidden" htmlFor={id}>
        {t.exercises.searchLabel}
      </label>
      <input
        id={id}
        type="search"
        className={fieldStyles.input}
        placeholder={t.exercises.searchPlaceholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    </>
  );
}
