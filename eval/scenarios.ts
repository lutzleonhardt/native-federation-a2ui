import type { CapabilityVocabulary } from '../shared/capabilities/agent-capability';
import { chartsVocabulary } from '../projects/mfe-charts/src/charts/vocabulary';
import { mapsVocabulary } from '../projects/mfe-maps/src/maps/vocabulary';
import { EXAMPLE_PROMPTS } from '../src/app/chat/example-prompts';
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
  /** Each request is the first message of a fresh session, as a replayed badge is. */
  readonly requests: readonly ScoredRequest[];
}

/** The shell's badges, word for word — the harness never spells its own. */
const [WHEN_BADGE, WHERE_BADGE, , DETAILS_BADGE] = EXAMPLE_PROMPTS;

/**
 * The badges the scorer's three requirements fit. The slider form (badge 2 with maps)
 * and the comparison (badge 3) are judged by eye when they are recorded, not here.
 */
export const SCENARIOS: readonly Scenario[] = [
  {
    capabilities: 'charts,maps',
    vocabularies: [chartsVocabulary, mapsVocabulary],
    requests: [
      { requirement: 'A1', prompt: WHEN_BADGE },
      { requirement: 'A3', prompt: DETAILS_BADGE },
    ],
  },
  {
    capabilities: 'charts',
    vocabularies: [chartsVocabulary],
    requests: [
      { requirement: 'A1', prompt: WHEN_BADGE },
      { requirement: 'A2-without-maps', prompt: WHERE_BADGE },
    ],
  },
];

/** The badge's number in the shell's row, for the report. */
export function badgeOf(request: ScoredRequest): number {
  return EXAMPLE_PROMPTS.indexOf(request.prompt) + 1;
}

/** The custom names a scenario announces — what the scorer accepts beyond the basic catalog. */
export function announcedNames(
  vocabularies: readonly CapabilityVocabulary<string>[],
): AnnouncedNames {
  return {
    components: vocabularies.flatMap((vocabulary) => Object.keys(vocabulary.components)),
    functions: vocabularies.flatMap((vocabulary) => vocabulary.functions.map((fn) => fn.name)),
  };
}
