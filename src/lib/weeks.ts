import { t } from './strings';

const DAY_MS = 24 * 60 * 60 * 1000;
const dayMonthFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

/** Lundi 00:00 (heure locale) de la semaine qui contient `timestamp`. */
export function startOfWeek(timestamp: number): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  const sinceMonday = (d.getDay() + 6) % 7; // dimanche = 6
  d.setDate(d.getDate() - sinceMonday);
  return d.getTime();
}

export type WeekGroup<T> = { weekStart: number; label: string; items: T[] };

function weekLabel(weekStart: number, now: number): string {
  const current = startOfWeek(now);
  if (weekStart === current) return t.history.thisWeek;
  // ±1 h de marge pour les changements d'heure
  if (Math.abs(current - weekStart - 7 * DAY_MS) < 2 * 60 * 60 * 1000) return t.history.lastWeek;
  return t.history.weekOf(dayMonthFmt.format(weekStart));
}

/** Groupe par semaine (lundi → dimanche), semaines et éléments du plus récent au plus ancien. */
export function groupByWeek<T extends { startedAt: number }>(items: T[], now = Date.now()): WeekGroup<T>[] {
  const sorted = [...items].sort((a, b) => b.startedAt - a.startedAt);
  const groups: WeekGroup<T>[] = [];
  for (const item of sorted) {
    const weekStart = startOfWeek(item.startedAt);
    const last = groups.at(-1);
    if (last && last.weekStart === weekStart) last.items.push(item);
    else groups.push({ weekStart, label: weekLabel(weekStart, now), items: [item] });
  }
  return groups;
}
