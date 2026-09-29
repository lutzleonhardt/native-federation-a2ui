import { findConferencesArgsSchema } from '../../domain/find-conferences.schema';

/** Framework-free: the Angular registration and the Node eval harness share it. */
export const findConferencesDefinition = {
  name: 'findConferences',
  description:
    'Search the conference catalog by topic, date window, and distance from the user. ' +
    'The client keeps the latest search result and mounts it at /filteredConfs when you call ' +
    'renderSurface (grouped counts at /byMonth or /byTopic). Every mounted conference has the ' +
    'fields id, name, topic, city, country, lat, lon, date (ISO), capacity, remaining, price, url ' +
    "and, when the user's location is known, distanceKm. " +
    'You get back only a compact summary — bind the data, never copy it.',
  parameters: findConferencesArgsSchema,
} as const;
