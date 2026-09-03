import { describe, expect, it } from 'vitest';
import { haversineKm } from './geo';

const BERLIN = { lat: 52.52, lon: 13.405 };
const MUENCHEN = { lat: 48.1372, lon: 11.5756 };

describe('haversineKm', () => {
  it('T3-AC-02 measures Berlin to München as 504 km', () => {
    expect(haversineKm(BERLIN, MUENCHEN)).toBeGreaterThan(499);
    expect(haversineKm(BERLIN, MUENCHEN)).toBeLessThan(509);
  });

  it('is symmetric and zero for identical points', () => {
    expect(haversineKm(MUENCHEN, BERLIN)).toBeCloseTo(haversineKm(BERLIN, MUENCHEN), 6);
    expect(haversineKm(BERLIN, BERLIN)).toBe(0);
  });
});
