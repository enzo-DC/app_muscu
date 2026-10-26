import { motion } from 'motion/react';
import { Icon } from '../../components/Icon';
import type { ExerciseKind, SetEntry } from '../../db/schema';
import { formatSet } from '../../lib/format';
import { spring } from '../../lib/motion';
import { t } from '../../lib/strings';
import { NumberStepper } from './NumberStepper';
import styles from './SessionScreen.module.css';

type Props = {
  set: SetEntry;
  /** La même série lors de la dernière séance, si elle existe. */
  previous?: SetEntry;
  number: number;
  kind: ExerciseKind;
  weightStep: number;
  /** Déplié : la série en cours de saisie, avec les − / +. Sinon une ligne compacte. */
  expanded: boolean;
  onExpand: () => void;
  onChange: (values: Pick<SetEntry, 'weightKg' | 'reps' | 'durationSec'>) => void;
  onToggle: () => void;
};

export function SetRow({ set, previous, number, kind, weightStep, expanded, onExpand, onChange, onToggle }: Props) {
  // La case ✓ est un vrai interrupteur iOS (<input type="checkbox" switch>), invisible, posé sur le dessin :
  // quand le doigt le touche, Safari joue la vibration native de l'iPhone (seul retour haptique possible sur le web).
  const check = (
    <label className={`${styles.check} ${expanded ? styles.checkLarge : ''}`}>
      <input
        ref={(el) => el?.setAttribute('switch', '')}
        type="checkbox"
        className={styles.checkInput}
        aria-label={set.done ? t.session.unvalidate(number) : t.session.validate(number)}
        checked={set.done}
        onChange={onToggle}
      />
      {/* Petit « pop » à ressort quand la série est validée */}
      <motion.span
        className={styles.checkIcon}
        aria-hidden="true"
        animate={set.done ? { scale: [0.5, 1.2, 1] } : { scale: 1 }}
        transition={spring.bouncy}
      >
        <Icon name="check" size={expanded ? 36 : 28} />
      </motion.span>
    </label>
  );

  return (
    <motion.li
      className={`${styles.set} ${set.done ? styles.setDone : ''} ${expanded ? styles.setExpanded : ''}`}
      animate={set.done ? { scale: [0.98, 1] } : { scale: 1 }}
      transition={spring.smooth}
    >
      {expanded ? (
        <>
          <span className={styles.setLabel}>
            {t.session.setLabel(number)}
            {previous && (
              <span className={styles.setPrevious}>{t.session.lastTimeSet(formatSet(previous, kind))}</span>
            )}
          </span>
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
            <span className={styles.setSummaryValue}>{formatSet(set, kind)}</span>
          </button>
          {check}
        </>
      )}
    </motion.li>
  );
}
