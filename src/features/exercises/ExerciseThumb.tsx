import { BodyMap } from '../../components/BodyMap';
import type { Exercise } from '../../db/schema';
import { bestView, exerciseMuscles } from '../../lib/muscles';
import { t } from '../../lib/strings';
import styles from './Exercises.module.css';

/** Vignette du muscle ciblé + nom + matériel, pour les lignes de liste. */
export function ExerciseThumb({ exercise }: { exercise: Exercise }) {
  const { primary, secondary } = exerciseMuscles(exercise);
  const meta = [exercise.equipment && t.equipment[exercise.equipment], exercise.level && t.levels[exercise.level]].filter(
    Boolean,
  );
  return (
    <>
      <BodyMap primary={primary} secondary={secondary} view={bestView(primary)} className={styles.thumb} />
      <span className={styles.rowText}>
        <span className={styles.rowName}>{exercise.name}</span>
        {meta.length > 0 && <span className={styles.rowMeta}>{meta.join(' · ')}</span>}
        {exercise.note && <span className={styles.rowNote}>{exercise.note}</span>}
      </span>
    </>
  );
}
