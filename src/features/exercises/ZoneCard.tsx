import { Link } from 'react-router';
import { BodyMap } from '../../components/BodyMap';
import type { MuscleGroup } from '../../db/schema';
import { GROUP_MUSCLES, viewsFor } from '../../lib/muscles';
import { t } from '../../lib/strings';
import styles from './Exercises.module.css';

type Props = {
  group: MuscleGroup;
  count: number;
  /** Petite mention sous le nombre, ex. « 2 ajoutés ». */
  badge?: string;
} & ({ to: string; onSelect?: never } | { onSelect: () => void; to?: never });

/** Carte d'une zone : silhouette grise avec toute la zone en couleur, nom et nombre d'exercices. */
export function ZoneCard({ group, count, badge, to, onSelect }: Props) {
  const muscles = GROUP_MUSCLES[group];
  const label = t.exercises.zoneLink(t.groups[group], count) + (badge ? `, ${badge}` : '');
  const content = (
    <>
      <span className={styles.zoneBodies}>
        {viewsFor(muscles).map((view) => (
          <BodyMap key={view} primary={muscles} view={view} className={styles.zoneBody} />
        ))}
      </span>
      <span className={styles.zoneName}>{t.groups[group]}</span>
      <span className={styles.zoneCount}>{t.exercises.count(count)}</span>
      {badge && <span className={styles.zoneBadge}>{badge}</span>}
    </>
  );
  return to ? (
    <Link to={to} className={styles.zone} aria-label={label}>
      {content}
    </Link>
  ) : (
    <button type="button" className={styles.zone} aria-label={label} onClick={onSelect}>
      {content}
    </button>
  );
}
