import { z } from 'zod/v3';
import { actionSchema } from '../../a2ui/action-schema';
import { binding } from '../../a2ui/binding';
import type { ComponentMeta } from '../../a2ui/custom-component';

const timelineItemSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    date: z.string().describe('ISO date, YYYY-MM-DD.'),
  })
  .passthrough();

export const timelineSchema = z.object({
  items: binding(z.array(timelineItemSchema)).describe(
    'The items to place on the axis; extra fields pass through untouched.',
  ),
  range: binding(z.object({ from: z.string(), to: z.string() }))
    .optional()
    .describe('Fixed axis range as ISO dates; defaults to the span of the items.'),
  selected: binding(z.any())
    .optional()
    .describe('Bind a data path; a click writes the whole clicked item there.'),
  action: actionSchema.optional().describe('Optional action dispatched on click.'),
});

export const TIMELINE_META = {
  name: 'Timeline',
  description:
    'Horizontal time axis for items that have a `date` — one labelled marker per item, ' +
    'ordered by date. A click writes the whole clicked object (all fields) to the path ' +
    'bound to `selected`, so other components can bind sub-paths of that target, e.g. ' +
    'selected {"path": "/conf"} and a Text with text {"path": "/conf/name"}.',
  schema: timelineSchema,
} satisfies ComponentMeta<typeof timelineSchema>;
