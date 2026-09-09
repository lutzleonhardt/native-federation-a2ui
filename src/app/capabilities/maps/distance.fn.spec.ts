import type { DataContext } from '@a2ui/web_core/v0_9';
import { describe, expect, it } from 'vitest';
import { distanceFn } from './distance.fn';
import { haversineKm } from './geo';

const BERLIN = { lat: 52.52, lon: 13.405 };
const MUENCHEN = { lat: 48.1372, lon: 11.5756 };

// The function ignores the data context; the value is irrelevant to the test.
const NO_CONTEXT = undefined as unknown as DataContext;

describe('distance', () => {
  it('T4-AC-03 measures Berlin to München as 504 ± 5 km, rounded to an integer', () => {
    const km = distanceFn.execute({ a: BERLIN, b: MUENCHEN }, NO_CONTEXT) as number;

    expect(Number.isInteger(km)).toBe(true);
    expect(Math.abs(km - 504)).toBeLessThanOrEqual(5);
  });

  // Pins this deliberate copy of the domain haversine to the same measured value.
  it('keeps the local haversine copy in line with the domain measurement', () => {
    expect(haversineKm(BERLIN, MUENCHEN)).toBeCloseTo(504.3, 1);
  });

  it('is registered as a number-returning catalog function', () => {
    expect(distanceFn.name).toBe('distance');
    expect(distanceFn.returnType).toBe('number');
  });
});
