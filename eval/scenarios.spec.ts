import { describe, expect, it } from 'vitest';
import { catalogToContextEntry } from '../src/app/a2ui/catalog-context';
import { EXAMPLE_PROMPTS } from '../src/app/chat/example-prompts';
import { announcedNames, badgeOf, SCENARIOS, type Scenario } from './scenarios';

interface SerializedCatalog {
  readonly components: Record<string, unknown>;
  readonly functions: Record<string, unknown>;
}

function contextOf({ vocabularies }: Scenario): SerializedCatalog {
  return JSON.parse(catalogToContextEntry(vocabularies).value) as SerializedCatalog;
}

const [BOTH, CHARTS_ONLY] = SCENARIOS;

describe('SCENARIOS', () => {
  it('T7-AC-01: the default set announces both capabilities and plays the timeline and the detail badge', () => {
    expect(BOTH.capabilities).toBe('charts,maps');
    expect(Object.keys(contextOf(BOTH).components)).toEqual(['Gauge', 'Timeline', 'Map']);
    expect(BOTH.requests.map((request) => request.requirement)).toEqual(['A1', 'A3']);
  });

  it('T7-AC-01: the charts set announces charts alone and asks for the slider map anyway', () => {
    const context = contextOf(CHARTS_ONLY);

    expect(CHARTS_ONLY.capabilities).toBe('charts');
    expect(Object.keys(context.components)).toEqual(['Gauge', 'Timeline']);
    expect(Object.keys(context.functions)).toEqual(['daysUntil']);
    expect(CHARTS_ONLY.requests.map((request) => request.requirement)).toEqual([
      'A1',
      'A2-without-maps',
    ]);
  });

  it("T4-AC-01: every scored request is one of the shell's badges, verbatim", () => {
    expect(BOTH.requests.map(badgeOf)).toEqual([1, 4]);
    expect(CHARTS_ONLY.requests.map(badgeOf)).toEqual([1, 2]);
    for (const request of [...BOTH.requests, ...CHARTS_ONLY.requests]) {
      expect(EXAMPLE_PROMPTS).toContain(request.prompt);
    }
  });

  // The scorer accepts these names, the model reads the context entry: both must be one list.
  it('T7-AC-01: announcedNames is exactly what the context entry announces', () => {
    const context = contextOf(CHARTS_ONLY);

    expect(announcedNames(CHARTS_ONLY.vocabularies)).toEqual({
      components: Object.keys(context.components),
      functions: Object.keys(context.functions),
    });
  });
});
