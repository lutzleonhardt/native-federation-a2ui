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
  private manuallySelected = false;
  readonly me = this.location.asReadonly();

  /**
   * Refreshes geolocation once per page load. The saved city is a fallback
   * until the browser supplies a new position.
   */
  init(): void {
    if (this.asked) return;
    this.asked = true;
    if (!navigator.geolocation) {
      console.warn('[LocationStore] Geolocation API unavailable; choose a city manually.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => this.snapTo(coords),
      ({ code, message }) =>
        console.warn('[LocationStore] Geolocation failed; keeping the current city.', { code, message }),
    );
  }

  // The permission prompt stays open until the user answers it, so a city picked
  // in the meantime must survive a late callback.
  private snapTo(coords: GeolocationCoordinates): void {
    if (this.manuallySelected) return;
    this.adopt(nearestCity({ lat: coords.latitude, lon: coords.longitude }));
  }

  setCity(id: string): void {
    const city = findCity(id);
    if (city === undefined) throw new Error(`Unknown city id: ${id}`);
    this.manuallySelected = true;
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
