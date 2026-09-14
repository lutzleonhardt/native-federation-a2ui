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

The system architecture — big picture, the AG-UI run, which package owns which
layer, and the invariants behind it all — is described in
[docs/architecture.md](./docs/architecture.md).

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
overrides the model id of that provider. `SHELL_ORIGIN` is the browser origin the
agent accepts (CORS); set it when the shell runs on a port other than 4200.

To poke the AG-UI endpoint by hand, open [`agent/requests.http`](./agent/requests.http)
in a JetBrains IDE with a running `npm run start:agent`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm start` | Serve shell (4200) and agent (3001) together; a failing start takes both down |
| `npm run start:shell` | Serve the shell on http://localhost:4200 |
| `npm run start:agent` | Agent dev loop on http://localhost:3001 (watch mode) |
| `npm run build` | Production build of the shell |
| `npm test` | Run all three test suites |
| `npm run test:shell` | Vitest Browser Mode (headless Chromium) |
| `npm run test:agent` | Vitest (Node) for the agent server |
| `npm run test:eval` | Type-check and unit-test the eval harness (no model calls) |
| `npm run eval` | Model-behavior gate — **real API calls**, see below |
| `npm run lint` | ESLint across the shell's TypeScript and templates |

## The model-behavior gate

`npm run eval` answers the one question the test suites cannot: does the model
*reliably* build a correctly wired surface? The suites script the agent's answers,
so they prove the renderer and the tool boundary — never the model.

It is a headless Node harness that plays the browser's part: same tool definitions,
same context serializer, client tools executed locally, `renderSurface` recorded
instead of rendered. It then scores each recorded surface against the wiring rules
and the same host rules the shell enforces, and exits non-zero unless every demo
request clears 4 out of 5 runs.

```bash
npm run start:agent          # must be running, with a working API key
npm run eval                 # 3 requests x 5 runs against the real model
EVAL_RUNS=1 npm run eval      # cheap smoke run
```

**This spends real API credit** — roughly 40 model calls per full run. That is why
it is a manual script and deliberately not part of `npm test` or CI. Run it after
touching the prompt, the tool definitions or the context serializer; the numbers
belong in the task log. `AGENT_PROVIDER` and `AGENT_MODEL` point a run at another
model, `EVAL_AGENT_URL` at another server.

## License

MIT — see [LICENSE](./LICENSE).
