import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-color-scheme: dark)';

function subscribe(onChange: () => void) {
  const media = typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : null;
  media?.addEventListener('change', onChange);
  return () => media?.removeEventListener('change', onChange);
}

function getSnapshot(): 'light' | 'dark' {
  return typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches ? 'dark' : 'light';
}

/** « light » ou « dark », mis à jour quand le téléphone change de mode. */
export function useColorScheme(): 'light' | 'dark' {
  return useSyncExternalStore(subscribe, getSnapshot, () => 'light');
}

/** Valeur d'un token CSS (ex. « --muscle-body »), avec une valeur de secours. */
export function cssToken(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}
