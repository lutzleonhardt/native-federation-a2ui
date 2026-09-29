# Task 4: Self-contained badges, the form rules and the re-pointed eval

### Task

The four badge texts as self-contained questions, the prompt's form rules and control rule, the
fixed selection path and the field list on the model side, the eval re-pointed at the badges its
three requirements still fit (each badge as the first message of a fresh session), and — from the
user's eye check — the basic catalog announced to the model by prop names.

### Status

DONE — implementation and task-local verification complete: `npm run test:shell` 26 files / 169
tests, `npm run test:agent` 4 / 31, `npm run test:eval` 4 / 33, ESLint, `sheriff verify` and
Prettier on the changed lines clean; the eval gate reached three times (round 3 on the final
strings with the stricter scorer: all four cells 5/5); T4-AC-06 clicked by the user. Independent
review completed: a Codex quick review found one MEDIUM finding (fixed), one blind spot in the
chat spec (fixed) and one recorded as a decision (form fidelity stays manual). Ready for
`/commit 4`; the plan amendment of this session (`plan.md`) is meant as its own `docs:` commit,
as with the three earlier amendments.

### Files Modified

- `src/app/chat/example-prompts.ts` (modified) — the four badge texts; comment says each stands alone.
- `src/app/chat/chat.page.spec.ts` (modified) — the `PROMPTS` literal follows; the three scripted-agent detail tests click badge 4 (index 3), the first is named "badge 4 builds the detail surface".
- `public/recordings.json` (modified) — Task 3's fixture: the two badge-1 keys re-keyed to the new text, content unchanged, so replay keeps its one recorded button until Task 4.5.
- `agent/src/prompt.ts` (modified) — new section "Answer the form asked" (overview / comparison / detail, never an unasked map or timeline) plus the control rule (a Slider drives a listed function or is not drawn; initialise its path); the wiring paragraph, "One conference's details" and "Client events" name `/selectedConf` and `/selectedConf/id` instead of "the selection path"; Vocabulary names the `basic` list; the Custom Catalog intro mentions it.
- `agent/src/prompt.spec.ts` (modified) — "T4-AC-05 fixes the selection path and states the form rules" (`/selectedConf/id`, no placeholder, the section, `Slider`, `basic`).
- `src/app/agent/tools/find-conferences.definition.ts` (modified) — one sentence listing every field of a mounted conference (id … url, distanceKm when the location is known).
- `src/app/agent/tools/find-conferences.definition.spec.ts` (new) — drift test: a real `ConferenceResult` from `findConferences` with Berlin; every key but `dayOffset` appears in the description.
- `src/app/a2ui/catalog-context.ts` (modified) — the catalog entry carries `basic`: every basic component with the prop names of its schema (`propNames`, about 1 350 characters).
- `src/app/a2ui/catalog-context.spec.ts` (modified) — "lists every basic component with the prop names of its schema" (all 18, non-empty, Slider with label/min/max/value and without `step`).
- `eval/scenarios.ts` (modified) — `charts,maps` plays badge 1 as `A1` and badge 4 as `A3`, `charts` badge 1 as `A1` and badge 2 as `A2-without-maps`; `badgeOf` for the report; the "one conversation" comment replaced by "each request is a fresh session".
- `eval/scenarios.spec.ts` (modified) — expectations for the re-pointed requests; "T4-AC-01 every scored request is one of the shell's badges, verbatim".
- `eval/run-eval.ts` (modified) — the `HttpAgent` is created per request, not per run; progress and summary lines say `badge n (A3)`.
- `eval/score.ts` (modified) — `hostRuleFailures` includes `findSelectionPathViolations`, the shell's own rule (absolute paths, every `selected` at `/selectedConf`) instead of a normalized comparison; `detailFailures` requires `Map.selected` at `SELECTION_PATH` instead of deriving the path; `MAP_WORD` accepts "distance"; `idleControlFailures` fails a Slider in any surface of an `A2-without-maps` answer, refused attempts included; the missing-text reason names both words.
- `eval/score.spec.ts` (modified) — "T4-AC-05 requires the selection at /selectedConf, as the shell does" (flipped from "follows the selection path the model chose"); "T4-AC-05 fails a relative selection path and a second selection bound elsewhere, as the shell does" (the review's two counterexamples); "T4-AC-01 accepts a text that names the distance filter"; "T4-AC-01 fails a Slider nothing can consume, even beside an honest text or in a refused attempt".
- `docs/architecture.md` (modified) — the Custom Catalog passage mentions `basic`; new invariant "The basic catalog is announced by prop names only" with the measured alternatives; "The eval harness" describes the four cells as fresh sessions and the eye's part.
- `docs/how-it-works.md` (modified) — the `# Custom Catalog` block shows the `basic` line, one sentence explains it.
- `docs/improvements.md` (modified) — two entries: the model sizes a distance Slider blind (`farthestKm` in the summary as the generic remedy); the basic catalog reaches the model by prop names only (full schemas measured at about 82 000 characters, or a `describeComponents` lookup tool).
- `docs/work/m3-reserve-maps-hosting/plan.md` (modified; own `docs:` commit) — second amendment at task start (Task 4 minimal, Task 4.5 browser recorder), T4-AC-06, badge 4 may carry a Timeline, the `basic` note in the Prompt paragraph, preamble scope and order sentences.

### Files Read (Context Only)

- `docs/work/m3-reserve-maps-hosting/plan.md` (preamble, Task 4; Task 4.5 for the amendment),
  `task-log/task-3.5-*.md`, `task-log/docs-task-4-split.md`, `task-log/task-3-*.md` (grep),
  `docs/improvements.md`, `docs/architecture.md` (Custom Catalog passage, invariants, eval section),
  `docs/how-it-works.md` ("Half 1 travels to the LLM").
- `eval/{run-eval,score,score.spec,scenarios,scenarios.spec,prompt-examples.spec,model-context.spec}.ts`,
  `eval/{tsconfig.json,vitest.config.ts,package.json}`.
- `agent/src/{prompt,prompt.spec,agent,server,config}.ts`, `agent/package.json`.
- `src/app/chat/chat.page.spec.ts` (header, `PROMPTS`, T7-AC-05, the replay cases),
  `src/app/agent/tools/{find-conferences.definition,find-conferences.tool,message-widget.definition,render-surface.definition,render-surface.tool}.ts`,
  `src/app/agent/{render-failure-correction,render-failure-handler.token,me-context-entry}.ts`,
  `src/app/agent/{agent-mode,init-agent-store}.ts` (grep), `src/main.ts` (grep),
  `src/app/a2ui/surface-host-rules.ts`, `src/app/replay/recordings.ts`,
  `src/app/domain/{conference,find-conferences,find-conferences.schema,location.store}.ts`,
  `shared/agent-contract.ts`, `projects/mfe-maps/src/maps/{filter-within-km.fn,map.schema}.ts`,
  `projects/mfe-charts/src/charts/{gauge,timeline}.schema.ts`, `src/app/playground/playground.ts` (Slider usage).
- `public/federation.manifest.json`, `public/recordings.json`, `package.json` (scripts).
- `node_modules/@a2ui/web_core/src/v0_9/basic_catalog/components/basic_components.js` (`SliderApi`, strict schema).

### Key Decisions

- **The plan was amended at task start, second time (user).** The mechanical form check gave way
  to the eye: a recording only has to be right once, so the scorer does not learn the four forms;
  the capture moves into the browser through a dev-only recorder (Task 4.5); the negative lists,
  `A-compare`, the call-aware `A2`, the matrix, the drive extraction and the record in recording
  format were dropped from Task 4 (register entry 30 stays open). What the scorer still measures —
  A1, A3, A2-without-maps — is the reliability figure for the live mode with an own key and the
  regression guard for later prompt changes; that is why the eval was re-pointed rather than
  parked. Recorded in `plan.md` (both blocks) and the preamble.
- **A fresh agent per request.** The badge texts are history-independent by wording, but the eval
  used to play them as one conversation, where the model sees its earlier answers and the mounted
  data. The recording replays the other situation — first message, the model must fetch its own
  data — so the gate measures that one now.
- **`A3` checks the fixed `/selectedConf`** (Task 1's amendment carried to the model side): the
  shell rejects any other path since the reserve handler reads the selection there, so a scorer
  that followed the model's choice would pass what the shell refuses. The spec case flipped.
- **`A2-without-maps` accepts "distance" and fails an idle Slider anywhere.** The new badge asks
  for a slider, so an honest text may name the missing distance filter instead of the map; a
  Slider that no listed function consumes is spec §7's ineffective control and fails in accepted
  and refused attempts alike (a refused Map already fails the vocabulary check).
- **`dayOffset` is not in the field list.** It is the input `date` is derived from, mounted with
  the record but not a fact of the conference; the drift test names it as the one exception so
  the rest cannot drift.
- **The fixture keeps its content, only the keys move.** Task 3's `recordings.json` answers
  badge 1 with the old surface (no `withinDays`); Task 4.5 replaces the file.
- **Badge 4 may carry a Timeline (user, at the T4-AC-06 click).** "Where and when" plus the form
  rule's "a timeline for when" produced Map, Timeline and Card; the user found both selection
  components sensible. No steering clause in the badge text: the plan wants natural questions,
  and "where" is the cue that reliably brings the Map (5/5 since the visual-language pass). The
  plan's badge-4 line was widened instead of the prompt tightened.
- **`Slider.step`: a hand-written sentence, superseded by the `basic` list (user).** The first
  click's refusal was `Unrecognized key(s) in object: 'step'`: the basic catalog reached the model
  by name only ("plus the A2UI basic catalog", six components by example), the strict schema lives
  in the browser's processor. A prompt sentence naming four Slider props was added and removed in
  the same session — it duplicated schema knowledge and was already inaccurate (`weight`,
  `accessibility`, `checks` exist too). The catalog entry now carries every basic component's prop
  names, generated from `BASIC_COMPONENTS`. Measured: full basic schemas 18 components / 81 935
  characters inline (Slider 5 824) against 13 784 for the three custom ones; the name list 1 348.
  Prop names catch the failure that costs a whole correction run (an unknown key); a wrong type in
  a known prop is corrected from the validation issue the tool result carries. Stage 2 — full
  schemas or a `describeComponents` lookup tool, one model round per lookup — is a register entry;
  the decision and the numbers are an invariant in `architecture.md`.
- **The Slider's range (0–2000, then 500, then 2000) stays.** A "0 to 800 km" hint in the function
  description was rejected as use-case tuning (user). Root cause: the compact `findConferences`
  summary carries only the nearest conference's `distanceKm`, so the model sizes the control from
  general knowledge; the generic remedy (`farthestKm` in the summary, shell tool result and eval
  mirror) is a register entry, and the eye re-clicks at capture.
- **No prompt change after round 2 for badge 1 and badge 3.** Round 2's badge 1 showed a detail
  Card with Gauge and reserve Button under the Timeline (the details rule beats "overview and
  nothing else" once the model places the selection under the timeline); badge 3 showed tickets
  left as Text without a Gauge (round 1 had Gauges). `A1` does not measure the negative list, so a
  gate run would show nothing; the eye re-clicks at capture, and "no detail Card under an
  overview" is the candidate sentence if "Timeline alone" does not come (→ Task 4.5).
- **T4-AC-06 added (user):** the user clicks badge 2 and badge 3 once in the running shell and
  judges the form, so the prompt rules for the two unscored forms are not written blind.
- **The report says `Badge n`**, not `Request n`: the scored requests are no longer 1…n of the
  shell's row (`badgeOf` in `scenarios.ts`).
- **Pre-existing Prettier warnings left alone** in `run-eval.ts`, `score.ts`, `score.spec.ts`,
  `prompt.spec.ts`, `improvements.md`: every hunk lies in untouched lines and warned at HEAD; the
  added lines are formatted (Task 3.5's practice).
- **`architecture.md` "The eval harness" updated here**, although Task 6 is the docs task: the
  wrap-up's living-documents check found it describing the old two conversations, and the
  paragraph is five lines.

— session 2026-09-29, after the Codex quick review

- **Finding fixed: the scorer accepted selection paths the shell refuses (MEDIUM).** `boundTo`
  normalizes, so `selected: { path: "selectedConf" }` passed although the shell's
  `findSelectionPathViolations` takes absolute paths only; and a second selection component
  (`Timeline.selected` at `/picked`, reachable since badge 4 may carry a Timeline) was never
  looked at. `hostRuleFailures` promises exactly what the shell rejects, so it now calls the
  shell's rule; `detailFailures` keeps its own check for a `Map` without `selected` ("nothing is
  wired"), which is no violation for the shell but is for A3. Regression test with both
  counterexamples.
- **Gate re-measured after the fix (user: fix and measure).** The round-2 A3 runs were scored by
  the laxer scorer and are not stored, so nobody could re-score them; round 3 with the strict
  scorer answers it (all cells 5/5). No restart was needed: the scorer runs in the eval process,
  the agent's prompt did not change.
- **Blind spot fixed now, not in Task 4.5:** the scripted-agent detail tests clicked index 2, the
  comparison badge after the re-mapping, while the mock answered with the detail surface; the
  tests measured the interaction, not the mapping, but read wrong. Index 3 and the name, three
  lines.
- **Blind spot recorded, no change:** form fidelity of badges 1–3 stays the eye's at capture — the
  decision "No prompt change after round 2" above, and Open Issues.
- **An accidental `prettier --write` on `score.spec.ts` was reverted:** it reformatted the
  pre-existing hunks; the file was restored to HEAD and only this task's blocks re-applied in
  Prettier's form, so the diff carries the task's lines alone (Task 3.5's practice).

### Review Focus

- **Behavior claims:** (1) The four badges send the new texts verbatim; played as the first
  message of a fresh session the model answers badge 1 with a Timeline bound to `/filteredConfs`
  and badge 4 with the detail view at `/selectedConf` (5/5 each with both remotes, scored with the
  shell's selection rule: absolute paths, every `selected` at `/selectedConf`), and with
  charts only it names the missing map or distance filter and draws no Slider (5/5). (2) The
  prompt names `/selectedConf/id` and the form rules; the `findConferences` description lists
  every field of a mounted conference but `dayOffset`, pinned against a real result. (3) The
  catalog entry announces every basic component's prop names; with it the slider form rendered on
  the first attempt (round 2), where round 1 had a refused attempt on `Slider.step`.
- **Plan deviations:** the task block itself was amended at start (second amendment) — recorded in
  `plan.md`. Beyond the amended block: `catalog-context.ts` and its spec, `architecture.md`,
  `how-it-works.md` → the `basic` list and its decision, from the T4-AC-06 finding → the user
  asked for the schema-derived fix and its documentation. Badge 4's form → widened to allow a
  Timeline → user decision at the click. A Slider-props sentence in the prompt → added and removed
  → superseded by `basic`. `architecture.md` eval paragraph → updated → living-documents check.
- **Assumptions / choices:** `dayOffset` excluded; the idle-Slider check applies to refused
  attempts too; prop names without types; `MAP_WORD = /map|distance/i`; the fixture's badge-1
  content stays the old surface.
- **Scope notes:** two docs and the register changed inside a code task (see decisions); the plan
  amendment is in the same tree but meant as its own `docs:` commit; register entries 28
  (vocabulary check for every requirement) and 30 (drive extraction) stay open.
- **Read next:** `eval/score.ts` `hostRuleFailures`, `detailFailures` and `idleControlFailures` —
  the three places the scorer changed, the first now carrying the shell's selection rule;
  `agent/src/prompt.ts` "Answer the form asked" and "Vocabulary" — the rules the gate measured;
  `src/app/a2ui/catalog-context.ts` `basic` — the schema-derived list and its comment.

### Test Evidence

- Final code, sandboxed: `npm run test:shell` — 26 files, 169 tests (new:
  `catalog-context.spec` "lists every basic component with the prop names of its schema",
  `find-conferences.definition.spec` "T4-AC-05 names every field of a mounted conference";
  `chat.page.spec` T7-AC-05 with the new literals). `npm run test:agent` — 4 files, 31 tests
  (`prompt.spec` "T4-AC-05 fixes the selection path and states the form rules"; T7-AC-02 still
  keeps the custom names out of the static text). `npm run test:eval` — 4 files, 32 tests
  (`score.spec` "T4-AC-05 requires the selection at /selectedConf", "T4-AC-01 accepts a text that
  names the distance filter", "T4-AC-01 fails a Slider nothing can consume…"; `scenarios.spec`
  "T4-AC-01 every scored request is one of the shell's badges, verbatim").
- `npx eslint` over the changed shell, eval and agent files: clean. `npx sheriff verify`: all
  projects validated. `npx prettier --check`: clean on `catalog-context.ts`, its spec, `prompt.ts`,
  `scenarios.ts`, `scenarios.spec.ts`, `example-prompts.ts`, `chat.page.spec.ts`,
  `find-conferences.definition*.ts`, `recordings.json`; warnings only in files that warned at HEAD,
  every hunk outside the changed lines (checked hunk by hunk).
- Gate round 1 (user, outside the sandbox, prompt without `basic`): `charts,maps` Badge 1 (A1)
  5/5, Badge 4 (A3) 5/5; `charts` Badge 1 (A1) 5/5, Badge 2 (A2-without-maps) 4/5 — run 2: "no
  messageWidget text names the missing map or distance filter". `Gate reached.`
- Gate round 2 (user, final strings): `charts,maps` Badge 1 (A1) 5/5, Badge 4 (A3) 5/5; `charts`
  Badge 1 (A1) 5/5, Badge 2 (A2-without-maps) 5/5. `Gate reached.` in 6 m 52 s. The five widget
  texts name the missing map and the missing distance function and say the slider was left out
  ("a control needs a function to drive").
- T4-AC-06 clicks (user, Dresden, both remotes, page reload between badges). Round 1: badge 2 —
  first attempt refused, console `renderSurface failed {code: 'catalog', issues: "Validation
  failed for component 'Slider' (slider): root: Unrecognized key(s) in object: 'step'"}`, the
  corrected attempt Map + Slider (0–2000, initial 2000) + km Text, markers before the first move;
  badge 3 — three Cards with name, date, city, `formatCurrency` price, Gauge; badge 1 — Timeline
  plus a small city/date card; badge 4 — Map, vertical Timeline, Card with city, date, days,
  distance, price, Gauge, "Reserve a seat". Round 2: badge 2 — no refusal, Map + Slider (2000) + km
  caption after two model runs; badge 3 — three Cards, tickets left as Text; badge 1 — Timeline
  plus a detail Card with days, Gauge and Reserve; badge 4 — as round 1.
- Probes, all gone: `tmp/basic-size.mts` (deleted in the same command) measured the basic schemas
  with `zodToJsonSchema` `$refStrategy: 'none'` — 18 components, 81 935 characters, Slider 5 824;
  a `node -e` listing of `Object.keys(schema.shape)` per basic component; a `node -e` size of the
  announced entry after the change — 15 132 characters, `basic` 1 348.
- Environment: the user's `npm run start` runs the agent as `tsx src/server.ts` without watch, so
  every prompt or catalog change needed a restart of the whole `concurrently` group (done twice by
  the user); a stale `tsx watch` from 24 Sep without children was found and reported.

— session 2026-09-29, after the Codex quick review

- Codex quick review (reported by the user): 169 shell, 31 agent and 32 eval tests re-run green
  on the pre-fix code; one MEDIUM finding, two blind spots (see Key Decisions).
- Probe `tmp/probe-selection.mts` (deleted in the same command): `score('A3', …)` on a detail
  surface with `selected: { path: 'selectedConf' }` and on a correct one plus a Timeline with
  `selected: /picked` — both `{"passed":true,"reasons":[]}` before the fix, as the review said.
- Final code, sandboxed: `npm run test:eval` — 4 files, 33 tests (new: `score.spec` "T4-AC-05
  fails a relative selection path and a second selection bound elsewhere, as the shell does";
  the flipped `/pick` case now fails on the host rule first). `npm run test:shell` — 26 files,
  169 tests (the three detail tests on index 3). `npx eslint` on `score.ts`, `score.spec.ts`,
  `chat.page.spec.ts`: clean. Prettier: `chat.page.spec.ts` clean; `score.ts` and
  `score.spec.ts` warn only in the hunks that warned at HEAD (checked hunk by hunk after the
  revert of the accidental full-file format).
- Gate round 3 (user, strict scorer, no restart): `charts,maps` Badge 1 (A1) 5/5, Badge 4 (A3)
  5/5; `charts` Badge 1 (A1) 5/5, Badge 2 (A2-without-maps) 5/5. `Gate reached.` in 7 m 46 s.
  The widget texts again name the missing map or the missing distance function and leave the
  slider out.

### Acceptance Coverage

- `T4-AC-01` — passed — the texts pinned in `chat.page.spec.ts` (T7-AC-05) and `scenarios.spec.ts`
  (T4-AC-01); gate round 3 on the final strings with the strict scorer, all four cells 5/5, each
  request a fresh `HttpAgent` (`run-eval.ts` `runScenario`).
- `T4-AC-05` — passed — `prompt.spec.ts` "T4-AC-05 fixes the selection path and states the form
  rules"; `find-conferences.definition.spec.ts` "T4-AC-05 names every field of a mounted
  conference"; `score.spec.ts` "T4-AC-05 requires the selection at /selectedConf" and "T4-AC-05
  fails a relative selection path and a second selection bound elsewhere, as the shell does".
- `T4-AC-06` — passed (manual, user) — round 2: badge 2 rendered the slider form on the first
  attempt with markers before the first move; badge 3 three comparison Cards without a reserve
  Button (this click without Gauge, round 1 with).
- `T4-AC-02`–`T4-AC-04` — N/A — moved to Task 4.5 by the split amendment (`docs-task-4-split`).
- `XC-01`, `XC-04`, `XC-05` — contributes; the cross-cutting checks are the plan's end-of-scope gate.

### Open Issues

- Badge 1 tends to add the selected conference's detail Card (Gauge, Reserve) under the Timeline
  and badge 3 sometimes shows tickets left as Text instead of a Gauge; the eye re-clicks at
  capture, "no detail Card under an overview" is the candidate prompt sentence if "Timeline alone"
  does not come after three clicks (→ Task 4.5).
- The slider's range is chosen blind (2000 km twice, 500 once); the eye re-clicks at capture
  (→ Task 4.5). Promoted: `farthestKm` in the compact summary (→ improvements register, written
  this task).
- Promoted: the basic catalog reaches the model by prop names only; stage 2 is full schemas or a
  `describeComponents` tool (→ improvements register, written this task).
- `docs/spec.md` §7 still says "Anfragen 1–3 … ≥ 4/5"; the gate now plays badges 1, 2 and 4 as
  fresh sessions. `docs/how-it-works.md` still narrates "show them on a map" as the map request
  (lines 70, 247) (→ Task 6, spec on both sides of the copy).
- Register entries 28 (vocabulary check for every requirement) and 30 (drive-loop extraction)
  stay open in the register; no target task.

### Context for Next Task

- Task 4.5 (browser recorder): the texts are `EXAMPLE_PROMPTS` in `src/app/chat/example-prompts.ts`
  (badge index = position); the prompt and the catalog entry are final for the capture; the
  recorder hooks in where `correctRenderFailures` binds (`src/app/agent/init-agent-store.ts`),
  the `?record` flag belongs next to `resolveAgentMode` in `src/app/agent/agent-mode.ts`. The
  catalog entry now has a fourth key `basic`; recordings never contain the entry.
- Forms observed per badge and their variance (see Test Evidence): badge 1 may bring a detail
  Card, badge 3 a Gauge or a Text, badge 2 a range of 2000; badge 4 Map + Timeline + Card is the
  accepted form. A refused first attempt is a run with a failed tool result — the recorder drops it.
- The shell's `Slider` schema is strict: `label`, `min`, `max`, `value` plus the common
  `accessibility`, `weight`, `checks`, `isValid`, `validationErrors`; no `step`.
- The agent server in the user's `npm run start` does not watch: restart the group after any
  change to `agent/src/prompt.ts` or `catalog-context.ts` before a paid run or click; killing the
  agent child alone would take the shells down (`--kill-others-on-fail`).
- `npm run eval` costs about 20 requests (four cells × five runs, one or two model calls each),
  about 7 minutes; the report labels cells `Badge n (A…)`. The scorer's host rules now include the
  shell's selection rule, so a recording that passes `score()` also passes the shell's boundary
  on that point.
- `chat.page.spec.ts`: the scripted-agent detail tests click index 3 (badge 4); index 2 is the
  comparison badge.

### Git State

```
$ git diff --stat
 agent/src/prompt.spec.ts                           |  10 ++
 agent/src/prompt.ts                                |  39 +++--
 docs/architecture.md                               |  27 ++-
 docs/how-it-works.md                               |   7 +-
 docs/improvements.md                               |   2 +
 docs/work/m3-reserve-maps-hosting/plan.md          | 192 +++++++++++----------
 eval/run-eval.ts                                   |  14 +-
 eval/scenarios.spec.ts                             |  20 +--
 eval/scenarios.ts                                  |  25 ++-
 eval/score.spec.ts                                 |  60 ++++++-
 eval/score.ts                                      |  45 +++--
 public/recordings.json                             |   4 +-
 src/app/a2ui/catalog-context.spec.ts               |  14 ++
 src/app/a2ui/catalog-context.ts                    |  10 ++
 src/app/agent/tools/find-conferences.definition.ts |   4 +-
 src/app/chat/chat.page.spec.ts                     |  16 +-
 src/app/chat/example-prompts.ts                    |  10 +-
 17 files changed, 329 insertions(+), 170 deletions(-)

$ git status --short   (sandbox mask entries such as .bashrc, .claude/ omitted)
 M agent/src/prompt.spec.ts
 M agent/src/prompt.ts
 M docs/architecture.md
 M docs/how-it-works.md
 M docs/improvements.md
 M docs/work/m3-reserve-maps-hosting/plan.md
 M eval/run-eval.ts
 M eval/scenarios.spec.ts
 M eval/scenarios.ts
 M eval/score.spec.ts
 M eval/score.ts
 M public/recordings.json
 M src/app/a2ui/catalog-context.spec.ts
 M src/app/a2ui/catalog-context.ts
 M src/app/agent/tools/find-conferences.definition.ts
 M src/app/chat/chat.page.spec.ts
 M src/app/chat/example-prompts.ts
?? docs/work/m3-reserve-maps-hosting/task-log/task-4-badges-form-rules-eval.md
?? src/app/agent/tools/find-conferences.definition.spec.ts
```

### Sessions

- claude-code c2fdbb4a-034d-42c2-8467-f6083cf05259 (2026-09-29) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/c2fdbb4a-034d-42c2-8467-f6083cf05259.jsonl
