import { z } from 'zod/v3';
import { binding } from '../../../../shared/capabilities/binding';
import type { ComponentMeta } from '../../../../shared/capabilities/custom-component';

export const gaugeSchema = z.object({
  value: binding(z.number()).describe('Current amount, e.g. remaining tickets.'),
  max: binding(z.number()).describe('Full-scale amount, e.g. total capacity.'),
  label: binding(z.string()).optional().describe('Short caption rendered under the numbers.'),
});

export const GAUGE_META = {
  name: 'Gauge',
  description:
    'Semicircular gauge showing a quantity against its maximum — built for remaining tickets ' +
    '("Restkarten"). Bind value and max to data paths, e.g. value {"path": "/selectedConf/remaining"} ' +
    'and max {"path": "/selectedConf/capacity"}; the numbers are rendered inside the arc.',
  schema: gaugeSchema,
} satisfies ComponentMeta<typeof gaugeSchema>;
