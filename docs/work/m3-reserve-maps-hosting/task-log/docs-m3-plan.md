# docs: M3 plan — reserve, MapLibre, hosting with replay

### Task

Turned spec §8 "M3 — Reserve, Karten-Upgrade, Hosting" into `docs/work/m3-reserve-maps-hosting/plan.md`:
six tasks, the decisions of the planning conversation in the preamble. No code changed.

### Status

DONE — planning only, agreed step by step with the user on 2026-09-26. Not independently reviewed.
No task has been started.

### Root Cause

Not a bug — a scope conversation. The handoff asked for a nine-task proposal covering the spec's
M3 plus ten register entries; the user cut it to what finishes the demo: six tasks, no browser-side
BYOK, no prompt/eval task, no data-hygiene task, no automated smoke test of the deploy output. The
replay design was reworked twice during the conversation until it had one rule a reader can hold in
their head ("a button is a recording"); the earlier variants are recorded below so nobody re-derives
them.

### Files Modified

- `docs/work/m3-reserve-maps-hosting/plan.md` (new) — preamble with spec pointers, predecessor,
  scope, seven decisions, conventions and task order; Task 1 reserve handler and `ConferenceStore`,
  Task 2 MapLibre inside `mfe-maps`, Task 3 `ReplayAgent`, recording format, agent mode and the
  replay notice, Task 4 self-contained prompts, capture script and the sixteen recordings, Task 5
  static deployment, Task 6 docs; five cross-cutting items.

### Files Read (Context Only)

