import { daysUntil } from './days-until.fn';

/** Maps times onto the rail's x axis: `from` lands on `xMin`, `to` on `xMax`. */
export interface DateScale {
  readonly from: number;
  readonly to: number;
  readonly x: (time: number) => number;
}

export interface MonthMark {
  readonly x: number;
  readonly month: string;
  /** Two-digit year; present at the first mark and at every January. */
  readonly year?: string;
}

interface MonthTick {
  readonly time: number;
  readonly month: string;
  readonly year?: string;
}

/** English whatever the browser language; a closed set, so a table rather than Intl. */
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const RELATIVE_DAYS = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function dateScale(
  dates: readonly string[],
  range: { readonly from: string; readonly to: string } | undefined,
  xMin: number,
  xMax: number,
): DateScale {
  const times = dates.map((date) => Date.parse(date));
  const from = range === undefined ? Math.min(...times) : Date.parse(range.from);
  const to = range === undefined ? Math.max(...times) : Date.parse(range.to);
  // A degenerate span still places every date on `xMin` instead of dividing by zero.
  const span = Math.max(to - from, 1);
  return { from, to, x: (time) => xMin + ((time - from) / span) * (xMax - xMin) };
}

/**
 * A mark at `from`, then one at every month start up to `to`. A month start closer to the
 * rail start than `minGap` replaces the `from` mark, so their labels never collide.
 */
export function monthMarks(scale: DateScale, minGap: number): MonthMark[] {
  const marks = monthTicks(scale.from, scale.to).map(({ time, month, year }) => ({
    x: scale.x(time),
    month,
    year,
  }));
  if (marks.length > 1 && marks[1].x - marks[0].x < minGap) {
    return [{ ...marks[1], year: marks[1].year ?? marks[0].year }, ...marks.slice(2)];
  }
  return marks;
}

/** UTC throughout, like the ISO dates. */
function monthTicks(from: number, to: number): MonthTick[] {
  const ticks = [tickAt(from, true)];
  for (let time = nextMonthStart(from); time <= to; time = nextMonthStart(time)) {
    ticks.push(tickAt(time, new Date(time).getUTCMonth() === 0));
  }
  return ticks;
}

/** "in 3 days", "today", "5 days ago" — fixed `en` locale over calendar days. */
export function relativeDays(date: string, today: Date = new Date()): string {
  return RELATIVE_DAYS.format(daysUntil(date, today), 'day');
}

function tickAt(time: number, withYear: boolean): MonthTick {
  const date = new Date(time);
  return {
    time,
    month: MONTHS[date.getUTCMonth()] ?? '',
    year: withYear && Number.isFinite(time) ? String(date.getUTCFullYear()).slice(-2) : undefined,
  };
}

function nextMonthStart(time: number): number {
  const date = new Date(time);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
}
