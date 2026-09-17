import type {
  AgentCapability,
  ComponentImplementations,
} from '../../../shared/capabilities/agent-capability';
import { GaugeComponent } from './charts/gauge.component';
import { TimelineComponent } from './charts/timeline.component';
import { chartsVocabulary, type ChartsComponentName } from './charts/vocabulary';

const IMPLEMENTATIONS: ComponentImplementations<ChartsComponentName> = {
  Gauge: GaugeComponent,
  Timeline: TimelineComponent,
};

/** The exposed module (`./capability`): the only thing a host imports from this remote at runtime. */
export const capability: AgentCapability = {
  name: 'charts',
  vocabulary: chartsVocabulary,
  components: IMPLEMENTATIONS,
};
