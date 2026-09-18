# Task 7: Eval — capability sets and the missing-vocabulary case

### Task

Made the eval harness play two capability sets — `charts,maps` with the M1 requests, and `charts`
with the scored scenario "map request while no remote announces a `Map`" (`A2-without-maps`) — and
removed every custom component and function name from the static agent prompt — the known cause of
the model building vocabulary it was never told about.

### Status

DONE — implementation complete, all checks green on the final code. `npm run eval` now always plays
both sets (the `EVAL_CAPABILITIES` switch of the first version was removed on the user's decision,
a plan deviation); that loop has a 1-run smoke test against the real model, the 5-run gate figures
come from the per-set runs before it. Both gates reached with real model calls on the final prompt (charts only: A1 5/5, A2-without-maps 5/5 — re-run on the corrected
harness after the review; default set: A1 5/5, A2 5/5, A3 4/5 — the M1 verdicts). Independent
review performed (Codex quick review, 2026-09-18): the hotspot (a refused `Map` attempt was dropped
before scoring, so the text alone passed) absorbed in a slim variant — refused attempts are now
recorded and vocabulary-checked; the recorder extraction and a test through the recording path were
**not** done (user condition: a few lines only) and are promoted. Blind spot 1 (both tools in one
assistant message, browser side) absorbed with a shell spec; blind spot 2 (keyword check is not a
semantic judgement) accepted as documented. Not committed (`/commit 7` pending).

### Files Modified

- `eval/scenarios.ts` (new) — `SCENARIOS`, the two conversations every run plays: `charts,maps` →
  both `vocabulary.ts` files, A1/A2/A3 with the unchanged M1 prompts; `charts` → the charts
  vocabulary, A1, then `A2-without-maps` with the same map prompt. Plus
  `announcedNames(vocabularies)` for the scorer. (An `EVAL_CAPABILITIES` parser, then a lookup,
  were built first and removed again, see Key Decisions.)
- `eval/scenarios.spec.ts` (new) — T7-AC-01: what each of the two scenarios announces and asks, and
  `announcedNames` equal to the keys of the serialized context entry (scorer and model read one
  list).
- `eval/score.ts` (modified) — `RecordedCall` is now `RecordedSurface | RecordedText` (tagged by
  `tool`); `Requirement` gains `'A2-without-maps'`; `score(requirement, calls, announced =
  nothing)`; new `withoutMapFailures` (≤ 1 surface, host rules, vocabulary check, a `messageWidget`
  text matching `/karte|map/i`), `vocabularyFailures` (component names and `findFunctionCalls`
  against basic catalog ∪ announced), `componentNames`, `verdictOf`. The `rendered:` diagnostic of
  the first version was removed again. A1–A3 filter the surface calls
  and are otherwise unchanged. Review fix: `RecordedSurface.rejected?: true` and `surfacesOf(calls,
  rejected)` — A1–A3 and the surface count see accepted surfaces only; `A2-without-maps` runs
  `vocabularyFailures` over refused attempts as well.
- `eval/score.spec.ts` (modified) — fixtures tagged `tool: 'renderSurface'` (typed
  `RecordedSurface`); new `describe('score A2-without-maps')` with six tests (pass with/without a
  surface, unannounced `Map` + `distance`, invented component vs. basic function, silent/evasive
  answers, host rules on the optional surface, `messageWidget`
  invisible to A1–A3). Review fix: a seventh test — a refused `Map` attempt next to an honest text
  fails, and the same refused attempt next to a wired surface leaves A3 passing.
