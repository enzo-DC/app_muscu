import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate } from 'react-router';
import { Button, ButtonLink } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { getExercisesById } from '../../db/exercises';
import type { Session } from '../../db/schema';
import { getActiveSession, startSession } from '../../db/sessions';
import { listTemplates } from '../../db/templates';
import { formatMinutes } from '../../lib/format';
import { sessionSummary } from '../../lib/stats';
import { t } from '../../lib/strings';
import { useNow } from '../../lib/useNow';
import styles from './HomeScreen.module.css';

export function HomeScreen() {
  const navigate = useNavigate();
  const templates = useLiveQuery(listTemplates);
  const exercisesById = useLiveQuery(getExercisesById);
  // null = pas de séance en cours, undefined = chargement
  const active = useLiveQuery(() => getActiveSession().then((s) => s ?? null));

  if (!templates || !exercisesById || active === undefined) return <Screen title={t.home.title}>{null}</Screen>;

  async function start(templateId?: string) {
    await startSession(templateId);
    navigate('/seance');
  }

  return (
    <Screen
      title={t.home.title}
      action={
        <Link to="/reglages" className={`${styles.settingsLink} glass glass-press`} aria-label={t.home.settings}>
          <Icon name="gear" />
        </Link>
      }
    >
      {active && <ResumeCard session={active} />}

      {templates.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>{t.home.emptyText}</p>
          <ButtonLink to="/modeles/nouveau" variant={active ? 'secondary' : 'primary'} block>
            {t.home.emptyCta}
          </ButtonLink>
          {!active && (
            <Button block onClick={() => void start()}>
              {t.session.free}
            </Button>
          )}
        </div>
      ) : (
        <>
          <ul className={styles.templates}>
            {templates.map((tpl) => (
              <li key={tpl.id} className={styles.template}>
                <Link to={`/modeles/${tpl.id}`} className={styles.templateLink}>
                  <span className={styles.templateName}>{tpl.name}</span>
                  <span className={styles.templateMeta}>
                    {t.templates.exerciseCount(tpl.exercises.length)}
                    {tpl.exercises.length > 0 && ' · '}
                    {tpl.exercises.map((e) => exercisesById.get(e.exerciseId)?.name ?? '?').join(', ')}
                  </span>
                </Link>
                {/* Une seule séance à la fois : pas de « Démarrer » tant qu'une séance est en cours */}
                {!active && (
                  <Button
                    className={styles.startButton}
                    aria-label={t.session.startLabel(tpl.name)}
                    disabled={tpl.exercises.length === 0}
                    onClick={() => void start(tpl.id)}
                  >
                    {t.session.start}
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <div className={styles.secondaryActions}>
            {!active && (
              <Button block onClick={() => void start()}>
                {t.session.free}
              </Button>
            )}
            <ButtonLink to="/modeles/nouveau" block>
              {t.templates.newCta}
            </ButtonLink>
          </div>
        </>
      )}
    </Screen>
  );
}

function ResumeCard({ session }: { session: Session }) {
  const now = useNow(30_000);
  const { durationSec } = sessionSummary(session, now);
  return (
    <section className={styles.resume} aria-labelledby="resume-title">
      <p id="resume-title" className={styles.resumeLabel}>
        {t.session.inProgress}
      </p>
      <p className={styles.resumeName}>{session.name}</p>
      <p className={styles.resumeMeta}>
        {durationSec < 60 ? t.session.justStarted : t.session.since(formatMinutes(durationSec))}
      </p>
      <ButtonLink to="/seance" variant="primary" block>
        {t.session.resume}
      </ButtonLink>
    </section>
  );
}
