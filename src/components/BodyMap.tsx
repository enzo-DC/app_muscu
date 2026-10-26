import { createBodyHighlighter } from 'body-highlighter';
import { useEffect, useRef } from 'react';
import type { Muscle } from '../db/schema';
import type { BodyView } from '../lib/muscles';
import { cssToken, useColorScheme } from '../lib/useColorScheme';
import styles from './BodyMap.module.css';

// Comme les autocollants des machines : corps gris, muscles travaillés en couleur.
// body-highlighter attend des couleurs : on lit les tokens --muscle-* (clair ou sombre).

type Props = {
  primary: readonly Muscle[];
  secondary?: readonly Muscle[];
  view: BodyView;
  /** Texte lu par les lecteurs d'écran ; sans label, le dessin est décoratif. */
  label?: string;
  className?: string;
};

/** Silhouette (face ou dos) avec les muscles principaux en brique, les secondaires en brique clair. */
export function BodyMap({ primary, secondary = [], view, label, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const primaryKey = primary.join();
  const secondaryKey = secondary.join();
  const scheme = useColorScheme();

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const instance = createBodyHighlighter({
      container,
      type: view,
      bodyColor: cssToken('--muscle-body', '#CFC9BF'),
      highlightedColors: [cssToken('--muscle-secondary', '#E8A88F'), cssToken('--muscle-primary', '#C94A22')],
      // Fréquence 1 → 1re couleur, 2 et plus → 2e couleur
      data: [
        { name: 'secondaire', muscles: secondaryKey ? secondaryKey.split(',') : [], frequency: 1 },
        { name: 'principal', muscles: primaryKey ? primaryKey.split(',') : [], frequency: 2 },
      ],
      svgStyle: { width: '100%', height: '100%' },
    });
    return () => instance.destroy();
  }, [view, primaryKey, secondaryKey, scheme]);

  return (
    <div
      ref={ref}
      className={`${styles.map} ${className ?? ''}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
