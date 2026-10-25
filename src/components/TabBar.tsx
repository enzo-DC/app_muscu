import { Link, useLocation } from 'react-router';
import { t } from '../lib/strings';
import { Icon } from './Icon';
import styles from './TabBar.module.css';

const TABS = [
  { to: '/', label: t.tabs.sessions, icon: 'list' },
  { to: '/historique', label: t.tabs.history, icon: 'clock' },
  { to: '/exercices', label: t.tabs.exercises, icon: 'dumbbell' },
] as const;

/** Onglet qui contient la page courante : tout ce qui n'est ni historique ni exercices relève de « Séances ». */
function activeTab(pathname: string): string {
  if (pathname.startsWith('/historique')) return '/historique';
  if (pathname.startsWith('/exercices')) return '/exercices';
  return '/';
}

export function TabBar() {
  const { pathname } = useLocation();
  const active = activeTab(pathname);
  return (
    <nav className={styles.bar} aria-label="Navigation principale">
      <ul className={styles.list}>
        {TABS.map((tab) => {
          const isActive = tab.to === active;
          return (
            <li key={tab.to}>
              <Link
                to={tab.to}
                className={`${styles.tab} ${isActive ? styles.active : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon name={tab.icon} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
