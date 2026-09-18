import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { haversineKm } from '../maps/geo';
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
  it('T6-AC-01: renders the maps vocabulary through its own A2UI host over lighthouse data', async () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;

    const markers = [...host.querySelectorAll<SVGGElement>('g.cf-marker')];
    expect(markers).toHaveLength(LIGHTHOUSES.length);
    expect(host.querySelector('.cf-center-mark')).not.toBeNull();
    // The function call resolves through this host's catalog invoker; the basic Text renders
    // asynchronously, so the value arrives a tick after `whenStable`.
    await vi.waitFor(() => expect(distanceText(host)).toBe(kmFromHome(LIGHTHOUSES[1])));

    const campen = markers.find((marker) => marker.textContent?.includes('Campen'));
    campen?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await vi.waitFor(() => expect(distanceText(host)).toBe(kmFromHome(LIGHTHOUSES[0])));
  });
});
