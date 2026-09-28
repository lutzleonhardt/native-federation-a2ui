import { z } from 'zod/v3';
import {
  createCatalogFunction,
  type AssistantFunction,
} from '../../../../shared/capabilities/catalog-function';
import { haversineKm } from './geo';

const geoPointSchema = z.object({ lat: z.number(), lon: z.number() });

export const filterWithinKmFn: AssistantFunction = createCatalogFunction(
  {
    name: 'filterWithinKm',
    description:
      'The points whose distance to `center` is at most `maxKm` kilometres, in input order; ' +
      'extra fields pass through. Use it to let a Slider filter a Map without a new request: ' +
      'bind it to the Map\'s `points` with `points` {"path": "/filteredConfs"}, `center` ' +
      '{"path": "/me"} and `maxKm` bound to the path a Slider writes, e.g. {"path": "/filter/maxKm"}; ' +
      'initialise that path with updateDataModel before the surface renders.',
    returnType: 'array',
    schema: z.object({
      points: z
        .array(geoPointSchema.passthrough())
        .describe('The candidates, objects with lat/lon fields, e.g. /filteredConfs.'),
      center: geoPointSchema.describe('The reference point, e.g. the user location /me.'),
      maxKm: z
        .number()
        .nonnegative()
        .describe('The radius in kilometres, e.g. the value a Slider writes.'),
    }),
  },
  (args) => args.points.filter((point) => haversineKm(args.center, point) <= args.maxKm),
);
