import { chartsFragment } from '../capabilities/charts';
import { mapsFragment } from '../capabilities/maps';
import type { CatalogFragment } from './assistant-catalog';

/**
 * What the renderer implements. The model-facing twin lives in `catalog-context.ts`,
 * which must stay Angular-free; a spec there pins that both lists name the same
 * components and functions.
 */
export const ASSISTANT_FRAGMENTS: readonly CatalogFragment[] = [chartsFragment, mapsFragment];
