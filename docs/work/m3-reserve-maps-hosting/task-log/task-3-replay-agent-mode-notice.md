# Task 3: ReplayAgent, recording format, agent mode and the replay notice

### Task

The shell gets a second agent behind the chat: a `ReplayAgent` that plays recorded tool calls per
capability set and example prompt from `public/recordings.json`, chosen at boot by an agent mode
(`local | replay`, `?agent=` over a build default that a `deploy` configuration flips to replay),
labelled by a notice above the chat and an "Agent" section in the capability panel, and streamed at
the pace of the live agent so the chat shows the same intermediate states.

### Status

DONE — implementation and task-local verification complete: `npm run test:shell` 25 files / 159
tests (before: 21 / 135), `npm run test:eval` 4 / 30, ESLint, `sheriff verify`, Prettier and
`tsc -p tsconfig.app.json` clean; the deploy build carries the replay default; the plan's quick
functional check was driven with Playwright against the user's running dev servers and the user
looked at the result. Independent review is pending — not requested yet.

### Files Modified

- `src/app/replay/recordings.ts` (new) — `RECORDINGS_FORMAT`/`RECORDINGS_A2UI` pins, `RecordedCall`,
  `RecordedRun`, `Recordings`, `NO_RECORDINGS`, `capabilitySetKey`, `parseRecordings` (hand-rolled
  structural validation, refuses with `console.error`), `findRecording` (trimmed prompt).
- `src/app/replay/replay-agent.ts` (new) — `ReplayAgent extends AbstractAgent`, `NOT_RECORDED_TEXT`;
  `run()` reads prompt and run index from the transcript, re-ids every surface message per playback,
  hands the instant script to `paceRun`.
- `src/app/replay/scripted-run.ts` (new) — `ScriptedToolCall`, `emptyRun`, `toolCallRun`,
  `toolCallsRun`, `runStarted`, `runFinished`, moved out of `testing/mock-agent.ts`.
- `src/app/replay/paced-run.ts` (new) — `ReplayPace`, `REPLAY_PACE`, `paceRun`: reasoning events
  fill the thinking pause, tool-call arguments stream in chunks, RxJS `timer` between steps.
- `src/app/replay/recordings.spec.ts`, `replay-agent.spec.ts`, `paced-run.spec.ts` (new).
- `src/app/agent/agent-mode.ts` (new) + `agent-mode.spec.ts` (new) — `AgentMode`, `AgentSetup`
  (`{ mode: 'local' } | { mode: 'replay'; recordings }`), `resolveAgentMode(search, buildDefault)`.
- `src/environments/environment.ts` (new, `agentMode: 'local'`), `environment.deploy.ts` (new,
  `'replay'`).
- `src/app/agent/assistant-agent.token.ts` (modified) — `AGENT_MODE` token; `ASSISTANT_AGENT` without
  a default factory; `provideAssistantAgent(setup)` registers mode, agent (`HttpAgent` or
  `ReplayAgent` keyed by the loaded manifest names) and the CopilotKit config.
- `src/app/app.config.ts` (modified) — `createAppConfig(remotes, agent)`; `src/bootstrap.ts`
  (modified) — `bootstrap(remotes, agent)`; `src/main.ts` (modified) — `fetchJson`, `setupAgent`
  (mode, recordings fetched in replay mode only), phase-one comment widened to every shared external.
- `src/app/testing/mock-agent.ts` (modified) — `MockAgent` only; helpers imported from `replay/`.
- `src/app/a2ui/surface-host-rules.ts` (modified) — `SURFACE_MESSAGE_KEYS` exported and used by
  `surfaceIdOf`; the replay re-id walks the same list.
- `src/app/chat/chat.page.ts` (modified) — `AGENT_MODE` on the host as `data-agent-mode`.
- `src/app/chat/chat-header.component.{ts,html,css}` (modified) — the replay notice as an ink stripe
  below the prompts (grid area `replay`, phone below the chips), "How it works →" button opens the
  panel via `viewChild`.
