import { useEffect, type RefObject } from 'react';

/** Largeur de la bande, depuis le bord gauche, où le geste peut commencer (comme iOS). */
const EDGE = 24;

/** Le geste est validé s'il dépasse un tiers de l'écran, ou s'il est rapide (« flick »). */
export function shouldGoBack(dx: number, durationMs: number, width: number): boolean {
  if (dx <= 0) return false;
  const velocity = dx / Math.max(1, durationMs); // px / ms
  return dx > width / 3 || (velocity > 0.5 && dx > 40);
}

/** Vrai quand l'app tourne installée sur l'écran d'accueil (pas dans Safari). */
export function isStandalone(): boolean {
  const media = typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
  return media || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/**
 * Retour par balayage depuis le bord gauche, comme sur iPhone : l'écran suit le doigt,
 * puis part (et on revient en arrière) ou revient en place.
 * Seulement en mode installé : dans Safari, le navigateur a déjà ce geste.
 */
export function useEdgeSwipeBack(ref: RefObject<HTMLElement | null>, onBack: (() => void) | undefined): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || !onBack || !isStandalone()) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    let start: { x: number; y: number; t: number } | null = null;
    let horizontal = false;
    let dx = 0;

    const reset = () => {
      el.style.transition = reduceMotion ? 'none' : 'transform 380ms cubic-bezier(0.34, 1.4, 0.64, 1)';
      el.style.transform = '';
      el.style.boxShadow = '';
    };

    const onStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch || e.touches.length > 1 || touch.clientX > EDGE) return;
      start = { x: touch.clientX, y: touch.clientY, t: performance.now() };
      horizontal = false;
      dx = 0;
    };

    const onMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!start || !touch) return;
      const moveX = touch.clientX - start.x;
      const moveY = touch.clientY - start.y;
      if (!horizontal) {
        // Geste vertical : c'est un défilement, on abandonne
        if (Math.abs(moveY) > 10 && Math.abs(moveY) > Math.abs(moveX)) {
          start = null;
          return;
        }
        if (moveX < 8) return;
        horizontal = true;
      }
      e.preventDefault(); // pas de défilement pendant le geste
      dx = Math.max(0, moveX);
      el.style.transition = 'none';
      el.style.transform = `translateX(${dx}px)`;
      el.style.boxShadow = '-12px 0 24px rgb(0 0 0 / 0.12)';
    };

    const onEnd = () => {
      if (!start || !horizontal) {
        start = null;
        return;
      }
      const goBack = shouldGoBack(dx, performance.now() - start.t, window.innerWidth);
      start = null;
      if (!goBack) {
        reset();
        return;
      }
      el.style.transition = reduceMotion ? 'none' : 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)';
      el.style.transform = `translateX(${window.innerWidth}px)`;
      window.setTimeout(onBack, reduceMotion ? 0 : 160);
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [ref, onBack]);
}
