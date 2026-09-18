import type {
  AgentCapability,
  ComponentImplementations,
} from '../../../shared/capabilities/agent-capability';
import { MapComponent } from './maps/map.component';
import { mapsVocabulary, type MapsComponentName } from './maps/vocabulary';

const IMPLEMENTATIONS: ComponentImplementations<MapsComponentName> = {
  Map: MapComponent,
};

/** The exposed module (`./capability`): the only thing a host imports from this remote at runtime. */
export const capability: AgentCapability = {
  name: 'maps',
  vocabulary: mapsVocabulary,
  components: IMPLEMENTATIONS,
};
