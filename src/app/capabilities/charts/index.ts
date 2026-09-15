import type {
  AgentCapability,
  ComponentImplementations,
} from '../../../../shared/capabilities/agent-capability';
import { GaugeComponent } from './gauge.component';
import { TimelineComponent } from './timeline.component';
import { chartsVocabulary, type ChartsComponentName } from './vocabulary';

const IMPLEMENTATIONS: ComponentImplementations<ChartsComponentName> = {
  Gauge: GaugeComponent,
  Timeline: TimelineComponent,
};

export const chartsCapability: AgentCapability = {
  name: 'charts',
  vocabulary: chartsVocabulary,
  components: IMPLEMENTATIONS,
};
