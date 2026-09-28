# Task 2: MapLibre inside mfe-maps

### Task

The SVG scatter in `MapComponent` is replaced by a MapLibre map on OpenFreeMap's `positron`
vector tiles, recoloured to the Departure kit; the vocabulary contract (`map.schema.ts`,
`vocabulary.ts`, `distance`) is byte-identical, markers stay clickable DOM elements, labels move
into a symbol layer with measured collision avoidance, and every spec renders the real map
without a single network request.

### Status

DONE — implementation and task-local verification complete: `npm run test:maps` 4 files / 13
tests, `npm run test:shell` 21 / 135, `npm run test:charts` 6 / 46, `npm run test:eval` 4 / 30,
ESLint and `sheriff verify` clean, `ng build mfe-maps` (production) without budget warnings. The
plan's quick functional check was driven with Playwright against the user's running dev servers
(standalone page on 4202, federated playground on 4200 at 1280 px and 390 px); the screenshots
lie in `tmp/task-2/` (gitignored) for the user's own look. A Codex quick review (2026-09-28)
reported two findings and one blind spot; both findings are fixed below, the blind spot is
promoted to the register, and the user's own map check surfaced a third change (a selection made
in the timeline now brings the map back into view). Final state after the review pass: maps 16 /
16, shell 135 / 135, ESLint and `sheriff verify` clean.

### Files Modified

- `package.json`, `package-lock.json` (modified) — `maplibre-gl` 6.11.2 in `dependencies`
  (installed with `--ignore-scripts` so `postinstall` did not re-run Playwright and the agent
  install).
- `angular.json` (modified) — `mfe-maps` esbuild assets: `maplibre-gl-{worker,shared}.mjs` from
  `node_modules/maplibre-gl/dist` to `maplibre/`; production budget `anyComponentStyle`
  4 kB / 8 kB → 100 kB / 120 kB for this project only (MapLibre's stylesheet rides in the
  component stylesheet, see Key Decisions).
- `projects/mfe-maps/src/maps/map-style.ts` (new) — `BASEMAP` and `POINT_LABEL` (literal kit
  colours), `POSITRON_URL`, `recolour()` (paint by layer type and source layer), `bareStyle()`
  (fallback without cartography), `LABELS_SOURCE`, `DOT_BOX_IMAGE`/`dotBoxImage()`,
  `labelLayers()` (labels, dot reservations, user-location reservation).
- `projects/mfe-maps/src/maps/map-resources.ts` (new) — `MapResources` (`loadStyle`,
  `workerUrl`) and the `MAP_RESOURCES` token; root default fetches positron and recolours it,
  the worker URL is `maplibre/maplibre-gl-worker.mjs` relative to the chunk.
