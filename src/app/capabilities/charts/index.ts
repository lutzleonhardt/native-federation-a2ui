import type { CatalogFragment } from '../../a2ui/assistant-catalog';
import { toFragment, type ComponentImplementations } from '../../a2ui/custom-component';
import { GaugeComponent } from './gauge.component';
import { TimelineComponent } from './timeline.component';
import { chartsVocabulary, type ChartsComponentName } from './vocabulary';

const IMPLEMENTATIONS: ComponentImplementations<ChartsComponentName> = {
  Gauge: GaugeComponent,
  Timeline: TimelineComponent,
};

export const chartsFragment: CatalogFragment = toFragment(chartsVocabulary, IMPLEMENTATIONS);
