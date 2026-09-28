import type { Feature, FeatureCollection, Point } from 'geojson';
import { Marker } from 'maplibre-gl';
import type { MapCenter, MapPoint } from './map.component';

/** `label` first, then a conference's `name`, then the id: path-bound points skip validation. */
export function labelOf(point: MapPoint): string {
  return String(point.label ?? point['name'] ?? point.id);
}

/** Screen offset of a dot from its coordinate, in pixels. */
export type PixelOffset = readonly [number, number];

const SPREAD_RADIUS = 7;

/**
 * Dots with identical coordinates (two conferences in one city, or a conference in the
 * user's city) are spread on a small circle so each stays visible and clickable; the spread
 * is deterministic and holds at every zoom.
 */
export function pixelOffsets(
  coords: readonly { readonly lat: number; readonly lon: number }[],
): PixelOffset[] {
  const stacks = new Map<string, number[]>();
  coords.forEach((coord, index) => {
    const key = `${coord.lat},${coord.lon}`;
    stacks.set(key, [...(stacks.get(key) ?? []), index]);
  });
  const offsets: PixelOffset[] = coords.map(() => [0, 0]);
  for (const indices of stacks.values()) {
    if (indices.length < 2) continue;
    indices.forEach((pointIndex, slot) => {
      const angle = (2 * Math.PI * slot) / indices.length;
      offsets[pointIndex] = [SPREAD_RADIUS * Math.cos(angle), SPREAD_RADIUS * Math.sin(angle)];
    });
  }
  return offsets;
}

/** A dot as an HTML marker, so a DOM click (or Enter/Space) reaches the component's pick. */
export function createPointMarker(
  document: Document,
  point: MapPoint,
  offset: PixelOffset,
  onPick: () => void,
): Marker {
  const element = document.createElement('div');
  element.className = 'cf-marker';
  element.dataset['id'] = point.id;
  element.setAttribute('role', 'button');
  element.setAttribute('aria-label', labelOf(point));
  element.tabIndex = 0;
  element.addEventListener('click', (event) => {
    event.stopPropagation();
    onPick();
  });
  element.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onPick();
  });
  return new Marker({ element, offset: [offset[0], offset[1]] }).setLngLat([point.lon, point.lat]);
}

/**
 * The user's location: a ringed dot with the city beside it. HTML rather than a symbol
 * layer because the glyph endpoint has no mono face for the city.
 */
export function createCenterMarker(
  document: Document,
  center: MapCenter,
  offset: PixelOffset,
): Marker {
  const element = document.createElement('div');
  element.className = 'cf-center';
  element.setAttribute('role', 'img');
  element.setAttribute(
    'aria-label',
    center.city === undefined ? 'Your location' : `Your location: ${center.city}`,
  );
  if (center.city !== undefined) {
    const label = document.createElement('span');
    label.className = 'cf-center-label';
    label.textContent = center.city;
    element.append(label);
  }
  return new Marker({ element, offset: [offset[0], offset[1]] }).setLngLat([
    center.lon,
    center.lat,
  ]);
}

/** One feature per dot: the label, whether it is the selection, and which layer draws it. */
interface LabelProperties {
  readonly kind: 'point' | 'center';
  readonly label: string;
  readonly selected: boolean;
}

/** The labels as GeoJSON for the symbol layers, where MapLibre measures and resolves collisions. */
export function labelCollection(
  points: readonly MapPoint[],
  center: MapCenter | undefined,
  selectedId: unknown,
): FeatureCollection<Point, LabelProperties> {
  const features = points.map((point) =>
    feature(point, { kind: 'point', label: labelOf(point), selected: point.id === selectedId }),
  );
  if (center !== undefined) {
    features.push(feature(center, { kind: 'center', label: center.city ?? '', selected: false }));
  }
  return { type: 'FeatureCollection', features };
}

function feature(
  at: { readonly lat: number; readonly lon: number },
  properties: LabelProperties,
): Feature<Point, LabelProperties> {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [at.lon, at.lat] },
    properties,
  };
}
