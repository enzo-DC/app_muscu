const numberFmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

export function formatNumber(n: number): string {
  return numberFmt.format(n);
}

export function formatKg(kg: number | undefined): string {
  return kg === undefined ? '—' : `${formatNumber(kg)}\u00a0kg`;
}

/** 90 → « 1:30 », 3725 → « 1:02:05 » */
export function formatTimer(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}
