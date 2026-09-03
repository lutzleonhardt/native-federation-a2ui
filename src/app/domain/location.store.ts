import { Injectable, signal } from '@angular/core';
import { findCity, nearestCity, type City } from './cities';
import type { GeoPoint } from './geo';

const STORAGE_KEY = 'conference-finder.city';

export interface Me extends GeoPoint {
  readonly city: string;
}

@Injectable({ providedIn: 'root' })
export class LocationStore {
  private readonly location = signal<Me | undefined>(restore());
  private asked = false;
  readonly me = this.location.asReadonly();

  /**
   * Asks for geolocation once and snaps to the nearest offered city. A city
   * chosen earlier wins, so a returning user is never prompted again.
   */
  init(): void {
    if (this.asked || this.location() !== undefined) return;
    this.asked = true;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => this.snapTo(coords),
      // Denied or unavailable: `me` stays undefined until `setCity`.
      () => undefined,
    );
  }

  // The permission prompt stays open until the user answers it, so a city picked
  // in the meantime must survive a late callback.
  private snapTo(coords: GeolocationCoordinates): void {
    if (this.location() !== undefined) return;
    this.adopt(nearestCity({ lat: coords.latitude, lon: coords.longitude }));
  }

  setCity(id: string): void {
    const city = findCity(id);
    if (city === undefined) throw new Error(`Unknown city id: ${id}`);
    this.adopt(city);
  }

  private adopt(city: City): void {
    this.location.set({ city: city.name, lat: city.lat, lon: city.lon });
    localStorage.setItem(STORAGE_KEY, city.id);
  }
}

function restore(): Me | undefined {
  const stored = localStorage.getItem(STORAGE_KEY);
  const city = stored === null ? undefined : findCity(stored);
  if (city === undefined) return undefined;
  return { city: city.name, lat: city.lat, lon: city.lon };
}
