import { chartsFragment } from '../capabilities/charts';
import { mapsFragment } from '../capabilities/maps';
import type { CatalogFragment } from '../../../shared/capabilities/agent-capability';

/**
 * What the renderer implements: each capability's vocabulary paired with its
 * Angular components. `catalog-context.ts` announces the same vocabulary to the
 * model without the Angular half; a spec there pins that both name the same set.
 */
export const ASSISTANT_FRAGMENTS: readonly CatalogFragment[] = [chartsFragment, mapsFragment];
