# ConferenceFinder

The request decides which inputs/outputs are composed and how they are wired;
the vocabulary decides what is possible; Native Federation decides who delivers
vocabulary.

A spike around agent-driven UI: an AG-UI agent answers conference questions, and
the answer is rendered as an A2UI surface built from a shared component
vocabulary rather than from hand-written screens.

## Status

Milestone M1 — monolith spike. The shell, the agent server and the assistant
catalog live in this single Angular workspace; the Native Federation split
follows in M2.

## Setup

```bash
npm install
```

Requires Node.js >= 24 and npm (verified on 25.5). The install runs
`playwright install chromium` as a `postinstall` step — the shell test suite runs in
headless Chromium and fails without it. If your environment skips lifecycle scripts
(`npm ci --ignore-scripts`), run `npx playwright install chromium` once by hand.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run start:shell` | Serve the shell on http://localhost:4200 |
| `npm run build` | Production build of the shell |
| `npm test` | Run the shell test suite |
| `npm run test:shell` | Vitest Browser Mode (headless Chromium) |
| `npm run lint` | ESLint across TypeScript and templates |

## License

MIT — see [LICENSE](./LICENSE).
