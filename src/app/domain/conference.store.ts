import { Injectable, signal } from '@angular/core';
import { CONFERENCE_RECORDS } from './conference';
import type { ConferenceResult } from './find-conferences';

/**
 * The reservations of this page: a count per conference id, in memory only, so a reload starts
 * fresh. The count keeps growing past the last ticket; readers clamp at zero.
 */
@Injectable({ providedIn: 'root' })
export class ConferenceStore {
  private readonly counts = signal<ReadonlyMap<string, number>>(new Map());
  readonly reservations = this.counts.asReadonly();

  /**
   * Records one reservation and returns the tickets left, or `undefined` — recording nothing —
   * when no conference has this id.
   */
  reserve(id: string): number | undefined {
    const record = CONFERENCE_RECORDS.find((candidate) => candidate.id === id);
    if (record === undefined) return undefined;
    const count = (this.counts().get(id) ?? 0) + 1;
    this.counts.update((counts) => new Map(counts).set(id, count));
    return remainingAfter(record.remaining, count);
  }
}

/** The conferences with `remaining` lowered by this page's reservations, never below zero. */
export function applyReservations(
  confs: readonly ConferenceResult[],
  reservations: ReadonlyMap<string, number>,
): ConferenceResult[] {
  return confs.map((conf) => {
    const count = reservations.get(conf.id);
    if (count === undefined) return conf;
    return { ...conf, remaining: remainingAfter(conf.remaining, count) };
  });
}

function remainingAfter(remaining: number, count: number): number {
  return Math.max(0, remaining - count);
}
