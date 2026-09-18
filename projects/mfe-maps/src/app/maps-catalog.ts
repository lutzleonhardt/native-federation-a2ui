import { BASIC_FUNCTIONS, BasicCatalogBase } from '@a2ui/angular/v0_9';
import { toFragment } from '../../../../shared/capabilities/agent-capability';
import { capability } from '../capability';

export const MAPS_CATALOG_ID = 'maps-demo';

/**
 * The remote as its own A2UI host: the basic catalog plus exactly this capability.
 * Deliberately built without any shell helper — it proves the capability works
 * with any host that follows the A2UI catalog contract.
 */
export function createMapsCatalog(): BasicCatalogBase {
  const { components, functions } = toFragment(capability);
  return new BasicCatalogBase({
    id: MAPS_CATALOG_ID,
    extraComponents: [...components],
    // BasicCatalogBase treats `functions` as a replacement for the basic list,
    // not an extension — spread the basics back in or lose all of them.
    functions: [...BASIC_FUNCTIONS, ...functions],
  });
}
