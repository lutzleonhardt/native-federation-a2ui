import { describe, expect, it } from 'vitest';
import { CONFERENCE_RECORDS, type ConferenceRecord } from './conference';
import { applyReservations, ConferenceStore } from './conference.store';
import type { ConferenceResult } from './find-conferences';

function recordOf(id: string): ConferenceRecord {
  const record = CONFERENCE_RECORDS.find((candidate) => candidate.id === id);
  if (record === undefined) throw new Error(`No conference '${id}' in conferences.json.`);
  return record;
}

const BERLIN = recordOf('ng-forge-berlin');
const MUNICH = recordOf('ng-atlas-munich');

function result(record: ConferenceRecord, remaining = record.remaining): ConferenceResult {
  return { ...record, remaining, date: '2026-10-01' };
}

describe('ConferenceStore', () => {
  it('T1-AC-03 counts reservations per conference and returns the tickets left', () => {
    const store = new ConferenceStore();

    expect(store.reserve(BERLIN.id)).toBe(BERLIN.remaining - 1);
    expect(store.reserve(BERLIN.id)).toBe(BERLIN.remaining - 2);
    expect(store.reserve(MUNICH.id)).toBe(MUNICH.remaining - 1);

    expect(store.reservations()).toEqual(
      new Map([
        [BERLIN.id, 2],
        [MUNICH.id, 1],
      ]),
    );
  });

  it('T1-AC-02 never reports fewer than zero tickets', () => {
    const store = new ConferenceStore();

    let left: number | undefined;
    for (let i = 0; i <= MUNICH.remaining; i += 1) left = store.reserve(MUNICH.id);

    expect(left).toBe(0);
    expect(store.reserve(MUNICH.id)).toBe(0);
  });

  it('records nothing for an id no conference has', () => {
    const store = new ConferenceStore();

    expect(store.reserve('no-such-conference')).toBeUndefined();
    expect(store.reservations().size).toBe(0);
  });
});

describe('applyReservations', () => {
  it('T1-AC-03 lowers remaining by the count and passes unreserved conferences through unchanged', () => {
    const berlin = result(BERLIN);
    const munich = result(MUNICH);

    const applied = applyReservations([berlin, munich], new Map([[BERLIN.id, 3]]));

    expect(applied[0]).toEqual({ ...berlin, remaining: BERLIN.remaining - 3 });
    expect(applied[1]).toBe(munich);
  });

  it('T1-AC-02 clamps remaining at zero', () => {
    const applied = applyReservations([result(MUNICH, 2)], new Map([[MUNICH.id, 5]]));

    expect(applied[0].remaining).toBe(0);
  });
});