- `eval/run-eval.ts` (modified) — `runEval` loops over `SCENARIOS`: `runScenario` (context from the
  scenario's vocabularies, the former run loop) and `report(scenario, records)` per set, one final
  gate line over both; the recorder tags surfaces and now records `messageWidget` texts; `score`
  gets the announced names; prints the capability set and, per run, each recorded `messageWidget`
  text. The
  vocabulary imports and the `REQUESTS` constant moved to `scenarios.ts`. Review fix:
  `recordRejectedSurface(args, calls)` at both refusal points of a `renderSurface` call
  (`invalid_args` in `execute`, `invalid_messages` in `recordSurface`); `rawMessages(args)` reads
  the raw list defensively for both paths.
- `src/app/chat/chat.page.spec.ts` (modified, review fix) — one spec: a `messageWidget` and a
  `renderSurface` call in one scripted assistant message render both (`app-message-widget`,
  `app-map`) and trigger no follow-up run.
- `agent/src/prompt.ts` (modified) — both `FORMAT_RULES` examples rebuilt from basic components
  only (`Column`, `Row`, `Text`, `Button`; function call `formatCurrency` on `/selectedConf/price`)
  with an intro stating they show format, not answers; output rule 4 (new): `messageWidget` ends
  the turn too, emit both calls in one message when text *and* surface are needed; the "bind, never
  copy" paragraph no longer names `daysUntil`/`distance`; the Vocabulary section now says the
  vocabulary changes between conversations, that unknown names are rejected, and how to answer a
  request no listed component provides.
- `agent/src/prompt.spec.ts` (modified) — `it.each` over the five custom names: the prompt built
  without a catalog entry contains none of them, quoted or backticked.
- `README.md` (modified) — "The model-behavior gate": "5 requests x 5 runs", four lines on the two
  conversations (what passes in the charts-only one, keyword check + printed texts), "roughly 60
  model calls" (an estimate: 40 before, plus the second conversation).
- `docs/improvements.md` (modified) — the task-9 line "A3 prompt example is close to the request-3
  answer" ticked as done; four lines promoted (see Open Issues; the third from the review, the
  fourth from the user's live check).

### Files Read (Context Only)

- `docs/work/m2-nf-split/plan.md` — preamble and the Task 7 block only.
- `docs/work/m2-nf-split/task-log/task-6-maps-remote-boundaries.md` (predecessor: live moment,
  `findFunctionCalls`, server/sandbox gotchas); targeted lines of `task-5-capability-panel.md` (the
  prompt-defect observation), `task-2-runtime-capability-list.md` and
  `docs/work/m1-spike/task-log/task-9-agent-prompt-and-eval.md` (grep hits only).
- `eval/{model-context.spec.ts,vitest.config.ts,tsconfig.json,package.json}`,
  `src/app/a2ui/{catalog-context.ts,surface-host-rules.ts}`,
  `src/app/agent/tools/{render-surface.tool.ts,render-surface.definition.ts,
  find-conferences.definition.ts,message-widget.definition.ts,message-widget.tool.ts}`,
  `src/app/domain/conference.ts`, `shared/capabilities/agent-capability.ts`.
- `projects/mfe-charts/src/charts/{vocabulary.ts,timeline.schema.ts,gauge.schema.ts,
  days-until.fn.ts}`, `projects/mfe-maps/src/maps/{vocabulary.ts,map.schema.ts,distance.fn.ts}` —
  the descriptions the model reads once the examples no longer name these components.
- `agent/{package.json,src/config.ts,src/server.ts}` (dev script, default model, dotenv location).
- `node_modules/@a2ui/web_core/src/v0_9/basic_catalog/functions/basic_functions_api.js` and the
  `BASIC_COMPONENTS`/`BASIC_FUNCTIONS` exports under Node (names; `formatDate`/`formatCurrency`
  argument shapes).
- Review fix: `src/app/chat/chat.page.spec.ts` (`mapSurface`, the `messageWidget` test, the
  `toolCallsRun` use in T7-AC-04), `src/app/testing/mock-agent.ts` (`toolCallsRun`).
- Living-documents grep over `docs/architecture.md`, `docs/improvements.md`, `docs/spec.md` (see
  Test Evidence).

### Key Decisions

— session 2026-09-18

- **Red first, then the fix (user proposal).** Harness and scorer were built and run against the
  *unchanged* prompt before `agent/src/prompt.ts` was touched: `A2-without-maps` 0/5, every run the
  same three reasons (`Map`, `distance`, no `messageWidget`). That turns Task 5's "known cause" into
  a measured one and makes the later 5/5 attributable to the prompt change, not to the harness.
- **The harness scores the model's first answer, not the shell's corrected outcome.** The shell
  rejects an unannounced `Map` (`catalog`) and grants a correction run; the harness does not mirror
  that, in line with its existing rule that host-rule violations are recorded rather than rejected
  so the scorer sees them. Consequence: stricter than the live moment — an answer that is only
  right after a correction counts as a fail. Agreed with the user before implementation.
- **"Names what is missing" is a keyword check on `messageWidget` texts (`/karte|map/i`).** Not a
  semantic judgement, so the harness prints every recorded text and the failing reason names what
  was rendered instead (`… (rendered: Timeline)`). A `Text` inside the surface does not count: the
  prompt asks for `messageWidget`, and the plan's two harness changes define exactly that channel.
  Known limit (user question): a pseudo-map built from basic `Text`/`Row` tiles would pass as long
  as the text names the gap — the scorer judges "nothing unannounced + gap named", not the quality
  of the substitute. The texts of the ten post-fix runs announce a timeline or a list; the surfaces
  of passing runs are not printed and were not inspected. No prompt clause was added for it.
- **Scenarios are an explicit table keyed by the set, not derived from per-requirement needs.**
  `charts,maps` and `charts` are the only scored sets; `maps` alone and the empty set throw ("No
  scenario for the capability set …"). The plan leaves the mirror case unscored, and a run without
  an expectation would report 0/0. Request 3 is not asked under `charts` for the same reason. A1
  *is* scored there — it has to run anyway and shows the basic-only examples still yield a
  `Timeline`.
- **`EVAL_CAPABILITIES` is a whitelist like `?capabilities=`.** Order and spacing of the names do
  not matter; the announced order is the registry's, so the default set serializes byte-identically
  to the former `[chartsVocabulary, mapsVocabulary]`.
- **`RecordedCall` became a tagged union; `announced` is an optional third argument.** Two named
  interfaces (`RecordedSurface`, `RecordedText`) instead of a structural `'text' in call` test. The
  default `NOTHING_ANNOUNCED` means "basic catalog only" — a meaningful value, not a hole — and
  keeps the sixteen A1–A3 call sites in the spec untouched, which makes "this task only adds"
  visible in the diff. A separate `scoreWithoutMap` export was rejected: the dispatch would have
  moved into `run-eval.ts`, the I/O file.
- **A1–A3 keep their M1 scoring, including its blind spot.** They still ignore `messageWidget`
  calls and do not check names against the announced vocabulary, although the shell has rejected
  unknown names since Task 6. The plan demands unchanged verdicts for the default set; the drift is
  promoted to the register instead.
- **The recorder keeps the raw arguments.** `recordSurface` still validates with
  `A2uiMessageListWrapperSchema` but records `args.messages`, not `parsed.data` — zod strips
  unknown keys, and the scorer is supposed to judge what the model emitted.
- **Examples are format lessons, framed as such.** The old headings were the demo requests
  themselves, so a basic-only answer under the same heading would have taught "answer request 1
  with `Text`". The new headings name what the example demonstrates (envelope/nesting/bindings;
  detail view with a function call and the reserve button), and an intro says to use a Custom
  Catalog component whenever one fits.
- **`formatCurrency`, not `formatDate`, carries the function-call syntax.** First version of the
  second example formatted `/selectedConf/date` with `formatDate`; the default-set run dropped A3 to
  3/5, one failure being "daysUntil not used" — the example competed with the custom function on
  the same field. `formatCurrency` on `/selectedConf/price` competes with nothing announced; the
  next default run had no such failure (n = 5, so plausible rather than proven). The plan's
  fallback (generate examples from the announced vocabulary) was therefore not needed.
- **Two further static mentions fixed as the same defect (agreed before implementation).** The
  "bind, never copy" paragraph named `daysUntil` and `distance`; output rule 3 said `messageWidget`
  *instead* of a surface while the vocabulary rule said "say what is missing *and* render". Both
  tools end the turn, so the prompt now states the one shape that allows both: two calls in one
  assistant message. All five `A2-without-maps` answers of the final run carried a `messageWidget`
  text; whether a surface accompanied it is not visible in the harness output for passing runs.
- **The agent was started by this session.** No server was listening; `npm run start:agent` was run
  in the background outside the sandbox (a sandboxed server is unreachable from other commands),
  using the repository's root `.env` (`AGENT_PROVIDER=anthropic`, default model `claude-sonnet-5`).
  `tsx watch` reloaded `prompt.ts` on each edit (visible in its log). Stopped afterwards; port 3001
  verified free.

— session 2026-09-18 (Codex quick review absorbed)

- **Refused render attempts are recorded, flagged `rejected` (Codex hotspot taken).** The recorder
  dropped a `renderSurface` call that failed the tool schema (e.g. a wrong `catalogId`, a literal
  there) or the A2UI envelope schema, answered `followUp: true`, and the scorer later saw only the
  `messageWidget` text. Harmless for A1–A3, which need exactly one accepted surface; a hole for
  `A2-without-maps`, the first requirement that passes without a surface — and a contradiction of
  this log's own rule "the first answer is scored". Now both refusal points push `{ tool:
  'renderSurface', messages, rejected: true }`.
- **Only the vocabulary check reads a refused attempt.** It does not count as a surface (no "at
  most one" failure, no host rules) and A1–A3 ignore it, so their verdicts stay what they were: a
  malformed envelope around announced names is a format error the correction run forgives, as it
  always did. A refused attempt naming `Map` or `distance` fails `A2-without-maps`. Limit: if the
  arguments carry no `messages` array at all, nothing can be read from them.
- **No recorder extraction, no test through the recording path (user condition: "only if it is a
  few lines").** Codex asked for a test through the recording path; `run-eval.ts` runs `main()` on
  import, so that needs `execute`/`recordSurface` in their own module — a structural change beyond
  the agreed size. The scorer half is pinned by a unit test; the two one-line recorder calls are
  type-checked and not visibly exercised (a refused attempt with announced names leaves no trace
  in the output, and run 6 had none with unannounced names). Promoted to the register.
- **The both-tools shape gets a browser spec (Codex blind spot 1 taken).** Output rule 4 of the
  prompt now *asks* for a `messageWidget` and a `renderSurface` call in one assistant message, so
  the shell showing both and ending the turn is a contract, not an observation from Task 6's live
  probe. `toolCallsRun` and `mapSurface` existed; the spec passed on its first run.
- **The keyword check stays (Codex blind spot 2 accepted).** "Hier ist die Karte" would pass the
  text check — as a false statement without a `Map`, since the surface is checked. A negation
  keyword would be cheap but brittle ("mir fehlt eine Karte" would fail); an LLM judge is out of
  proportion for a manual script. The printed texts remain the control: all fourteen post-fix texts
  (runs 2, 5 and 6) name the missing `Map` component explicitly.

— session 2026-09-18 (simplified on user request, before the commit)

- **A lookup table instead of a parser — supersedes "Scenarios are an explicit table keyed by the
  set" in its parsing half and "`EVAL_CAPABILITIES` is a whitelist like `?capabilities=`"
  entirely.** The first version parsed the variable as a whitelist (order- and space-insensitive,
  a capability registry, separate errors for an unknown name and for a set without a scenario). The
  switch has exactly two values in a demo repository, so the value is now the key into `SCENARIOS`
  and anything else exits with one message naming the two keys. User feedback: YAGNI, remove what
  is not needed. `eval/scenarios.ts` went from 92 to 50 lines; two parser tests went with it.
- **No switch at all: every run plays both sets (user decision) — supersedes the lookup above and
  the plan's "`EVAL_CAPABILITIES=charts,maps`, default both".** User observation: nobody sets the
  variable, so with a default of `charts,maps` the scenario this task adds would never run. The
  gate is both conversations anyway. `SCENARIOS` is now an array with a `capabilities` label, the
  error exit is gone with the input, and a full run costs 25 requests instead of 15. Cost of the
  decision: a single set can no longer be run on its own while iterating on the prompt;
  `EVAL_RUNS=1` (5 requests) is the cheap variant.
- **Also removed:** the `rendered:` diagnostic in the text-check reason (supersedes that half of
  "Names what is missing is a keyword check"), the `verdictFor` wrapper
  and the `nameOf` helper; the README paragraph shrank from seven lines to four. **Not added:** an
  `eval:charts` npm script and a README sentence "the M2 gate is both runs" — both were offered and
  declined for the same reason.
- **Kept on purpose:** `EVAL_RUNS` (M1 code, the smoke run; the user asked whether it should go
  too — recommendation: keep, or remove it in a commit of its own), the
  printed `messageWidget` texts (the only control of the keyword check), the recording of refused
  attempts (agreed review fix) and the prompt guard spec.

### Review Focus

- **Behavior claims:** (1) `npm run eval` plays `charts,maps` (A1–A3) and then `charts`, where it
  announces exactly `Gauge`/`Timeline`/`daysUntil`, asks request 1 and the map request, and passes
  the latter only if
  no recorded surface uses a component or function outside basic ∪ announced and a `messageWidget`
  text mentions the map; the gate line and the exit code cover both sets; a `renderSurface` attempt the harness refuses still fails the run if it names unannounced
  vocabulary. (2) For `charts,maps` the harness sends the same context and scores A1–A3 exactly as
  before — a `messageWidget` call next to a surface does not change their verdict. (3) The prompt
  built without a catalog entry names no custom component or function; custom vocabulary reaches
  the model only through the `# Custom Catalog` section.
