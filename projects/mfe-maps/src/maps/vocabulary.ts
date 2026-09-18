import type { CapabilityVocabulary } from '../../../../shared/capabilities/agent-capability';
import { distanceFn } from './distance.fn';
import { MAP_META } from './map.schema';

/** The components maps announces; `capability.ts` implements exactly this set. */
export type MapsComponentName = 'Map';

/**
 * The model-facing half of the maps capability — the eval harness reads it
 * under Node, so nothing here may import a `*.component.ts`.
 */
export const mapsVocabulary = {
  components: { Map: MAP_META },
  functions: [distanceFn],
} satisfies CapabilityVocabulary<MapsComponentName>;
