import type { AgentMode } from '../app/agent/agent-mode';

/** The static deployment has no agent server: recordings answer by default. */
export const environment: { readonly agentMode: AgentMode } = { agentMode: 'replay' };
