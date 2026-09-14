import type { CatalogFragment } from '../../a2ui/assistant-catalog';
import { toFragment, type ComponentImplementations } from '../../a2ui/custom-component';
import { MapComponent } from './map.component';
import { mapsVocabulary, type MapsComponentName } from './vocabulary';

const IMPLEMENTATIONS: ComponentImplementations<MapsComponentName> = {
  Map: MapComponent,
};

export const mapsFragment: CatalogFragment = toFragment(mapsVocabulary, IMPLEMENTATIONS);
