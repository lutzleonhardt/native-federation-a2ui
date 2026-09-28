import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { BASEMAP, recolour } from './map-style';

/** A cut of OpenFreeMap's positron: one layer per rule the recolouring applies. */
const POSITRON_CUT: StyleSpecification = {
  version: 8,
  sources: { openmaptiles: { type: 'vector', url: 'https://tiles.example/planet' } },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': 'rgb(242,243,240)' } },
    {
      id: 'park',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'park',
      paint: { 'fill-color': 'rgb(230,233,229)' },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: { 'fill-color': 'rgb(194,200,202)', 'fill-antialias': true },
    },
    {
      id: 'building',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'building',
      paint: { 'fill-color': 'rgb(234,234,229)', 'fill-outline-color': 'rgb(219,219,218)' },
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'waterway',
      paint: { 'line-color': 'hsl(195,17%,78%)' },
    },
    {
      id: 'highway_motorway_inner',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      layout: { 'line-cap': 'round' },
      paint: {
        'line-color': ['interpolate', ['linear'], ['zoom'], 5.8, 'hsla(0,0%,85%,0.53)', 6, '#fff'],
        'line-width': 2,
      },
    },
    {
      id: 'boundary_2',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      paint: { 'line-color': 'hsl(0,0%,70%)', 'line-dasharray': [3, 1] },
    },
    {
      id: 'label_city',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      layout: { 'text-field': '{name}' },
      paint: { 'text-color': '#000', 'text-halo-color': '#fff' },
    },
    {
      id: 'water_name',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'water_name',
      paint: { 'text-color': '#495e91', 'text-halo-color': 'rgba(255,255,255,0.7)' },
    },
  ],
};

function layerOf(style: StyleSpecification, id: string): LayerSpecification {
  const layer = style.layers.find((candidate) => candidate.id === id);
  if (layer === undefined) throw new Error(`no layer ${id}`);
  return layer;
}

describe('recolour', () => {
  const recoloured = recolour(POSITRON_CUT);
  const paintOf = (id: string) => layerOf(recoloured, id).paint;

  it('T2-AC-01 paints land, water, borders, roads and labels in the kit colours by layer type and source layer', () => {
    expect(paintOf('background')).toEqual({ 'background-color': BASEMAP.land });
    expect(paintOf('park')).toEqual({ 'fill-color': BASEMAP.land });
    expect(paintOf('water')).toEqual({ 'fill-color': BASEMAP.water, 'fill-antialias': true });
    expect(paintOf('building')).toEqual({
      'fill-color': BASEMAP.land,
      'fill-outline-color': BASEMAP.land,
    });
    expect(paintOf('waterway')).toEqual({ 'line-color': BASEMAP.water });
    expect(paintOf('highway_motorway_inner')).toEqual({
      'line-color': BASEMAP.road,
      'line-width': 2,
    });
    expect(paintOf('boundary_2')).toEqual({
      'line-color': BASEMAP.border,
      'line-dasharray': [3, 1],
    });
    expect(paintOf('label_city')).toEqual({
      'text-color': BASEMAP.label,
      'text-halo-color': BASEMAP.land,
    });
    expect(paintOf('water_name')).toEqual({
      'text-color': BASEMAP.label,
      'text-halo-color': BASEMAP.water,
    });
  });

  it('keeps the cartography: layer order, layout and sources stay, the input is untouched', () => {
    expect(recoloured.layers.map((layer) => layer.id)).toEqual(
      POSITRON_CUT.layers.map((layer) => layer.id),
    );
    expect(layerOf(recoloured, 'highway_motorway_inner').layout).toEqual({ 'line-cap': 'round' });
    expect(recoloured.sources).toBe(POSITRON_CUT.sources);
    expect(layerOf(POSITRON_CUT, 'background').paint).toEqual({
      'background-color': 'rgb(242,243,240)',
    });
  });
});
