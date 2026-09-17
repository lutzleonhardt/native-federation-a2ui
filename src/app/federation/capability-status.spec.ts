import type { FederationManifest } from '@angular-architects/native-federation-v4';
import { describe, expect, it } from 'vitest';
import type { AgentCapability } from '../../../shared/capabilities/agent-capability';
import { describeCapabilities, loadedCapabilities } from './capability-status';
import { selectCapabilities } from './select-capabilities';

const MANIFEST: FederationManifest = {
  charts: 'http://localhost:4201/remoteEntry.json',
  maps: 'http://localhost:4202/remoteEntry.json',
};
const charts: AgentCapability = {
  name: 'charts',
  vocabulary: { components: {}, functions: [] },
  components: {},
};
const maps: AgentCapability = {
  name: 'maps',
  vocabulary: { components: {}, functions: [] },
  components: {},
};
const ORIGINS: Record<string, string> = { charts: 'http://localhost:4201/' };
const originOf = (name: string): string | undefined => ORIGINS[name];

describe('describeCapabilities (T5-AC-01)', () => {
  it('without the parameter every entry is selected: loaded or unreachable, never unselected', () => {
    const selected = selectCapabilities(MANIFEST, '');

    expect(
      describeCapabilities(MANIFEST, selected, new Map([['charts', charts]]), originOf),
    ).toEqual([
      { name: 'charts', state: 'loaded', origin: 'http://localhost:4201/', capability: charts },
      { name: 'maps', state: 'unreachable' },
    ]);
  });

  it('with an empty parameter every entry is unselected', () => {
    const selected = selectCapabilities(MANIFEST, '?capabilities=');

    expect(describeCapabilities(MANIFEST, selected, new Map(), originOf)).toEqual([
      { name: 'charts', state: 'unselected' },
      { name: 'maps', state: 'unselected' },
    ]);
  });

  it('a selected remote that delivered nothing is unreachable, not unselected', () => {
    const selected = selectCapabilities(MANIFEST, '?capabilities=maps');

    expect(describeCapabilities(MANIFEST, selected, new Map(), originOf)).toEqual([
      { name: 'charts', state: 'unselected' },
      { name: 'maps', state: 'unreachable' },
    ]);
  });

  it('reports a loaded remote without an origin when the orchestrator knows none', () => {
    const statuses = describeCapabilities(MANIFEST, MANIFEST, new Map([['maps', maps]]), originOf);

    expect(statuses[1]).toEqual({
      name: 'maps',
      state: 'loaded',
      origin: undefined,
      capability: maps,
    });
  });

  it("joins by manifest key, not by the capability's own name", () => {
    const renamed: AgentCapability = { ...charts, name: 'chart-widgets' };

    const [status] = describeCapabilities(
      MANIFEST,
      MANIFEST,
      new Map([['charts', renamed]]),
      originOf,
    );

    expect(status).toEqual({
      name: 'charts',
      state: 'loaded',
      origin: 'http://localhost:4201/',
      capability: renamed,
    });
  });
});

describe('loadedCapabilities', () => {
  it('returns what the loaded remotes contributed, in manifest order', () => {
    const statuses = describeCapabilities(
      MANIFEST,
      MANIFEST,
      new Map([
        ['maps', maps],
        ['charts', charts],
      ]),
      originOf,
    );

    expect(loadedCapabilities(statuses)).toEqual([charts, maps]);
  });

  it('skips unreachable and unselected entries', () => {
    expect(
      loadedCapabilities([
        { name: 'charts', state: 'unreachable' },
        { name: 'maps', state: 'unselected' },
      ]),
    ).toEqual([]);
  });
});
