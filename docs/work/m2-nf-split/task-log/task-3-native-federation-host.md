# Task 3: Turn the shell into a Native Federation dynamic host

### Task

Made the shell a Native Federation dynamic host: `ng build`/`ng serve` run through the NF v4
builder, and `main.ts` resolves the manifest plus the `?capabilities=` whitelist, loads the
selected remotes and hands the list to `createAppConfig` behind a dynamic import of
`bootstrap.ts`. The manifest is `{}` and charts/maps stay local, so the app behaves as before.

### Status

DONE — implementation complete, all checks green on the final code (see Test Evidence).
Independent review performed (Codex blind-spot pass, 2026-09-16): hotspot 1 (stalled remote)
was implemented as a pre-flight and then declined by the user with reasons (see Key Decisions),
hotspot 2 (capability shape guard) absorbed, one blind spot promoted to the improvements
register (no durable boot check), one stays an Open Issue for Task 4 (no real remote yet). Not
committed (`/commit 3` pending).

### Files Modified

- `package.json` (modified) — `@angular-architects/native-federation-v4@~21.2.11`,
  `@softarc/native-federation-orchestrator@^4.6.0`, `es-module-shims@^2.8.0` and
  `@angular-devkit/build-angular@21.2.22` (exact pin, see Key Decisions); new `clean` script.
  `postinstall` untouched.
- `package-lock.json` (modified) — 454 packages added, none removed; three patch versions
  moved by dedupe (postcss 8.5.26→8.5.23, qs 6.15.3→6.16.0, range-parser 1.3.0→1.2.1).
- `angular.json` (modified) — schematic rewrite: `build` and `serve` are the NF builder, the
  previous targets became `esbuild` and `serve-original`, `polyfills: ["es-module-shims"]` on
  `esbuild`. By hand: `test.options.buildTarget = "shell:esbuild:development"`; re-indented from
  the schematic's tabs back to two spaces so the diff shows only real changes.
- `federation.config.mjs` (new) — generated (`shareAll`, `denseChunking`); edited: `rxjs/fetch`
  removed from `skip`, with a comment saying why.
- `tsconfig.federation.json` (new) — generated: extends `tsconfig.app.json`, `files: [src/main.ts]`.
- `public/federation.manifest.json` (new) — `{}`.
- `src/main.ts` (modified) — phase one of the bootstrap: `ngDevMode` guard, manifest fetch,
  `selectCapabilities`, `initFederation`, `loadCapabilities`, dynamic `import('./bootstrap')`.
- `src/bootstrap.ts` (new) — phase two: `bootstrap(remotes)` calls
  `bootstrapApplication(App, createAppConfig([...remotes, chartsCapability, mapsCapability]))`.
- `src/app/federation/select-capabilities.ts`, `select-capabilities.spec.ts` (new) — the pure
  whitelist and its four cases.
- `src/app/federation/load-capabilities.ts`, `load-capabilities.spec.ts` (new) — the loader
  with a per-remote module timeout, skip-on-failure, the exposed-module constant
  `CAPABILITY_MODULE = './capability'` and a shape guard that checks what `toFragment` needs;
  seven cases.
- `shared/capabilities/agent-capability.ts` (modified) — the `AgentCapability` doc comment
  names how a remote exposes it (`./capability`, `export const capability`).
