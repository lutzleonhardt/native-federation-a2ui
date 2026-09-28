import type { DataContext } from '@a2ui/web_core/v0_9';
import { describe, expect, it } from 'vitest';
import { filterWithinKmFn } from './filter-within-km.fn';
import { haversineKm } from './geo';

const BERLIN = { lat: 52.52, lon: 13.405 };
// About 150, 255 and 504 km from Berlin.
const LEIPZIG = { id: 'lej', lat: 51.3397, lon: 12.3731, remaining: 68 };
const HAMBURG = { id: 'ham', lat: 53.5511, lon: 9.9937, remaining: 9 };
const MUNICH = { id: 'muc', lat: 48.1372, lon: 11.5756, remaining: 5 };
const POINTS = [MUNICH, LEIPZIG, HAMBURG];

// The function ignores the data context; the value is irrelevant to the test.
const NO_CONTEXT = undefined as unknown as DataContext;

function within(maxKm: number, points: readonly object[] = POINTS): unknown[] {
  return filterWithinKmFn.execute({ points, center: BERLIN, maxKm }, NO_CONTEXT) as unknown[];
}

describe('filterWithinKm', () => {
  it('keeps the points inside the radius, in input order', () => {
    expect(within(300)).toEqual([LEIPZIG, HAMBURG]);
  });

  it('keeps a point exactly on the edge and drops the one just beyond', () => {
    const edge = haversineKm(BERLIN, LEIPZIG);

    expect(within(edge)).toEqual([LEIPZIG]);
    expect(within(edge - 0.001)).toEqual([]);
  });

  it('a radius of 0 keeps a point in the user’s own city', () => {
    const home = { id: 'ber', ...BERLIN };

    expect(within(0, [home, LEIPZIG])).toEqual([home]);
  });

  it('returns an empty list for no candidates and for a radius below every point', () => {
    expect(within(800, [])).toEqual([]);
    expect(within(100)).toEqual([]);
  });

  it('passes extra fields through untouched', () => {
    const [leipzig] = within(200);

    expect(leipzig).toBe(LEIPZIG);
    expect(leipzig).toMatchObject({ id: 'lej', remaining: 68 });
  });

  it('is registered as an array-returning catalog function with a Slider hint', () => {
    expect(filterWithinKmFn.name).toBe('filterWithinKm');
    expect(filterWithinKmFn.returnType).toBe('array');
    expect(filterWithinKmFn.description).toContain('Slider');
  });
});
