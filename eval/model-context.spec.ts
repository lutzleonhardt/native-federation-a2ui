import { describe, expect, it } from 'vitest';
import { CATALOG_CONTEXT_DESCRIPTION } from '../shared/agent-contract';
import type { CapabilityVocabulary } from '../shared/capabilities/agent-capability';
import { catalogToContextEntry } from '../src/app/a2ui/catalog-context';
import { chartsVocabulary } from '../src/app/capabilities/charts/vocabulary';
import { mapsVocabulary } from '../src/app/capabilities/maps/vocabulary';

interface SerializedCatalog {
  readonly components: Record<string, unknown>;
  readonly functions: Record<string, unknown>;
}

function announced(vocabularies: readonly CapabilityVocabulary<string>[]): SerializedCatalog {
  return JSON.parse(catalogToContextEntry(vocabularies).value) as SerializedCatalog;
}

// Runs under plain Node, where `@a2ui/angular` does not load: the vocabulary
// path the shell serializes must stay importable here or `npm run eval` breaks.
describe('model context under Node', () => {
  it('T1-AC-01: assembles the catalog entry from the capability vocabularies', () => {
    const entry = catalogToContextEntry([chartsVocabulary, mapsVocabulary]);
    const payload = JSON.parse(entry.value) as SerializedCatalog;

    expect(entry.description).toBe(CATALOG_CONTEXT_DESCRIPTION);
    expect(Object.keys(payload.components)).toEqual(['Gauge', 'Timeline', 'Map']);
    expect(Object.keys(payload.functions)).toEqual(['daysUntil', 'distance']);
  });

  it('T2-AC-01: a charts-only list announces neither Map nor distance', () => {
    const payload = announced([chartsVocabulary]);

    expect(Object.keys(payload.components)).toEqual(['Gauge', 'Timeline']);
    expect(Object.keys(payload.functions)).toEqual(['daysUntil']);
  });
});