- `src/app/chat/capability-panel.component.{ts,html,css}` (modified) — `open()`, the "Agent"
  section (mode row with `AGENT_PORT`, replay explanation, live line with repository link, NF
  DevTools link), `REPOSITORY_URL`, `NF_DEVTOOLS_URL`.
- `src/app/chat/capability-panel.component.spec.ts`, `chat.page.spec.ts`, `app.config.spec.ts`
  (modified) — `AGENT_MODE` provided, replay cases, helper imports from `replay/scripted-run`.
- `src/theme/copilotkit.css` (modified) — disclaimer hidden under
  `app-chat-page[data-agent-mode='replay']`.
- `angular.json` (modified) — shell `deploy` configuration on `esbuild` (production budgets and
  hashing repeated, `fileReplacements`) and on `build` (`shell:esbuild:deploy`).
- `public/recordings.json` (new) — fixture: prompt 1 for `charts,maps` and `charts` (a Column with
  Timeline and a name Text), `maps` and `` empty until Task 4 captures.
- `docs/improvements.md` (modified) — replay register entry ticked with the set × button note; one
  new entry for the README (see Open Issues).

### Files Read (Context Only)

- `docs/work/m3-reserve-maps-hosting/plan.md` (preamble, Task 3), `task-log/task-2-*.md`,
  `task-1-*.md` (decisions, next-task context), `docs-m3-plan.md` (replay decisions),
  `docs/improvements.md`, `docs/specs/visual-language.md` (amber rule), `shared/theme/tokens.css`.
- `src/app/agent/{init-agent-store,agent-store-helper,create-frontend-tool,render-failure-correction}.ts`,
  `tools/{render-surface,message-widget,find-conferences}.*`, `src/app/federation/*`,
  `src/app/a2ui/agent-capabilities.token.ts`, `shared/agent-contract.ts`,
  `shared/capabilities/agent-capability.ts`, `sheriff.config.ts`, `federation.config.mjs`,
  `tsconfig.app.json`, `projects/mfe-charts/src/charts/timeline.schema.ts`,
  `src/app/domain/conferences.json`.
- `node_modules/@ag-ui/core` (event and message types, reasoning event schemas),
  `@ag-ui/client` (`AbstractAgent.run` signature), `@copilotkit/angular` (disclaimer component,
  reasoning message label: "Thinking…" while running and latest, else "Thought for …").

### Key Decisions

- **Recordings are fetched only in replay mode (user approved in the briefing).** The plan said
  "fetches the recordings in phase one"; local mode and the development build make no request to
  `recordings.json`, so a missing file cannot affect the live demo.
- **`AgentSetup` lives in `agent-mode.ts`, not in the token file.** Phase one (`main.ts`) builds it
  and may import neither Angular nor a shared external; the discriminated union carries the
  recordings only in the replay arm, so the UI reads the mode from `AGENT_MODE` and the recordings
  reach nothing but the agent factory.
- **`ASSISTANT_AGENT` has no default factory any more.** The mode is a required argument of
  `provideAssistantAgent(setup)`; a default would have hidden which agent a TestBed runs. Specs pass
  `{ mode: 'local' }` and override the token, or `{ mode: 'replay', recordings }` for the real
  replay path.
- **The set key is spelled from the loaded manifest names, not from `capability.name`.** The
  recordings are keyed as the URL spells the set (`toCapabilitiesQuery`); `CAPABILITY_STATUS` carries
  the manifest names in manifest order, `AGENT_CAPABILITIES` the remotes' self-declared names, which
  agree today but are not the same contract. Both spellings are a `join(',')`; the comment in
  `capabilitySetKey` names the invariant.
- **Hand-rolled validation instead of a schema library.** Four structural rules (pins, sets, prompts,
  runs of calls) on a file the repository itself writes; the parser stays dependency-free like the
  rest of phase one. (Root `zod` is skipped from sharing and would have been importable; it was not
  needed.)
