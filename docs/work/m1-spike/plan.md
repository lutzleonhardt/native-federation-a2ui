# Plan: ConferenceFinder — M1 Spike im Monolith

Spec: `docs/spec.md` (v3.3, 2026-09-09; copy of `a2ui/docs/spec/spec-federated-capabilities.md`). Background: `docs/book-learnings.md`.
Scope: Milestone M1 only — Agent + Shell + `renderSurface` + `findConferences` + `Timeline`/`Map`/`Gauge` as in-shell catalog components, demo requests 1–3, **no Native Federation**. The M1 gate is Task 9 (requests 1–3; request 4's `reserve`-button contract is scored inside request 3). M2 (NF split: charts + maps remotes) and M3 (reserve, MapLibre upgrade, hosting/replay publication) are planned separately. **v3.3 re-scoping (2026-09-09, user-approved): Task 8 moved out of this scope into M3 — task order here is 6 → 7 → 9.**
Repo: `~/projects/conference-finder` (MIT, Angular CLI workspace, npm, Node ≥ 24). Ports: shell 4200, agent 3001. Tests: Vitest (Browser Mode for the shell, Node for `agent/`).
Data-model conventions: catalog id `https://conference-finder.dev/catalogs/assistant`; paths `/filteredConfs` (last `findConferences` result), `/selectedConf` (selection within each surface, initially the first result), `/me` (location). The client mounts these values; `/filteredConfs` and `/me` are never written by the model.
Code conventions: code that becomes a remote later lives in `src/app/capabilities/charts/` and `src/app/capabilities/maps/` and must not import from `src/app/domain/`. Shared, framework-free pieces (schemas, descriptions, pure logic) stay importable from Node so the eval harness reuses them.
Angular conventions: zoneless (no `zone.js`), every component `OnPush`, signals-first (`input()`/`output()`/`model()`, `signal`/`computed`/`linkedSignal`, signal stores instead of Subjects), `inject()` instead of constructor injection, standalone, `@if`/`@for`, `host` metadata instead of `@HostBinding`. RxJS only at the AG-UI boundary (`AbstractAgent.run()` returns Observables), converted to signals immediately.
Licensing: nothing is copied from the flights42 example repo (no license). Helpers named after the book (`initAgentStore`, `createFrontendTool`, `provideA2uiCatalog`, `binding`, `createCustomComponent`, `catalogToContextEntry`, `registerHandlers`) are own implementations.
Verified library facts (npm, 2026-08-28): `@a2ui/angular@0.10.5` peer-pins `@angular/core ^21.2.5` → Angular 21.2.22 (v21-lts), not 22. `@copilotkit/angular@0.3.1` (peer `@angular/cdk`), `@a2ui/web_core@0.10.6`, `@ag-ui/core|client|encoder@0.0.59`, `@ag-ui/mastra@1.1.2`, `@mastra/core@1.63.0`, `vitest@4.1.11`. CopilotKit 0.3.1 ships its own A2UI path (`render_a2ui` tool renderer, `copilot-a2ui-*` on a Lit renderer) — not used; our tool is `renderSurface` on `@a2ui/angular`.

> The executing agent may adjust scope and ordering based on more
> up-to-date context discovered during implementation, as long as
> each task still satisfies the sizing rules above.
>
> When a task is finished (DONE or BLOCKED), close it with the
> `/wrap-up N` → `/commit N` pair. `/wrap-up N` writes or extends
> `docs/work/<scope>/task-log/task-{N}-{slug}.md`, where `<scope>`
> is derived from the current git branch, and is safe to run multiple
> times across sessions — it merges. `/commit N` reads that log,
> stages code + summary, and commits them together after showing
> the plan and waiting for confirmation. Optionally run `/review`
> (quick per-task, full before a PR) between wrap-up and commit;
> a second `/wrap-up N` can absorb the review findings.

## Task 1: Scaffold the `conference-finder` workspace with Vitest (Node + Browser Mode)

No dependency. The repo already exists with `docs/` only (`git init -b master`, no commits).

**Instructions**

- Angular CLI workspace (no Nx, npm) in the existing directory: root app project named `shell`, served on port 4200. `ng new` into a non-empty directory needs `--directory . --skip-git` (and `--force` for conflicting files); rename the generated project to `shell` in `angular.json` if the CLI names it after the directory.
- Pin **Angular 21.2.x** (`@angular/cli@21.2.22`, `@angular/build@21.2.22`) — Angular 22 is blocked by `@a2ui/angular`'s peer range.
- Angular 21 `ng new` is zoneless by default — keep it: no `zone.js` dependency, `provideZonelessChangeDetection()` in `src/app/app.config.ts`. Set the component schematic default to `changeDetection: OnPush` in `angular.json` (`@schematics/angular:component`).
- ESLint via `@angular-eslint` with `prefer-signals`, `prefer-inject`, `prefer-standalone`, `prefer-on-push-component-change-detection` enabled and `no-host-metadata-property` disabled; script `lint`.
- Install and compile-check: `@copilotkit/angular@0.3.1` + `@angular/cdk@21`, `@a2ui/angular@0.10.5`, `@a2ui/web_core@0.10.6`, `@a2ui/markdown-it` (peer), `@ag-ui/core@0.0.59`, `@ag-ui/client@0.0.59`, `zod@4` (A2UI schemas are imported from `zod/v3`, which zod 4 ships).
- Tests through the `@angular/build:unit-test` builder (`runner: vitest`, the Angular 21 default) with `browsers: ['ChromeHeadless']` so every shell spec runs in Vitest Browser Mode (needs `@vitest/browser@4` and the Playwright provider; install Chromium via Playwright). Pure-function specs run in the same target.
- Scripts: `start:shell`, `test:shell`, `test` (= `test:shell` for now), `lint`, `build`. Remaining scripts (`start`, `start:agent`, `eval`, `start:charts|maps|embed`, `capture`) come with later tasks/milestones.
- `LICENSE` (MIT, Lutz Leonhardt), `.gitignore` (Angular defaults + `.env`), README stub with the thesis in one sentence: *The request decides which inputs/outputs are composed and how they are wired; the vocabulary decides what is possible; Native Federation decides who delivers vocabulary.* (The full README argument is M4.)

**Acceptance**

- T1-AC-01 — `npm run test:shell` runs a Browser-Mode spec that renders a trivial standalone `OnPush` component in headless Chromium and a pure-function spec, both green.
- T1-AC-02 — A spec imports from `@copilotkit/angular`, `@a2ui/angular`, `@a2ui/web_core/v0_9` and `@ag-ui/client` and asserts `BASIC_FUNCTIONS.length > 0` and `A2uiMessageListWrapperSchema.safeParse({ messages: [] }).success === true`.
- T1-AC-03 — `package.json` pins `@angular/*` 21.2.x, `@copilotkit/angular` 0.3.x, `@a2ui/angular` 0.10.x, `@a2ui/web_core` 0.10.x, `@ag-ui/*` ≥ 0.0.59; `npm ls` reports no peer conflicts without `--legacy-peer-deps`.
- T1-AC-04 — `LICENSE` (MIT) and the README stub exist; `npm run start:shell` serves the app on port 4200.
- T1-AC-05 — `zone.js` is absent from `package.json`, `app.config.ts` uses `provideZonelessChangeDetection()`, and `npm run lint` fails for a component without `OnPush` or with an `@Input()` decorator (lint rules are active).

**Key Locations**

- `angular.json`, `package.json`, `tsconfig*.json`, `eslint.config.js`
- `src/app/app.config.ts`, `src/app/app.ts`, `src/main.ts`
- `LICENSE`, `README.md`, `.gitignore`

**Key Discoveries**

- `@copilotkit/angular@0.3.1` peer-depends on `@angular/cdk` and `rxjs ^7.8`; `@a2ui/angular@0.10.5` peer-depends on `@a2ui/markdown-it`.
- The `@angular/build:unit-test` schema has `browsers: string[]` — names ending in `Headless` enable headless mode; without it tests run in jsdom.
- `@angular-architects/native-federation` latest is 22.1.1; M2 must select a 21.x-compatible line. Not part of M1.
- Node LTS on this machine is v25.5 with npm 11.8.

## Task 2: Add the Mastra agent server with a raw AG-UI endpoint and provider switch

Depends on Task 1 (workspace and root scripts).

**Instructions**

- `agent/` with its own `package.json` (TypeScript, `tsx` for dev): `@mastra/core@1.x` (≥ 1.29, required by `@ag-ui/mastra`), `@ag-ui/mastra@1.1.2`, `@ag-ui/core@0.0.59`, `@ag-ui/encoder@0.0.59`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/deepseek`, `ai` (use the major that `@mastra/core` depends on), `zod`, `dotenv`. `@ag-ui/mastra` lists `@copilotkit/runtime ^1.60.1` and `@mastra/client-js` as required peers — they install; they are not used.
- `agent/src/config.ts`: `provider: 'anthropic' | 'openai' | 'deepseek'` plus a model id per provider. Development/recording default: Anthropic `claude-sonnet-5`; cross-check: a cheap OpenAI model (the book used GPT-5.4 mini); DeepSeek `deepseek-chat` without promises. Pure `resolveModel(config, env)` returns the AI SDK model instance; a missing key throws an error naming the env var. `AGENT_PROVIDER` and `AGENT_MODEL` env overrides.
- `.env.example` at the repo root with `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, `AGENT_PROVIDER`; `.env` is git-ignored.
- One Mastra `Agent` named `assistant` with a placeholder system prompt (the real prompt is a later task), **no server tools**, no memory. The server knows nothing about A2UI: do not use `getA2UITools`, the A2UI subagent or `registerCopilotKit` from `@ag-ui/mastra` (the latter serves the CopilotKit-runtime protocol, not the raw AG-UI SSE the shell's `HttpAgent` speaks).
- `agent/src/server.ts`: `POST /ag-ui/:agentId` on port 3001 with CORS for `http://localhost:4200`. Parse the body with `RunAgentInputSchema` (`@ag-ui/core`) → 400 on failure; unknown agent → 404; otherwise `new MastraAgent({ agent }).run(input)` (an `Observable<BaseEvent>`) streamed as SSE with `EventEncoder` (`@ag-ui/encoder`). Client tools arrive in `input.tools[]` and `context[]` is stored by the adapter under `requestContext.set('ag-ui', …)` — no extra plumbing. Either Mastra's server (`registerApiRoute` from `@mastra/core/server`) or a minimal Node/Hono server around the `Mastra` instance — one file.
- Scripts: `agent/package.json` `dev` and `test` (Node Vitest); root `start:agent` (`npm --prefix agent run dev`), `start` (shell + agent via `concurrently`), `test` runs shell and agent suites.

**Acceptance** (Node Vitest in `agent/`)

- T2-AC-01 — With `AGENT_PROVIDER=openai` and `OPENAI_API_KEY` set, `resolveModel` returns an OpenAI model whose `modelId` matches the config; with the key missing it throws an error that names `OPENAI_API_KEY`.
- T2-AC-02 — With the agent built on a mock language model from `ai/test` (`MockLanguageModelV3` for AI SDK ≥ 6) that streams the text "hello", posting a valid `RunAgentInput` to `/ag-ui/assistant` yields SSE events `RUN_STARTED`, `TEXT_MESSAGE_CONTENT` containing "hello", and `RUN_FINISHED`, in that order.
- T2-AC-03 — Posting to `/ag-ui/unknown` returns 404; posting an invalid body returns 400.
- T2-AC-04 — `npm start` at the repo root starts shell (4200) and agent (3001) together; `npm test` runs both test suites.

**Key Locations**

- `agent/package.json`, `agent/tsconfig.json`, `agent/vitest.config.ts`
- `agent/src/config.ts`, `agent/src/agent.ts`, `agent/src/server.ts`
- `.env.example`, root `package.json` scripts

**Key Discoveries**

- `MastraAgentConfig { agent: Agent, resourceId?, requestContext?, … }`; `MastraAgent.run(input: RunAgentInput): Observable<BaseEvent>`; `getLocalAgents({ mastra })` wraps all agents of a `Mastra` instance.
- A run = one POST with an SSE response = one pass of the agent loop; a client-tool call ends the run with its `TOOL_CALL_*` events, the client executes the handler and starts the next run.
- Tool results reach the model as strings; convention `{ ok, code?, result? }`.
- `@mastra/core@1.63.0` peers: `zod ^3.25 || ^4`. Mastra also accepts `provider/model` strings via its model router; explicit AI SDK providers keep the three-provider switch simple.

## Task 3: Conference data set, dayOffset loader, location store, and `findConferences` logic

Depends on Task 1.

**Instructions**

- `src/app/domain/conferences.json`: ~30 **fictional, plausible** conferences: `{ id, name, topic, city, country, lat, lon, dayOffset, capacity, remaining, price, url }`. `topic ∈ angular | dotnet | web | ai | cloud | …` (≥ 8 angular, ≥ 6 dotnet). Names carry the topic ("ng-summit Berlin", "dotnet-days Wien"); real cities with real coordinates; `dayOffset` spread over 3…300 so that "in the next months" and "near me" always return hits for any of the fallback cities; `url = /conf-sites/<id>.html` (the static pages are M3). No real conference names or dates — invented dates for real events would be misinformation.
- `src/app/domain/conference.ts`: types and pure `loadConferences(today: Date): Conference[]` adding `date` (ISO `YYYY-MM-DD`) = `today + dayOffset`; the JSON is never mutated. The demo therefore never ages: "the next one" always exists and countdowns stay meaningful.
- `src/app/domain/geo.ts`: pure `haversineKm(a: { lat; lon }, b)`.
- `src/app/domain/find-conferences.ts` (pure) + `find-conferences.schema.ts` (zod 4, framework-free; reused by the tool registration and the Node eval harness): `findConferences({ topic?, withinDays?, nearKm?, limit?, groupBy?: 'month' | 'topic' }, { confs, me?, today })` → `{ confs, byMonth?, byTopic? }`. Filters: `topic` exact; `withinDays`: `date ≤ today + n`; `nearKm`: haversine to `me` ≤ n (ignored without `me`); sort by date ascending; `limit`. Each result carries integer `distanceKm` when `me` is known. `byMonth`/`byTopic` rows are `{ label, value }` (+ passthrough) so a bar chart can bind them later; derived views come from the tool, never from the model.
- `src/app/domain/cities.ts`: fixed list of ~10 European cities `{ id, name, lat, lon }` (Berlin, München, Wien, Zürich, Hamburg, Köln, Frankfurt, Amsterdam, Prag, Warschau).
- `src/app/domain/location.store.ts` (root signal service): `me: Signal<{ lat; lon; city } | undefined>`; `init()` asks `navigator.geolocation` once and snaps to the nearest city of the list; on denial/unavailability `me` stays `undefined` until `setCity(id)`; the chosen city persists in `localStorage`; a persisted city wins over geolocation, so a returning user is never prompted again. **No context projection here** (amended during Task 3): an AG-UI `Context` is `{ description: string, value: string }`, so `Me` → context is a serialisation whose `description` is prompt design, not domain code — it lands as `meToContextEntry(me): Context` next to `catalogToContextEntry` where the context is assembled.

**Acceptance**

- T3-AC-01 — Given today = 2026-01-01 and a conference with `dayOffset: 42`, `loadConferences` yields `date: '2026-02-12'`; the imported JSON object is unchanged afterwards.
- T3-AC-02 — `haversineKm(Berlin, München)` is 504 ± 5.
- T3-AC-03 — `findConferences({ topic: 'angular', withinDays: 90 })` returns only angular conferences dated within 90 days, sorted by date ascending; `limit: 2` returns the first two.
- T3-AC-04 — With `me` = Berlin and `nearKm: 300`, only conferences within 300 km are returned and each carries an integer `distanceKm`; without `me`, `distanceKm` is absent and `nearKm` is ignored.
- T3-AC-05 — `groupBy: 'month'` returns `byMonth` rows `{ label: 'YYYY-MM', value }` whose values sum to `confs.length`; `groupBy: 'topic'` analogously.
- T3-AC-06 — The data set has ≥ 30 entries, unique ids, valid coordinates, `remaining ≤ capacity`, no `date` field (schema test over the JSON).
- T3-AC-07 — With a fake geolocation resolving near München, `me().city === 'München'`; with a denied permission, `me()` is `undefined` until `setCity('berlin')` sets Berlin.

**Key Locations**

- `src/app/domain/conferences.json`, `conference.ts`, `geo.ts`, `find-conferences.ts`, `find-conferences.schema.ts`, `cities.ts`, `location.store.ts`

**Key Discoveries**

- The model binds paths only; the client mounts `findConferences` results under `/filteredConfs` and the location under `/me`. Distances are relative to `/me`.
- Replay recordings (M4) contain only structure and stay valid because dates are derived from `dayOffset` at load time.
- zod 4 for tool schemas; `zod/v3` only for A2UI catalog schemas. Both coexist.

## Task 4: Assistant catalog with `Gauge`, `daysUntil`, `distance`, and the vocabulary context entry

Depends on Task 3 (`haversineKm` from `src/app/domain/geo.ts` backs the `distance` function).

**Instructions**

- **Pre-step — transport probe (temporary; the spec is removed after its findings are logged).**
  A Browser-Mode spec drives a real `HttpAgent` from `@ag-ui/client` against a temporarily started
  mock-model agent server (any local tweaks for it, e.g. the CORS origin, stay uncommitted) and
  answers three questions from the Task 1/2 open issues: does `@ag-ui/client` resolve in the
  browser bundle (the `uuid` question), does the client expand `TEXT_MESSAGE_CHUNK` to
  `START/CONTENT/END`, and does a failed run surface as a terminal `RUN_ERROR` client-side. The
  findings go to the task log with open issues re-routed to Task 7; only if a finding contradicts
  the documented expectations does a pinning test become a Task 7 deliverable.
- `agent/requests.http` (lasting side deliverable): JetBrains HTTP Client file for manual
  exploration against a running `npm run start:agent`: a valid `RunAgentInput` (streams SSE), the
  400 body, the 404 agent id, the CORS preflight. A comment notes that the dummy key ends runs in
  `RUN_ERROR` and a real key is needed for real answers. README gets a one-line pointer.
- `src/app/a2ui/binding.ts`: `binding(schema)` = `schema | { path: string }` (zod/v3 union) — a prop is a literal or a data-model binding.
- `src/app/a2ui/custom-component.ts`: `createCustomComponent({ name, description, schema, component })` → `AngularComponentImplementation` (see `@a2ui/web_core/v0_9/catalog/types.d.ts` for the implementation shape) with a `ContextFromSchema` type so a component's `props` type is derived from its schema (`BoundProperty<T>` per prop). Keep each primitive's `name`, `description`, `schema` in a framework-free `*.schema.ts` next to the component so Node can import the metadata.
- `src/app/a2ui/assistant-catalog.ts`: `ASSISTANT_CATALOG_ID = 'https://conference-finder.dev/catalogs/assistant'`; `createAssistantCatalog(fragments: { components, functions }[])` → `new BasicCatalogBase({ id, extraComponents, functions: [...BASIC_FUNCTIONS, ...fns] })`. `functions` **replaces** the basic list, hence the spread. Warn (`console.warn`) on name collisions between fragments or with basic names and keep the first.
- `src/app/a2ui/provide-a2ui-catalog.ts`: `provideA2uiCatalog(catalog)` → `provideA2uiRenderer({ catalogs: [catalog], actionHandler })` + `ASSISTANT_CATALOG` token. The action handler forwards to an injectable action bus (a signal/emitter) that later handlers subscribe to.
- `src/app/a2ui/catalog-context.ts`: `catalogToContextEntry(meta)` → `{ description: 'A2UI Custom Catalog', value: JSON }` serializing **components and functions**: `catalogId`, `components: { name: { description, schema } }`, `functions: { name: { description, args, returnType } }` (JSON Schema via `zod-to-json-schema` — zod 4's `z.toJSONSchema` does not accept `zod/v3` schemas). The book serializes components only; functions are needed so the model uses `daysUntil`/`distance`.
- `src/app/capabilities/charts/gauge.component.ts` + `gauge.schema.ts`: props `value: binding(number)`, `max: binding(number)`, `label?: binding(string)`; SVG arc with the numbers; description tells the model it shows remaining tickets ("Restkarten") and takes `value`/`max` bindings.
- `src/app/capabilities/charts/days-until.fn.ts`: `daysUntil(date: string) → number` via `createFunctionImplementation({ name, returnType: 'number', schema }, execute)` from `@a2ui/web_core`; whole days from today at local midnight (negative for past dates).
- `src/app/capabilities/maps/distance.fn.ts`: `distance(a: { lat; lon }, b) → number` (km, rounded) using `haversineKm`.
- `src/app/capabilities/charts/index.ts` and `maps/index.ts` each export a `{ components, functions }` fragment; `app.config.ts` provides `provideA2uiCatalog(createAssistantCatalog([charts, maps]))`.
- `src/app/testing/bound-property.ts`: Vitest fake `boundProperty(value)` → `{ value: WritableSignal, raw, onUpdate: vi.fn() }` (the official `createBoundProperty` from `@a2ui/angular/testing` returns a Jasmine spy).

**Acceptance**

- T4-AC-01 — (Browser Mode) `Gauge` with `value 12`, `max 100` renders an SVG whose text shows "12" and "100"; `value.set(50)` re-renders to "50".
- T4-AC-02 — With a fixed clock, `daysUntil(today + 42 days)` returns 42; a past date returns a negative number.
- T4-AC-03 — `distance(Berlin, München)` is 504 ± 5.
- T4-AC-04 — `createAssistantCatalog` yields a catalog whose components include all basic names plus `Gauge`, and whose functions include `formatDate` (basic) plus `daysUntil` and `distance`; a duplicate component name across fragments logs a warning and keeps the first.
- T4-AC-05 — `catalogToContextEntry` JSON contains `catalogId`, `components.Gauge.schema` with `value` and `max`, and `functions.daysUntil` with an args schema and `returnType: 'number'`.
- T4-AC-06 — (Browser Mode, real `A2uiRendererService`) processing `createSurface` (assistant id) + `updateComponents` with a `Gauge` bound to `/selectedConf/remaining` and `/selectedConf/capacity` + `updateDataModel` renders the gauge with those values.
- T4-AC-07 — `agent/requests.http` contains the four requests above and the README references it; manual check: the valid request against a running agent streams SSE in the IDE.

**Key Locations**

- `src/app/a2ui/binding.ts`, `custom-component.ts`, `assistant-catalog.ts`, `provide-a2ui-catalog.ts`, `catalog-context.ts`, `action-bus.ts`
- `src/app/capabilities/charts/gauge.component.ts`, `gauge.schema.ts`, `days-until.fn.ts`, `index.ts`
- `src/app/capabilities/maps/distance.fn.ts`, `index.ts`
- `src/app/testing/bound-property.ts`, `src/app/app.config.ts`
- `agent/requests.http`, `README.md`

**Key Discoveries**

- `@a2ui/angular` v0_9: `provideA2uiRenderer(config)` / `A2UI_RENDERER_CONFIG: InjectionToken<RendererConfiguration { catalogs: AngularCatalog[]; actionHandler?: (action: A2uiClientAction) => void }>`; `A2uiRendererService { processMessages(messages); surfaceGroup }` — the catalog list is fixed in its constructor; `createSurface` with an unknown `catalogId` throws `A2uiStateError('Catalog not found')`; `updateComponents` is validated immediately against the catalog schema.
- `BasicCatalogBase(options: { id?, locale?, components?, extraComponents?: AngularComponentImplementation[], functions?: FunctionImplementation[] })`; `BASIC_FUNCTIONS` is re-exported by `@a2ui/angular` from `@a2ui/web_core/v0_9/basic_catalog`.
- `createFunctionImplementation({ name, returnType, schema }, execute(args, dataContext))` exists in `@a2ui/web_core`.
- Catalog component contract: `props = input.required<Ctx>()`, `surfaceId`, `componentId`, `dataContextPath`; each prop is `BoundProperty<T> { value: Signal<T>; raw; onUpdate }`; optional props may be `undefined` → `props().label?.value()`.
- Renderer selectors: `a2ui-v09-surface` (`[surfaceId]`), `a2ui-v09-component-host` (`[componentKey]`). `@a2ui/angular/testing` exports `setComponentProps(fixture, props)`.
- Component/function descriptions land verbatim in the system prompt — they are prompt engineering (usage rules, layout hints) and a prompt-injection surface (`sendCatalogDescription: true`; prod note for the README in M4).

## Task 5: Selection primitives `Timeline` and `Map` that write the whole element

Depends on Task 4 (`binding`, `createCustomComponent`, fragments, bound-property fake).

**Instructions**

- `src/app/capabilities/charts/timeline.component.ts` + `timeline.schema.ts`: props `items: binding(array of { id: string, label: string, date: string, …passthrough })`, `range?: binding({ from, to })`, `selected?: binding(any)`, `action?: ActionSchema` (from `@a2ui/web_core` `schema/common-types`). Horizontal SVG axis; one marker per item, ordered by date, labelled; the marker whose `id` equals `selected.value()?.id` is highlighted. Click → `props().selected?.onUpdate(item)` with the **complete item object** (all passthrough fields untouched) and, if `action` is set, dispatch it exactly like the basic `Button` does (look at `ButtonComponent` in the `@a2ui/angular` fesm2022 bundle for the dispatch mechanism and mirror it — the renderer resolves the action context and emits `A2uiClientAction { surfaceId, name, context }`).
- `src/app/capabilities/maps/map.component.ts` + `map.schema.ts`: props `points: binding(array of { id, label, lat, lon, …passthrough })`, `center?: binding({ lat, lon, city? })`, `selected?: binding(any)`, `action?: ActionSchema`. SVG scatter: equirectangular projection over the bounding box of points plus center (padding), lat/lon gridlines, labelled point markers, a distinct center marker; click writes the whole point via `selected.onUpdate` and dispatches `action` if set. `filter` and `mode` are M3 — do not declare them yet.
- Descriptions are prompt engineering: `Map` — "shows items that have `lat`/`lon`; a click writes the whole clicked object to the path bound to `selected`; bind `center` to the user's location"; `Timeline` — analogous for items with `date`.
- Only extract shared SVG scale helpers (`src/app/capabilities/shared/`) if both components need the same code.
- Register both in the fragments (`charts/index.ts`, `maps/index.ts`).
- Playground route (user-approved amendment, 2026-09-09 — minimal effort): `src/app/playground/` page at `/playground` that renders a hand-built surface through the real `A2uiRendererService` — real conferences on `/filteredConfs`, Berlin on `/me`, `Gauge` plus `Timeline`/`Map` once they exist — so the visual primitives are visible and clickable via `npm start` before Task 7. One page, fixture surface, no styling beyond basic layout; lives in the shell, not under `capabilities/`.

**Acceptance** (Browser Mode; bound-property fakes with `onUpdate = vi.fn()` unless a real renderer is named)

- T5-AC-01 — `Timeline` with 3 items renders 3 markers ordered by date; clicking the second calls `selected.onUpdate` once with the whole item including passthrough fields (`remaining`, `url`).
- T5-AC-02 — With a literal (unbound) `selected`, clicking a marker is a no-op and does not throw.
- T5-AC-03 — `Map` with 3 points renders 3 markers inside the SVG viewport plus a distinct center marker when `center` is set; clicking a point calls `selected.onUpdate` with the whole point object.
- T5-AC-04 — (real `A2uiRendererService` with an `actionHandler` spy) `Map` and `Timeline` with `action: { event: { name: 'pick', context: { id: { path: '/x/id' } } } }` emit an `A2uiClientAction` named `pick` with the resolved id on click.
- T5-AC-05 — (real renderer) a surface with `Map(points ← /filteredConfs, selected → /selectedConf)` and `Text(text ← /selectedConf/name)`: clicking a marker updates the text to that point's name; `fetch` is never called.

**Key Locations**

- `src/app/capabilities/charts/timeline.component.ts`, `timeline.schema.ts`, `index.ts`
- `src/app/capabilities/maps/map.component.ts`, `map.schema.ts`, `index.ts`
- `src/app/capabilities/shared/` (only if needed)
- `src/app/playground/` (dev showcase, amendment)

**Key Discoveries**

- Selection writes the whole element, not the id — that is what lets basic `Text`/`Gauge` components bind `/selectedConf/name`, `/selectedConf/remaining` without a lookup function. Elements in `items`/`points` may carry arbitrary extra fields and must pass through unchanged.
- `ComponentBinder` sets `onUpdate = isBoundPath ? v => dataContext.set(path, v) : () => {}` — writing to a literal prop is a silent no-op. All bindings on the same path are signals and re-render.
- `ActionSchema` = `{ event: { name, context } }` (context values: literal, `{ path }`, `{ call, args }`) or `{ functionCall }`. Nothing in the renderer talks to the server; whether a click stays local (binding) or triggers a run (action → handler → message) is decided by markup and registered handlers.
- No chart/map library: everything is SVG. No real map tiles (non-goal).

## Task 6: Client tools `renderSurface`, `findConferences`, `messageWidget` with the surface data store

Depends on Task 5 (the mount test renders a `Timeline`).

**Instructions**

- `src/app/agent/create-frontend-tool.ts`: own typed wrapper over `registerFrontendTool`/`FrontendToolConfig` (`{ name, description, parameters, component?, handler(args, ctx), followUp?, agentId? }`). When `followUp: false`, append "Calling this tool ends your turn." to the description. Results follow `{ ok: boolean, code?: string, result?: unknown }`. Keep each tool's `name`, `description`, `parameters` in a framework-free `*.definition.ts`; the Angular registration imports it (the Node eval harness reuses the same definitions).
- `src/app/agent/surface-data.store.ts` (root signals): `confs`, `byMonth`, `byTopic` (last `findConferences` result), `me` (read from `LocationStore`).
- `findConferences` tool (`src/app/agent/tools/find-conferences.tool.ts`): parameters = the zod-4 schema from `src/app/domain/find-conferences.schema.ts`; handler runs the pure `findConferences` with `loadConferences(today)` and `me`, writes the store, and returns a **compact** result `{ ok: true, count, mountedAt: '/filteredConfs', next: { id, name, city, date, distanceKm? } }` — never the list. The model binds; it does not copy.
- `renderSurface` tool (`src/app/agent/tools/render-surface.tool.ts`): `parameters` = the protocol-envelope schema (message forms `createSurface`/`updateComponents`/`updateDataModel` with their required fields; component props stay open — the catalog and prompt carry them; amended 2026-09-10, see review amendments below), `followUp: false`, `component: SurfaceToolRenderer`. Handler steps, in order:
  1. `A2uiMessageListWrapperSchema.safeParse(args)` (`@a2ui/web_core/v0_9`) → on failure `{ ok: false, code: 'invalid_messages', result: issues }`.
  2. Guard: collect all `updateDataModel` writes whose `path` is `/filteredConfs`, `/me`, `/byMonth`, `/byTopic` or below → `{ ok: false, code: 'forbidden_model_writes', result: <message listing all forbidden paths> }`.
  3. `A2uiRendererService.processMessages(messages)` in try/catch → `{ ok: false, code: 'catalog', result: error.message }` on catalog/state errors (unknown component, wrong child form, unknown catalog id).
  4. Mount: `processMessages([updateDataModel /filteredConfs, /me, /byMonth?, /byTopic?])` for the created surface, and `/selectedConf = confs[0]` unless the model's messages already wrote `/selectedConf`.
  5. Return `{ ok: true, surfaceId }`.
  On any failure invoke the `RENDER_FAILURE_HANDLER` token (default: `console.warn`) exactly once with `{ toolCallId, code, issues }`. `followUp` is static in CopilotKit 0.3, so the shell has to trigger the correction run itself; the chat task binds this token to a correction run.
- `src/app/agent/tools/surface-tool-renderer.component.ts` (`ToolRenderer<Args>`, `OnPush`): derives the `surfaceId` from the `createSurface` message in `toolCall().args.messages`; renders `<a2ui-v09-surface [surfaceId]>` once `toolCall().status === 'complete'` and the parsed result is `ok`; shows a small "Building surface …" placeholder while streaming/executing and the error text for `ok: false`. The surface itself lives in the root `A2uiRendererService`, so re-instantiation of the renderer component is harmless.
- `messageWidget({ text })` (`src/app/agent/tools/message-widget.tool.ts`): `followUp: false`, handler returns `{ ok: true }`, component renders the text (markdown allowed).
- **Review amendments (2026-09-10, user-approved):** the tool schema describes the full protocol envelope (~2.7 kB serialized — the "too large" rationale only holds for component-level schemas); the forbidden-write guard decides on parsed path segments (`me` ≡ `/me`; root writes forbidden as a whole); the client mount runs inside the same try/catch and rolls the surface back on failure; one fresh surface per call is enforced (`deleteSurface` rejected, existing surfaceIds refused); `createFrontendTool` exposes `onValidationFailure` so boundary rejections reach `RENDER_FAILURE_HANDLER` too. Consequence: a message missing `version` now fails at the boundary as `invalid_args` (T6-AC-04's substance — zod issues in `result` — unchanged); the surfaceId-mismatch check stays `invalid_messages`.
- Tool playground (user-approved amendment, 2026-09-10): `/playground/tools` drives the real bound pipeline — location picker, `findConferences`, `renderSurface` scenarios incl. failure cases, `messageWidget` — with `RENDER_FAILURE_HANDLER` bound to a visible log, so the Task-6 layer is visible via `npm start` before Task 7.

**Acceptance** (Browser Mode, real `A2uiRendererService` + assistant catalog)

- T6-AC-01 — With 3 conferences in the store and messages `createSurface` + `updateComponents` containing `Timeline(items ← /filteredConfs)`, the handler returns `{ ok: true }` and 3 markers render without any `updateDataModel` from the model.
- T6-AC-02 — Messages containing `updateDataModel` on `/filteredConfs`, `/me` or `/filteredConfs/0` return `{ ok: false, code: 'forbidden_model_writes' }` and no surface is created.
- T6-AC-03 — An unknown component name or a `Card` with `children` returns `{ ok: false }` with the issue in `result`; `surfaceGroup` has no new surface.
- T6-AC-04 — Messages missing `version` or with a `surfaceId` mismatch fail schema validation with zod issues in `result`.
- T6-AC-05 — After a successful call, `/me` equals the location store value, `/selectedConf` equals the first mounted conference, and the model's own `updateDataModel` on another path (e.g. `/title`) is applied; if the model wrote `/selectedConf`, it is not overwritten.
- T6-AC-06 — On failure `RENDER_FAILURE_HANDLER` is invoked exactly once with the issues; on success never.
- T6-AC-07 — `SurfaceToolRenderer` shows the `a2ui-v09-surface` for a complete `ok` call and the error text for an `ok: false` result.
- T6-AC-08 — The `findConferences` handler writes `confs` (with `distanceKm`) to the store and its returned result contains no `lat`, `lon` or `capacity` fields.

**Key Locations**

- `src/app/agent/create-frontend-tool.ts`, `surface-data.store.ts`, `render-failure-handler.token.ts`
- `src/app/agent/tools/render-surface.definition.ts`, `render-surface.tool.ts`, `surface-tool-renderer.component.ts`
- `src/app/agent/tools/find-conferences.definition.ts`, `find-conferences.tool.ts`
- `src/app/agent/tools/message-widget.definition.ts`, `message-widget.tool.ts`, `message-widget.component.ts`
- `src/app/playground/tool-playground.ts` (dev sandbox, amendment)

**Key Discoveries**

- `registerFrontendTool<Args>({ name, description, parameters: StandardSchemaV1, component?: Type<ToolRenderer<Args>>, handler, followUp?, agentId? })`; the handler runs in an injection context (`inject()` works). `ToolRenderer<Args> { toolCall: Signal<AngularToolCall<Args>>; agent? }` with `status ∈ in-progress | executing | complete`, `args` partial while streaming, `result` a string (parse it).
- CopilotKit registers built-in tool-call renderers for the names `render_a2ui` and `AGUISendStateSnapshot` — never use those names.
- `A2uiMessageListWrapperSchema = { messages: (createSurface | updateComponents | updateDataModel | deleteSurface)[] }`, each with `version: 'v0.9' | 'v0.9.1'`; `createSurface { surfaceId, catalogId, theme?, sendDataModel? }`; components form a flat list nested via `child`/`children` ids (`Card`/`Button`/`Modal` = one `child`; `Row`/`Column`/`List` = `children[]`).
- The renderer applies operations idempotently; the data model is per surface; the model never edits an existing surface (fresh `surfaceId` per answer).
- Why the client mounts data: structure from the model, data from code — fewer tokens, no transcribed numbers, replay recordings stay valid.

## Task 7: Chat page with agent store, location picker, example prompts, and a mock-agent loop test

Depends on Task 6 (tools, `RENDER_FAILURE_HANDLER`, `SurfaceDataStore`).

**Instructions**

- `src/app/agent/assistant-agent.token.ts`: `ASSISTANT_AGENT: InjectionToken<AbstractAgent>`; production value `new HttpAgent({ url: 'http://localhost:3001/ag-ui/assistant' })` (`@ag-ui/client`). Tests substitute a `MockAgent`; M4 swaps in Replay/BYOK agents here.
- `src/app/agent/init-agent-store.ts`: own `initAgentStore({ agentId: 'assistant', frontendTools, context })`: registers the agent from the token as self-managed (`COPILOT_KIT_CONFIG` via `useFactory` reading `ASSISTANT_AGENT`, or the `CopilotKit` service API if 0.3.1 allows adding an agent at runtime), registers every tool for that `agentId`, calls `connectAgentContext` for each entry (reactive `() => value` accessors so a city change reaches the next run), binds `RENDER_FAILURE_HANDLER` to a deferred correction run (`continueTurn()`; the tool result already carries code and issues — amended 2026-09-11: the Mastra adapter drops `developer` messages, and the review found the loop needs a per-turn budget of three), returns `injectAgentStore(agentId)`. Context entries: `catalogToContextEntry(...)` and `{ description: 'User location (me)', value: JSON { city, lat, lon } }`.
- `src/app/agent/agent-store-helper.ts`: `sendMessage(text)`, `continueTurn()`, `reset()` on top of the `AgentStore` (`agent`, `isRunning`, `messages`, `state` signals).
- `src/app/chat/chat.page.ts`: `<copilot-chat [agentId]="'assistant'">` with the CopilotKit stylesheet (`@copilotkit/angular/styles.css` or the package's `dist/styles.css`). Verify that `copilot-chat` renders our `SurfaceToolRenderer` via `copilot-chat-tool-calls-view`; only if it does not, build the headless variant (`copilot-chat-message-view` + `copilot-render-tool-calls`). Header with the location picker (`src/app/chat/location-picker.component.ts`: shows the current city; a `<select>` of the fixed city list when `me` is undefined or on demand) and the example-prompt buttons.
- `src/app/chat/example-prompts.ts`: `EXAMPLE_PROMPTS` (reused by the M4 capture script), sent verbatim as user messages:
  1. „Welche Angular-Konferenzen gibt es in den nächsten Monaten?"
  2. „Zeig sie auf einer Karte"
  3. „Wann ist die nächste in meiner Nähe? Wenn ich eine anklicke, will ich Details."
  4. „Reservier mir eine Karte"
- `src/app/testing/mock-agent.ts`: `MockAgent extends AbstractAgent` whose `run(input)` returns an Observable of a scripted event list chosen per run (e.g. by run index or by the last message): run 1 → `RUN_STARTED`, `TOOL_CALL_START/ARGS/END` for `findConferences`, `RUN_FINISHED`; run 2 → the same for `renderSurface` with the request-3 surface (`Row [ Map(points ← /filteredConfs, center ← /me, selected → /selectedConf), Column [ Text /selectedConf/name, Text daysUntil(/selectedConf/date), Text distance(/me, /selectedConf), Gauge(/selectedConf/remaining, /selectedConf/capacity), Button reserve ] ]`). This is the "agent mock" test seam from the book and the seed for M4's `ReplayAgent`.
- Wire `LocationStore.init()` and `initAgentStore` at chat-page creation; app routes/root render the chat page.

**Acceptance**

- T7-AC-01 — With `HttpAgent.fetch` replaced by a spy, the run request body contains `tools[]` with `renderSurface`, `findConferences`, `messageWidget` and `context[]` with the catalog entry (naming `Gauge` and `daysUntil`) and the `me` entry.
- T7-AC-02 — Changing the city via `LocationStore.setCity` changes the `me` context value in the next run's request body.
- T7-AC-03 — (mock-agent loop, Browser Mode) clicking example button 3 yields a surface with `Map` and `Text(/selectedConf/name)`; clicking the second marker changes the text to that conference's name; `fetch` is never called.
- T7-AC-04 — A scripted `renderSurface` call with invalid messages starts exactly one correction run whose request ends with the failed call's tool result carrying the issues; several failures in one run yield one correction, at most three corrections per user turn, then the shell stops (amended 2026-09-11, replaces the developer-message wording).
- T7-AC-05 — The four example buttons send exactly the German texts above as user messages.
- T7-AC-06 — `messageWidget({ text })` renders its text inside the chat.

**Key Locations**

- `src/app/agent/assistant-agent.token.ts`, `init-agent-store.ts`, `agent-store-helper.ts`
- `src/app/chat/chat.page.ts`, `location-picker.component.ts`, `example-prompts.ts`
- `src/app/testing/mock-agent.ts`, `src/app/app.config.ts`, `src/app/app.routes.ts`, `src/styles.css`

**Key Discoveries**

- CopilotKit 0.3.1: `provideCopilotKit({ agents?, selfManagedAgents?, frontendTools?, renderToolCalls?, renderActivityMessages?, defaultToolRendering?, a2ui?, … })`, `COPILOT_KIT_CONFIG` token, `CopilotKit.getAgent(agentId)`, `injectAgentStore(agentId): Signal<AgentStore>`, `connectAgentContext(context | () => context, { injector? })`, `CopilotChat` inputs `agentId`, `threadId`, `inputComponent`, `assistantMessageComponent`, …; `CopilotChatToolCallsView` and `RenderToolCalls` (`copilot-render-tool-calls`) render registered tool components.
- `HttpAgent { url, headers, fetch: HttpAgentFetchFn }` — `fetch` is a replaceable property (test seam). `AbstractAgent.run(input: RunAgentInput): Observable<BaseEvent>`.
- `RunAgentInput` fields: `threadId`, `runId`, `messages[]` (roles `user | assistant | tool | developer | system | activity`), `tools[]` (frontend tools as JSON schema), `context[]` (`{ description, value }` → system prompt text), `state`, `forwardedProps`, `resume?`. `tools[]` and `context[]` are recomposed on every run.
- Each client-tool call is a run boundary; `followUp: false` ends the turn (no `messageWidget` between steps in one run).
- CopilotKit 0.3.1 components are signal-based (all inputs `isSignal: true`) and `@a2ui/angular` exposes `BoundProperty.value` as a signal — both fit zoneless. If `copilot-chat` shows rendering gaps without a zone, isolate the cause and record it in the task log; do not add `zone.js`.

## Task 8: `ConferenceStore` with a `reserve` handler that updates the surface without a model call

> **MOVED (spec v3.3 re-scoping, 2026-09-09):** no longer part of the m1-spike scope — lands in
> the M3 scope after the NF proof, together with its prompt/eval extensions. The block below is
> retained unchanged for ID traceability (`T8-AC-*`, XC-02); do not `/start-task 8` on this branch.

Depends on Task 6 (`SurfaceDataStore`, `findConferences` handler, action bus from the renderer config).

**Instructions**

- `src/app/domain/conference.store.ts` (root signal store): `reservations: Signal<Record<string, number>>`, `conferences()` = `loadConferences(today)` with reservations applied (the store is the source of truth for `remaining`), `remainingFor(id)`, `reserve(id)` decrements by one; a sold-out conference (remaining 0) is a no-op; unknown id ignored. In-memory only ("Reservierungen lokal").
- Switch the `findConferences` tool handler from `loadConferences(today)` to `store.conferences()` so results reflect reservations.
- `src/app/a2ui/register-handlers.ts`: own `registerHandlers({ reserve })` subscribing to the action bus fed by the renderer's `actionHandler` (the config callback; `surfaceGroup.onAction` is not an RxJS Observable). Unknown event names are logged and ignored.
- `src/app/domain/handlers/reserve.handler.ts`: `reserve(action)` reads `action.context.id` (the model's button is `action: { event: { name: 'reserve', context: { id: { path: '/selectedConf/id' } } } }`; the renderer resolves `{ path }` to the value), calls `store.reserve(id)`, then `renderer.processMessages([updateDataModel { surfaceId: action.surfaceId, path: '/selectedConf/remaining', value }, updateDataModel { path: '/filteredConfs/<i>/remaining', value }])` where `i` is the index of the id in the mounted `/filteredConfs` (`SurfaceDataStore`). No agent involved.
- Register the handlers where the chat page initializes the agent store.

**Acceptance** (Browser Mode, real renderer + assistant catalog)

- T8-AC-01 — Given a surface with `Gauge(value ← /selectedConf/remaining, max ← /selectedConf/capacity)` and mounted `/filteredConfs` whose first entry has remaining 20 and `/selectedConf` = that entry, dispatching the action `reserve { id: <first id> }` shows 19 in the gauge and sets `/filteredConfs/0/remaining` to 19; `fetch` is not called and `isRunning` stays false.
- T8-AC-02 — `reserve(id)` twice reduces `remainingFor(id)` by 2; reserving a sold-out conference leaves 0.
- T8-AC-03 — A subsequent `findConferences` call returns the reduced `remaining` for that conference.
- T8-AC-04 — An action with an unknown event name is ignored without throwing (and logged).

**Key Locations**

- `src/app/domain/conference.store.ts`, `src/app/domain/handlers/reserve.handler.ts`
- `src/app/a2ui/register-handlers.ts`, `src/app/a2ui/action-bus.ts`
- `src/app/agent/tools/find-conferences.tool.ts`, `src/app/chat/chat.page.ts`

**Key Discoveries**

- `A2uiClientAction { surfaceId, name, context }` arrives through `RendererConfiguration.actionHandler`.
- Code-driven `updateDataModel` on an existing surface is the book's `increaseMiles` pattern: the handler calls `renderer.processMessages` directly, without AG-UI. The model never edits existing surfaces.
- Domain actions stay in the shell: `reserve` is a basic `Button` with `action: reserve`; the vocabulary remotes stay neutral. The prompt (later task) allows exactly this one client event.

## Task 9: Agent prompt for requests 1–3 and the `npm run eval` model-behavior harness (M1 gate)

> **AMENDED (2026-09-12, user-approved):** the harness is trimmed to what the gate needs.
> Dropped: the `docs/eval/*.md` report generator, token-usage accounting, and the provider
> cross-check as a gate criterion (`AGENT_PROVIDER` stays an env override for manual runs).
> `catalog-instructions.ts` folds into `prompt.ts`; `client-tools.ts` and `report.ts` fold into
> `run-eval.ts`. Scoring semantics (A1–A3 and the global fail conditions) are unchanged.
> Added: `catalogToContextEntry` must become Node-importable — see Instructions.

Depends on Task 7 (running shell loop; tool definitions and context serializer to reuse).

**Instructions**

- `agent/src/prompt.ts` + `agent/src/catalog-instructions.ts`; the agent's `instructions` are assembled per run from `requestContext.get('ag-ui').context` (catalog entry → "Custom Catalog" section listing components and functions with descriptions/schemas; `me` entry → location line). Rules, in this order:
  - Output rules: fetch data **first** with `findConferences`, then call `renderSurface` **once**, then stop; text only via `messageWidget`; never plain-text answers.
  - A2UI format rules with two complete examples: request 1 → `Timeline(items ← /filteredConfs)`; request 3 → `Row [ Map(points ← /filteredConfs, center ← /me, selected → /selectedConf), Column [ Text /selectedConf/name, Text formatString("in {0} Tagen", daysUntil(/selectedConf/date)), Text distance(/me, /selectedConf) km, Gauge(/selectedConf/remaining, /selectedConf/capacity), Button "Reservieren" action reserve { id: { path: '/selectedConf/id' } } ] ]`. Version `v0.9`, `component` field, flat component list, `child` vs `children`, fresh `surfaceId` per answer, `catalogId` from the context, `updateComponents` before any `updateDataModel`.
  - Wiring rule — local first: if the user describes an interaction whose data is already present, wire it inside **one** surface (`selected` → a path, all detail views on sub-paths of it; `/selectedConf` is pre-set by the client to the first result). Never build a follow-up question for that. Only when the interaction needs new data or an agent decision → `Button` with `submitAnswer` and `{ path }` context (M3).
  - Path instead of literal for everything that can change or comes back.
  - Never copy data: `findConferences` results are mounted at `/filteredConfs` (derived views at `/byMonth`, `/byTopic`), the location at `/me` — bind, do not transcribe; dates and distances via `daysUntil`/`formatDate`/`distance` in the surface, not computed in text.
  - Exactly one client event `reserve { id: { path } }`; no other event names.
  - Vocabulary comes from the context (components + functions) and `me`; if vocabulary is missing, say what is missing, choose the best available representation, never invent component names.
- `eval/` at the repo root (Node, `tsx`, script `npm run eval`, not in CI): for each request × 5 runs drive the **real** server via `HttpAgent` (`@ag-ui/client`) with the same `tools[]` (from `src/app/agent/tools/*.definition.ts`) and `context[]` (from `catalogToContextEntry` over the `*.schema.ts` metadata plus a fixed `me` = Berlin); execute client tools locally (`findConferences` logic from `src/app/domain/`, `renderSurface` recorded, `messageWidget` recorded) and continue the run loop like the shell does. Requests:
  1. „Welche Angular-Konferenzen gibt es in den nächsten Monaten?"
  2. „Zeig sie auf einer Karte"
  3. „Wann ist die nächste in meiner Nähe? Wenn ich eine anklicke, will ich Details."
  (Request 4 „Reservier mir eine Karte" is a button click without a model call; its contract — the `reserve` button — is scored inside request 3. Requests 2 and 3 run as a conversation after request 1.)
- `eval/score.ts` (pure): A1 — exactly one `renderSurface`, a `Timeline` with `items: { path: '/filteredConfs' }`; A2 — a `Map` with `points: { path: '/filteredConfs' }` and `center: { path: '/me' }`; A3 — a `Map` with `selected: { path: P }`, a `Text` bound to `P/name`, a `Gauge` bound to `P/remaining`, a `Button` whose action event is `reserve` with `id: { path: P + '/id' }`, and `daysUntil` and `distance` used in the surface. Any run fails if it writes `/filteredConfs` or `/me` via `updateDataModel` or if an `updateDataModel` value contains a date literal (`\d{4}-\d{2}-\d{2}`) — the replay-freshness risk.
- `eval/run-eval.ts` prints the per-request summary to stdout (`k/5`, failure reasons, duration per run) and exits 0 iff every request scores ≥ 4/5. Provider/model come from `agent/src/config.ts` with `AGENT_PROVIDER`/`AGENT_MODEL` env overrides, so pointing a run at another model stays one variable. The numbers go into the task log, not into a generated file.
- `src/app/a2ui/catalog-context.ts` must build the context entry without Angular, so shell and harness share one serializer (XC-04): `@a2ui/angular/v0_9` does not load in Node ("partially compiled library"), while the framework-free `@a2ui/web_core/v0_9/basic_catalog` exports the same `BASIC_COMPONENTS`/`BASIC_FUNCTIONS` names for deduplication. The component metadata (`*_META`) and the catalog functions are already Node-importable; only the `@a2ui/angular` route through `assistant-catalog.ts` is not.
- Prompt iteration is expected inside this task: run, sharpen examples, re-run. Record the go/no-go decision on the wiring risk in the task log (options if the gate fails: prompt examples, model switch; a follow-up question via `submitAnswer` is the fallback path, not the goal).
- `agent/` unit test for the prompt assembly (mirrors the book's `addCustomCatalogInstructions`).

**Acceptance**

- T9-AC-01 — (Node) prompt assembly with a catalog context entry lists every component and function name from the entry under a "Custom Catalog" section; without a catalog entry it emits a "no custom vocabulary available" note.
- T9-AC-02 — (Node) the scorer, fed recorded `renderSurface` args, passes A3 for the wired surface above and fails it when `selected` is a literal, when `/filteredConfs` is written via `updateDataModel`, or when a date literal appears in a data-model value.
- T9-AC-03 — `npm run eval` against the development model prints a per-request summary and each of requests 1–3 scores ≥ 4/5 (spec acceptance 1, the "Verdrahtung" risk); the task log records the numbers. If the gate is not reached, the task log records the prompt variants tried and the decision.

**Key Locations**

- `agent/src/prompt.ts`, `agent/src/agent.ts`
- `eval/run-eval.ts` (runner + client tools), `eval/score.ts` (pure), `eval/tsconfig.json`, `eval/vitest.config.ts`
- root `package.json` (`eval` + `test:eval` scripts, `tsx`)
- changed for Node-importability: `src/app/a2ui/catalog-context.ts` and its call site `src/app/chat/chat.page.ts`
- reused: `src/app/agent/tools/*.definition.ts`, `src/app/capabilities/**/*.schema.ts`, `src/app/domain/find-conferences.ts`

**Key Discoveries**

- The model sees exactly three things: system prompt, message list, tool definitions. `context[]` becomes system-prompt text; tool results come back as strings and the prompt relays `result` when `ok: false`.
- Known model failure modes the prompt must counter: literals instead of `{ path }`, copying tool data into `updateDataModel`, building a follow-up question instead of a local binding, inventing component names.
- `followUp: false` appends a terminal hint to `renderSurface`'s description; the model must not expect a tool result before ending the turn.
- Development model: Claude Sonnet 5 (`claude-sonnet-5`); cross-check with a cheap OpenAI model; DeepSeek as third provider without promises.

## Cross-Cutting Acceptance

- **XC-01** — Request 3 in the running app: a marker click changes name, countdown, distance and gauge with zero network requests (spec acceptance 2). **Touches:** T5, T6, T7, T9.
- **XC-02** — Request 4: "Reservieren" lowers the gauge with no agent run; the store keeps the reservation and a later `findConferences` reflects it (spec acceptance 3). **Touches:** T6, T8. *(Completes in the M3 scope — T8 moved there, spec v3.3.)*
- **XC-03** — The model never writes `/filteredConfs` or `/me`: guard (T6), prompt rule (T9) and eval check (T9) agree on the same reserved paths. **Touches:** T6, T9.
- **XC-04** — Shell and eval harness build `tools[]` and `context[]` (components + functions + `me`) from the same framework-free definitions and serializer; no drift. **Touches:** T4, T6, T7, T9.
- **XC-05** — `src/app/capabilities/**` contains no import from `src/app/domain/**` or `src/app/agent/**` (vocabulary stays domain-neutral so M2/M3 can move it into remotes unchanged). **Touches:** T4, T5.
