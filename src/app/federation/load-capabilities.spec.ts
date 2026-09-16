import type { LoadRemoteModule } from '@softarc/native-federation-orchestrator';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toFragment, type AgentCapability } from '../../../shared/capabilities/agent-capability';
import { chartsCapability } from '../capabilities/charts';
import { CAPABILITY_MODULE, loadCapabilities } from './load-capabilities';

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

/** A loader that resolves the listed remotes' modules and rejects every other name. */
function loaderFor(modules: Record<string, unknown>) {
  const calls: [remote: string, exposed: string][] = [];
  const load: LoadRemoteModule = async <T>(remote: string, exposed: string) => {
    calls.push([remote, exposed]);
    if (!(remote in modules)) {
      throw new Error(`remote '${remote}' not initialised`);
    }
    return modules[remote] as T;
  };
  return { load, calls };
}

/** A loader that never settles for `stuck` and behaves like `loaderFor` otherwise. */
function stallingLoaderFor(modules: Record<string, unknown>): LoadRemoteModule {
  const { load } = loaderFor(modules);
  return <T>(remote: string, exposed: string) =>
    remote === 'stuck' ? new Promise<T>(() => undefined) : load<T>(remote, exposed);
}

describe('loadCapabilities', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('T3-AC-02: skips a remote that cannot be loaded, logs it, and keeps the rest', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { load } = loaderFor({ charts: { capability: charts } });

    await expect(loadCapabilities(load, ['ghost', 'charts'])).resolves.toEqual([charts]);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("'ghost'");
  });

  it('T3-AC-02: skips a remote that never delivers its module once the timeout passes', async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const load = stallingLoaderFor({ charts: { capability: charts } });

    const pending = loadCapabilities(load, ['stuck', 'charts'], 1_000);
    await vi.advanceTimersByTimeAsync(1_000);

    await expect(pending).resolves.toEqual([charts]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("'stuck'");
    expect(String(warn.mock.calls[0][1])).toContain('1000 ms');
  });

  it('skips a remote whose module has no capability export', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { load } = loaderFor({ charts: {}, maps: { capability: maps } });

    await expect(loadCapabilities(load, ['charts', 'maps'])).resolves.toEqual([maps]);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("'charts'");
  });

  it('skips a capability whose vocabulary lacks its components and functions', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const broken = { name: 'broken', vocabulary: {}, components: {} };
    const { load } = loaderFor({ broken: { capability: broken } });

    await expect(loadCapabilities(load, ['broken'])).resolves.toEqual([]);

    expect(warn.mock.calls[0][0]).toContain("'broken'");
  });

  it('skips a capability that announces a component without an implementation', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const half = { ...chartsCapability, components: {} };
    const { load } = loaderFor({ half: { capability: half } });

    await expect(loadCapabilities(load, ['half'])).resolves.toEqual([]);

    expect(warn.mock.calls[0][0]).toContain("'half'");
  });

  it('accepts a complete capability, and what it accepts survives toFragment', async () => {
    const { load } = loaderFor({ charts: { capability: chartsCapability } });

    const [loaded] = await loadCapabilities(load, ['charts']);

    expect(loaded).toBe(chartsCapability);
    expect(() => toFragment(loaded)).not.toThrow();
  });

  it('asks every remote for the same exposed module and keeps the given order', async () => {
    const { load, calls } = loaderFor({
      charts: { capability: charts },
      maps: { capability: maps },
    });

    await expect(loadCapabilities(load, ['maps', 'charts'])).resolves.toEqual([maps, charts]);

    expect(calls).toEqual([
      ['maps', CAPABILITY_MODULE],
      ['charts', CAPABILITY_MODULE],
    ]);
  });
});
