import { describe, expect, it } from 'vitest';
import { isoDatePlusDays, loadConferences, type Conference } from './conference';
import { findConferences, type FindConferencesContext } from './find-conferences';
import { haversineKm } from './geo';

const TODAY = new Date(2026, 0, 1);
const BERLIN = { lat: 52.52, lon: 13.405 };

const anywhere: FindConferencesContext = { confs: loadConferences(TODAY), today: TODAY };
const fromBerlin: FindConferencesContext = { ...anywhere, me: BERLIN };

describe('findConferences filters', () => {
  it('T3-AC-03 returns only angular conferences within 90 days, sorted by date', () => {
    const { confs } = findConferences({ topic: 'angular', withinDays: 90 }, anywhere);
    const latest = isoDatePlusDays(TODAY, 90);

    expect(confs.length).toBeGreaterThan(2);
    expect(confs.every((conf) => conf.topic === 'angular')).toBe(true);
    expect(confs.every((conf) => conf.date <= latest)).toBe(true);

    const dates = confs.map((conf) => conf.date);
    expect(dates).toEqual([...dates].sort());
  });

  it('T3-AC-03 limit returns the first entries of the same query', () => {
    const all = findConferences({ topic: 'angular', withinDays: 90 }, anywhere).confs;
    const limited = findConferences({ topic: 'angular', withinDays: 90, limit: 2 }, anywhere).confs;

    expect(limited).toEqual(all.slice(0, 2));
  });

  it('T3-AC-04 keeps only conferences within nearKm and reports an integer distance', () => {
    const { confs } = findConferences({ nearKm: 300 }, fromBerlin);

    expect(confs.length).toBeGreaterThan(0);
    expect(confs.length).toBeLessThan(anywhere.confs.length);
    expect(
      confs.every(
        (conf) =>
          conf.distanceKm !== undefined &&
          Number.isInteger(conf.distanceKm) &&
          conf.distanceKm <= 300,
      ),
    ).toBe(true);
  });

  it('T3-AC-04 decides the radius on the exact distance, not on the rounded one', () => {
    // 2.7016° due north of Berlin is 300.4 km — it rounds to 300 and would slip
    // through a 300 km radius if the filter ran on the rounded value.
    const justOutside: Conference = {
      ...anywhere.confs[0],
      id: 'just-outside',
      lat: BERLIN.lat + 2.7016,
      lon: BERLIN.lon,
    };
    const ctx: FindConferencesContext = { ...fromBerlin, confs: [justOutside] };

    expect(Math.round(haversineKm(BERLIN, justOutside))).toBe(300);
    expect(findConferences({ nearKm: 300 }, ctx).confs).toEqual([]);
    expect(findConferences({ nearKm: 301 }, ctx).confs).toHaveLength(1);
  });

  it('T3-AC-04 omits distanceKm and ignores nearKm while the location is unknown', () => {
    const constrained = findConferences({ nearKm: 300 }, anywhere).confs;
    const unconstrained = findConferences({}, anywhere).confs;

    expect(constrained).toEqual(unconstrained);
    expect(constrained.every((conf) => conf.distanceKm === undefined)).toBe(true);
  });
});

describe('findConferences grouping', () => {
  it('T3-AC-05 groups by month into label/value rows that sum to the result', () => {
    const { confs, byMonth = [], byTopic } = findConferences({ groupBy: 'month' }, anywhere);

    expect(byTopic).toBeUndefined();
    expect(byMonth.length).toBeGreaterThan(1);
    expect(byMonth.every((row) => /^\d{4}-\d{2}$/.test(row.label))).toBe(true);
    expect(byMonth.reduce((sum, row) => sum + row.value, 0)).toBe(confs.length);
  });

  it('T3-AC-05 groups by topic into label/value rows that sum to the result', () => {
    const { confs, byTopic = [], byMonth } = findConferences({ groupBy: 'topic' }, anywhere);

    expect(byMonth).toBeUndefined();
    expect(byTopic.map((row) => row.label)).toContain('angular');
    expect(byTopic.reduce((sum, row) => sum + row.value, 0)).toBe(confs.length);
  });

  it('T3-AC-05 groups the limited result rather than the full match set', () => {
    const { confs, byTopic = [] } = findConferences({ groupBy: 'topic', limit: 5 }, anywhere);

    expect(confs).toHaveLength(5);
    expect(byTopic.reduce((sum, row) => sum + row.value, 0)).toBe(5);
  });
});
