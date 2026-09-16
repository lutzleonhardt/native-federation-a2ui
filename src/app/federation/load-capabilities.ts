import type { LoadRemoteModule } from '@softarc/native-federation-orchestrator';
import type { AgentCapability } from '../../../shared/capabilities/agent-capability';

/** Every capability remote exposes this module with a named `capability` export. */
export const CAPABILITY_MODULE = './capability';

/** How long a remote may take to deliver its `./capability` module before it is skipped. */
export const CAPABILITY_LOAD_TIMEOUT_MS = 15_000;

interface CapabilityModule {
  readonly capability?: unknown;
}

/**
 * Loads the selected remotes' capabilities in manifest order. A remote that stalls, cannot be
 * loaded or exposes no usable capability is logged and skipped, so the shell still starts with
 * the remaining vocabulary.
 */
export async function loadCapabilities(
  load: LoadRemoteModule,
  names: readonly string[],
  timeoutMs = CAPABILITY_LOAD_TIMEOUT_MS,
): Promise<AgentCapability[]> {
  const results = await Promise.allSettled(
    names.map((name) =>
      withTimeout(
        load<CapabilityModule>(name, CAPABILITY_MODULE),
        timeoutMs,
        `remote '${name}' did not deliver '${CAPABILITY_MODULE}' within ${timeoutMs} ms`,
      ),
    ),
  );
  const capabilities: AgentCapability[] = [];
  for (const [index, result] of results.entries()) {
    const name = names[index];
    if (result.status === 'rejected') {
      console.warn(`[shell] capability '${name}' skipped: remote not loaded`, result.reason);
      continue;
    }
    const { capability } = result.value;
    if (!isAgentCapability(capability)) {
      console.warn(
        `[shell] capability '${name}' skipped: '${CAPABILITY_MODULE}' exports no usable capability`,
      );
      continue;
    }
    capabilities.push(capability);
  }
  return capabilities;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

/**
 * The contract's compile-time invariant (every announced name has an implementation) cannot
 * cross the federation boundary, so it is checked here before `toFragment` would throw on it.
 */
function isAgentCapability(value: unknown): value is AgentCapability {
  if (!isObject(value) || typeof value['name'] !== 'string') {
    return false;
  }
  const vocabulary = value['vocabulary'];
  const components = value['components'];
  if (!isObject(vocabulary) || !isObject(components)) {
    return false;
  }
  const announced = vocabulary['components'];
  return (
    isObject(announced) &&
    Array.isArray(vocabulary['functions']) &&
    Object.keys(announced).every((name) => typeof components[name] === 'function')
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
