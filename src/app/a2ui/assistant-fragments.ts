import { chartsFragment } from '../capabilities/charts';
import { mapsFragment } from '../capabilities/maps';
import type { CatalogFragment } from './assistant-catalog';

/** The one list behind both the rendered catalog and the model's vocabulary context. */
export const ASSISTANT_FRAGMENTS: readonly CatalogFragment[] = [chartsFragment, mapsFragment];
