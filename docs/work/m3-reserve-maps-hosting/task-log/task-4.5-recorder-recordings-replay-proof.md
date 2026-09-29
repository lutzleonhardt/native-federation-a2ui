# Task 4.5: Browser recorder, the sixteen recordings, the replay proof

### Task

A dev-only recorder in the shell that writes down what the live agent answered per capability set
and badge (`?record`, local mode only), the sixteen recordings captured by the user's clicks into
`public/recordings.json`, and a chat-page spec over that file proving replay mode plays the four
badges without a model and without a request. Part 3 (2026-09-29, user observation after the
capture): the location is part of a recording — the file names the city of its capture, the
recorder writes it, replay pins the location to it (T4.5-AC-05).

### Status

DONE — implementation and task-local verification complete: the recorder, the `?record` flag,
the `RUN_RECORDER` wiring, the shared chat-page harness, the sixteen recordings captured by the
user and pasted into `public/recordings.json`, the file spec and the replay proof, and (part 3)
the city of the capture: `city` in the file, written by the recorder, pinned by replay.
`npm run test:shell` 29 files / 208 tests (before the task: 26 / 169), `npm run test:agent` 4 / 32,
ESLint, `sheriff verify`, `tsc` app and spec clean, Prettier clean on the task's lines (two files
warn only in hunks that warned at HEAD). The plan's quick functional check was driven with
Playwright in both halves (record, then replay) against the user's running servers. The eval gate
was re-run by the user after the prompt sentence and reached. Independent review pending — not
requested yet; this log was first written after part 1 on the user's request and merged after
part 2. Ready for `/review` or `/commit 4.5`.

### Files Modified

