import { describe, expect, it } from 'vitest';
import manifest from '../../../public/federation.manifest.json';
import file from '../../../public/recordings.json';
import { EXAMPLE_PROMPTS } from '../chat/example-prompts';
import { findCity } from '../domain/cities';
import {
  capabilitySetKey,
  parseRecordings,
  RECORDINGS_A2UI,
  RECORDINGS_FORMAT,
  type RecordedRun,
} from './recordings';

/** Every subset of the manifest's remotes in manifest order: the sets the panel can reach. */
function reachableSets(names: readonly string[]): string[] {
  let sets: string[][] = [[]];
  for (const name of names) sets = [...sets, ...sets.map((set) => [...set, name])];
  return sets.map(capabilitySetKey);
}

const CLIENT_TOOLS = ['findConferences', 'renderSurface', 'messageWidget'];

describe('public/recordings.json', () => {
  const recordings = parseRecordings(file);
  const sets = reachableSets(Object.keys(manifest));

  function cells(): { set: string; badge: number; runs: readonly RecordedRun[] }[] {
    return sets.flatMap((set) =>
      EXAMPLE_PROMPTS.map((prompt, badge) => ({
        set,
        badge,
        runs: recordings[set]?.[prompt] ?? [],
      })),
    );
  }

  it('T4.5-AC-01 carries the pins the parser demands, the capture date and city, and the re-record note', () => {
    expect(file.format).toBe(RECORDINGS_FORMAT);
    expect(file.a2ui).toBe(RECORDINGS_A2UI);
    expect(file.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(findCity(file.city), 'T4.5-AC-05 the city every cell was captured in').toBeDefined();
    expect(file.note).toContain('Re-record');
    expect(Object.keys(recordings).sort()).toEqual([...sets].sort());
  });

  it('T4.5-AC-01 holds one recording per reachable set and badge — sixteen today, each with at least one call', () => {
    expect(sets).toHaveLength(4);
    const all = cells();
    expect(all).toHaveLength(16);
    for (const { set, badge, runs } of all) {
      expect(runs.length, `[${set}] badge ${badge + 1}`).toBeGreaterThan(0);
      for (const run of runs) expect(run.length, `[${set}] badge ${badge + 1}`).toBeGreaterThan(0);
    }
  });

  it('T4.5-AC-02 every recording fetches its own data: the first run calls findConferences', () => {
    for (const { set, badge, runs } of cells()) {
      expect(runs[0][0].name, `[${set}] badge ${badge + 1}`).toBe('findConferences');
    }
  });

  it('T4.5-AC-01 calls only the three client tools, with object arguments', () => {
    for (const { runs } of cells()) {
      for (const call of runs.flat()) {
        expect(CLIENT_TOOLS).toContain(call.name);
        expect(typeof call.args).toBe('object');
      }
    }
  });

  it('T4.5-AC-01 writes no date literal: dates are bound, never copied from a tool result', () => {
    expect(JSON.stringify(file.recordings)).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});
