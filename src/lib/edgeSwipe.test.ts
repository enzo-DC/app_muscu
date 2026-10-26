import { describe, expect, it } from 'vitest';
import { shouldGoBack } from './edgeSwipe';

describe('retour par balayage', () => {
  const width = 390;

  it('revient en arrière au-delà d’un tiers de l’écran', () => {
    expect(shouldGoBack(140, 600, width)).toBe(true);
    expect(shouldGoBack(120, 600, width)).toBe(false);
  });

  it('revient en arrière sur un geste rapide, même court', () => {
    expect(shouldGoBack(60, 80, width)).toBe(true);
    expect(shouldGoBack(30, 20, width)).toBe(false); // trop court
  });

  it('ignore un geste vers la gauche', () => {
    expect(shouldGoBack(-200, 100, width)).toBe(false);
  });
});
