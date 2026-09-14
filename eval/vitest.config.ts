import { defineConfig } from 'vitest/config';

// Own project: the shell runner is browser-mode and the agent runner only sees
// `agent/src`, while the scorer is plain Node code that belongs to neither.
export default defineConfig({
  root: import.meta.dirname,
  test: { environment: 'node', include: ['*.spec.ts'] },
});
