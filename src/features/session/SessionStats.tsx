import { formatMinutes, formatNumber } from '../../lib/format';
import type { SessionSummary } from '../../lib/stats';
import { t } from '../../lib/strings';
import styles from './SessionScreen.module.css';

/** Durée · séries · volume, en gros chiffres alignés. */
export function SessionStats({ summary }: { summary: SessionSummary }) {
  return (
    <dl className={styles.stats}>
      <div className={styles.stat}>
        <dt>{t.session.duration}</dt>
        <dd>{formatMinutes(summary.durationSec)}</dd>
      </div>
      <div className={styles.stat}>
        <dt>{t.session.doneSets}</dt>
        <dd>{summary.doneSets}</dd>
      </div>
      <div className={styles.stat}>
        <dt>{t.session.volume}</dt>
        <dd>
          {formatNumber(summary.volumeKg)}
          <span className={styles.statUnit}>&nbsp;kg</span>
        </dd>
      </div>
    </dl>
  );
}
