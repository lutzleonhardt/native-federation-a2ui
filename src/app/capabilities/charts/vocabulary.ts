import type { CapabilityVocabulary } from '../../a2ui/custom-component';
import { daysUntilFn } from './days-until.fn';
import { GAUGE_META } from './gauge.schema';
import { TIMELINE_META } from './timeline.schema';

/** The components charts announces; `index.ts` implements exactly this set. */
export type ChartsComponentName = 'Gauge' | 'Timeline';

/**
 * The model-facing half of the charts capability — the eval harness reads it
 * under Node, so nothing here may import a `*.component.ts`.
 */
export const chartsVocabulary = {
  components: { Gauge: GAUGE_META, Timeline: TIMELINE_META },
  functions: [daysUntilFn],
} satisfies CapabilityVocabulary<ChartsComponentName>;
