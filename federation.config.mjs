import { withNativeFederation, shareAll } from '@angular-architects/native-federation-v4/config';

export default withNativeFederation({
  name: 'shell',

  shared: {
    ...shareAll(
      { singleton: true, strictVersion: true, requiredVersion: 'auto', build: 'package' },
      {
        overrides: {
          // includeSecondaries is an opt-out of ignoreUnusedDeps, so all of
          // @angular/core is shared to prevent mismatches.
          '@angular/core': {
            singleton: true,
            strictVersion: true,
            requiredVersion: 'auto',
            build: 'package',
            includeSecondaries: { keepAll: true },
          },
        },
      },
    ),
  },

  skip: [
    // The a2ui, ag-ui and CopilotKit packages carry nested zod 3 copies. Sharing the root
    // zod 4 rewrites their `zod` imports to the v4 classic API and breaks every catalog schema
    // that nests web_core's ActionSchema (`k._parse is not a function`). Only the v3 line
    // (`zod/v3`, still shared) crosses the federation boundary.
    'zod',
    'rxjs/ajax',
    'rxjs/testing',
    'rxjs/webSocket',
    // `rxjs/fetch` stays shared: the shared `@copilotkit/angular` chunk imports it, and a
    // skipped subpath has no import-map entry, so the browser could not resolve it.
  ],

  // Please read our FAQ about sharing libs:
  // https://shorturl.at/jmzH0

  features: {
    // ignoreUnusedDeps is enabled by default now
    // ignoreUnusedDeps: true,

    // Opt-in: groups chunks in remoteEntry.json for smaller metadata file
    denseChunking: true,
  },
});
