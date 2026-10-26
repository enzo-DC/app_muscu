import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion } from 'motion/react';
import { forwardRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import type { Exercise, SessionExercise } from '../../db/schema';
import { addSet, completeSet, getLastPerformance, uncompleteSet, updateSet } from '../../db/sessions';
import { formatSet, formatShortDate } from '../../lib/format';
import { spring } from '../../lib/motion';
import { vibrate } from '../../lib/rest';
import { setsProgress } from '../../lib/stats';
import { t } from '../../lib/strings';
import styles from './SessionScreen.module.css';
import { SetRow } from './SetRow';

type Props = {
  sessionId: string;
  index: number;
  item: SessionExercise;
  exercise: Exercise | undefined;
  open: boolean;
  weightStep: number;
  restSeconds: number;
  /** Micro-vibration à la validation d'une série (réglage « vibrer »). */
  haptics: boolean;
  onToggleOpen: () => void;
  /** Appelé quand une série est validée ; `exerciseComplete` si c'était la dernière à cocher. */
  onSetCompleted: (exerciseComplete: boolean) => void;
};

export const ExerciseCard = forwardRef<HTMLElement, Props>(function ExerciseCard(
  { sessionId, index, item, exercise, open, weightStep, restSeconds, haptics, onToggleOpen, onSetCompleted },
  ref,
) {
  const progress = setsProgress(item);
  const name = exercise?.name ?? '?';
  const kind = exercise?.kind ?? 'charge';
  // undefined = chargement, null = jamais fait
  const last = useLiveQuery(
    () => getLastPerformance(item.exerciseId).then((p) => p ?? null),
    [item.exerciseId],
  );
  const bodyId = `exercise-body-${index}`;
  // Série dépliée : celle choisie à la main, sinon la première qui reste à faire
  const [editing, setEditing] = useState<number | null>(null);
  const firstUndone = item.sets.findIndex((s) => !s.done);
  const current = editing ?? (firstUndone === -1 ? null : firstUndone);

  function toggleSet(setIndex: number) {
    const set = item.sets[setIndex];
    if (!set) return;
    if (set.done) {
      void uncompleteSet(sessionId, index, setIndex);
      return;
    }
    setEditing(null); // on passe à la série suivante
    if (haptics) vibrate([12]);
    void completeSet(sessionId, index, setIndex, restSeconds);
    onSetCompleted(progress.done + 1 === progress.total);
  }

  return (
    <section
      ref={ref}
      className={`${styles.card} ${open ? styles.cardOpen : ''} ${progress.complete ? styles.cardComplete : ''}`}
      aria-label={name}
    >
      <h2 className={styles.cardTitle}>
        <button
          type="button"
          className={styles.cardHeader}
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={onToggleOpen}
        >
          <span className={styles.cardName}>{name}</span>
          <span className={styles.progress}>{t.session.setsProgress(progress.done, progress.total)}</span>
          <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>
            <Icon name="chevron" size={20} />
          </span>
        </button>
      </h2>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={bodyId}
            key="body"
            className={styles.cardBody}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring.smooth}
          >
            {exercise?.note && <p className={styles.exerciseNote}>{exercise.note}</p>}
            {last !== undefined && (
              <p className={styles.lastTime}>
                {last ? (
                  <>
                    <span className={styles.lastTimeLabel}>
                      {t.session.lastTime} · {formatShortDate(last.date)}
                    </span>
                    <span className={styles.lastTimeSets}>
                      {last.sets.map((s) => formatSet(s, kind, { short: true })).join(' · ')}
                    </span>
                  </>
                ) : (
                  t.session.firstTime
                )}
              </p>
            )}
            <ol className={styles.sets}>
              {item.sets.map((set, setIndex) => (
                <SetRow
                  key={setIndex}
                  set={set}
                  previous={last?.sets[setIndex]}
                  number={setIndex + 1}
                  kind={kind}
                  weightStep={weightStep}
                  expanded={setIndex === current}
                  onExpand={() => setEditing(setIndex)}
                  onChange={(values) => void updateSet(sessionId, index, setIndex, values)}
                  onToggle={() => toggleSet(setIndex)}
                />
              ))}
            </ol>
            <button type="button" className={styles.textButton} onClick={() => void addSet(sessionId, index)}>
              {t.session.addSet}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
});
