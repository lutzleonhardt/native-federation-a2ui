# Task 4: Assistant catalog with `Gauge`, `daysUntil`, `distance`, and the vocabulary context entry

### Task

Built the A2UI catalog infrastructure under `src/app/a2ui/` (binding helper, component/function
factories, assistant catalog with dedupe, renderer provider with action bus, vocabulary context
entry), the first three vocabulary items (`Gauge` component, `daysUntil` and `distance` functions),
and the `boundProperty` test fake — preceded by the planned transport probe (browser half of the
AG-UI seam) and accompanied by the `agent/requests.http` playground.

### Status

DONE — `npm run lint`, `npm test` (shell 45 in 11 files, agent 14) and `npm run build` each exit 0.
Six of seven acceptance criteria `passed`, T4-AC-07 `partial` (only the in-IDE click remains with
the user). Four mutation probes confirmed the AC tests catch the behaviors they guard. The plan was
amended twice during the sequencing discussion (Task 3.5 added, then reduced back into Task 4 as a
probe pre-step plus T4-AC-07) — both amendments approved by the user in-session.

### Files Modified

- `src/app/a2ui/binding.ts` (new) — `binding(schema)` = zod/v3 union `schema | { path }`; the one
  comment explains why catalog schemas stay on the v3 line.
- `src/app/a2ui/custom-component.ts` (new) — `ComponentMeta` (framework-free name/description/
  schema), `CustomComponent`, `createCustomComponent`. Canonical home of the **zod-universe bridge**
  comment (see Key Decisions); widens `component` to `Type<unknown>`.
- `src/app/a2ui/catalog-function.ts` (new) — `createCatalogFunction(api, execute)`: replaces
  web_core's `createFunctionImplementation` to add the prompt `description` and the second bridge
  cast.
- `src/app/a2ui/assistant-catalog.ts` (new) — `ASSISTANT_CATALOG_ID`, `AssistantFunction`,
  `CatalogFragment`, `mergeFragments` (first-wins dedupe, basic names reserved, `console.warn`),
  `createAssistantCatalog` (spreads `BASIC_FUNCTIONS` back in — `functions` *replaces* the basic
  list).
- `src/app/a2ui/action-bus.ts` (new) — `A2uiActionBus`, a plain listener registry (dispatch/
  subscribe-with-unsubscribe).
- `src/app/a2ui/provide-a2ui-catalog.ts` (new) — `provideA2uiCatalog(catalog)` via `provideA2Ui`
  factory; action handler forwards to the bus. (The plan's `ASSISTANT_CATALOG` token was built
  first and removed again — see Key Decisions, session 2026-09-09.)
- `src/app/a2ui/catalog-context.ts` (new) — `catalogToContextEntry(fragments)`: serializes the
  **custom** vocabulary (components and functions) as JSON Schema via `zod-to-json-schema`,
  `$schema` noise stripped.
- `src/app/capabilities/charts/gauge.schema.ts` (new) — `gaugeSchema` (`value`, `max`, `label?`),
  `GAUGE_META` with the "Restkarten" prompt description.
- `src/app/capabilities/charts/gauge.component.ts` (new) — OnPush SVG arc gauge; declares the four
  host inputs itself with an explicit `GaugeProps` interface (no `CatalogComponent` base — see Key
  Decisions). After the visual probe: explicit `:host` width + `svg { width: 100% }`, because a
  viewBox-only svg has no intrinsic size and collapsed to 0×0 in flex contexts.
- `src/app/capabilities/charts/days-until.fn.ts` (new) — pure `daysUntil(date, today?)`
  (Date.UTC over local calendar components) + `daysUntilFn` catalog function.
- `src/app/capabilities/maps/geo.ts` (new) — deliberate copy of the domain haversine; the comment
  names the M2 remote-cut rule as the reason.
- `src/app/capabilities/maps/distance.fn.ts` (new) — `distanceFn` (rounded km between two
  lat/lon points).
