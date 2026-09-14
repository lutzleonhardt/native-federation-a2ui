import { describe, expect, it } from 'vitest';
import { mergeFragments } from './assistant-catalog';
import { ASSISTANT_CATALOG_ID } from './assistant-catalog-id';
import { ASSISTANT_FRAGMENTS } from './assistant-fragments';
import { catalogToContextEntry } from './catalog-context';

interface SerializedCatalog {
  catalogId: string;
  components: Record<string, { description: string; schema: { properties?: Record<string, unknown> } }>;
  functions: Record<string, { description: string; args: { properties?: Record<string, unknown> }; returnType: string }>;
}

describe('catalogToContextEntry', () => {
  const entry = catalogToContextEntry();
  const payload = JSON.parse(entry.value) as SerializedCatalog;

  it('T4-AC-05 names the catalog id and describes itself as a custom catalog', () => {
    expect(entry.description).toBe('A2UI Custom Catalog');
    expect(payload.catalogId).toBe(ASSISTANT_CATALOG_ID);
  });

  it('T4-AC-05 serializes the Gauge schema with value and max properties', () => {
    const gauge = payload.components['Gauge'];

    expect(gauge.description).toContain('Restkarten');
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

  // XC-04: the serializer lists the vocabulary framework-free so Node can import
  // it, the renderer builds it from the Angular fragments — two lists that must
  // not drift apart.
  it('announces exactly the vocabulary the rendered catalog implements', () => {
    const rendered = mergeFragments(ASSISTANT_FRAGMENTS, { warn: false });

    expect(Object.keys(payload.components).sort()).toEqual(
      rendered.components.map((component) => component.name).sort(),
    );
    expect(Object.keys(payload.functions).sort()).toEqual(
      rendered.functions.map((fn) => fn.name).sort(),
    );
  });
});
