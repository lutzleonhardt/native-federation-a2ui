import type { CatalogFragment } from '../../a2ui/assistant-catalog';
import { createCustomComponent } from '../../a2ui/custom-component';
import { daysUntilFn } from './days-until.fn';
import { GaugeComponent } from './gauge.component';
import { GAUGE_META } from './gauge.schema';
import { TimelineComponent } from './timeline.component';
import { TIMELINE_META } from './timeline.schema';

export const chartsFragment: CatalogFragment = {
  components: [
    createCustomComponent({ ...GAUGE_META, component: GaugeComponent }),
    createCustomComponent({ ...TIMELINE_META, component: TimelineComponent }),
  ],
  functions: [daysUntilFn],
};
