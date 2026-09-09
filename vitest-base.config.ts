import { createRequire } from 'node:module';
import { defineConfig } from 'vitest/config';

const resolveFrom = createRequire(import.meta.url);

// `supports-color` (reached via chalk from `@copilotkit/shared`) ships a browser
// build, but announces it only through the legacy `browser` field. The Angular
// unit-test builder resolves with mainFields ['es2020', 'module', 'main'], so the
// Node entry wins and its `process`/`tty` access breaks the browser bundle.
//
// `uuid` (reached via `@ag-ui/client`) has the inverse problem: its exports map
// carries `node` and `browser` conditions, but the runner resolves with the
// `node` condition active, so `dist/esm` (node:crypto randomFillSync) lands in
// the browser bundle. The exports map blocks dist subpath specifiers, hence the
// path is derived from the exported package.json.
const uuidBrowser = resolveFrom
  .resolve('uuid/package.json')
  .replace(/package\.json$/, 'dist/esm-browser/index.js');

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^supports-color$/,
        replacement: resolveFrom.resolve('supports-color/browser.js'),
      },
      {
        find: /^uuid$/,
        replacement: uuidBrowser,
      },
    ],
  },
});
