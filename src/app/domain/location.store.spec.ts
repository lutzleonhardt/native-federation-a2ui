import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocationStore, PINNED_CITY } from './location.store';

const NEAR_MUNICH = { lat: 48.2489, lon: 11.6532 };

function grantPosition(lat: number, lon: number): void {
  vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((onPosition) =>
    onPosition({ coords: { latitude: lat, longitude: lon } } as unknown as GeolocationPosition),
  );
}

/** A fresh store, as a page load constructs it; `PINNED_CITY` comes from the TestBed. */
function freshStore(): LocationStore {
  return TestBed.runInInjectionContext(() => new LocationStore());
}

/** The next page load pinned to `city`; a store built before it belongs to the previous load. */
function pinTo(city: string): void {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: PINNED_CITY, useValue: city }] });
}

function denyPermission(): void {
  vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((_onPosition, onError) =>
    onError?.({ code: 1, message: 'denied' } as GeolocationPositionError),
  );
}

describe('LocationStore', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('T3-AC-07 snaps a granted position to the nearest offered city', () => {
    grantPosition(NEAR_MUNICH.lat, NEAR_MUNICH.lon);
    const store = freshStore();

    store.init();

    expect(store.me()?.city).toBe('Munich');
  });

  it('T3-AC-07 stays undefined on a denied permission until a city is picked', () => {
    denyPermission();
    const store = freshStore();

    store.init();
    expect(store.me()).toBeUndefined();

    expect(store.cityId()).toBeUndefined();

    store.setCity('berlin');
    expect(store.me()).toEqual({ city: 'Berlin', lat: 52.52, lon: 13.405 });
    expect(store.cityId()).toBe('berlin');
  });

  it('refreshes a saved city from geolocation on every page load', () => {
    freshStore().setCity('berlin');

    let answerPrompt: PositionCallback | undefined;
    const askForPosition = vi
      .spyOn(navigator.geolocation, 'getCurrentPosition')
      .mockImplementation((onPosition) => {
        answerPrompt = onPosition;
      });
    const returning = freshStore();
    returning.init();

    expect(returning.me()?.city).toBe('Berlin');
    expect(askForPosition).toHaveBeenCalledTimes(1);
    answerPrompt?.({
      coords: { latitude: 51.0504, longitude: 13.7373 },
    } as unknown as GeolocationPosition);

    expect(returning.me()?.city).toBe('Dresden');
    expect(localStorage.getItem('conference-finder.city')).toBe('dresden');

    const reloaded = freshStore();
    reloaded.init();
    expect(reloaded.me()?.city).toBe('Dresden');
    expect(askForPosition).toHaveBeenCalledTimes(2);
  });

  it('keeps the saved city as a fallback if geolocation is denied', () => {
    freshStore().setCity('berlin');
    denyPermission();
    const returning = freshStore();

    returning.init();

    expect(returning.me()?.city).toBe('Berlin');
  });

  it('asks for geolocation only once, however often init runs', () => {
    const askForPosition = vi
      .spyOn(navigator.geolocation, 'getCurrentPosition')
      .mockImplementation(() => undefined);
    const store = freshStore();

    store.init();
    store.init();
    store.init();

    expect(askForPosition).toHaveBeenCalledTimes(1);
  });

  it('keeps a city picked while the permission prompt is still open', () => {
    freshStore().setCity('berlin');
    let answerPrompt: PositionCallback | undefined;
    vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((onPosition) => {
      answerPrompt = onPosition;
    });
    const store = freshStore();

    store.init();
    store.setCity('berlin');
    answerPrompt?.({
      coords: { latitude: NEAR_MUNICH.lat, longitude: NEAR_MUNICH.lon },
    } as unknown as GeolocationPosition);

    expect(store.me()?.city).toBe('Berlin');
  });

  it('rejects a city id that is not on offer, picked or pinned', () => {
    expect(() => freshStore().setCity('atlantis')).toThrow(/atlantis/);
    pinTo('atlantis');
    expect(() => freshStore()).toThrow(/atlantis/);
  });

  it('T4.5-AC-05 pinned to a city it is that city: no geolocation, nothing saved, no picking', () => {
    freshStore().setCity('berlin');
    const askForPosition = vi
      .spyOn(navigator.geolocation, 'getCurrentPosition')
      .mockImplementation(() => undefined);
    pinTo('dresden');
    const pinned = freshStore();

    pinned.init();

    expect(pinned.pinned).toBe(true);
    expect(pinned.me()).toEqual({ city: 'Dresden', lat: 51.0504, lon: 13.7373 });
    expect(pinned.cityId()).toBe('dresden');
    expect(askForPosition).not.toHaveBeenCalled();
    expect(localStorage.getItem('conference-finder.city')).toBe('berlin');
    expect(() => pinned.setCity('berlin')).toThrow(/pinned/);
    expect(pinned.me()?.city).toBe('Dresden');
  });
});
