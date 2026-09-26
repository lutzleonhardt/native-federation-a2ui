# Task 1: Reserve handler and ConferenceStore

### Task

Request 4's click path without the model: a `reserve` action records the reservation in a new
`ConferenceStore` and patches `remaining` at the conference's two fixed homes (`/filteredConfs`
entry, `/selectedConf`) in every live surface; the selection path is fixed and client-owned at the
`renderSurface` boundary; every surface rendered later mounts the reduced count.

### Status

DONE — implementation and task-local verification complete (`npm run test:shell` 21 files /
135 tests and `npm run test:eval` 4 files / 30 tests green on the final code, ESLint and
`sheriff verify` clean). A Codex quick review (2026-09-26) reported three findings, all fixed
below, and two blind spots: the end-to-end chat flow is now covered by a chat-page spec; the eval
contract stays with Task 4 by decision. The plan's quick functional check against the live agent was run by the user
(2026-09-26): reserving on the detail card lowers the gauge, a later answer's card starts from the
reduced count (screenshots: `ng-atlas Munich` at 0 / 500 on both cards).

### Files Modified

- `src/app/domain/conference.store.ts` (new) — `ConferenceStore` (`providedIn: 'root'`, one
  signal: a count per conference id), `reserve(id)` returns the tickets left or `undefined` for an
  id no conference has; `applyReservations(confs, counts)` as a pure function beside it.
- `src/app/domain/conference.store.spec.ts` (new) — count, clamp at zero, unknown id,
  `applyReservations` pass-through and clamp.
- `src/app/a2ui/reserve-handler.ts` (new) — `provideReserveHandler()`: an environment
  initializer subscribes to `A2uiActionBus` for the app's lifetime; the handler reserves, then
  writes one `updateDataModel` per home of the conference — its `/filteredConfs` entry (index by
  id) and `/selectedConf` when it holds the id — in every live surface (`remainingUpdates` over
  `surfaceGroup.surfacesMap`), through `renderer.processMessages`.
- `src/app/a2ui/surface-host-rules.ts` (modified) — `selectedConf` joins `CLIENT_OWNED_SEGMENTS`;
  `LIST_PATH`/`SELECTION_PATH` constants; `findSelectionPathViolations` (a `selected` binding
  must address `/selectedConf`, a `reserve` context id `/selectedConf/id`). Shared with the eval
  scorer by design; the scorer's own selection handling is Task 4's.
- `src/app/a2ui/reserve-handler.spec.ts` (new) — browser-mode spec through the real renderer:
  Gauge on the selection, Text on `/filteredConfs/1/remaining`, the reserve Button; two clicks,
  zero stays zero, an object elsewhere with the same id untouched, two live surfaces updated by
  one click, other action names and unknown ids.
- `src/app/agent/surface-data.store.ts` (modified) — `confs` is now
  `applyReservations(result().confs, conferenceStore.reservations())`; both signals read in the
  `computed` itself.
- `src/app/agent/tools/render-surface.tool.ts` (modified) — `validateRenderRequest` applies
  `findSelectionPathViolations` (code `invalid_messages`, issues name `/selectedConf`);
  `createClientDataMessages` mounts copies of the conferences (the renderer's data model patches
  mounted objects in place, so the store's objects must not cross the boundary) and always pre-sets
  `/selectedConf` — `writesFirstSegment` is gone, the model can no longer write the selection.
- `src/app/agent/tools/render-surface.tool.spec.ts` (modified) — `createMsg(surfaceId)` takes an
  id; `/selectedConf` in the forbidden-write loop; T6-AC-05's "keeps the model's own
  `/selectedConf` write" flipped to "rejects"; three selection-path cases (`selected` at `/pick`
  rejected, reserve context `/pick/id` rejected, `/selectedConf` accepted); T1-AC-03: after a
  reservation and a renderer patch on the first surface, a second surface from the same result
  mounts exactly `remaining − 1` and the store's object is untouched.
- `src/app/chat/chat.page.spec.ts` (modified) — `renderChat` installs `provideReserveHandler()`
  as `createAppConfig` does; new T1-AC-03 end-to-end case through the real chat: request 3 →
  reserve click drops the gauge → request 3 again → the new surface starts from the reduced count,
  four agent runs, no `fetch`.
