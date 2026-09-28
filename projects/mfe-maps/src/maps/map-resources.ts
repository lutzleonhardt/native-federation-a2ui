import { InjectionToken } from '@angular/core';
import type { StyleSpecification } from 'maplibre-gl';
import { POSITRON_URL, recolour } from './map-style';

/** What MapLibre loads from outside the bundle: the basemap style and its worker script. */
export interface MapResources {
  readonly loadStyle: () => Promise<StyleSpecification>;
  readonly workerUrl: string;
}

/**
 * MapLibre spawns its worker from a file beside its own module, which no bundler copies. The
 * remote ships worker and shared chunk as assets (angular.json) under `maplibre/`, at the
 * same root as this chunk in the standalone and the federated build.
 */
const WORKER_URL = new URL('maplibre/maplibre-gl-worker.mjs', import.meta.url).href;

export const MAP_RESOURCES = new InjectionToken<MapResources>('MAP_RESOURCES', {
  providedIn: 'root',
  factory: (): MapResources => ({
    loadStyle: async () => recolour(await (await fetch(POSITRON_URL)).json()),
    workerUrl: WORKER_URL,
  }),
});
