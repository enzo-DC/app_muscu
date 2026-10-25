import { useState } from 'react';
import { formatNumber, parseDecimal } from '../../lib/format';
import { t } from '../../lib/strings';
import styles from './NumberStepper.module.css';

type Props = {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  step: number;
  unit: string;
  /** Libellé accessible du champ, ex. « Charge de la série 1, en kilos ». */
  label: string;
  /** Largeur du champ : « wide » pour les charges (102,5), « narrow » pour les reps. */
  size?: 'wide' | 'narrow';
  decimal?: boolean;
  max?: number;
};

/** [ − ] nombre [ + ] : boutons de 48 px, et un tap sur le nombre ouvre le clavier numérique. */
export function NumberStepper({ value, onChange, step, unit, label, size = 'narrow', decimal = false, max = 999 }: Props) {
  // Texte en cours de frappe ; null quand le champ n'a pas le focus
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value === undefined ? '' : formatNumber(value));

  function bump(direction: -1 | 1) {
    const base = value ?? 0;
    // On se recale sur le pas : 41 + 2,5 → 42,5 ; 41 − 2,5 → 40
    const next = direction > 0 ? Math.floor(base / step + 1e-9) * step + step : Math.ceil(base / step - 1e-9) * step - step;
    onChange(Math.min(max, Math.max(0, Math.round(next * 100) / 100)));
  }

  return (
    <div className={styles.stepper}>
      <button
        type="button"
        className={styles.button}
        aria-label={t.session.less(label)}
        disabled={value === undefined || value <= 0}
        onClick={() => bump(-1)}
      >
        −
      </button>
      <label className={`${styles.field} ${size === 'wide' ? styles.wide : ''}`}>
        <input
          className={styles.input}
          type="text"
          inputMode={decimal ? 'decimal' : 'numeric'}
          enterKeyHint="done"
          autoComplete="off"
          aria-label={label}
          value={shown}
          placeholder="–"
          onFocus={(e) => {
            setDraft(shown);
            e.target.select();
          }}
          onChange={(e) => {
            setDraft(e.target.value);
            const parsed = parseDecimal(e.target.value);
            if (parsed === null) return;
            onChange(parsed === undefined ? undefined : Math.min(max, decimal ? parsed : Math.round(parsed)));
          }}
          onBlur={() => setDraft(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
        />
        <span className={styles.unit} aria-hidden="true">
          {unit}
        </span>
      </label>
      <button
        type="button"
        className={styles.button}
        aria-label={t.session.more(label)}
        disabled={value !== undefined && value >= max}
        onClick={() => bump(1)}
      >
        +
      </button>
    </div>
  );
}
