# Task 3.5: Slider distance filter in mfe-maps, call-shaped bindings, the zero fix

### Task

A `Slider` filters a `Map` without a model call: `filterWithinKm` joins the maps vocabulary as a
catalog function, `binding()` accepts a function call as the third form of every custom prop (so
the processor lets a call on `Map.points` through to the renderer), the announced schemas show all
three forms inline, and `@a2ui/angular`'s basic `Text` is patched so that a bound 0 renders "0".

### Status

DONE — implementation and task-local verification complete: `npm run test:shell` 25 files / 167
tests (before: 25 / 159), `npm run test:maps` 6 / 26 (before: 5 / 16), `npm run test:charts`
6 / 46, `npm run test:eval` 4 / 30, ESLint, `sheriff verify`, `tsc -p tsconfig.app.json` and
Prettier on the changed files clean; the plan's quick functional check was driven with Playwright
against the user's running dev servers. Independent review: a Codex quick review found no defects
and named two blind spots, both recorded as deferred in Key Decisions (no code change); the
Playground surface was then extended with a Timeline on the same call (user request).

### Files Modified

- `shared/capabilities/binding.ts` (modified) — `functionCallSchema` (`call`, `args` record,
  optional `returnType` enum), the shape of web_core's `FunctionCallSchema` defined locally on
  `zod/v3`; `binding()` is the three-way union literal | `{ path }` | `{ call }`.
- `projects/mfe-maps/src/maps/filter-within-km.fn.ts` (new) — `filterWithinKmFn`: the points
  whose haversine distance to `center` is at most `maxKm`, input order, extra fields pass
  through; `returnType: 'array'`; the description tells the model to bind it to `Map.points`
  over `/filteredConfs`, `/me` and the path a Slider writes, and to initialise that path.
- `projects/mfe-maps/src/maps/filter-within-km.fn.spec.ts` (new) — inside / edge / just
  beyond / radius 0 in the user's city / empty / pass-through / registration.
- `projects/mfe-maps/src/maps/vocabulary.ts` (modified) — `functions: [distanceFn,
  filterWithinKmFn]`.
- `projects/mfe-maps/src/maps/map.schema.spec.ts` (new) — the binding spec: a call passes every
  custom prop of `mapSchema`, with and without `returnType`; a malformed literal, a call without
  `args`, a bad `returnType` and an unknown shape still fail on `points`.
- `projects/mfe-maps/src/maps/map.component.ts` (modified) — `showMarkers` fits the view only for
  the first set or when the new bounds leave the current view (`inView`); a shrinking set keeps
  the viewport.
- `projects/mfe-maps/src/maps/map.component.spec.ts` (modified) — the fit rule pinned (shrink
  keeps zoom and centre; a far point re-fits and every marker is in view).
- `src/app/a2ui/catalog-context.ts` (modified) — `toJsonSchema` serializes with
  `$refStrategy: 'none'`; comment explains the dangling `$ref`.
- `src/app/a2ui/catalog-context.spec.ts` (modified) — every `binding()` prop of Gauge, Timeline
  and Map announces a `path` and a `call`/`args`/`returnType` alternative; `filterWithinKm`
  announced as `array`.
- `src/app/a2ui/renderer-integration.spec.ts` (modified) — `provideOfflineMap()` in the TestBed;
  Slider + Map + `filterWithinKm` through the real renderer (data-model write and the Slider's own
  `input` event change the marker count, `fetch` never called); two Texts bound to 0 (by path and
  through `distance` Berlin→Berlin) render "0".
- `src/app/agent/tools/render-surface.tool.spec.ts` (modified) — one case: a `filterWithinKm`
  call on `Map.points` passes the tool (`ok: true`); a `{ ref }` prop is refused with code
  `catalog` and no surface is left behind.
- `src/app/playground/playground.ts` + `.html` (modified) — third static surface "Distance
  filter": Slider 0–800 on `/filter/maxKm` (initial 300), a Text showing the value, a Timeline
  whose `items` and a Map whose `points` are the same `filterWithinKm` call over the nine Angular
  conferences, Berlin as `/me`; the Timeline's `range` is pinned to today … last conference.
