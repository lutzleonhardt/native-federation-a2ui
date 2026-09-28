import type { AgentMode } from '../app/agent/agent-mode';

/** Build-time defaults; the `deploy` configuration in angular.json swaps in `environment.deploy.ts`. */
export const environment: { readonly agentMode: AgentMode } = { agentMode: 'local' };
