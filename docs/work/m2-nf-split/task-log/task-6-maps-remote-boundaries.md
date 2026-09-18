# Task 6: Move maps into the `mfe-maps` remote and enforce the boundaries

### Task

Moved the maps capability into `projects/mfe-maps`, the second Native Federation remote (port
4202, exposes `./capability`, own A2UI page over lighthouse data); the shell owns no vocabulary of
its own any more and derives its catalog from the federation status list alone. The three module
boundaries of the plan are now executable: Sheriff (`sheriff verify`, folded into `npm run lint`)
checks shell ↔ remotes ↔ contract by resolved imports, and an ESLint block keeps the agent-client
packages out of remote production code.

### Status

DONE — implementation complete, all checks green on the final code (see Test Evidence, both
entries). Independent review performed (Codex quick review, 2026-09-18): hotspot 1 (unknown
function calls pass the render validation) absorbed with a boundary check and three tests, blind
spot A (`createAppConfig` untested) absorbed with a spec, hotspot 2 (dynamic imports bypass the
package rule) accepted as a conscious gap, blind spot B (no production-build probe) deferred as
before. Not committed (`/commit 6` pending). The live moment (T6-AC-02, XC-01) was demonstrated
with real model calls before and after the review fix; its reload half remains probe evidence, not
an in-tree test, as in Task 5.

### Files Modified

New project `projects/mfe-maps/` (skeleton by `ng generate application mfe-maps --routing=false
--skip-tests --style=css --prefix=app --skip-install --interactive=false`; the NF wiring copied
from `mfe-charts` by hand, see Key Decisions):

- `projects/mfe-maps/federation.config.mjs` (new) — the charts config with `name: 'maps'` and
  `exposes: { './capability': './projects/mfe-maps/src/capability.ts' }`; same `@angular/core` and
  `@angular/common` keepAll overrides, same `skip` list incl. `zod`.
- `projects/mfe-maps/tsconfig.federation.json`, `tsconfig.app.json`, `tsconfig.spec.json`,
  `public/favicon.ico` (new) — federation tsconfig copied; the rest generated, byte-identical to
  the charts counterparts.
- `projects/mfe-maps/src/index.html` (new) — generated; title `mfe-maps`.
- `projects/mfe-maps/src/styles.css`, `src/main.ts`, `src/bootstrap.ts` (new) — copies of the
  charts files (`[mfe-maps]` log prefix; standalone `initFederation` against its own
  `remoteEntry.json`).
- `projects/mfe-maps/src/capability.ts` (new) — the former `maps/index.ts` under the contract
  name: `export const capability: AgentCapability` with `name: 'maps'`.
- `projects/mfe-maps/src/maps/{map.component.ts,map.component.html,map.schema.ts,geo.ts,
  distance.fn.ts,vocabulary.ts,distance.fn.spec.ts}` (moved from `src/app/capabilities/maps/`
  with plain `mv`) — byte-identical except `vocabulary.ts`, whose comment now names
  `capability.ts` instead of `index.ts`.
- `projects/mfe-maps/src/maps/map.component.spec.ts` (moved, rewired) — the renderer tests run on
  the remote's own host (`configureMapsHost`: `provideA2Ui` with `createMapsCatalog()` and a
  recording action handler, plus `provideMarkdownRenderer`); `ASSISTANT_CATALOG_ID` →
  `MAPS_CATALOG_ID`; no shell import and no charts fixture remain.
- `projects/mfe-maps/src/testing/bound-property.ts` (new) — copy of the shell's test helper
  (identical to the charts copy).
- `projects/mfe-maps/src/app/maps-catalog.ts` (new) — `MAPS_CATALOG_ID = 'maps-demo'` and
  `createMapsCatalog()`: `BasicCatalogBase` over `toFragment(capability)`.
- `projects/mfe-maps/src/app/app.config.ts` (new) — `provideA2Ui` with that catalog and a console
  action handler, `provideMarkdownRenderer` with the static `renderMarkdown`.
- `projects/mfe-maps/src/app/app.ts`, `app.html` (new) — the standalone page: a hand-built surface
  (Map with `center: /me`, `selected: /selected`, a pick action; two Texts: label and a `distance`
  call `/me` → `/selected`) over six German lighthouses (`LIGHTHOUSES`) with Hamburg as `HOME`.
- `projects/mfe-maps/src/app/app.spec.ts` (new) — T6-AC-01 page spec: six markers, center mark,
  distance text equals `Math.round(haversineKm(HOME, LIGHTHOUSES[1]))`, click on Campen re-renders
  the distance.

Shell and workspace:

- `angular.json` (modified) — the `mfe-maps` project block is the `mfe-charts` block with name and
  port substituted (NF `build`/`serve`, `esbuild`, `serve-original` on 4202, vitest `test`,
  `lint` without `eslintConfig`); the generated per-project `eslint.config.js` was deleted.
- `tsconfig.json` (modified) — references for the remote's app (CLI) and spec (by hand) tsconfigs.
- `package.json`, `package-lock.json` (modified) — `start:maps`, `test:maps`, `lint:boundaries`
  (`sheriff verify`); `start`, `test`, `lint` fold them in; `@softarc/sheriff-core@^0.19.6` as a
  direct devDependency (already present transitively via NF; the lockfile gains one line).
- `sheriff.config.ts` (new) — modules `src` → `shell`, `projects/<remote>` → `remote`, `shared` →
  `host-contract`, `shared/capabilities` → `contract`; `depRules` shell → contract+host-contract,
  remote → contract, contract/host-contract → nothing; five explicit `entryPoints` (shell main,
  page and capability per remote).