- `src/theme/a2ui.css` (modified) — `--a2ui-slider-thumb-color: var(--cf-rail)`,
  `--a2ui-slider-track-color: var(--cf-line)`.
- `package.json` (modified) — `patch-package` devDependency; `postinstall` runs it first.
- `package-lock.json` (modified) — `patch-package@8.0.1` and its dependencies.
- `patches/@a2ui+angular+0.10.5.patch` (new) — the `TextComponent` line in both v0_9 bundles,
  header names the upstream fix.
- `eval/model-context.spec.ts` (modified) — the exact maps function list now includes
  `filterWithinKm`.
- `docs/improvements.md` (modified) — the Distance-0 entry's open question closed with the
  patch-package note; one promoted entry: drop the patch once a release carries a2ui#2604.

### Files Read (Context Only)

- `docs/work/m3-reserve-maps-hosting/plan.md` (preamble, Task 3.5), `task-log/task-3-*.md`,
  `task-log/docs-demo-variation-decisions.md`, `task-log/task-1-*.md` and `task-2-*.md` (grep),
  `docs/work/m2-nf-split/task-log/task-4-charts-remote.md` (the zod-sharing incident),
  `docs/improvements.md`, `docs/how-it-works.md` and `docs/architecture.md` (grep),
  `docs/spec.md` §8b.1 (grep).
- `shared/capabilities/{catalog-function,custom-component,agent-capability,action-schema}.ts`,
  `projects/mfe-maps/src/maps/{distance.fn,distance.fn.spec,geo,map.schema,map-resources,
  map-markers}.ts`, `projects/mfe-maps/src/{capability.ts,app/maps-catalog.ts,app/app.ts,
  testing/offline-map.ts,testing/bound-property.ts}`, `projects/mfe-charts/src/charts/*.schema.ts`.
- `src/app/a2ui/{provide-a2ui-catalog,agent-capabilities.token,surface-host-rules}.ts`,
  `src/app/agent/tools/render-surface.tool.ts`, `src/app/domain/find-conferences.ts`,
  `src/app/app.routes.ts`, `eval/scenarios.ts`, `eval/scenarios.spec.ts`, `sheriff.config.ts`,
  `tsconfig.spec.json`, `projects/mfe-maps/tsconfig.spec.json`, `angular.json`,
  `vitest-base.config.ts`, `federation.config.mjs`, `shared/theme/tokens.css`.
- `node_modules/@a2ui/web_core/src/v0_9/{schema/common-types.js,processing/message-processor.js,
  rendering/data-context.js,catalog/types.js,basic_catalog/components/basic_components.js}`,
  `node_modules/@a2ui/angular/{package.json,CHANGELOG.md,fesm2022/a2ui-angular-src-v0_9.mjs,
  fesm2022/a2ui-angular-v0_9.mjs}` (`TextComponent`, `SliderComponent`, `bind`),
  `node_modules/@a2ui/markdown-it/src/*.js`,
  `node_modules/@angular/build/src/builders/unit-test/runners/vitest/plugins.js`.
- Upstream a2ui repository (GitHub API and raw): `renderers/angular/CHANGELOG.md`,
  `renderers/angular/src/v0_9/catalog/basic/text.component.ts`, commit list of that file.

### Key Decisions

- **`filterWithinKm`, not `withinKm` (user).** The basic catalog's names read as an operation
  (`formatDate`, `add`) or a test (`contains`, `greater_than`); `withinKm` reads as a test that
  returns a boolean, the verb says a subset comes back. Plan deviation, recorded below; spec
  §8b.1 is Task 6's.
