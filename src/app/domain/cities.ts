import { haversineKm, type GeoPoint } from './geo';

export interface City extends GeoPoint {
  readonly id: string;
  readonly name: string;
}

/** Fallback locations offered by the picker when geolocation is unavailable or denied. */
export const CITIES: readonly City[] = [
  { id: 'berlin', name: 'Berlin', lat: 52.52, lon: 13.405 },
  { id: 'muenchen', name: 'München', lat: 48.1372, lon: 11.5756 },
  { id: 'wien', name: 'Wien', lat: 48.2082, lon: 16.3738 },
  { id: 'zuerich', name: 'Zürich', lat: 47.3769, lon: 8.5417 },
  { id: 'hamburg', name: 'Hamburg', lat: 53.5511, lon: 9.9937 },
  { id: 'koeln', name: 'Köln', lat: 50.9375, lon: 6.9603 },
  { id: 'frankfurt', name: 'Frankfurt', lat: 50.1109, lon: 8.6821 },
  { id: 'amsterdam', name: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
  { id: 'prag', name: 'Prag', lat: 50.0755, lon: 14.4378 },
  { id: 'warschau', name: 'Warschau', lat: 52.2297, lon: 21.0122 },
];

export function findCity(id: string): City | undefined {
  return CITIES.find((city) => city.id === id);
}

export function nearestCity(point: GeoPoint): City {
  return CITIES.reduce((closest, city) =>
    haversineKm(point, city) < haversineKm(point, closest) ? city : closest,
  );
}
