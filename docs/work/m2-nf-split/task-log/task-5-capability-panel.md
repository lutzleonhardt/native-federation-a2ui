# Task 5: Capability panel — show the loaded remotes and switch them

### Task

Added the capability panel to the chat page: every manifest remote in one of three states (loaded
with origin, components and functions; selected but unreachable; not selected), each with a link
that reloads the app with that remote flipped in `?capabilities=`. The federation outcome now
travels from phase one of the bootstrap into the app as a status list (`CAPABILITY_STATUS`), not
only as the loaded vocabulary.

### Status

DONE — implementation complete, all checks green on the final code (see Test Evidence, both
entries). Independent review performed (Codex quick review, 2026-09-18): no hotspots; of the two
blind spots, the manifest-key ≠ capability-name gap is absorbed (two regression tests), the
reload/production-build gap confirmed as known and deferred (see Key Decisions). Not committed
(`/commit 5` pending). The session also
amended the Task 7 plan block with a prompt defect observed while probing this task (see Key
Decisions, Plan deviations); the amended `plan.md` belongs in this task's commit.

### Files Modified

- `src/app/federation/capability-status.ts` (new) — `CapabilityStatus` (`loaded` |
  `unreachable` | `unselected`), `describeCapabilities(manifest, selected, loaded, originOf)` and
  `loadedCapabilities(statuses)`; framework-free so `main.ts` may import it.
- `src/app/federation/capability-status.spec.ts` (new) — the three-state rule against the real
  `selectCapabilities` reader (no parameter → all selected; empty parameter → none), origin
  handling, order; since the review: the join is by manifest key even when `capability.name`
  differs.
- `src/app/federation/capability-status.token.ts` (new) — `CAPABILITY_STATUS` injection token
  and `provideCapabilityStatus`.
- `src/app/federation/load-capabilities.ts` (modified) — returns `ReadonlyMap<remote,
  AgentCapability>` instead of `AgentCapability[]` so the status composition joins by manifest key.
- `src/app/federation/load-capabilities.spec.ts` (modified) — the seven cases adapted to the Map
  result; order asserted via `[...loaded.keys()]`; since the review: the Map is keyed by remote
  name, not by the capability's own name.
- `src/app/federation/select-capabilities.ts` (modified) — `toCapabilitiesQuery(names)`, the
  writer next to the reader.
- `src/app/federation/select-capabilities.spec.ts` (modified) — round trip writer → reader,
  including the empty selection.
- `src/main.ts` (modified) — composes the status list after loading, origin from
  `nf.adapters.remoteInfoRepo.tryGet(name).get()?.scopeUrl`, passes it to `bootstrap`.
- `src/bootstrap.ts` (modified) — takes the status list; derives the catalog list from it and
  still appends the local `mapsCapability`.
- `src/app/app.config.ts` (modified) — `createAppConfig(capabilities, remotes)` adds
  `provideCapabilityStatus(remotes)`.
- `src/app/chat/capability-panel.component.ts` (new) — the panel: flattens the statuses into
  `PanelEntry` rows (state, origin, component and function names, toggle link and label).
- `src/app/chat/capability-panel.component.html` (new) — one `<li data-state>` per manifest
  entry, `@switch` on the state, `<a [href]>` toggle, `@empty` fallback.
- `src/app/chat/capability-panel.component.spec.ts` (new) — three states rendered, link targets in
  manifest order, last-remote-off → `?capabilities=`, empty manifest.
- `src/app/chat/chat.page.ts`, `chat.page.html` (modified) — imports the panel; placed as the
  header's last row.
- `src/app/chat/chat.page.spec.ts` (modified) — `provideCapabilityStatus(REMOTES)` in
  `renderChat`; one T5-AC-01 test for the panel inside the header.
- `docs/improvements.md` (modified) — one promoted line: the assembled system prompt is not
  observable (dev-only log of `buildInstructions` proposed).
- `docs/work/m2-nf-split/plan.md` (modified) — Task 7 block: the prompt example defect is now an
  observed cause with a fix direction, and `agent/src/prompt.ts` is a fixed key location there.

### Files Read (Context Only)

- `docs/work/m2-nf-split/plan.md` — preamble, Task 5 block; Task 7 block only for the amendment.
- `docs/work/m2-nf-split/task-log/task-4-charts-remote.md` — predecessor (name identity, gotchas,
  probe conventions, deferred architecture doc).