- **Why `binding()` at all (user asked).** The filter mechanism is A2UI's: the Angular binder
  resolves every prop through `DataContext.resolveSignal`, which re-evaluates a `{ call }` in an
  `effect` whenever an argument path changes, and the catalog invoker parses the arguments with
  the function's zod schema and calls `execute`. The one blocker was the processor's
  `componentApi.schema.safeParse` on every custom prop: `binding()` knew literal and `{ path }`
  only, so a call on `Map.points` failed with `points: Invalid input` before the renderer saw
  it (probe run against the old schema). The basic catalog's props already carry web_core's
  `Dynamic*Schema` with `FunctionCallSchema` inside; a custom component would normally import
  those, which the zod-universe bridge forbids (root `zod/v3` vs the packages' nested zod 3; the
  m2 task-4 `k._parse is not a function` incident is the runtime proof). `binding()` is our
  replacement for `Dynamic*Schema` and now matches it.
- **The call shape is defined locally on `zod/v3`, never imported from web_core.** Same reason.
- **`returnType` optional, no `'boolean'` default (user approved).** web_core defaults it to
  `'boolean'`; a default would be announced in the JSON schema and mislead on an array call.
  The processor only validates the shape and never reads it.
- **`maxKm` strict (user approved).** web_core parses function arguments with the schema; an
  unwritten slider path is an `EXPRESSION_ERROR` and an empty map. The description tells the
  model to initialise the path with `updateDataModel`; a tolerant variant (undefined → all
  points) was not built.
- **Binding spec lives in `projects/mfe-maps/src/maps/map.schema.spec.ts` (user approved).**
  `ng test shell` includes `src/**/*.spec.ts` only; a spec under `shared/` runs nowhere, and the
  plan's case is the Map schema's.
- **Announced schemas write every alternative out (`$refStrategy: 'none'`).** With the default
  strategy `Gauge.max` was already announced as
  `{"anyOf":[{"type":"number"},{"$ref":"#/properties/value/anyOf/1"}, …]}`, a pointer relative to
  the component schema that dangles once nested into the payload; the call alternative would
  have added a second `$ref` per prop, and the spec's "every custom prop shows the call" could
  not be met. Measured cost: the context entry grows from 10 613 to about 13 900 characters
  (about 800 tokens per live request; the replay demo pays nothing). The eval gate (Task 4)
  measures the effect on the model.
- **The patch covers two bundles.** `@a2ui/angular/v0_9` resolves to
  `fesm2022/a2ui-angular-v0_9.mjs`, a full second copy of the code beside the plan's
  `a2ui-angular-src-v0_9.mjs` (`@a2ui/angular/src/v0_9`); found because the renderer spec kept
  rendering '' after the first patch and vitest's optimized dep showed the bundled file name.
- **The patched line is upstream's own fix.** a2ui-project/a2ui#2604 (commit c7b6dfc, on main
  after 0.10.7, unreleased) changed the line to `?.value()?.toString() ?? ''`; the patch carries
  that form rather than the plan's `?? ''` so it drops out cleanly with the next release. The
  shell's markdown provider already coerces with `String()`, so body-variant Texts render `0`
  as `<p>0</p>`.
