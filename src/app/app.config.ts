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

/** The capability list is an argument, not an import: `main.ts` (later the federation loader) decides it. */
export function createAppConfig(capabilities: readonly AgentCapability[]): ApplicationConfig {
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideZonelessChangeDetection(),
      provideRouter(routes),
      provideAgentCapabilities(capabilities),
      provideAssistantAgent(),
    ],
  };
}
