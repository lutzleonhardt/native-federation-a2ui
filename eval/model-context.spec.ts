import { describe, expect, it } from 'vitest';
import { CATALOG_CONTEXT_DESCRIPTION } from '../shared/agent-contract';
import { catalogToContextEntry } from '../src/app/a2ui/catalog-context';

interface SerializedCatalog {
  readonly components: Record<string, unknown>;
  readonly functions: Record<string, unknown>;
}

// Runs under plain Node, where `@a2ui/angular` does not load: the vocabulary
// path the shell serializes must stay importable here or `npm run eval` breaks.
describe('model context under Node', () => {
  it('T1-AC-01: assembles the catalog entry from the capability vocabularies', () => {
    const entry = catalogToContextEntry();
    const payload = JSON.parse(entry.value) as SerializedCatalog;

    expect(entry.description).toBe(CATALOG_CONTEXT_DESCRIPTION);
    expect(Object.keys(payload.components)).toEqual(['Gauge', 'Timeline', 'Map']);
    expect(Object.keys(payload.functions)).toEqual(['daysUntil', 'distance']);
  });
});
