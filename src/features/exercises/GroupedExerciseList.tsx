import type { ReactNode } from 'react';
import type { Exercise } from '../../db/schema';
import { groupExercises } from '../../lib/search';
import { t } from '../../lib/strings';
import styles from './GroupedExerciseList.module.css';

type Props = {
  exercises: Exercise[];
  renderItem: (exercise: Exercise) => ReactNode;
};

/** Exercices groupés par zone, une section par zone avec un titre et un compteur. */
export function GroupedExerciseList({ exercises, renderItem }: Props) {
  return groupExercises(exercises).map(({ group, exercises: items }) => (
    <section key={group} className={styles.section} aria-labelledby={`group-${group}`}>
      <h2 id={`group-${group}`} className={styles.groupTitle}>
        {t.groups[group]}
        <span className={styles.count}>{items.length}</span>
      </h2>
      <ul className={styles.list}>
        {items.map((ex) => (
          <li key={ex.id} className={styles.item}>
            {renderItem(ex)}
          </li>
        ))}
      </ul>
    </section>
  ));
}
