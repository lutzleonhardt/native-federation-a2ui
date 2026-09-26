import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAgentCapabilities } from './a2ui/agent-capabilities.token';
import { provideReserveHandler } from './a2ui/reserve-handler';
import { provideAssistantAgent } from './agent/assistant-agent.token';
import { routes } from './app.routes';
import { loadedCapabilities, type CapabilityStatus } from './federation/capability-status';
import { provideCapabilityStatus } from './federation/capability-status.token';

/**
 * The status list is an argument, not an import: the federation bootstrap decides it. Catalog
 * and model context see the loaded remotes in manifest order (who wins a duplicate name), the
 * panel sees every manifest entry with its state. The shell owns no vocabulary of its own.
 */
export function createAppConfig(remotes: readonly CapabilityStatus[]): ApplicationConfig {
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideZonelessChangeDetection(),
      provideRouter(routes),
      provideAgentCapabilities(loadedCapabilities(remotes)),
      provideCapabilityStatus(remotes),
      provideAssistantAgent(),
      provideReserveHandler(),
    ],
  };
}
