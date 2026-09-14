import type { Context } from '@ag-ui/core';
import { describe, expect, it } from 'vitest';
import { buildInstructions } from './prompt.js';

const CATALOG_PAYLOAD = {
  catalogId: 'https://conference-finder.dev/catalogs/assistant',
  components: {
    Gauge: { description: 'Remaining tickets', schema: { properties: { value: {}, max: {} } } },
    Timeline: { description: 'Time axis', schema: { properties: { items: {} } } },
  },
  functions: {
    daysUntil: { description: 'Days until a date', args: { properties: { date: {} } }, returnType: 'number' },
  },
};

const catalogEntry: Context = {
  description: 'A2UI Custom Catalog',
  value: JSON.stringify(CATALOG_PAYLOAD),
};

const locationEntry: Context = {
  description: 'User location (me)',
  value: JSON.stringify({ city: 'Berlin', lat: 52.52, lon: 13.405 }),
};

function sectionOf(prompt: string, heading: string): string {
  const start = prompt.indexOf(heading);
  expect(start).toBeGreaterThanOrEqual(0);
  const next = prompt.indexOf('\n# ', start + heading.length);
  return next === -1 ? prompt.slice(start) : prompt.slice(start, next);
}

describe('buildInstructions', () => {
  it('T9-AC-01 lists every component and function of the catalog entry under Custom Catalog', () => {
    const section = sectionOf(buildInstructions([catalogEntry, locationEntry]), '# Custom Catalog');

    for (const name of Object.keys(CATALOG_PAYLOAD.components)) {
      expect(section).toContain(name);
    }
    for (const name of Object.keys(CATALOG_PAYLOAD.functions)) {
      expect(section).toContain(name);
    }
    expect(section).toContain(CATALOG_PAYLOAD.catalogId);
  });

  it('T9-AC-01 notes the missing vocabulary when no catalog entry arrives', () => {
    const section = sectionOf(buildInstructions([locationEntry]), '# Custom Catalog');

    expect(section).toContain('No custom vocabulary available');
    expect(section).not.toContain('Gauge');
  });

  it('carries the location into the prompt and says so when it is absent', () => {
    expect(buildInstructions([catalogEntry, locationEntry])).toContain('Berlin');
    expect(sectionOf(buildInstructions([catalogEntry]), '# User location')).toContain('Unknown');
  });

  // The location is the only section that changes between the runs of one
  // conversation; keeping it last leaves the stable prefix cacheable.
  it('puts the volatile location section behind the stable ones', () => {
    const prompt = buildInstructions([catalogEntry, locationEntry]);

    expect(prompt.indexOf('# User location')).toBeGreaterThan(prompt.indexOf('# Custom Catalog'));
    expect(prompt.indexOf('# Custom Catalog')).toBeGreaterThan(prompt.indexOf('# A2UI format'));
  });

  it('always states the rules the surface contract depends on', () => {
    const prompt = buildInstructions([catalogEntry, locationEntry]);

    expect(prompt).toContain('renderSurface');
    expect(prompt).toContain('/filteredConfs');
    expect(prompt).toContain('reserve');
    expect(prompt).toContain('v0.9');
  });
});
