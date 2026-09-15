import {
  toFragment,
  type CatalogFragment,
  type ComponentImplementations,
} from '../../../../shared/capabilities/agent-capability';
import { GaugeComponent } from './gauge.component';
import { TimelineComponent } from './timeline.component';
import { chartsVocabulary, type ChartsComponentName } from './vocabulary';

const IMPLEMENTATIONS: ComponentImplementations<ChartsComponentName> = {
  Gauge: GaugeComponent,
  Timeline: TimelineComponent,
};

export const chartsFragment: CatalogFragment = toFragment(chartsVocabulary, IMPLEMENTATIONS);
