import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { formatNumber, parseDecimal } from '../../lib/format';
import { spring } from '../../lib/motion';
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
  // Dernière valeur envoyée par − / +, tant que la base ne l'a pas encore renvoyée :
  // deux taps rapides doivent bien faire deux pas.
  const [pending, setPending] = useState<number | null>(null);
  if (pending !== null && value === pending) setPending(null);
  const current = pending ?? value;

  // Sens du défilement des chiffres : vers le haut quand ça monte, vers le bas quand ça descend
  const [roll, setRoll] = useState<{ value: number | undefined; direction: 1 | -1 }>({ value: current, direction: 1 });
  if (roll.value !== current) {
    setRoll({ value: current, direction: (current ?? 0) >= (roll.value ?? 0) ? 1 : -1 });
  }

  const formatted = current === undefined ? '' : formatNumber(current);
  const editing = draft !== null;

  function bump(direction: -1 | 1) {
    const base = current ?? 0;
    // On se recale sur le pas : 41 + 2,5 → 42,5 ; 41 − 2,5 → 40
    const raw = direction > 0 ? Math.floor(base / step + 1e-9) * step + step : Math.ceil(base / step - 1e-9) * step - step;
    const next = Math.min(max, Math.max(0, Math.round(raw * 100) / 100));
    setPending(next);
    onChange(next);
  }

  return (
    <div className={styles.stepper}>
      <button
        type="button"
        className={styles.button}
        aria-label={t.session.less(label)}
        disabled={current === undefined || current <= 0}
        onClick={() => bump(-1)}
      >
        −
      </button>
      <label className={`${styles.field} ${size === 'wide' ? styles.wide : ''}`}>
        <span className={styles.number}>
          <input
            className={`${styles.input} ${editing ? '' : styles.inputHidden}`}
            type="text"
            inputMode={decimal ? 'decimal' : 'numeric'}
            enterKeyHint="done"
            autoComplete="off"
            aria-label={label}
            value={draft ?? formatted}
            placeholder="–"
            onFocus={(e) => {
              setPending(null);
              setDraft(formatted);
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
          {/* Chiffres qui défilent, affichés par-dessus le champ quand on ne tape pas */}
          {!editing && (
            <span className={styles.roller} aria-hidden="true">
              <AnimatePresence initial={false} custom={roll.direction} mode="popLayout">
                <motion.span
                  key={formatted || '–'}
                  className={styles.rollValue}
                  custom={roll.direction}
                  variants={{
                    enter: (d: number) => ({ y: d * 18, opacity: 0 }),
                    center: { y: 0, opacity: 1 },
                    exit: (d: number) => ({ y: d * -18, opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={spring.snappy}
                >
                  {formatted || '–'}
                </motion.span>
              </AnimatePresence>
            </span>
          )}
        </span>
        <span className={styles.unit} aria-hidden="true">
          {unit}
        </span>
      </label>
      <button
        type="button"
        className={styles.button}
        aria-label={t.session.more(label)}
        disabled={current !== undefined && current >= max}
        onClick={() => bump(1)}
      >
        +
      </button>
    </div>
  );
}
