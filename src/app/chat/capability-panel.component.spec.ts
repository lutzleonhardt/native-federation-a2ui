import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { capability as chartsCapability } from '../../../projects/mfe-charts/src/capability';
import type { CapabilityStatus } from '../federation/capability-status';
import { provideCapabilityStatus } from '../federation/capability-status.token';
import { CapabilityPanelComponent } from './capability-panel.component';

/** Three manifest entries, one per state; `tables` stands in for a remote that only the manifest knows. */
const STATUSES: readonly CapabilityStatus[] = [
  {
    name: 'charts',
    state: 'loaded',
    origin: 'http://localhost:4201/',
    capability: chartsCapability,
  },
  { name: 'maps', state: 'unreachable' },
  { name: 'tables', state: 'unselected' },
];

async function render(statuses: readonly CapabilityStatus[] = STATUSES): Promise<HTMLElement> {
  TestBed.configureTestingModule({ providers: [provideCapabilityStatus(statuses)] });
  const fixture = TestBed.createComponent(CapabilityPanelComponent);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

function rows(host: HTMLElement): HTMLLIElement[] {
  return [...host.querySelectorAll('li')];
}

function toggleOf(row: HTMLLIElement): { href: string | null; label: string } {
  const link = row.querySelector('a');
  return { href: link?.getAttribute('href') ?? null, label: link?.textContent?.trim() ?? '' };
}

describe('CapabilityPanelComponent', () => {
  it('T5-AC-01: lists every manifest remote in its state, with what a loaded one contributed', async () => {
    const host = await render();
    const [charts, maps, tables] = rows(host);

    expect(rows(host)).toHaveLength(3);
    expect(charts.dataset['state']).toBe('loaded');
    expect(charts.textContent).toContain('loaded from http://localhost:4201/');
    expect(charts.textContent).toContain('components: Gauge, Timeline');
    expect(charts.textContent).toContain('functions: daysUntil');
    expect(maps.dataset['state']).toBe('unreachable');
    expect(maps.textContent).toContain('selected, but unreachable');
    expect(tables.dataset['state']).toBe('unselected');
    expect(tables.textContent).toContain('not selected');
  });

  it('T5-AC-02: every toggle is a link to the selection with that remote flipped, in manifest order', async () => {
    const host = await render();

    expect(rows(host).map(toggleOf)).toEqual([
      { href: '?capabilities=maps', label: 'Switch off' },
      { href: '?capabilities=charts', label: 'Switch off' },
      { href: '?capabilities=charts,maps,tables', label: 'Switch on' },
    ]);
  });

  it('T5-AC-02: switching the last selected remote off selects none explicitly', async () => {
    const host = await render([{ name: 'charts', state: 'unreachable' }]);

    expect(toggleOf(rows(host)[0])).toEqual({ href: '?capabilities=', label: 'Switch off' });
  });

  it('says so when the manifest is empty', async () => {
    const host = await render([]);

    expect(host.textContent).toContain('No remotes in the manifest.');
  });
});
