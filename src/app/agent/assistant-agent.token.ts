import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
} from '@angular/core';
import { type AbstractAgent, HttpAgent } from '@ag-ui/client';
import { COPILOT_KIT_CONFIG, type CopilotKitConfig } from '@copilotkit/angular';
import { ASSISTANT_AGENT_ID, localAgentUrl } from '../../../shared/agent-contract';
import { LocationStore, PINNED_CITY } from '../domain/location.store';
import { CAPABILITY_STATUS } from '../federation/capability-status.token';
import { recorderFor, RUN_RECORDER, type RunRecorder } from '../replay/recorder';
import { capabilitySetKey } from '../replay/recordings';
import { ReplayAgent } from '../replay/replay-agent';
import type { AgentMode, AgentSetup } from './agent-mode';

export const ASSISTANT_AGENT_URL = localAgentUrl(ASSISTANT_AGENT_ID);

/** The mode the bootstrap resolved; the chat chrome labels it, nothing else branches on it. */
export const AGENT_MODE = new InjectionToken<AgentMode>('AGENT_MODE');

/**
 * The AG-UI agent behind the chat: the local agent server or the replay of
 * recorded answers, chosen at boot; tests substitute a scripted agent.
 */
export const ASSISTANT_AGENT = new InjectionToken<AbstractAgent>('ASSISTANT_AGENT');

/**
 * Registers the mode, the agent it implies, the recorder when the local agent was asked
 * to record, the city replay pins the location to, and that agent with CopilotKit as
 * self-managed: there is no CopilotRuntime, the shell owns the transport. `headers` must
 * be present — the core normalizes it without a null check.
 */
export function provideAssistantAgent(setup: AgentSetup): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AGENT_MODE, useValue: setup.mode },
    { provide: ASSISTANT_AGENT, useFactory: () => createAgent(setup) },
    { provide: RUN_RECORDER, useFactory: () => createRecorder(setup) },
    { provide: PINNED_CITY, useValue: setup.mode === 'replay' ? setup.city : undefined },
    {
      provide: COPILOT_KIT_CONFIG,
      useFactory: (): CopilotKitConfig => ({
        headers: {},
        selfManagedAgents: { [ASSISTANT_AGENT_ID]: inject(ASSISTANT_AGENT) },
      }),
    },
  ]);
}

function createAgent(setup: AgentSetup): AbstractAgent {
  if (setup.mode === 'local') {
    return new HttpAgent({ agentId: ASSISTANT_AGENT_ID, url: ASSISTANT_AGENT_URL });
  }
  return new ReplayAgent(setup.recordings, loadedSetKey());
}

/** Only the local agent asked with `?record` records; replay has no such switch. */
function createRecorder(setup: AgentSetup): RunRecorder | undefined {
  if (setup.mode !== 'local' || setup.record !== true) return undefined;
  return recorderFor(loadedSetKey(), inject(LocationStore).cityId);
}

/** Recordings are keyed by the set as the URL spells it: the manifest names that loaded. */
function loadedSetKey(): string {
  const loaded = inject(CAPABILITY_STATUS).flatMap((status) =>
    status.state === 'loaded' ? [status.name] : [],
  );
  return capabilitySetKey(loaded);
}