- **Plan deviations:** "make the capability set an input of the harness (`EVAL_CAPABILITIES`,
  default both)" → no input; both sets always run → nobody would set the variable, and the default
  would have skipped the new scenario (user decision) · "rewrite both examples" → additionally output rule 4, the "bind, never copy"
  sentence and the Vocabulary section were reworded → same defect (static custom names) and a
  contradiction that made the accepted answer shape unreachable by the rules; agreed beforehand ·
  Key Locations named `run-eval.ts` for requests and context → the two scenarios live in a new
  `eval/scenarios.ts` (`run-eval.ts` was at 313 lines; a table is unit-testable) · the plan's
  "must not contain … any other component outside the announced vocabulary" → functions are checked
  too (`findFunctionCalls`), because the shell rejects them since Task 6 · the failing reason for
  the harness prints the `messageWidget` texts → not asked for; needed to trust a keyword check · a shell spec (`chat.page.spec.ts`) although the block touches
  `eval/` and `agent/` only → the reworded prompt makes "both tools in one message" a shell
  contract (review).
- **Assumptions / choices:** the requirement is named `A2-without-maps` (the block gives no id);
  first answer scored, no correction run; only `messageWidget` texts count as "naming";
  `/karte|map/i` as the keyword; A1 is scored and gated in the charts-only scenario; request 3 is
  not asked there; at most one surface is allowed next to the text; `announced` defaults to
  "nothing announced"; a refused render attempt is vocabulary-checked only and never counts as a
  surface.