- `docs/work/m3-reserve-maps-hosting/plan.md` (modified) — T1-AC-04 amended to the fixed
  selection path; amendment notes under Task 4 (prompt line, scorer, typed field list, prompt-4
  wording pinned through the existing filters) and Task 6 (be honest about what can be asked).
- `docs/improvements.md` (modified) — two register entries promoted from this task's live check:
  no conference by name or city, no listing of the user's own reservations.
- `src/app/app.config.ts` (modified) — `provideReserveHandler()` in `createAppConfig`, so chat
  and playground share the subscription.

### Files Read (Context Only)

- `src/app/a2ui/action-bus.ts`, `provide-a2ui-catalog.ts`, `agent-capabilities.token.ts`,
  `surface-host-rules.ts` (`isRecord`, reused), `renderer-integration.spec.ts` (browser-mode
  pattern), `src/app/playground/playground.ts` (subscribe-with-`DestroyRef` pattern).
- `src/app/agent/tools/find-conferences.tool.ts` (where the store result is set),
  `src/app/domain/conference.ts`, `find-conferences.ts`, `location.store.ts` + spec.
- `src/app/chat/chat.page.spec.ts` (`requestThreeSurface`, the reserve Button shape),
  `projects/mfe-maps/src/maps/map.component.spec.ts` (T5-AC-04 action shape, click helper),
  `projects/mfe-charts/src/charts/gauge.component.html` (`.cf-gauge-value`),
  `src/app/app.config.spec.ts`, `sheriff.config.ts`, `eslint.config.js`.
- `agent/src/prompt.ts` (the `reserve` event rule, lines 120–127), `eval/score.ts`
  (`hasReserveButton`).
- `node_modules/@a2ui/web_core/src/v0_9/state/data-model.js` (`set` mutates in place, `get('/')`
  is the root), `state/surface-model.js` (`dispatchAction`), `@a2ui/angular` `ButtonComponent`
  (`handleClick` → `DataContext.resolveAction`) and `TextComponent` (`text = … || ''`).
- `docs/how-it-works.md` "Data stays in the browser" (for the doc check below).

### Key Decisions

- **Two stores, not one.** Reservations are user-owned state that survives every new tool result;
  `SurfaceDataStore.result` is replaced on every `findConferences`. Two lifecycles, two reasons to
  change. Merging would also make `a2ui/` import from `agent/` while `agent/` already imports
  `a2ui/surface-host-rules` — a cycle between the folders. The store knows `CONFERENCE_RECORDS`
  for the id check, which is domain knowledge and sits in `domain/`.
- **Signals read at the `computed`, pure function below (user clarification).** Angular tracks any
  signal read during a `computed`, however deep the call. That is legal but hides the dependency;
  the convention here is: signals are read where the dependency should be visible, transformations
  take values. Hence `reservations` is exposed as a read-only signal and `applyReservations` is a
  pure function with an explicit counts argument, instead of a store method that reads the signal.
- **`reserve(id)` returns the tickets left or `undefined`.** The plan's "unknown id is logged and
  ignored" needs one place that knows the data set; the store is that place, so the handler has one
  check. An unknown id records nothing. Consequence: test fixtures use real ids from
  `conferences.json` (`ng-forge-berlin`, `ng-atlas-munich`, `web-lantern-amsterdam`).
- **The count grows past the last ticket; readers clamp at zero.** The plan's one-rule variant
  ("reserve adds one; applyReservations never below zero"); `reserve` clamps its return the same way.
- **One truth, one projection (user question).** The store is the source; a surface's data model
  is a copy the renderer owns — as `/filteredConfs`, `/me`, `/selectedConf` already are at mount
  time. The flow is one-way, store → surface, at two moments: the mount (all values, via
  `confs()`) and the click (one field, via the handler). Nothing reads back from a surface. A
  reactive re-mount was rejected: the surface holds state the store does not know (the Map click
  writes the selection into `/selectedConf`, the model writes its own values), which a re-mount
  would overwrite.
