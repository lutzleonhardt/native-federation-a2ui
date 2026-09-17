import { withNativeFederation, shareAll } from '@angular-architects/native-federation-v4/config';

export default withNativeFederation({
  // The NF remote name is the manifest key the shell selects by (`?capabilities=charts`),
  // not the Angular project name.
  name: 'charts',

  // The capability contract: `./capability` with a named `capability` export (see
  // `AgentCapability` in shared/capabilities). Nothing else leaves this remote.
  exposes: {
    './capability': './projects/mfe-charts/src/capability.ts',
  },

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
          // Unused-dependency pruning only looks at the exposed module, not at the standalone
          // bootstrap: `@angular/platform-browser` is inlined there and imports
          // `@angular/common/http`, which needs an import-map entry when the remote runs alone.
          '@angular/common': {
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

  // Kept in step with the shell's skip list; `zod` for the reason given there (the root zod 4
  // must not replace the a2ui packages' nested zod 3), the rxjs entries for the same surface.
  skip: ['zod', 'rxjs/ajax', 'rxjs/testing', 'rxjs/webSocket'],

  // Please read our FAQ about sharing libs:
  // https://shorturl.at/jmzH0

  features: {
    // ignoreUnusedDeps is enabled by default now
    // ignoreUnusedDeps: true,

    // Opt-in: groups chunks in remoteEntry.json for smaller metadata file
    denseChunking: true,
  },
});
