import { describe, expect, it } from 'vitest';
import { mapSchema } from './map.schema';

const POINT = { id: 'ber', label: 'Berlin', lat: 52.52, lon: 13.405 };

/** What a Slider-driven map binds: the filter call over three paths. */
const FILTER_CALL = {
  call: 'filterWithinKm',
  args: {
    points: { path: '/filteredConfs' },
    center: { path: '/me' },
    maxKm: { path: '/filter/maxKm' },
  },
  returnType: 'array',
};

function issues(properties: unknown): string[] {
  const result = mapSchema.safeParse(properties);
  return result.success ? [] : result.error.errors.map((issue) => issue.path.join('.'));
}

describe('mapSchema', () => {
  it('accepts every custom prop as a literal, a path or a function call', () => {
    expect(issues({ points: [POINT] })).toEqual([]);
    expect(issues({ points: { path: '/filteredConfs' } })).toEqual([]);
    expect(issues({ points: FILTER_CALL, center: { path: '/me' } })).toEqual([]);
    expect(issues({ points: [POINT], center: FILTER_CALL, selected: FILTER_CALL })).toEqual([]);
  });

  it('accepts a call without a return type, the processor never reads it', () => {
    const untyped = { call: FILTER_CALL.call, args: FILTER_CALL.args };

    expect(issues({ points: untyped })).toEqual([]);
  });

  it('still rejects a malformed literal, a malformed call and an unknown shape', () => {
    expect(issues({ points: [{ ...POINT, lat: 'north' }] })).toEqual(['points']);
    expect(issues({ points: { call: 'filterWithinKm' } })).toEqual(['points']);
    expect(issues({ points: { ...FILTER_CALL, returnType: 'list' } })).toEqual(['points']);
    expect(issues({ points: { ref: '/filteredConfs' } })).toEqual(['points']);
  });
});
