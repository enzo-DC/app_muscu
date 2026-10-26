import type { ExerciseKind, SetEntry } from '../db/schema';
import { t } from './strings';

const numberFmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const shortDateFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

const longDateFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

/** « lundi 12 octobre à 18:05 » */
export function formatDateTime(timestamp: number): string {
  return `${longDateFmt.format(timestamp)} à ${timeFmt.format(timestamp)}`;
}

/** « lun. 12 oct. » */
export function formatShortDate(timestamp: number): string {
  return shortDateFmt.format(timestamp);
}

/**
 * Résumé d'une série : « 37,5 kg × 10 », « 12 reps » ou « 10 min ».
 * `short` : « 37,5 × 10 », pour les listes compactes.
 */
export function formatSet(set: SetEntry, kind: ExerciseKind, { short = false } = {}): string {
  const dash = '–';
  const nbsp = '\u00a0';
  if (kind === 'cardio') {
    const min = set.durationSec === undefined ? dash : formatNumber(Math.round(set.durationSec / 60));
    return `${min}${nbsp}${t.session.minutes}`;
  }
  const reps = set.reps === undefined ? dash : String(set.reps);
  if (kind === 'poids_du_corps') return `${reps}${nbsp}${t.session.reps}`;
  const kg = set.weightKg === undefined ? dash : formatNumber(set.weightKg);
  return short ? `${kg} × ${reps}` : `${kg}${nbsp}kg × ${reps}`;
}

export function formatNumber(n: number): string {
  return numberFmt.format(n);
}

export function formatKg(kg: number | undefined): string {
  return kg === undefined ? '—' : `${formatNumber(kg)}\u00a0kg`;
}

/**
 * Lit un nombre saisi au clavier (« 37,5 » ou « 37.5 »).
 * undefined si le champ est vide, null si la saisie n'est pas un nombre positif.
 */
export function parseDecimal(text: string): number | undefined | null {
  const clean = text.trim().replace(',', '.');
  if (clean === '') return undefined;
  if (!/^\d+(\.\d*)?$/.test(clean)) return null;
  return Number(clean);
}

/** 2700 → « 45 min », 3900 → « 1 h 05 » */
export function formatMinutes(totalSeconds: number): string {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}\u00a0h\u00a0${String(m).padStart(2, '0')}` : `${m}\u00a0min`;
}

/** 90 → « 1:30 », 3725 → « 1:02:05 » */
export function formatTimer(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}