- `src/app/capabilities/charts/index.ts`, `src/app/capabilities/maps/index.ts` (new) — the two
  `CatalogFragment`s.
- `src/app/testing/bound-property.ts` (new) — `boundProperty(value)` fake with `WritableSignal` +
  `vi.fn()` (official helper returns a Jasmine spy).
- `src/app/app.config.ts` (modified) — provides
  `provideA2uiCatalog(createAssistantCatalog([chartsFragment, mapsFragment]))`.
- `vitest-base.config.ts` (modified) — `uuid` → `dist/esm-browser` alias (probe finding; comment at
  the alias holds the cause; exports map blocks subpath specifiers, hence the `package.json` path
  derivation).
- `package.json`, `package-lock.json` (modified) — `zod-to-json-schema ~3.25.2` as direct
  dependency (was hoisted-only via `@a2ui/web_core` — the Task 1 `supports-color` lesson, applied
  preventively).
- `agent/requests.http` (new) — JetBrains HTTP Client playground: valid run (SSE), 400, 404, CORS
  preflight; comment documents dummy-key behavior (T4-AC-07).
- `README.md` (modified) — pointer to `agent/requests.http`; link to `docs/architecture.md`.
- `docs/architecture.md` (new, session 2026-09-09) — system overview with two Mermaid diagrams
  (big picture with implemented-vs-planned styling, AG-UI run sequence), a layers-and-ownership
  table (which package owns which layer, AG-UI vs. A2UI, the bypassed CopilotKit `render_a2ui`
  path) and the invariants list; user-requested scope addition.
- `docs/work/m1-spike/plan.md` (modified) — Task 4 block gained the probe pre-step, the
  `requests.http` deliverable and T4-AC-07; the interim `Task 3.5` block was added and removed
  again within this session (both on user instruction).
- Specs (new): `a2ui/assistant-catalog.spec.ts`, `a2ui/catalog-context.spec.ts`,
  `a2ui/renderer-integration.spec.ts`, `capabilities/charts/gauge.component.spec.ts`,
  `capabilities/charts/days-until.fn.spec.ts`, `capabilities/maps/distance.fn.spec.ts`.

Created and removed again during the task (see Test Evidence): `agent/src/probe-server.ts`,
`src/app/agent-transport.probe.spec.ts`, failure-screenshot directories.

### Files Read (Context Only)

- `docs/work/m1-spike/plan.md` — preamble + Task 4 block; additionally the Task 5–7 blocks and all
  three prior task logs, read **deliberately outside the isolation rule** for the user's
  plan-sequencing question (documented in-session before reading).
- `node_modules/@a2ui/web_core/src/v0_9/**` — `catalog/types.d.ts` (ComponentApi has **no**
  `description`; `createFunctionImplementation` is a plain object builder), `schema/common-types.d.ts`
  (Dynamic* unions, ActionSchema), `schema/server-to-client.d.ts` (message shapes:
  `updateDataModel { surfaceId, path?, value? }`), `basic_catalog/functions/basic_functions.js`
  (25 function names incl. `formatDate`).
- `node_modules/@a2ui/angular/**` — `types/a2ui-angular-src-v0_9.d.ts` (provider is `provideA2Ui`,
  `BoundProperty`, `BasicCatalogOptions`, selectors), testing d.ts (`setComponentProps`,
  Jasmine-typed `createBoundProperty`), fesm2022 bundle (`BasicCatalogBase` constructor:
  `functions ?? createBasicCatalogFunctions(...)`; host binds exactly four inputs), package.json
  exports (**root entry is v0_8** — everything imports from `@a2ui/angular/v0_9`).
- `node_modules/@ag-ui/client/dist/` — `index.d.ts` + minified `index.mjs`: `run()` =
  `runHttpRequest` + `transformHttpEventStream` only; `transformChunks`/`verifyEvents` sit in the
  `runAgent` pipeline; `AgentSubscriber` callback surface.
