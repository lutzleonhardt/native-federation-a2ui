import type { CapabilityVocabulary } from '../shared/capabilities/agent-capability';
import { chartsVocabulary } from '../projects/mfe-charts/src/charts/vocabulary';
import { mapsVocabulary } from '../projects/mfe-maps/src/maps/vocabulary';
import type { AnnouncedNames, Requirement } from './score';

export interface ScoredRequest {
  readonly requirement: Requirement;
  readonly prompt: string;
}

export interface Scenario {
  /** The announced set, named like the shell's `?capabilities=` value. */
  readonly capabilities: string;
  /** The `vocabulary.ts` files, not the capabilities: their Angular half does not load under Node. */
  readonly vocabularies: readonly CapabilityVocabulary<string>[];
  /** One conversation: every request continues the one before it. */
  readonly requests: readonly ScoredRequest[];
}

const CONFERENCES_REQUEST = 'Welche Angular-Konferenzen gibt es in den nächsten Monaten?';
const MAP_REQUEST = 'Zeig sie auf einer Karte';
const DETAILS_REQUEST =
  'Wann ist die nächste in meiner Nähe? Wenn ich eine anklicke, will ich Details.';

/** Every eval run plays all of them; the second is the live moment before maps is switched on. */
export const SCENARIOS: readonly Scenario[] = [
  {
    capabilities: 'charts,maps',
    vocabularies: [chartsVocabulary, mapsVocabulary],
    requests: [
      { requirement: 'A1', prompt: CONFERENCES_REQUEST },
      { requirement: 'A2', prompt: MAP_REQUEST },
      { requirement: 'A3', prompt: DETAILS_REQUEST },
    ],
  },
  {
    capabilities: 'charts',
    vocabularies: [chartsVocabulary],
    requests: [
      { requirement: 'A1', prompt: CONFERENCES_REQUEST },
      { requirement: 'A2-without-maps', prompt: MAP_REQUEST },
    ],
  },
];

/** The custom names a scenario announces — what the scorer accepts beyond the basic catalog. */
export function announcedNames(
  vocabularies: readonly CapabilityVocabulary<string>[],
): AnnouncedNames {
  return {
    components: vocabularies.flatMap((vocabulary) => Object.keys(vocabulary.components)),
    functions: vocabularies.flatMap((vocabulary) => vocabulary.functions.map((fn) => fn.name)),
  };
}