- `README.md` (modified) — `npm run clean` row in the script table.
- `docs/improvements.md` (modified) — one register line: no durable boot check of the
  federated shell (promoted from the review's blind spot).

### Files Read (Context Only)

- `docs/work/m2-nf-split/task-log/task-2-runtime-capability-list.md` — the `main.ts` seam,
  the list-order rule for duplicate names, the tsx/prettier gotchas.
- `~/projects/FrankensteinMeetingRoom`: `packages/shell/src/main.ts`, `angular.json`,
  `federation.config.mjs`, `scripts/ng-build.mjs`, `docs/build-modes.md`,
  `src/app/whiteboard-slot.ts` — the host template, the watchdog, the `ngDevMode` rationale.
- `node_modules/@angular-architects/native-federation-v4/src/schematics/init/**` (21.2.12) —
  to predict the schematic's edits; `src/index.js` — the `initFederation` wrapper's defaults.
- `node_modules/@softarc/native-federation-orchestrator` (4.6.1) — `strictRemoteEntry`
  defaults to `false`, so an unreachable remote is logged and skipped at init; no fetch timeout
  anywhere (the only `AbortController` belongs to a web lock); `initRemoteEntry` in
  `createFederationResult` resolves on failure in non-strict mode (read for the rejected
  per-remote-init alternative).
- `node_modules/@angular/build/src/builders/unit-test/{options,builder}.js` — how
  `buildTarget` is derived and what happens with a non-application builder.
- `src/app/app.config.ts`, `shared/capabilities/agent-capability.ts`,
  `shared/capabilities/custom-component.ts`, `.prettierrc`, `eslint.config.js`,
  `src/app/a2ui/assistant-catalog.spec.ts` — signatures, what `toFragment` dereferences, spec
  conventions.

### Key Decisions

— session 2026-09-16

- **Two-phase bootstrap, and why `main.ts` may not import Angular.** NF shares `@angular/*`
  as externals: the emitted chunks keep bare specifiers that the browser resolves only through
  the import map `initFederation` installs at runtime. ES-module linking resolves static imports
  before the first statement runs, so a static `@angular/platform-browser` import in `main.ts`
  fails regardless of any `await` before `bootstrapApplication`. The dynamic
  `import('./bootstrap')` is the boundary behind which Angular is linked. (User asked; the
  comment on `main()` carries the invariant.)
- **`initFederation` from the NF v4 re-export**, not from the orchestrator as the plan sketch
  and the reference host do. The 21.2.12 schematic generates the re-export; its wrapper supplies
  the shim import map, the console logger and the host `remoteEntry` as defaults and passes the
  manifest object through, so the whitelist stays a pure function.
- **Exposed-module contract: `./capability` with a named export `capability`.** Nothing in the
  plan fixed the string; the loader has to choose it now. Exported as `CAPABILITY_MODULE` so
  Task 4's `federation.config.mjs` and the spec share one source.
- **Error semantics.** Manifest fetch fails → `console.error` and boot with the local list (the
  demo must not go dark for a deploy mistake). `initFederation` fails → fatal and logged: without
  the import map `bootstrap.ts` cannot be linked, so there is nothing to fall back to. A remote
  that cannot be loaded or exposes no capability → `console.warn` and skip (T3-AC-02). The
  briefing had lumped init failure with the manifest case; refined during implementation.
- **`loadCapabilities(load, names)` takes `nf.loadRemoteModule`**, not the whole result, so the
  spec runs without the orchestrator. `Promise.allSettled` keeps manifest order, which decides
  duplicate names (Task 2's rule). A small shape guard (`isAgentCapability`) treats a wrong
  export like a failed load — a bad remote must not crash the shell.
- **`selectCapabilities`:** parameter absent → whole manifest; present but empty → `{}`;
  unknown names ignored; names trimmed; result in manifest order, never query order.
- **No build watchdog.** The plan said measure first: `ng build` exits on its own (Test
  Evidence), so `scripts/ng-build.mjs` was not added.
- **`rxjs/fetch` removed from the generated `skip` list.** The browser probe found the only
  runtime failure: `@copilotkit/angular` is shared (it is in `dependencies`) and imports
  `rxjs/fetch`; a skipped subpath has no import-map entry, so the shared chunk could not resolve
  and the app did not boot. Alternative considered: skip `@copilotkit/angular` altogether (host
  only, no remote will import it — the reference's "devDependency" rule). Rejected here: that is a
  sharing-policy decision for Task 6; the one-line un-skip fixes the observed failure.
- **`test.buildTarget` set explicitly** although the run did not break: the unit-test builder
  warns about a non-application builder and then consumes the NF target's options — no `styles`,
  `assets`, `polyfills` — so the tests would have run against the wrong build configuration.
- **npm resolution.** The schematic adds `@angular-devkit/build-angular`, which pins
  `@angular/build` exactly; with `~21.2.22` npm picks 21.2.24 and nests a second
  `@angular/build`, which the NF builder would then import unpatched. Exact pin to 21.2.22 (the
  locked `@angular/build`). Even then a plain install fails: npm's virtual peer set for
  build-angular resolves `@angular/compiler-cli` to 21.2.23 and conflicts with `compiler@21.2.22`
  although the locked 21.2.22 satisfies every range. One `npm install --prefer-dedupe
--legacy-peer-deps` produced a consistent tree; afterwards a plain `npm install` is a no-op
  (Test Evidence). Bumping the CLI trio to 21.2.24 was rejected: framework 21.2.23 vs CLI
  21.2.24 re-triggers the same conflict, and it is a toolchain bump outside the task.
- **`agent/package-lock.json` restored.** The root postinstall runs `npm --prefix agent install`
  and inherits the parent's npm flags, so the flagged install rewrote the agent lock (−5860
  lines). Restored from HEAD and re-verified with a plain agent install; net change none.
- **Kept `@angular-devkit/build-angular`** — a real dependency of the NF builder
  (`src/builders/build/builder.js`), not schematic noise.
- **No cache-buster on the manifest fetch** (the reference has one): the manifest is a static
  asset here; the selection lives in the URL.
- **`async function main()` instead of top-level await** — one catch for the whole phase.
- **`angular.json` re-indented** from the schematic's tabs to the file's two spaces; the diff is
  the target rewrite only.

— session 2026-09-16 (Codex blind-spot review absorbed)

- **Pre-flight with a timeout before `initFederation` (Codex finding taken; superseded
  below).** The orchestrator has no fetch timeout, so a remote that accepts the connection but
  never answers (a dev server still compiling, a foreign service on the port) held the whole
  bootstrap; the first session's browser probe only covered the instant
  `ERR_CONNECTION_REFUSED`. A race around the whole `initFederation` cannot skip one remote —
  without init there is no import map — so a `reachableRemotes` step fetched every selected
  `remoteEntry.json` with `AbortSignal.timeout` (5 s) and dropped the entries that refused,
  timed out or answered non-OK; `loadCapabilities` races each module load against
  `CAPABILITY_LOAD_TIMEOUT_MS = 15_000` and the rejection runs into the existing skip path.
- **Shape guard checks what `toFragment` needs (Codex finding taken; supersedes the first
  session's guard).** `{ name: 'broken', vocabulary: {}, components: {} }` passed the old check
  and `toFragment` then threw inside `createAppConfig`, taking the whole shell down — the
  opposite of the guard's purpose. Now: `vocabulary.components` is an object,
  `vocabulary.functions` an array, and every announced name has a function-typed
  implementation. That is the runtime form of the contract's compile-time invariant, which
  cannot cross the federation boundary. `isObject` became a type predicate and replaces the
  duplicated null check (user review).
- **Import-map check script added, then removed at the user's request.** For the review's
  second blind spot (no durable boot check; the `rxjs/fetch` failure was invisible to tsc, lint
  and the unit tests) a `scripts/check-importmap.mjs` was hooked into `npm run build`. Removed
  again: not requested, and a regex heuristic over build output rather than a parser. The gap
  is registered in `docs/improvements.md`. Worth keeping for whoever writes such a check later:
  the NF-built shared chunks are not whitespace-minified (`import { a } from "x";`), only the
  Angular-built chunks are, so an import scanner has to anchor on statement starts rather than
  on the absence of whitespace.
- **"No parameter = whole manifest" reconfirmed (user question).** T3-AC-03 fixes it; the
  manifest is the deployment's set and the URL narrows it. The demo gesture is additive
  (`?capabilities=charts` → `?capabilities=charts,maps`, reload, the map appears), and a
  "nothing by default" rule would not change that gesture — it would only blank the bare URL
  and hide new manifest entries until someone edits the URL.
- **`./capability` is the shell's convention, not part of the contract types (user question).**
  A remote repeats the literal in its `federation.config.mjs`, which Node evaluates and which
  cannot import the TypeScript constant; hence the doc comment on `AgentCapability` where Task 4
  looks first, while `CAPABILITY_MODULE` stays with its only consumer.

— session 2026-09-16 (Codex hotspot 1 declined)

- **Pre-flight removed; `initFederation(selected)` stays the normal NF initialisation
  (supersedes the pre-flight decision above).** User's call, with reasons: the joint version
  negotiation of all remotes at init is worth more than a shell-side timeout; fetching every
  `remoteEntry.json` twice is not something NF repositories do; a remote that accepts the
  connection and never answers is an edge case, and the pre-flight did not even close it — a
  remote can pass the probe and stall inside `initFederation` a moment later. The module-load
  half of the finding stays: `loadCapabilities` still races each `./capability` load against
  `CAPABILITY_LOAD_TIMEOUT_MS`.
- **Alternative considered and rejected:** `initFederation()` for the host alone, then
  `nf.initRemoteEntry(url, { name, integrity })` per remote raced against a timeout — one fetch
  per remote, no probe window, and a designed API (the NF wrapper's own
  `loadRemoteModule({ remoteEntry })` uses it). Rejected because per-remote dynamic init
  bypasses the orchestrator's joint version negotiation at startup, which matters once remotes
  are built separately (M3 hosting).
- **Accepted residual:** a remote that accepts the connection for `remoteEntry.json` and never
  answers holds `initFederation` until the browser's own network timeout (minutes), after which
  the orchestrator skips it and the boot continues. Refused connections, 404s, failed or stalled
  module loads and unusable exports are all skipped at once.

### Review Focus

- **Behavior claims:** (1) with `{}` in the manifest the app boots and renders the chat page as
  before, in the dev server and in the production build; (2) a manifest entry that refuses,
  answers non-OK, delivers no module within 15 s, or delivers no usable capability is logged and
  skipped, and the app boots with the remaining list; (3) `?capabilities=` only narrows —
  unknown names are ignored, an empty parameter leaves the basic catalog, no parameter means
  every manifest entry, the result keeps manifest order, and nothing unselected is fetched;
  (4) `npm run build` exits on its own and non-zero on a compile error.
- **Plan deviations:** watchdog script → not added → measured no hang (plan's own condition).
  `initFederation` from the orchestrator with explicit options → NF v4 re-export → wrapper
  defaults, same object overload. `loadCapabilities(nf, names)` → `(nf.loadRemoteModule, names,
timeoutMs)` → testable seam, review finding. Not in the plan: `rxjs/fetch` un-skipped →
  runtime failure; `test.buildTarget` set → the plan's conditional, applied because the builder
  warns; exact pin plus install flags → npm conflict; README row; improvements register line.
  Key Locations: `tsconfig.app.json` listed but unchanged (the federation tsconfig extends it).
- **Assumptions / choices:** exposed module `./capability` + named export `capability`; 15 s
  module timeout as a constant; manifest fetch failure continues with the local list, init
  failure is fatal; a stalled `remoteEntry.json` is an accepted residual (user decision);
  `?capabilities=maps,charts` yields charts before maps (manifest order).
- **Scope notes:** `README.md` (+1 row); `docs/improvements.md` (+1 line); lockfile churn is
  additive (454 packages, three patch moves by dedupe); `agent/` net unchanged.
- **Read next:**
  1. `src/app/federation/load-capabilities.ts` — the module timeout and `isAgentCapability`;
     compare the guard with what `toFragment` dereferences.
  2. `src/main.ts` — the phase boundary and the error semantics in 35 lines.
  3. `federation.config.mjs` `skip` block — the `rxjs/fetch` decision, and whether
     `@copilotkit/angular` should be shared at all (Task 6).

### Test Evidence

— session 2026-09-16

- **Build hang measurement** (plan instruction, unwrapped `timeout -k 10 570 npx ng build shell`):
  cold NF cache 15:00:07 → 15:00:19, exit 0; after the config edit 6 s, exit 0; `index.html`,
  `remoteEntry.json`, `importmap.json` written; the bootstrap chunk is emitted as a lazy chunk
  (`chunk-7ZLQ5EOK.js | bootstrap | 17.95 kB`). No hang on NF 21.2.12 + Angular 21.2.22.
- **Compile-error probe:** appended `export const broken: number = 'not a number';` to
  `select-capabilities.ts`; `ng build` → exit 1 after 4 s with `TS2322`. File restored from a
  backup copy; the probe is gone.
- `npx tsc --noEmit` for `tsconfig.app.json`, `tsconfig.spec.json`, `tsconfig.federation.json`
  — 0 errors each. `npm run lint` — "All files pass linting".
- `npm run test:shell` — 21 files, 117 passed (110 + 4 `select-capabilities` + 3
  `load-capabilities`). Run before and after setting `test.buildTarget`; the second run is the
  one that counts (the first went through the builder's unsupported-target path). Overtaken by
  the review edits; see the later markers.
- `npm run test:eval` — 2 files, 18 passed (unchanged).
- `npx prettier --check` on the new and edited files (`main.ts`, `bootstrap.ts`,
  `src/app/federation/*.ts`, `federation.config.mjs`, `package.json`,
  `federation.manifest.json`, `tsconfig.federation.json`) — clean after formatting the two
  generated JSON files. `angular.json` was never prettier-clean and is left alone.
- **Static import-map probe** (script in the session scratchpad, not in the tree): every bare
  specifier in `dist/shell/browser/*.js` has an import-map entry; the two remaining hits
  (`zone.js/plugins/task-tracking`, `root`) sit inside error-message strings. Before the
  `rxjs/fetch` fix the probe listed `rxjs/fetch <- _copilotkit_angular…js`.
- **Browser probes** (Playwright headless Chromium, scripts in the scratchpad, not in the tree).
  Dev server `ng serve shell --port 4200`: (a) manifest `{}` → `app-root` renders
  `APP-CHAT-PAGE` (8456 chars), console shows only the known Geolocation warning; (b) manifest
  `{ "ghost": "http://localhost:4999/remoteEntry.json" }` → same render, console:
  `ERR_CONNECTION_REFUSED` for the remoteEntry, `[NF][6]: Failed to load module
ghost/./capability`, `[shell] capability 'ghost' skipped: remote not loaded`; (c) same manifest
  with `?capabilities=` and with `?capabilities=nope` → renders, no ghost request at all.
  Production build (served from `dist/shell/browser` through Playwright request interception)
  → renders `APP-CHAT-PAGE`, no errors. Before the `rxjs/fetch` fix every scenario failed with
  `[shell] bootstrap failed Error: Unable to resolve specifier 'rxjs/fetch'`. Manifest restored
  to `{}` afterwards; all servers stopped. Probe (b) describes the final code path for a refused
  remote: the pre-flight that briefly sat in front of it is gone again.
- **Lock stability:** after the flagged install, `npm install --ignore-scripts` changes nothing;
  `npm ls` reports nothing invalid, missing or extraneous; single copies of `@angular/build`,
  `@angular-devkit/build-angular`, `@angular/compiler-cli` (21.2.22), NF v4 21.2.12,
  orchestrator 4.6.1, es-module-shims 2.8.4. Plain `npm --prefix agent install` after restoring
  `agent/package-lock.json` → exit 0, `git status agent/` clean.
- No `npm run eval` — nothing model-facing changed.

— session 2026-09-16 (after the review edits: pre-flight, module timeout, guard, contract
comment, check script removed again — overtaken by the next marker where the pre-flight is
removed)

- `npx tsc --noEmit` for the three configs — 0 errors each; `npm run lint` — "All files pass
  linting"; `npx prettier --check` on every touched file — clean.
- `npm run test:shell` — 22 files, 125 passed (117 + 4 `reachable-remotes` + 4 new
  `load-capabilities` cases: module timeout with fake timers, Codex's `{ vocabulary: {} }`
  example, announced component without implementation, accepted capability survives
  `toFragment`).
- **Browser probe of the pre-flight timeout path (historical, code removed):** production build
  via Playwright request interception with `{ ghost: refused, stuck: route never fulfilled }`
  → `ghost` skipped at once, `stuck` skipped after 5 s with `TimeoutError: signal timed out`,
  `APP-CHAT-PAGE` rendered after 9 s. `dist/` manifest restored.
- **Check-script probe (historical, script removed):** with `rxjs/fetch` back in `skip`, the
  interim `scripts/check-importmap.mjs` failed the build with `rxjs/fetch <-
_copilotkit_angular.q0jQ1ruKGe.js`; its first version had missed it because the NF chunks
  keep whitespace in import statements. Config restored, script deleted.

— session 2026-09-16 (final code: pre-flight removed, module timeout and guard kept)

- `npx tsc --noEmit` for `tsconfig.app.json`, `tsconfig.spec.json`, `tsconfig.federation.json`
  — 0 errors each; `npm run lint` — exit 0, "All files pass linting"; `npx prettier --check`
  on `main.ts` and `src/app/federation/*.ts` — clean.
- `npm run test:shell` — 21 files, 121 passed (117 + the 4 new `load-capabilities` cases).
- `npm run build` (`ng build shell`) — exit 0, "Application bundle generation complete".
- No `npm run test:eval`, no `npm run eval` — nothing under `eval/` or model-facing changed
  since the first marker's runs.

### Acceptance Coverage

- **T3-AC-01** — partial — verified by two timed unwrapped builds (exit 0 in 12 s cold and
  6 s warm) and one deliberate compile error (exit 1 in 4 s); no automated guard exists because
  the hang the plan anticipated did not occur.
- **T3-AC-02** — passed — `src/app/federation/load-capabilities.spec.ts` "T3-AC-02: skips a
  remote that cannot be loaded, logs it, and keeps the rest" and "T3-AC-02: skips a remote that
  never delivers its module once the timeout passes" (plus the no-export, broken-vocabulary and
  missing-implementation cases); end to end by browser probe (b) of the first session (refused
  remote → orchestrator skips at init, loader logs the skip, chat page renders). Accepted
  limitation, user decision: a remote that accepts the connection and never answers holds init
  until the browser's network timeout.
- **T3-AC-03** — passed — `src/app/federation/select-capabilities.spec.ts` describe
  "selectCapabilities (T3-AC-03)": absent parameter, empty parameter, unknown name, manifest
  order; at runtime by browser probe (c) of the first session.

### Open Issues

- No remote exists yet, so the loader's happy path is proven with a fake loader only (→ Task 4).
- Sharing policy: `@copilotkit/angular`, `@ag-ui/*` and `zod-to-json-schema` are shared because
  they sit in `dependencies`, although no remote will import them (→ Task 6).
- `docs/architecture.md` still says the list is "decided by whoever bootstraps", which holds;
  the host shape (manifest, whitelist, two phases) is not described yet (→ Task 8).
- Promoted: no durable boot check of the federated shell — a bare import without an import-map
  entry breaks the boot silently, only a browser probe of the build shows it (→ improvements
  register).

### Context for Next Task

- **Contract for a remote:** `federation.config.mjs` `exposes: { './capability': '<module>' }`
  where the module has `export const capability: AgentCapability`; the manifest key is the
  remote name (`"charts": "http://localhost:4201/remoteEntry.json"`). `CAPABILITY_MODULE` in
  `src/app/federation/load-capabilities.ts` is the shell side of that string; the doc comment on
  `AgentCapability` names it for the remote side.
- **What the shell demands of a remote at runtime:** `./capability` arrives within 15 s
  (`CAPABILITY_LOAD_TIMEOUT_MS`) and the export passes `isAgentCapability` — every name in
  `vocabulary.components` has a function in `components`. A remote dev server that compiles on
  its first request has to fit into that window.
- **Signatures:** `selectCapabilities(manifest: FederationManifest, search: string): FederationManifest`;
  `loadCapabilities(load: LoadRemoteModule, names: readonly string[], timeoutMs?): Promise<AgentCapability[]>`;
  `bootstrap(remotes: readonly AgentCapability[])` in `src/bootstrap.ts` — Task 4 drops
  `chartsCapability` from its local list once the remote is in the manifest.
- **Task 5's panel** reads the selection from the URL; `selectCapabilities` is the one place that
  interprets `?capabilities=`, and nothing unselected is fetched.
- **`shareAll` iterates `dependencies` only:** packages the remotes must share (`@angular/*`,
  `@a2ui/*`, `rxjs`, `zod`) have to stay there; host-only packages may move to
  `devDependencies` (Task 6 decision). A `skip` entry for a subpath that a shared package
  imports breaks the boot silently — check the build in a browser after touching
  `federation.config.mjs`.
- **Gotchas:** start the remote dev servers before the shell, or expect `initFederation` to
  wait for a remote that listens but has not answered yet. The NF dev server writes into
  `dist/shell/browser` and removes the last build's `index.html` — build output is valid only
  until the next `ng serve`. `npm run clean` when an `ngDevMode` error appears after switching
  modes. Installing new packages may again need `npm install --prefer-dedupe --legacy-peer-deps`;
  the postinstall inherits those flags, so check `agent/package-lock.json` afterwards. For
  runtime checks, start the dev server and the probe outside the sandbox (a sandboxed server is
  unreachable from other commands); the production build can be probed without a server
  through Playwright request interception.

### Git State

```
$ git diff --stat
 README.md                               |     1 +
 angular.json                            |    79 +-
 docs/improvements.md                    |     1 +
 package-lock.json                       | 20071 ++++++++++++++++++++----------
 package.json                            |     5 +
 shared/capabilities/agent-capability.ts |     3 +-
 src/main.ts                             |    47 +-
 7 files changed, 13534 insertions(+), 6673 deletions(-)

$ git status --short     # sandbox dotfiles and this log omitted
 M README.md
 M angular.json
 M docs/improvements.md
 M package-lock.json
 M package.json
 M shared/capabilities/agent-capability.ts
 M src/main.ts
?? federation.config.mjs
?? public/federation.manifest.json
?? src/app/federation/
?? src/bootstrap.ts
?? tsconfig.federation.json
```

### Sessions

- claude-code e78496c0-d7c5-4840-b315-cec07abf5ac3 (2026-09-16) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/e78496c0-d7c5-4840-b315-cec07abf5ac3.jsonl
- codex 01a0aaa2-93e3-7191-8415-8a88b032d6ff (2026-09-16) — transcript: ~/.codex/sessions/2026/09/16/rollout-2026-09-16T16-32-56-01a0aaa2-93e3-7191-8415-8a88b032d6ff.jsonl
