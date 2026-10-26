import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import type { Session } from '../../db/schema';
import { adjustRest, clearRest } from '../../db/sessions';
import { formatTimer } from '../../lib/format';
import { spring } from '../../lib/motion';
import { REST_ADJUST_SEC, restState, vibrate } from '../../lib/rest';
import { t } from '../../lib/strings';
import { useNow } from '../../lib/useNow';
import styles from './RestTimer.module.css';

type Props = { session: Session; vibrateEnabled: boolean };

/** Bandeau du minuteur de repos, en bas de l'écran de séance. */
export function RestTimer({ session, vibrateEnabled }: Props) {
  const now = useNow(250);
  const { rest } = session;
  const state = restState(rest, now);
  const notifiedFor = useRef<number | null>(null);

  // Fin du repos : une vibration, une seule fois par repos
  useEffect(() => {
    if (state.phase !== 'done' || !rest || notifiedFor.current === rest.endsAt) return;
    notifiedFor.current = rest.endsAt;
    // Pas de vibration si on rouvre l'app longtemps après la fin
    if (vibrateEnabled && Date.now() - rest.endsAt < 3000) vibrate([200, 100, 200]);
  }, [state.phase, rest, vibrateEnabled]);

  // Le bandeau a disparu : on efface le repos de la séance
  useEffect(() => {
    if (state.phase === 'gone' && rest) void clearRest(session.id);
  }, [state.phase, rest, session.id]);

  const done = state.phase === 'done';

  return (
    <>
      {/* Annonce lecteur d'écran uniquement à la fin, pas à chaque seconde */}
      <p className="visually-hidden" aria-live="polite">
        {done ? t.session.restDone : ''}
      </p>
      <AnimatePresence>
        {state.phase !== 'gone' && (
          <motion.aside
            key="rest"
            className={`${styles.banner} ${done ? styles.done : ''}`}
            aria-label={t.session.rest}
            initial={{ y: 120, scale: 0.9, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 120, scale: 0.9, opacity: 0 }}
            transition={spring.smooth}
          >
            <div className={styles.row}>
              {done ? (
                <p className={styles.doneText}>{t.session.restDone}</p>
              ) : (
                <p className={styles.time} role="timer">
                  <span className={styles.label}>{t.session.rest}</span>
                  <span className={styles.clock}>{formatTimer(state.remainingSec)}</span>
                </p>
              )}
              {!done && (
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.button}
                    aria-label={t.session.restLess}
                    onClick={() => void adjustRest(session.id, -REST_ADJUST_SEC)}
                  >
                    {t.session.restLessShort}
                  </button>
                  <button
                    type="button"
                    className={styles.button}
                    aria-label={t.session.restMore}
                    onClick={() => void adjustRest(session.id, REST_ADJUST_SEC)}
                  >
                    {t.session.restMoreShort}
                  </button>
                  <button
                    type="button"
                    className={styles.button}
                    aria-label={t.session.restSkipLabel}
                    onClick={() => void clearRest(session.id)}
                  >
                    {t.session.restSkip}
                  </button>
                </div>
              )}
            </div>
            <div className={styles.track} aria-hidden="true">
              <div className={styles.bar} style={{ transform: `scaleX(${state.progress})` }} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