- `node_modules/@angular-architects/native-federation-v4/src/index.d.ts`,
  `@softarc/native-federation-orchestrator/types/lib/core/{init-federation.contract,
  1.domain/remote/remote-info.contract, 1.domain/remote-entry/manifest.contract,
  2.app/driving-ports/*}.d.ts`, `utils/optional.d.ts` — `NativeFederationResult.adapters`,
  `RemoteInfo.scopeUrl`, `Optional.get()`, `RemoteEntryDescriptor` (string or object).
- `~/projects/FrankensteinMeetingRoom/packages/shell/src/app/mermaid-slot.ts`, `src/main.ts` —
  the reference's `remoteInfoRepo.tryGet(...).get()?.scopeUrl` use.
- `shared/capabilities/{agent-capability,custom-component,catalog-function}.ts`,
  `src/app/a2ui/{agent-capabilities.token,catalog-context}.ts`, `projects/mfe-charts/src/
  capability.ts`, `charts/vocabulary.ts` — the vocabulary shape the panel lists.
- `src/app/chat/location-picker.component.{ts,html}`, `src/app/{app,app.routes}.ts`,
  `src/styles.css`, `eslint.config.js`, `angular.json` (shell test/lint targets), `.prettierrc`,
  `tsconfig.json`, `vitest-base.config.ts`, `projects/mfe-charts/src/app/app.spec.ts`.
- `agent/src/prompt.ts`, `agent/src/agent.ts` (grep), `shared/agent-contract.ts`,
  `src/app/agent/tools/render-surface.tool.ts` (grep) — for the Timeline-without-charts question.
- `docs/improvements.md`, `docs/architecture.md` (grep), `README.md` (grep).

### Key Decisions

— session 2026-09-18

- **Toggle as a link, not `location.search = …` (deviates from the plan sketch; approved).**
  `<a [href]="?capabilities=…">` is the same binding model — a full navigation with the new
  query, no in-app selection state — but needs no navigation seam for the spec (assigning
  `location.search` inside a browser-mode test would navigate the runner page), and the two
  shareable links of T5-AC-02 stand literally in the DOM. A batch variant (checkboxes plus one
  Apply link, pending selection in a signal) was offered and declined for now: per-click reload
  matches the plan's "reload is the binding model" and the demo has two remotes. Trade-off made
  visible: every reload discards the chat transcript; with Apply it would be once per change.
- **`loadCapabilities` returns `ReadonlyMap<remote, capability>` instead of a list.** The states
  must hang on the manifest key; joining by the remote's self-declared `capability.name` would
  show a remote with a differing name as unreachable while its components sit in the catalog.
  The loader still logs and skips exactly as before; absence in the Map is the signal.
- **Both skip reasons map to `unreachable` (user question).** A rejected/timed-out load and a
  module without a usable `capability` export both leave the name out of the Map and become
  `unreachable`; the reason stays in the console warning. Showing the reason in the panel would
  need per-remote outcomes instead of the Map — not required by the plan's three states.
- **Composition in phase one (`main.ts`), framework-free.** `describeCapabilities` lives in
  `src/app/federation/capability-status.ts` and imports only types, so the pre-Angular bootstrap
  may import it; the token file next to it is the only Angular-dependent file in that folder,
  the same split as `a2ui/agent-capabilities.token.ts`.
- **"No parameter" vs "empty parameter" (user question).** The panel never reads the URL; it
  gets `selected`, the reader's output. Without `?capabilities=` every manifest entry is selected
  (loaded or unreachable, never unselected); `?capabilities=` selects none. Switching the last
  active remote off therefore writes `?capabilities=` on purpose — the whitelist is the only
  truth and "empty" means empty. Pinned by `capability-status.spec.ts` and the panel spec.
- **`origin` is `string | undefined`, no fallback to the manifest URL.** An NF v4 manifest value
  may be an object with integrity, and an invented origin would be a lie; the panel then shows
  "loaded" without "from …". In practice a loaded remote always has its `RemoteInfo`.
- **`createAppConfig(capabilities, remotes)` — two arguments during the transition.** The first
  (catalog list incl. the local maps) is derivable from the second once maps is a remote; kept
  separate now so the "capability list is an argument, not an import" rule stays in `bootstrap.ts`
  (→ Task 6 may collapse it).
- **Explicit provider in specs, no default factory on the token.** A ChatPage spec without
  `provideCapabilityStatus` fails with a NullInjectorError naming the token — preferable to a
  silent empty panel; consistent with `AGENT_CAPABILITIES`.
- **Flattened `PanelEntry` view model.** The template needs no union narrowing (`@switch` on
  `state`, precomputed component/function name strings, `toggleHref`, `toggleLabel`); the flip
  logic (`toggled`) keeps manifest order by filtering the status list, not by editing a set.
