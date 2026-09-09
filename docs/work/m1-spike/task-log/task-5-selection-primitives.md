# Task 5: Selection primitives `Timeline` and `Map` that write the whole element

### Task

Built the two selection primitives as pure-SVG catalog components — `Timeline` (markers ordered by
date) and `Map` (equirectangular scatter with gridlines and a distinct center marker) — whose click
writes the complete clicked object to the `selected` binding and optionally dispatches an action
mirroring the basic `Button`; plus the user-approved plan amendment: a `/playground` dev route that
renders both (and Task 4's `Gauge`) through the real renderer over real conference data.

### Status

DONE — `npm run lint`, `npm test` (shell 59 in 13 files, agent 14) and `npm run build` each exit 0.
All five acceptance criteria `passed`. Five mutation probes confirmed the AC tests catch the
behaviors they guard. A visual screenshot probe verified the playground actually renders (and led
to one axis-padding fix). A Codex review (2 hotspots + 2 blind spots accepted, 1 hotspot resolved
as user-local) was absorbed in-session: marker declutter, a hardened AC-05 assertion, and three
new tests.

### Files Modified

- `src/app/capabilities/charts/timeline.schema.ts` (new) — `timelineSchema` (items with
  passthrough, optional `range`/`selected`/`action`) + `TIMELINE_META` prompt description.
- `src/app/capabilities/charts/timeline.component.ts` (new) — OnPush SVG axis; markers sorted by
  date, alternating label rows, selected highlight via `.cf-selected`; click → whole item +
  optional dispatch. Axis padding 40 (edge labels clipped at 16 — visual-probe finding).
- `src/app/capabilities/charts/timeline.component.spec.ts` (new) — T5-AC-01/02, highlight test,
  explicit-range + degenerate-equal-bounds tests, geometry assertion, T5-AC-04 (real renderer,
  timeline half), T5-AC-02 literal-`selected` through the real renderer (data model unchanged
  after click).
- `src/app/capabilities/maps/map.schema.ts` (new) — `mapSchema` + `MAP_META` prompt description.
- `src/app/capabilities/maps/map.component.ts` (new) — equirectangular projection (cos-mid-lat,
  uniform scale, min-span guard), degree gridlines, labelled points, red-cross center marker,
  selected highlight; click → whole point + optional dispatch. `declutter` spreads markers whose
  projected positions coincide (same-city conferences) so each stays clickable (review fix).
- `src/app/capabilities/maps/map.component.spec.ts` (new) — T5-AC-03, coincident-marker declutter
  test, no-center/no-selected test, geometry assertion, T5-AC-04 (map half), T5-AC-05 (end-to-end
  selection; asserts the `a2ui-v09-text` element before/after plus the written `/conf` data-model
  value, `fetch` spy).
- `src/app/capabilities/shared/surface-action.ts` (new) — `dispatchSurfaceAction`: the Button
  dispatch mirror (`DataContext.resolveAction` + `surface.dispatchAction`), renderer service
  resolved lazily via `Injector` (see Key Decisions).
- `src/app/a2ui/action-schema.ts` (new) — reverse zod-universe bridge: web_core's `ActionSchema`
  re-typed into our `zod/v3` universe for embedding in catalog schemas.
- `src/app/a2ui/provide-a2ui-catalog.ts` (modified) — now `makeEnvironmentProviders([provideA2Ui,
  provideMarkdownRenderer()])`; the basic `Text` injects `MarkdownRenderer` unconditionally.
- `src/app/capabilities/charts/index.ts`, `src/app/capabilities/maps/index.ts` (modified) —
  register `Timeline` / `Map` in the fragments.
- `src/app/playground/playground.ts` (new) — dev showcase (plan amendment): hand-built surface via
  `processMessages` (Column → Timeline, Map, Gauge + Text details), conferences ≤ 300 km around
  Berlin on `/confs`, Berlin on `/me`, first conference pre-set on `/conf`, action log fed by
  `A2uiActionBus`.
- `src/app/app.routes.ts` (modified) — lazy `/playground` route.
- `docs/work/m1-spike/plan.md` (modified) — Task-5 block gained the playground amendment bullet +
  key location (user-approved 2026-09-09).
- `docs/improvements.md` (new) — improvements register; first entry promoted from this task.
- `src/app/capabilities/charts/timeline.component.html`, `maps/map.component.html`,
  `playground/playground.html`, `charts/gauge.component.html` (new) — templates extracted from the
  inline strings on user request ("no inline templates"); the `.ts` files switched to
  `templateUrl`. Gauge is a Task-4 file, touched only for this style alignment.
- `playground-preview.png` (untracked, throwaway) — screenshot handed to the user; **not** part of
  the commit.

**Not task 5:** `package.json` carries an uncommitted `start:shell` port change 4200 → 4300 that
this session did not make (presumably user-local). It contradicts the plan preamble ("shell 4200")
and the agent's fixed CORS `SHELL_ORIGIN` — user decision needed before `/commit 5`.

### Files Read (Context Only)

- `docs/work/m1-spike/plan.md` — preamble + Task 5 block; `task-log/task-4-assistant-catalog.md`
  (predecessor, full); `task-log/task-3-conference-domain.md` lines ~220–250 (data-set geography,
  equirectangular-vs-haversine error measurement — fixture grounding for Map).
- `node_modules/@a2ui/angular/fesm2022/a2ui-angular-v0_9.mjs` — `ButtonComponent.handleClick`
  (the dispatch mechanism to mirror), `BasicCatalogComponent.surface` (just
  `rendererService.surfaceGroup.getSurface`), `provideMarkdownRenderer`; types d.ts for
  `surfaceGroup` typing.
- `node_modules/@a2ui/web_core/src/v0_9/` — `schema/common-types.d.ts` (`ActionSchema`,
  `ChildListSchema`: static child list is a plain string array), `rendering/data-context.d.ts`
  (`resolveAction`), `state/surface-model.d.ts` (`dispatchAction`), `schema/client-to-server.d.ts`
  (`A2uiClientAction` = name/surfaceId/sourceComponentId/timestamp/context), `index.d.ts` exports.
- Shell sources: `a2ui/renderer-integration.spec.ts` (real-renderer TestBed pattern),
  `gauge.component.ts|schema|spec` (component + fake-test pattern), `binding.ts`,
  `custom-component.ts` (bridge invariant), `provide-a2ui-catalog.ts`, `action-bus.ts`,
  `testing/bound-property.ts`, `app.config.ts`, `app.ts`/`app.routes.ts`/`app.html`,
  `domain/conference.ts`, `domain/find-conferences.ts` + `.schema.ts`.

### Key Decisions

— session 2026-09-09

- **Playground route added as a user-approved plan amendment.** The user flagged that nothing in
  M1 is visible before Task 7 ("Das war kacke geschnitten") — the Task-4 gauge was already invisible
  until a probe found it 0×0. Option A (permanent minimal dev page) beat repeated screenshot probes
  (static, per-task effort) and waiting for Task 7. Lives in the shell (`src/app/playground/`), not
  under `capabilities/`, so the M2 remote-cut rule is untouched.
- **Action dispatch mirrors `Button` through public API only.** Verified in the fesm2022 bundle:
  `Button` does `new DataContext(surface, dataContextPath).resolveAction(action)` then
  `surface.dispatchAction(resolved, componentId)`; `surface` comes from
  `A2uiRendererService.surfaceGroup.getSurface(surfaceId)`. All three pieces are public exports —
  no base class needed. Centralized in `capabilities/shared/surface-action.ts` because the
  mechanism-mirror invariant should live once; the plan's `shared/` was reserved for SVG scale
  helpers, but Timeline (time→x) and Map (lat/lon→x/y) share no scale code — the dispatch is the
  code they actually share.
- **Renderer service resolved lazily via `Injector`.** Eager `inject(A2uiRendererService)` broke
  every prop-fake test with NG0201: constructing the service requires the `provideA2Ui` config
  token. `injector.get(...)` runs only inside `pick()` when an `action` prop is present — exactly
  the real-renderer case. The invariant comment lives in `surface-action.ts`.
- **`provideMarkdownRenderer()` folded into `provideA2uiCatalog`.** T5-AC-05 crashed with NG0201:
  the basic `Text` injects `MarkdownRenderer` unconditionally and `provideA2Ui` does not provide
  it. Any surface with the basic catalog can contain `Text` (playground does), so the provider
  belongs in our one catalog-provider function, not in individual specs.
- **Reverse zod bridge cast (`a2ui/action-schema.ts`) — the third universe crossing.** The `action`
  prop must validate against web_core's real `ActionSchema`, but embedding their zod object in our
  `zod/v3` `z.object()` would re-open the structural comparison that OOM'd tsc in Task 4. One
  `as unknown as z.ZodTypeAny` cast, documented, pointing at the canonical bridge comment.
- **`binding()` stays the narrow union (`literal | { path }`)** — closes Task 4's open decision.
  `items`/`points`/`selected` flow through paths in every current demo request; the `{ call }`
  branch has no consumer (YAGNI). Proposed in the briefing, unopposed. Revisit in Task 7 if the
  agent prompt wants function-call props.
- **Schema requires `label`, runtime falls back `label ?? name ?? id`.** Path-bound data bypasses
  schema validation (only the `{ path }` marker is validated at `updateComponents` time), and the
  conference objects on `/confs` carry `name`, not `label`. The schema documents the model-facing
  contract per plan; the fallback makes real data render. T5-AC-05 exercises the `name` fallback.
- **Timeline axis padding 40, not 16.** The screenshot probe showed middle-anchored edge labels
  clipped by the viewBox ("ng-forge Berlin" → "forge Berlin"). Constant carries the comment.
- **Map projection: cos-corrected equirectangular, uniform scale, 0.5° min-span guard.** Task 3's
  measurement (0.2 % error at data-set scale) confirms the simple form is visually fine; uniform
  scale preserves aspect; the guard keeps a single point from dividing by zero. Gridlines pick the
  first degree step from {0.5,1,2,5,10,20} that yields ≤ 8 lines.
- **Selected highlight is a CSS class (`.cf-selected`) on both components** — the plan required it
  only for Timeline; Map gets it for symmetry at near-zero cost, and tests assert the class, not
  styling.

— session 2026-09-09 (Codex review absorbed)

- **Coincident markers: declutter in projected space, not data jitter.** Codex found (and probed)
  that same-city conferences share exact coordinates (4 pairs in the data set) and only the
  top-most marker of a stack receives clicks. The user's first idea — spreading the data — fails
  on the numbers: the map projects at ~25 px/degree, so clickably distinct markers need ~0.45°
  ≈ 50 km separation; realistic venue jitter is sub-pixel, and 50 km jitter would distort the
  geography and risk the 300-km radius memberships (74 km measured margin). Fix instead:
  `declutter` groups markers by ~12 px projected cells and spreads each collision group radially
  by 9 px — deterministic, data-independent, ~20 lines. Labels of spread markers may still
  overlap (already promoted to the improvements register).
- **AC-05 assertion was satisfiable without a working binding (test bug).** `toContain` on the
  whole DOM matched the map's own marker label (the `name` fallback renders the same string).
  Now the test pins the empty→filled transition of the `a2ui-v09-text` element specifically and
  additionally asserts `dataModel.get('/conf')` — verified by a mutation probe that removing the
  `onUpdate` call fails exactly this test (plus AC-01/AC-03-family).
- **T5-AC-02's literal case needs the real renderer.** A literal `selected` only becomes a no-op
  `BoundProperty` through the ComponentBinder — a prop fake cannot honestly produce it. New test:
  markup with `selected: 'unbound'`, click → no throw, root data model deep-equals its pre-click
  state.
- **Port 4200 → 4300 resolved as user-local and temporary** (another app occupies 4200 on the
  user's machine). The change stays out of the task-5 commit and is not reverted; committed
  convention remains 4200. Consequence recorded for Task 7: `SHELL_ORIGIN` in `agent/src/server.ts`
  is a hard-coded const — when the shell first talks to the agent, either 4200 must be free or
  the origin becomes configurable.

### Review Focus

- **Behavior claims:**
  1. Clicking a Timeline/Map marker calls `selected.onUpdate` exactly once with the complete
     clicked object including passthrough fields; clicks without a bound `selected` (absent or
     literal) are safe no-ops; coincident map markers are spread so each is individually
     clickable.
  2. With an `action` prop, a click through the real renderer emits an `A2uiClientAction` with the
     path-resolved context into `A2uiActionBus` — the first real test of the renderer→bus chain
     (Task-4 open issue).
  3. A surface `Map(points ← /confs, selected → /conf)` + `Text(text ← /conf/name)` round-trips a
     click into a Text re-render with zero network calls.
- **Plan deviations:** playground route + `docs/improvements.md` (user-approved amendment /
  wrap-up promotion rule); `shared/` hosts the action dispatch instead of SVG scale helpers (no
  scale code is actually shared → why-line above); `provideMarkdownRenderer` added to
  `provideA2uiCatalog` (unplanned, forced by `Text`); third zod bridge cast in
  `a2ui/action-schema.ts` (plan's "two casts" rule extended, reverse direction); renderer service
  lazily injected instead of a `surface` computed (fake tests).
- **Assumptions / choices:** narrow `binding()` union kept (decision closed, see Key Decisions);
  runtime label fallback `label ?? name ?? id`; no label collision layout (promoted to
  improvements register); Map highlight added beyond plan text.
- **Scope notes:** `package.json` port change 4200 → 4300 is user-local and temporary (other app
  on 4200) — **exclude from the `/commit 5` staging list**, do not revert; `playground-preview.png`
  is a throwaway at repo root, not to be committed; plan.md Task-5 block amendment is part of this
  task's commit; `gauge.component.ts` (Task 4) is touched only by the user-requested
  template-extraction style pass (templates → dedicated `.html`, applies to all four components;
  spec-internal test hosts stay inline).
- **Read next:**
  1. `src/app/capabilities/shared/surface-action.ts` — the Button-mirror + lazy-injection
     invariants; everything action-related hangs on these 20 lines.
  2. `src/app/capabilities/maps/map.component.ts` — `createProjection`/`gridLines` are the only
     real geometry in the task.
  3. `src/app/capabilities/maps/map.component.spec.ts` (T5-AC-05) — the end-to-end selection
     proof Task 6/7 build on.

### Test Evidence

— session 2026-09-09

```
$ npm run lint  → exit 0   ("All files pass linting")
$ npm test      # shell 55 passed (13 files), agent 14 passed (2 files)   → exit 0
$ npm run build → exit 0   (lazy playground chunk 10.4 kB)
```

Shell suite grew 45 → 55: 5 Timeline tests, 7 Map tests (both files include their real-renderer
`describe`), minus none removed. Two intermediate failures drove design decisions (recorded above):
NG0201 `A2UI_RENDERER_CONFIG` in all fake tests (→ lazy injector) and NG0201 `MarkdownRenderer`
in T5-AC-05 (→ provider in `provideA2uiCatalog`).

**Mutation probes — three defects introduced, each reverted, final suite green:**

| Mutation | Caught by |
|---|---|
| Timeline `pick` writes `{ id }` instead of the whole item | T5-AC-01 (exactly this test, 1/55) |
| Map view drops the center marker | T5-AC-03 (exactly this test, 1/55) |
| `dispatchSurfaceAction` resolves but never dispatches | both T5-AC-04 tests (2/55) |

**Visual probe (temporary, removed):** `src/app/playground.probe.spec.ts` mounted the `Playground`
component with the real catalog providers in headless Chromium and captured `page.screenshot` →
`playground-preview.png` (repo root, kept for the user, untracked). First shot revealed clipped
timeline edge labels → axis padding 16 → 40 → second shot clean: full timeline with orange
selected marker, map with gridlines/labels/center cross, gauge 68/450, details row bound to
`/conf`. Probe file deleted; failure-screenshot directories (`__screenshots__/`) from the red runs
deleted. No probes remain in the tree.

— session 2026-09-09 (Codex review absorbed)

```
$ npm run lint  → exit 0
$ npm test      # shell 59 passed (13 files), agent 14 passed (2 files)   → exit 0
$ npm run build → exit 0
```

Review triage: hotspot 1 (coincident markers) and hotspot 2 (AC-05 assertion satisfiable via the
map label) accepted and fixed; hotspot 3 (port/CORS mismatch) resolved as user-local (see Key
Decisions); both blind spots (literal `selected`, explicit `range`) accepted — four new tests,
shell suite 55 → 59.

**Mutation probes — two more defects introduced, each reverted, final suite green:**

| Mutation | Caught by |
|---|---|
| `pick` no longer calls `selected.onUpdate` | T5-AC-05 (Codex's exact scenario — previously green, now red), T5-AC-03, declutter test (3 failures) |
| `declutter` removed from the view computed | spreads-coincident-markers test (exactly 1 failure) |

**Visual probe re-run (temporary, removed again):** fresh `playground-preview.png` shows the two
Berlin conferences spread left/right of the center cross, each with its own marker. Probe file and
failure screenshots deleted; no probes remain in the tree.

### Acceptance Coverage

- **T5-AC-01** — passed. `timeline.component.spec.ts::T5-AC-01` — 3 items given date-unsorted,
  labels render in date order; click on second marker → `onUpdate` exactly once with the whole
  item incl. `remaining`/`url`.
- **T5-AC-02** — passed. `timeline.component.spec.ts::T5-AC-02` — two tests: absent `selected`
  (fake; click does not throw) and literal `selected` through the real renderer (no throw, root
  data model unchanged — the binder-produced no-op `onUpdate`, review blind spot closed).
- **T5-AC-03** — passed. `map.component.spec.ts::T5-AC-03` — 3 markers, each `cx/cy` inside the
  400×260 viewBox, `.cf-center-mark` present with `center` set (absent without); click → whole
  point object. Extended by the coincident-marker declutter test (review hotspot 1).
- **T5-AC-04** — passed. Both spec files, `…through the real renderer::T5-AC-04` — real
  `A2uiRendererService`, action `pick` with `context.id = { path: '/x/id' }`; bus receives
  `A2uiClientAction { name: 'pick', surfaceId, context: { id: 'x-marks' } }`.
- **T5-AC-05** — passed. `map.component.spec.ts::T5-AC-05` — surface Column[Map, Text], click on
  marker 2 → the `a2ui-v09-text` element goes empty → "München Days" (also exercises the `name`
  label fallback) and `dataModel.get('/conf')` holds the clicked point; `fetch` spy never called.
  Assertion hardened after review hotspot 2 (previously satisfiable by the map's own label).

### Open Issues

- Function calls through the Angular renderer (`Text` bound to `daysUntil(...)`) remain untested —
  unchanged from Task 4; Task 7's mock-agent surface is the planned permanent home. (→ Task 7)
- Shell port: the user temporarily runs the shell on 4300 (another app on 4200); the uncommitted
  `package.json` change stays local and out of the task-5 commit. When the shell first talks to
  the agent, the hard-coded `SHELL_ORIGIN` const will reject 4300 — free the port or make the
  origin configurable then. (→ Task 7)
- Timeline items outside an explicit `range` render beyond the axis and are clipped by the SVG —
  accepted behavior; the schema description tells the model the range defaults to the item span.
- Promoted: Timeline/Map label collision layout for dense clusters (→ improvements register).

### Context for Next Task

- **New signatures:**
  - `dispatchSurfaceAction(injector, surfaceId, dataContextPath, componentId, action)` —
    `capabilities/shared/surface-action.ts`; resolves the renderer service lazily, silently
    returns when the surface is unknown.
  - `actionSchema` (`a2ui/action-schema.ts`) — web_core's `ActionSchema` typed for our universe;
    embed it directly in catalog schemas (`action: actionSchema.optional()`).
  - `TimelineItem`/`TimelineProps`, `MapPoint`/`MapCenter`/`MapProps` — exported from the
    components; `label` optional at runtime with `label ?? name ?? id` fallback.
- **`provideA2uiCatalog` now also provides `MarkdownRenderer`** — any TestBed that renders basic
  `Text` just needs that one provider call (see `map.component.spec.ts` T5-AC-05 for the pattern).
- **Surface markup facts:** static `children` is a plain string-array; `Text`'s prop is `text`;
  `A2uiClientAction` carries `name/surfaceId/sourceComponentId/timestamp/context`. Action context
  paths resolve against the component's data scope at dispatch time.
- **Playground (`/playground`) is the visual anchor** — Task 6's `renderSurface` tool and Task 7's
  chat page can be eyeballed there or extend it; it pre-sets `/confs`, `/me`, `/conf` exactly per
  the data-model conventions (client-mounted, never model-written).
- **Gotchas:** never eagerly `inject(A2uiRendererService)` in a catalog component (NG0201 without
  the provider config — fake tests have none); `@vitest/browser/context` is deprecated in favor of
  `vitest/browser` (warning seen during the probe; our committed specs don't import it);
  `page.screenshot({ path })` resolves relative to the spec file; the user's shell temporarily
  runs on port 4300 while `SHELL_ORIGIN` in `agent/src/server.ts` is a hard-coded 4200 const —
  relevant the moment the shell calls the agent.
- **Bus subscription pattern:** `TestBed.inject(A2uiActionBus).subscribe(spy)` after configuring
  providers — first real subscriber; Task 8's `reserve` handler follows this shape.

### Git State

```
$ git diff --stat
 docs/work/m1-spike/plan.md                     |  2 ++
 package.json                                   |  2 +-
 src/app/a2ui/provide-a2ui-catalog.ts           | 27 ++++++++++++++++----------
 src/app/app.routes.ts                          |  7 ++++++-
 src/app/capabilities/charts/gauge.component.ts | 19 +-----------------
 src/app/capabilities/charts/index.ts           |  7 ++++++-
 src/app/capabilities/maps/index.ts             |  5 ++++-
 7 files changed, 37 insertions(+), 32 deletions(-)

$ git status --short        # repo files only; sandbox dotfiles omitted
 M docs/work/m1-spike/plan.md
 M package.json              ← user-local port change, exclude from commit (see Open Issues)
 M src/app/a2ui/provide-a2ui-catalog.ts
 M src/app/app.routes.ts
 M src/app/capabilities/charts/gauge.component.ts
 M src/app/capabilities/charts/index.ts
 M src/app/capabilities/maps/index.ts
?? docs/improvements.md
?? playground-preview.png    ← throwaway, do not commit
?? src/app/a2ui/action-schema.ts
?? src/app/capabilities/charts/gauge.component.html
?? src/app/capabilities/charts/timeline.component.html
?? src/app/capabilities/charts/timeline.component.spec.ts
?? src/app/capabilities/charts/timeline.component.ts
?? src/app/capabilities/charts/timeline.schema.ts
?? src/app/capabilities/maps/map.component.html
?? src/app/capabilities/maps/map.component.spec.ts
?? src/app/capabilities/maps/map.component.ts
?? src/app/capabilities/maps/map.schema.ts
?? src/app/capabilities/shared/
?? src/app/playground/
```

### Sessions

- claude-code 1eb9060f-b9ab-49df-b65e-31b47ee0e814 (2026-09-09) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/1eb9060f-b9ab-49df-b65e-31b47ee0e814.jsonl
