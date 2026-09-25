import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { A2uiRendererService, SurfaceComponent, provideA2Ui } from '@a2ui/angular/v0_9';
import type { A2uiClientAction, A2uiMessage } from '@a2ui/web_core/v0_9';
import { describe, expect, it, vi } from 'vitest';
import { CHARTS_CATALOG_ID, createChartsCatalog } from '../app/charts-catalog';
import { boundProperty } from '../testing/bound-property';
import { TimelineComponent, TimelineItem, TimelineProps } from './timeline.component';

const ITEMS: TimelineItem[] = [
  { id: 'c', label: 'Third', date: '2026-11-20', remaining: 5, url: 'https://c.example' },
  { id: 'a', label: 'First', date: '2026-09-15', remaining: 12, url: 'https://a.example' },
  { id: 'b', label: 'Second', date: '2026-10-01', remaining: 9, url: 'https://b.example' },
];

async function renderTimeline(props: TimelineProps) {
  const fixture = TestBed.createComponent(TimelineComponent);
  fixture.componentRef.setInput('props', props);
  fixture.componentRef.setInput('surfaceId', 's1');
  fixture.componentRef.setInput('componentId', 'timeline');
  await fixture.whenStable();
  return fixture;
}

function markersOf(fixture: { nativeElement: HTMLElement }): SVGGElement[] {
  return [...fixture.nativeElement.querySelectorAll<SVGGElement>('g.cf-marker')];
}

function click(marker: SVGGElement): void {
  marker.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('TimelineComponent', () => {
  it('T5-AC-01 renders one marker per item ordered by date and writes the whole clicked item', async () => {
    const selected = boundProperty<unknown>(undefined);
    const fixture = await renderTimeline({
      items: boundProperty<readonly TimelineItem[]>(ITEMS),
      selected,
    });

    const markers = markersOf(fixture);
    expect(markers).toHaveLength(3);
    const labels = markers.map((marker) => marker.querySelector('.cf-label')?.textContent?.trim());
    expect(labels).toEqual(['First', 'Second', 'Third']);

    click(markers[1]);

    expect(selected.onUpdate).toHaveBeenCalledExactlyOnceWith({
      id: 'b',
      label: 'Second',
      date: '2026-10-01',
      remaining: 9,
      url: 'https://b.example',
    });
  });

  it('T5-AC-02 clicking without a bound selected is a no-op and does not throw', async () => {
    const fixture = await renderTimeline({ items: boundProperty<readonly TimelineItem[]>(ITEMS) });

    expect(() => click(markersOf(fixture)[0])).not.toThrow();
  });

  it('positions markers proportionally inside an explicit range', async () => {
    // Range spans 120 days from the first item; day 0 → axis start (x=64),
    // day 66 → 64 + (66/120) * 704 = 451.2.
    const fixture = await renderTimeline({
      items: boundProperty<readonly TimelineItem[]>(ITEMS),
      range: boundProperty<{ from: string; to: string } | undefined>({
        from: '2026-09-15',
        to: '2027-01-13',
      }),
    });

    const xs = markersOf(fixture).map((marker) =>
      Number(marker.querySelector('circle')!.getAttribute('cx')),
    );
    expect(xs[0]).toBe(64);
    expect(xs[2]).toBeCloseTo(451.2);
  });

  it('survives a degenerate range with equal bounds', async () => {
    const sameDay = ITEMS.map((item) => ({ ...item, date: '2026-09-15' }));
    const fixture = await renderTimeline({
      items: boundProperty<readonly TimelineItem[]>(sameDay),
      range: boundProperty<{ from: string; to: string } | undefined>({
        from: '2026-09-15',
        to: '2026-09-15',
      }),
    });

    const xs = markersOf(fixture).map((marker) =>
      Number(marker.querySelector('circle')!.getAttribute('cx')),
    );
    expect(xs).toEqual([64, 64, 64]);
  });

  it('highlights the marker whose id matches the selected value', async () => {
    const fixture = await renderTimeline({
      items: boundProperty<readonly TimelineItem[]>(ITEMS),
      selected: boundProperty<unknown>(ITEMS[2]),
    });

    const highlighted = [...fixture.nativeElement.querySelectorAll('g.cf-selected')];
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].querySelector('.cf-label')?.textContent).toContain('Second');
  });

  // A viewBox-only svg has no intrinsic size; without an explicit host width
  // the timeline collapses to 0x0 inside the renderer's flex rows.
  it('occupies real size inside a flex container', async () => {
    const fixture = await renderTimeline({ items: boundProperty<readonly TimelineItem[]>(ITEMS) });
    const host = fixture.nativeElement as HTMLElement;
    const parent = host.parentElement!;
    parent.style.display = 'flex';
    try {
      const rect = host.getBoundingClientRect();
      expect(rect.width).toBeGreaterThan(100);
      expect(rect.height).toBeGreaterThan(20);
    } finally {
      // The parent is the document body, shared with the tests that follow.
      parent.style.display = '';
    }
  });
});

function isoDaysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function display(element: Element): string {
  return getComputedStyle(element).display;
}

/** Container queries resolve on the container's layout, which getComputedStyle alone does not force. */
function resize(host: HTMLElement, width: string): void {
  host.style.width = width;
  host.getBoundingClientRect();
}

describe('TimelineComponent in the Departure look', () => {
  it('T6-AC-01 rings the selected marker without a second hue and draws an English month axis', async () => {
    const fixture = await renderTimeline({
      items: boundProperty<readonly TimelineItem[]>(ITEMS),
      selected: boundProperty<unknown>(ITEMS[2]),
    });
    const host = fixture.nativeElement as HTMLElement;
    host.style.width = '1000px';

    const [first, selected] = markersOf(fixture);
    expect(selected.classList.contains('cf-selected')).toBe(true);
    expect(selected.querySelector('.cf-ring')).not.toBeNull();
    expect(first.querySelector('.cf-ring')).toBeNull();
    const fillOf = (marker: SVGGElement) => getComputedStyle(marker.querySelector('.cf-dot')!).fill;
    expect(fillOf(selected)).toBe(fillOf(first));
    expect(getComputedStyle(first.querySelector('.cf-date')!).fontFamily).toContain(
      'IBM Plex Mono',
    );

    const months = [...host.querySelectorAll('.cf-month')].map((text) => text.textContent?.trim());
    expect(months).toEqual(['SEP', 'OCT', 'NOV']);
    const years = [...host.querySelectorAll('.cf-year')].map((text) => text.textContent?.trim());
    expect(years).toEqual(['2026']);
  });

  it('T6-AC-02 captions the selected item with an English relative time in both layouts', async () => {
    const soon: TimelineItem = { id: 'soon', label: 'Soon', date: isoDaysFromToday(3) };
    const fixture = await renderTimeline({
      items: boundProperty<readonly TimelineItem[]>([soon, ITEMS[0]]),
      selected: boundProperty<unknown>(soon),
    });

    const captions = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.cf-caption')];
    expect(captions.map((caption) => caption.textContent?.trim())).toEqual([
      'in 3 days',
      'in 3 days',
    ]);
  });

  it('T6-AC-03 shows the board in a narrow container, the rail in a wide one, the board when forced', async () => {
    const selected = boundProperty<unknown>(ITEMS[2]);
    const fixture = await renderTimeline({
      items: boundProperty<readonly TimelineItem[]>(ITEMS),
      selected,
    });
    const host = fixture.nativeElement as HTMLElement;
    const svg = host.querySelector('svg')!;
    const board = host.querySelector('ol.cf-board')!;

    resize(host, '1000px');
    expect(display(svg)).toBe('block');
    expect(display(board)).toBe('none');

    resize(host, '600px');
    expect(display(svg)).toBe('none');
    expect(display(board)).toBe('grid');
    const rows = [...board.querySelectorAll<HTMLLIElement>('li.cf-marker')];
    expect(rows.map((row) => row.querySelector('.cf-label')?.textContent?.trim())).toEqual([
      'First',
      'Second',
      'Third',
    ]);
    expect(rows.filter((row) => row.classList.contains('cf-selected'))).toEqual([rows[1]]);
    expect(rows[1].querySelector('.cf-caption')).not.toBeNull();
    expect(rows[0].querySelector('.cf-caption')).toBeNull();
    rows[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(selected.onUpdate).toHaveBeenCalledExactlyOnceWith(ITEMS[0]);

    host.setAttribute('data-layout', 'board');
    resize(host, '1000px');
    expect(display(svg)).toBe('none');
    expect(display(board)).toBe('grid');
  });

  it('keeps the board rail straight when the selected caption is wider than the dates', async () => {
    const longAgo: TimelineItem = { id: 'past', label: 'Past', date: isoDaysFromToday(-200) };
    const fixture = await renderTimeline({
      items: boundProperty<readonly TimelineItem[]>([longAgo, ...ITEMS]),
      selected: boundProperty<unknown>(longAgo),
    });
    const host = fixture.nativeElement as HTMLElement;
    resize(host, '600px');

    const rows = [...host.querySelectorAll<HTMLLIElement>('li.cf-marker')];
    // Found by class, not by index: the fixed fixture dates overtake the relative one in 2027.
    const selected = rows.find((row) => row.classList.contains('cf-selected'));
    expect(selected?.querySelector('.cf-caption')?.textContent?.trim()).toBe('200 days ago');
    const dotLefts = rows.map((row) => row.querySelector('.cf-dot')!.getBoundingClientRect().left);
    expect(new Set(dotLefts).size).toBe(1);
  });
});

/** The seven Angular conferences of demo request 1, with their offsets from a fixed day. */
const REQUEST_1: TimelineItem[] = [
  { id: 'munich', label: 'ng-atlas Munich', date: '2026-09-28' },
  { id: 'berlin', label: 'ng-forge Berlin', date: '2026-10-07' },
  { id: 'hamburg', label: 'ng-loft Hamburg', date: '2026-11-18' },
  { id: 'vienna', label: 'ng-foundry Vienna', date: '2026-12-30' },
  { id: 'zurich', label: 'ng-anvil Zurich', date: '2027-01-15' },
  { id: 'copenhagen', label: 'ng-harbor Copenhagen', date: '2027-02-15' },
  { id: 'leipzig', label: 'ng-lantern Leipzig', date: '2027-03-15' },
];

function itemsEvery(count: number, stepDays: number, prefix: string): TimelineItem[] {
  const start = Date.UTC(2026, 9, 5);
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    label: `${prefix} ${index + 1}`,
    date: new Date(start + index * stepDays * 86_400_000).toISOString().slice(0, 10),
  }));
}