- **Panel as the header's last row** (`flex-basis: 100%`), not literally beside the location
  picker: a full-width item between picker and example buttons would push the buttons into a
  third row. Screenshot checked.
- **Origin rendered as plain text.** Prettier's Angular parser reflows an inline `<code>` inside
  `<span>` into an unreadable `<span\n>…</span\n>`; the origin is plain text in the span.
- **Probe of the unreachable state by aborting requests, not by stopping the server.** The user's
  `npm start` (4200/4201/3001) was running; Playwright's `page.route('http://localhost:4201/**',
  abort)` reproduces "server down" from the browser's view (NF logs `Remote 'charts' is not
  initialized`, the loader skips, the panel shows unreachable).
- **Timeline without charts is a prompt defect, not a shell defect (user observation).** With
  `?capabilities=` the shell announces only `Map` and `distance` (captured request), yet the model
  rendered a `Timeline` and the shell rejected it (`catalog`, one correction run, text list).
  Cause: the static examples in `FORMAT_RULES` of `agent/src/prompt.ts` show `Timeline`
  (request 2) and `Map`/`Gauge`/`daysUntil`/`distance` (request 3) regardless of the loaded
  vocabulary, ~70 lines above the "use only components listed below" rule. Recorded in the Task 7
  block (user decision: amend the existing task rather than add one): rewrite both examples with
  basic-catalog components, let the catalog descriptions carry the custom components, generate
  examples only if the default-set verdicts drop; no extra AC for the maps-only mirror case (five
  more model runs per eval; the live moment is charts-only). Also answered: the assembled system
  prompt never travels over the AG-UI stream; DevTools shows only its ingredients
  (`context[0].value` in the run request's payload).

— session 2026-09-18 (Codex quick review absorbed)

- **Manifest-key join guarded by tests (Codex blind spot taken).** The Map decision exists only
  for the case where a remote's `capability.name` differs from its manifest key, and no test showed
  that case; a rewrite back to a list joined by `capability.name` would have stayed green. Two
  cases with `name: 'chart-widgets'` under the key `charts` now pin it: the loader keys the result
  by remote name (`load-capabilities.spec.ts`), and `describeCapabilities` reports `charts` as
  loaded with that capability (`capability-status.spec.ts`).
- **Reload and production build left as recorded (Codex blind spot, deferred).** A navigation in
  a Vitest browser-mode test would take the runner page with it, so T5-AC-02 stays partial with
  the probes as evidence. The diff adds no dependency and no import across the federation
  boundary (`main.ts` takes only types from `capability-status.ts`), and an `ng build` next to the
  user's running `ng serve` risks the mixed-mode NF cache Task 4 documented; the boot smoke test in
  the improvements register is the durable answer.

### Review Focus

- **Behavior claims:** (1) Every manifest key renders exactly one row whose `data-state` is
  `loaded`, `unreachable` or `unselected`, and a loaded row names the components and functions
  its capability announced plus the orchestrator's scope URL. (2) Each row's link is
  `?capabilities=<selection with this remote flipped, manifest order>`; flipping the last selected
  remote yields `?capabilities=` (none), never the bare URL (all). (3) The catalog and model
  context are unchanged: `AGENT_CAPABILITIES` still holds loaded remotes then local maps. (4) The
  panel's rows follow the manifest keys even when a remote's `capability.name` says otherwise.
- **Plan deviations:** toggle as `<a href>` instead of a `toggle()` method assigning
  `location.search` (same reload model, testable, links visible) · `loadCapabilities` return type
  changed to a Map (not named in the plan; needed for a key-based join) · panel is the header's
  last row rather than beside the picker (layout) · Task 7 block amended with the observed prompt
  defect and its fix direction (user decision, outside Task 5's block).
- **Assumptions / choices:** the manifest key is the panel's display name (charts, maps); a
  loaded remote whose `RemoteInfo` is missing shows "loaded" without an origin; both loader skip
  reasons are one state; `?capabilities=` (empty) is a legitimate shareable link meaning "none".
- **Scope notes:** `chat.page.spec.ts` gains a `REMOTES` fixture and one provider line for every
  ChatPage spec; `load-capabilities.spec.ts` assertions rewritten for the Map; `plan.md` Task 7
  edited; two failure screenshots that the first (red) test run wrote under the gitignored
  `src/app/chat/__screenshots__/` were deleted again; two regression tests added after the Codex
  review, no production code changed by it.
- **Read next:** `src/app/federation/capability-status.ts` (`describeCapabilities` — the
  three-state rule in eleven lines) · `src/app/chat/capability-panel.component.ts` (`toggled` —
  flip in manifest order; the empty-selection case) · `src/main.ts` (composition and the
  `remoteInfoRepo` origin lookup).

### Test Evidence

— session 2026-09-18

- `npx tsc --noEmit -p tsconfig.app.json` and `-p tsconfig.spec.json` — 0 errors; `npx ng lint
  shell` — "All files pass linting".
- `npm run test:shell` — 20 files, 117 passed (Task 4: 18 files, 104; new: 6 `capability-status`,
  4 `capability-panel`, 2 `toCapabilitiesQuery`, 1 chat-page). First run had 2 failures from
  double whitespace in the loaded-state markup ("loaded  from"); fixed by restructuring the
  `@if` around the whole phrase, then green. `npm run test:charts` — 4 files, 18 passed;
  `npm run test:eval` — 2 files, 18 passed (both untouched by this task, run for completeness).
- `npx prettier --check` clean on every new or changed file except `chat.page.spec.ts`, which
  keeps its pre-existing drift (Task 4 decision); verified that none of this task's hunks appear in
  prettier's diff of that file.
- **Panel probe** (Playwright headless Chromium against the user's running `npm start`; script
  `probe-panel.cjs` in the session scratchpad, not in the tree; screenshots there too):
  (a) `http://localhost:4200/` → one row, `data-state="loaded"`, text
  `charts loaded from http://localhost:4201/ components: Gauge, Timeline functions: daysUntil
  Switch off`, href `?capabilities=`, 2 requests to 4201.
  (b) click → navigation to `/?capabilities=`, row `unselected`, "not selected", link
  "Switch on" → `?capabilities=charts`, 0 requests to 4201.
  (c) click → `/?capabilities=charts`, row `loaded` again.
  (d) all `http://localhost:4201/**` requests aborted, open `/?capabilities=charts` → row
  `unreachable`, "selected, but unreachable", link "Switch off" → `?capabilities=`; console:
  `ERR_CONNECTION_REFUSED`, `[NF][6]: Failed to load module charts/./capability`, `[shell]
  capability 'charts' skipped: remote not loaded`. No page errors in (a)–(c) beyond the usual
  denied-geolocation warning.
