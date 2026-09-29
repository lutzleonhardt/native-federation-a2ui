import type { Context } from '@ag-ui/core';
import { describe, expect, it } from 'vitest';
import {
  CATALOG_CONTEXT_DESCRIPTION,
  LOCATION_CONTEXT_DESCRIPTION,
} from '../../shared/agent-contract.js';
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
  description: CATALOG_CONTEXT_DESCRIPTION,
  value: JSON.stringify(CATALOG_PAYLOAD),
};

const locationEntry: Context = {
  description: LOCATION_CONTEXT_DESCRIPTION,
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

  // A name in the static text outweighs the "use only what is listed" rule: with
  // charts switched off the model still built the `Timeline` an example showed.
  it.each(['Gauge', 'Timeline', 'Map', 'daysUntil', 'distance'])(
    'T7-AC-02 names the custom %s only when the catalog entry announces it',
    (name) => {
      const prompt = buildInstructions([locationEntry]);

      expect(prompt).not.toContain(`"${name}"`);
      expect(prompt).not.toContain(`\`${name}\``);
    },
  );

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

  it('T4-AC-05 fixes the selection path and states the form rules', () => {
    const prompt = buildInstructions([catalogEntry, locationEntry]);

    expect(prompt).toContain('"/selectedConf/id"');
    expect(prompt).not.toContain('<the selection path>');
    expect(prompt).toContain('# Answer the form asked');
    expect(prompt).toContain('`Slider`');
    expect(prompt).toContain('under `basic`');
  });

  it('states that ChoicePicker options are static and only a `selected` component selects a conference', () => {
    const prompt = buildInstructions([catalogEntry, locationEntry]);

    expect(prompt).toContain('`ChoicePicker.options` is a static list');
    expect(prompt).toContain('Only a Custom Catalog component with `selected`');
    expect(prompt).toContain('as the client pre-set it');
  });
});
