import type {
  AgentCapability,
  ComponentImplementations,
} from '../../../../shared/capabilities/agent-capability';
import { MapComponent } from './map.component';
import { mapsVocabulary, type MapsComponentName } from './vocabulary';

const IMPLEMENTATIONS: ComponentImplementations<MapsComponentName> = {
  Map: MapComponent,
};

export const mapsCapability: AgentCapability = {
  name: 'maps',
  vocabulary: mapsVocabulary,
  components: IMPLEMENTATIONS,
};