- **The input box stays open; free text answers "not recorded" (user, after asking).** The register
  entry demanded "not a dead input"; the answer explains what the demo is and how to run it live.
  A typed text identical to a badge plays the badge's recording: the lookup is by prompt text after
  `trim()`, exact otherwise — no fuzzy matching, which would be a second rule beside "a button is a
  recording".
- **Every surface message is re-id'd per playback with the run id.** `SURFACE_MESSAGE_KEYS` is
  exported from `surface-host-rules.ts` so `surfaceIdOf` and the re-id walk one list. Tool-call and
  message ids come from `toolCallsRun` (`<name>-<runId>-<index>`, `message-<runId>`).
- **The notice is an ink stripe, not the `--cf-sub` ground the plan named (user chose variant A).**
  Grey on grey was overlooked; two variants were rendered over the live page by injected CSS (ink
  stripe with the chips' dot; `--cf-sub` with a rail-blue accent bar). Amber/yellow and a warning
  triangle were rejected: the kit reserves amber for scarce/unreachable only, and a triangle says
  "broken" while replay is the intended default of the hosted demo.
- **"How it works →" is a button, not a link.** It opens the panel's native `<details>` through
  `CapabilityPanelComponent.open()` (a `viewChild` in the header); a link would need a URL for an
  in-page state.
- **The Agent section shows in every mode; the mode row reads `AGENT_PORT` from the contract**
  (`local — agent server on localhost:3001`, `replay — recorded answers`). The DevTools link is
  mode-independent, as decided in planning.
- **The disclaimer is hidden by CSS from the page host.** `copilot-chat-view-disclaimer` sits in
  the light DOM under `app-chat-page`, so `[data-agent-mode='replay']` on the host plus one rule in
  the CopilotKit theme zone reaches it; verified by computed style in the browser.
- **`deploy` is its own configuration, not `production` (user asked, accepted; would have named it
  `demo`).** `production` is `ng build`'s default and keeps building the app as designed (shell plus
  agent server); `deploy` bundles everything host-specific — the replay default now, base href and
  relative manifest in Task 5 — so a later real deployment with a key stays `production`. Angular
  configurations do not inherit, hence the repeated budgets. To be documented in the README
  (publication scope) and Task 6.
- **`fetchJson` returns `unknown`; the manifest cast stays visible at the call site (user question).**
  A generic `fetchJson<T>` would be a cast in signature form; the recordings go through
  `parseRecordings`, the manifest is trusted as before (nothing reads more than `Object.keys` and
  `initFederation` fails on a broken one). A `fetchManifest` wrapper was offered and not taken.
- **`parseRecordings(json)`, not `file` (user).** "file" suggests a path or string; the argument is
  the parsed JSON body. The spec's fixture helper is `recordingsJson()` for the same reason.
- **Pacing: the live agent's stream shape, at about a fifth of its speed (user: the flat delay was
  unrealistic).** A first version delayed every run by 300 ms; the user saw prompt → nothing →
  answer, while the live agent shows a reasoning line, "Building surface …" and then the surface.
  One live conversation was captured in the browser (SSE events with timestamps, DOM sampled every
  100 ms): reasoning line at 4.9 s, second reasoning line and "Building surface …" at 10.1 s, surface
  at 16.5 s; argument deltas of ~20 characters every ~45 ms. `paceRun` reproduces the shape from the
  instant script: `REASONING_START`/`REASONING_MESSAGE_START` right after `RUN_STARTED`, the ends
  after `thinkMs`, every `TOOL_CALL_ARGS` split into `chunkChars` pieces `chunkMs` apart
  (`REPLAY_PACE = { 900, 30, 64 }`). Measured on the live page: 0.1 s / 1.0 s / 1.9 s / 2.2 s. The
  visible states come from CopilotKit and the existing surface renderer ("Building surface …" while
  the tool call is in progress); no UI code changed.
