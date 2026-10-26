import { createBodyHighlighter } from 'body-highlighter';
import { useEffect, useRef } from 'react';
import type { Muscle } from '../db/schema';
import type { BodyView } from '../lib/muscles';
import styles from './BodyMap.module.css';

// Comme les autocollants des machines : corps gris, muscles travaillés en couleur.
// body-highlighter attend des couleurs en dur (pas de variables CSS) : mêmes valeurs que tokens.css.
const BODY = '#CFC9BF';
const SECONDARY = '#E8A88F'; // --accent éclairci
const PRIMARY = '#C94A22'; // --accent

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

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const instance = createBodyHighlighter({
      container,
      type: view,
      bodyColor: BODY,
      highlightedColors: [SECONDARY, PRIMARY],
      // Fréquence 1 → 1re couleur, 2 et plus → 2e couleur
      data: [
        { name: 'secondaire', muscles: secondaryKey ? secondaryKey.split(',') : [], frequency: 1 },
        { name: 'principal', muscles: primaryKey ? primaryKey.split(',') : [], frequency: 2 },
      ],
      svgStyle: { width: '100%', height: '100%' },
    });
    return () => instance.destroy();
  }, [view, primaryKey, secondaryKey]);

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
