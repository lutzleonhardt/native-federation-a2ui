import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  capabilitySetKey,
  findRecording,
  NO_RECORDINGS,
  parseRecordings,
  type Recordings,
} from './recordings';

const PROMPT = 'Which Angular conferences are coming up in the next few months?';

function recordingsJson(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    format: 1,
    a2ui: 'v0.9',
    capturedAt: '2026-09-26',
    recordings: {
      'charts,maps': {
        [PROMPT]: [
          [{ name: 'findConferences', args: { topic: 'angular' } }],
          [{ name: 'renderSurface', args: { messages: [] } }],
        ],
      },
      charts: {},
      maps: {},
      '': {},
    },
    ...overrides,
  };
}

afterEach(() => vi.restoreAllMocks());

describe('recordings', () => {
  it('spells the set key like the capabilities query: loaded names in order, empty for none', () => {
    expect(capabilitySetKey(['charts', 'maps'])).toBe('charts,maps');
    expect(capabilitySetKey(['maps'])).toBe('maps');
    expect(capabilitySetKey([])).toBe('');
  });

  it('T3-AC-01 parses a pinned file and finds the runs by set and verbatim prompt', () => {
    const recordings = parseRecordings(recordingsJson());

    const runs = findRecording(recordings, 'charts,maps', PROMPT);
    expect(runs).toHaveLength(2);
    expect(runs?.[0]).toEqual([{ name: 'findConferences', args: { topic: 'angular' } }]);
    expect(findRecording(recordings, 'charts,maps', `  ${PROMPT}\n`)).toBe(runs);
    expect(findRecording(recordings, 'charts', PROMPT)).toBeUndefined();
    expect(findRecording(recordings, 'tables', PROMPT)).toBeUndefined();
    expect(findRecording(recordings, 'charts,maps', 'Show them on a map')).toBeUndefined();
  });

  it('T3-AC-03 a set or prompt spelled like an Object.prototype member is not recorded', () => {
    const recordings = parseRecordings(recordingsJson());

    for (const key of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
      expect(findRecording(recordings, 'charts,maps', key)).toBeUndefined();
      expect(findRecording(recordings, key, PROMPT)).toBeUndefined();
    }
  });

  it('T3-AC-06 refuses another format or A2UI version with a console message and keeps nothing', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(parseRecordings(recordingsJson({ format: 2 }))).toBe(NO_RECORDINGS);
    expect(parseRecordings(recordingsJson({ a2ui: 'v1.0' }))).toBe(NO_RECORDINGS);

    expect(errors).toHaveBeenCalledTimes(2);
    expect(errors.mock.calls[0][0]).toContain('expected format 1 and a2ui v0.9');
    expect(errors.mock.calls[0][0]).toContain('format 2');
  });

  it('T3-AC-06 refuses a body that is not sets of prompts of runs of calls', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(parseRecordings('not json')).toBe(NO_RECORDINGS);
    expect(parseRecordings(recordingsJson({ recordings: [] }))).toBe(NO_RECORDINGS);
    expect(parseRecordings(recordingsJson({ recordings: { charts: 'x' } }))).toBe(NO_RECORDINGS);
    const flatRuns: Recordings = { charts: { [PROMPT]: [[{ name: 'x', args: {} }]] } };
    expect(parseRecordings(recordingsJson({ recordings: flatRuns }))).not.toBe(NO_RECORDINGS);
    expect(
      parseRecordings(
        recordingsJson({ recordings: { charts: { [PROMPT]: [{ name: 'x', args: {} }] } } }),
      ),
    ).toBe(NO_RECORDINGS);
    expect(
      parseRecordings(recordingsJson({ recordings: { charts: { [PROMPT]: [[{ name: 'x' }]] } } })),
    ).toBe(NO_RECORDINGS);

    expect(errors).toHaveBeenCalledTimes(5);
    expect(errors.mock.calls[4][0]).toContain(`prompt "${PROMPT}"`);
  });
});
