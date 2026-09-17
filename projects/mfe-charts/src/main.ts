import { initFederation } from '@angular-architects/native-federation-v4';

// Standalone: the remote is its own host, so its import map comes from its own remoteEntry.json.
initFederation({}, { hostRemoteEntry: { url: './remoteEntry.json' } })
  .then(() => import('./bootstrap'))
  .catch((err: unknown) => console.error('[mfe-charts] bootstrap failed', err));
