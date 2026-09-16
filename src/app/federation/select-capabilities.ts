import type { FederationManifest } from '@angular-architects/native-federation-v4';

const QUERY_PARAM = 'capabilities';

/**
 * Narrows the manifest to the `?capabilities=charts,maps` whitelist. No parameter keeps
 * every entry, an empty one keeps none, unknown names are ignored. The result keeps
 * manifest order because that order decides who wins a duplicate component name.
 */
export function selectCapabilities(
  manifest: FederationManifest,
  search: string,
): FederationManifest {
  const requested = new URLSearchParams(search).get(QUERY_PARAM);
  if (requested === null) {
    return manifest;
  }
  const names = new Set(requested.split(',').map((name) => name.trim()));
  return Object.fromEntries(Object.entries(manifest).filter(([name]) => names.has(name)));
}
