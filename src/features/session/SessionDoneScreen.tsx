import { useLiveQuery } from 'dexie-react-hooks';
import { useParams } from 'react-router';
import { ButtonLink } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { getSession } from '../../db/sessions';
import { sessionSummary } from '../../lib/stats';
import { t } from '../../lib/strings';
import styles from './SessionScreen.module.css';
import { SessionStats } from './SessionStats';

export function SessionDoneScreen() {
  const { id = '' } = useParams();
  const session = useLiveQuery(() => getSession(id).then((s) => s ?? null), [id]);

  if (session === undefined) return null;
  return (
    <Screen title={t.session.doneTitle}>
      <div className={styles.done}>
        <p className={styles.doneText}>{t.session.doneText}</p>
        {session && (
          <>
            <p className={styles.doneName}>{session.name}</p>
            <SessionStats summary={sessionSummary(session)} />
            <p className={styles.volumeHelp}>{t.session.volumeHelp}</p>
          </>
        )}
        <ButtonLink to="/" variant="primary" block replace>
          {t.session.backHome}
        </ButtonLink>
      </div>
    </Screen>
  );
}
