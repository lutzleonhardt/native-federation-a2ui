import { initFederation, type FederationManifest } from '@angular-architects/native-federation-v4';
import { resolveAgentMode, type AgentSetup } from './app/agent/agent-mode';
import { describeCapabilities } from './app/federation/capability-status';
import { loadCapabilities } from './app/federation/load-capabilities';
import { selectCapabilities } from './app/federation/select-capabilities';
import { NO_RECORDINGS, parseRecordings } from './app/replay/recordings';
import { environment } from './environments/environment';

const MANIFEST_URL = 'federation.manifest.json';
const RECORDINGS_URL = 'recordings.json';

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} answered ${response.status}`);
  }
  return response.json();
}

/** Only replay needs the recordings; an unreachable file leaves it knowing no prompt. */
async function setupAgent(search: string): Promise<AgentSetup> {
  const mode = resolveAgentMode(search, environment.agentMode);
  if (mode === 'local') return { mode };
  const recordings = await fetchJson(RECORDINGS_URL)
    .then(parseRecordings)
    .catch((err: unknown) => {
      console.error('[shell] recordings unreachable, every prompt answers as not recorded', err);
      return NO_RECORDINGS;
    });
  return { mode, recordings };
}

/**
 * Phase one of the bootstrap. Nothing here may import `@angular/*` statically — nor any
 * other shared external: Angular is resolved through the import map that only
 * `initFederation` installs, so Angular enters through the dynamic import at the end.
 */
async function main(): Promise<void> {
  const manifest = await (fetchJson(MANIFEST_URL) as Promise<FederationManifest>).catch(
    (err: unknown) => {
      console.error('[shell] manifest unreachable, starting with the local capabilities', err);
      return {};
    },
  );
  const selected = selectCapabilities(manifest, location.search);
  const agent = await setupAgent(location.search);
  const nf = await initFederation(selected);
  const loaded = await loadCapabilities(nf.loadRemoteModule, Object.keys(selected));
  // The orchestrator knows where a remote actually came from; the panel shows that origin.
  const remotes = describeCapabilities(
    manifest,
    selected,
    loaded,
    (name) => nf.adapters.remoteInfoRepo.tryGet(name).get()?.scopeUrl,
  );
  const { bootstrap } = await import('./bootstrap');
  await bootstrap(remotes, agent);
}

main().catch((err: unknown) => console.error('[shell] bootstrap failed', err));
