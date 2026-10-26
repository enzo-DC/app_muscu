import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Screen } from '../../components/Screen';
import { getExercisesById } from '../../db/exercises';
import { deleteSession, getSession } from '../../db/sessions';
import { formatDateTime, formatSet } from '../../lib/format';
import { sessionSummary } from '../../lib/stats';
import { t } from '../../lib/strings';
import { SessionStats } from '../session/SessionStats';
import styles from './History.module.css';

export function HistoryDetailScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  // null = introuvable (ou pas encore terminée), undefined = chargement
  const session = useLiveQuery(
    () => getSession(id).then((s) => (s && s.finishedAt !== undefined ? s : null)),
    [id],
  );
  const exercisesById = useLiveQuery(getExercisesById);
  const [confirming, setConfirming] = useState(false);

  if (session === undefined || !exercisesById) return null;
  if (session === null) {
    return (
      <Screen title={t.history.detailTitle} backTo="/historique">
        <p>{t.history.notFound}</p>
      </Screen>
    );
  }

  async function handleDelete() {
    setConfirming(false);
    await deleteSession(id);
    navigate('/historique', { replace: true });
  }

  return (
    <Screen title={session.name} backTo="/historique">
      <p className={styles.when}>{formatDateTime(session.startedAt)}</p>
      <SessionStats summary={sessionSummary(session)} />

      {session.exercises.map((item, index) => {
        const exercise = exercisesById.get(item.exerciseId);
        const kind = exercise?.kind ?? 'charge';
        return (
          <section key={`${item.exerciseId}-${index}`} className={styles.exercise} aria-label={exercise?.name ?? '?'}>
            <h2 className={styles.exerciseName}>{exercise?.name ?? '?'}</h2>
            <ol className={styles.sets}>
              {item.sets.map((set, setIndex) => (
                <li key={setIndex} className={styles.set}>
                  <span className={styles.setNumber}>{t.session.setLabel(setIndex + 1)}</span>
                  <span className={styles.setValue}>{formatSet(set, kind)}</span>
                </li>
              ))}
            </ol>
          </section>
        );
      })}

      <div className={styles.dangerZone}>
        <Button block className={styles.deleteButton} onClick={() => setConfirming(true)}>
          {t.history.delete}
        </Button>
      </div>

      <ConfirmDialog
        open={confirming}
        title={t.history.deleteTitle}
        message={t.history.deleteMessage}
        confirmLabel={t.history.deleteConfirm}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirming(false)}
      />
    </Screen>
  );
}
