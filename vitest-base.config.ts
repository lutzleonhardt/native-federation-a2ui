import { createRequire } from 'node:module';
import { defineConfig } from 'vitest/config';

const resolveFrom = createRequire(import.meta.url);

// `supports-color` (reached via chalk from `@copilotkit/shared`) ships a browser
// build, but announces it only through the legacy `browser` field. The Angular
// unit-test builder resolves with mainFields ['es2020', 'module', 'main'], so the
// Node entry wins and its `process`/`tty` access breaks the browser bundle.
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^supports-color$/,
        replacement: resolveFrom.resolve('supports-color/browser.js'),
      },
    ],
  },
});
