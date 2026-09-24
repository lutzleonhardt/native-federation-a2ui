import { z } from 'zod/v3';
import { actionSchema } from '../../../../shared/capabilities/action-schema';
import { binding } from '../../../../shared/capabilities/binding';
import type { ComponentMeta } from '../../../../shared/capabilities/custom-component';

const mapPointSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    lat: z.number(),
    lon: z.number(),
  })
  .passthrough();

export const mapSchema = z.object({
  points: binding(z.array(mapPointSchema)).describe(
    'The items to plot; extra fields pass through untouched.',
  ),
  center: binding(z.object({ lat: z.number(), lon: z.number(), city: z.string().optional() }))
    .optional()
    .describe("Distinct reference marker; bind it to the user's location, e.g. {\"path\": \"/me\"}."),
  selected: binding(z.any())
    .optional()
    .describe('Bind a data path; a click writes the whole clicked point there.'),
  action: actionSchema.optional().describe('Optional action dispatched on click.'),
});

export const MAP_META = {
  name: 'Map',
  description:
    'Shows items that have `lat`/`lon` as labelled markers on a simple projected map. ' +
    'A click writes the whole clicked object (all fields) to the path bound to `selected`; ' +
    "bind `center` to the user's location, e.g. center {\"path\": \"/me\"} and " +
    'selected {"path": "/selectedConf"}. Use it for "where" and "near me" questions.',
  schema: mapSchema,
} satisfies ComponentMeta<typeof mapSchema>;
