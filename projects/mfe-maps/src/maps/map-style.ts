import type { FilterSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl';

/**
 * The basemap mood of the Departure kit (visual-language spec §8.3). Literal values on
 * purpose: they are painted inside the WebGL canvas, where custom properties do not reach.
 */
export const BASEMAP = {
  land: '#E4EAEF',
  water: '#CBDCE8',
  border: '#B7C5D0',
  label: '#64798A',
  road: '#D9E3EA',
} as const;

/** The point labels are data, not cartography: ink on a surface halo, like the kit's text. */
export const POINT_LABEL = { ink: '#10222f', halo: '#ffffff' } as const;

export const POSITRON_URL = 'https://tiles.openfreemap.org/styles/positron';
const POSITRON_GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';

/** OpenMapTiles source layers that draw or name water; their labels sit on water, not land. */
const WATER_SOURCE_LAYERS = new Set(['water', 'waterway', 'water_name']);

/**
 * Recolours a positron-like style by layer type and source layer: the cartography (layers,
 * widths, zoom ranges, filters) stays, every colour becomes the kit's.
 */
export function recolour(style: StyleSpecification): StyleSpecification {
  return { ...style, layers: style.layers.map(recolourLayer) };
}

function recolourLayer(layer: LayerSpecification): LayerSpecification {
  if (layer.paint === undefined) return layer;
  const ground = isWater(layer) ? BASEMAP.water : BASEMAP.land;
  const colours: Record<string, string> = {
    'background-color': BASEMAP.land,
    'fill-color': ground,
    'fill-outline-color': ground,
    'line-color': lineColour(layer),
    'text-color': BASEMAP.label,
    'text-halo-color': ground,
  };
  const paint = Object.fromEntries(
    Object.entries(layer.paint).map(([key, value]) => [key, colours[key] ?? value]),
  );
  return { ...layer, paint } as LayerSpecification;
}

function sourceLayerOf(layer: LayerSpecification): string | undefined {
  return 'source-layer' in layer ? layer['source-layer'] : undefined;
}

function isWater(layer: LayerSpecification): boolean {
  const sourceLayer = sourceLayerOf(layer);
  return sourceLayer !== undefined && WATER_SOURCE_LAYERS.has(sourceLayer);
}

function lineColour(layer: LayerSpecification): string {
  if (isWater(layer)) return BASEMAP.water;
  return sourceLayerOf(layer) === 'boundary' ? BASEMAP.border : BASEMAP.road;
}

/** Markers without cartography, for a basemap that could not be fetched. */
export function bareStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: POSITRON_GLYPHS,
    sources: {},
    layers: [{ id: 'land', type: 'background', paint: { 'background-color': BASEMAP.land } }],
  };
}

export const LABELS_SOURCE = 'cf-labels';
/** A transparent icon that reserves a dot's footprint in MapLibre's collision index. */
export const DOT_BOX_IMAGE = 'cf-dot-box';
/* The dot is 14 px; the label offset (1.25 em of 12 px) clears box and text padding (2 px each). */
const DOT_BOX_SIZE = 16;

export function dotBoxImage(): { width: number; height: number; data: Uint8ClampedArray } {
  return {
    width: DOT_BOX_SIZE,
    height: DOT_BOX_SIZE,
    data: new Uint8ClampedArray(DOT_BOX_SIZE * DOT_BOX_SIZE * 4),
  };
}

const NOTO_REGULAR = ['Noto Sans Regular'];
const NOTO_BOLD = ['Noto Sans Bold'];

/**
 * The labels as symbol layers, so MapLibre measures every label, tries four anchors around
 * the dot and hides what would still overlap — plain text with a halo, never boxed. The dots
 * and the user's HTML label are drawn by the DOM, invisible to the collision index; their
 * footprints are therefore reserved by transparent icons (and an invisible text for the
 * user's label) in layers above the labels: MapLibre places from the top layer down, so the
 * reservations win before any label is placed. The selected label is bold and placed first.
 */
export function labelLayers(): LayerSpecification[] {
  // The basemap's glyph stack; the endpoint serves no IBM Plex Mono.
  const forKind = (kind: 'point' | 'center'): FilterSpecification => ['==', ['get', 'kind'], kind];
  return [
    {
      id: LABELS_SOURCE,
      type: 'symbol',
      source: LABELS_SOURCE,
      filter: forKind('point'),
      layout: {
        'text-field': ['get', 'label'],
        'text-font': [
          'case',
          ['get', 'selected'],
          ['literal', NOTO_BOLD],
          ['literal', NOTO_REGULAR],
        ],
        'text-size': 12,
        'text-variable-anchor': ['left', 'right', 'top', 'bottom'],
        'text-radial-offset': 1.25,
        'text-justify': 'auto',
        'symbol-sort-key': ['case', ['get', 'selected'], 0, 1],
      },
      paint: {
        'text-color': POINT_LABEL.ink,
        'text-halo-color': POINT_LABEL.halo,
        'text-halo-width': 1.5,
      },
    },
    {
      id: `${LABELS_SOURCE}-dots`,
      type: 'symbol',
      source: LABELS_SOURCE,
      filter: forKind('point'),
      layout: { 'icon-image': DOT_BOX_IMAGE, 'icon-allow-overlap': true },
    },
    {
      id: `${LABELS_SOURCE}-center`,
      type: 'symbol',
      source: LABELS_SOURCE,
      filter: forKind('center'),
      layout: {
        'icon-image': DOT_BOX_IMAGE,
        'icon-allow-overlap': true,
        'text-allow-overlap': true,
        'text-field': ['get', 'label'],
        'text-font': NOTO_REGULAR,
        'text-size': 11,
        'text-anchor': 'left',
        'text-offset': [1.3, 0],
      },
      paint: { 'text-opacity': 0 },
    },
  ];
}
