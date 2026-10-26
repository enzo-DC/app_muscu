import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { listFinishedSessions } from '../../db/sessions';
import { formatMinutes, formatShortDate } from '../../lib/format';
import { sessionSummary } from '../../lib/stats';
import { t } from '../../lib/strings';
import { groupByWeek } from '../../lib/weeks';
import styles from './History.module.css';

const weekdayFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });

export function HistoryScreen() {
  const sessions = useLiveQuery(listFinishedSessions);

  return (
    <Screen title={t.history.title}>
      {sessions?.length === 0 && <p className={styles.empty}>{t.history.empty}</p>}

      {sessions &&
        groupByWeek(sessions).map((week) => (
          <section key={week.weekStart} className={styles.week} aria-labelledby={`week-${week.weekStart}`}>
            <h2 id={`week-${week.weekStart}`} className={styles.weekTitle}>
              {week.label}
              <span className={styles.weekCount}>{t.history.sessionCount(week.items.length)}</span>
            </h2>
            <ul className={styles.list}>
              {week.items.map((s) => {
                const summary = sessionSummary(s);
                return (
                  <li key={s.id} className={styles.item}>
                    <Link to={`/historique/${s.id}`} className={styles.row}>
                      <span className={styles.date} aria-label={formatShortDate(s.startedAt)}>
                        <span className={styles.weekday} aria-hidden="true">
                          {weekdayFmt.format(s.startedAt)}
                        </span>
                        <span className={styles.day} aria-hidden="true">
                          {new Date(s.startedAt).getDate()}
                        </span>
                      </span>
                      <span className={styles.text}>
                        <span className={styles.name}>{s.name}</span>
                        <span className={styles.meta}>
                          {formatMinutes(summary.durationSec)} · {t.history.setCount(summary.doneSets)}
                        </span>
                      </span>
                      <span className={styles.chevron}>
                        <Icon name="chevron" size={20} />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
    </Screen>
  );
}
