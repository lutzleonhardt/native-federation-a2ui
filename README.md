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

Requires Node.js >= 24 and npm (verified on 25.5). The `postinstall` step runs
`playwright install chromium` (the shell test suite runs in headless Chromium and
fails without it) and installs the agent's own dependencies under `agent/`. If your
environment skips lifecycle scripts (`npm ci --ignore-scripts`), run
`npx playwright install chromium` and `npm --prefix agent install` once by hand.

The agent server needs an API key. Copy `.env.example` to `.env` and fill in the key
of the provider you select — the server refuses to start otherwise, naming the
missing variable.

```bash
cp .env.example .env
```

`AGENT_PROVIDER` picks `anthropic` (default), `openai` or `deepseek`; `AGENT_MODEL`
overrides the model id of that provider.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm start` | Serve shell (4200) and agent (3001) together; a failing start takes both down |
| `npm run start:shell` | Serve the shell on http://localhost:4200 |
| `npm run start:agent` | Agent dev loop on http://localhost:3001 (watch mode) |
| `npm run build` | Production build of the shell |
| `npm test` | Run both test suites |
| `npm run test:shell` | Vitest Browser Mode (headless Chromium) |
| `npm run test:agent` | Vitest (Node) for the agent server |
| `npm run lint` | ESLint across the shell's TypeScript and templates |

## License

MIT — see [LICENSE](./LICENSE).
