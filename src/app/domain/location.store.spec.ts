import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocationStore } from './location.store';

const NEAR_MUENCHEN = { lat: 48.2489, lon: 11.6532 };

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
    grantPosition(NEAR_MUENCHEN.lat, NEAR_MUENCHEN.lon);
    const store = new LocationStore();

    store.init();

    expect(store.me()?.city).toBe('München');
  });

  it('T3-AC-07 stays undefined on a denied permission until a city is picked', () => {
    denyPermission();
    const store = new LocationStore();

    store.init();
    expect(store.me()).toBeUndefined();

    store.setCity('berlin');
    expect(store.me()).toEqual({ city: 'Berlin', lat: 52.52, lon: 13.405 });
  });

  it('restores the chosen city and asks for geolocation only while none is known', () => {
    new LocationStore().setCity('wien');

    const askForPosition = vi.spyOn(navigator.geolocation, 'getCurrentPosition');
    const returning = new LocationStore();
    returning.init();

    expect(returning.me()?.city).toBe('Wien');
    expect(askForPosition).not.toHaveBeenCalled();
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
    let answerPrompt: PositionCallback | undefined;
    vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((onPosition) => {
      answerPrompt = onPosition;
    });
    const store = new LocationStore();

    store.init();
    store.setCity('berlin');
    answerPrompt?.({
      coords: { latitude: NEAR_MUENCHEN.lat, longitude: NEAR_MUENCHEN.lon },
    } as unknown as GeolocationPosition);

    expect(store.me()?.city).toBe('Berlin');
  });

  it('rejects a city id that is not on offer', () => {
    expect(() => new LocationStore().setCity('atlantis')).toThrow(/atlantis/);
  });
});