- **Context probe** (`probe-context.cjs`, scratchpad; the run request to 3001 captured and
  aborted before the agent, no model call): with `?capabilities=` the shell sends
  `context` = [`A2UI Custom Catalog`, `User location (me)`], announced components `['Map']`,
  functions `['distance']`, tools `findConferences`, `renderSurface`, `messageWidget`. The user's
  own DevTools payload confirmed the same. Both probes are gone from the tree (they never entered
  it).
- Not probed: the production build (`ng build` + static serve); the dev servers rebuilt on change
  and served the final code, but the NF artifact-cache pitfalls of Task 4 apply to a fresh build.

— session 2026-09-18 (after the review fix)

- Codex re-verified independently on the pre-fix code: 117 shell tests in 20 files, `git diff
  --check` clean.
- After adding the two manifest-key tests: `npx tsc --noEmit -p tsconfig.spec.json` — 0 errors;
  `npx prettier --write` on both spec files — unchanged; `npm run test:shell` — 20 files,
  119 passed; `npx ng lint shell` — "All files pass linting". No production file changed since the
  first entry's runs.

### Acceptance Coverage

- **T5-AC-01** — passed — `src/app/chat/capability-panel.component.spec.ts` "T5-AC-01: lists every
  manifest remote in its state, with what a loaded one contributed" (three states, components
  `Gauge, Timeline`, functions `daysUntil`, origin); `src/app/federation/capability-status.spec.ts`
  describe "describeCapabilities (T5-AC-01)" (state rules against the real reader);
  `src/app/chat/chat.page.spec.ts` "T5-AC-01 the header carries the capability panel with the
  loaded charts remote". End to end by probes (a), (b), (d) — the unreachable case via a
  simulated refusal, not a stopped server.
- **T5-AC-02** — partial — the link targets and the writer → reader round trip are automated
  (`capability-panel.component.spec.ts` "T5-AC-02: every toggle is a link …" and "… switching the
  last selected remote off selects none explicitly"; `select-capabilities.spec.ts` describe
  "toCapabilitiesQuery (T5-AC-02)"). The reload itself is browser behavior of an `<a href>`, proven
  by probes (b) and (c) (navigation to `/?capabilities=` and `/?capabilities=charts`) and by the
  user's own browser, not by an in-tree test.

### Open Issues

- `createAppConfig` carries two arguments while maps is local; once maps is a remote the catalog
  list is derivable from the status list (→ Task 6).
