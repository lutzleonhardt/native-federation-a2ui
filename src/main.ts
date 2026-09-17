import { initFederation, type FederationManifest } from '@angular-architects/native-federation-v4';
import { describeCapabilities } from './app/federation/capability-status';
import { loadCapabilities } from './app/federation/load-capabilities';
import { selectCapabilities } from './app/federation/select-capabilities';

const MANIFEST_URL = 'federation.manifest.json';

async function fetchManifest(): Promise<FederationManifest> {
  const response = await fetch(MANIFEST_URL);
  if (!response.ok) {
    throw new Error(`${MANIFEST_URL} answered ${response.status}`);
  }
  return response.json();
}

/**
 * Phase one of the bootstrap. Nothing here may import `@angular/*` statically: Angular
 * is a shared external that the browser can only resolve once `initFederation` has
 * installed the import map, so Angular enters through the dynamic import at the end.
 */
async function main(): Promise<void> {
  const manifest = await fetchManifest().catch((err: unknown) => {
    console.error('[shell] manifest unreachable, starting with the local capabilities', err);
    return {};
  });
  const selected = selectCapabilities(manifest, location.search);
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
  await bootstrap(remotes);
}

main().catch((err: unknown) => console.error('[shell] bootstrap failed', err));