- **Recording raw AG-UI events instead was considered and rejected (user asked).** Ids (`threadId`,
  `runId`, tool-call ids, surface ids) must be rewritten per playback anyway, and a raw recording
  spreads the surface id over dozens of argument deltas; the tool-call format is what the eval
  scorer accepts, five to ten times smaller, readable in a diff, and pinned to the tool contract
  rather than to the AG-UI protocol version.
- **The reasoning line reads "Thought for a few seconds" from the start.** CopilotKit's label
  depends on `isRunning && isLatest`; the live agent renders the same way (seen in the capture), so
  no reasoning content is sent — the message carries only the label.
- **An empty run (index beyond the recording) also thinks.** One rule for every run; a correction
  run after a rejected surface therefore looks like a model that answered nothing.
- **The register entry was ticked in this task**, as the task block says (the planning log had
  scheduled it for Task 6), with the set × button note.
- **Fixture until Task 4:** prompt 1 for `charts,maps` and `charts` only; `maps` and the empty set
  answer "not recorded" until the capture.

### Review Focus

- **Behavior claims:** (1) In replay mode a click on an example prompt plays the recording of the
  loaded set and that prompt, run by run, over the client's real data, with fresh surface ids per
  playback and no request to the agent server; the same prompt twice, or prompts in any order, all
  render. (2) Free text, a set without recordings, or a refused/missing file answer with the
  not-recorded text through `messageWidget`; nothing else happens. (3) `?agent=` decides the mode
  before the build default; the development build defaults to `local`, the `deploy` configuration to
  `replay`; the notice shows in replay mode only, the Agent section and the DevTools link in both.
  (4) Every replayed run streams like the live agent: reasoning line, then "Building surface …",
  then the surface.
- **Plan deviations:** recordings fetched in phase one → only in replay mode → no request in local
  mode. `AgentSetup`/mode in the token file → `agent-mode.ts` → phase one may not import Angular.
  `ASSISTANT_AGENT` factory picks → the factory lives in `provideAssistantAgent(setup)`, the token
  has no default → tests see which agent they run. Notice on `--cf-sub` → ink stripe → user's
  choice after looking. "How it works" link → button → in-page action. Pacing → not in the plan →
  user asked for realism; `paced-run.ts` and its spec are new files beyond the plan, as is
  `recordings.spec.ts`. `render-surface.tool.ts:111` and `render-failure-correction.ts` listed as
  key locations → read only, unchanged. Register entry ticked now rather than in Task 6.
- **Assumptions / choices:** the reasoning message carries no content; the set key uses manifest
  names; `deploy` repeats production's budgets; the `REPLAY_PACE` numbers are one measurement
  scaled by about a fifth; the not-recorded text names the repository README and `npm start`.
