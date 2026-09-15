import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { toFragment, type AgentCapability } from '../../../shared/capabilities/agent-capability';
import { createAssistantCatalog } from './assistant-catalog';
import { provideA2uiCatalog } from './provide-a2ui-catalog';

/**
 * The capabilities this shell instance loaded, in manifest order — the one
 * place the rest of the app learns what is available.
 */
export const AGENT_CAPABILITIES = new InjectionToken<readonly AgentCapability[]>(
  'AGENT_CAPABILITIES',
);

/** Registers the list and the renderer catalog built from it; whoever bootstraps decides the list. */
export function provideAgentCapabilities(
  capabilities: readonly AgentCapability[],
): EnvironmentProviders {
  return makeEnvironmentProviders([
    // For the renderer: the Angular components behind every announced name.
    provideA2uiCatalog(createAssistantCatalog(capabilities.map(toFragment))),
    // For the model: the chat page serializes each entry's `vocabulary` into the run context.
    { provide: AGENT_CAPABILITIES, useValue: capabilities },
  ]);
}
