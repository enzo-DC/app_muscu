import { motion } from 'motion/react';
import { Icon } from '../../components/Icon';
import type { ExerciseKind, SetEntry } from '../../db/schema';
import { formatNumber } from '../../lib/format';
import { t } from '../../lib/strings';
import { NumberStepper } from './NumberStepper';
import styles from './SessionScreen.module.css';

type Props = {
  set: SetEntry;
  number: number;
  kind: ExerciseKind;
  weightStep: number;
  /** Déplié : la série en cours de saisie, avec les − / +. Sinon une ligne compacte. */
  expanded: boolean;
  onExpand: () => void;
  onChange: (values: Pick<SetEntry, 'weightKg' | 'reps' | 'durationSec'>) => void;
  onToggle: () => void;
};

/** « 37,5 kg × 10 », « 12 reps » ou « 10 min » selon le type d'exercice. */
function summary(set: SetEntry, kind: ExerciseKind): string {
  const dash = '–';
  if (kind === 'cardio') {
    return `${set.durationSec === undefined ? dash : formatNumber(Math.round(set.durationSec / 60))}\u00a0${t.session.minutes}`;
  }
  const reps = set.reps === undefined ? dash : String(set.reps);
  if (kind === 'poids_du_corps') return `${reps}\u00a0${t.session.reps}`;
  const kg = set.weightKg === undefined ? dash : formatNumber(set.weightKg);
  return `${kg}\u00a0kg × ${reps}`;
}

export function SetRow({ set, number, kind, weightStep, expanded, onExpand, onChange, onToggle }: Props) {
  const check = (
    <button
      type="button"
      className={`${styles.check} ${expanded ? styles.checkLarge : ''}`}
      aria-label={set.done ? t.session.unvalidate(number) : t.session.validate(number)}
      aria-pressed={set.done}
      onClick={onToggle}
    >
      <Icon name="check" size={expanded ? 36 : 28} />
    </button>
  );

  return (
    <motion.li
      className={`${styles.set} ${set.done ? styles.setDone : ''} ${expanded ? styles.setExpanded : ''}`}
      animate={set.done ? { scale: [0.98, 1] } : { scale: 1 }}
    >
      {expanded ? (
        <>
          <span className={styles.setLabel}>{t.session.setLabel(number)}</span>
          <div className={styles.setValues}>
            {kind === 'charge' && (
              <NumberStepper
                value={set.weightKg}
                onChange={(weightKg) => onChange({ weightKg })}
                step={weightStep}
                unit={t.session.weight}
                label={t.session.weightLabel(number)}
                size="wide"
                decimal
              />
            )}
            {kind === 'cardio' ? (
              <NumberStepper
                value={set.durationSec === undefined ? undefined : Math.round(set.durationSec / 60)}
                onChange={(min) => onChange({ durationSec: min === undefined ? undefined : min * 60 })}
                step={1}
                unit={t.session.minutes}
                label={t.session.minutesLabel(number)}
                size="wide"
              />
            ) : (
              <NumberStepper
                value={set.reps}
                onChange={(reps) => onChange({ reps })}
                step={1}
                unit={t.session.reps}
                label={t.session.repsLabel(number)}
                size="wide"
                max={99}
              />
            )}
          </div>
          {check}
        </>
      ) : (
        <>
          <button type="button" className={styles.setSummary} onClick={onExpand} aria-label={t.session.editSet(number)}>
            <span className={styles.setLabel}>{t.session.setLabel(number)}</span>
            <span className={styles.setSummaryValue}>{summary(set, kind)}</span>
          </button>
          {check}
        </>
      )}
    </motion.li>
  );
}
