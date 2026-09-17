import { z } from 'zod/v3';
import {
  createCatalogFunction,
  type AssistantFunction,
} from '../../../../shared/capabilities/catalog-function';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whole days from `today`'s local calendar date to an ISO date; negative for
 * past dates. Calendar components go through Date.UTC so neither timezone nor
 * DST shifts the day.
 */
export function daysUntil(date: string, today: Date = new Date()): number {
  const target = new Date(date);
  const targetUtc = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((targetUtc - todayUtc) / DAY_MS);
}

/** Rejects rollover dates like 2026-02-30, which Date would silently turn into March 2. */
function isRealCalendarDate(date: string): boolean {
  const parsed = new Date(date);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(date);
}

export const daysUntilFn: AssistantFunction = createCatalogFunction(
  {
    name: 'daysUntil',
    description:
      'Whole days from today until an ISO date (negative for past dates). ' +
      'Use it for "in N Tagen" labels, e.g. daysUntil applied to /selectedConf/date.',
    returnType: 'number',
    schema: z.object({
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected an ISO date (yyyy-mm-dd)')
        .refine(isRealCalendarDate, 'not a real calendar date')
        .describe('ISO date, e.g. 2026-10-24.'),
    }),
  },
  (args) => daysUntil(args.date),
);
