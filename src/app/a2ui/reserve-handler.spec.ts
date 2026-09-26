import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { A2uiRendererService, SurfaceComponent } from '@a2ui/angular/v0_9';
import type { A2uiMessage } from '@a2ui/web_core/v0_9';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { capability as chartsCapability } from '../../../projects/mfe-charts/src/capability';
import { capability as mapsCapability } from '../../../projects/mfe-maps/src/capability';
import { loadConferences, type Conference } from '../domain/conference';
import { applyReservations, ConferenceStore } from '../domain/conference.store';
import { A2uiActionBus } from './action-bus';
import { provideAgentCapabilities } from './agent-capabilities.token';
import { ASSISTANT_CATALOG_ID } from './assistant-catalog';
import { provideReserveHandler } from './reserve-handler';

const SURFACE_ID = 'reserve-spec-surface';
const SECOND_SURFACE_ID = 'reserve-spec-surface-2';

function conferenceOf(id: string): Conference {
  const conf = loadConferences(new Date()).find((candidate) => candidate.id === id);
  if (conf === undefined) throw new Error(`No conference '${id}' in conferences.json.`);
  return conf;
}

const SELECTED = conferenceOf('ng-forge-berlin');
const OTHER = conferenceOf('web-lantern-amsterdam');

@Component({
  imports: [SurfaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a2ui-v09-surface surfaceId="${SURFACE_ID}" />`,
})
class SurfaceHost {}

@Component({
  imports: [SurfaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a2ui-v09-surface surfaceId="${SECOND_SURFACE_ID}" />`,
})
class SecondSurfaceHost {}

/**
 * Request 3's shape: a Gauge on the selection, a Text on the list entry and the reserve Button;
 * the selected conference is mounted at `/selectedConf` and at index 1 of `/filteredConfs`.
 * Copies, as the client mount does: the data model patches mounted objects in place.
 */
function reserveSurface(selected: Conference, surfaceId = SURFACE_ID): A2uiMessage[] {
  return [
    { version: 'v0.9', createSurface: { surfaceId, catalogId: ASSISTANT_CATALOG_ID } },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId,
        components: [
          { id: 'root', component: 'Column', children: ['gauge', 'listed', 'reserve'] },
          {
            id: 'gauge',
            component: 'Gauge',
            value: { path: '/selectedConf/remaining' },
            max: { path: '/selectedConf/capacity' },
            label: 'Seats left',
          },
          { id: 'listed', component: 'Text', text: { path: '/filteredConfs/1/remaining' } },
          { id: 'reserve-label', component: 'Text', text: 'Reserve' },
          {
            id: 'reserve',
            component: 'Button',
            child: 'reserve-label',
            action: { event: { name: 'reserve', context: { id: { path: '/selectedConf/id' } } } },
          },
        ],
      },
    },
    {
      version: 'v0.9',
      updateDataModel: {
        surfaceId,
        path: '/filteredConfs',
        value: [{ ...OTHER }, { ...selected }],
      },
    },
    { version: 'v0.9', updateDataModel: { surfaceId, path: '/selectedConf', value: { ...selected } } },
  ];
}

type Host = ComponentFixture<SurfaceHost | SecondSurfaceHost>;

async function mount(messages: A2uiMessage[], host = SurfaceHost): Promise<Host> {
  TestBed.inject(A2uiRendererService).processMessages(messages);
  const fixture = TestBed.createComponent(host);
  await fixture.whenStable();
  return fixture;
}

function hostOf(fixture: Host): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

async function clickReserve(fixture: Host): Promise<void> {
  hostOf(fixture).querySelector<HTMLButtonElement>('a2ui-v09-button button')!.click();
  await fixture.whenStable();
}

function dataModel(surfaceId = SURFACE_ID) {
  return TestBed.inject(A2uiRendererService).surfaceGroup.getSurface(surfaceId)!.dataModel;
}