- `eslint.config.js` (modified) — one block for `projects/mfe-*/**/*.ts` (specs ignored):
  `no-restricted-imports` on `@copilotkit/*` and `@ag-ui/*` with a message naming the rule.
- `public/federation.manifest.json` (modified) — `"maps": "http://localhost:4202/remoteEntry.json"`.
- `src/bootstrap.ts` (modified) — no local capability list any more; `bootstrap(remotes)` calls
  `createAppConfig(remotes)`.
- `src/app/app.config.ts` (modified) — `createAppConfig(remotes)` takes the status list alone and
  provides `loadedCapabilities(remotes)` as the catalog list (closes Task 5's open point).
- `src/app/app.config.spec.ts` (new, review fix) — one status per state: `AGENT_CAPABILITIES` holds
  only the loaded capability, `CAPABILITY_STATUS` the whole list.
- `src/app/a2ui/surface-host-rules.ts` (modified, review fix) — `findFunctionCalls(messages)`: every
  `call` name anywhere in the messages, collected by a `JSON.parse` reviver.
- `src/app/agent/tools/render-surface.tool.ts` (modified, review fix) — the catalog is resolved once;
  after unknown components, unknown function calls fail with `catalog` and `Unknown function(s): …`;
  `findUnknownComponents(messages, catalog)`.
- `src/app/agent/tools/render-surface.tool.spec.ts` (modified, review fix) — `distanceCall()` helper;
  three tests: rejection with maps switched off, rejection of a call nested in `args` or parked in a
  data value (only the unknown name reported), acceptance of an announced function.
- `src/app/a2ui/assistant-catalog.spec.ts`, `catalog-context.spec.ts`,
  `renderer-integration.spec.ts`, `src/app/agent/tools/render-surface.tool.spec.ts`,
  `surface-tool-renderer.component.spec.ts` (modified) — import line only:
  `import { capability as mapsCapability } from '<root>/projects/mfe-maps/src/capability'`.
- `src/app/chat/chat.page.spec.ts` (modified) — the import line; `REMOTES` gains the loaded maps
  row (origin 4202) and loses the "maps is still local" comment; T5-AC-01 now also expects
  `loaded from http://localhost:4202/` and the first toggle link `?capabilities=maps`.
- `eval/run-eval.ts`, `eval/model-context.spec.ts` (modified) — `mapsVocabulary` from
  `projects/mfe-maps/src/maps/vocabulary`.
- `README.md` (modified) — script rows for `start:maps`, `test:maps`, `lint:boundaries`, `npm
  start`/`npm test` texts; new section "Adding a remote" (six-step checklist, `mfe-maps` as the
  template, the Sheriff entry-point step called out).
- `docs/improvements.md` (modified) — boot-check line extended (task 6 added no new instance; the
  probes are the smoke test's template). The line promoted in the first wrap-up (function calls not
  validated at the tool boundary) was removed again: fixed in this task after the review.
- `src/app/capabilities/maps/**` (deleted, 9 tracked files) — moved; `src/app/capabilities/` is
  gone.

### Files Read (Context Only)

- `docs/work/m2-nf-split/plan.md` — preamble and Task 6 block; XC-01/XC-02/XC-05 lines only.
- `docs/work/m2-nf-split/task-log/task-5-capability-panel.md` (predecessor: status list,
  `createAppConfig` two-argument transition, probe conventions), `task-4-charts-remote.md` (the
  remote recipe, NF gotchas, the schematic's `npm install`, sharing semantics).
- `node_modules/@softarc/sheriff-core/src/lib/{config/user-sheriff-config.d.ts,
  config/parse-config.js, cli/verify.js, cli/internal/get-entries-from-cli-or-config.js,
  modules/create-modules.js, modules/find-module-paths.js, file-info/traverse-filesystem.js,
  checks/has-encapsulation-violations.js}` — config surface, `ts.preProcessFile` +
  `ts.resolveModuleName` traversal (dynamic imports included), deepest-module-wins assignment,
  external packages ignored, `transpileModule` + `eval` config loading, exit codes.
- `~/projects/flights42/{sheriff.config.ts,eslint.config.js,package.json}` — the book repo's
  Sheriff setup (ESLint plugin, layered tags).
- npm registry metadata (via curl): `@softarc/eslint-plugin-sheriff` 0.19.6 peers
  (`eslint ^8 || ^9`), `eslint-plugin-boundaries` 7.2.0 (`eslint >= 6`), `dependency-cruiser`
  18.3.1; weekly downloads of the five boundary tools (user question).
- `node_modules/@angular-architects/native-federation-v4/src/schematics/init/{schematic.js,
  schema.json,steps/add-dependencies.js}` — the init schematic queues `NodePackageInstallTask`
  unconditionally.
- `projects/mfe-charts/**` (every file as the template), `src/{main,bootstrap}.ts`,
  `src/app/app.config.ts`, `src/app/chat/{chat.page.html,chat.page.ts,chat.page.spec.ts,
  capability-panel.component.spec.ts}`, `src/app/domain/geo.ts`, `shared/capabilities/
  catalog-function.ts`, `src/app/a2ui/provide-a2ui-catalog.ts`, `angular.json`, `package.json`,
  `tsconfig.json`, `eslint.config.js`, `vitest-base.config.ts`, `.gitignore`, `README.md`,
  `eval/{run-eval.ts,model-context.spec.ts,tsconfig.json}`, `docs/improvements.md`,
  `docs/architecture.md` (grep).
- Task 5's probe scripts in that session's scratchpad (`probe-context.cjs`, `probe-panel.cjs`) —
  selectors and the run-request capture, reused.
- Review fix: `src/app/agent/tools/render-surface.tool.ts` (`validateRenderRequest`),
  `src/app/agent/render-failure-correction.ts` (`MAX_CORRECTIONS_PER_TURN = 3`),
  `src/app/a2ui/{assistant-catalog,catalog-context}.ts` (functions merged with `BASIC_FUNCTIONS`),
  `node_modules/@a2ui/web_core/src/v0_9/rendering/{data-context,generic-binder}.js` (a `call` is
  evaluated only in prop bindings, nested `args` and action contexts; data values are inert),
  `schema/common-types.js` (`FunctionCallSchema`), `catalog/types.d.ts` (`Catalog.functions` Map),
  `node_modules/@a2ui/angular/types/a2ui-angular-v0_9.d.ts` (`AngularCatalog extends Catalog`).

### Key Decisions

— session 2026-09-18

- **Sheriff as a CLI (`sheriff verify` in `npm run lint:boundaries`), not the ESLint plugin.**
  `@softarc/eslint-plugin-sheriff@0.19.6` pins the peer `eslint ^8 || ^9` and the workspace is on
  ESLint 10; installing it would need a peer override with unverified compatibility. The core
  package was already in `node_modules` (transitive via `@softarc/native-federation`, same
  version) and becomes a direct devDependency. The CLI walks from entry points, so specs are
  exempt by construction — the plan's "spec files are exempt" needs no configuration. Cost: no
  editor feedback; the check runs with `npm run lint`. `eslint.config.js` is a plan key location
  but changed only for the package rule below. Alternatives named to the user: ESLint's
  `no-restricted-imports` alone (string-based on relative paths, brittle), `eslint-plugin-boundaries`
  (would cover folders and packages in one tool, `eslint >= 6`), `dependency-cruiser`; Sheriff is
  a niche tool from the Angular Architects circle (~17k weekly downloads of its plugin vs. 1.5–3.5M
  for the others) and stays because the plan names it, it was already present, and its config is
  fifteen readable lines. User decision: Sheriff plus the ESLint package block.
- **The package half of the remote rule is an ESLint block, not Sheriff.** Sheriff records external
  packages but has no rule for them. `no-restricted-imports` with `patterns` `@copilotkit/*` and
  `@ag-ui/*` is robust here because package names are literals; the block is scoped to
  `projects/mfe-*/**/*.ts` with specs ignored, matching "boundaries bind production code". Not in
  the plan (user request after the Sheriff discussion); makes the repo-portability claim complete:
  a remote is an A2UI capability, not an agent client. `@angular-architects/*` is deliberately not
  restricted — the standalone `main.ts` needs `initFederation`.
- **Tags and modules.** `projects/<remote>` (placeholder) rather than `projects`: the placeholder
  makes every subfolder its own module, so an import between two remotes is a cross-module edge
  `remote → remote` and fails (`depRules.remote = ['contract']`); with `projects: 'remote'` both
  remotes would form one module and import each other freely. Probed both ways (Test Evidence).
  `shared` and `shared/capabilities` are nested on purpose: Sheriff assigns a file to the deepest
  matching module, so `shared/agent-contract.ts` gets `host-contract` (agent id, port, route are
  host business) and the contract folder keeps `contract`. `enableBarrelLess: true` because no
  module has an `index.ts`; encapsulation is not used.
- **Entry points stay an explicit list; the README carries the checklist.** A remote missing from
  `entryPoints` is tagged correctly but never traversed, so its outgoing imports go unchecked (the
  incoming direction, shell → remote, is still caught from the shell's entry, and the ESLint block
  is glob-based). A derived variant (`readdirSync('projects')` inside `sheriff.config.ts`, which
  Sheriff transpiles and `eval`s, so Node code runs there) was probed and works — five projects
  listed, names from the folders. The user chose the explicit list for transparency: the five
  lines say which two faces a remote has (standalone page, exposed module). Mitigation: a two-line
  comment at `entryPoints` and the README section "Adding a remote" with the Sheriff step called
  out. Adding a remote is a planned task with review, so the forgotten-entry case is unlikely to
  slip.
- **NF init schematic skipped; the wiring copied from `mfe-charts`.** The schematic queues
  `npm install` unconditionally (postinstall: Playwright download plus the agent's install, run
  inside the sandbox in Task 4 with a suspected cache wipe), and its output has been known and
  edited since Task 4 (name, exposes, overrides, skip, test target). `ng generate application`
  still produced the skeleton; the CLI added the app tsconfig reference, the spec reference and
  the vitest `test` target were added by hand; the generated per-project `eslint.config.js` and
  `app.css` were deleted as in Task 4.
- **`createAppConfig(remotes)` — one argument (closes Task 5's transition).** The catalog list is
  `loadedCapabilities(remotes)`, derived inside `app.config.ts`; the "list is an argument, not an
  import" rule now reads: the status list is the argument. `bootstrap.ts` shrinks to one line.
- **Remote face over lighthouses, Hamburg as center.** Six German lighthouses (id, label, lat,
  lon — nothing else, so the data is plainly not conference data), `HOME` = Hamburg bound to
  `/me` as the center marker, one Text with a `distance` call `/me` → `/selected` so the function
  half of the vocabulary is visible without the shell. Initial selection Roter Sand (130 km);
  the page spec clicks Campen (199 km). Same structure as the charts page (`SURFACE_ID`,
  hand-built messages, `App` constructor processes them).
- **The remote's spec host mirrors `app.config.ts`, including the markdown renderer.** The first
  maps test run failed T5-AC-05 with `NG0201: No provider found for MarkdownRenderer` — that test
  renders a basic `Text`, which injects the renderer unconditionally; the charts spec host never
  renders a Text and did not show this. `configureMapsHost` now provides `provideA2Ui` (recording
  action handler) plus `provideMarkdownRenderer((m) => renderMarkdown(String(m)))`; a spec-local
  mirror rather than a shared helper, because the remote's specs must not depend on the shell and
  the page's `appConfig.providers` would log actions instead of recording them.
- **Moved files keep their bytes.** `mv`, not `git mv` (nothing staged); the only content edits in
  moved files are the spec rewiring and the one-word comment fix in `vocabulary.ts`.
  `map.component.spec.ts` was prettier-dirty at HEAD and stays so; none of this task's hunks appear
  in prettier's diff of it (verified), same for `README.md` and `eval/run-eval.ts`.
- **`chat.page.spec.ts` fixture reflects the new reality.** `REMOTES` gets a loaded maps row; the
  first panel link therefore flips charts off and leaves maps, so T5-AC-01's expectation moved
  from `?capabilities=` to `?capabilities=maps`. The `LOCAL` catalog list is unchanged.
- **Demo idea recorded, plan untouched (user idea).** A recording could show an agent adding a
  simple remote by following the README checklist with `mfe-maps` as the template, with
  `npm run lint` (Sheriff) and `npm run test:<name>` as the agent's own acceptance check, and the
  panel plus the changed answer as the visible effect. Carried to Task 8 in Context for Next Task;
  whether it becomes a task of its own is the user's plan decision.

— session 2026-09-18 (Codex quick review absorbed)

- **Unknown function calls are rejected at the tool boundary (Codex hotspot 1 taken).** The
  validation checked component names only; with maps switched off the model's correction run
  rendered a `Text` with `call: 'distance'`, the invoker resolved it to `undefined` and the label
  showed nothing — a dead control in XC-01's sense that the shell had let through. Now every
  `call` name is checked against `catalog.functions` (the A2UI catalog's map: basic functions plus
  the announced ones, the same set the renderer resolves against) with the same `catalog` code and
  the message `Unknown function(s): distance.`, so the correction run fires exactly as for an
  unknown component. Components are checked first; the first violation still wins.
- **The search covers every message, data values included (user clarification).** The renderer
  evaluates a `{ call, args }` only in prop bindings, nested `args` and action contexts; a call
  parked in an `updateDataModel` value is inert. It is still a model error — the model believes a
  function exists that does not — so the whole message list is searched and the parked case is
  pinned by a test. Known cost: a data field literally named `call` with a string value would be
  flagged; no such field exists in this domain.
- **The walker is a `JSON.parse` reviver (user choice among three).** Regex over `JSON.stringify`
  output (four lines, but a text format and a regex to decode), a hand-written recursion with
  `isRecord` (twelve lines, the style of the other rules), or `JSON.parse(JSON.stringify(messages),
  reviver)`: the reviver visits every key/value pair at every depth, children before parents, so
  `key === 'call' && typeof value === 'string'` is a structural test without regex or own
  recursion. Pitfall recorded because a console experiment showed it: the reviver must return
  `value` — returning `undefined` deletes the property, which made nested arrays look empty.
- **`findFunctionCalls` lives in `surface-host-rules.ts`.** Framework-free like the other message
  rules, exported for the eval scorer, which walks the same raw JSON; the tool applies the catalog
  filter, as `findUnknownComponents` does for components.
- **Dynamic imports bypass the package rule — accepted (Codex hotspot 2, user decision).**
  `no-restricted-imports` sees static imports only; `import('@ag-ui/client')` in a remote passes
  both it and Sheriff (which ignores packages). A dynamic import of an agent-client package would
  be a deliberate circumvention, not an accident, and the demo's claim is about the module graph.
  If ever wanted, a `no-restricted-syntax` rule on `ImportExpression` with the same package list
  closes it in five lines.
- **`createAppConfig` gets a spec (Codex blind spot A taken).** `chat.page.spec.ts` provides
  catalog and status separately, so nothing had pinned the derivation; `app.config.spec.ts` feeds
  one status per state through the real config and inspects both tokens.
- **Production-build probe stays deferred (Codex blind spot B).** Unchanged reason: `ng build`
  next to the user's running `ng serve` risks the mixed-mode NF cache from Task 4; the register's
  boot smoke test is the durable answer. Can be run when the user's servers are stopped.
- **Replay caveat (user observation).** The correction run presupposes a live model. A persisted
  answer replayed after a capability was removed would be rejected with no one to correct it;
  the register's M3 line (recordings keyed by conversation path × capability set, only recorded
  sets offered) already covers this, and the stricter validation makes that rule binding rather
  than advisory. `MAX_CORRECTIONS_PER_TURN` is 3, so two consecutive rejections (component, then
  function) leave a third attempt.

### Review Focus

- **Behavior claims:** (1) With both remotes in the manifest, the shell's catalog and model
  context contain Gauge/Timeline/daysUntil from 4201 and Map/distance from 4202, and nothing
  local; with `?capabilities=charts` the shell fetches nothing from 4202, announces no `Map` and no
  `distance`, and every other surface renders unchanged. (2) `renderSurface` rejects, with code
  `catalog` and a message naming the offender, any component or any `call` name the surface's
  catalog lacks — wherever the call sits in the messages — and leaves no surface behind; announced
  and basic functions pass. (3) `localhost:4202` alone renders six lighthouse markers, the Hamburg
  center mark and the `distance` value; a click writes the lighthouse to `/selected`, re-renders
  the distance and logs the action. (4) `npm run lint` fails with `from tag <a> to tags <b>` for a
  production import across any of the three boundaries (incl. remote → remote) and with the
  `no-restricted-imports` message for `@copilotkit/*`/`@ag-ui/*` in remote production code; specs
  are exempt from both.
- **Plan deviations:** Sheriff ESLint plugin (book repo) → Sheriff CLI (`sheriff verify`) → ESLint
  10 peer conflict, specs exempt by traversal · `eslint.config.js` (key location) changed only for
  the package block, which the plan did not ask for (user request) · NF init schematic → wiring
  copied from `mfe-charts` → the schematic's unconditional `npm install` · `createAppConfig`
  collapsed to one argument (Task 5's open point, not in the block) · function-call validation in
  `render-surface.tool.ts` and `surface-host-rules.ts` — not in the block, taken from the review
  because Task 6 made the degraded mode real · `chat.page.spec.ts` T5-AC-01 expectation changed
  (`?capabilities=maps`) because the fixture now has two loaded remotes · README section "Adding a
  remote" (user request) · Key Locations otherwise as listed; the six fixture specs and `eval/`
  were foreseen.
- **Assumptions / choices:** the remote's catalog id is `maps-demo`; the console is its "logging
  action handler"; `HOME`/`LIGHTHOUSES` exported for the page spec; `host-contract` as the tag for
  `shared/agent-contract.ts` (the plan only says a remote must not import it); `@angular-architects/*`
  allowed in remotes; the explicit `entryPoints` list with README checklist over a derived list; a
  `call` key with a string value counts as a function call anywhere in the messages; dynamic
  imports are not covered by the package rule.
- **Scope notes:** `docs/improvements.md` (one line extended; a line added in the first wrap-up
  removed again after the fix); `src/app/app.config.spec.ts` and the tool-spec tests are review
  additions; the `.zprofile` and other dotfiles in `git status` are sandbox artifacts, not part
  of the change; `src/app/chat/__screenshots__/` (00:14 today) predates this session and is
  gitignored; the maps dev server this session started on 4202 was stopped again, the user's
  `npm start` (4200/4201/3001) predates the script change and shows maps as unreachable until
  `start:maps` runs.
- **Read next:**
  1. `src/app/a2ui/surface-host-rules.ts` `findFunctionCalls` and `src/app/agent/tools/
     render-surface.tool.ts` `validateRenderRequest` — the reviver walk and the two catalog checks;
     compare with the three new tool-spec tests.
  2. `sheriff.config.ts` — the four modules and four rules; compare with the probe table in Test
     Evidence (which import produced which tag pair).
  3. `src/app/app.config.ts` `createAppConfig` with `src/app/app.config.spec.ts` — the shell no
     longer names any capability; `loadedCapabilities(remotes)` is the only source.

### Test Evidence

— session 2026-09-18

- **Vocabulary serialization (T4-AC-04 analogue):** `catalogToContextEntry([chartsVocabulary,
  mapsVocabulary])` under Node (`node --import tsx`, script in the session scratchpad) before any
  change: 7936 chars, sha256 `e58dcbc9634f772275b08978e4c4123ecd9c6c1b8554e0014cc9586aaf14a6b6`;
  after the move with `mapsVocabulary` from `projects/mfe-maps/src/maps/vocabulary`: same length,
  same hash. (Task 4's log records 8944 chars / `0983f773…` for the same call; the files feeding
  the serialization are unchanged since that commit, so that figure was measured differently —
  this task's before/after pair is the evidence.)
- `npx tsc --noEmit -p` for `tsconfig.app.json`, `tsconfig.spec.json`,
  `projects/mfe-maps/tsconfig.{app,spec,federation}.json`, `eval/tsconfig.json` — 0 errors each.
- `npx ng lint` — "All files pass linting" for `shell`, `mfe-charts`, `mfe-maps`. `npx sheriff
  verify` — five projects (`shell`, `charts-page`, `charts-capability`, `maps-page`,
  `maps-capability`), "All projects validated successfully!", exit 0; re-run green after the
  entry-point comment was added.
- `npx prettier --check` clean on every new or edited file except the three with pre-existing
  drift (`README.md`, `eval/run-eval.ts`, `map.component.spec.ts`, all dirty at HEAD); for each,
  prettier's diff contains none of this task's lines (verified by diffing prettier's output).
- `npm run test:maps` — first run 1 failed / 9 passed (`NG0201: No provider found for
  MarkdownRenderer` in T5-AC-05, see Key Decisions); after adding the renderer to the spec host:
  3 files, 10 passed (6 map component incl. 2 renderer cases, 3 distance, 1 page). The failure
  screenshot under the gitignored `__screenshots__/` was deleted.
- `npm run test:shell` — 18 files, 110 passed (Task 5: 20 files, 119; minus the 2 moved files with
  9 cases). `npm run test:charts` — 4 files, 18 passed. `npm run test:eval` — 2 files, 18 passed.
  All on the final code except `test:maps`, whose last green run precedes the entry-point comment
  in `sheriff.config.ts` (not imported by any spec).
- **Boundary probes (T6-AC-03):** each a temporary import in a production file, `npx sheriff
  verify`, then the file restored from a copy; `git diff | sha256sum` identical before and after
  the series. (a) `distance.fn.ts` → `src/app/domain/geo`: exit 1, `from tag remote to tags shell`;
  (b) `distance.fn.ts` → `shared/agent-contract`: `from tag remote to tags host-contract`;
  (c) `src/bootstrap.ts` → `projects/mfe-maps/src/capability`: `from tag shell to tags remote`;
  (d) `shared/capabilities/binding.ts` → `src/app/app.routes`: `from tag contract to tags shell`;
  (e) `binding.ts` → `projects/mfe-maps/src/capability`: `from tag contract to tags remote`;
  (f) later, `distance.fn.ts` → `projects/mfe-charts/src/charts/days-until.fn`: `from tag remote
  to tags remote` with `projects/<remote>`, and "All projects validated successfully" with the
  config temporarily changed to `projects: 'remote'` (config and file restored, `cmp` identical).
- **Package-rule probes:** `import '@ag-ui/core'` appended to `projects/mfe-maps/src/maps/geo.ts`
  → `npx eslint` error `'@ag-ui/core' import is restricted from being used by a pattern. a remote
  imports only shared/capabilities and framework packages; the agent client is host business
  (no-restricted-imports)`; the same line in `distance.fn.spec.ts` → no error (spec exempt);
  `src/app/agent/assistant-agent.token.ts` (a shell file importing `@ag-ui/*`) lints clean. Files
  restored.
- **Derived entry-point probe:** `sheriff.config.ts` temporarily rewritten with
  `readdirSync('projects')`-based `entryPoints` → `sheriff verify` listed `shell`,
  `mfe-charts-page`, `mfe-charts-capability`, `mfe-maps-page`, `mfe-maps-capability`, all green;
  config restored byte-identically (decision: explicit list stays).
- **`remoteEntry.json` of the maps dev server** (`ng serve mfe-maps --port 4202`, started by this
  session outside the sandbox): `name: maps`, `exposes: ['./capability']`, shared =
  `@a2ui/angular/v0_9`, `@a2ui/web_core/v0_9` (+`basic_catalog`), `@angular/common` (+`http`),
  `@angular/core` (+5 secondaries), `rxjs`, `rxjs/operators`, `tslib`, `zod/v3`,
  `zod-to-json-schema` — the charts list; no bare `zod`.
- **Browser probes** (Playwright headless Chromium, `probe-federation.cjs` in the session
  scratchpad, not in the tree; against the user's `npm start` on 4200/4201/3001 and this session's
  4202): (A) `http://localhost:4202/` → 6 `g.cf-marker`, `.cf-center-mark` present, texts
  `["Roter Sand","130"]`; click on Campen → `["Campen","199"]`; console `[mfe-maps] action {name:
  pick, surfaceId: lighthouses, sourceComponentId: map, …}`; 0 requests to 4200; no page errors
  (screenshot checked: grid, six labelled dots, Hamburg cross). (B) `http://localhost:4200/` →
  panel rows `charts loaded from http://localhost:4201/ … Switch off` (href `?capabilities=maps`)
  and `maps loaded from http://localhost:4202/ components: Map functions: distance Switch off`
  (href `?capabilities=charts`); requests to 4202: `/remoteEntry.json`, `/capability.js`;
  `/playground` renders `app-map` with 8 markers, `app-timeline`, `app-gauge`; only the usual
  denied-geolocation warning. (C) `/?capabilities=charts` → maps row `unselected` ("not
  selected", href `?capabilities=charts,maps`), 0 requests to 4202; the captured run request
  (3001 aborted before the agent) announces components `['Gauge','Timeline']`, functions
  `['daysUntil']`; `/playground?capabilities=charts` → no `app-map`, renderer error `Component
  type "Map" not found in catalog`, Timeline present. (D) all `http://localhost:4202/**` requests
  aborted, `/?capabilities=charts,maps` → maps row `unreachable` ("selected, but unreachable",
  href `?capabilities=charts`); console `[NF][6]: Failed to load module maps/./capability …
  Remote 'maps' is not initialized` and `[shell] capability 'maps' skipped: remote not loaded`.
- **Live moment (XC-01, real model calls via the user's agent; `probe-live.cjs`, scratchpad):**
  charts only (`/?capabilities=charts`): request 1 → Timeline surface (7 conferences), no Map;
  request 2 "Zeig sie auf einer Karte" → first attempt rejected by the shell ("Could not build the
  surface (catalog)."), the correction run answered "Eine Kartenansicht steht in diesem Katalog
  leider nicht zur Verfügung. Hier stattdessen die Zeitleiste mit Stadt und Entfernung." with a
  Timeline surface, `app-map` count 0 (screenshot checked). Both remotes (`/`): request 1 →
  Timeline; request 2 → a Map surface with the seven conferences and the details column,
  `app-map` count 1 (screenshot checked). No page errors in either run. Observed in the
  charts-only answer: a `Kilometer entfernt` Text with an empty value — a `distance` call the
  catalog does not carry (see Open Issues).
- Probes, backups and screenshots live in the session scratchpad only; the tree carries none of
  them. The 4202 server was stopped afterwards (`ss` shows the user's three servers only).
- Not probed: the production build (`ng build` + static serve) — the shell's federation config is
  unchanged and the remote's is a copy of the probed charts config; running `ng build` next to the
  user's `ng serve` risks the mixed-mode NF cache Task 4 documented. The boot smoke test in the
  improvements register remains the durable answer.

— session 2026-09-18 (after the review fix)

- Codex re-verified independently on the pre-fix code: lint incl. Sheriff green; 110 shell, 10
  maps and 18 eval tests passed; no files changed by the review.
- After the fix: `npx tsc --noEmit -p` `tsconfig.app.json`, `tsconfig.spec.json`,
  `eval/tsconfig.json` — 0 errors; `npx ng lint shell` — "All files pass linting";
  `npm run test:shell` — 19 files, 114 passed (110 + the three tool-spec tests + the config spec);
  `npm run test:eval` — 2 files, 18 passed (`eval/score.ts` imports `surface-host-rules.ts`).
  `npx prettier --check` clean on `surface-host-rules.ts`, `render-surface.tool.ts`,
  `app.config.spec.ts`; `render-surface.tool.spec.ts` and `docs/improvements.md` were dirty at HEAD
  and none of the new lines appear in prettier's diff. Not re-run: `test:charts`, `test:maps`
  (no file of theirs changed).
- **Live moment after the fix** (charts only, two real model calls, `probe-live-charts-only.cjs`
  in the session scratchpad, against the user's rebuilt shell dev server): request 1 → Timeline
  surface; request 2 → first attempt rejected ("Could not build the surface (catalog)."), the
  correction run answered text-only: "Eine Kartenansicht steht mir leider nicht zur Verfügung –
  mein Baukasten kennt kein „Map“-Element. Ich habe die Angular-Konferenzen daher weiterhin auf der
  Zeitleiste (siehe oben) mit Auswahl und Details dargestellt. …" — no new surface (`surfaces` 1,
  `app-map` 0), no empty `distance` label, no page errors. The both-remotes half was not repeated
  (the maps server was stopped; the fix does not touch the loaded path). Screenshot in the
  scratchpad only.
- Console check of the reviver pitfall (user, browser console): a reviver returning `undefined`
  deletes properties bottom-up, so nested arrays print empty; with `return v` every nested key is
  visited. Our reviver returns `value`; the nested case is pinned by the tool-spec test.

### Acceptance Coverage

- **T6-AC-01** — passed — `projects/mfe-maps/src/app/app.spec.ts` "T6-AC-01: renders the maps
  vocabulary through its own A2UI host over lighthouse data" (six markers, center mark, exact
  `distance` value before and after a click); end to end by probe (A) against the remote alone
  (the shell was running but received no request).
- **T6-AC-02** — partial — automated for the announce/render equality (`chat.page.spec.ts`
  T2-AC-01/02, unchanged), the whitelist/skip paths (`select-capabilities.spec.ts`,
  `load-capabilities.spec.ts`), the maps-only/charts-only serializations
  (`catalog-context.spec.ts`), the composition (`src/app/app.config.spec.ts` "derives the catalog
  list from the loaded remotes and hands the panel every status", since the review) and the
  rejection of a `distance` call with maps switched off (`render-surface.tool.spec.ts` "rejects a
  call to a function the catalog does not announce (maps switched off)"). End to end by probes
  (C) and (D) and by the live moment before and after the review fix (charts only → no Map
  announced, the answer names the gap and builds nothing dead; both → the map). Only the reload
  half stays browser behavior, as in Task 5. Contributes to XC-01.
- **T6-AC-03** — partial — `npm run lint` runs `sheriff verify` and the ESLint block on the tree
  (green); the failing case is proven by the six boundary probes and two package probes above,
  each with the tag pair or the rule message, not by an in-tree test that injects a violation.
  Contributes to XC-02.

### Open Issues

- `docs/architecture.md` still places maps under `src/app/capabilities/` (table row 158) and
  describes neither the host shape, the panel, nor the module boundaries (→ Task 8).
- Extended in the register: the boot-check line now notes that both remotes exist and that this
  task's probe scripts are the smoke test's template.

### Context for Next Task

- **Task 7 (eval, capability sets):** the live moment reproduced today exactly as Task 5
  predicted: with charts only the model first emits a `Map` (rejected, `catalog`), then names the
  gap — one correction run per request 2. Before the review fix the correction also carried a
  `distance` call the catalog lacks (empty Text); since the fix such a call is rejected too
  (`Unknown function(s): distance.`) and the re-run ended in a text-only answer. The eval's
  "no dead controls" judgement (XC-01) therefore has the shell on its side; `MAX_CORRECTIONS_PER_TURN`
  is 3, so two consecutive rejections still leave an attempt. The vocabulary for the harness comes
  from both remotes' sources (`projects/mfe-charts/src/charts/vocabulary`,
  `projects/mfe-maps/src/maps/vocabulary`); `eval/run-eval.ts` still composes the full set itself.
  `surface-host-rules.ts` now also exports `findFunctionCalls(messages)`, which the scorer could
  check against a recorded catalog. Links: `/?capabilities=charts` (degraded), `/` or
  `/?capabilities=charts,maps` (full).
- **Task 8 (architecture doc, tour):** the host shape is complete — manifest → whitelist →
  `initFederation` → `loadCapabilities` → `describeCapabilities` → `createAppConfig(remotes)`;
  the shell has no `capabilities/` folder. The NF DevTools capture Task 4 proposed can now show two
  remotes. Demo idea (user): let an agent add a simple third remote live by following README
  "Adding a remote" with `mfe-maps` as the template, using `npm run lint` and `npm run test:<name>`
  as its own acceptance check; the panel row and the changed answer are the visible effect. Plan
  untouched; a task of its own is the user's call. Practical note for a recording: generation
  takes minutes and the first run tends to surface one small thing (today: the spec host's
  markdown renderer).
- **Interfaces:** `createAppConfig(remotes: readonly CapabilityStatus[])`; `bootstrap(remotes)`;
  remote contract unchanged (`./capability`, named export `capability`); `sheriff.config.ts`
  modules/tags `shell`, `remote`, `contract`, `host-contract`; `npm run lint:boundaries`;
  `findFunctionCalls(messages: readonly unknown[]): string[]` in `surface-host-rules.ts`.
- **Gotchas:** every new remote needs its two `entryPoints` in `sheriff.config.ts` or its imports
  go unchecked (README checklist step 5); the `ng generate application` step adds only the app
  tsconfig reference, the spec one is manual; the user's `npm start` must be restarted to pick up
  `start:maps`; a remote spec that renders a basic `Text` needs `provideMarkdownRenderer` in its
  host; `ss -ltnp` outside the sandbox before starting servers, `$TMPDIR` is unset there — use the
  absolute scratchpad path for probe scripts; a `pkill -f` pattern that matches its own shell
  returns a non-zero code although the target died.

### Git State

```
$ git diff --stat
 README.md                                          |  24 ++-
 angular.json                                       | 131 ++++++++++++
 docs/improvements.md                               |   2 +-
 eslint.config.js                                   |  20 ++
 eval/model-context.spec.ts                         |   2 +-
 eval/run-eval.ts                                   |   2 +-
 package-lock.json                                  |   1 +
 package.json                                       |  10 +-
 public/federation.manifest.json                    |   3 +-
 src/app/a2ui/assistant-catalog.spec.ts             |   2 +-
 src/app/a2ui/catalog-context.spec.ts               |   2 +-
 src/app/a2ui/renderer-integration.spec.ts          |   2 +-
 src/app/a2ui/surface-host-rules.ts                 |  16 ++
 src/app/agent/tools/render-surface.tool.spec.ts    |  70 +++++-
 src/app/agent/tools/render-surface.tool.ts         |  49 +++--
 .../tools/surface-tool-renderer.component.spec.ts  |   2 +-
 src/app/app.config.ts                              |  15 +-
 src/app/capabilities/maps/distance.fn.spec.ts      |  29 ---
 src/app/capabilities/maps/distance.fn.ts           |  26 ---
 src/app/capabilities/maps/geo.ts                   |  25 ---
 src/app/capabilities/maps/index.ts                 |  16 --
 src/app/capabilities/maps/map.component.html       |  30 ---
 src/app/capabilities/maps/map.component.spec.ts    | 218 -------------------
 src/app/capabilities/maps/map.component.ts         | 237 ---------------------
 src/app/capabilities/maps/map.schema.ts            |  36 ----
 src/app/capabilities/maps/vocabulary.ts            |  15 --
 src/app/chat/chat.page.spec.ts                     |  14 +-
 src/bootstrap.ts                                   |   8 +-
 tsconfig.json                                      |   6 +
 29 files changed, 335 insertions(+), 678 deletions(-)

$ git status --short     # sandbox dotfiles omitted
 M README.md
 M angular.json
 M docs/improvements.md
 M eslint.config.js
 M eval/model-context.spec.ts
 M eval/run-eval.ts
 M package-lock.json
 M package.json
 M public/federation.manifest.json
 M src/app/a2ui/assistant-catalog.spec.ts
 M src/app/a2ui/catalog-context.spec.ts
 M src/app/a2ui/renderer-integration.spec.ts
 M src/app/a2ui/surface-host-rules.ts
 M src/app/agent/tools/render-surface.tool.spec.ts
 M src/app/agent/tools/render-surface.tool.ts
 M src/app/agent/tools/surface-tool-renderer.component.spec.ts
 M src/app/app.config.ts
 D src/app/capabilities/maps/distance.fn.spec.ts
 D src/app/capabilities/maps/distance.fn.ts
 D src/app/capabilities/maps/geo.ts
 D src/app/capabilities/maps/index.ts
 D src/app/capabilities/maps/map.component.html
 D src/app/capabilities/maps/map.component.spec.ts
 D src/app/capabilities/maps/map.component.ts
 D src/app/capabilities/maps/map.schema.ts
 D src/app/capabilities/maps/vocabulary.ts
 M src/app/chat/chat.page.spec.ts
 M src/bootstrap.ts
 M tsconfig.json
?? .zprofile
?? docs/work/m2-nf-split/task-log/task-6-maps-remote-boundaries.md
?? projects/mfe-maps/
?? sheriff.config.ts
?? src/app/app.config.spec.ts
```

### Sessions

- claude-code 11188aa4-3e2c-48fa-835f-a4cd5a39b4c8 (2026-09-18) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/11188aa4-3e2c-48fa-835f-a4cd5a39b4c8.jsonl
- codex 01a0b1af-1fe4-71e2-9282-b5fa111bc0c7 (2026-09-18) — transcript: ~/.codex/sessions/2026/09/18/rollout-2026-09-18T01-23-59-01a0b1af-1fe4-71e2-9282-b5fa111bc0c7.jsonl