- **Scope notes:** `docs/improvements.md` (one line ticked, two promoted); `README.md` eval
  section. `docs/architecture.md` deliberately untouched (→ Task 8); its invariant "the server
  holds no vocabulary … two worked examples" was false until this task and is now true. No
  production file of the shell or the remotes changed; one shell spec was added after the review.
- **Read next:**
  1. `eval/score.ts` `score` / `withoutMapFailures` / `vocabularyFailures` — the new requirement and
     the guarantee that A1–A3 see surfaces only; compare with `describe('score A2-without-maps')`.
  2. `agent/src/prompt.ts` `FORMAT_RULES` examples and the `# Vocabulary` section — what the model
     now reads instead of the answer key; A3's 4/5 depends on it and on the catalog descriptions.
  3. `eval/run-eval.ts` `execute` / `recordSurface` / `recordRejectedSurface` — the two refusal
     points; this path has no in-tree test, so read it against `surfacesOf` in `score.ts`.

### Test Evidence

— session 2026-09-18

All eval runs: real model calls through the agent started by this session (anthropic, default
model), `EVAL_RUNS` default 5, outside the sandbox; full outputs in the session scratchpad
(`eval-charts-before.log`, `eval-charts-after.log`, `eval-default-after.log`,
`eval-default-after-2.log`, `eval-charts-final.log`), not in the tree.