- `projects/mfe-maps/src/maps/map-markers.ts` (new) — `labelOf`, `pixelOffsets` (7 px radial
  spread for identical coordinates, over points and the user's location alike),
  `createPointMarker` (`.cf-marker[data-id]`, click and Enter/Space → pick), `createCenterMarker`
  (`.cf-center` with the city in mono type, takes its spread offset), `labelCollection` (GeoJSON
  for the label layers, with `kind` and `selected`).
- `projects/mfe-maps/src/maps/map.component.ts` (rewritten) — `ViewEncapsulation.None` with
  host class `cf-map`; `MapProps`/`MapPoint`/`MapCenter` unchanged; `createMap()` after the
  first render (worker URL, style via the seam, `style.load` → image, source, layers); one effect
  rebuilds markers and viewport on points/center, another applies the selection (ring class,
  label data, and a refit when the selected point is out of view); the instance is kept from
  construction on so an early destroy removes it; fit on MapLibre's `resize`; `pick()`
  unchanged. `createProjection`, `declutter`, `gridLines` are gone.
- `projects/mfe-maps/src/maps/map.component.html` (modified) — one container `div.cf-map-canvas`.
- `projects/mfe-maps/src/maps/map.component.css` (new) — imports `maplibre-gl.css` by relative
  path, `.cf-map` private `--cf-*` aliases with fallbacks, dot / selection ring / user marker
  (`pointer-events: none`) / attribution rules; the former inline `styles` are gone.
- `projects/mfe-maps/src/testing/offline-map.ts` (new) — `provideOfflineMap()`: an empty style
  and a stub worker (blob URL) behind `MAP_RESOURCES`, so specs run the real map with nothing to
  fetch; `OFFLINE_MAP` and `OFFLINE_STYLE` exported for specs that vary one resource.
- `projects/mfe-maps/src/maps/map.component.spec.ts` (modified) — HTML markers, offline map,
  `renderMap` waits for the markers; T2 cases (markers inside the canvas, user marker, whole
  point on click, ring follows the bound value, coincident spread, no fetch), the renderer cases
  keep their T5 names and gain the ring assertion; after the review: a conference at the user's
  location is hit by `elementFromPoint`, a selection from outside returns the panned-away map
  into view while a visible one leaves it alone, and an early destroy removes the map before
  its style has loaded.
- `projects/mfe-maps/src/maps/map-style.spec.ts` (new) — `recolour` rules on a positron cut,
  cartography untouched.
- `projects/mfe-maps/src/app/app.spec.ts` (modified) — offline map, `.cf-marker` / `.cf-center`,
  Campen found by `data-id` (labels are no longer DOM text).
- `src/app/chat/chat.page.spec.ts` (modified) — `renderChat` installs `provideOfflineMap()`;
  `markersOf` selects `a2ui-v09-surface app-map .cf-marker`.
- `docs/improvements.md` (modified) — register entry "Map label collision layout" ticked.

### Files Read (Context Only)

- `docs/work/m3-reserve-maps-hosting/plan.md` (preamble, Task 2), `task-log/task-1-*.md`,
  `docs/specs/visual-language.md` §8.3, `docs/improvements.md`.
- The fetched positron style (55 layers: types, source layers, paint keys, fonts
  `Noto Sans Regular/Bold`, `glyphs`, city labels anchored `bottom` with `circle_11_black`).
- `node_modules/maplibre-gl/dist/*` (worker spawn via `new URL('./maplibre-gl-worker.mjs',
  import.meta.url)`, `setWorkerUrl`, no default export, `MapLibreMap` alias, option and event
  names), `@types/geojson`.
- `node_modules/@angular/build`: `stylesheets/bundle-options.js` (the CSS bundler receives the
  JS `externalDependencies`), `builders/unit-test/runners/vitest/plugins.js` (build assets are
  served in tests), `application-code-bundle.js` (`import.meta.url` untouched in browser builds).
- `projects/mfe-maps/src/app/app.ts`, `app.config.ts`, `maps-catalog.ts`, `capability.ts`,
  `styles.css`, `federation.config.mjs`; `federation.config.mjs` (shell); `sheriff.config.ts`;
  `eslint.config.js`; `shared/theme/tokens.css`; `projects/mfe-charts/src/charts/gauge.component.css`
  (alias pattern); `src/app/agent/tools/message-widget.component.ts` (`None` precedent);
  `src/app/agent/tools/render-surface.tool.spec.ts`; `src/app/playground/playground.ts`;
  `src/app/domain/conferences.json` (four cities carry two conferences at identical coordinates).

### Key Decisions

- **`ViewEncapsulation.None`, every rule under `.cf-map` (user approved in the briefing).**
  MapLibre builds canvas, controls and markers itself; emulated attributes never reach them, and
  ShadowDom would hide `.cf-marker` from `querySelectorAll` in four specs and the a2ui host. The
  host carries `class="cf-map"` so the stylesheet needs no `:host`.
- **MapLibre's stylesheet ships with the component, not with the shell (user question).** The
  shell imports `./capability` and nothing else; it must not know which library a remote draws
  with, CSS and JS of MapLibre belong to one version, and the standalone page needs the same
  source. Price: the `anyComponentStyle` budget for `mfe-maps` (83 kB raw). The import is a
  relative path on purpose: the dev server passes every package name as an esbuild external to
  the CSS bundler too, so a bare `@import 'maplibre-gl/…'` was left for the browser and fetched as
  a 404 on the standalone dev page (found by the probe); the federated chunk and the production
  build had inlined it either way.
- **The worker is an asset of the remote.** MapLibre 6 spawns its worker from a file next to
  its own module (`maplibre-gl-worker.mjs`, importing `maplibre-gl-shared.mjs`), which no bundler
  copies. Both files are copied to `maplibre/` in the remote's output and the component calls
  `setWorkerUrl(new URL('maplibre/maplibre-gl-worker.mjs', import.meta.url).href)` — relative to
  the exposed chunk, which sits at the same root in the standalone and the federated build.
  Cross-origin (shell on 4200, remote on 4202) MapLibre wraps the URL in a blob module import;
  verified by 73 glyph and the tile requests reaching OpenFreeMap from the federated playground.
- **One seam, `MAP_RESOURCES`, carries style loader and worker URL** — both are what MapLibre
  loads from outside the bundle. The token's factory is synchronous and returns a loader
  function; the fetch happens per map at creation (user question). Specs replace it with
  `provideOfflineMap()`: an empty style (with a `glyphs` template only for the validator) and a
  stub worker that never answers, so no tile, GeoJSON or glyph request can be made. Headless
  Chromium offers WebGL2 through SwiftShader (probed before the briefing), so the specs run the
  real MapLibre map; no fake map exists.
- **The popup is dropped; the selection is the ink ring plus a bold label placed first.** The
  plan allowed dropping the popup if it fights the ring; it fought the labels instead: a DOM
  popup is invisible to MapLibre's collision index and covered the Berlin label at the first
  render. `text-font` and `symbol-sort-key` are data-driven on a `selected` feature property,
  so the selected label never yields.
- **HTML dots and the user's HTML label reserve their footprint in the collision index.** Both
  are DOM, so MapLibre placed labels under them (the Vienna dot over the Munich label). A
  transparent 16 px icon per point in a layer above the labels, and an invisible text of the same
  geometry as the mono city label for the user's location, are placed first (MapLibre places from
  the top layer down) and keep basemap labels and point labels clear; the basemap's own "Berlin"
  and "Hamburg" disappear next to the user marker as a side effect. First attempt with a 20 px box
  and a 1 em offset hid every label: box and text paddings (2 px each) overlapped at all four
  anchors; 16 px and 1.25 em leave 3 px.
