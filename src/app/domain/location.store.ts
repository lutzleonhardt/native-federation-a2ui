import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { findCity, nearestCity, type City } from './cities';
import type { GeoPoint } from './geo';

const STORAGE_KEY = 'conference-finder.city';

/**
 * The picker id the page's location is fixed to, or undefined for the visitor's own city.
 * Replay provides the city its recordings were captured in.
 */
export const PINNED_CITY = new InjectionToken<string | undefined>('PINNED_CITY', {
  factory: () => undefined,
});

export interface Me extends GeoPoint {
  readonly city: string;
}

@Injectable({ providedIn: 'root' })
export class LocationStore {
  private readonly pinnedTo = inject(PINNED_CITY);
  private readonly location = signal(initialCity(this.pinnedTo));
  private asked = false;
  private manuallySelected = false;
  readonly me = computed(() => toMe(this.location()));
  /** The picker id of the current city; the recorder writes it into its file. */
  readonly cityId = computed(() => this.location()?.id);
  /** Fixed to `PINNED_CITY`: no geolocation, no picking, nothing persisted. */
  readonly pinned = this.pinnedTo !== undefined;

  /**
   * Refreshes geolocation once per page load. The saved city is a fallback
   * until the browser supplies a new position.
   */
  init(): void {
    if (this.asked || this.pinned) return;
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
    if (this.pinned) throw new Error('The location is pinned and cannot change.');
    this.manuallySelected = true;
    this.adopt(cityOrThrow(id));
  }

  private adopt(city: City): void {
    this.location.set(city);
    localStorage.setItem(STORAGE_KEY, city.id);
  }
}

function cityOrThrow(id: string): City {
  const city = findCity(id);
  if (city === undefined) throw new Error(`Unknown city id: ${id}`);
  return city;
}

/** A pinned city is neither read from nor written to storage. */
function initialCity(pinnedTo: string | undefined): City | undefined {
  return pinnedTo === undefined ? restore() : cityOrThrow(pinnedTo);
}

function restore(): City | undefined {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? undefined : findCity(stored);
}

function toMe(city: City | undefined): Me | undefined {
  return city === undefined ? undefined : { city: city.name, lat: city.lat, lon: city.lon };
}