| # | Command | Prompt state | Result |
|---|---|---|---|
| 1 | `EVAL_CAPABILITIES=charts npm run eval` | unchanged (HEAD) | A1 5/5 · A2-without-maps **0/5** — every run: `component(s) outside the announced vocabulary: Map; function(s) …: distance; no messageWidget text names the missing map`. Gate NOT reached. |
| 2 | same | basic-only examples (`formatDate` variant) | A1 5/5 · A2-without-maps 4/5 — no `Map` in any run; run 3 had no `messageWidget`. Gate reached. *Overtaken by later prompt edits.* |
| 3 | `npm run eval` | same as 2 | A1 5/5 · A2 5/5 · A3 **3/5** (`daysUntil not used in the surface`; `no Map in the surface`). Gate NOT reached. *Overtaken.* |
| 4 | `npm run eval` | **final** (`formatCurrency` example, reordered function sentence) | A1 5/5 · A2 5/5 · A3 4/5 (`no Map in the surface` in run 1). Gate reached — identical to the M1 verdicts (5/5, 5/5, 4/5). |
| 5 | `EVAL_CAPABILITIES=charts npm run eval` | **final** | A1 5/5 · A2-without-maps **5/5**. Gate reached. |

- Texts of run 5 (all five open alike): "Eine Kartenansicht steht mir leider nicht zur Verfügung –
  im Katalog gibt es keine Map-Komponente. Ich zeige dir die Angular-Konferenzen stattdessen auf
  einer Zeitachse, sortiert nach Datum." / "… stattdessen als Liste mit Städten und Entfernung von
  Berlin." Run 2 also contained text-only answers that offered alternatives.