- **Recolouring by paint key, not by layer id.** `background-color` → land; `fill-color` and
  `fill-outline-color` → water for the `water`/`waterway`/`water_name` source layers, land
  otherwise; `line-color` → water, border for `boundary`, road otherwise; `text-color` → label;
  `text-halo-color` → the ground under the label. Expression colours (positron's zoom-interpolated
  motorway greys) become literals — the cartography (layers, widths, filters, layout) stays.
- **Identical coordinates get a 7 px radial marker offset** — exact equality, since two
  conferences in one city share the same numbers; the spirit of the old `declutter` without a
  projected grid. Labels of such twins rely on the variable anchors.
- **Viewport and gestures.** Fit the bounds of points plus center with 40 px padding and
  `maxZoom` 9 whenever they change and on MapLibre's `resize` (MapLibre observes the container
  itself, so no own `ResizeObserver`). `cooperativeGestures` so the wheel scrolls the transcript;
  rotate and pitch disabled.
- **A failed style fetch falls back to `bareStyle()`** (land background, positron glyph
  endpoint) with a `console.warn`, so the markers still show offline.
- **Plan correction:** `render-surface.tool.spec.ts:118` counts `g.cf-marker` of a Timeline, not a
  map; nothing changed there. `chat.page.spec.ts` is the only shell spec that renders maps.
