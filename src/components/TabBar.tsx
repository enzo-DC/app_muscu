import { NavLink } from 'react-router';
import { t } from '../lib/strings';
import { Icon } from './Icon';
import styles from './TabBar.module.css';

const TABS = [
  { to: '/', label: t.tabs.sessions, icon: 'list', end: true },
  { to: '/historique', label: t.tabs.history, icon: 'clock', end: false },
  { to: '/exercices', label: t.tabs.exercises, icon: 'dumbbell', end: false },
] as const;

export function TabBar() {
  return (
    <nav className={styles.bar} aria-label="Navigation principale">
      <ul className={styles.list}>
        {TABS.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
            >
              <Icon name={tab.icon} />
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
