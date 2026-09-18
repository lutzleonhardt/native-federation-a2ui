import type { SheriffConfig } from '@softarc/sheriff-core';

/**
 * The module boundaries of the federation split, checked by `npm run lint:boundaries`
 * (`sheriff verify`). Production code only: the walk starts at the entry points below and
 * never reaches a spec, so a spec may import a remote's source as a fixture.
 */
export const config: SheriffConfig = {
  // No barrel files anywhere: every file of a module is importable by whoever the rules allow.
  enableBarrelLess: true,
  modules: {
    src: 'shell',
    'projects/<remote>': 'remote',
    // Nested on purpose — the deepest match wins: the contract folder keeps its own tag while
    // `shared/agent-contract.ts` (agent id, port, route) stays host business.
    shared: 'host-contract',
    'shared/capabilities': 'contract',
  },
  depRules: {
    shell: ['contract', 'host-contract'],
    remote: ['contract'],
    contract: [],
    'host-contract': [],
  },
  // One pair per remote: the standalone page and the exposed module. A remote missing here is
  // never traversed and therefore never checked — see README, "Adding a remote".
  entryPoints: {
    shell: 'src/main.ts',
    'charts-page': 'projects/mfe-charts/src/main.ts',
    'charts-capability': 'projects/mfe-charts/src/capability.ts',
    'maps-page': 'projects/mfe-maps/src/main.ts',
    'maps-capability': 'projects/mfe-maps/src/capability.ts',
  },
};
