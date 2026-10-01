# Development

How to set up the workspace, what each script does, how to add a remote, and how the
behavior of the model is measured. For the idea, read [how-it-works.md](./how-it-works.md)
first. The reference is [architecture.md](./architecture.md).

## Setup

```bash
npm install
cp .env.example .env    # put in the key of one provider
npm start               # shell 4200, charts 4201, maps 4202, agent 3001
```

Requires Node.js >= 24 and npm (verified on 25.5). The `postinstall` step applies
the patch under `patches/` (`patch-package`), runs `playwright install chromium`
(the shell test suite runs in headless Chromium and fails without it) and installs
the agent's own dependencies under `agent/`. If your environment skips lifecycle
scripts (`npm ci --ignore-scripts`), run `npx patch-package`,
`npx playwright install chromium` and `npm --prefix agent install` once by hand.

The agent server refuses to start without the key of the selected provider and
names the missing variable. `AGENT_PROVIDER` picks `anthropic` (default),
`openai` or `deepseek`; `AGENT_MODEL` overrides the model id of that provider.
`SHELL_ORIGIN` is the browser origin the agent accepts (CORS); set it when the
shell runs on a port other than 4200.

To poke the AG-UI endpoint by hand, open [`agent/requests.http`](../agent/requests.http)
in a JetBrains IDE with a running `npm run start:agent`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm start` | Serve shell (4200), charts remote (4201), maps remote (4202) and agent (3001) together; a failing start takes all down |
| `npm run start:shell` | Serve the shell on http://localhost:4200 |
| `npm run start:charts` | Serve the charts remote on http://localhost:4201 — its `remoteEntry.json` for the shell, and a standalone page |
| `npm run start:maps` | Serve the maps remote on http://localhost:4202 — likewise |
| `npm run start:agent` | Agent dev loop on http://localhost:3001 (watch mode) |
| `npm run build` | Production build of the shell |
| `npm run build:deploy -- --base-href /path/` | Build shell and remotes into one static site, `dist/deploy`, in replay mode. It starts with a `clean`: do not run it beside `npm start`, and run `npm run clean` before the next `npm start` |
| `npm run clean` | Remove `dist`, the Angular cache and the NF artifact cache; run it when switching between `ng build` and `ng serve` |
| `npm test` | Run all five test suites |
| `npm run test:shell` | Vitest Browser Mode (headless Chromium) |
| `npm run test:charts` | Vitest Browser Mode for the charts remote |
| `npm run test:maps` | Vitest Browser Mode for the maps remote |
| `npm run test:agent` | Vitest (Node) for the agent server |
| `npm run test:eval` | Type-check and unit-test the eval harness (no model calls) |
| `npm run eval` | Model-behavior gate — **real API calls**, see below |
| `npm run lint` | ESLint across every project's TypeScript and templates, then the module boundaries |
| `npm run lint:boundaries` | Sheriff: shell, remotes and the capability contract import only what `sheriff.config.ts` allows |

→ [Development and deployment](./architecture.md#development-and-deployment)

## Adding a remote

A remote is an Angular project under `projects/` that exposes `./capability`; `mfe-maps` is the template.

1. `ng generate application mfe-<name> --routing=false --skip-tests --style=css --prefix=app --skip-install`,
   then copy `federation.config.mjs`, `tsconfig.federation.json`, `src/main.ts` and `src/bootstrap.ts`
   from `projects/mfe-maps` and set `name` and `exposes`.
2. `angular.json`: replace the project's `build`/`serve` targets with the NF pair and add `esbuild`,
   `serve-original` (own port), `test` and `lint` as in `mfe-maps`; add both tsconfigs to `tsconfig.json`.
3. `public/federation.manifest.json`: one entry, key = NF `name` = the capability's `name`.
4. `package.json`: `start:<name>` and `test:<name>`, folded into `start` and `test`.
5. `sheriff.config.ts`: the remote's two entry points (page and capability). Without them its imports
   are not checked.
6. Shell specs may import the remote's `src/capability` as a fixture; production code may not.

## The model-behavior gate

`npm run eval` answers the one question the test suites cannot: does the model
*reliably* build a correctly wired surface? The suites script the agent's answers,
so they prove the renderer and the tool boundary — never the model.

It is a headless Node harness that plays the browser's part: same tool definitions,
same context serializer, client tools executed locally, `renderSurface` recorded
instead of rendered. It then scores each recorded surface against the wiring rules
and the same host rules the shell enforces, and exits non-zero unless every
request clears 4 out of 5 runs.

```bash
npm run start:agent          # must be running, with a working API key
npm run eval                 # 4 requests x 5 runs against the real model
EVAL_RUNS=1 npm run eval      # cheap smoke run
```

It plays four requests, each an example prompt as the first message of a fresh
session. With both capabilities announced: the timeline prompt and the detail
prompt. With charts only: the timeline prompt and the slider-map prompt, which no
announced component can serve. That last one passes when the answer uses nothing
outside the announced vocabulary, a `messageWidget` text names the gap and no
slider is drawn. The scorer only looks for the keyword, so the harness prints
those texts. The slider map and the comparison are judged by eye when they are
recorded, not by the gate.

The last run on the current prompt gave 5/5 and 4/5 with both capabilities, and
5/5 and 4/5 with charts only. Read these numbers as a measurement of one model
on one day: the same prompt gives a different UI from one run to the next, and
the hosted demo plays answers I selected. The levers are the model and the form
rules in the prompt.

**This spends real API credit** — about 20 requests per full run, one or two
model calls each. That is why it is a manual script and deliberately not part of
`npm test` or CI. Run it after touching the prompt, the tool definitions or the
context serializer; the numbers belong in the task log. `AGENT_PROVIDER` and
`AGENT_MODEL` point a run at another model, `EVAL_AGENT_URL` at another server.