- **Tooling gotcha, not a code defect:** after the lockfile changed, the test runs re-optimised
  the vite deps cache that the user's running `ng serve mfe-maps` still served, and the standalone
  page threw `ngDevMode is not defined`. Only that server was affected and was restarted
  (detached, log in `tmp/task-2/serve-maps.log`); recorded in the agent's memory.
— session 2026-09-28 (Codex quick review, user's own check)

- **Fixed finding: the location marker swallowed clicks on a conference at the same coordinates
  (Codex, MEDIUM).** With the user in Berlin, `ng-forge Berlin` sat under the location marker,
  appended last and therefore on top; the specs' `dispatchEvent` never noticed. Two parts: the
  location joins the coincident spread (`pixelOffsets` over points plus center, the location is
  one slot on the circle, not its hub), so the conference dot stays visible beside it; and
  `.cf-center` is `pointer-events: none`, since the location is information, never a hit target.
  Verified by a real Playwright click on `ng-forge-berlin` in the federated playground (Playwright
  refuses clicks on intercepted targets), the spec asserts the hit with `elementFromPoint`.
- **Fixed finding: a component destroyed before `style.load` leaked its map (Codex, MEDIUM).**
  The user judged the trigger theoretical for this app (no route change while a surface renders)
  and took the fix anyway for its size: the instance is stored the moment it exists, `onDestroy`
  removes that instance, and the `style.load` callback returns when destroyed. Without
  `remove()` the worker pool is never released. Spec: a deferred style loader, destroy within the
  same macrotask after construction, the canvas is gone.
- **A selection made elsewhere must be in view (user's own check, supersedes "the selection never
  touches the viewport").** The user panned the map away and clicked timeline markers: the ring
  and the detail card followed, the viewport did not — reproduced with Playwright (`jumpTo` into
  the Atlantic, timeline click, center unchanged). One rule in `showSelection`: if the selected
  point is outside `map.getBounds()`, `fit()` restores the overview of all points plus center. A
  click on the map itself never moves it, its point is in view by definition. `panTo` at the
  current zoom was named and not taken: after a zoom into Berlin it would show Prague at street
  level without context.
- **Blind spot promoted, not closed: label placement has no spec.** Labels render only with an
  active worker and glyphs; a spec would need a local Noto Sans glyph fixture and
  `queryRenderedFeatures`. The register carries it. One claim in this log was softened on the
  way: the selected label is placed first among the labels but can still yield to the dot and
  location reservations when all four anchors collide.

### Review Focus

- **Behavior claims:** (1) A click (or Enter/Space) on `.cf-marker` writes the whole clicked
  point to the `selected` binding and dispatches the bound action, also for a conference at the
  user's own location; no request leaves the browser. (2) No point label is ever drawn under a
  dot or under the user's label, the selected label is bold and placed before every other label,
  overlapping labels are hidden by MapLibre. (3) A selection made outside the map (timeline)
  brings a panned-away map back to the overview; a selection already in view leaves the viewport
  alone. (4) Every spec that renders a Map runs the real MapLibre map with `provideOfflineMap()`;
  `fetch` is never called and the worker never answers, so no style, tile or glyph request
  exists; a component destroyed at any moment removes its map.
- **Plan deviations:** popup on selection → dropped, ring plus bold label → it covered other
  labels, see Key Decisions. Own `ResizeObserver` → MapLibre's `trackResize` plus a fit on
  `resize` → same effect, less code. Seam "injectable style source or map factory" →
  `MAP_RESOURCES` with style loader and worker URL → the worker is the second external resource.
  `render-surface.tool.spec.ts:118` listed as a map click → it is a Timeline → untouched.
  `styles.css` and `federation.config.mjs` listed as key locations → untouched (`shareAll`
  already shares `maplibre-gl`; verified in `remoteEntry.json`). New files beyond the plan's
  `map-style.ts`/`map.component.css`: `map-resources.ts`, `map-markers.ts`,
  `testing/offline-map.ts`, `map-style.spec.ts`. `angular.json` gained the worker assets and the
  budget, which the plan did not foresee.
- **Assumptions / choices:** the reservation box is 16 px for a 14 px dot; the compact attribution
  starts expanded and collapses on the first interaction (at 390 px it covers the map's bottom
  edge until then); point labels use literal ink/surface values inside the canvas like the
  basemap; `label ?? name ?? id` stays.
- **Scope notes:** `app.ts` keeps its eight inline style lines (not this task). `tmp/task-2/`
  holds probe scripts, the server log and screenshots — gitignored, not part of the change. The
  user's maps dev server was restarted once (see Key Decisions).
- **Read next:** `projects/mfe-maps/src/maps/map-style.ts` `labelLayers()` — the reservation
  layers and their placement order are the invariant that keeps labels off the DOM markers;
  `projects/mfe-maps/src/maps/map-resources.ts` — worker URL relative to the chunk and the seam;
  `projects/mfe-maps/src/maps/map.component.ts` `createMap()` / `showSelection()` — the
  `style.load` hand-over, the instance kept for teardown, and the one-way flow from props to
  markers, label data and the in-view rule.

### Test Evidence

- Final code, sandboxed ChromiumHeadless: `npm run test:maps` — `Test Files 4 passed (4)`,
  `Tests 13 passed (13)` (map.component 7, map-style 2, app 1, distance 3); `npm run test:shell`
  — `21 passed`, `135 passed` (chat map click cases through the real chat, T1-AC-03 flow);
  `npm run test:charts` — `6 passed`, `46 passed`; `npm run test:eval` — `4 passed`, `30 passed`.
- `git diff --quiet -- map.schema.ts vocabulary.ts distance.fn.ts capability.ts`: unchanged
  (T2-AC-04).
- `npx eslint projects/mfe-maps/src src/app/chat/chat.page.spec.ts`: clean. `npx sheriff verify`:
  all projects validated. `prettier --check`: only the pre-existing warnings on `map.schema.ts`
  and `docs/improvements.md`, both untouched by this task in that respect.
- `npx ng build mfe-maps` (production, federation): complete, no budget warning; the exposed
  chunk contains MapLibre's stylesheet (11 `maplibregl-canvas-container` matches) and the worker
  URL; `maplibre/maplibre-gl-worker.mjs` and `maplibre-gl-shared.mjs` in the output;
  `remoteEntry.json` shares `maplibre-gl` 6.11.2 (`maplibre_gl.cfavd9PCW4.js`). The build
  overwrote the dev server's `dist`; a `touch` afterwards let the dev server regenerate its own.
- Probe (gone with the session's scratchpad): Playwright headless Chromium reports WebGL2 on
  `ANGLE … SwiftShader`, the basis for running the real map in specs.
- Playwright probes against the user's dev servers, scripts and screenshots in `tmp/task-2/`
  (gitignored): standalone `localhost:4202` — six `.cf-marker` and the attribution inside the
  canvas, Hamburg as `.cf-center` in mono, distance `130 → 199` on clicking Campen, ring on
  `campen`, no console errors (`standalone.png`, `standalone-campen.png`); federated playground
  `localhost:4200/playground?capabilities=charts,maps` at 1280 × 900 and 390 × 844 — seven
  markers, click on the last dot changes the name Text `ng-atlas Munich → ng-lantern Leipzig`,
  90 requests to OpenFreeMap of which 73 glyph ranges, i.e. the cross-origin worker is alive
  (`playground-desktop.png`, `playground-desktop-click.png`, `playground-phone.png`,
  `playground-map-zoom.png` at 2×).
- Earlier runs, overtaken by later edits: the first probe found the standalone dev page without
  MapLibre's base CSS (bare `@import` left external → 404) and, after the fix, the popup over the
  Berlin label and the Vienna dot over the Munich label; the first reservation attempt (20 px,
  1 em) hid every label. Each was fixed and re-probed; the close-up shows all seven labels placed,
  none under a dot.
- Environment: the first standalone probe failed with `ngDevMode is not defined` from a vite
  deps cache the test runs had rewritten; a health probe showed shell and charts unaffected; the
  maps server was restarted and re-probed green.
— session 2026-09-28

- Final code after the review pass: `npm run test:maps` — `Test Files 4 passed (4)`,
  `Tests 16 passed (16)` (+3: location hit by `elementFromPoint`, viewport rule, early destroy);
  `npm run test:shell` — `21 passed`, `135 passed`. `npx eslint` on `projects/mfe-maps/src` and
  the chat spec: clean; `npx sheriff verify`: all projects validated; `prettier --check`: only the
  pre-existing `map.schema.ts` warning. Charts, eval and the production build were not repeated:
  the changes stay inside the maps component and its specs, the chat spec did not change.
- Playwright probes against the running dev servers (`tmp/task-2/click-probe.mjs`,
  `selection-probe.mjs`, `playground-map-berlin.png`): before the fix a timeline click after
  `jumpTo` into the Atlantic moved the ring (`ng-atlas-munich → ng-loft-hamburg`) but left the
  center at `-30 / 45`; after the fix the same click returns to `12.46 / 51.72`, zoom 3.53. A real
  Playwright `click()` on `ng-forge-berlin` under the Berlin location marker now passes the
  hit-target check and selects it (transforms 470 px vs 456 px, 14 px apart).

### Acceptance Coverage

- `T2-AC-01` — partial — `map.component.spec.ts` "T2-AC-01 places one marker per point inside
  the map and a user marker labelled with the city …" and `map-style.spec.ts` "T2-AC-01 paints
  land, water, borders, roads and labels in the kit colours …"; the real tiles in the muted mood
  are seen in the screenshots only, since no spec may load tiles.
- `T2-AC-02` — passed — `map.component.spec.ts` "… T2-AC-02 a click writes the whole point"
  (with `fetch` spy), "T2-AC-02 marks the selection with the ink ring, following the bound
  value", "T2-AC-02 keeps a conference at the user's location clickable …" (`elementFromPoint`),
  "T2-AC-02 brings a selection made elsewhere back into view and leaves the viewport alone
  otherwise", "T5-AC-04 dispatches the pick action …", "T5-AC-05 / T2-AC-02 clicking a marker
  writes the point to /selectedConf, rings it and re-renders a Text …"; `chat.page.spec.ts`
  request-3 map click case through the real chat.
- `T2-AC-03` — partial — `map.component.spec.ts` "T2-AC-03 spreads coincident points so each dot
  stays individually clickable" (distinct transforms, both clicks delivered); label overlap is
  MapLibre's collision detection inside the canvas, verified visually in `playground-map-zoom.png`
  only.
- `T2-AC-04` — passed — contract files byte-identical (`git diff --quiet`), `npm run test:eval`
  green on the static prompt built from the vocabulary.
- `T2-AC-05` — partial — `app.spec.ts` "T6-AC-01 / T2-AC-05: renders the maps vocabulary through
  its own A2UI host …" (offline); the page on 4202 with tiles verified by the probe; no host CSS
  (sheriff, the stylesheet imports only MapLibre's), colours through `--cf-*` aliases with
  fallbacks in `map.component.css` — by inspection, not by test.
- `T2-AC-06` — passed — all four suites green; `provideOfflineMap()` in every spec that renders a
  Map, `fetch` spies in the map specs.
- `XC-02`, `XC-03` — contributes; the cross-cutting checks are the plan's end-of-scope gate.

### Open Issues

- `docs/architecture.md:363` and `:576` still say "the map keeps its look until the MapLibre
  upgrade"; `docs/spec.md:133` still describes the Map as an SVG scatter over the bounding box.
  The remote's worker asset (`maplibre/`), the `None` encapsulation and the `provideOfflineMap()`
  seam for specs belong in the architecture notes on remotes and tests. (→ Task 6)
- Promoted: the map's label placement (collision avoidance, selected-label priority, anchors at
  every zoom) has no spec — needs a local glyph fixture and `queryRenderedFeatures` with an active
  worker (→ improvements register).

### Context for Next Task

- Interfaces: `MAP_RESOURCES: InjectionToken<MapResources>` with
  `{ loadStyle(): Promise<StyleSpecification>; workerUrl: string }`; `provideOfflineMap(): Provider`
  in `projects/mfe-maps/src/testing/offline-map.ts`; `recolour(style)`, `labelLayers()`,
  `labelCollection(points, center, selectedId)`, `pixelOffsets(points)`.
- Any spec that renders a `Map` needs `provideOfflineMap()` in its providers, or it fetches the
  positron style. Markers are `.cf-marker[data-id]`, the user location `.cf-center` (never a hit
  target); labels live in the canvas and cannot be asserted through the DOM. Markers appear a
  frame after creation — wait with `vi.waitFor` (see `renderMap` in the spec). The viewport is
  reachable only through the instance (`fixture.componentInstance['map']()`).
- The recordings (Task 4) are unaffected: the vocabulary and the serialized catalog context are
  unchanged, and the map's clicks never involve the model.
- Deploy (Task 5): the remote's output must be copied whole — `maplibre/` next to the chunks — and
  the deploy host must allow cross-origin module imports (the worker is loaded through a blob
  `import` of `<remote>/maplibre/maplibre-gl-worker.mjs`, then `./maplibre-gl-shared.mjs`); the
  URL is relative to the exposed chunk, so a subfolder works.
- The `anyComponentStyle` budget for `mfe-maps` is 100 kB / 120 kB; MapLibre's stylesheet is
  83 kB raw. The component stylesheet imports it by a relative `node_modules` path — keep it
  relative (see Key Decisions).
- The compact attribution starts expanded on narrow maps; if the user dislikes it at phone
  width, `attributionControl` options or a CSS rule for `.maplibregl-compact-show` are the levers.

### Git State

```
$ git diff --stat
 angular.json                                     |   9 +-
 docs/improvements.md                             |   3 +-
 package-lock.json                                | 220 ++++++++++++++-
 package.json                                     |   1 +
 projects/mfe-maps/src/app/app.spec.ts            |  17 +-
 projects/mfe-maps/src/maps/map.component.html    |  31 +--
 projects/mfe-maps/src/maps/map.component.spec.ts | 237 ++++++++++++++---
 projects/mfe-maps/src/maps/map.component.ts      | 324 +++++++++++------------
 src/app/chat/chat.page.spec.ts                   |  85 ++++--
 9 files changed, 662 insertions(+), 265 deletions(-)

$ git status --short
 M angular.json
 M docs/improvements.md
 M package-lock.json
 M package.json
 M projects/mfe-maps/src/app/app.spec.ts
 M projects/mfe-maps/src/maps/map.component.html
 M projects/mfe-maps/src/maps/map.component.spec.ts
 M projects/mfe-maps/src/maps/map.component.ts
 M src/app/chat/chat.page.spec.ts
?? docs/demo-variation-assessment.md
?? docs/work/m3-reserve-maps-hosting/task-log/task-2-maplibre-mfe-maps.md
?? projects/mfe-maps/src/maps/map-markers.ts
?? projects/mfe-maps/src/maps/map-resources.ts
?? projects/mfe-maps/src/maps/map-style.spec.ts
?? projects/mfe-maps/src/maps/map-style.ts
?? projects/mfe-maps/src/maps/map.component.css
?? projects/mfe-maps/src/testing/offline-map.ts
```

### Sessions

- claude-code 6d53286c-b590-45f7-b77c-b78234ec2ab5 (2026-09-27) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/6d53286c-b590-45f7-b77c-b78234ec2ab5.jsonl
