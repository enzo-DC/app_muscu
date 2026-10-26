import { useId } from 'react';
import fieldStyles from '../../components/Field.module.css';
import { Icon } from '../../components/Icon';
import { t } from '../../lib/strings';

export function ExerciseSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className={fieldStyles.search}>
      <label className="visually-hidden" htmlFor={id}>
        {t.exercises.searchLabel}
      </label>
      <span className={fieldStyles.searchIcon}>
        <Icon name="search" size={18} />
      </span>
      <input
        id={id}
        type="search"
        className={fieldStyles.input}
        placeholder={t.exercises.searchPlaceholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        enterKeyHint="search"
      />
    </div>
  );
}
