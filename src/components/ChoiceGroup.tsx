import { useId } from 'react';
import styles from './ChoiceGroup.module.css';

type Props<T extends string> = {
  legend: string;
  options: readonly { value: T; label: string }[];
  value: T | undefined;
  onChange: (value: T) => void;
};

/** Groupe de boutons radio présentés en pastilles, un seul choix possible. */
export function ChoiceGroup<T extends string>({ legend, options, value, onChange }: Props<T>) {
  const name = useId();
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((opt) => (
          <label key={opt.value} className={styles.option}>
            <input
              type="radio"
              className={styles.input}
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <span className={styles.chip}>{opt.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
