import {
  toFragment,
  type CatalogFragment,
  type ComponentImplementations,
} from '../../../../shared/capabilities/agent-capability';
import { MapComponent } from './map.component';
import { mapsVocabulary, type MapsComponentName } from './vocabulary';

const IMPLEMENTATIONS: ComponentImplementations<MapsComponentName> = {
  Map: MapComponent,
};

export const mapsFragment: CatalogFragment = toFragment(mapsVocabulary, IMPLEMENTATIONS);
