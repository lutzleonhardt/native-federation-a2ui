import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import type { AgentCapability } from '../../shared/capabilities/agent-capability';
import { provideAgentCapabilities } from './a2ui/agent-capabilities.token';
import { provideAssistantAgent } from './agent/assistant-agent.token';
import { routes } from './app.routes';
import type { CapabilityStatus } from './federation/capability-status';
import { provideCapabilityStatus } from './federation/capability-status.token';

/**
 * Both lists are arguments, not imports: the federation bootstrap decides them. `capabilities`
 * feeds catalog and model context, `remotes` the panel's per-manifest-entry states.
 */
export function createAppConfig(
  capabilities: readonly AgentCapability[],
  remotes: readonly CapabilityStatus[],
): ApplicationConfig {
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideZonelessChangeDetection(),
      provideRouter(routes),
      provideAgentCapabilities(capabilities),
      provideCapabilityStatus(remotes),
      provideAssistantAgent(),
    ],
  };
}
