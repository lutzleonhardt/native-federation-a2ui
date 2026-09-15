import type { DataContext } from '@a2ui/web_core/v0_9';
import { describe, expect, it } from 'vitest';
import { toFragment } from '../../../../shared/capabilities/agent-capability';
import { createAssistantCatalog } from '../../a2ui/assistant-catalog';
import { daysUntil, daysUntilFn } from './days-until.fn';
import { chartsCapability } from './index';

// Fixed clock: `today` is an explicit argument, so no fake timers are needed.
const TODAY = new Date(2026, 0, 1);

// The invoker ignores the data context for this function.
const NO_CONTEXT = undefined as unknown as DataContext;

describe('daysUntil', () => {
  it('T4-AC-02 returns 42 for a date 42 days ahead', () => {
    expect(daysUntil('2026-02-12', TODAY)).toBe(42);
  });

  it('T4-AC-02 returns a negative number for a past date', () => {
    expect(daysUntil('2025-12-25', TODAY)).toBe(-7);
  });

  it('returns 0 for today', () => {
    expect(daysUntil('2026-01-01', TODAY)).toBe(0);
  });

  it('is registered as a number-returning catalog function', () => {
    expect(daysUntilFn.name).toBe('daysUntil');
    expect(daysUntilFn.returnType).toBe('number');
    expect(daysUntilFn.description).toContain('days');
  });

  // Through the real catalog invoker: it parses args against fn.schema, and the
  // renderer degrades a validation failure to `undefined` instead of showing a
  // silently wrong number.
  it('rejects a non-date string at the catalog invoker', () => {
    const catalog = createAssistantCatalog([toFragment(chartsCapability)]);

    expect(() => catalog.invoker('daysUntil', { date: 'not-a-date' }, NO_CONTEXT)).toThrowError(
      /Validation failed/,
    );
  });

  it('rejects an impossible calendar date instead of rolling it over', () => {
    const catalog = createAssistantCatalog([toFragment(chartsCapability)]);

    expect(() => catalog.invoker('daysUntil', { date: '2026-02-30' }, NO_CONTEXT)).toThrowError(
      /Validation failed/,
    );
    expect(catalog.invoker('daysUntil', { date: '2026-02-12' }, NO_CONTEXT)).toSatisfy(
      Number.isInteger,
    );
  });
});