- `node_modules/zod-to-json-schema/dist/types/zodToJsonSchema.d.ts` — imports from `zod/v3`
  itself, so no cast is needed on our side of that call.
- `node_modules/uuid/package.json` — exports map with `node`/`browser` conditions; legacy
  `browser` field maps the exact file the runner mis-resolves.
- `agent/src/server.ts`, `server.spec.ts`, `agent.ts` — wire contract, mock-model pattern
  (`HELLO_CHUNKS`), CORS fixed to `SHELL_ORIGIN` (probe wrapped it).
- `src/app/domain/geo.ts` (haversine to copy), `src/app/domain/cities.ts` (Berlin/München
  coordinates), `src/app/app.spec.ts` (TestBed pattern), `vitest-base.config.ts`, `README.md`.

### Key Decisions

— session 2026-09-03

- **Transport probe instead of a permanent transport test.** The user first upgraded the probe idea
  to a lasting test (plan gained a Task 3.5), then agreed it proves fixed library behavior at
  pinned versions: a regression test would re-prove the same facts on every run while the seam is
  untouched until Task 7. Task 3.5 was removed; the probe became a Task 4 pre-step (findings below),
  the `.http` playground stayed as the lasting artifact (T4-AC-07). Escalation rule recorded in the
  plan: only a finding that contradicts the documented expectations makes a pinning test a Task 7
  deliverable — none did.
- **The uuid alias is real and permanent.** The probe's first run failed with
  `randomFillSync is not a function` from `uuid/dist/esm/rng.js` — `@ag-ui/client`'s `uuid@11`
  resolves through the exports map with the `node` condition active, so the Node build lands in the
  browser bundle (the legacy `browser` field the runner ignores maps exactly that file). Alias to
  `dist/esm-browser` in `vitest-base.config.ts`, mirroring the `supports-color` mechanism; the
  subpath is derived from the exported `package.json` because the exports map blocks dist
  specifiers. This closes the uuid question open since Task 1: **yes, the alias is needed.**
- **Chunk expansion is a `runAgent`-pipeline feature, not a wire or `run()` feature.** Measured:
  raw `HttpAgent.run()` delivers `TEXT_MESSAGE_CHUNK` unexpanded; `runAgent()` expands to
  `START/CONTENT/END` (subscriber callbacks fire in order) and assembles the assistant message.
  Task 2's open issue is answered more precisely than its comment claimed: clients that subscribe
  raw `run()` must handle chunks. (→ Task 7)
- **Haversine duplicated into `capabilities/maps/`, not imported from domain.** The Task 4 block
  contradicted the plan preamble (capabilities must not import `src/app/domain/` so the M2 NF cut
  stays mechanical). User decision: "Kopie, bis wir merken, es wird mehr." Both copies are pinned
  to the measured Berlin–München 504.3 km by their specs, so divergence fails a test.
- **Explicit `GaugeProps` instead of the plan's `ContextFromSchema`, and exactly two zod-universe
  bridge casts.** The first implementation (schemas typed against the a2ui packages' zod, catalog
  component extending `CatalogComponent<Api>`) drove `tsc` into a 4 GB heap OOM: the repo holds
  three zod type universes (root `zod/v3` plus nested `zod@3.25.76` copies in `@a2ui/web_core` and
  `@a2ui/angular`), and the generics forced structural comparisons between them. Fix: components
  declare their four host inputs themselves with an explicit props interface (which the repo's type
  guidelines prefer anyway), and every zod value crossing into a2ui-typed code passes through one of
  two documented casts (`createCustomComponent`, `createCatalogFunction`). Typecheck went from OOM
  to 1.5 s. The invariant comment lives once, in `custom-component.ts`.
- **`createCatalogFunction` replaces direct `createFunctionImplementation` use.** web_core's
  factory is a plain object builder and `FunctionImplementation` carries no `description` — but the
  context entry needs one per function. Own factory adds it and hosts the second bridge cast.