function layoutOf(host: HTMLElement): string | null {
  return host.getAttribute('data-layout');
}

describe('TimelineComponent label-fit rule', () => {
  it('T7-AC-01 forces the board for thirty items whose label blocks cannot share the rail', async () => {
    const items = itemsEvery(30, 12, 'Event');
    const fixture = await renderTimeline({ items: boundProperty<readonly TimelineItem[]>(items) });
    const host = fixture.nativeElement as HTMLElement;
    resize(host, '1000px');

    expect(layoutOf(host)).toBe('board');
    expect(display(host.querySelector('svg')!)).toBe('none');
    expect(display(host.querySelector('ol.cf-board')!)).toBe('grid');
    const labels = [...host.querySelectorAll('li.cf-marker .cf-label')].map((label) =>
      label.textContent?.trim(),
    );
    expect(labels).toEqual(items.map((item) => item.label));
  });

  it('T7-AC-02 T7-AC-04 four items of one week fit their own rail and are boarded when a quarter squeezes them', async () => {
    const items = boundProperty<readonly TimelineItem[]>(itemsEvery(4, 2, 'Talk'));
    const range = boundProperty<{ from: string; to: string } | undefined>(undefined);
    const fixture = await renderTimeline({ items, range });
    const host = fixture.nativeElement as HTMLElement;
    resize(host, '1000px');

    expect(layoutOf(host)).toBeNull();
    expect(display(host.querySelector('svg')!)).toBe('block');

    range.value.set({ from: '2026-10-05', to: '2027-01-03' });
    await fixture.whenStable();

    expect(layoutOf(host)).toBe('board');
    expect(display(host.querySelector('ol.cf-board')!)).toBe('grid');
  });

  it('T7-AC-03 draws the rail for the seven conferences of request 1', async () => {
    const fixture = await renderTimeline({
      items: boundProperty<readonly TimelineItem[]>(REQUEST_1),
      selected: boundProperty<unknown>(REQUEST_1[5]),
    });
    const host = fixture.nativeElement as HTMLElement;
    resize(host, '1000px');

    expect(layoutOf(host)).toBeNull();
    expect(display(host.querySelector('svg')!)).toBe('block');
    expect(markersOf(fixture)).toHaveLength(7);
  });

  it('T7-AC-05 keeps the overlap decision when the host is resized', async () => {
    const dense = await renderTimeline({
      items: boundProperty<readonly TimelineItem[]>(itemsEvery(30, 12, 'Event')),
    });
    const sparse = await renderTimeline({
      items: boundProperty<readonly TimelineItem[]>(REQUEST_1),
    });

    for (const width of ['1000px', '600px', '1000px']) {
      resize(dense.nativeElement, width);
      resize(sparse.nativeElement, width);
      expect(layoutOf(dense.nativeElement)).toBe('board');
      expect(layoutOf(sparse.nativeElement)).toBeNull();
    }
    // The width rule alone shows the sparse board at 600 px — the two conditions stay independent.
    resize(sparse.nativeElement, '600px');
    expect(display(sparse.nativeElement.querySelector('ol.cf-board')!)).toBe('grid');
  });
});

