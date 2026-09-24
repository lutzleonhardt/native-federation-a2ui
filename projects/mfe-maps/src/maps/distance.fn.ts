import { z } from 'zod/v3';
import {
  createCatalogFunction,
  type AssistantFunction,
} from '../../../../shared/capabilities/catalog-function';
import { haversineKm } from './geo';

const geoPointSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

export const distanceFn: AssistantFunction = createCatalogFunction(
  {
    name: 'distance',
    description:
      'Distance in whole kilometres between two points with lat/lon fields. ' +
      'Use it for "N km away" labels, e.g. distance between /me and /selectedConf.',
    returnType: 'number',
    schema: z.object({
      a: geoPointSchema.describe('First point, e.g. the user location /me.'),
      b: geoPointSchema.describe('Second point, e.g. the selected conference /selectedConf.'),
    }),
  },
  (args) => Math.round(haversineKm(args.a, args.b)),
);
