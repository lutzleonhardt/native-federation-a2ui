import { TestBed } from '@angular/core/testing';
import { HttpAgent } from '@ag-ui/client';
import { describe, expect, it } from 'vitest';
import { capability as chartsCapability } from '../../projects/mfe-charts/src/capability';
import { AGENT_CAPABILITIES } from './a2ui/agent-capabilities.token';
import { AGENT_MODE, ASSISTANT_AGENT } from './agent/assistant-agent.token';
import { createAppConfig } from './app.config';
import type { CapabilityStatus } from './federation/capability-status';
import { CAPABILITY_STATUS } from './federation/capability-status.token';
import { ReplayAgent } from './replay/replay-agent';

/** One remote per state: only the loaded one may reach catalog and model context. */
const REMOTES: readonly CapabilityStatus[] = [
  {
    name: 'charts',
    state: 'loaded',
    origin: 'http://localhost:4201/',
    capability: chartsCapability,
  },
  { name: 'maps', state: 'unreachable' },
  { name: 'reserve', state: 'unselected' },
];

describe('createAppConfig', () => {
  it('derives the catalog list from the loaded remotes and hands the panel every status', () => {
    TestBed.configureTestingModule({
      providers: createAppConfig(REMOTES, { mode: 'local' }).providers,
    });

    expect(TestBed.inject(AGENT_CAPABILITIES)).toEqual([chartsCapability]);
    expect(TestBed.inject(CAPABILITY_STATUS)).toBe(REMOTES);
  });

  it('T3-AC-04 the agent setup decides the mode and the agent behind the chat', () => {
    TestBed.configureTestingModule({
      providers: createAppConfig(REMOTES, { mode: 'local' }).providers,
    });
    expect(TestBed.inject(AGENT_MODE)).toBe('local');
    expect(TestBed.inject(ASSISTANT_AGENT)).toBeInstanceOf(HttpAgent);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: createAppConfig(REMOTES, { mode: 'replay', recordings: {} }).providers,
    });
    expect(TestBed.inject(AGENT_MODE)).toBe('replay');
    expect(TestBed.inject(ASSISTANT_AGENT)).toBeInstanceOf(ReplayAgent);
  });
});
