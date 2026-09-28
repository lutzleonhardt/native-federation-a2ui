import { describe, expect, it } from 'vitest';
import { toFragment, type AgentCapability } from '../../../shared/capabilities/agent-capability';
import { capability as chartsCapability } from '../../../projects/mfe-charts/src/capability';
import { daysUntilFn } from '../../../projects/mfe-charts/src/charts/days-until.fn';
import { GaugeComponent } from '../../../projects/mfe-charts/src/charts/gauge.component';
import { GAUGE_META } from '../../../projects/mfe-charts/src/charts/gauge.schema';
import { capability as mapsCapability } from '../../../projects/mfe-maps/src/capability';
import { mergeFragments } from './assistant-catalog';
import { ASSISTANT_CATALOG_ID } from './assistant-catalog-id';
import { catalogToContextEntry } from './catalog-context';

interface SerializedCatalog {
  catalogId: string;
  components: Record<
    string,
    { description: string; schema: { properties?: Record<string, unknown> } }
  >;
  functions: Record<
    string,
    { description: string; args: { properties?: Record<string, unknown> }; returnType: string }
  >;
}

const LOCAL: readonly AgentCapability[] = [chartsCapability, mapsCapability];

/** What the shell sends: the framework-free half of each loaded capability. */
function announced(capabilities: readonly AgentCapability[]): SerializedCatalog {
  const entry = catalogToContextEntry(capabilities.map((capability) => capability.vocabulary));
  return JSON.parse(entry.value) as SerializedCatalog;
}

function names(items: readonly { readonly name: string }[]): string[] {
  return items.map((item) => item.name).sort();
}

describe('catalogToContextEntry', () => {
  const entry = catalogToContextEntry(LOCAL.map((capability) => capability.vocabulary));
  const payload = JSON.parse(entry.value) as SerializedCatalog;

  it('T4-AC-05 names the catalog id and describes itself as a custom catalog', () => {
    expect(entry.description).toBe('A2UI Custom Catalog');
    expect(payload.catalogId).toBe(ASSISTANT_CATALOG_ID);
  });

  it('T4-AC-05 serializes the Gauge schema with value and max properties', () => {
    const gauge = payload.components['Gauge'];

    expect(gauge.description).toContain('Tickets left');
    expect(gauge.schema.properties).toHaveProperty('value');
    expect(gauge.schema.properties).toHaveProperty('max');
  });

  it('T4-AC-05 serializes daysUntil with an args schema and number return type', () => {
    const daysUntil = payload.functions['daysUntil'];

    expect(daysUntil.returnType).toBe('number');
    expect(daysUntil.args.properties).toHaveProperty('date');
    expect(daysUntil.description.length).toBeGreaterThan(0);
  });

  it('serializes distance and strips the $schema noise', () => {
    expect(payload.functions['distance'].returnType).toBe('number');
    expect(payload.components['Gauge'].schema).not.toHaveProperty('$schema');
  });

  it('T3.5-AC-02 announces path and call as alternatives on every bound custom prop', () => {
    // Every prop declared through `binding()`, per component.
    const BOUND: Record<string, readonly string[]> = {
      Gauge: ['value', 'max', 'label'],
      Timeline: ['items', 'range', 'selected'],
      Map: ['points', 'center', 'selected'],
    };
    const alternativesOf = (prop: unknown) =>
      (prop as { anyOf?: { properties?: Record<string, unknown> }[] }).anyOf?.map((alternative) =>
        Object.keys(alternative.properties ?? {}).sort(),
      );

    for (const [component, props] of Object.entries(BOUND)) {
      for (const name of props) {
        const prop = payload.components[component].schema.properties?.[name];
        expect(alternativesOf(prop), `${component}.${name}`).toEqual(
          expect.arrayContaining([['path'], ['args', 'call', 'returnType']]),
        );
      }
    }
    expect(payload.functions['filterWithinKm'].returnType).toBe('array');
  });
});

// XC-04: the serializer lists the vocabulary framework-free so Node can import
// it, the renderer builds it from the Angular fragments — two lists that must
// not drift apart, whatever list the shell was given.
describe('T2-AC-02 announced and rendered vocabulary name the same set', () => {
  class SecondGauge {}

  /** Every conflict kind at once: a duplicate and a basic name, for components and functions. */
  const colliding: AgentCapability = {
    name: 'colliding',
    vocabulary: {
      components: {
        Gauge: { ...GAUGE_META, description: 'a second Gauge' },
        Text: { ...GAUGE_META, name: 'Text', description: 'a custom Text' },
      },
      functions: [
        { ...daysUntilFn, description: 'a second daysUntil' },
        { ...daysUntilFn, name: 'formatDate', description: 'a custom formatDate' },
      ],
    },
    components: { Gauge: SecondGauge, Text: SecondGauge },
  };

  const LISTS: readonly [string, readonly AgentCapability[]][] = [
    ['no capability', []],
    ['charts only', [chartsCapability]],
    ['maps only', [mapsCapability]],
    ['charts and maps', LOCAL],
    ['maps before charts', [mapsCapability, chartsCapability]],
    ['charts plus a colliding capability', [chartsCapability, colliding]],
  ];

  it.each(LISTS)('for %s', (_label, capabilities) => {
    const rendered = mergeFragments(capabilities.map(toFragment), { warn: false });
    const payload = announced(capabilities);

    expect(Object.keys(payload.components).sort()).toEqual(names(rendered.components));
    expect(Object.keys(payload.functions).sort()).toEqual(names(rendered.functions));
  });

  it('resolves a duplicate name to the first registration and drops basic names', () => {
    const capabilities = [chartsCapability, colliding];

    const rendered = mergeFragments(capabilities.map(toFragment), { warn: false });
    const payload = announced(capabilities);

    expect(payload.components['Gauge'].description).toBe(GAUGE_META.description);
    expect(payload.functions['daysUntil'].description).toBe(daysUntilFn.description);
    expect(rendered.components.find((component) => component.name === 'Gauge')?.component).toBe(
      GaugeComponent,
    );
    expect(rendered.functions.find((fn) => fn.name === 'daysUntil')?.description).toBe(
      daysUntilFn.description,
    );
    expect(payload.components).not.toHaveProperty('Text');
    expect(payload.functions).not.toHaveProperty('formatDate');
  });
});
