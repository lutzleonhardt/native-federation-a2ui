import { describe, expect, it } from 'vitest';
import { loadConferences } from '../../domain/conference';
import { findConferences } from '../../domain/find-conferences';
import { findConferencesDefinition } from './find-conferences.definition';

const BERLIN = { city: 'Berlin', lat: 52.52, lon: 13.405 };

/** The input `date` is derived from: mounted with the record, but not a fact about the conference. */
const NOT_A_FACT: ReadonlySet<string> = new Set(['dayOffset']);

describe('findConferencesDefinition', () => {
  it('T4-AC-05 names every field of a mounted conference, so the list cannot drift from the type', () => {
    const today = new Date();
    const [conf] = findConferences({}, { confs: loadConferences(today), me: BERLIN, today }).confs;
    const fields = Object.keys(conf).filter((key) => !NOT_A_FACT.has(key));

    expect(fields).toContain('distanceKm');
    for (const field of fields) {
      expect(findConferencesDefinition.description).toMatch(new RegExp(`\\b${field}\\b`));
    }
  });
});
