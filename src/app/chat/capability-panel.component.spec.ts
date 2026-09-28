import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { capability as chartsCapability } from '../../../projects/mfe-charts/src/capability';
import { AGENT_MODE } from '../agent/assistant-agent.token';
import type { AgentMode } from '../agent/agent-mode';
import type { CapabilityStatus } from '../federation/capability-status';
import { provideCapabilityStatus } from '../federation/capability-status.token';
import { PAGE_SEARCH } from '../federation/page-search.token';
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

async function render(
  statuses: readonly CapabilityStatus[] = STATUSES,
  mode: AgentMode = 'local',
  search = '',
): Promise<HTMLElement> {
  TestBed.configureTestingModule({
    providers: [
      provideCapabilityStatus(statuses),
      { provide: AGENT_MODE, useValue: mode },
      { provide: PAGE_SEARCH, useValue: search },
    ],
  });
  const fixture = TestBed.createComponent(CapabilityPanelComponent);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

function rows(host: HTMLElement): HTMLLIElement[] {
  return [...host.querySelectorAll('li')];
}

function chips(host: HTMLElement): { name: string; state: string }[] {
  return [...host.querySelectorAll<HTMLElement>('summary .cf-chip')].map((chip) => ({
    name: chip.querySelector('.cf-name')?.textContent?.trim() ?? '',
    state: chip.querySelector('.cf-state')?.textContent?.trim() ?? '',
  }));
}

/** The `dd` values of a row, in the template's order: origin, components, functions. */
function facts(row: HTMLLIElement): string[] {
  return [...row.querySelectorAll('dd')].map((dd) => dd.textContent?.trim() ?? '');
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
    expect([...charts.querySelectorAll('dt')].map((dt) => dt.textContent)).toEqual([
      'origin',
      'components',
      'functions',
    ]);
    expect(charts.dataset['state']).toBe('loaded');
    expect(facts(charts)).toEqual(['http://localhost:4201/', 'Gauge, Timeline', 'daysUntil']);
    expect(maps.dataset['state']).toBe('unreachable');
    expect(facts(maps)).toEqual(['—', '—', '—']);
    expect(tables.dataset['state']).toBe('unselected');
    expect(facts(tables)).toEqual(['—', '—', '—']);
  });

  it('T5-AC-02: every toggle is a link to the selection with that remote flipped, in manifest order', async () => {
    const host = await render();

    expect(rows(host).map(toggleOf)).toEqual([
      { href: '?capabilities=maps', label: 'Switch off' },
      { href: '?capabilities=charts', label: 'Switch off' },
      { href: '?capabilities=charts,maps,tables', label: 'Switch on' },
    ]);
  });

  it('T3-AC-04 / T5-AC-02: a toggle keeps the agent mode of the current URL in both directions', async () => {
    const replay = await render(STATUSES, 'replay', '?agent=replay');
    expect(rows(replay).map((row) => toggleOf(row).href)).toEqual([
      '?capabilities=maps&agent=replay',
      '?capabilities=charts&agent=replay',
      '?capabilities=charts,maps,tables&agent=replay',
    ]);

    TestBed.resetTestingModule();
    const local = await render(STATUSES, 'local', '?capabilities=charts,maps&agent=local');
    expect(toggleOf(rows(local)[0]).href).toBe('?capabilities=maps&agent=local');
  });

  it('T5-AC-02: switching the last selected remote off selects none explicitly', async () => {
    const host = await render([{ name: 'charts', state: 'unreachable' }]);

    expect(toggleOf(rows(host)[0])).toEqual({ href: '?capabilities=', label: 'Switch off' });
  });

  it('starts collapsed with a chip per remote that names its state; the details open on demand', async () => {
    const host = await render();
    const details = host.querySelector('details') as HTMLDetailsElement;
    const panel = host.querySelector('.cf-panel') as HTMLElement;
    const mark = host.querySelector('summary img') as HTMLImageElement;

    expect(details.open).toBe(false);
    expect(chips(host)).toEqual([
      { name: 'charts', state: 'loaded' },
      { name: 'maps', state: 'unreachable' },
      { name: 'tables', state: 'off' },
    ]);
    expect(mark.checkVisibility()).toBe(true);
    expect(panel.checkVisibility()).toBe(false);

    details.open = true;
    expect(panel.checkVisibility()).toBe(true);
    expect(panel.textContent).toContain('loaded via Native Federation');
    expect(
      rows(host).every((row) => (row.querySelector('a') as HTMLElement).checkVisibility()),
    ).toBe(true);
  });

  it('says so when the manifest is empty', async () => {
    const host = await render([]);

    expect(host.querySelector('summary')?.textContent).toContain('No remotes in the manifest.');
  });

  it('T3-AC-05 the Agent section names the mode, the live alternative and the DevTools in either mode', async () => {
    const local = await render(STATUSES, 'local');
    expect(local.querySelector('.cf-mode')?.textContent?.trim()).toBe(
      'local — agent server on localhost:3001',
    );

    TestBed.resetTestingModule();
    const replay = await render(STATUSES, 'replay');
    const agent = replay.querySelector('.cf-agent') as HTMLElement;
    expect(replay.querySelector('.cf-mode')?.textContent?.trim()).toBe('replay — recorded answers');
    expect(agent.textContent).toContain('every prompt answers on its own');
    expect(agent.textContent).toContain('npm start');
    const links = [...agent.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual([
      'https://github.com/lutzleonhardt/conference-finder#readme',
      'https://native-federation.com/docs/v4/devtools/',
    ]);
  });

  it('open() shows the panel, as the replay notice asks it to', async () => {
    await render();
    const fixture = TestBed.createComponent(CapabilityPanelComponent);
    await fixture.whenStable();
    const details = (fixture.nativeElement as HTMLElement).querySelector(
      'details',
    ) as HTMLDetailsElement;
    expect(details.open).toBe(false);

    fixture.componentInstance.open();

    expect(details.open).toBe(true);
  });
});
