import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import conferencesJson from './conferences.json';
import { CONFERENCE_RECORDS, isoDatePlusDays, loadConferences } from './conference';
import { conferenceTopicSchema } from './find-conferences.schema';
import { CITIES } from './cities';
import { haversineKm } from './geo';

const NEW_YEARS_DAY = new Date(2026, 0, 1);

// Strict, so an added `date` column in the JSON fails the parse.
const recordSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  topic: conferenceTopicSchema,
  city: z.string().min(1),
  country: z.string().length(2),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  dayOffset: z.number().int().min(1).max(365),
  capacity: z.number().int().positive(),
  remaining: z.number().int().nonnegative(),
  price: z.number().int().nonnegative(),
  url: z.string().min(1),
});

describe('loadConferences', () => {
  it('T3-AC-01 derives the date from today plus dayOffset', () => {
    const conf = loadConferences(NEW_YEARS_DAY).find((entry) => entry.dayOffset === 42);
    expect(conf?.date).toBe('2026-02-12');
  });

  it('T3-AC-01 derives every date without touching the imported JSON', () => {
    const confs = loadConferences(NEW_YEARS_DAY);
    for (const conf of confs) {
      expect(conf.date).toBe(isoDatePlusDays(NEW_YEARS_DAY, conf.dayOffset));
    }
    expect(conferencesJson.some((record) => 'date' in record)).toBe(false);
  });
});

describe('conferences.json', () => {
  it('T3-AC-06 holds at least 30 valid records with unique ids and no date field', () => {
    const parsed = z.array(recordSchema).min(30).safeParse(conferencesJson);
    expect(parsed.error?.issues ?? []).toEqual([]);

    const ids = CONFERENCE_RECORDS.map((record) => record.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(CONFERENCE_RECORDS.every((record) => record.remaining <= record.capacity)).toBe(true);
  });

  it('keeps the demo answerable: every fallback city has conferences nearby', () => {
    for (const city of CITIES) {
      const nearby = CONFERENCE_RECORDS.filter((record) => haversineKm(city, record) <= 300);
      expect(nearby.length, `no conference within 300 km of ${city.name}`).toBeGreaterThan(0);
    }
  });

  it('keeps the demo answerable: the flagship topics carry enough entries', () => {
    const countOf = (topic: string) =>
      CONFERENCE_RECORDS.filter((record) => record.topic === topic).length;
    expect(countOf('angular')).toBeGreaterThanOrEqual(8);
    expect(countOf('dotnet')).toBeGreaterThanOrEqual(6);
  });
});
