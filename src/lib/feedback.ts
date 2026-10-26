/**
 * Retours sensoriels (vibration, son) qui marchent aussi sur iPhone.
 *
 * - Android : navigator.vibrate.
 * - iPhone : pas de navigator.vibrate. Le seul retour haptique fiable vient d'un vrai
 *   <input type="checkbox" switch> touché par le doigt (voir SetRow) : Safari joue alors la
 *   vibration native. Déclencher cette vibration depuis le code a été bloqué dans iOS 26.5.
 * - Fin du repos (aucun doigt sur l'écran) : petit son, via Web Audio.
 */

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (context) return context;
  const Ctor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!Ctor) return null;
  try {
    context = new Ctor();
  } catch {
    return null;
  }
  return context;
}

/**
 * iOS n'autorise le son qu'après un geste de l'utilisateur : on « réveille » le contexte audio
 * au moment où il valide une série, pour pouvoir sonner à la fin du repos.
 */
export function unlockAudio(): void {
  const ctx = audioContext();
  if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
}

/** Deux bips courts et doux (fin du repos). Silencieux si le son n'est pas disponible. */
export function playRestEndSound(): void {
  const ctx = audioContext();
  if (!ctx || ctx.state !== 'running') return;
  const start = ctx.currentTime + 0.02;
  [0, 0.22].forEach((offset, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = i === 0 ? 880 : 1175; // la, puis ré : « c'est reparti »
    gain.gain.setValueAtTime(0, start + offset);
    gain.gain.linearRampToValueAtTime(0.25, start + offset + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start + offset);
    osc.stop(start + offset + 0.2);
  });
}

/** Vibre si le téléphone le permet (Android). Sans effet sur iPhone et ordinateur. */
export function vibrate(pattern: number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Non supporté : rien à faire
  }
}
