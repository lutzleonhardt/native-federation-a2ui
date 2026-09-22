import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocationStore } from './location.store';

const NEAR_MUNICH = { lat: 48.2489, lon: 11.6532 };

function grantPosition(lat: number, lon: number): void {
  vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((onPosition) =>
    onPosition({ coords: { latitude: lat, longitude: lon } } as unknown as GeolocationPosition),
  );
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
    const store = new LocationStore();

    store.init();

    expect(store.me()?.city).toBe('Munich');
  });

  it('T3-AC-07 stays undefined on a denied permission until a city is picked', () => {
    denyPermission();
    const store = new LocationStore();

    store.init();
    expect(store.me()).toBeUndefined();

    store.setCity('berlin');
    expect(store.me()).toEqual({ city: 'Berlin', lat: 52.52, lon: 13.405 });
  });

  it('refreshes a saved city from geolocation on every page load', () => {
    new LocationStore().setCity('berlin');

    let answerPrompt: PositionCallback | undefined;
    const askForPosition = vi
      .spyOn(navigator.geolocation, 'getCurrentPosition')
      .mockImplementation((onPosition) => {
        answerPrompt = onPosition;
      });
    const returning = new LocationStore();
    returning.init();

    expect(returning.me()?.city).toBe('Berlin');
    expect(askForPosition).toHaveBeenCalledTimes(1);
    answerPrompt?.({
      coords: { latitude: 51.0504, longitude: 13.7373 },
    } as unknown as GeolocationPosition);

    expect(returning.me()?.city).toBe('Dresden');
    expect(localStorage.getItem('conference-finder.city')).toBe('dresden');

    const reloaded = new LocationStore();
    reloaded.init();
    expect(reloaded.me()?.city).toBe('Dresden');
    expect(askForPosition).toHaveBeenCalledTimes(2);
  });

  it('keeps the saved city as a fallback if geolocation is denied', () => {
    new LocationStore().setCity('berlin');
    denyPermission();
    const returning = new LocationStore();

    returning.init();

    expect(returning.me()?.city).toBe('Berlin');
  });

  it('asks for geolocation only once, however often init runs', () => {
    const askForPosition = vi
      .spyOn(navigator.geolocation, 'getCurrentPosition')
      .mockImplementation(() => undefined);
    const store = new LocationStore();

    store.init();
    store.init();
    store.init();

    expect(askForPosition).toHaveBeenCalledTimes(1);
  });

  it('keeps a city picked while the permission prompt is still open', () => {
    new LocationStore().setCity('berlin');
    let answerPrompt: PositionCallback | undefined;
    vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((onPosition) => {
      answerPrompt = onPosition;
    });
    const store = new LocationStore();

    store.init();
    store.setCity('berlin');
    answerPrompt?.({
      coords: { latitude: NEAR_MUNICH.lat, longitude: NEAR_MUNICH.lon },
    } as unknown as GeolocationPosition);

    expect(store.me()?.city).toBe('Berlin');
  });

  it('rejects a city id that is not on offer', () => {
    expect(() => new LocationStore().setCity('atlantis')).toThrow(/atlantis/);
  });
});
