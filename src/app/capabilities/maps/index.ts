import type { CatalogFragment } from '../../a2ui/assistant-catalog';
import { distanceFn } from './distance.fn';

export const mapsFragment: CatalogFragment = {
  components: [],
  functions: [distanceFn],
};
