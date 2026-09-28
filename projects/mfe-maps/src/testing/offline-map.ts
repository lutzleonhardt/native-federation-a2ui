import type { Provider } from '@angular/core';
import type { StyleSpecification } from 'maplibre-gl';
import { MAP_RESOURCES, type MapResources } from '../maps/map-resources';

/** Nothing to fetch; `glyphs` only satisfies the validator of the label layer. */
export const OFFLINE_STYLE: StyleSpecification = {
  version: 8,
  glyphs: 'offline://{fontstack}/{range}',
  sources: {},
  layers: [],
};

/**
 * MapLibre parses tiles and GeoJSON and asks for glyphs from its worker; a stub that never
 * answers keeps every such request from ever being made.
 */
const STUB_WORKER_URL = URL.createObjectURL(
  new Blob(['/* MapLibre worker stub for specs: never answers */'], { type: 'text/javascript' }),
);

export const OFFLINE_MAP: MapResources = {
  loadStyle: () => Promise.resolve(OFFLINE_STYLE),
  workerUrl: STUB_WORKER_URL,
};

/** Specs render the real MapLibre map, but no style, tile, glyph or worker request leaves the page. */
export function provideOfflineMap(): Provider {
  return { provide: MAP_RESOURCES, useValue: OFFLINE_MAP };
}