- The `rendered:` diagnostic was added after run 2; run 5 had no failure, so it has unit-test
  evidence only.
- Final code: `npm run test:eval` (`tsc -p eval/tsconfig.json` + vitest) — 3 files, 29 passed
  (before: 2 files, 18). `npm run test:agent` (`tsc --noEmit` + vitest) — 4 files, 30 passed
  (before: 25). `npm run lint` — ESLint for `shell`, `mfe-charts`, `mfe-maps` and `sheriff verify`
  ("All projects validated successfully!").
- Error paths (`node --import tsx eval/run-eval.ts`; plain `tsx` cannot open its IPC pipe inside
  the sandbox): `EVAL_CAPABILITIES=maps` → `No scenario for the capability set "maps" — scored
  sets: charts,maps | charts.`, exit 1; `EVAL_CAPABILITIES=charts,weather` → `Unknown capability in
  EVAL_CAPABILITIES: weather (known: charts, maps).`, exit 1. Both before any network access.
- `npx prettier --check` clean on `eval/scenarios.ts`, `eval/scenarios.spec.ts`,
  `agent/src/prompt.ts`. `eval/score.ts`, `eval/score.spec.ts`, `eval/run-eval.ts`,
  `agent/src/prompt.spec.ts`, `README.md` were dirty at HEAD (checked via `git show HEAD:<file> |
  prettier --stdin-filepath`) and stay so; on the final code none of this task's hunks intersects
  prettier's diff of those files (scripted check, 0 hits each).
- Not run: `test:shell`, `test:charts`, `test:maps` — no file of theirs changed; `eval/` imports
  from them, not the reverse.
