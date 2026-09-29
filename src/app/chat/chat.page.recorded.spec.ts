import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import file from '../../../public/recordings.json';
import { SurfaceDataStore } from '../agent/surface-data.store';
import { findCity } from '../domain/cities';
import {
  capabilitySetKey,
  capturedCity,
  parseRecordings,
  type Recordings,
} from '../replay/recordings';
import { ChatPage } from './chat.page';
import { EXAMPLE_PROMPTS } from './example-prompts';
import {
  clickPrompt,
  gaugeValues,
  host,
  INSTANT,
  markersOf,
  renderReplayChat,
  reserveButtons,
  settle,
  surfaces,
  timelineMarkers,
  widgetText,
  type RemoteName,
} from './testing/chat-page-harness';

/**
 * The spec's "agent loop without a model" row: the captured file, played by the real replay
 * agent through the real chat, tools and renderer, judged by the same DOM queries as the live
 * cases. Every cell is the first message of a fresh conversation in the file's city, as at
 * the capture; the recordings carry no `me`, the pin mounts it.
 */
const RECORDED: Recordings = parseRecordings(file);
const CITY = capturedCity(file);
const SETS: readonly (readonly RemoteName[])[] = [['charts', 'maps'], ['charts'], ['maps'], []];

let fetchSpy: MockInstance;

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation(() => undefined);
  fetchSpy = vi.spyOn(globalThis, 'fetch');
});

afterEach(() => vi.restoreAllMocks());

function waitFor(check: () => void): Promise<void> {
  return vi.waitFor(check, { timeout: 10000 });
}

async function playBadge(
  loaded: readonly RemoteName[],
  badge: number,
): Promise<ComponentFixture<ChatPage>> {
  const fixture = await renderReplayChat(RECORDED, { loaded, pace: INSTANT, city: CITY });
  await fixture.whenStable();
  clickPrompt(fixture, badge);
  await waitFor(() => expect(surfaces(fixture)).toBeGreaterThan(0));
  return fixture;
}

function slider(fixture: ComponentFixture<ChatPage>): HTMLInputElement | null {
  return host(fixture).querySelector<HTMLInputElement>('a2ui-v09-surface input[type="range"]');
}

describe('ChatPage over the captured recordings, both remotes', () => {
  it('T4.5-AC-03 badge 1: a Timeline and nothing else of the custom vocabulary', async () => {
    const fixture = await playBadge(['charts', 'maps'], 0);

    await waitFor(() => expect(timelineMarkers(fixture).length).toBeGreaterThan(0));
    expect(host(fixture).querySelectorAll('a2ui-v09-surface app-map')).toHaveLength(0);
    expect(host(fixture).querySelectorAll('a2ui-v09-surface app-gauge')).toHaveLength(0);
    expect(reserveButtons(fixture)).toHaveLength(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('T4.5-AC-03 badge 2: a Map with a Slider whose move changes the marker count', async () => {
    const fixture = await playBadge(['charts', 'maps'], 1);

    await waitFor(() => expect(markersOf(fixture).length).toBeGreaterThan(0));
    const before = markersOf(fixture).length;
    const range = slider(fixture);
    expect(range).not.toBeNull();
    range!.value = range!.min;
    range!.dispatchEvent(new Event('input', { bubbles: true }));
    await waitFor(() => expect(markersOf(fixture).length).toBeLessThan(before));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('T4.5-AC-03 badge 3: three comparison Cards with a Gauge each, no reserve Button', async () => {
    const fixture = await playBadge(['charts', 'maps'], 2);

    await waitFor(() => expect(gaugeValues(fixture)).toHaveLength(3));
    const cardsWithGauge = [
      ...host(fixture).querySelectorAll('a2ui-v09-surface a2ui-v09-card'),
    ].filter((card) => card.querySelector('app-gauge') !== null);
    expect(cardsWithGauge).toHaveLength(3);
    expect(reserveButtons(fixture)).toHaveLength(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('T4.5-AC-03 badge 4: Map, Gauge and the name; the reserve Button lowers the Gauge by one', async () => {
    const fixture = await playBadge(['charts', 'maps'], 3);

    await waitFor(() => expect(gaugeValues(fixture)).toHaveLength(1));
    expect(markersOf(fixture).length).toBeGreaterThan(0);
    const [first] = TestBed.inject(SurfaceDataStore).confs();
    expect(host(fixture).querySelector('a2ui-v09-surface')?.textContent).toContain(first.name);
    expect(gaugeValues(fixture)).toEqual([String(first.remaining)]);

    reserveButtons(fixture)[0].click();
    await waitFor(() => expect(gaugeValues(fixture)).toEqual([String(first.remaining - 1)]));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("T4.5-AC-05 the location is the file's city, read-only: the picker names it, no Change, no geolocation", async () => {
    const fixture = await renderReplayChat(RECORDED, { pace: INSTANT, city: CITY });
    const city = findCity(CITY ?? '');
    expect(city).toBeDefined();

    const picker = host(fixture).querySelector('app-location-picker');
    expect(picker?.textContent).toContain('Recorded in');
    expect(picker?.textContent).toContain(city?.name);
    expect(picker?.querySelector('button, select')).toBeNull();
    expect(navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });
});

describe('ChatPage over the captured recordings, charts only', () => {
  it('T4.5-AC-03 badge 2 names the missing map or distance filter and draws no Slider', async () => {
    const fixture = await playBadge(['charts'], 1);

    await waitFor(() => expect(widgetText(fixture)).toMatch(/map|distance/i));
    await settle();
    expect(slider(fixture)).toBeNull();
    expect(host(fixture).querySelector('a2ui-v09-surface app-map')).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('every recorded cell replays as the first message of a fresh conversation', () => {
  for (const loaded of SETS) {
    for (let badge = 0; badge < EXAMPLE_PROMPTS.length; badge += 1) {
      it(`T4.5-AC-02 [${capabilitySetKey(loaded) || 'none'}] badge ${badge + 1} renders, is not refused, and sends nothing`, async () => {
        const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const warnings = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        await playBadge(loaded, badge);
        await settle();

        const refusals = warnings.mock.calls.filter(([first]) =>
          String(first).includes('renderSurface failed'),
        );
        expect(refusals).toEqual([]);
        expect(errors).not.toHaveBeenCalled();
        expect(fetchSpy).not.toHaveBeenCalled();
      });
    }
  }
});
