import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { t } from '../lib/strings';
import { Icon } from './Icon';
import styles from './Screen.module.css';

type Props = {
  title: string;
  /** Lien de retour visible en haut à gauche. */
  backTo?: string;
  /** Action à droite de l'en-tête (ex. bouton réglages). */
  action?: ReactNode;
  children: ReactNode;
};

export function Screen({ title, backTo, action, children }: Props) {
  return (
    <>
      <header className={styles.header}>
        <div className={`${styles.bar} ${backTo ? styles.hasBack : ''}`}>
          {backTo && (
            <Link to={backTo} className={styles.iconButton} aria-label={t.back}>
              <Icon name="back" />
            </Link>
          )}
          <h1 className={styles.title}>{title}</h1>
          {action}
        </div>
      </header>
      <main className={styles.content}>{children}</main>
    </>
  );
}
