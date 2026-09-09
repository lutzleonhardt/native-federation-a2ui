import type { CatalogFragment } from '../../a2ui/assistant-catalog';
import { createCustomComponent } from '../../a2ui/custom-component';
import { distanceFn } from './distance.fn';
import { MapComponent } from './map.component';
import { MAP_META } from './map.schema';

export const mapsFragment: CatalogFragment = {
  components: [createCustomComponent({ ...MAP_META, component: MapComponent })],
  functions: [distanceFn],
};
