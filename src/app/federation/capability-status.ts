import type { FederationManifest } from '@angular-architects/native-federation-v4';
import type { AgentCapability } from '../../../shared/capabilities/agent-capability';

/** A selected remote that delivered its capability; `origin` is the orchestrator's scope URL. */
export interface LoadedCapability {
  readonly name: string;
  readonly state: 'loaded';
  readonly origin: string | undefined;
  readonly capability: AgentCapability;
}

/**
 * One manifest entry after the federation bootstrap. Three states on purpose: a remote
 * that failed to load must not look like one that was switched off in the URL.
 */
export type CapabilityStatus =
  | LoadedCapability
  | { readonly name: string; readonly state: 'unreachable' }
  | { readonly name: string; readonly state: 'unselected' };

/**
 * One status per manifest entry, in manifest order. `selected` is the URL whitelist
 * (`selectCapabilities`), `loaded` what those remotes delivered (`loadCapabilities`).
 */
export function describeCapabilities(
  manifest: FederationManifest,
  selected: FederationManifest,
  loaded: ReadonlyMap<string, AgentCapability>,
  originOf: (name: string) => string | undefined,
): CapabilityStatus[] {
  return Object.keys(manifest).map((name): CapabilityStatus => {
    if (!(name in selected)) {
      return { name, state: 'unselected' };
    }
    const capability = loaded.get(name);
    if (capability === undefined) {
      return { name, state: 'unreachable' };
    }
    return { name, state: 'loaded', origin: originOf(name), capability };
  });
}

/** What the loaded remotes contributed, in manifest order. */
export function loadedCapabilities(statuses: readonly CapabilityStatus[]): AgentCapability[] {
  return statuses.flatMap((status) => (status.state === 'loaded' ? [status.capability] : []));
}