- **Every live surface showing the conference is written, not only the clicked one (user
  decision, 2026-09-26; supersedes the plan's "the surface the action came from").** The frozen
  variant was weighed first — older surfaces keep their `/me` and their list, and tool results in
  an agentic chat do not change after the fact — and each of its consequences needed another hint:
  a reserve click on an older surface would jump to the store's count (68 → 64), its button would
  have to be disabled, and its stale number labelled. What decided it: the criterion "was the
  value part of what was read?" Text and structure of an answer are the record and never change.
  `remaining` never was: the model does not see it (`findConferences` returns count, id, name,
  city, date), so no sentence becomes false; older surfaces already change today (a Map click
  writes `/selectedConf` and the old detail view re-renders — an M1 decision); and
  `updateDataModel` on a live surface is the protocol's normal case. Rule for the docs: what
  answered a request (list, location) stays with that answer; what the user changes on shared
  state shows in every surface. No disabled buttons, no labels. Mount copies stay: surfaces are
  physically separate data models, kept equal by messages, never by shared objects.
- **Copies at the mount boundary.** `DataModel.set` assigns into the mounted object
  (`current[lastSegment] = value`). Without copies, the handler's write on `/selectedConf/remaining`
  mutates the object inside `SurfaceDataStore.result`, and a second surface rendered from the same
  result gets `applyReservations` on an already-reduced value: 68 → 67 on screen, 66 in the next
  surface. Found through the failing spec (the module-level fixture object was mutated between
  assertions), fixed where store data enters the renderer, one comment there.
- **The handler is a function, not a service.** Installed once by an environment initializer;
  `A2uiRendererService` is created at boot instead of at the first surface — its constructor is
  pure and root-scoped, the same instance either way. `DestroyRef.onDestroy(unsubscribe)` mirrors
  the playground pattern and keeps TestBed environments clean.
- **The selection has one fixed, client-owned home (user decision, 2026-09-26; supersedes the
  plan's id search across the data model).** The plan let the model choose the selection path
  and had the handler find the conference by id wherever it sat. The user found that fragile:
  ids are keys per type, a future type sharing an id string would be patched, and a search
  where two fixed writes would do. Weighed and dropped on the way: a shape check on the match
  (`id` + numeric `remaining`/`capacity` — honest but still a search), a catalog function
  resolving `byId(/filteredConfs, /selectedId)` in every binding (normalises the document but
  moves the resolution into the model's work per field; worth it only with a whole-conference
  component, register 46), and hard-coding `/selectedConf` in the handler alone (a model choosing
  `/pick` would get a reserve button that silently does nothing). Decided: the client owns the
  paths, the model owns the structure — `/selectedConf` joins `/filteredConfs`, `/me` and the
  grouped rows as a client-owned name. Enforced at the `renderSurface` boundary in both respects:
  the name (a `selected` binding or reserve context elsewhere is rejected with a correction naming
  `/selectedConf`) and the content (a model write to `/selectedConf` is a forbidden write; the
  client always pre-sets it). The handler then writes two fixed homes. The prompt already says
  "`/selectedConf` is pre-set by the client to the first result"; the one line making the name
  mandatory rides on Task 4's planned eval run, see the plan amendment there.
- **The model knows the conference fields only by example.** No field list exists: the prompt's
  examples show name, city, price, date, id; `remaining`/`capacity` reach the model through the
  Gauge schema description in the charts remote; the `findConferences` description names only the
  mount path. Decided (user, 2026-09-26): Task 4 adds the field list to that description, with a
  drift test against `ConferenceRecord`; the plan's Task 4 note carries the instruction.
— review pass 2026-09-26 (Codex quick review)

- **Fixed finding: `warnIgnorred` in `reserve-handler.ts:38` (HIGH).** The file carried a
  misspelt call that broke the build; its mtime was later than the last green run recorded
  above, so that run did not cover this state. Corrected, suites re-run (134 / 30 green).
- **Fixed finding: relative selection paths passed the rule (MEDIUM).** `addresses()` compared
  segments only, so `selectedConf/id` counted as `/selectedConf/id`; inside a `List` template the
  renderer resolves a relative path against the item (`/filteredConfs/0/selectedConf/id`), the id
  resolves to `undefined` and reserve does nothing. Bindings must now be absolute (leading slash;
  a trailing slash stays tolerated, as the data model tolerates it). Regression test with a
  `List` template over `/filteredConfs` and a relative `selected` on a `Map`.
- **Fixed finding: the log misstated the plan (LOW).** It claimed the plan named only the tool's
  spec; the plan listed `render-surface.tool.ts` as a key location (without planning a change to
  it). Sentence corrected in Plan deviations.
- **Blind spot, deferred to Task 4: the eval scorer still accepts any selection path.** The
  scorer cannot be tightened before the prompt states the rule — a gate run in between would fail
  model output the prompt still permits — so scorer and prompt move together on Task 4's planned
  run. Until then, green evals do not attest the selection rule; the shell boundary does.
- **Closed blind spot: the end-to-end chat flow is now a spec (user approved).** The tool spec's
  T1-AC-03 drives store and renderer directly; `chat.page.spec.ts` now plays the real flow with the
  `MockAgent` over four runs (find, render, find, render): the reserve button of the rendered
  surface drops its gauge, the next answer's surface starts from the reduced count, both surfaces
  stay in the transcript, no request leaves the browser. `renderChat` gained
  `provideReserveHandler()`, mirroring `createAppConfig`.
- **The basic `Text` renders a bound 0 as an empty element** (`text = props.text.value() || ''`,
  already in the improvements register from the `distance` finding). The handler spec therefore
  asserts the list entry through the data model at zero and on screen above zero; the gauge shows
  0 correctly.

### Review Focus

- **Behavior claims:** (1) A reserve click lowers `remaining` at the conference's `/filteredConfs`
  entry and at `/selectedConf` when it is the selection, in every live surface, and records the
  reservation; `fetch` is never called; an object elsewhere carrying the same id is untouched.
  (4) A surface that binds `selected` or the reserve context anywhere but `/selectedConf`, or
  writes `/selectedConf` itself, is rejected before a message is applied, with a correction that
  names the path. (2) Every surface rendered later mounts the reduced
  count, and a renderer patch on a live surface never reaches the store's objects. (3) Other action
  names leave store and surface untouched; an unknown or non-string id is logged once and ignored.
- **Plan deviations:** `applyReservations(confs)` as a store method → pure function
  `applyReservations(confs, counts)` with `ConferenceStore.reservations` exposed as a signal → the
  dependency is visible at the `computed`. `reserve(id)` "adds one" → returns `number | undefined`
  and records nothing for an unknown id → the handler's unknown-id rule needs the data set, which
  the store owns. "Update the surface the action came from (`action.surfaceId`)" → every live
  surface that holds the id (`surfacesMap`) → shared state the browser owns is shown the same
  everywhere, see Key Decisions. "Search by id across every top-level entry" and T1-AC-04 "a
  selection path other than `/selectedConf` updates the same way" → two fixed homes and the
  selection path fixed and client-owned at the boundary; T1-AC-04 rewritten in the plan
  (amended 2026-09-26), T6-AC-05's model write of `/selectedConf` (scope m2-nf-split) flips to
  rejected → see Key Decisions; the prompt/scorer half is handed to Task 4 by a plan note. The plan
  listed `render-surface.tool.ts` as a key location but planned no change to it ("extend the
  spec with one case") → it changed (copies at the mount, always pre-set, the selection rule) →
  see Key Decisions; `surface-host-rules.ts` was not named at all → changed (the selection rule,
  `selectedConf` client-owned).
- **Assumptions / choices:** a `reserve` action without a string id is logged like an unknown
  id; the playground's static surfaces are live surfaces too and would be patched if they held a
  matching id at a fixed home (they do not); until Task 4 changes the prompt, a model that names
  the selection differently gets a boundary correction instead of a silent non-updating button.
- **Scope notes:** `render-surface.tool.ts` copies only the conference objects, not `/me` or the
  grouped rows — nothing writes into those. Failure screenshots from the red runs
  (`src/app/a2ui/__screenshots__/reserve-handler.spec.ts/`, gitignored) were deleted.
- **Read next:** `src/app/a2ui/surface-host-rules.ts` `findSelectionPathViolations` and
  `CLIENT_OWNED_SEGMENTS` (the rule that makes the fixed paths safe — shared with the eval
  scorer); `src/app/a2ui/reserve-handler.ts` `remainingPathsOf` (two fixed homes, index by id); `src/app/agent/tools/render-surface.tool.ts`
  `createClientDataMessages` (the copy and its comment — the invariant this task discovered);
  `src/app/domain/conference.store.ts` (`reserve`'s return contract).

### Test Evidence

- `npm run test:shell` (outside the sandbox, ChromiumHeadless) on the final code, after the
  review fixes and the chat flow spec: `Test Files 21 passed (21)`, `Tests 135 passed (135)`. New:
  `conference.store.spec.ts` (5), `reserve-handler.spec.ts` (5), `render-surface.tool.spec.ts` +5
  (T1-AC-03, three selection-path cases, the relative-path regression; T6-AC-05 flipped),
  `chat.page.spec.ts` +1 (T1-AC-03 end to end). Earlier green runs (129 single-surface handler,
  130 id search, 133 before the review fixes, 134 before the chat spec) are overtaken.
- `npm run test:eval` (tsc + vitest, node), same state: `Test Files 4 passed (4)`, `Tests 30
  passed (30)` — the scorer shares `surface-host-rules.ts`; `selectedConf` in
  `CLIENT_OWNED_SEGMENTS` and the absolute-path rule break none of its cases (it does not call
  `findSelectionPathViolations` yet, Task 4).
- Probe (gone): with the mount copy stashed, `render-surface.tool.spec.ts` T1-AC-03 fails with
  `expected 40 to be 41` — the second surface double-reduces. The copy was restored, the probe's
  failure screenshot deleted.
- `npx eslint` on the eight changed files: clean. `npx sheriff verify`: all projects validated.
- Earlier runs, overtaken by later edits: run 1 failed to compile (`id` typed `unknown` after the
  `remaining` guard — restructured into two guards). Run 2: three handler-spec failures — the
  fixture object `SELECTED` was mounted by reference and mutated in place by the handler's writes,
  so the expectations moved (`expected '67' to be '66'`, `expected '1' to be '0'`); this exposed
  the production aliasing fixed in `createClientDataMessages`. Run 3: one failure — the basic
  `Text` shows '' for a bound 0; the spec now reads the list entry from the data model at zero.
- Quick functional check with the live agent, run by the user (2026-09-26): Reserve on the
  detail card drops the gauge; a later request's card starts from the reduced count (both cards
  show `ng-atlas Munich` at 0 / 500). "I want to reserve a ticket for the conference in Munich
  for Angular" renders the detail card alone from Munich (`{ topic: 'angular', nearKm: 50 }`) and
  list plus card from Dresden (`{ topic: 'angular' }`, the model dropped the distance filter; the
  card is right because ng-atlas Munich is the next Angular conference by date).
  Two observations from that session are register material, not Task 1 defects: a conference
  cannot be asked for by name (`findConferences` has no name filter, and the selection is
  client-owned, so the model cannot target one except through topic/date/distance); the user
  cannot list their own reservations (the model has no tool for them and said so).
- No temporary probes remain in the tree.

### Acceptance Coverage

- `T1-AC-01` — passed — `reserve-handler.spec.ts` "T1-AC-01 a click lowers the selection and the
  list entry by one, twice, and no request leaves the browser" (gauge + list entry, `fetch` spy).
- `T1-AC-02` — passed — `reserve-handler.spec.ts` "T1-AC-02 at zero a click leaves the conference
  at zero"; `conference.store.spec.ts` "T1-AC-02 never reports fewer than zero tickets" and
  "T1-AC-02 clamps remaining at zero".
- `T1-AC-03` — passed — `render-surface.tool.spec.ts` "T1-AC-03 mounts the reduced remaining into
  a later surface, untouched by the patch on the earlier one"; `chat.page.spec.ts` "T1-AC-03
  reserve in the chat: the gauge drops without a request, and the next answer starts from the
  reduced count" (the real chat flow over four agent runs); `conference.store.spec.ts` "T1-AC-03
  counts reservations per conference …" and "T1-AC-03 lowers remaining by the count …".
- `T1-AC-04` (amended 2026-09-26) — passed — `render-surface.tool.spec.ts` "rejects a selected
  binding outside /selectedConf and names the fixed path", "rejects a reserve context outside
  /selectedConf/id", "rejects a relative selection path: inside a List template …", "accepts the
  selection at /selectedConf …"; `reserve-handler.spec.ts`
  "T1-AC-04 writes the two fixed homes only: an object elsewhere with the same id stays untouched".
- `XC-01` — contributes; the cross-cutting check is the plan's end-of-scope gate.

### Open Issues

- `docs/how-it-works.md` "Data stays in the browser" says a tool's result "is put into the data
  model of the surface" but not that a store (`SurfaceDataStore`) is the source, that the mount is
  a one-time projection per rendered surface, or that a change while a surface is up therefore
  means two writes: the store and, through the renderer, the live surfaces (the reserve handler is
  the first case). Also missing: the rule that text and structure of an answer are the record and
  never change, while the data behind the bindings belongs to the browser — what answered a
  request stays with that answer, what the user changes on shared state shows in every surface —
  and the reserve click itself. `architecture.md` "Invariants worth knowing" lists `/filteredConfs`
  and `/me` as client-mounted; `/selectedConf` joins them as the selection's fixed home. (→ Task 6)
- `docs/architecture.md` boot step 6 names what `createAppConfig` provides but not the wiring
  rule: the shell is wired in that one place, everything app-wide is an `EnvironmentProviders`,
  and a listener nobody injects is an environment initializer, not a service — the reserve
  handler is the first case. One sentence there; no inventory of the `provide*` calls, which the
  30-line file records itself. (→ Task 6)

- Promoted: a conference cannot be asked for by name or city — `findConferences` has no such
  filter, the live check succeeded by coincidence of location and date (→ improvements register);
  Task 4's prompt-4 wording must pin its conference through the existing filters (plan note).
- Promoted: no way for the user to list their own reservations — a `myReservations` client tool
  (→ improvements register).

### Context for Next Task

- Interfaces: `ConferenceStore.reserve(id: string): number | undefined`,
  `ConferenceStore.reservations: Signal<ReadonlyMap<string, number>>`,
  `applyReservations(confs: readonly ConferenceResult[], counts: ReadonlyMap<string, number>): ConferenceResult[]`,
  `provideReserveHandler(): EnvironmentProviders` (installed in `createAppConfig`).
- A TestBed that renders a reserve Button and expects the click to work needs
  `provideReserveHandler()` in its providers; `chat.page.spec.ts`'s `renderChat` has it now, so
  Task 4's chat spec can click reserve directly.
- The renderer's data model mutates mounted objects in place. Never mount an object the store or a
  fixture still holds — copy it. The handler's write reaches every alias of that object.
- The handler writes every live surface (`surfacesMap`), so any surface in a TestBed that holds
  the reserved id at `/filteredConfs/<i>` or `/selectedConf` is patched, whichever surface was
  clicked. Objects elsewhere are never touched.
- `/selectedConf` is client-owned: a spec that renders through `renderSurface` cannot write it
  from the model side any more (T6-AC-05 flipped); the client pre-sets it from `confs[0]`.
- Task 4 carries the model half (plan note under its heading): prompt line, scorer fixed to
  `/selectedConf` (`hasReserveButton`, `score.spec.ts` "follows the selection path the model
  chose"), and the typed field list to consider on the same eval run.
- The basic `Text` drops a bound 0 (`|| ''`); a value that can legitimately be zero belongs on a
  component that renders it (the `Gauge` does).
- Replay (Task 3) needs no recording of the click: the reserve path never involves the model.
- Prompt and eval already fix the Button contract (`agent/src/prompt.ts:126`,
  `eval/score.ts` `hasReserveButton`): `{ "id": { "path": "<selection>/id" } }`.

### Git State

```
$ git diff --stat
 docs/work/m3-reserve-maps-hosting/plan.md       |  16 ++-
 src/app/a2ui/surface-host-rules.ts              |  52 +++++++++
 src/app/agent/surface-data.store.ts             |   8 +-
 src/app/agent/tools/render-surface.tool.spec.ts | 136 ++++++++++++++++++++++--
 src/app/agent/tools/render-surface.tool.ts      |  42 ++++----
 src/app/app.config.ts                           |   2 +
 src/app/chat/chat.page.spec.ts                  |  45 ++++++++
 7 files changed, 269 insertions(+), 32 deletions(-)

$ git status --short
 M docs/work/m3-reserve-maps-hosting/plan.md
 M src/app/a2ui/surface-host-rules.ts
 M src/app/agent/surface-data.store.ts
 M src/app/agent/tools/render-surface.tool.spec.ts
 M src/app/agent/tools/render-surface.tool.ts
 M src/app/app.config.ts
 M src/app/chat/chat.page.spec.ts
?? docs/work/m3-reserve-maps-hosting/task-log/task-1-reserve-handler-store.md
?? src/app/a2ui/reserve-handler.spec.ts
?? src/app/a2ui/reserve-handler.ts
?? src/app/domain/conference.store.spec.ts
?? src/app/domain/conference.store.ts
```

### Sessions

- claude-code 49de040c-e4a0-40aa-ab1c-9ea990bb6776 (2026-09-26) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/49de040c-e4a0-40aa-ab1c-9ea990bb6776.jsonl
