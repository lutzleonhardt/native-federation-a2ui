import conferences from './conferences.json';

export type ConferenceTopic = 'angular' | 'dotnet' | 'web' | 'ai' | 'cloud';

/** A row of `conferences.json`. Carries no date — see {@link loadConferences}. */
export interface ConferenceRecord {
  readonly id: string;
  readonly name: string;
  readonly topic: ConferenceTopic;
  readonly city: string;
  readonly country: string;
  readonly lat: number;
  readonly lon: number;
  readonly dayOffset: number;
  readonly capacity: number;
  readonly remaining: number;
  readonly price: number;
  readonly url: string;
}

export interface Conference extends ConferenceRecord {
  /** ISO `YYYY-MM-DD`. */
  readonly date: string;
}

// JSON literals widen to `string`, so the topic union cannot survive the import.
// `conference.spec.ts` validates the file against this shape, making the
// assertion a checked claim rather than an assumed one.
export const CONFERENCE_RECORDS = conferences as readonly ConferenceRecord[];

/**
 * Calendar arithmetic on the local date of `today`, formatted as ISO.
 * Going through `Date.UTC` keeps the result free of DST shifts.
 */
export function isoDatePlusDays(today: Date, days: number): string {
  const shifted = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + days),
  );
  return shifted.toISOString().slice(0, 10);
}

/**
 * Dates are derived per load instead of stored, so the data set never ages:
 * "the next conference" always exists and countdowns stay meaningful.
 */
export function loadConferences(today: Date): Conference[] {
  return CONFERENCE_RECORDS.map((record) => ({
    ...record,
    date: isoDatePlusDays(today, record.dayOffset),
  }));
}
