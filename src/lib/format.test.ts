import { describe, expect, it } from 'vitest';
import { formatKg, formatNumber, formatTimer } from './format';

describe('format', () => {
  it('formate les nombres en fr-FR avec virgule décimale', () => {
    expect(formatNumber(37.5)).toBe('37,5');
    expect(formatNumber(40)).toBe('40');
    expect(formatNumber(1250)).toBe('1\u202f250');
  });

  it('formate une charge', () => {
    expect(formatKg(37.5)).toBe('37,5\u00a0kg');
    expect(formatKg(undefined)).toBe('—');
  });

  it('formate un minuteur m:ss', () => {
    expect(formatTimer(90)).toBe('1:30');
    expect(formatTimer(5)).toBe('0:05');
    expect(formatTimer(3725)).toBe('1:02:05');
    expect(formatTimer(-3)).toBe('0:00');
  });
});