- **Own `ComponentMeta` type because `ComponentApi` has no `description` field.** The model-facing
  metadata (name/description/schema) stays framework-free next to each component
  (`gauge.schema.ts`), per plan; the Angular class joins only in the fragment index.
- **Context entry serializes the custom fragments only, but functions included.** The entry is
  described as "A2UI Custom Catalog"; basic components are protocol knowledge. Functions go in
  deliberately (deviation from the book) — the model only uses `daysUntil`/`distance` if it knows
  they exist. Serialization via `zod-to-json-schema` (zod 4's `z.toJSONSchema` rejects v3 schemas);
  its own typings import `zod/v3`, so that call needs no bridge.
- **Dedupe is first-wins with basic names reserved.** `BasicCatalogBase` builds its map with
  extras appended, so a name collision would silently *override* a basic component; `mergeFragments`
  drops the collider and warns instead. Same rule across fragments.
- **`provideA2Ui` is the real provider name** (plan said `provideA2uiRenderer`); it accepts a
  factory, so the action handler can `inject()` the bus. All imports go through
  `@a2ui/angular/v0_9` — the package's root entry is v0_8.
- **Action bus is a plain listener registry**, not a Subject or signal: actions are events, not
  state; RxJS stays at the AG-UI boundary per the repo conventions.
- **`daysUntil(date, today = new Date())` — the explicit parameter is the fixed clock.** No fake
  timers in the browser runner; the catalog `execute` uses the default. Same `Date.UTC`-over-local-
  components arithmetic as Task 3's `isoDatePlusDays` (independent implementation, import banned).
- **Selector `app-gauge`** — repo eslint prefix rule; a distinct capabilities prefix would be new
  convention surface for zero current gain.

— session 2026-09-09

- **`docs/architecture.md` added on user request** (big-picture Mermaid flowchart with
  implemented-vs-planned styling, run sequence diagram, layers-and-ownership table, invariants
  list), linked from the README — corrects the user's hand sketch on three points: POST body vs
  SSE response direction, loopback binding, and the client-side `HttpAgent` layer.
- **Visual probe found the gauge invisible: 0×0 svg.** The user asked where one could actually
  *see* the gauge — nowhere: the app renders no surface until Task 6/7, and every spec asserts
  `textContent`, which exists without layout. A temporary screenshot probe showed a blank page;
  geometry measurement revealed `svg` at computed 0×0 (`:host` had only `max-width`, and a
  viewBox-only svg has no intrinsic size, so host and svg collapse inside flex rows — exactly the
  context the renderer's `Row` will provide). Fix: explicit `:host { width: 12rem }` +
  `svg { display: block; width: 100% }`; the CSS comment holds the invariant. A permanent
  regression test now asserts real bounding-box size in a flex container (verified by a reverting
  probe: old CSS back → exactly that test fails). Lesson recorded deliberately: content assertions
  prove existence, not visibility — each new visual primitive (Timeline, Map) needs one geometry
  assertion. (→ Task 5)
- **Codex review triaged against the showcase yardstick** ("test rigor follows what the demo
  shows live and what silently lies"): its MEDIUM finding — `daysUntil` accepted any string, so
  `"2026-02-30"` silently became March 2 and `"not-a-date"` NaN — is exactly the
  plausibly-wrong-on-stage class and was fixed: ISO regex + calendar round-trip refine in the
  schema, two invoker-level regression tests. Verified beforehand in web_core source: the catalog
  invoker parses args with `fn.schema.parse` (closing this log's open issue), and
  `evaluateFunctionReactive` degrades a validation failure to `undefined` instead of breaking the
  surface — so the schema is the right place to harden. Deliberately **not** done: range checks on
  `distance` lat/lon (values come from bindings onto our own data) and any error-feedback loop to
  the model (catalog functions run at render time, outside the tool-result path). The review's two
  blind spots (function calls through the Angular renderer; renderer→bus action chain) are routed
  to Task 5, where their first real consumers appear — not duplicated now.
- **`ASSISTANT_CATALOG` token dropped (plan deviation, user-approved).** The plan's Task 4 block
  asked for the token alongside `provideA2Ui`, but it has zero consumers: Task 6's handler goes
  through `A2uiRendererService`, and Task 7's context entry consumes the *fragments* (they carry
  the descriptions; the built `AngularCatalog` does not) — the catalog would be the wrong artifact
  even for the planned reader. If Task 7 wants one source of truth for the composition, a plain
  exported `ASSISTANT_FRAGMENTS` constant beats a DI token. `provideA2uiCatalog` now returns
  `provideA2Ui(...)` directly; its remaining substance is the action-bus wiring.

### Review Focus

- **Behavior claims:**
  1. `createAssistantCatalog` yields a catalog with all 18 basic components plus `Gauge` and all
     25 basic functions plus `daysUntil`/`distance` under the assistant id; name collisions warn
     and keep the first registration (basic names win over fragments).
  2. A `Gauge` whose `value`/`max` bind `/conf/*` paths renders through the real
     `A2uiRendererService` pipeline and re-renders when the bound path changes — no component code
     touches the renderer internals.
  3. `catalogToContextEntry` emits a JSON string carrying `catalogId`, per-component
     `description` + JSON-Schema `schema`, and per-function `description` + `args` + `returnType`.
- **Plan deviations:** `provideA2uiRenderer` → real name `provideA2Ui`; `ContextFromSchema` type
  machinery → explicit `GaugeProps` + `Type<unknown>` component param (zod-universe OOM, see Key
  Decisions); `createFunctionImplementation` → own `createCatalogFunction` (description +
  bridge cast); `haversineKm` import → local copy (preamble conflict, user-approved); `[...BASIC_FUNCTIONS]`
  spread kept as planned but dedupe extended to reserve basic *component* names too; the planned
  `ASSISTANT_CATALOG` token dropped as consumer-less (user-approved, see Key Decisions
  session 2026-09-09).
- **Assumptions / choices:** context entry covers custom fragments only; `binding()` is
  `literal | { path }` **without** the `{ call … }` branch the library's own Dynamic* unions have —
  a model emitting a function call as a `Gauge` prop fails validation (recorded as an open issue
  for Task 5); function args are validated by the catalog **invoker** (`fn.schema.parse`, verified
  in web_core source), so schema strictness is the whole story — `daysUntil` is hardened,
  `distance` deliberately is not.
- **Scope notes:** `vitest-base.config.ts` uuid alias currently has no committed consumer (the
  probe was removed; first real consumer is Task 7 — same accepted state as the `supports-color`
  alias); `docs/architecture.md` + README link (user-requested); plan.md Task-4 block amendments;
  `agent/requests.http` touches the agent workspace although Task 4 is otherwise shell-side.
- **Read next:**
  1. `src/app/a2ui/custom-component.ts` — the zod-universe bridge comment; the whole type strategy
     of this task hangs on that invariant.
  2. `src/app/a2ui/assistant-catalog.ts` — the `BASIC_FUNCTIONS` spread and `mergeFragments`; the
     two silent-failure modes (lost basics, overridden basics) both live here.
  3. `src/app/a2ui/renderer-integration.spec.ts` — the only place the real renderer contract is
     exercised; Task 5/6 build directly on this pattern.

### Test Evidence

— session 2026-09-03

```
$ npm run lint  → exit 0   ("All files pass linting")
$ npm test      # shell 42 passed (11 files), agent 14 passed (2 files)   → exit 0
$ npm run build → exit 0   (initial 479 kB, lazy markdown chunk)
```

**Transport probe (temporary, both files removed):** `agent/src/probe-server.ts` (real `createApp`
with two `MockLanguageModelV4` agents — hello-streaming `assistant`, throwing `broken` — behind a
CORS-widening fetch wrapper on 127.0.0.1:3210) + `src/app/agent-transport.probe.spec.ts` (real
`HttpAgent` in headless Chromium). Findings:

1. First run: all three tests failed at `new HttpAgent(...)` with
   `TypeError: randomFillSync is not a function` via `uuid/dist/esm/rng.js` → uuid alias added,
   suite green. The constraint comment lives at the alias.
2. Raw `run()` delivered `RUN_STARTED, TEXT_MESSAGE_CHUNK ×2, RUN_FINISHED` — chunks **not**
   expanded; the initial expansion assertion was inverted into a pin of the raw form.
3. `runAgent()` fired `onTextMessageStart/Content/EndEvent` in order and assembled the assistant
   message `"hello from the mock model"`; the `broken` agent ended in a terminal `RUN_ERROR`
   carrying the upstream message, observable settled.

**requests.http verified via curl** against `npm run start` with the dummy-key `.env`: valid run →
SSE `RUN_STARTED` then `RUN_ERROR ("invalid x-api-key")`; invalid body → 400; unknown agent → 404;
preflight → 204 with `access-control-allow-origin: http://localhost:4200`. The in-IDE click is the
remaining T4-AC-07 manual check (user).

**Type-explosion measurement:** first implementation OOM'd `tsc -p tsconfig.app.json` at the 4 GB
default heap (~100 s, `Ineffective mark-compacts near heap limit`); after the explicit-props +
two-casts fix the same command completes in ~1.5 s. The Angular build worker failed identically
before the fix (`ERR_WORKER_OUT_OF_MEMORY`).

**Mutation probes — four defects introduced, each reverted, final suite green:**

| Mutation | Caught by |
|---|---|
| `BASIC_FUNCTIONS` spread removed from `createAssistantCatalog` | T4-AC-04 keeps-the-basic-functions |
| dedupe removed from `mergeFragments` | both T4-AC-04 collision tests (2 failures) |
| Gauge reads `raw` instead of the value signal | T4-AC-01 + both T4-AC-06 tests (3 failures) |
| `functions: {}` in the context entry | T4-AC-05 daysUntil + distance tests (2 failures) |

**Sandbox findings (for future sessions):** sandboxed processes cannot reach host-localhost ports —
the probe server and every test run against it ran unsandboxed; and the `tsx` CLI fails in-sandbox
on its IPC socket (`EPERM: listen`, known since Task 2) — `node --import tsx` avoids the CLI's IPC
but not the port isolation.

**Temporary probes — all removed, none remain in the tree:** the two probe files above and the
failure-screenshot directories (`src/app/**/__screenshots__/`, `.vitest-attachments/`) from the
red probe runs.

— session 2026-09-09

```
$ npm run lint  → exit 0
$ npm test      # shell 43 passed (11 files), agent 14 passed (2 files)   → exit 0
$ npm run build → exit 0
```

**Visual probe (temporary, removed):** `src/app/gauge-preview.probe.spec.ts` rendered three gauges
and captured a `page.screenshot` from headless Chromium. First shots were blank; a geometry dump
via `commands.writeFile` (`gauge-rects.json`, also removed) measured `svg` at computed 0×0 — the
zero-size finding above. After the CSS fix the screenshot shows three correctly filled arcs
(12/500, 250/500, 480/500 with labels); image handed to the user. The new
`gauge.component.spec.ts::occupies real size inside a flex container` was verified by a reverting
probe: old CSS restored → exactly that test fails (1/44), fix restored → suite green. Shell suite
grew 42 → 43 tests.

**Codex-review date fix, verified at the real seam:** `days-until.fn.spec.ts` now drives the
catalog invoker directly — `{ date: 'not-a-date' }` and `{ date: '2026-02-30' }` both throw
`Validation failed for function 'daysUntil'`, a valid date still returns an integer. Before the
schema hardening the same invoker calls returned `NaN` and the silently rolled-over March-2 value
(reproduced by the review). Shell suite 43 → 45 tests; lint and build green.

### Acceptance Coverage

- **T4-AC-01** — passed. `gauge.component.spec.ts::T4-AC-01 renders value and max into the SVG and
  re-renders when value changes` (12/100 → `value.set(50)` → "50"); a second test covers label and
  proportional arc fill.
- **T4-AC-02** — passed. `days-until.fn.spec.ts`: `today + 42 days` (2026-01-01 → 2026-02-12) = 42,
  past date = −7, today = 0; fixed clock via the explicit `today` parameter.
- **T4-AC-03** — passed. `distance.fn.spec.ts::T4-AC-03` — Berlin–München via `distanceFn.execute`
  is an integer within 504 ± 5; the haversine copy itself is pinned to 504.3 km.
- **T4-AC-04** — passed. `assistant-catalog.spec.ts`: all `BASIC_COMPONENTS` names + `Gauge` under
  `ASSISTANT_CATALOG_ID`; `formatDate` + `daysUntil` + `distance`; duplicate across fragments warns
  once and keeps the first; collision with a basic name warns and keeps the basic component.
- **T4-AC-05** — passed. `catalog-context.spec.ts`: JSON carries `catalogId`,
  `components.Gauge.schema` with `value`/`max` properties, `functions.daysUntil` with args schema
  and `returnType: "number"`; `$schema` stripped.
- **T4-AC-06** — passed. `renderer-integration.spec.ts`: real `A2uiRendererService`,
  `createSurface` (assistant id) + `updateComponents` (Gauge bound to `/conf/remaining`,
  `/conf/capacity`) + `updateDataModel` renders 12/100/Restkarten; a second test pins re-rendering
  on a later `updateDataModel` to `/conf/remaining`.
- **T4-AC-07** — partial. `agent/requests.http` exists with the four requests, README references
  it, and all four were verified via curl against the running agent (see Test Evidence). The AC's
  manual check "streams SSE **in the IDE**" is still open — it needs the user's JetBrains IDE.

### Open Issues

- **`binding()` rejects function-call props.** The library's own Dynamic* unions accept
  `literal | { path } | { call … }`; our union stops at `{ path }` per plan text. A model that puts
  `daysUntil(...)` directly into a custom-component prop fails `updateComponents` validation.
  Decide with the `Timeline`/`Map` schemas whether the plan's narrow union is the wanted contract
  or the third branch joins `binding()`. (→ Task 5)
- **Function calls through the Angular renderer are untested** (`Text` bound to
  `daysUntil(...)`/`distance(...)` → rendered value → reactivity). The invoker itself is verified
  (parses args, soft-degrades failures) and Codex's core probe confirmed reactivity; only the
  Angular binding layer remains, and Task 7's mock-agent surface exercises it permanently. Add the
  renderer-level check when `Timeline`/`Map` specs build the same machinery. (→ Task 5)
- **The renderer→`A2uiActionBus` action chain has no test** (dispatch on surface action,
  subscriber delivery, unsubscribe). Untestable in substance today — no component can emit an
  action yet; T5-AC-04 drives the first real action through the renderer, Task 8's `reserve`
  handler is the first subscriber. (→ Task 5/8)
- **The uuid alias has no committed consumer until the chat page lands.** Same accepted state as
  the `supports-color` alias; the comment at the alias documents the cause. First real consumer
  re-arms the coverage. (→ Task 7)
- **T4-AC-07's in-IDE SSE check is outstanding** — user-side manual step; everything scriptable is
  verified. (user, before or after `/commit 4`)

### Context for Next Task

- **Signatures** (all framework-free unless noted):
  - `binding(schema)` → zod/v3 union `schema | { path: string }`.
  - `ComponentMeta { name, description, schema }`;
    `createCustomComponent({ ...meta, component: Type<unknown> }): CustomComponent`.
  - `createCatalogFunction({ name, description, returnType, schema }, execute): AssistantFunction`.
  - `CatalogFragment { components, functions }`; `mergeFragments(fragments, { warn })`;
    `createAssistantCatalog(fragments): BasicCatalogBase`; `ASSISTANT_CATALOG_ID`.
  - `provideA2uiCatalog(catalog)` (Angular); `A2uiActionBus { dispatch, subscribe → unsubscribe }`.
    No catalog token exists — if Task 7 needs the composition twice (catalog + context entry),
    share a plain `ASSISTANT_FRAGMENTS` constant instead.
  - `catalogToContextEntry(fragments): Context` (`{ description, value }`, value = JSON string).
  - `boundProperty(value)` → `{ value: WritableSignal, raw, onUpdate: vi.fn() }`
    (`src/app/testing/bound-property.ts`).
- **Component contract for Timeline/Map:** declare the four host inputs yourself
  (`props`/`surfaceId`/`componentId`/`dataContextPath`) with an explicit `XxxProps` interface of
  `BoundProperty<T>` fields. Do **not** extend `CatalogComponent` or use `ComponentApiToProps` —
  that generic re-opens the zod-universe comparison that OOM'd tsc. A suddenly slow `tsc` is the
  canary.
- **zod rules:** catalog schemas import from `zod/v3`; exactly two bridge casts exist
  (`createCustomComponent`, `createCatalogFunction`) — route new crossings through them, never
  compare the universes elsewhere. `zod-to-json-schema` is same-universe (its typings import
  `zod/v3`).
- **Renderer specifics:** import from `@a2ui/angular/v0_9` (the package root is v0_8!);
  surface selector `a2ui-v09-surface [surfaceId]`; `EnvironmentProviders` work directly in
  TestBed `providers`; the TestBed pattern for real-renderer tests is in
  `renderer-integration.spec.ts`. `ActionSchema` for Task 5's `action` props comes from
  `@a2ui/web_core/v0_9`; dispatched actions arrive at `A2uiActionBus`.
- **Message shapes:** `updateDataModel` is `{ surfaceId, path?, value? }` (not `contents`);
  `updateComponents` components are passthrough objects validated per-component against the
  catalog schema at process time.
- **Transport facts for Task 7:** raw `HttpAgent.run()` yields wire chunks; expansion + message
  assembly happen in `runAgent()`; a failed run ends in a terminal client-visible `RUN_ERROR`;
  the uuid alias in `vitest-base.config.ts` is load-bearing for any spec importing
  `@ag-ui/client`.
- **Sandbox gotchas:** host-localhost ports are unreachable from sandboxed commands (probe server
  and its test runs must run unsandboxed); `tsx` CLI needs `node --import tsx` in-sandbox, and
  port isolation still applies.

### Git State

```
$ git diff --stat
 README.md                  |  6 ++++++
 docs/work/m1-spike/plan.md | 14 ++++++++++++++
 package-lock.json          |  3 ++-
 package.json               |  3 ++-
 src/app/app.config.ts      |  5 +++++
 vitest-base.config.ts      | 14 ++++++++++++++
 6 files changed, 43 insertions(+), 2 deletions(-)

$ git status --short        # repo files only; sandbox device nodes omitted
 M README.md
 M docs/work/m1-spike/plan.md
 M package-lock.json
 M package.json
 M src/app/app.config.ts
 M vitest-base.config.ts
?? agent/requests.http
?? docs/architecture.md
?? src/app/a2ui/
?? src/app/capabilities/
?? src/app/testing/
```

### Sessions

- claude-code ff775d73-41ed-445d-8c70-e96e5c3476ab (2026-09-09) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/ff775d73-41ed-445d-8c70-e96e5c3476ab.jsonl