- `handoff.md` (the session's brief), `docs/spec.md` (whole), `docs/specs/visual-language.md` §8.1–8.3,
  `docs/work/visual-language/plan.md` (format and preamble conventions), its task-9 log ("Context
  for Next Task"), `docs/work/m2-nf-split/plan.md` (cross-cutting section), the M2 task-3, task-4 and
  task-7 logs (boot probes, deploy-manifest notes, replay note), `docs/work/publication/plan.md`,
  `docs/architecture.md` (headings, styling zones, status), `docs/how-it-works.md` (click section,
  DevTools mentions), `docs/improvements.md`, `docs/tech-debt-backlog.md`, `docs/book-learnings.md`
  (grep only; removed before publication).
- Shell: `src/main.ts`, `src/bootstrap.ts`, `src/app/app.config.ts`, `src/app/app.routes.ts`,
  `src/app/a2ui/{action-bus,provide-a2ui-catalog,surface-host-rules,catalog-context,assistant-catalog,agent-capabilities.token}.ts`,
  `src/app/agent/{init-agent-store,agent-store-helper,assistant-agent.token,create-frontend-tool,me-context-entry,render-failure-correction,surface-data.store}.ts`,
  `src/app/agent/tools/*.ts`, `src/app/domain/{conference,find-conferences,location.store,cities}.ts`,
  `src/app/federation/*.ts`, `src/app/chat/*.{ts,html}`, `src/app/testing/mock-agent.ts`,
  `src/app/playground/playground.ts` (subscribe pattern), the heads of `chat.page.spec.ts`,
  `renderer-integration.spec.ts`, `render-surface.tool.spec.ts`.
- Remotes: everything under `projects/mfe-maps/src`, `projects/mfe-charts/src/charts/{gauge,timeline}.schema.ts`,
  `gauge.component.html`; `shared/capabilities/*.ts`, `shared/agent-contract.ts`; the three
  `federation.config.mjs`, `public/federation.manifest.json`, `angular.json`, `package.json`,
  `sheriff.config.ts`, `eslint.config.js`, `.gitignore`, the tsconfigs.
- Agent and eval: `agent/src/{agent,config,server,prompt}.ts`, `agent/package.json`, `eval/*.ts`.
- Outside the repo: `~/projects/FrankensteinMeetingRoom/scripts/build-deploy.mjs` and its
  `docs/plans/m6-deployment.md` (grep); type declarations of `@ag-ui/client`, `@ag-ui/core`,
  `@a2ui/web_core` (`A2uiClientAction`, `DataModel`), `@angular-architects/native-federation-v4`
  (`initFederation`), `@softarc/sheriff-core` (root-module semantics), `ai` in `agent/node_modules`
  (`MockLanguageModelV4`, before BYOK was dropped).

### Key Decisions

- **Scope cut to what finishes the demo (user).** Dropped from the nine-task proposal: a prompt/eval
  task for request 4 (with register entries 47 and 36), a data-hygiene task (entries 10 and 41), the
  browser-side BYOK agent, and a Playwright smoke test of the deploy output. What survives of them:
  prompts 2 and 4 get self-contained wording and the scorer gets `A4` and `host-rules`, because the
  capture needs both (Task 4); the user checks the deployed page by hand (Task 5).
- **Your own key means the local agent server, not a browser agent (user).** The key belongs on a
  server; `.env.example`, `agent/src/config.ts` (`resolveModel` fails without a key) and `npm start`
  already give anyone with a key the live demo. The spec's optional `BrowserAgent` (AI SDK in the
  browser, one model call per run) was on the table and is not built; Task 6 corrects the spec on both
  sides. Consequence: the agent mode is `local | replay` only.
- **Replay lives in the browser, not as a Mastra mock mode (user question).** A static site on the
  user's host (PHP only) cannot run a Node backend; spec §0's convergence argument ("no server tools →
  trivial agent → static hosting") says the same. Nothing in `agent/` changes. The shape exists as the
  test seam `MockAgent`; the recording is a static asset (`public/recordings.json`) fetched like the
  manifest.
- **A button is a recording (user, after three rounds).** Every example prompt is recorded as the
  first message of a fresh conversation, per capability set; replay keys on set × prompt and ignores
  history. Variants considered and rejected: (1) chain only — out-of-order clicks get "not recorded",
  awkward for a demo visitor; (2) chain plus single-start fallback, seven recordings per set — correct
  but the rule needed a table to explain, and its only gain over (3) is that "Show them on a map" keeps
  its "them"; (3) chosen. A branching prompt tree (buttons depending on earlier choices) was named by
  the user and rejected by both: combinatorial recordings plus UI state. Consequence: prompts 2 and 4
  are reworded so they stand alone; the eval plays the same texts, so the gate runs once before the
  capture. Clicked prompts are not locked: a re-click replays, a locked button would be a dead one.
- **All four capability sets are recorded.** Two remotes, the panel toggles each, so none, `charts`,
  `maps` and `charts,maps` are all reachable; sixteen recordings, the set list derived from the
  manifest. The register's line 21 (≈ 8 recordings keyed by conversation path) is superseded and is
  ticked with that note in Task 6. The empty set records whatever the prompt makes the model say —
  `messageWidget` or basic-catalog lists — as-is.
- **Where the replay mode is labelled (user: prominent, not spammy).** One line above the chat in
  replay mode; an "Agent" section in the existing Details panel in every mode with the live
  alternative and the Native Federation DevTools link (user: the link is mode-independent);
  CopilotKit's "AI can make mistakes" hidden while no model runs. Rejected: a chip in the ink band
  (tablet width is already tight, register entries 43 and 44) and a fake first assistant message.
- **Recording format holds tool calls, not AG-UI events.** Per set × prompt the runs, each run the
  model's tool calls (name, parsed args); the `ReplayAgent` synthesises the events with the helpers of
  `mock-agent.ts`, which move to production code. Surface ids get a per-playback suffix because the
  shell rejects an existing `surfaceId` and would start correction runs on a re-click. `format` and
  `a2ui` are pinned — the vocabulary is deliberately unversioned, the recordings are one of the two
  places a pin belongs.
- **Mode chosen at boot, default per build.** `?agent=local|replay` overrides a default set by
  `fileReplacements` in a `deploy` configuration (`local` in development, `replay` in the deploy
  build) — the same "toggle = reload" shape as `?capabilities=`.
- **MapLibre stays mandatory; its inputs are proposals the task verifies.** Spec §8 names it and the
  README will cite it. OpenFreeMap's `positron` recoloured with the kit's values (no key, no account);
  HTML markers for the dots so specs click without WebGL, a symbol layer for the labels so MapLibre's
  collision detection applies; popup with the label only, because a neutral primitive cannot know
  ticket counts. Open until the task starts: whether headless Chromium in Vitest initialises WebGL,
  and the style's layer ids.
- **Six tasks, one over the "handful", none merged.** Task 3 is the largest (agent, format, mode,
  notice) and sits at the size limit; splitting the notice off would leave Task 3 without the "clearly
  labelled default" the spec demands. Order: 1 and 3 before 4, 3 before 5, 2 independent, 6 last.
- **Process note (user).** The session read implementations in full before proposing anything,
  against the plan skill's own rule that key locations are existence-checked, not studied. The
  proposal came late because of it. The fix for next time is in memory, not in this repo.

### Review Focus

- **Behavior claims:** (1) Each task block can be executed from the plan alone — every spec-derived
  fact the executing agent needs is inlined, no block says "see spec". (2) The preamble's decisions
  match what the user agreed in the conversation, including the two rejected replay variants and the
  BYOK reasoning. (3) Every key location names a file that exists and a symbol that is found there.
- **Plan deviations:** No plan (fix lane).
- **Assumptions / choices:** OpenFreeMap as tile source (no key) — not confirmed by the user in so
  many words, presented twice without objection; the self-contained prompt wordings are examples, the
  final strings are Task 4's; the recording format's exact JSON shape is Task 3's to settle within the
  stated constraints (set × prompt, runs of tool calls, two pins).
- **Scope notes:** `handoff.md` in the repository root is the previous session's handoff document;
  it stays untracked and out of the commit. `docs/improvements.md` untouched here — Task 6 ticks the
  entries the plan takes in.
- **Read next:** the plan preamble's decision list (is anything stated that was not agreed);
  Task 3's format block and the run-index rule (the one piece of logic the whole hosting rests on);
  Task 4's requirement table (which set × prompt is judged by what).

### Test Evidence

Planning only; no test suite touches the plan.

- Key-location existence: every file named in the plan was listed or opened this session; symbols
  checked by grep — `A2uiActionBus.subscribe`, `createClientDataMessages`, `SurfaceDataStore.confs`,
  `MockAgent`/`toolCallsRun`/`emptyRun`, `ASSISTANT_AGENT` factory, `toCapabilitiesQuery`,
  `driveRequest`/`execute`/`recordSurface`/`pendingToolCalls`/`toAgUiTool`, `hasReserveButton`,
  `DATE_LITERAL`, `MAP_META`, `initFederation` (`native-federation-v4/src/index.d.ts:44`), the
  fresh-id rejection (`render-surface.tool.ts:111`), the `g.cf-marker` hooks in
  `chat.page.spec.ts:76`, `render-surface.tool.spec.ts:118`, `projects/mfe-maps/src/app/app.spec.ts:23`.
  `scripts/` and `src/environments/` do not exist (marked new). `maplibre-gl` is not installed.
- Line numbers in the plan checked against `grep -n '^## \|^### '` of `docs/architecture.md`,
  `docs/how-it-works.md` and against `cat -n docs/spec.md` (status 3, §3.8 122, `Map` row 133, M3 182,
  E9 227, acceptance 6 at 249).
- Plan structure: six `## Task N:` headings on their own lines, a closing `## Cross-Cutting
  Acceptance`, 29 `T{N}-AC-NN` ids, preamble of 32 lines, the flexibility clause verbatim.
- `casefile root -v`: home mode, scope `m3-reserve-maps-hosting`, work root did not exist before this
  session and was created for the plan.

### Open Issues

None on this branch beyond the plan's own tasks. Register entries left open by decision (24, 46, 47,
10, 41, 36, 33) stay where they are.

### Context for Next Task

- Start with `/start-task 1`; Task 1 and Task 3 are independent of each other, Task 2 of both.
- Every decision the executing agent needs is in the plan preamble; this log holds the rejected
  alternatives and the reasons, nothing the tasks depend on.
- `handoff.md` is the last session's handoff, untracked; delete it once the plan is committed.
- Gotchas carried from earlier scopes: dev servers, model calls and Chromium run outside the sandbox
  (`tsx` fails inside it); a sandboxed `git status` lists device-node dotfiles in the repo root that
  are not files; check the agent log for a live `tsx watch` reload before a paid eval or capture run.

### Git State

`git diff --stat`: empty (nothing tracked changed).

`git status --short` (dotfile noise of the sandbox omitted):
```
?? docs/work/m3-reserve-maps-hosting/
?? handoff.md
```

### Sessions

- claude-code fb7c2268-3997-4d7a-b7bb-0175582e90fd (2026-09-26) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/fb7c2268-3997-4d7a-b7bb-0175582e90fd.jsonl