- The prompt's static examples contradict the vocabulary rule when a capability is off; the
  Task 7 block now carries the observed case and the fix direction (→ Task 7).
- `docs/architecture.md` describes neither the host shape nor the panel and status list
  (→ Task 8, which refreshes the doc as a whole).
- Promoted: the assembled system prompt is observable nowhere — it is built per run on the agent
  server and never travels over the AG-UI stream; a dev-only log of `buildInstructions`' result
  would have answered the Timeline question in seconds (→ improvements register).

### Context for Next Task

- **Task 6 (maps remote):** the panel needs no change — a `maps` manifest entry appears as a row
  automatically, and the "selected but unreachable" state is what the plan wants verified with the
  maps server down (probe (d)'s `page.route(..., abort)` reproduces that without stopping a
  server). In `src/bootstrap.ts` drop `mapsCapability`; then `createAppConfig` can take the status
  list alone and derive the catalog list (`loadedCapabilities`). Shell specs: `chat.page.spec.ts`
  imports `capability as mapsCapability` from the remote's source (Task 4 recipe) and may add a
  maps row to `REMOTES`. Links to share after Task 6: `/?capabilities=charts` (before) and
  `/?capabilities=charts,maps` or the bare URL (after).
- **Interfaces:** `CapabilityStatus` (`capability-status.ts`), `describeCapabilities(manifest,
  selected, loaded: ReadonlyMap, originOf)`, `loadedCapabilities(statuses)`;
  `loadCapabilities(load, names, timeoutMs?) → ReadonlyMap<string, AgentCapability>`;
  `toCapabilitiesQuery(names) → '?capabilities=a,b'`; token `CAPABILITY_STATUS` /
  `provideCapabilityStatus`; `createAppConfig(capabilities, remotes)`; `bootstrap(remotes)`.
- **Gotchas:** the user's `npm start` may be running — `ss -ltnp` outside the sandbox first; it
  rebuilds on change, so the served code is current. A failing browser-mode test writes a PNG
  under `src/app/chat/__screenshots__/<spec>/` (gitignored) — delete after fixing. Prettier's
  Angular parser mangles inline `<code>` inside `<span>`; keep such text plain or on its own
  element. `chat.page.spec.ts` stays prettier-dirty by decision; check only your own hunks.

### Git State

```
$ git diff --stat
 docs/improvements.md                           |  1 +
 docs/work/m2-nf-split/plan.md                  | 16 ++++++++----
 src/app/app.config.ts                          | 13 ++++++++--
 src/app/chat/chat.page.html                    |  1 +
 src/app/chat/chat.page.spec.ts                 | 22 +++++++++++++++++
 src/app/chat/chat.page.ts                      |  3 ++-
 src/app/federation/load-capabilities.spec.ts   | 34 +++++++++++++++++++-------
 src/app/federation/load-capabilities.ts        | 12 ++++-----
 src/app/federation/select-capabilities.spec.ts | 17 ++++++++++++-
 src/app/federation/select-capabilities.ts      |  5 ++++
 src/bootstrap.ts                               |  7 +++---
 src/main.ts                                    | 10 +++++++-
 12 files changed, 113 insertions(+), 28 deletions(-)

$ git status --short     # sandbox dotfiles omitted
 M docs/improvements.md
 M docs/work/m2-nf-split/plan.md
 M src/app/app.config.ts
 M src/app/chat/chat.page.html
 M src/app/chat/chat.page.spec.ts
 M src/app/chat/chat.page.ts
 M src/app/federation/load-capabilities.spec.ts
 M src/app/federation/load-capabilities.ts
 M src/app/federation/select-capabilities.spec.ts
 M src/app/federation/select-capabilities.ts
 M src/bootstrap.ts
 M src/main.ts
?? docs/work/m2-nf-split/task-log/task-5-capability-panel.md
?? src/app/chat/capability-panel.component.html
?? src/app/chat/capability-panel.component.spec.ts
?? src/app/chat/capability-panel.component.ts
?? src/app/federation/capability-status.spec.ts
?? src/app/federation/capability-status.token.ts
?? src/app/federation/capability-status.ts
```

### Sessions

- claude-code 547e61aa-3677-4181-8b86-935671747264 (2026-09-18) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/547e61aa-3677-4181-8b86-935671747264.jsonl
- codex 01a0b1a8-932b-76e2-a938-e46f15328758 (2026-09-18) — transcript: ~/.codex/sessions/2026/09/18/rollout-2026-09-18T01-16-50-01a0b1a8-932b-76e2-a938-e46f15328758.jsonl
