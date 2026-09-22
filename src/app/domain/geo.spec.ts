import { describe, expect, it } from 'vitest';
import { haversineKm } from './geo';

const BERLIN = { lat: 52.52, lon: 13.405 };
const MUNICH = { lat: 48.1372, lon: 11.5756 };

describe('haversineKm', () => {
  it('T3-AC-02 measures Berlin to Munich as 504 km', () => {
    expect(haversineKm(BERLIN, MUNICH)).toBeGreaterThan(499);
    expect(haversineKm(BERLIN, MUNICH)).toBeLessThan(509);
  });

  it('is symmetric and zero for identical points', () => {
    expect(haversineKm(MUNICH, BERLIN)).toBeCloseTo(haversineKm(BERLIN, MUNICH), 6);
    expect(haversineKm(BERLIN, BERLIN)).toBe(0);
  });
});
