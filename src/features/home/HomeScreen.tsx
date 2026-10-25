import { Link } from 'react-router';
import { ButtonLink } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { t } from '../../lib/strings';
import styles from './HomeScreen.module.css';

export function HomeScreen() {
  return (
    <Screen
      title={t.home.title}
      action={
        <Link to="/reglages" className={styles.settingsLink} aria-label={t.home.settings}>
          <Icon name="gear" />
        </Link>
      }
    >
      <div className={styles.empty}>
        <p className={styles.emptyText}>{t.home.emptyText}</p>
        <ButtonLink to="/modeles/nouveau" variant="primary" block>
          {t.home.emptyCta}
        </ButtonLink>
      </div>
    </Screen>
  );
}