- Living-documents grep (`EVAL_|run-eval|npm run eval|score\.ts|RecordedCall|FORMAT_RULES|
  prompt\.ts|messageWidget|example` over the three documents): `docs/spec.md:168` (the
  missing-vocabulary row, "`npm run eval`, ein Fall je Live-Moment") — matches what was built,
  unchanged; `docs/architecture.md:174-178` ("the prompt carries … two worked examples — but never
  learns which components exist") — true only since this task, unchanged;
  `docs/architecture.md:251-252` (M1 gate figures, no capability sets) — left for Task 8;
  `docs/improvements.md:14` (A3 example ≈ answer key) — resolved here, ticked.
- No probe or temporary file remains in the tree; logs and the agent log live in the scratchpad.
  The agent process was stopped (`ss`: 3001 free).

— session 2026-09-18 (after the review fix)

- Codex verified independently on the pre-fix code: 29 eval and 30 agent tests passed incl. type
  checks; it reproduced the hotspot (a `Map` with a wrong `catalogId` plus an honest
  `messageWidget` text → "Gate reached") and changed no files.
- **Standing of the earlier runs.** Runs 2 and 5 passed `A2-without-maps` on a harness that dropped
  refused attempts, so a hidden refused `Map` cannot be ruled out for them; they are superseded by
  run 6. Run 1 (red) is unaffected — every run failed on a *recorded* `Map`. Run 4 (default set) is
  unaffected: refused attempts were invisible to A1–A3 before and are ignored by them now.

| # | Command | State | Result |
|---|---|---|---|
| 6 | `EVAL_CAPABILITIES=charts npm run eval` | final prompt, **corrected harness** | A1 5/5 · A2-without-maps **5/5**. Gate reached. No refused attempt with unannounced vocabulary occurred — it would have failed the run. |

- Texts of run 6: all five open with "Eine Kartenansicht …" and name the missing Map component;
  three announce a timeline or list as the substitute, two are text-only offers. Log in the
  scratchpad (`eval-charts-after-review.log`). The agent was started and stopped again by this
  session (`ss`: 3001 free).
- Final code: `npm run test:eval` — 3 files, 30 passed (29 + the refused-attempt test).
  `npm run test:shell` — 19 files, 115 passed (Task 6: 114, + the both-tools spec); the chat page
  spec alone beforehand: 12 passed. `npm run lint` — three projects "All files pass linting",
  Sheriff "All projects validated successfully!". `npx tsc -p eval/tsconfig.json` and `npx tsc
  --noEmit -p tsconfig.spec.json` — 0 errors. Not re-run: `test:agent` (no agent file changed since
  its last green run), `test:charts`, `test:maps`.
- **Live check in the shell (user, screenshot reviewed, 2026-09-18):** charts loaded from 4201,
  maps "not selected", location Dresden; first message of a fresh conversation, worded unlike the
  eval ("Zeige mal die Angular-Konferenzen auf einer Karte."). One answer carries the
  `messageWidget` text ("Eine Kartenansicht kann ich leider nicht anbieten – dafür gibt es in
  meinem Baukasten keine Karten-Komponente. Ich zeige dir die Angular-Konferenzen stattdessen auf
  einer Zeitleiste …") *and* a surface: heading, Timeline with nine markers, details of the
  selection with `daysUntil` ("Tage bis Start: 3", correct for 2026-09-21), Gauge 12/500 and the
  reserve button. No `Map`, no `distance` label, no "Could not build the surface" message (Task 6
  showed one before its correction run). Seen but not from this task: the detail texts for city,
  date and the day count render with almost no contrast; Timeline labels collide (already in the
  register).
- Prettier on the final code: `chat.page.spec.ts` was dirty at HEAD like the other four; the
  scripted hunk check reports 0 intersections for `eval/score.ts`, `eval/score.spec.ts`,
  `eval/run-eval.ts` and `src/app/chat/chat.page.spec.ts`.

— session 2026-09-18 (after the simplification)

- The simplification changes neither the context sent to the model (same vocabulary arrays in the
  same order, same prompts — pinned by `eval/scenarios.spec.ts`) nor any verdict (only the wording
  of one failure reason), so the model runs were not repeated; runs 4 and 6 stand. Overtaken: the
  two error-path messages, the 29/30 eval test counts and the note on the `rendered:` diagnostic
  recorded above.
- Runs 1–6 were started per set through the `EVAL_CAPABILITIES` switch that no longer exists; what
  each set announces and asks is unchanged (pinned by `eval/scenarios.spec.ts`), so their figures
  stand as the 5-run evidence per set. The error-path evidence above is void — there is no input
  left to mistype.
- **Smoke run of the two-set loop** (`EVAL_RUNS=1 npm run eval`, real model): `Capabilities:
  charts,maps` → A1, A2, A3 ok, summary 1/1 each; `Capabilities: charts` → A1 ok, A2-without-maps
  ok with the text "Eine Kartenansicht kann ich leider nicht anbieten – dafür gibt es im aktuellen
  Katalog keine Komponente (nur Timeline, Gauge, Text/Row/Column/Button). …"; "Gate reached.",
  exit 0. It ran against the **user's** agent instance: this session's own start failed with
  `EADDRINUSE` (no `ss` check beforehand), and the process on 3001 turned out to be the user's,
  started 15:18:48 — after the last prompt edit (14:32:25), so it served the final prompt. It was
  left running. Runs 1–6 used this session's own instances (their logs show no `EADDRINUSE`). A
  full 5-run pass of the combined loop was not made.
- Final code: `npm run test:eval` — 3 files, 28 passed (30 − the two parser tests).
  `npx prettier --check` clean on
  `eval/scenarios.ts`, `eval/scenarios.spec.ts`; hunk check 0 intersections for `eval/score.ts`,
  `eval/score.spec.ts`, `eval/run-eval.ts`, `README.md`. Not re-run: `test:shell`, `test:agent`,
  `npm run lint` (no file of theirs changed since their last green run; `eval/` is outside `ng
  lint` and Sheriff's entry points).

### Acceptance Coverage

- **T7-AC-01** — passed — `eval/scenarios.spec.ts` "T7-AC-01: the default set announces both
  capabilities and asks the three M1 requests", "T7-AC-01: the charts set announces charts alone
  and asks for the map anyway", "T7-AC-01: announcedNames is exactly what the context entry
  announces"; end to end by runs 1, 4, 5
  and 6 per set and by the smoke run of the two-set loop (the harness prints `Capabilities:
  charts,maps` / `charts`, and run 1's failures show the model was *not* told about
  `Map`/`distance`). The sets are named in `SCENARIOS`, no longer chosen by a variable (plan
  deviation, user decision). Contributes to XC-04.
- **T7-AC-02** — passed — run 6: 5 of 5 on the final prompt and the corrected harness, against 0 of
  5 before the prompt fix (run 1); scoring logic pinned by `eval/score.spec.ts` `describe('score
  A2-without-maps')` (five `T7-AC-02` tests, incl. "fails a refused Map attempt, and keeps refused
  attempts away from A1–A3") and the static-prompt guard in `agent/src/prompt.spec.ts` ("T7-AC-02 names the
  custom %s only when the catalog entry announces it"). Model-behavior evidence is a manual,
  non-deterministic run by design, not CI. Contributes to XC-01.
- Regression condition of the block ("with the default set … the same verdicts as before") —
  met by run 4: 5/5, 5/5, 4/5.

### Open Issues

- `docs/architecture.md` describes the eval harness without capability sets and the roadmap status
  still ends at M1 (→ Task 8).
- Promoted: the scorer checks unknown vocabulary for `A2-without-maps` only, while the shell
  rejects it for every surface (→ improvements register).
- Promoted: the eval's recording path has no in-tree test; extract the recorder from
  `run-eval.ts` and pin the `rejected` recording (→ improvements register, source: review).
- Promoted: surface texts in the chat render with almost no contrast — seen in the live check, not
  caused by this task (→ improvements register, for the UI pass).
- Promoted: A3 sits on the gate without slack; "no Map in the surface" occurred once in each
  default-set run since the answer key left the prompt (→ improvements register).

### Context for Next Task

- **Task 8 (architecture doc, tour):** the eval now has two scored scenarios — `charts,maps`
  (A1–A3) and `charts` (A1, `A2-without-maps`) — and every `npm run eval` plays both; the README's gate
  section is current and can be the source. The architecture invariant "the server holds no
  vocabulary" is now literally true and guarded by `agent/src/prompt.spec.ts`. Figures for the
  doc: M2 final runs of 2026-09-18 — default 5/5, 5/5, 4/5; charts only 5/5, 5/5 (run 6); before the prompt
  fix 0/5. Worth one sentence in the tour: the red/green pair shows that a static example outweighs
  a "use only what is listed" rule.
- **Interfaces:** `SCENARIOS: readonly Scenario[]` (`capabilities`, `vocabularies`, `requests`),
  `announcedNames(vocabularies): AnnouncedNames`, `score(requirement, calls, announced?)`,
  `RecordedCall = RecordedSurface | RecordedText` (`RecordedSurface.rejected?: true` marks a call
  the harness refused), `Requirement = 'A1' | 'A2' | 'A3' |
  'A2-without-maps'`. Adding a scored set means one entry in `SCENARIOS`.
- **M3 replay:** the scenario shape matches the register's replay line — recordings are keyed by
  (conversation path × capability set), and `charts` / `charts,maps` are the two sets with a
  defined conversation.
- **Gotchas:** `tsx` (the `npm run eval` script) fails inside the sandbox with `listen EPERM …
  tsx-1000/*.pipe`; use `node --import tsx` there, or run outside the sandbox — model calls need
  the latter anyway. The agent reads the repository root `.env`, not `agent/.env`. `tsx watch`
  picks up `prompt.ts` edits by itself; check its log for "Restarting" before trusting a run. A
  full run is 25 requests and takes about five minutes; `EVAL_RUNS=1` is 5 requests. Check `ss`
  outside the sandbox before starting an agent — the user may have one running.

### Git State

```
$ git diff --stat
 README.md                      |   9 ++-
 agent/src/prompt.spec.ts       |  12 ++++
 agent/src/prompt.ts            |  62 ++++++++++---------
 docs/improvements.md           |   6 +-
 eval/run-eval.ts               |  90 +++++++++++++++++----------
 eval/score.spec.ts             | 122 ++++++++++++++++++++++++++++++++++---
 eval/score.ts                  | 135 ++++++++++++++++++++++++++++++++++++-----
 src/app/chat/chat.page.spec.ts |  25 ++++++++
 8 files changed, 375 insertions(+), 86 deletions(-)

$ git status --short     # sandbox dotfiles omitted
 M README.md
 M agent/src/prompt.spec.ts
 M agent/src/prompt.ts
 M docs/improvements.md
 M eval/run-eval.ts
 M eval/score.spec.ts
 M eval/score.ts
 M src/app/chat/chat.page.spec.ts
?? docs/work/m2-nf-split/task-log/task-7-eval-capability-sets.md
?? eval/scenarios.spec.ts
?? eval/scenarios.ts
```

### Sessions

- claude-code 116f3de9-ab8b-4727-b4d9-cd887e8c8e23 (2026-09-18) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/116f3de9-ab8b-4727-b4d9-cd887e8c8e23.jsonl
- codex 01a0b485-c9d3-7243-812c-6e1f47dec385 (2026-09-18) — transcript: ~/.codex/sessions/2026/09/18/rollout-2026-09-18T14-37-41-01a0b485-c9d3-7243-812c-6e1f47dec385.jsonl
