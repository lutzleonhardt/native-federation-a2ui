import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { capability as chartsCapability } from '../../projects/mfe-charts/src/capability';
import { AGENT_CAPABILITIES } from './a2ui/agent-capabilities.token';
import { createAppConfig } from './app.config';
import type { CapabilityStatus } from './federation/capability-status';
import { CAPABILITY_STATUS } from './federation/capability-status.token';

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
    TestBed.configureTestingModule({ providers: createAppConfig(REMOTES).providers });

    expect(TestBed.inject(AGENT_CAPABILITIES)).toEqual([chartsCapability]);
    expect(TestBed.inject(CAPABILITY_STATUS)).toBe(REMOTES);
  });
});
