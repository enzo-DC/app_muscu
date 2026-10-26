import { formatNumber } from '../lib/format';
import styles from './Stepper.module.css';

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /** Affichage de la valeur (par défaut : nombre fr-FR). */
  format?: (value: number) => string;
  decreaseLabel: string;
  increaseLabel: string;
};

/** [ − ] valeur [ + ] avec des boutons de 48 px. */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  unit,
  format = formatNumber,
  decreaseLabel,
  increaseLabel,
}: Props) {
  return (
    <div className={styles.stepper}>
      <button
        type="button"
        className={styles.button}
        aria-label={decreaseLabel}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - step))}
      >
        −
      </button>
      <span className={styles.value} aria-live="polite">
        <span className={styles.number}>{format(value)}</span>
        {unit && <span className={styles.unit}>{unit}</span>}
      </span>
      <button
        type="button"
        className={styles.button}
        aria-label={increaseLabel}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + step))}
      >
        +
      </button>
    </div>
  );
}
