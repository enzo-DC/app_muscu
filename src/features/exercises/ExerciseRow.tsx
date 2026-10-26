import { Link } from 'react-router';
import { Icon } from '../../components/Icon';
import type { Exercise } from '../../db/schema';
import styles from './Exercises.module.css';
import { ExerciseThumb } from './ExerciseThumb';

/** Ligne d'exercice qui ouvre sa fiche. */
export function ExerciseRow({ exercise }: { exercise: Exercise }) {
  return (
    <Link to={`/exercices/${exercise.id}`} className={styles.row}>
      <ExerciseThumb exercise={exercise} />
      <span className={styles.chevron}>
        <Icon name="chevron" size={20} />
      </span>
    </Link>
  );
}
