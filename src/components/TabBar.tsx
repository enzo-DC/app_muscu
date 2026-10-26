import { motion } from 'motion/react';
import { Link, useLocation } from 'react-router';
import { spring } from '../lib/motion';
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

const MotionLink = motion.create(Link);

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
              <MotionLink
                to={tab.to}
                className={`${styles.tab} ${isActive ? styles.active : ''}`}
                aria-current={isActive ? 'page' : undefined}
                whileTap={{ scale: 0.9 }}
                transition={spring.snappy}
              >
                <motion.span
                  className={styles.icon}
                  animate={{ scale: isActive ? 1.08 : 1 }}
                  transition={spring.bouncy}
                >
                  <Icon name={tab.icon} size={26} />
                </motion.span>
                {tab.label}
              </MotionLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
