import { useLiveQuery } from 'dexie-react-hooks';
import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ButtonLink } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Screen } from '../../components/Screen';
import { getExercisesById } from '../../db/exercises';
import type { Exercise, Session, Settings } from '../../db/schema';
import { deleteSession, finishSession, getActiveSession } from '../../db/sessions';
import { getSettings } from '../../db/settings';
import { formatTimer } from '../../lib/format';
import { sessionSummary, setsProgress } from '../../lib/stats';
import { t } from '../../lib/strings';
import { useNow } from '../../lib/useNow';
import { ExerciseCard } from './ExerciseCard';
import { RestTimer } from './RestTimer';
import styles from './SessionScreen.module.css';
import { SessionStats } from './SessionStats';

export function SessionScreen() {
  // null = aucune séance en cours, undefined = chargement
  const session = useLiveQuery(() => getActiveSession().then((s) => s ?? null));
  const exercisesById = useLiveQuery(getExercisesById);
  const settings = useLiveQuery(getSettings);

  if (session === undefined || !exercisesById || !settings) return null;
  if (session === null) {
    return (
      <Screen title={t.session.inProgress} backTo="/">
        <p className={styles.none}>{t.session.none}</p>
        <ButtonLink to="/" block>
          {t.session.backHome}
        </ButtonLink>
      </Screen>
    );
  }
  return (
    <ActiveSession
      key={session.id}
      session={session}
      exercisesById={exercisesById}
      settings={settings}
    />
  );
}

/** Premier exercice pas encore fini après `after` (en reprenant au début si besoin), hors `skip`. */
function firstIncomplete(session: Session, after = -1, skip?: number): number | null {
  const n = session.exercises.length;
  for (let k = 1; k <= n; k++) {
    const i = (after + k + n) % n;
    if (i !== skip && !setsProgress(session.exercises[i]!).complete) return i;
  }
  return null;
}

type ActiveProps = { session: Session; exercisesById: Map<string, Exercise>; settings: Settings };

function ActiveSession({ session, exercisesById, settings }: ActiveProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const now = useNow();
  const openLast = (location.state as { openLast?: boolean } | null)?.openLast === true;
  const [openIndex, setOpenIndex] = useState<number | null>(() =>
    openLast ? session.exercises.length - 1 : (firstIncomplete(session) ?? 0),
  );
  const [dialog, setDialog] = useState<'finish' | 'delete' | null>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const scrollOnOpen = useRef(openLast);
  const reduceMotion = useReducedMotion();

  // Amène la carte qui vient de s'ouvrir automatiquement en haut de l'écran
  useEffect(() => {
    if (!scrollOnOpen.current || openIndex === null) return;
    scrollOnOpen.current = false;
    // Laisse le temps à la carte précédente de se replier
    const timer = setTimeout(
      () =>
        cardRefs.current[openIndex]?.scrollIntoView?.({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' }),
      220,
    );
    return () => clearTimeout(timer);
  }, [openIndex, reduceMotion]);

  function handleSetCompleted(index: number, exerciseComplete: boolean) {
    if (!exerciseComplete) return;
    // Exercice fini : on déplie le suivant qui reste à faire
    const next = firstIncomplete(session, index, index);
    if (next !== null) {
      scrollOnOpen.current = true;
      setOpenIndex(next);
    }
  }

  async function handleFinish() {
    setDialog(null);
    await finishSession(session.id);
    navigate(`/seance/terminee/${session.id}`, { replace: true });
  }

  async function handleDelete() {
    setDialog(null);
    await deleteSession(session.id);
    navigate('/', { replace: true });
  }

  const summary = sessionSummary(session, now);
  const hasUndone = session.exercises.some((e) => e.sets.some((s) => !s.done));

  return (
    <Screen
      title={session.name}
      backTo="/"
      background="grid"
      action={
        <div className={`${styles.headerActions} glass`}>
          <span className={styles.clock} role="timer" aria-label={t.session.elapsed}>
            {formatTimer(summary.durationSec)}
          </span>
          <button type="button" className={`${styles.finishButton} glass-press`} onClick={() => setDialog('finish')}>
            {t.session.finish}
          </button>
        </div>
      }
    >
      {session.exercises.length === 0 && <p className={styles.none}>{t.session.emptyFree}</p>}

      <div className={styles.cards}>
        {session.exercises.map((item, index) => (
          <ExerciseCard
            key={`${item.exerciseId}-${index}`}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            sessionId={session.id}
            index={index}
            item={item}
            exercise={exercisesById.get(item.exerciseId)}
            open={openIndex === index}
            weightStep={settings.weightStep}
            restSeconds={settings.defaultRestSeconds}
            haptics={settings.vibrate}
            onToggleOpen={() => setOpenIndex(openIndex === index ? null : index)}
            onSetCompleted={(complete) => handleSetCompleted(index, complete)}
          />
        ))}
      </div>

      <div className={styles.footer}>
        <ButtonLink to="/seance/exercices" block>
          {t.session.addExercise}
        </ButtonLink>
        <button type="button" className={styles.deleteLink} onClick={() => setDialog('delete')}>
          {t.session.delete}
        </button>
      </div>

      {/* Place pour que le bandeau de repos ne cache pas le bas de la page */}
      {session.rest && <div className={styles.restSpacer} aria-hidden="true" />}
      <RestTimer session={session} vibrateEnabled={settings.vibrate} soundEnabled={settings.sound !== false} />

      <ConfirmDialog
        open={dialog === 'finish'}
        tone="primary"
        title={t.session.finishTitle}
        message={t.session.finishMessage}
        confirmLabel={t.session.finishConfirm}
        cancelLabel={t.session.keepGoing}
        onConfirm={() => void handleFinish()}
        onCancel={() => setDialog(null)}
      >
        <SessionStats summary={summary} />
        {hasUndone && <p className={styles.undoneWarning}>{t.session.finishUndone}</p>}
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === 'delete'}
        title={t.session.deleteTitle}
        message={t.session.deleteMessage}
        confirmLabel={t.session.deleteConfirm}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDialog(null)}
      />
    </Screen>
  );
}
