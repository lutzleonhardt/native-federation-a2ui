import { inject, InjectionToken, type Provider } from '@angular/core';
import { type AbstractAgent, HttpAgent } from '@ag-ui/client';
import { COPILOT_KIT_CONFIG, type CopilotKitConfig } from '@copilotkit/angular';

export const ASSISTANT_AGENT_ID = 'assistant';
export const ASSISTANT_AGENT_URL = 'http://localhost:3001/ag-ui/assistant';

/**
 * The AG-UI agent behind the chat. Production talks to the local agent server;
 * tests substitute a scripted agent, and later milestones swap in replay or
 * BYOK agents here without touching the chat.
 */
export const ASSISTANT_AGENT = new InjectionToken<AbstractAgent>('ASSISTANT_AGENT', {
  factory: () => new HttpAgent({ agentId: ASSISTANT_AGENT_ID, url: ASSISTANT_AGENT_URL }),
});

/**
 * Registers the token's agent with CopilotKit as self-managed: there is no
 * CopilotRuntime, the shell owns the transport. `headers` must be present —
 * the core normalizes it without a null check.
 */
export function provideAssistantAgent(): Provider {
  return {
    provide: COPILOT_KIT_CONFIG,
    useFactory: (): CopilotKitConfig => ({
      headers: {},
      selfManagedAgents: { [ASSISTANT_AGENT_ID]: inject(ASSISTANT_AGENT) },
    }),
  };
}
