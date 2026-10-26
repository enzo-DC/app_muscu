import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { spring } from '../lib/motion';
import { t } from '../lib/strings';
import { Icon } from './Icon';
import styles from './Screen.module.css';

type Props = {
  title: string;
  /** Lien de retour visible en haut à gauche. */
  backTo?: string;
  /** Action à droite de la barre (ex. bouton réglages). */
  action?: ReactNode;
  /** « grid » : léger quadrillage de carnet en fond (écran de séance uniquement). */
  background?: 'grid';
  children: ReactNode;
};

/**
 * Écran « à la iOS » : barre de verre collée en haut, grand titre dans la page,
 * et petit titre centré qui apparaît dans la barre quand le grand titre passe dessous.
 */
export function Screen({ title, backTo, action, background, children }: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = titleRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    // Le grand titre est « sous » la barre dès qu'il dépasse sa hauteur
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry?.isIntersecting), {
      rootMargin: '-64px 0px 0px 0px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.bar}>
          <div className={styles.side}>
            {backTo && (
              <Link to={backTo} className={styles.back} aria-label={t.back}>
                <Icon name="back" size={22} />
                <span className={styles.backLabel} aria-hidden="true">
                  {t.back}
                </span>
              </Link>
            )}
          </div>
          <AnimatePresence>
            {scrolled && (
              <motion.span
                key="title"
                className={styles.compactTitle}
                aria-hidden="true"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={spring.snappy}
              >
                {title}
              </motion.span>
            )}
          </AnimatePresence>
          <div className={`${styles.side} ${styles.sideEnd}`}>{action}</div>
        </div>
      </header>
      <div className={background === 'grid' ? styles.grid : undefined}>
        <main className={styles.content}>
          <h1 ref={titleRef} className={styles.largeTitle}>
            {title}
          </h1>
          {children}
        </main>
      </div>
    </>
  );
}