const SURFACE_ID = 'timeline-action-surface';

@Component({
  imports: [SurfaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a2ui-v09-surface surfaceId="${SURFACE_ID}" />`,
})
class SurfaceHost {}

/** The remote's own host with a recording action handler — no shell code involved. */
function configureChartsHost(onAction: (action: A2uiClientAction) => void = () => undefined): void {
  TestBed.configureTestingModule({
    providers: [provideA2Ui({ catalogs: [createChartsCatalog()], actionHandler: onAction })],
  });
}

function timelineSurfaceMessages(): A2uiMessage[] {
  return [
    {
      version: 'v0.9',
      createSurface: { surfaceId: SURFACE_ID, catalogId: CHARTS_CATALOG_ID },
    },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: SURFACE_ID,
        components: [
          {
            id: 'root',
            component: 'Timeline',
            items: { path: '/filteredConfs' },
            action: { event: { name: 'pick', context: { id: { path: '/x/id' } } } },
          },
        ],
      },
    },
    {
      version: 'v0.9',
      updateDataModel: { surfaceId: SURFACE_ID, path: '/filteredConfs', value: ITEMS },
    },
    {
      version: 'v0.9',
      updateDataModel: { surfaceId: SURFACE_ID, path: '/x', value: { id: 'x-marks' } },
    },
  ];
}

describe('Timeline through the real renderer', () => {
  it('T5-AC-04 dispatches the pick action with the resolved context to the action bus', async () => {
    const seen: A2uiClientAction[] = [];
    configureChartsHost((action) => seen.push(action));
    TestBed.inject(A2uiRendererService).processMessages(timelineSurfaceMessages());

    const fixture = TestBed.createComponent(SurfaceHost);
    await fixture.whenStable();
    click(markersOf(fixture)[0]);

    await vi.waitFor(() => expect(seen).toHaveLength(1));
    expect(seen[0]).toMatchObject({
      name: 'pick',
      surfaceId: SURFACE_ID,
      context: { id: 'x-marks' },
    });
  });

  it('T5-AC-02 a literal selected renders a no-op onUpdate: clicking neither throws nor writes', async () => {
    configureChartsHost();
    const renderer = TestBed.inject(A2uiRendererService);
    renderer.processMessages([
      {
        version: 'v0.9',
        createSurface: { surfaceId: SURFACE_ID, catalogId: CHARTS_CATALOG_ID },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: SURFACE_ID,
          components: [
            {
              id: 'root',
              component: 'Timeline',
              items: { path: '/filteredConfs' },
              selected: 'unbound',
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: { surfaceId: SURFACE_ID, path: '/filteredConfs', value: ITEMS },
      },
    ]);

    const fixture = TestBed.createComponent(SurfaceHost);
    await fixture.whenStable();

    expect(() => click(markersOf(fixture)[0])).not.toThrow();
    await fixture.whenStable();

    expect(renderer.surfaceGroup.getSurface(SURFACE_ID)?.dataModel.get('/')).toEqual({
      filteredConfs: ITEMS,
    });
  });
});