- **Fit only when the new set leaves the view (plan's alternative taken).** The playground
  screenshots showed the viewport snapping between three cities at 300 km and all of central
  Europe at 800 km; with `duration: 0` every threshold crossing while dragging would snap. Rule:
  the first set always fits; afterwards `fitBounds` runs only when the new bounds are not inside
  `map.getBounds()`. A shrinking set keeps the zoom, so pulling the slider down never zooms into
  one city. `resize` and selection-out-of-view fits are unchanged. Consequence: a later tool
  result with a small set far inside the current view stays zoomed out until a selection or
  resize.
- **Slider colours** `--cf-rail` (thumb, and Chromium's filled track portion) and `--cf-line`
  (track) kept after the first render.
- **Register entry closed here (user approved).** The plan block names `docs/improvements.md`
  as a key location and says the task closes the Distance-0 question; the fix-lane log had
  scheduled it for Task 6.
- **AC-02 at the tool boundary (user approved):** one case in the existing render tool spec
  rather than a new file.
- **`render-surface.tool.spec.ts` keeps its pre-existing Prettier warning.** `prettier --write`
  had reformatted seven unrelated hunks; the file was restored to HEAD and only the new case
  re-applied, so the diff is the 34 added lines.
- **Session-local sandbox lessons (not code):** the npm cache is read-only in the sandbox
  (`npm_config_cache=$TMPDIR/npm-cache` for `npm install` and `npx patch-package`); the tsx CLI
  needs an IPC pipe under `/tmp` (`node --import tsx file.ts` works instead); vitest's optimized
  deps under `node_modules/.vite/vitest/<hash>` are keyed by lockfile and config, not by package
  content, so a patched package needs that directory removed — `rm -rf` was denied, the two
  directories were moved aside (see Open Issues).

— session 2026-09-28, after the Codex quick review

- **Timeline on the same call in the playground (user asked whether it works).** `Timeline.items`
  is a `binding()` prop like `Map.points`, so the processor accepts the call and the Timeline gets
  the filtered array with `date`/`name` passed through. Without `range` the axis would rescale
  to the remaining items on every slider step, so the surface pins `range` to today … the last
  of the nine conferences and the dots appear in place. Note for probes: the Timeline renders
  rail and board, both carry `.cf-marker`, so a count is twice the item count.
- **Deferred finding: Codex quick review — the model may not initialise `/filter/maxKm`, leaving
  the map empty — to Task 4:** only a live model call shows it, and Task 4's eval gate plus the
  badge-2 fallback rule exist for exactly that. If the eval shows the omission, the preferred
  remedy is a render-tool rule (a Slider path without an `updateDataModel` in the same request
  is refused with a correction hint, like the fixed-selection rule), not a tolerant `maxKm`: the
  rule turns a silent empty map into a correction run and keeps the recording honest.
- **Deferred finding: Codex quick review — the "0" on the running dev system is unverified —
  manual check, no code:** the renderer spec runs the same path (real renderer, patched `Text`,
  the shell's markdown provider); what remains is the dev server re-optimising its deps after
  the restart, expected since the cache is keyed by the changed lockfile. Check: slider to 0 in
  the playground, the Text reads "0". If not, `npm run clean`.

- **Ownership rule recorded, not built (user).** The question "can a team ship a handler with
  its endpoint, or only components and functions?" came up after the slider; answer for this
  repo: remotes render and compute, the shell reacts, because the reserve effect crosses owners.
  The rule and the reader-facing version go to the docs via the register (see Open Issues).

### Review Focus

- **Behavior claims:** (1) A surface with a `Slider` on a path and a `Map` whose `points` is a
  `filterWithinKm` call over `/filteredConfs`, `/me` and that path passes the processor and the
  render tool, and moving the slider (through the data model or the input itself) adds or removes
  markers with no request leaving the browser; the map re-fits only when a marker would fall
  outside the view. (2) Every `binding()` prop accepts literal, `{ path }` and `{ call }`, and
  the serialized catalog context shows all three inline on every such prop; a malformed prop is
  still refused. (3) A basic `Text` bound to 0, by path or through a function, renders "0".
- **Plan deviations:** `withinKm` → `filterWithinKm` (file `filter-within-km.fn.ts`) → the name
  read as a boolean test. Binding spec "a `binding` spec" → `map.schema.spec.ts` in mfe-maps →
  the shell's spec include. `?? ''` → upstream's `?.toString() ?? ''` → the patch mirrors the
  released fix to come. Patch on `…-src-v0_9.mjs:823` → both v0_9 bundles → the app imports
  `@a2ui/angular/v0_9`, which is the other file. "Check whether the map re-fitting … is
  acceptable; if it jumps, fit only when the new set leaves the current bounds" → it jumped,
  the alternative is implemented and pinned by a spec. Not in the plan: `$refStrategy: 'none'`
  in `catalog-context.ts` (announced schemas for all custom props change beyond the added
  alternative); `eval/model-context.spec.ts` updated for the exact function list.
- **Assumptions / choices:** `returnType` optional without default; `maxKm` strict; the model
  will initialise `/filter/maxKm` (Task 4 measures); the context growth of about 3.3 k
  characters is acceptable; a small set far inside the view stays zoomed out.
- **Scope notes:** the Distance-0 register entry is closed in this task; the playground's filter
  surface carries a Timeline beyond the plan's Slider + Text + Map (user request, same call);
  `tmp/task-3.5/` holds the Playwright probe and screenshots (gitignored, not part of the
  change); two moved-aside vitest cache directories under `node_modules/.vite/` remain to be
  deleted by the user.
- **Read next:** `shared/capabilities/binding.ts` — the whole contract change is the union;
  `projects/mfe-maps/src/maps/map.component.ts` `showMarkers` / `inView` — the new fit rule;
  `src/app/a2ui/catalog-context.ts` `toJsonSchema` — the announced-schema strategy and its cost.

### Test Evidence

- Final code, sandboxed ChromiumHeadless: `npm run test:shell` — `Test Files 25 passed (25)`,
  `Tests 167 passed (167)`; new cases `renderer-integration.spec` "T3.5-AC-01 the slider path
  drives the Map through filterWithinKm; no request leaves the browser" and "T3.5-AC-03 a basic
  Text bound to the number 0 renders "0", by path and by call", `catalog-context.spec`
  "T3.5-AC-02 announces path and call as alternatives on every bound custom prop",
  `render-surface.tool.spec` "T3.5-AC-02 accepts a filterWithinKm call on Map.points and still
  rejects a malformed prop". The render tool spec was re-run alone after its formatting was
  restored (`--include`, 27 tests green; content unchanged).
- `npx ng test mfe-maps` — `6 passed (6)`, `26 passed (26)`: `filter-within-km.fn.spec` (6),
  `map.schema.spec` (3), `map.component.spec` "T3.5-AC-01 a shrinking set keeps the viewport; a
  set that leaves it re-fits" (+1). `npx ng test mfe-charts` — `6 passed`, `46 passed` (the
  shared `binding()` change). `npm run test:eval` — `4 passed`, `30 passed` (imports
  `vocabulary.ts` under Node; `model-context.spec` lists `filterWithinKm`). Agent suite not run:
  nothing under `agent/` changed.
- `npx eslint` over `shared/capabilities`, `projects/mfe-maps/src`, `src/app/a2ui`,
  `src/app/playground`, the render tool spec: clean. `npx tsc -p tsconfig.app.json --noEmit`:
  clean. `npx sheriff verify`: all projects validated. `npx prettier --check` over the changed
  files: clean, except the pre-existing warnings on `render-surface.tool.spec.ts` and
  `map.schema.ts` (both untouched in formatting).
- Patch round trip: the line reverted in `node_modules`, `npx patch-package` (what `postinstall`
  runs) — `@a2ui/angular@0.10.5 ✔`, line 823 of both bundles carries `?.toString() ?? ''`; the
  patch file has two `diff --git` sections and the explanatory header.
- Schema probe before the change (`node --import tsx`, `mapSchema.safeParse` with a call on
  `points`): `points: Invalid input`. After: accepted (map.schema.spec). Announced-schema probe:
  `Gauge.max` with the default strategy `{"$ref":"#/properties/value/anyOf/1"}`; with `'none'`
  every prop inline; context 10 613 → about 13 900 characters.
- Quick functional check, Playwright against the user's running dev servers
  (`tmp/task-3.5/playground-probe.mjs`, screenshots `filter-300.png`, `filter-800.png`,
  `filter-0.png`): `/playground` — slider 300, Text "300", 3 markers (ng-forge-berlin,
  ng-loft-hamburg, ng-lantern-leipzig), zoom 5.41; slider 800 → 9 markers, zoom 3.53; slider 0
  → 1 marker, zoom 3.53 (kept); slider 150 → 2 markers, zoom 3.53 (kept); external hosts
  `tiles.openfreemap.org` only; 0 requests to port 3001; no console errors. The Text at slider
  0 read "" on the running server because it still serves the vite deps cache from before the
  patch (lockfile change + patch → restart needed); the renderer spec covers the "0".
- The chat-with-key half of the plan's check (badge 2's question) was not run: it belongs to
  Task 4's prompt work and costs a model call.
- Probes are scripts in the gitignored `tmp/task-3.5/`; the two schema probes were one-off files
  in the project root, deleted in the same command.

— session 2026-09-28, after the Codex quick review

- Codex quick review (reported by the user): 43 targeted shell, 26 maps and 30 eval tests re-run,
  all green; no defects; two blind spots (see Key Decisions).
- After adding the Timeline to the playground surface: `npx eslint src/app/playground`,
  `npx tsc -p tsconfig.app.json --noEmit`, `npx prettier --check` on both files — clean. Probe
  re-run against the running shell (map markers / timeline `.cf-marker` elements, rail plus
  board): slider 300 → 3 / 6, zoom 5.41; 800 → 9 / 18, zoom 3.53; 0 → 1 / 2, zoom kept; 150 →
  2 / 4, zoom kept; tiles only, 0 requests to 3001, no console errors; screenshot
  `filter-300.png` shows the timeline axis Oct 2026 … Jun 2027 with three dots in place. The
  Text at slider 0 still read "" (dev server not restarted yet). No spec change: no playground
  spec exists and the renderer spec covers the call on `Map.points`.

### Acceptance Coverage

- `T3.5-AC-01` — passed — `renderer-integration.spec.ts` "T3.5-AC-01 the slider path drives the
  Map through filterWithinKm; no request leaves the browser" (`fetch` spy, data-model write and
  the Slider's `input` event); `map.component.spec.ts` "T3.5-AC-01 a shrinking set keeps the
  viewport; a set that leaves it re-fits"; browser probe as above.
- `T3.5-AC-02` — passed — `map.schema.spec.ts` (call accepted on every custom prop, malformed
  props refused); `render-surface.tool.spec.ts` "T3.5-AC-02 accepts a filterWithinKm call on
  Map.points and still rejects a malformed prop" (tool boundary and processor);
  `catalog-context.spec.ts` "T3.5-AC-02 announces path and call as alternatives on every bound
  custom prop".
- `T3.5-AC-03` — passed — `renderer-integration.spec.ts` "T3.5-AC-03 a basic Text bound to the
  number 0 renders "0", by path and by call".
- `T3.5-AC-04` — passed — `npm run test:eval` (`model-context.spec.ts` "T1-AC-01" lists
  `filterWithinKm` from `vocabulary.ts` under Node), `filter-within-km.fn.spec.ts` "is registered
  as an array-returning catalog function with a Slider hint"; `npm run lint:boundaries` clean;
  the maps standalone page's suite (`app.spec.ts`) green in `ng test mfe-maps`; every existing
  spec green.
- `XC-03`, `XC-04` — contributes; the cross-cutting checks are the plan's end-of-scope gate.

### Open Issues

- `docs/spec.md` §8b.1 still describes `mfe-filter` and `withinKm`; the function is
  `filterWithinKm` inside `mfe-maps` (→ Task 6, on both sides of the copy).
- `docs/architecture.md` / `docs/how-it-works.md` do not mention the `patches/` directory,
  `postinstall` running `patch-package`, or that the announced schemas are written without
  `$ref` (→ Task 6; the install step is also README material, publication scope).
- The running dev servers must be restarted (`npm run start`): lockfile change and the patched
  package; until then the running shell renders a bound 0 as empty. Two cache directories moved
  aside in this session are to be deleted by the user:
  `node_modules/.vite/vitest-stale-before-text-patch`, `node_modules/.vite/vitest-stale-2`.
- Promoted: drop `patches/@a2ui+angular+0.10.5.patch` and the `postinstall` prefix once an
  `@a2ui/angular` release carries a2ui#2604 (→ improvements register).
- Promoted: document who owns what across the federation boundary — rendering and computing in
  remotes, reacting shell-only today, the conditions under which remotes could ship handlers
  (→ improvements register; `architecture.md` "Layers and ownership" and `how-it-works.md`
  after "What happens on a click", Task 6 or later).

### Context for Next Task

- Interfaces: `binding(schema)` = `z.union([schema, { path }, { call, args, returnType? }])`;
  `filterWithinKmFn` (`name: 'filterWithinKm'`, `returnType: 'array'`, args `points`
  (lat/lon objects, passthrough), `center` (lat/lon), `maxKm` (non-negative number)) exported
  from `projects/mfe-maps/src/maps/filter-within-km.fn.ts`, announced by `mapsVocabulary`.
- Task 4 (capture): badge 2's surface shape is `Column [Slider(value → /filter/maxKm, min 0,
  max 800), Map(points ← filterWithinKm(points /filteredConfs, center /me, maxKm
  /filter/maxKm), center /me)]` plus `updateDataModel /filter/maxKm` before render; the
  playground's `filterMessages()` is the reference. `/filter` is not client-owned, so the model
  may write it. The announced context is about 3.3 k characters larger than before; run the
  eval gate on the new strings before the capture.
- Specs: a TestBed that renders a `Map` through the real renderer needs `provideOfflineMap()`
  from `projects/mfe-maps/src/testing/offline-map.ts` (sheriff ignores specs); count markers
  with `.cf-marker`; drive the Slider with `input.value = …` plus an `input` event.
- Gotcha: `@a2ui/angular/v0_9` and `@a2ui/angular/src/v0_9` are two full bundles; a package
  patch must hit both. After patching a package, move or delete `node_modules/.vite/vitest`
  or the optimized dep of the old code is served; after a lockfile change restart the dev
  servers.
- The dev servers (4200–4202, 3001) were running throughout and were not restarted.

### Git State

```
$ git diff --stat
 docs/improvements.md                             |   4 +++-
 eval/model-context.spec.ts                       |   2 +-
 package-lock.json                                | 302 +++++++++++++++++++++++
 package.json                                     |   3 +-
 projects/mfe-maps/src/maps/map.component.spec.ts |  24 ++
 projects/mfe-maps/src/maps/map.component.ts      |  11 +-
 projects/mfe-maps/src/maps/vocabulary.ts         |   3 +-
 shared/capabilities/binding.ts                   |  20 +-
 src/app/a2ui/catalog-context.spec.ts             |  23 ++
 src/app/a2ui/catalog-context.ts                  |  11 +-
 src/app/a2ui/renderer-integration.spec.ts        | 152 +++++++++++-
 src/app/agent/tools/render-surface.tool.spec.ts  |  34 +++
 src/app/playground/playground.html               |  11 +
 src/app/playground/playground.ts                 |  75 +++++-
 src/theme/a2ui.css                               |   2 +
 15 files changed, 665 insertions(+), 12 deletions(-)

