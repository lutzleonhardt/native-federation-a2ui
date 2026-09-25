import { describe, expect, it } from 'vitest';
import { dateScale, monthMarks, relativeDays } from './timeline-dates';

describe('dateScale', () => {
  it('maps the first date to xMin and the last to xMax', () => {
    const scale = dateScale(['2026-11-20', '2026-09-15', '2026-10-01'], undefined, 64, 768);
    expect(scale.x(Date.parse('2026-09-15'))).toBe(64);
    expect(scale.x(Date.parse('2026-11-20'))).toBe(768);
  });

  it('lets an explicit range override the span of the dates', () => {
    const scale = dateScale(['2026-09-15'], { from: '2026-09-01', to: '2026-09-29' }, 0, 280);
    expect(scale.x(Date.parse('2026-09-15'))).toBe(140);
  });
});

describe('monthMarks', () => {
  const scaleOf = (from: string, to: string) => dateScale([from, to], undefined, 64, 768);

  it('marks the first date, then every month start, with the year at the start and each January', () => {
    const scale = scaleOf('2026-09-15', '2027-03-09');
    const marks = monthMarks(scale, 28);
    expect(marks.map((mark) => mark.month)).toEqual([
      'SEP',
      'OCT',
      'NOV',
      'DEC',
      'JAN',
      'FEB',
      'MAR',
    ]);
    expect(marks.map((mark) => mark.year)).toEqual([
      '26',
      undefined,
      undefined,
      undefined,
      '27',
      undefined,
      undefined,
    ]);
    expect(marks[0].x).toBe(64);
    expect(marks[1].x).toBe(scale.x(Date.parse('2026-10-01')));
  });

  it('does not repeat a month whose first day is the span start', () => {
    const marks = monthMarks(scaleOf('2026-10-01', '2026-11-15'), 28);
    expect(marks.map((mark) => mark.month)).toEqual(['OCT', 'NOV']);
  });

  it('is a single mark for a span inside one month', () => {
    expect(monthMarks(scaleOf('2026-09-14', '2026-09-20'), 28)).toEqual([
      { x: 64, month: 'SEP', year: '26' },
    ]);
  });

  it('lets a month start replace a first mark it would collide with, keeping the year', () => {
    // Sep 26 → Oct 1 is 5 of 164 days: about 21 units apart on a 704-unit rail.
    const scale = scaleOf('2026-09-26', '2027-03-09');
    const marks = monthMarks(scale, 28);
    expect(marks.map((mark) => mark.month)).toEqual(['OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR']);
    expect(marks.map((mark) => mark.year)).toEqual([
      '26',
      undefined,
      undefined,
      '27',
      undefined,
      undefined,
    ]);
    expect(marks[0].x).toBe(scale.x(Date.parse('2026-10-01')));
  });
});

describe('relativeDays', () => {
  const today = new Date(2026, 8, 24);

  it.each([
    ['2026-09-27', 'in 3 days'],
    ['2026-09-25', 'tomorrow'],
    ['2026-09-24', 'today'],
    ['2026-09-23', 'yesterday'],
    ['2026-09-19', '5 days ago'],
  ])('%s → %s', (date, expected) => {
    expect(relativeDays(date, today)).toBe(expected);
  });
});