/**
 * The gauge on the selection shows `value`; the list entry carries it in the data model and,
 * above zero, on screen — the basic `Text` renders a bound 0 as an empty element.
 */
async function expectRemaining(fixture: Host, value: number, surfaceId = SURFACE_ID): Promise<void> {
  await vi.waitFor(async () => {
    await fixture.whenStable();
    const host = hostOf(fixture);
    expect(host.querySelector('.cf-gauge-value')?.textContent?.trim()).toBe(String(value));
    expect(dataModel(surfaceId).get('/filteredConfs/1/remaining')).toBe(value);
    if (value === 0) return;
    const texts = [...host.querySelectorAll('a2ui-v09-text')].map((el) => el.textContent?.trim());
    expect(texts).toContain(String(value));
  });
}

describe('reserve handler through the real renderer', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideAgentCapabilities([chartsCapability, mapsCapability]),
        provideReserveHandler(),
      ],
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it('T1-AC-01 a click lowers the selection and the list entry by one, twice, and no request leaves the browser', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const fixture = await mount(reserveSurface(SELECTED));
    await expectRemaining(fixture, SELECTED.remaining);

    await clickReserve(fixture);
    await expectRemaining(fixture, SELECTED.remaining - 1);

    await clickReserve(fixture);
    await expectRemaining(fixture, SELECTED.remaining - 2);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(TestBed.inject(ConferenceStore).reservations().get(SELECTED.id)).toBe(2);
  });

  it('T1-AC-02 at zero a click leaves the conference at zero', async () => {
    const store = TestBed.inject(ConferenceStore);
    for (let i = 1; i < SELECTED.remaining; i += 1) store.reserve(SELECTED.id);
    const [oneLeft] = applyReservations([SELECTED], store.reservations());
    const fixture = await mount(reserveSurface(oneLeft));
    await expectRemaining(fixture, 1);

    await clickReserve(fixture);
    await expectRemaining(fixture, 0);

    await clickReserve(fixture);
    await expectRemaining(fixture, 0);
  });

  it('T1-AC-04 writes the two fixed homes only: an object elsewhere with the same id stays untouched', async () => {
    const fixture = await mount([
      ...reserveSurface(SELECTED),
      { version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path: '/venue', value: { ...SELECTED } } },
    ]);

    await clickReserve(fixture);
    await expectRemaining(fixture, SELECTED.remaining - 1);

    expect(dataModel().get('/selectedConf/remaining')).toBe(SELECTED.remaining - 1);
    expect(dataModel().get('/filteredConfs/0/remaining')).toBe(OTHER.remaining);
    expect(dataModel().get('/venue/remaining')).toBe(SELECTED.remaining);
  });

  it('writes the reservation into every live surface that shows the conference, not only the clicked one', async () => {
    const first = await mount(reserveSurface(SELECTED));
    const second = await mount(reserveSurface(SELECTED, SECOND_SURFACE_ID), SecondSurfaceHost);

    await clickReserve(second);

    await expectRemaining(second, SELECTED.remaining - 1, SECOND_SURFACE_ID);
    await expectRemaining(first, SELECTED.remaining - 1);
    expect(TestBed.inject(ConferenceStore).reservations().get(SELECTED.id)).toBe(1);
  });

  it('ignores other action names and logs an unknown id, both without touching the surface', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = await mount(reserveSurface(SELECTED));
    const bus = TestBed.inject(A2uiActionBus);
    const envelope = {
      surfaceId: SURFACE_ID,
      sourceComponentId: 'reserve',
      timestamp: new Date().toISOString(),
    };

    bus.dispatch({ ...envelope, name: 'pick', context: { id: SELECTED.id } });
    bus.dispatch({ ...envelope, name: 'reserve', context: { id: 'no-such-conference' } });
    await fixture.whenStable();

    await expectRemaining(fixture, SELECTED.remaining);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(ConferenceStore).reservations().size).toBe(0);
  });
});