$ git status --short   (sandbox mask entries such as .bashrc, .claude/ omitted)
 M docs/improvements.md
 M eval/model-context.spec.ts
 M package-lock.json
 M package.json
 M projects/mfe-maps/src/maps/map.component.spec.ts
 M projects/mfe-maps/src/maps/map.component.ts
 M projects/mfe-maps/src/maps/vocabulary.ts
 M shared/capabilities/binding.ts
 M src/app/a2ui/catalog-context.spec.ts
 M src/app/a2ui/catalog-context.ts
 M src/app/a2ui/renderer-integration.spec.ts
 M src/app/agent/tools/render-surface.tool.spec.ts
 M src/app/playground/playground.html
 M src/app/playground/playground.ts
 M src/theme/a2ui.css
?? docs/work/m3-reserve-maps-hosting/task-log/task-3.5-slider-filter-call-bindings-zero-fix.md
?? patches/
?? projects/mfe-maps/src/maps/filter-within-km.fn.spec.ts
?? projects/mfe-maps/src/maps/filter-within-km.fn.ts
?? projects/mfe-maps/src/maps/map.schema.spec.ts
```

### Sessions

- claude-code c08860eb-70a1-453a-8f87-71428c27551d (2026-09-28) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/c08860eb-70a1-453a-8f87-71428c27551d.jsonl