- **Scope notes:** `MockAgent` shrank to the class; the chat spec imports the helpers from
  `replay/scripted-run`. The phone notice wraps to three lines at 390 px (user's look, accepted).
  `tmp/task-3/` holds probe scripts, screenshots and the scratch deploy build — gitignored, not part
  of the change.
- **Read next:** `src/app/replay/replay-agent.ts` `currentTurn()` / `forPlayback()` — the two
  transcript reads and the re-id are the whole replay rule; `src/app/replay/paced-run.ts` `toSteps()`
  — where events are added and split; `src/app/agent/assistant-agent.token.ts` `createAgent()` — the
  mode branch and the set key from `CAPABILITY_STATUS`.

### Test Evidence

- Final code, sandboxed ChromiumHeadless: `npm run test:shell` — `Test Files 25 passed (25)`,
  `Tests 159 passed (159)`; new files `recordings.spec` (4), `replay-agent.spec` (7),
  `paced-run.spec` (4), `agent-mode.spec` (2); extended `chat.page.spec` (+4 replay cases),
  `capability-panel.component.spec` (+2), `app.config.spec` (+1).
- `npm run test:eval` — `4 passed`, `30 passed` (shares `surface-host-rules.ts`; run after that
  file's change, unaffected by the later replay-only edits). Charts, maps and agent suites were not
  run: nothing under `projects/` or `agent/` changed.
- `npx sheriff verify`: all projects validated. `npx eslint` over the changed folders: clean.
  `npx prettier --check` over the changed files: clean (pre-existing warnings on
  `init-agent-store.ts` and `render-surface.tool.spec.ts`, untouched). `npx tsc -p tsconfig.app.json
  --noEmit`: clean.
- Deploy default (T3-AC-04, build side): `npx ng run shell:esbuild:deploy --output-path
  tmp/task-3/dist-deploy` (the plain application target, so the user's dev server's `dist/` stayed
  untouched) — complete, and the main chunk contains `agentMode:"replay"` once.
- Quick functional check, Playwright against the user's running dev servers (`tmp/task-3/probe.mjs`,
  screenshots `replay-desktop.png`, `replay-free-text.png`, `replay-panel.png`,
  `replay-phone-charts.png`, `local-panel.png`): `/?agent=replay` — notice present,
  `data-agent-mode="replay"`, `recordings.json` served (200), one surface after the first click and
  two after the second (36 timeline markers), disclaimer `display: none`, free text through
  CopilotKit's own input → "This question has no recorded answer …", "How it works →" opens the
  panel, mode row `replay — recorded answers`, 0 requests to port 3001, no console errors;
  `/?agent=replay&capabilities=charts` at 390 px — set key `charts` plays prompt 1 (18 markers);
  `/` — no notice, `data-agent-mode="local"`, DevTools link present, disclaimer visible, mode row
  `local — agent server on localhost:3001`.
- Notice variants (`notice-variants.mjs`, CSS injected at runtime, source untouched):
  `notice-a-ink-band.png`, `notice-b-rail-accent.png`; final look `notice-final-desktop.png`,
  `notice-final-phone.png`.
- Live-agent capture (`real-stream.mjs`, one conversation = two model calls, `replay-run-end.png`
  and `real-run-end.png`): SSE timeline and DOM states as quoted in Key Decisions; the same probe on
  `?agent=replay` (`replay-stream.mjs`): reasoning line 96 ms, second reasoning line 1016 ms,
  "Building surface …" 1931 ms, surface 2237 ms, no agent call.
- Probes are scripts in the gitignored `tmp/task-3/` (like task 2's `tmp/task-2/`), not in the
  source tree; the scratch deploy build in `tmp/task-3/dist-deploy` can be deleted at will.
- Earlier runs, overtaken by later edits: the first replay chat cases passed with the flat 300 ms
  delay (156 tests); after `paceRun` three expectations were adapted to the added reasoning events
  (the tool-call start is no longer the second event, the empty run carries the reasoning block, the
  reasoning label is "Thought for …" rather than "Thinking…") and the suite was re-run green.

### Acceptance Coverage

- `T3-AC-01` — passed — `replay-agent.spec.ts` "T3-AC-01 plays the recording of the loaded set and
  the clicked prompt, run by run", "… the set decides …", "… ignores the history before the last
  user message; ids derive from the run"; `recordings.spec.ts` "T3-AC-01 parses a pinned file and
  finds the runs by set and verbatim prompt"; `chat.page.spec.ts` "T3-AC-01 a click plays the
  recorded surface over the client data and no request leaves the browser" (real `ReplayAgent`
  through the real chat, `fetch` spy, live pace with the reasoning line and "Building surface"
  asserted in order). Browser probe: 0 requests to port 3001.
- `T3-AC-02` — passed — `replay-agent.spec.ts` "T3-AC-02 every playback gets surface ids of its
  own, on every message of the surface", "… a run beyond the recorded ones is empty …";
  `chat.page.spec.ts` "T3-AC-02 the same prompt twice renders twice; the transcript grows and nothing
  is rejected" (no `console.error`/`warn`).
- `T3-AC-03` — passed — `replay-agent.spec.ts` "T3-AC-03 free text, a foreign set and a missing
  prompt all answer with the not-recorded text"; `chat.page.spec.ts` "T3-AC-03 free text answers with
  the not-recorded text and nothing else"; browser probe through CopilotKit's input.
- `T3-AC-04` — passed — `agent-mode.spec.ts` "T3-AC-04 ?agent= overrides the build default in both
  directions", "… the build default decides"; `app.config.spec.ts` "T3-AC-04 the agent setup decides
  the mode and the agent behind the chat" (`HttpAgent` vs `ReplayAgent`); the deploy build's main
  chunk carries `agentMode:"replay"` (command in Test Evidence).
- `T3-AC-05` — passed — `chat.page.spec.ts` "T3-AC-05 the notice sits above the chat in replay mode
  only, and opens the panel; the DevTools link is there in both modes";
  `capability-panel.component.spec.ts` "T3-AC-05 the Agent section names the mode, the live
  alternative and the DevTools in either mode"; the hidden disclaimer is CSS only, verified by
  computed style in the browser probe.
- `T3-AC-06` — passed — `recordings.spec.ts` "T3-AC-06 refuses another format or A2UI version with a
  console message and keeps nothing", "… refuses a body that is not sets of prompts of runs of
  calls"; `replay-agent.spec.ts` "T3-AC-06 a refused file leaves every prompt not recorded".
- `XC-01`, `XC-04`, `XC-05` — contributes; the cross-cutting checks are the plan's end-of-scope gate.

### Open Issues

- `docs/architecture.md` (boot diagram and text: `createAppConfig(remotes)`, the shell talks to
  `HttpAgent` only, line 581 "replay publication") and `docs/how-it-works.md` do not know the agent
  mode, `?agent=`, the environment files, the `deploy` configuration, the recordings file and its
  pins, `paceRun`, or that the scripted-run helpers now live in `src/app/replay/`;
  `docs/spec.md:166` still says "aufgezeichnete Events" where tool calls are recorded, and §12
  acceptance 6 still names an optional BYOK mode. (→ Task 6)
- Promoted: README documents the agent modes (`?agent=`, build defaults), the `deploy` build
  command and why the configuration is named `deploy` rather than `demo` (→ improvements register;
  README is publication scope).
- `public/recordings.json` holds prompt 1 for `charts,maps` and `charts` only; `maps` and the empty
  set answer "not recorded" until the capture writes all sixteen. (→ Task 4)
- The `deploy` configuration takes the base href and the relative deploy manifest. (→ Task 5)

### Context for Next Task

- Interfaces: `Recordings` (`Record<setKey, Record<prompt, RecordedRun[]>>`), `RecordedRun =
  readonly { name; args }[]`, `parseRecordings(json: unknown): Recordings`, `capabilitySetKey(names)`,
  `findRecording(recordings, setKey, prompt)`, `NO_RECORDINGS`; `ReplayAgent(recordings, setKey,
  pace = REPLAY_PACE)`, `NOT_RECORDED_TEXT`; `paceRun(events, pace, runId): Observable<BaseEvent>`,
  `ReplayPace { thinkMs; chunkMs; chunkChars }`; `AgentMode`, `AgentSetup`,
  `resolveAgentMode(search, buildDefault)`; `AGENT_MODE`, `provideAssistantAgent(setup)`;
  `createAppConfig(remotes, agent)`, `bootstrap(remotes, agent)`; `emptyRun`/`toolCallRun`/
  `toolCallsRun`/`ScriptedToolCall` now in `src/app/replay/scripted-run.ts`.
- Task 4 (capture): write `public/recordings.json` with `format: 1`, `a2ui: 'v0.9'`, `capturedAt`,
  and `recordings[<set>][<prompt verbatim>] = RecordedRun[]` — the outer list is one entry per model
  call (assistant message), the inner list that message's tool calls with parsed `args`; the set key
  is the loaded manifest names in manifest order joined by `,` (`''` for none). The eval's recorder
  already yields name + parsed args per call. Surface ids in the recording may repeat across
  prompts; the agent suffixes them per playback. Keep dates and data out of `args`.
- Task 5 (deploy): `ng build shell --configuration deploy` (NF target → `shell:esbuild:deploy`);
  add `baseHref` and the manifest there. The plain `ng run shell:esbuild:deploy --output-path …`
  builds without federation and is the quick check for `fileReplacements`.
- Specs: a TestBed that renders the chat or the panel needs `AGENT_MODE` (`provideAssistantAgent(...)`
  or `{ provide: AGENT_MODE, useValue }`); `renderReplayChat(recordings, pace?)` in
  `chat.page.spec.ts` runs the real replay path — pass an instant pace unless the case is about
  timing, and wait with `waitForReplay` (10 s) when it is.
- Gotcha: CopilotKit labels a reasoning message "Thought for …" as soon as it is not the latest
  message; a spec must not wait for "Thinking…". The reasoning line and "Building surface …" are the
  observable states of a paced run.
- The dev servers (4200–4202, 3001) were running throughout and were not restarted; the running shell
  picked up the new `public/recordings.json` without a restart.

### Git State

```
$ git diff --stat
 angular.json                                    |  24 ++++
 docs/improvements.md                            |   2 +-
 src/app/a2ui/surface-host-rules.ts              |  10 +-
 src/app/agent/assistant-agent.token.ts          |  60 ++++++---
 src/app/app.config.spec.ts                      |  22 ++-
 src/app/app.config.ts                           |  15 ++-
 src/app/chat/capability-panel.component.css     |  14 ++
 src/app/chat/capability-panel.component.html    |  30 ++++-
 src/app/chat/capability-panel.component.spec.ts |  44 +++++-
 src/app/chat/capability-panel.component.ts      |  20 ++-
 src/app/chat/chat-header.component.css          |  53 +++++++-
 src/app/chat/chat-header.component.html         |   7 +
 src/app/chat/chat-header.component.ts           |  18 ++-
 src/app/chat/chat.page.spec.ts                  | 171 +++++++++++++++++++++++-
 src/app/chat/chat.page.ts                       |   4 +
 src/app/testing/mock-agent.ts                   |  64 +--------
 src/bootstrap.ts                                |   5 +-
 src/main.ts                                     |  42 ++++--
 src/theme/copilotkit.css                        |   6 +
 19 files changed, 501 insertions(+), 110 deletions(-)

$ git status --short
 M angular.json
 M docs/improvements.md
 M src/app/a2ui/surface-host-rules.ts
 M src/app/agent/assistant-agent.token.ts
 M src/app/app.config.spec.ts
 M src/app/app.config.ts
 M src/app/chat/capability-panel.component.css
 M src/app/chat/capability-panel.component.html
 M src/app/chat/capability-panel.component.spec.ts
 M src/app/chat/capability-panel.component.ts
 M src/app/chat/chat-header.component.css
 M src/app/chat/chat-header.component.html
 M src/app/chat/chat-header.component.ts
 M src/app/chat/chat.page.spec.ts
 M src/app/chat/chat.page.ts
 M src/app/testing/mock-agent.ts
 M src/bootstrap.ts
 M src/main.ts
 M src/theme/copilotkit.css
?? docs/work/m3-reserve-maps-hosting/task-log/task-3-replay-agent-mode-notice.md
?? public/recordings.json
?? src/app/agent/agent-mode.spec.ts
?? src/app/agent/agent-mode.ts
?? src/app/replay/
?? src/environments/
```

### Sessions

- claude-code 06163396-c3be-4f8e-a6ae-f4a3c43b8895 (2026-09-28) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/06163396-c3be-4f8e-a6ae-f4a3c43b8895.jsonl
