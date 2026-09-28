import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { haversineKm } from '../maps/geo';
import { provideOfflineMap } from '../testing/offline-map';
import { App, HOME, LIGHTHOUSES } from './app';
import { appConfig } from './app.config';

function distanceText(host: HTMLElement): string | undefined {
  const texts = host.querySelectorAll('a2ui-v09-text');
  return texts[texts.length - 1]?.textContent?.trim();
}

function kmFromHome(point: { lat: number; lon: number }): string {
  return String(Math.round(haversineKm(HOME, point)));
}

describe('mfe-maps standalone page', () => {
  it('T6-AC-01 / T2-AC-05: renders the maps vocabulary through its own A2UI host over lighthouse data', async () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers, provideOfflineMap()] });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;

    await vi.waitFor(() =>
      expect(host.querySelectorAll('.cf-marker')).toHaveLength(LIGHTHOUSES.length),
    );
    expect(host.querySelector('.cf-center')?.textContent).toContain(HOME.city);
    // The function call resolves through this host's catalog invoker; the basic Text renders
    // asynchronously, so the value arrives a tick after `whenStable`.
    await vi.waitFor(() => expect(distanceText(host)).toBe(kmFromHome(LIGHTHOUSES[1])));

    host
      .querySelector<HTMLElement>('.cf-marker[data-id="campen"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await vi.waitFor(() => expect(distanceText(host)).toBe(kmFromHome(LIGHTHOUSES[0])));
  });
});