- `src/app/replay/recorder.ts` (new) — `RUN_RECORDER` token (`RunRecorder | undefined`, default undefined), `RecordingsFile`, `RecordedTurn`, `RECORDINGS_STORAGE_KEY` (`conference-finder.recordings`), `recorderFor(setKey, cityId, storage)` (subscribes `onMessagesChanged`, idle guard, cell dedupe, `fileFor`: the page's city into the file, no write without a city or when the stored file was captured elsewhere, store + `console.log`), `recordedTurn(messages)` (the last user message's accepted runs).
- `src/app/replay/recorder.spec.ts` (new) — five cases over `recordedTurn`: accepted runs with parsed args; refused, unanswered, unparsable and text-only messages dropped; last user message only; undefined while the last call is refused (correction pending or the shell gave up); undefined without a user message or an accepted run.
- `src/app/agent/agent-mode.ts` (modified) — `AgentSetup` local variant gains `record?: boolean` (the replay variant has none); `recordRequested(search)` (`?record` present, value ignored); part 3: the replay variant gains `city?: string`.
- `src/app/agent/agent-mode.spec.ts` (modified) — "T4.5-AC-04 ?record asks for the recorder, with or without a value; nothing else does".
- `src/main.ts` (modified) — `setupAgent` passes `record: recordRequested(search)` in local mode; part 3: the replay setup carries `capturedCity(json)` beside `parseRecordings(json)`.
- `src/app/agent/assistant-agent.token.ts` (modified) — `provideAssistantAgent` provides `RUN_RECORDER` through `createRecorder(setup)` (`recorderFor(loadedSetKey())` for local + record, else undefined), the sibling of `createAgent`; `loadedSetKey()` extracted from `createAgent`, shared by both; part 3: provides `PINNED_CITY` (replay's city, else undefined), `createRecorder` hands `LocationStore.cityId` to the recorder.
- `src/app/agent/init-agent-store.ts` (modified) — `inject(RUN_RECORDER)?.(store().agent, destroyRef)` beside the correction channel; doc comment names the recorder.
- `src/app/chat/testing/chat-page-harness.ts` (new) — the TestBed helpers moved out of the chat spec: `renderChat(agent, { loaded?, record? })`, `renderReplayChat(recordings, { loaded?, pace?, city? })`, `INSTANT`, `host`, `promptButtons`, `clickPrompt`, `surfaces`, `markersOf`, `timelineMarkers`, `gaugeValues`, `reserveButtons`, `widgetText`, `settle`; `RemoteName`; statuses derived from the loaded names (the rest `unselected`), capabilities via `loadedCapabilities`.
- `agent/src/prompt.ts` (modified) — `# Vocabulary` gains three sentences: a basic component binds single values, `ChoicePicker.options` is a static list that cannot be bound to `/filteredConfs`; only a Custom Catalog component with `selected` selects a conference into `/selectedConf`, without one say so and build the detail view on the pre-set `/selectedConf`. Names no custom component (T7-AC-02 holds).
- `agent/src/prompt.spec.ts` (modified) — "states that ChoicePicker options are static and only a `selected` component selects a conference".
- `public/recordings.json` (replaced) — the sixteen recordings from the user's browser capture (`?record`, Dresden, one click per reload), pretty-printed by the recorder and Prettier-clean as pasted; `capturedAt` 2026-09-29, the `note` on when to re-record; part 3: `"city": "dresden"` added by hand after `capturedAt`, no cell changed.
- `src/app/replay/recordings-file.spec.ts` (new) — T4.5-AC-01/02 over the file: pins and note, one recording per reachable set (every subset of the manifest names) × badge with ≥ 1 call, first run `findConferences`, only the three client tools, no date literal; part 3: `city` is a picker city.
- `src/app/chat/chat.page.recorded.spec.ts` (new) — T4.5-AC-02/03: the real replay agent over the file through the real chat; the five forms with both remotes and `charts`; a loop over all sixteen cells (fresh TestBed, the file's city pinned, no refusal, no `console.error`, no `fetch`); part 3: the city comes from `capturedCity(file)`, no `setCity`; "T4.5-AC-05 the location is the file's city, read-only…".
- `tsconfig.spec.json` (modified) — `resolveJsonModule` so specs import the two `public/*.json` files.
- `docs/improvements.md` (modified) — register entries: the README must state that surface quality depends strongly on the model (non-deterministic, forms vary across clicks; the eval and the curated replay are the answer to that) — user decision at the capture; and the promoted A3 observation (below).
- `src/app/chat/chat.page.spec.ts` (modified) — helpers imported from the harness; `renderChat(agent, [chartsCapability])` → `{ loaded: ['charts'] }`, `renderReplayChat(x, INSTANT)` → `{ pace: INSTANT }`; new describe "ChatPage with the recorder": the corrected turn lands in `localStorage` and the console without the refused run and a later prompt keeps the first cell; without `?record` and in replay mode nothing is stored or logged; part 3: the written file carries `city`, two T4.5-AC-05 cases (no city picked; a stored file from another city), `plainAnswer()` helper.
- `src/app/replay/recordings.ts` (modified, part 3) — `capturedCity(json)` (a picker id or undefined); `parseRecordings` refuses a file without one, like the other pins.
- `src/app/replay/recordings.spec.ts` (modified, part 3) — `city` in the fixture; "T4.5-AC-05 names the city of the capture and refuses a file whose city the picker does not offer".
- `src/app/domain/location.store.ts` (modified, part 3) — `PINNED_CITY` token (default undefined); the state is a `City` from the token or storage (`initialCity`), `me` derived; `cityId`, `pinned` (boolean); `init()` returns and `setCity()` throws while pinned; `cityOrThrow` shared.
- `src/app/domain/location.store.spec.ts` (modified, part 3) — instances through `TestBed.runInInjectionContext` (`freshStore()`), the pinned cases provide the token (`pinTo`, reset first); "T4.5-AC-05 pinned to a city it is that city: no geolocation, nothing saved, no picking"; `cityId` and the unknown pinned id in existing cases.
- `src/app/chat/location-picker.component.ts`, `.html` (modified, part 3) — `pinned`; "Recorded in <city>" without a Change button when pinned.
- `docs/work/m3-reserve-maps-hosting/plan.md` (modified, part 3) — Task 4.5 amendment (2026-09-29, after the capture), T4.5-AC-05, Key Locations, the reversed Key Discoveries line.

### Files Read (Context Only)

- `docs/work/m3-reserve-maps-hosting/plan.md` (preamble, Task 4.5), `task-log/task-4-*.md`,
  `task-log/task-3-*.md` (Task, Files, Key Decisions, Context for Next Task), `task-log/docs-task-4-split.md` (grep).
- `src/app/replay/{recordings,replay-agent,scripted-run}.ts`, `src/app/agent/{init-agent-store,agent-mode,agent-mode.spec,assistant-agent.token,agent-store-helper,create-frontend-tool,render-failure-correction,render-failure-handler.token}.ts`,
  `src/app/agent/tools/{render-surface,find-conferences}.tool.ts`, `message-widget.tool.ts` (grep),
  `src/main.ts`, `src/bootstrap.ts`, `src/app/app.config.ts` (grep), `src/environments/environment.ts`,
  `src/app/chat/{chat.page,chat.page.spec,example-prompts}.ts`, `capability-panel.component.html` (grep),
  `src/app/federation/{select-capabilities,page-search.token,capability-status.token}.ts`, `capability-status.ts` (grep),
  `src/app/a2ui/surface-host-rules.ts` (grep), `src/app/a2ui/renderer-integration.spec.ts` (grep, the Slider's `input[type="range"]`),
  `src/app/testing/mock-agent.ts`, `src/app/domain/location.store.ts` and `cities.ts` (grep).
- `public/recordings.json`, `public/federation.manifest.json`, `sheriff.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json`, `angular.json` (shell test target), `package.json` (scripts), `.gitignore` (`__screenshots__/`).
- `node_modules/@a2ui/web_core/src/v0_9/basic_catalog/components/basic_components.js` (`ChoicePicker`, `children` templates) and `schema/common-types.js` (`Dynamic*` unions) — for the prompt sentence.
- `node_modules/@copilotkit/core/dist/index.cjs` (`AgentRegistry.setAgents__unsafe_dev_only`, `getAgent`) and `@copilotkit/angular` fesm (`createAgentStoreSignal`) — the store's agent is the registered instance (user question on a service-shaped recorder).
- `src/app/a2ui/renderer-integration.spec.ts` (the Slider interaction), `projects/mfe-charts/src/charts/gauge.component.html` (`.cf-gauge-value`), `projects/mfe-maps/src/maps/filter-within-km.fn.ts`, `src/app/agent/surface-data.store.ts` (`me` from `LocationStore`).
- `node_modules/@ag-ui/client/dist/index.d.mts` (`AgentSubscriber`: `onMessagesChanged`, `onRunFinalized`, `onToolCallEndEvent`, `onToolCallResultEvent`).

### Key Decisions

- **The cell is derived from the transcript, never counted (user confirmed).** CopilotKit splices
  the turn-ending tool result into `agent.messages` after `onToolExecutionEnd` without notifying
  subscribers; the shell's `publishToolResults` workaround re-sets the messages once the agent is
  idle, which fires `onMessagesChanged` with `isRunning === false`. The recorder rides on that:
  whenever the transcript changes while the agent is idle it re-derives the runs since the last
  user message and writes the cell. Works whether the core notifies or the workaround does; no
  turn-end detection, no run counter. A correction run may produce one intermediate write (the
  refused run already dropped, the correction not yet in); harmless, the cell is replaced whole
  and the last write of a turn is complete. Same-state notifications are deduped on the
  serialized cell, so a turn logs once.
- **One cell is replaced, the rest stays (user question).** Nothing global: the file is read from
  `localStorage` at every write, `recordings[setKey][prompt]` is replaced, the file written back.
  A re-click of the same badge replaces only its own cell; the sixteen cells accumulate across the
  four reloads. Starting over means removing the key — deliberately no button.
- **The set key is fixed per page (user question).** A set switch is a navigation
  (`toCapabilitiesQuery` keeps `?record` and `?agent=`), the app boots again, the recorder is
  built once per boot from `CAPABILITY_STATUS` through `loadedSetKey()`, the same spelling the
  `ReplayAgent` gets. The AG-UI agent knows nothing of capabilities.
- **`record` lives in the local `AgentSetup` variant, optional.** The replay variant has no such
  field, so "replay never records" is a property of the type; the runtime is pinned by a spec.
  Optional keeps the two existing `{ mode: 'local' }` spec sites untouched.
- **`RUN_RECORDER` is decided in `createRecorder(setup)`, attached in `initAgentStore`.** The
  token carries the attach function or undefined; `initAgentStore` stays generic (no capability
  knowledge), the mode + flag decision sits beside `createAgent`, where the agent is created
  (extracted from an inline factory on the user's suggestion).
- **What drops a run:** any call whose tool result is not `ok: true` (the plan's rule: a refused
  `renderSurface` never replays, the shell has no model for its correction), an unanswered call,
  unparsable arguments, and a text-only assistant message (`RecordedRun` holds calls only). A
  turn with no accepted run is not written at all.
- **A turn whose last tool run was refused is not written (found at the user's capture).** With
  no remotes, badge 4 exhausted the correction budget on a `ChoicePicker` the model could not
  get past the schema; the first version of the recorder then wrote the cell with the
  `findConferences` run alone — a recording that replays as nothing, and one that a failed
  re-click would have put over a good cell. `recordedTurn` now requires the last run with tool
  calls to be accepted; as a side effect the intermediate write during a correction is gone
  (the refused run is last until the correction lands).
- **The stored file is read through `parseRecordings`.** Same validation as the served file; a
  refused or corrupt store starts over. Its console message names `recordings.json` — accepted
  for a dev-only tool rather than a second parser.
- **The console gets the pretty-printed file** (2-space JSON, one `console.log` per write): the
  copied text is the file; Prettier formats it again on commit.
- **Harness in `src/app/chat/testing/`, no vitest import.** `tsconfig.app.json` includes
  `src/**/*.ts` minus specs, so the harness is type-checked by the app build like
  `src/app/testing/mock-agent.ts`; `@angular/core/testing` passes, a `vitest` import was avoided.
  `waitForReplay` stays in the specs (three lines, twice). Both render functions take an options
  object; the plan named only `renderReplayChat`, one shape for both reads better at the call
  sites. Statuses derive from the loaded names — `T2-AC-01` now runs with `maps` unselected
  instead of loaded-but-absent from the catalog, which is the consistent picture.
- **The negative log assertion is narrowed to recorder files.** The A2UI renderer logs its
  catalog configuration via `console.log` at init, so "console.log never called" is not
  available; `loggedFiles()` filters calls whose first argument contains `"recordings"`.
- **Quick check part 1 by Playwright, one paid click (Dresden, badge 1),** to de-risk the user's
  sixteen clicks; headless own profile, so the user's browser storage stays empty. The agent
  process start (10:51) was checked against `prompt.ts`'s last change (10:48): no restart needed.
- **Pre-existing Prettier warning in `init-agent-store.ts` left alone** (the `@copilotkit/angular`
  import line, warned at HEAD); an accidental `--write` reformat was reverted so the diff carries
  the task's lines only (Task 3.5/4 practice).
- **A prompt sentence on the static `ChoicePicker` (user decision, plan deviation).** At the
  user's capture the empty set's badge 4 exhausted the correction budget: the model bound
  `/filteredConfs` into `ChoicePicker.options`, which the v0.9 schema types as a static
  `{ label, value }[]` (each label bindable, the list not), and the validation messages only led
  it through variants. The basic catalog is otherwise bindable (`Dynamic*` unions of literal,
  `{ path }` and `{ call }`; `children` templates over a list), and nothing in it writes a whole
  object into `/selectedConf` — only a component with `selected` does. The preamble puts prompt
  changes out of scope and wants the prompt final before the capture; the user chose the sentence
  over (a) re-clicks alone and (b) attaching the failing component's schema to the `catalog`
  failure result (stage 2 of the register entry, no prompt change). Cost is nil at this point:
  all sixteen cells are re-recorded anyway (see the next decision), the agent group is restarted
  by the user, and the user runs `npm run eval` once more as the regression guard, since the
  gate measured the prompt without the sentence. A claim "the basic catalog has no bindable
  properties" was considered and rejected as false.
- **Every cell is the first click after a reload (user's capture, found by the eye).** The user
  had clicked the badges one after another in one page; from the second click on the model saw
  the earlier answers and the mounted data and skipped `findConferences` (badge 4 rendered in
  one run). Such a recording replays over an empty store. The recorder cannot tell (it records
  any turn); the rule is procedural — reload before every click — and the proof spec's
  fresh-TestBed loop is the safety net.
- **Partial wrap-up before part 2 (user).** The user wants an independent review session to know
  the intent from the log before the capture; part 2 merges into this file.

— session 2026-09-29, part 2 (after the capture)

- **A service-shaped recorder was considered and not built (user question).** `inject(ASSISTANT_AGENT)`
  is the instance CopilotKit runs (the core registers self-managed agents unchanged), so a
  service with an environment initializer would work; it was declined because the correction
  channel attaches at the same spot to `store().agent`, which names the agent the store runs
  without an identity assumption, and because the service would need an initializer and either
  an import cycle with the token file or a factory that hands the agent in anyway.
- **`createRecorder(setup)` beside `createAgent(setup)` (user suggestion)** — the provider list
  stays flat, the mode + flag decision has a name.
- **The eye's verdicts at the capture (user, with the assistant's reading per screenshot).** Kept
  with cosmetic weaknesses that break no rule: bare numbers without captions (empty set badge 3),
  a doubled slider caption and a blind range of 2000/3000 km (`maps`, `charts,maps` badge 2 —
  register: `farthestKm`), no "no map" sentence where the Timeline or a list stood in (`charts`
  badges 2 and 4; the rule accepts "distance"), a small selection caption under the Timeline
  (`charts` and `charts,maps` badge 1 — not the detail view Task 4 warned of; `charts,maps`
  badge 1 came as Timeline alone plus a hint text). Re-clicked: the empty set's badge 4 twice
  (no city picked, the model said so and wrote the date into the text; then the honest form:
  text plus the pre-set `/selectedConf` Card with Reserve and no picker — the prompt sentence
  worked), the empty set's badge 2 once (the first answer listed without naming the missing map
  and slider). `charts,maps` badge 4 came as Map, Timeline and Card, the form Task 4 accepted.
- **The proof spec's shape.** Five detailed cases pin the forms the plan names; a generated case
  per cell (four sets × four badges, each its own TestBed with Dresden picked) pins "every
  recording is self-contained and only runs the shell accepted": a surface renders, no
  `renderSurface failed` warning, no `console.error`, no `fetch`. The Slider is moved to its
  `min` rather than a literal, so the check holds for any range the model chose; badge 3 counts
  Cards that contain a Gauge, so a wrapping Card cannot inflate the count.
- **JSON imports in specs (`resolveJsonModule`)** instead of fetching `public/recordings.json`
  in the test browser: deterministic, typed, and the manifest import lets the spec derive the
  reachable sets instead of hard-coding four keys.
- **Declined at the capture: attaching the failing component's schema to the `catalog` failure
  result** (stage 2 of the basic-catalog register entry) — the prompt sentence made it
  unnecessary for the one cell that needed it; the register keeps the idea.

— session 2026-09-29, part 3 (the city of the capture, user observation)

- **The location is part of a recording; the file names it, replay pins it (user decision).**
  The recordings carry no `me` and no coordinates — the search runs again at replay — so a
  simulation of every recorded `findConferences` over the eleven picker cities gave the same
  result in 13 of 16 cells. Not in the rest: `charts` badge 2 (`nearKm` 500, chosen for Dresden)
  has 6 hits from Dresden, 2 from Amsterdam, 0 from Warsaw while its text promises a list; the
  800 km badge-4 cells put ng-forge Berlin first from Warsaw (bound, so consistent, but not the
  form the eye approved). The larger hole: replay called `location.init()` like live mode, and a
  visitor who denies geolocation and picks nothing has `me === undefined` — `distance` and
  `filterWithinKm` then get no point and there is no model to say "pick a city". The plan had
  decided the opposite ("the client mounts the visitor's own city at replay"); reversed by
  amendment. The richer variant (visitor's city when known, the file's as fallback) was named
  and declined: it buys "near me" at the price of the Warsaw hole.
- **`city` is a pin like `format` and `a2ui` — in the file, not a constant in the code.** The
  file already names the envelope it was captured against; the city is the same kind of context,
  and whoever re-records changes only the file. `capturedCity(json)` accepts a picker id only;
  `parseRecordings` refuses a file without one, whole, like the other pins. The sixteen cells
  were captured in Dresden and got the key by hand — no cell changed (the file holds no city, no
  `lat`/`lon`, only `/me` paths).
- **The recorder writes the page's city and refuses a mixed file.** `recorderFor` takes a
  `cityId` accessor (`LocationStore.cityId`; `Me` carries the name only, so the store now holds
  the `City` and derives `me`). Without a city the turn is not written; when the stored file was
  captured in another city the turn is not written either, and the warning names both cities
  and the storage key to remove. "The city at the last write, like `capturedAt`" was rejected:
  it would silently mix cities into one file.
- **The pin is a DI value, not a command (user suggestion).** A first version had a `pin(id)`
  method on the store plus an environment initializer in `provideAssistantAgent`; the user
  asked why the store does not simply read the mode itself. It needs the city, not the mode, so
  `PINNED_CITY` (`string | undefined`, default undefined — the `RUN_RECORDER` shape) lives with
  the store, `provideAssistantAgent` sets it to replay's city, and the store decides at
  construction: the pinned city instead of the saved one, `pinned` a plain boolean, `init()`
  returns at once, `setCity` throws (nothing calls it, the picker hides Change). `AGENT_MODE`
  stays out of the domain. A pin persists nothing, so a visitor's saved city survives. A refused
  or unreachable file has no city: the token is undefined, the picker stays live — nothing plays
  then anyway. Cost: the store's spec builds instances through `TestBed.runInInjectionContext`.
- **The picker reads "Recorded in <city>" without a Change button when pinned** — the label
  changes, no new element, no CSS; on phones the label stays visually hidden as before, the
  replay notice carries the mode.

### Review Focus

- **Behavior claims:** (1) With `?record` in local mode, after each turn
  `localStorage['conference-finder.recordings']` and the last console entry hold the same file —
  `format 1`, `a2ui v0.9`, `capturedAt`, `note`, `recordings[<set>][<prompt>]` — whose runs are
  exactly the assistant messages whose every tool result was `ok`; a refused `renderSurface`'s run
  is absent and the correction's run present; a turn whose last run was refused is not written;
  a later prompt adds its cell and keeps the earlier one. (2) Without `?record`, and in replay
  mode, nothing is stored or logged. (3) With the captured file in replay mode, every one of the
  sixteen cells renders as the first message of a fresh conversation without a refusal or a
  request; with both remotes badge 1 is a Timeline alone, badge 2 a Map whose markers follow the
  Slider, badge 3 three Cards with a Gauge each, badge 4 Map plus Gauge plus the name with a
  reserve Button that lowers the Gauge by one; with `charts` badge 2 names the missing map or
  distance filter and draws no Slider. (4) In replay with the captured file the location is
  Dresden whatever the browser saved or geolocation would say: the picker reads "Recorded in
  Dresden" without Change or select, `getCurrentPosition` is never called; a file without a
  picker city is refused whole. With `?record` the stored file carries the page's `city`; a
  click without a city, or with a stored file from another city, writes nothing and warns.
- **Plan deviations:** `agent/src/prompt.ts` changed although the preamble keeps prompt work out
  of scope and wants the prompt final before the capture → three sentences on the static
  `ChoicePicker.options` and the `selected` rule → the empty set's badge 4 could not be recorded
  otherwise; user decision, eval re-run and full re-capture follow. Part 2 (recordings, file spec,
  proof) pending the user's capture — the sequence agreed at start, not a deviation. `renderChat` also took an options object (plan:
  only `renderReplayChat` gets the set) → one shape for both render functions. Harness placed at
  `src/app/chat/testing/chat-page-harness.ts` (plan: "a shared test harness module"). Part 3
  is an amendment, not a deviation; it reverses the plan's Key Discovery on the visitor's city.
- **Assumptions / choices:** the final `onMessagesChanged` of a turn is guaranteed by
  `publishToolResults` (or a fixed core); a turn with zero accepted runs is not written;
  `capturedAt` is the day of the last write, one date for the file; the stored file is validated
  like the served one.
- **Scope notes:** the prompt sentence (see deviations) and its spec; `tsconfig.spec.json` gains `resolveJsonModule`; `loadedSetKey()` extracted in `assistant-agent.token.ts`; `T2-AC-01`'s
  statuses changed to `maps` unselected (assertions unchanged); no docs touched — the recorder and
  `?record` are Task 6's documentation. Part 3 changes `LocationStore`'s state from `Me` to
  `City` (`me` derived, `toEqual` in the specs unchanged) and the picker — Task 3's files.
- **Read next:** `src/app/replay/recorder.ts` `recorderFor` and `recordedTurn` — the idle guard,
  the ok-filter and the refused-last-run rule carry the whole design;
  `src/app/chat/chat.page.recorded.spec.ts` — the proof over the real file, five forms plus the
  sixteen-cell loop; `agent/src/prompt.ts` `# Vocabulary` — the three sentences the capture
  needed, the one prompt change of this task; `src/app/domain/location.store.ts` `PINNED_CITY` and `initialCity`, and
  `src/app/replay/recorder.ts` `fileFor` — the city rule on both sides.

### Test Evidence

- Final code, sandboxed: `npm run test:shell` — 27 files, 176 tests (before: 26 / 169). New:
  `recorder.spec` 4 cases, `agent-mode.spec` "T4.5-AC-04 ?record asks for the recorder…",
  `chat.page.spec` "T4.5-AC-04 with ?record in local mode the turn lands in localStorage and the
  console, without the refused run, in the shape parseRecordings accepts" and "T4.5-AC-04 without
  ?record, and in replay mode, nothing is stored or logged"; every earlier chat case green on the
  harness.
- `npx tsc -p tsconfig.app.json --noEmit` and `-p tsconfig.spec.json`: clean (after
  `Provider | EnvironmentProviders` in the harness). `npx eslint src/app/replay src/app/agent
  src/app/chat src/main.ts`: clean. `npx sheriff verify`: all projects validated.
  `npx prettier --check` on the nine changed files: clean except `init-agent-store.ts`, whose
  warning is the pre-existing import line (checked against `git show HEAD:…`).
- After the prompt sentence: `npm run test:agent` — 4 files, 32 tests (new: `prompt.spec`
  "states that ChoicePicker options are static…"; T7-AC-02 still keeps custom names out of the
  static text); `npx eslint` on `prompt.ts` and `prompt.spec.ts` clean.
- Eval gate with the prompt sentence (user, after the agent restart, 7 m 37 s): `charts,maps`
  Badge 1 (A1) 5/5, Badge 4 (A3) 4/5 — run 4 "no Map in the surface"; `charts` Badge 1 (A1) 5/5,
  Badge 2 (A2-without-maps) 4/5 — run 3 "no messageWidget text names the missing map or distance
  filter". `Gate reached.` Two cells below Task 4's round 3 (all 5/5); the A3 miss may be the
  sentence's emphasis on "a component with `selected`", which the Timeline also satisfies — at
  n = 5 within noise, noted in Open Issues.
- After the refused-last-run rule: `npm run test:shell` — 27 files, 177 tests (new: `recorder.spec`
  "T4.5-AC-04 is undefined while the last call is refused…"); ESLint on `src/app/replay` and
  `tsc -p tsconfig.spec.json` clean.
- First run had one failure: `expect(logs).not.toHaveBeenCalled()` — the renderer's own
  `console.log` (catalog config) — fixed by `loggedFiles()`. Vitest's failure screenshot under
  `src/app/chat/__screenshots__/` (gitignored) was removed.
- Quick functional check, part 1 (outside the sandbox, the user's `npm start` servers on
  4200–4202 and 3001): Playwright probe `probe-record.mjs` in the session scratchpad (not in the
  tree) opened `/?record`, chose Dresden, clicked badge 1, waited for the buttons to re-enable:
  `files logged: 1`; `set "charts,maps" prompt "Which Angular conferences are coming up in the
  next six months?": 2 runs → findConferences | renderSurface`; `last log equals stored: true`;
  `capturedAt: 2026-09-29`; no `renderSurface failed` warning (only the geolocation denial);
  rendered a Timeline plus one Card. Served bundle checked for `recordRequested` before the click.

— session 2026-09-29, part 2 (after the capture)

- File analysis before the specs (node one-liner, gone): keys `format, a2ui, capturedAt, note,
  recordings`; sets `""`, `charts`, `maps`, `charts,maps`; all sixteen cells present, every first
  run `findConferences`, no date literal; widget texts at the empty set's badges 2 and 4 and at
  `charts` badge 2; `Slider` + `Map` with `/filter/maxKm` initialised (2000, 3000) in the two
  maps sets; `Timeline` at `charts` badge 1 and 4 and `charts,maps` badge 1 and 4; `Gauge` at
  badge 3 and 4 with charts; `Button` at every badge 4. `npx prettier --check
  public/recordings.json` clean as pasted (123 KB).
- Final code, sandboxed: `npm run test:shell` — 29 files, 203 tests (new: `recordings-file.spec`
  5 cases, `chat.page.recorded.spec` 5 detailed cases + 16 generated cells). `npm run test:agent`
  — 4 files, 32 tests. `npx eslint` on `src/app/replay`, `src/app/agent`, `src/app/chat`,
  `src/main.ts`, `agent/src/prompt*.ts`: clean. `npx sheriff verify`: all projects validated.
  `tsc -p tsconfig.app.json` and `-p tsconfig.spec.json`: clean. Prettier: clean on every changed
  file except `agent/src/prompt.spec.ts` and `docs/improvements.md`, which warned at HEAD
  (`git show HEAD:… | prettier --check`); `tsconfig.spec.json` restored to its original
  formatting with the one added line after an accidental reformat.
- Quick functional check, part 2 (outside the sandbox, the user's servers, `probe-replay.mjs` in
  the session scratchpad, not in the tree): `/?agent=replay`, Dresden, notice "Replay mode ·
  Recorded answers play back in your browser"; badge 1 → 1 surface, 1 timeline, no map, no
  gauge; badge 2 → map with 9 markers and a slider, 0 markers after moving it to `min`; badge 3
  → gauges 12, 68, 88 in 3 cards; badge 4 → map, timeline, gauge 12, one button, reserve click
  12 → 11; then `/?agent=replay&capabilities=charts` badge 2 → widget "I can list the Angular
  conferences near you, but I can't wire a distance slider…", no slider, no map. Requests to
  the agent port: 0. Console: only the geolocation denial and WebGL driver notes, no refusal.

— session 2026-09-29, part 3 (the city of the capture)

- Simulation before the decision (python one-liner, gone): every recorded `findConferences`
  over the eleven picker cities against `conferences.json` — 13 of 16 cells identical
  everywhere; `charts` badge 2 (500 km): Dresden 6, Berlin 4, Amsterdam 2, Warsaw 0; the two
  800 km badge-4 cells: Warsaw 5 with ng-forge Berlin first. `grep` on the file: no city name,
  no `lat`/`lon`, eight `/me` paths.
- Final code, sandboxed: `npm run test:shell` — 29 files, 208 tests (new: `recordings.spec`
  "T4.5-AC-05 names the city of the capture…", `location.store.spec` "T4.5-AC-05 pinned to a
  city…", `chat.page.spec` "T4.5-AC-05 without a city picked…" and "…a stored file from another
  city…", `chat.page.recorded.spec` "T4.5-AC-05 the location is the file's city…"; the
  sixteen-cell loop and the five forms green on the pin instead of `setCity`).
  `tsc -p tsconfig.app.json` and `-p tsconfig.spec.json`, `npx eslint` on `src/app/{replay,agent,
  chat,domain}` and `src/main.ts`, `npx sheriff verify`: clean. Prettier clean on every changed
  line; `location.store.ts` warns on the geolocation-failed `console.warn` line, which warned at
  HEAD.
- Quick functional check, part 3 (outside the sandbox, the user's servers 4200–4202,
  `probe-pin.mjs` in the session scratchpad, not in the tree): `/?agent=replay` with
  `conference-finder.city = berlin` saved and `getCurrentPosition` stubbed to a flag — picker
  text "Recorded in Dresden", picker controls (button/select) 0, geolocation asked `false`,
  replay notice present, both chips loaded; badge 2 → 1 surface, 9 map markers, 1 slider;
  console without errors, `[replay]`, `[recorder]` or `LocationStore` entries.
- After the rework to the DI value (`PINNED_CITY`): `npm run test:shell` — 29 files, 208 tests
  (two intermediate failures fixed: the spec helper called itself after a blanket rename; the
  pinned cases configured the TestBed after a store had instantiated it — `pinTo` resets first);
  `tsc` app and spec, ESLint, Sheriff, Prettier on the changed lines: clean. `probe-pin.mjs`
  again: same output as above.

### Acceptance Coverage

- `T4.5-AC-01` — passed — `recordings-file.spec.ts`: "carries the pins…", "holds one recording
  per reachable set and badge — sixteen today…", "calls only the three client tools…", "writes
  no date literal…"; "only runs the shell accepted" is the sixteen-cell loop of
  `chat.page.recorded.spec.ts` (no `renderSurface failed`, no `console.error`).
- `T4.5-AC-02` — passed — `recordings-file.spec.ts` "every recording fetches its own data: the
  first run calls findConferences"; `chat.page.recorded.spec.ts` sixteen generated cases, each a
  fresh TestBed with the badge as the first message.
- `T4.5-AC-03` — passed — `chat.page.recorded.spec.ts` the four both-remote cases and the
  `charts` badge-2 case, `fetch` spied and never called in each; Playwright replay check on the
  running shell (Test Evidence).
- `T4.5-AC-04` — passed — `agent-mode.spec.ts` "T4.5-AC-04 ?record asks for the recorder…";
  `recorder.spec.ts` "T4.5-AC-04 keeps one run per assistant message…" and "T4.5-AC-04 drops a run
  with a refused, unanswered or unparsable call…"; `chat.page.spec.ts` the two T4.5-AC-04 cases
  (local + record stores and logs the accepted runs; no record / replay stores nothing).
- `T4.5-AC-05` — passed — `recordings.spec.ts` "names the city of the capture and refuses a
  file whose city the picker does not offer"; `recordings-file.spec.ts` (the served file's `city`
  is a picker city); `location.store.spec.ts` "pinned to a city it is that city: no geolocation,
  nothing saved, no picking"; `chat.page.spec.ts` the two recorder refusals; `chat.page.recorded.spec.ts`
  "the location is the file's city, read-only: the picker names it, no Change, no geolocation";
  Playwright replay check, part 3 (Test Evidence).
- `XC-01`, `XC-04`, `XC-05` — contributes; the cross-cutting checks are the plan's end-of-scope gate.

### Open Issues

- Promoted: the eval after the ChoicePicker sentence measured A3 4/5 (one badge-4 answer
  without a Map) where Task 4 had 5/5; candidate clause "for `where`, the Map" if it repeats
  (→ improvements register).
- The recorder, `?record`, the storage key, the refused-run rule and the capture procedure
  (reload before every click, one city for the whole file, no date in a text) and the replay
  pin ("Recorded in <city>") are undocumented; `architecture.md`
  has no replay section yet (→ Task 6).

### Context for Next Task

- Task 5 (deploy): `public/recordings.json` is final and Prettier-clean; the deploy build
  serves it next to `federation.manifest.json`; `chat.page.recorded.spec.ts` is the regression
  guard for the file and runs with `npm run test:shell` (about 20 s more). Re-record after any
  change to a prompt text, a component or function description, the agent prompt or the
  manifest remotes (the file's `note`), in the file's city; with `?record` only the changed
  cells need a click.
- Task 6 (docs): the recorder next to the replay mode — `?record` in local mode only, the file
  in `localStorage['conference-finder.recordings']` and the console, one cell replaced per
  click, a refused run never replays and a turn whose last run was refused is not written; the
  capture procedure (restart the agent after a prompt change, clear the key, reload before every
  click, one city for the whole file — the recorder refuses another, judge the form by eye, no
  date literal in a text); replay pins the location to the file's `city`; the prompt's
  `ChoicePicker` sentence; the register entries on README honesty and `farthestKm`.
- Interfaces: `recorderFor(setKey, cityId, storage = localStorage): RunRecorder`,
  `recordedTurn(messages): RecordedTurn | undefined`, `RUN_RECORDER`, `RECORDINGS_STORAGE_KEY`,
  `RecordingsFile { format; a2ui; capturedAt; city; note; recordings }`, `capturedCity(json)`;
  `PINNED_CITY`, `LocationStore.pinned`, `cityId`; `recordRequested(search)`; `AgentSetup` local
  `{ mode: 'local'; record?: boolean }`, replay `{ mode: 'replay'; recordings; city? }`; harness in
  `src/app/chat/testing/chat-page-harness.ts`: `renderChat(agent, { loaded?, record? })`,
  `renderReplayChat(recordings, { loaded?, pace?, city? })`, `INSTANT`, the queries; specs import
  `public/*.json` (`resolveJsonModule` in `tsconfig.spec.json`).
- Gotchas: the A2UI renderer logs via `console.log` at init (assert on recorder files, not on
  call counts); a `Slider`'s `min` is the model's choice — move to `min`, not to a literal; the
  chat spec's `waitForReplay` stays per spec file (three lines), the harness has no vitest import
  so the app tsconfig's `src/**/*.ts` include type-checks it harmlessly.

### Git State

```
$ git diff --stat
 agent/src/prompt.spec.ts                    |    8 +
 agent/src/prompt.ts                         |    8 +-
 docs/improvements.md                        |    2 +
 docs/work/m3-reserve-maps-hosting/plan.md   |   16 +-
 public/recordings.json                      | 3365 ++++++++++++++++++++++++++-
 src/app/agent/agent-mode.spec.ts            |   11 +-
 src/app/agent/agent-mode.ts                 |   17 +-
 src/app/agent/assistant-agent.token.ts      |   25 +-
 src/app/agent/init-agent-store.ts           |    5 +-
 src/app/chat/chat.page.spec.ts              |  296 +--
 src/app/chat/location-picker.component.html |    6 +-
 src/app/chat/location-picker.component.ts   |   10 +-
 src/app/domain/location.store.spec.ts       |   62 +-
 src/app/domain/location.store.ts            |   49 +-
 src/app/replay/recordings.spec.ts           |   19 +
 src/app/replay/recordings.ts                |   17 +-
 src/main.ts                                 |   19 +-
 tsconfig.spec.json                          |    1 +
 18 files changed, 3725 insertions(+), 211 deletions(-)

$ git status --short   (sandbox mask entries such as .bashrc, .claude/ omitted)
 M agent/src/prompt.spec.ts
 M agent/src/prompt.ts
 M docs/improvements.md
 M docs/work/m3-reserve-maps-hosting/plan.md
 M public/recordings.json
 M src/app/agent/agent-mode.spec.ts
 M src/app/agent/agent-mode.ts
 M src/app/agent/assistant-agent.token.ts
 M src/app/agent/init-agent-store.ts
 M src/app/chat/chat.page.spec.ts
 M src/app/chat/location-picker.component.html
 M src/app/chat/location-picker.component.ts
 M src/app/domain/location.store.spec.ts
 M src/app/domain/location.store.ts
 M src/app/replay/recordings.spec.ts
 M src/app/replay/recordings.ts
 M src/main.ts
 M tsconfig.spec.json
?? docs/work/m3-reserve-maps-hosting/task-log/task-4.5-recorder-recordings-replay-proof.md
?? src/app/chat/chat.page.recorded.spec.ts
?? src/app/chat/testing/
?? src/app/replay/recorder.spec.ts
?? src/app/replay/recorder.ts
?? src/app/replay/recordings-file.spec.ts
```

### Sessions

- claude-code 3c4df74a-5a60-4c13-8d8b-51ab8b4edc89 (2026-09-29) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/3c4df74a-5a60-4c13-8d8b-51ab8b4edc89.jsonl
- claude-code 9fb3a1a2-f83a-41e2-9fc4-d2c6fb8f8df6 (2026-09-29, part 3) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/9fb3a1a2-f83a-41e2-9fc4-d2c6fb8f8df6.jsonl
