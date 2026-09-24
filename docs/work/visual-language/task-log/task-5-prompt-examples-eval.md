# Task 5: Prompt examples with grouped facts and the eval run

### Task
Teach the model, through the prompt's detail-view example, to wrap a conference's facts in a `Card`,
group every caption with its value in a `Column` and separate groups with a `Divider`; translate the
German strings the model still read (`daysUntil`, `distance`); and — extended by the user in this
session — stabilise the A3 gate first, because it had drifted below 4/5 on the unchanged strings.

### Status
DONE. Ten paid eval runs (one aborted) in one session, with a measurement incident in the middle:
the agent's `tsx watch` stopped reloading `agent/src/prompt.ts` after a `git checkout` at 12:10, so
runs 4–7 and every browser sample between 12:10 and 14:15 measured the reverted prompt. What those
runs prove is that the `Map` description claiming "where" and "near me" questions restores the gate
on its own (5/5 · 5/5 · 5/5, then 5/5 · 5/5 · 4/5). After the agent was restarted, run 9 on the
real final strings — grouped example, a static "One conference's details" section with the `Card`
first, the `Map` claim, English descriptions — reached 5/5 for every request, and both live samples
carried the `Card`, two `Divider`s and grouped pairs. Independent review performed (Codex, quick
mode, 2026-09-24): four findings — 1 (detail rule without a fallback for missing capabilities)
fixed with a clause and run 10 at 5/5 everywhere, 2 (390-px evidence too broad) fixed with a
final-strings sample at 390 and a precise log, 4 (no durable schema test for the examples) fixed
with `eval/prompt-examples.spec.ts`, 3 (the gate proves wiring, not rendering) declined by the user.
All five unit suites, lint, sheriff and Prettier are green on the final code. The user looked at
1280 px (Card, pairs, dividers as intended); 390 px is covered by sample 9.

### Files Modified
- `agent/src/prompt.ts` (modified) — the detail-view example: `Card` as root, a `Column` per
  caption/value pair inside the facts `Row`, a `Divider` before the reserve button (City and
  Ticket price as the facts); the caption rule says "grouped with its value in a `Column`"; a new
  section "One conference's details" (three bullets: `Card` with name, facts and Button; tickets
  left and distance with the Custom Catalog component or function whose description fits; the
  reserve Button even unasked, and — after the review — a fallback: "if the catalog offers none,
  bind the plain value, and leave out what no listed function can compute"); "Client events"
  keeps only the event-name rule.
- `projects/mfe-maps/src/maps/map.schema.ts` (modified) — the `Map` description ends with
  "Use it for "where" and "near me" questions." (appended, so the abbreviated quote in
  `docs/how-it-works.md` stays a valid prefix).
- `projects/mfe-maps/src/maps/distance.fn.ts` (modified) — "N km entfernt" → "N km away".
- `projects/mfe-charts/src/charts/days-until.fn.ts` (modified) — "in N Tagen" → "in N days".
- `docs/improvements.md` (modified) — the A3-slack line closed with this task's runs and the lever
  that worked; two lines promoted: the pairing idiom is taught, not enforced (structural
  alternative); the model's invalid `formatDate` format string.
- `docs/architecture.md` (modified) — "Status and history": the 2026-09-24 eval-gate entry.
- `eval/prompt-examples.spec.ts` (new) — parses both example blocks out of `buildInstructions([])`
  and checks them against `A2uiMessageListWrapperSchema` and the shell's `findStructuralViolations`
  (review finding 4; lives in the eval project because it needs the root's a2ui package and the
  agent's prompt module together).
- `docs/work/visual-language/task-log/task-5-prompt-examples-eval.md` (new) — this log.

### Files Read (Context Only)
- `docs/work/visual-language/plan.md` (preamble, Task 5), `task-log/task-4-chat-frame-renderers.md`,
  `task-log/task-1-tokens-fonts-bench.md` (Row rules, pair findings), `docs/work/m2-nf-split/task-log/`
  `task-7-eval-capability-sets.md` and `task-9-english-demo.md` (by grep: example decisions, figures)
- `agent/src/prompt.spec.ts`, `agent/src/config.ts`, `agent/src/server.ts`
- `eval/run-eval.ts`, `eval/scenarios.ts`, `eval/score.ts`, `src/app/chat/example-prompts.ts`
- `src/theme/a2ui.css`, `src/app/playground/playground.ts` (the bench's grouped-pair markup),
  `src/app/domain/conference.ts`, `src/app/a2ui/surface-host-rules.ts` (root constraints: none),
  `src/app/a2ui/catalog-context.spec.ts` (pins "Tickets left" in the `Gauge` description)
- `projects/mfe-charts/src/charts/gauge.schema.ts`, `docs/how-it-works.md:116` (Map quote)
- `node_modules/@a2ui/web_core/src/v0_9/basic_catalog/components/basic_components.js` (`Card`,
  `Divider`), `functions/basic_functions_api.js` (basic function names)
- `docs/improvements.md`, `docs/architecture.md` (status section), `package.json`, `agent/package.json`
- the agent's log of the earlier session (`/proc/<tsx-watch-pid>/fd/1`) — the reload history

### Key Decisions
- **City and Ticket price are the example's facts.** No date: a `formatDate` on
  `/selectedConf/date` competed with `daysUntil` in M2 Task 7 (A3 3/5, "daysUntil not used"). No
  `remaining`: a Text on it would compete with the `Gauge` A3 requires. `Card` as root because no
  host rule constrains the root's type and a2ui's `Card` takes exactly one `child`, so the wrapping
  Column is needed anyway. Both example blocks were validated against `A2uiMessageListWrapperSchema`
  before the runs that used them.
- **`prompt.spec.ts` untouched.** Nothing in it pins example content; the T7-AC-02 test (no custom
  name in the prompt without a catalog entry) is the basic-only guard and stayed green throughout.
  `Card` is a basic component, so the new section may name it.
- **No harness change for the AC-01 evidence.** The plan's Key Discovery "recorded verdicts and
  surfaces land under the eval's recording path" is wrong: `execute`/`recordSurface` keep the calls
  in memory and the run prints verdicts and widget texts only. The evidence is DOM outlines of
  live answers in the app; a surface dump in the harness was rejected as a convenience extra.
- **Reverted after run 2, as the plan says; the third run then failed on the fallback strings.**
  Runs 1 and 2 (grouped example) failed A3 with a failure mode earlier runs never showed (`no Gauge
  bound to /selectedConf/remaining`, 4 of 10). Run 3 on the reverted strings — the 2026-09-22 5/5
  strings plus "in N days" — also scored 3/5 (one `no Map`, one `no Gauge`), so the gate was broken
  at baseline and n = 5 could not separate that from the grouping's effect. The task was written up
  BLOCKED with a re-plan proposal (Task 5b gate slack, Task 5c retry); the user chose to do both
  here, which this log records as the accepted scope change.
- **The gate lever that is proven is the `Map` description; the prompt section is the second,
  untested-in-isolation lever.** Runs 4 and 5 were meant to measure the detail-view rule plus the
  `Map` claim, but the agent still served the reverted prompt (incident below), so they measured
  the `Map` claim and the English labels only — the eval reads the vocabularies from the files
  under Node, and the shell's remotes were rebuilt by `ng serve`, while the agent process kept its
  old prompt. That the claim alone lifts A3 from 3/5 to 5/5 and 4/5 is the cleaner finding. The
  "One conference's details" section was kept because run 9 holds the gate with it and because it
  is what makes the `Card` appear (two of two samples, against zero of two on the stale prompt).
- **Why a rule and not a name or the request.** A3 asks the model to infer that "details" include
  remaining tickets and distance. Rejected: naming the `Gauge` in a hint ("if available") — a name
  in the static prompt outweighs the vocabulary rule (M2 Task 7: the model built a `Timeline` with
  charts off); sharpening the demo request ("… and how many tickets are left") — the user-facing
  prompt, and it would change what the gate measures; scorer-side slack (any selection component)
  — a changed M1 verdict, not needed; examples generated from the announced vocabulary — needs
  the remotes to ship example fragments (contract change, M3). Chosen: a section in the agent's
  voice, same pattern as the existing "day counts or distances … with the functions the Custom
  Catalog lists", saying what a single conference's detail view shows and leaving the how to the
  descriptions; the `Card` bullet first because a mid-sentence clause ("put them in a `Card`") had
  been ignored — although that observation, too, was made on the stale agent.
- **Incident: `tsx watch` stopped reloading after `git checkout`.** The agent's log shows reloads
  at 11:58:26 (first prompt edit) and 12:10:34 (the checkout) and none for the four later edits;
  the listening child's start time stayed 12:10:34. Runs 4–8 and samples 3–6 therefore ran on the
  reverted prompt. Run 8 was aborted (`exit=143`), the watcher tree killed, the agent restarted at
  14:15:14 with a fresh log in this session's scratchpad (no reload during run 9, checked). Lesson
  recorded in the session memory: check the reload in the agent's log or the child's start time
  before every paid run; never `pkill -f` with a pattern that matches the calling shell.
- **The second German leftover was found late.** The first grep looked for "Tagen" and umlauts;
  `distance`'s "N km entfernt" surfaced only in the broader word list (`entfernt|Tagen|Karte|…`).
- **Berlin was picked before every live check** (stored under `conference-finder.city`) so the
  browser runs match the eval's fixed `ME`; without a city the prompt says not to bind `/me`.
- **Pre-existing Prettier drift in `map.schema.ts` left alone** (two quote-style lines outside the
  edited one); `npx prettier --check` warns on that file before and after this task.
- **User clarifications, recorded:** the example is an idiom lesson for a low-level catalog, not a
  layout template; the structural facts component is the deterministic alternative (register). The
  user wants the `Card` ("without it the view looks broken"), hence the section's first bullet.
  Mono fact values were assessed and not implemented (see Open Issues).
- **Observed, not fixed:** the model's `formatDate` call used an invalid format string (console
  RangeError, raw ISO date or an empty Date shown) — promoted; the `Distance` Text rendered empty —
  already in the register (from Task 1); the map's overlapping labels — out of scope (M3 MapLibre).

— session 2026-09-24, after the Codex quick review

- **Finding 1 fixed: the detail rule now says what to do without the fitting capability.** The
  probe before the change (`?capabilities=charts`, request 3, no `distance` announced) showed a
  "Distance from you" pair with an empty value — the rule asked for a distance nothing could
  compute. The second bullet gained "if the catalog offers none, bind the plain value, and leave
  out what no listed function can compute"; `Card` and the basic-only guard untouched. Run 10 on
  these strings: 5/5 for every request.
- **Finding 2 fixed: the 390-px claim rests on a final-strings sample now.** Samples 2 and 4 were
  earlier prompt states (sample 4 the stale agent); sample 9 (below) is the final prompt at 390.
- **Declined finding: Codex — the green gate proves neither grouping nor rendered values
  (`score.ts` checks only that the functions occur) — the user's look on screen is that check by
  the plan's own rule ("a look, not a diff"), and the user did look (screenshots at 1280);
  evaluating function results in the harness would need the renderer there.**
- **Finding 4 fixed: a durable schema test.** `eval/prompt-examples.spec.ts` replaces the one-off
  probe; it also runs the shell's structural host rules, so a dangling child id would fail too.

### Review Focus
- **Behavior claims:** (1) On the final strings `npm run eval` reached the gate at 5/5 for every
  request (run 10, agent reload confirmed in its log) — recorded, not reproducible. (2) Three
  live request-3 answers on the final strings (samples 7–9; 9 at 390 px) render a `Card` holding
  the name, a `Row` of caption/value `Column`s and the Button, with two `Divider`s; at 390 the
  four pairs sit in one line with caption x = value x each (the whole-pair wrap itself is CSS
  from Task 1, seen on samples 2 and 4 of earlier prompt states). (3) `rg -i 'entfernt|Tagen|…'` over the model-facing code
  hits nothing; the `daysUntil` and `distance` descriptions end in English labels.
- **Plan deviations:** "revert the grouping and keep the rest; the task must not leave the gate
  broken" → reverted, gate still broken at baseline → BLOCKED write-up → user decision: fix the
  gate here and retry the grouping — eight more paid runs than the plan's "once", one of them
  aborted · the gate lever is a `Map` description claim plus a new prompt section, neither in the
  task block · "Adjust `prompt.spec.ts` where it pins example content" → it pins none → untouched ·
  "recorded verdicts and surfaces land under the eval's recording path" → nothing is written to
  disk → DOM samples in the app as AC-01 evidence · "Take the German leftover with it" (one
  named) → two found and fixed · `map.schema.ts` and `docs/architecture.md` touched (not in Key
  Locations) · the agent was restarted by this session.
- **Assumptions / choices:** City + Ticket price as the example's facts; `Card` as root; the section
  names "tickets left" to match the `Gauge` description's "Tickets left"; "(when the user's
  location is known)" so the rule does not fight the unknown-location section; the `Map` claim
  appended rather than leading; the `Card` bullet says "name, the facts and the reserve Button"
  and leaves the `Gauge`'s placement to the model.
- **Scope notes:** ten paid eval runs (about 235 requests on `claude-sonnet-5`, one run aborted
  after 8); ten live model calls in the browser; `eval/prompt-examples.spec.ts` added (review); the `task5` tab left at a 1280 × 900 emulation
  (dpr 1) with the last answer on screen; the agent now runs from this session (`npm run
  start:agent`, log `serve-agent.log` in this session's scratchpad).
- **Read next:** `agent/src/prompt.ts` — the "One conference's details" section and the second
  `FORMAT_RULES` example; `projects/mfe-maps/src/maps/map.schema.ts:30-34` (the proven lever);
  this log's Test Evidence table, column "agent prompt".

### Test Evidence
- Final code: `npm run test:agent` 30 passed (after the last prompt edit); `npm run test:eval` 29,
  `npm run test:maps` 10, `npm run test:charts` 18 (after the description edits);
  `npm run test:shell` 119 (shell code untouched); `npm run lint` — every project "No issues
  found", sheriff "All projects validated successfully"; `npx prettier --check` clean on
  `prompt.ts`, `days-until.fn.ts`, `distance.fn.ts` (`map.schema.ts`: pre-existing drift, see Key
  Decisions).
- Probe (gone): `eval/__t5-validate.ts`, a tsx script extracting both `json` blocks from
  `buildInstructions([])` and parsing them with `A2uiMessageListWrapperSchema` — "example 1: valid,
  example 2: valid", run before run 1 and again before run 6 (exit 1 on an invalid block, so the
  paid run would not have started). Removed in the same command; nothing in the tree. `npx tsx`
  cannot run in the sandbox (`listen EPERM` on its IPC pipe); `node --import tsx` does.
- Eval runs (`npm run eval`, agent on 3001, sandbox off, logs `eval-run-{1..9}.log` in this
  session's scratchpad; `EVAL_RUNS` default 5, gate 4 of 5; every `A2-without-maps` answer named
  the missing map). "Files" is what the eval read from the tree; "agent prompt" is what the agent
  process actually served:

  | Run | Files | Agent prompt | charts,maps | charts | Gate |
  |---|---|---|---|---|---|
  | 1 | grouped example, "in N days" | same | A1 5/5 · A2 5/5 · A3 **3/5** (runs 1, 3: `no Gauge bound to /selectedConf/remaining`) | 5/5 · 5/5 | NOT reached |
  | 2 | same | same | 5/5 · 5/5 · **2/5** (runs 1, 3: `no Gauge …`; run 5: `expected exactly one renderSurface call, got 0`) | 5/5 · 5/5 | NOT reached |
  | 3 | example reverted, "in N days" | same (reload 12:10:34) | 5/5 · 5/5 · **3/5** (run 1: `no Map in the surface`; run 3: `no Gauge …`) | 5/5 · 5/5 | NOT reached |
  | 4 | + `Map` claim, "N km away", detail-view rule | **stale: reverted** | 5/5 · 5/5 · 5/5 | 5/5 · 5/5 | reached |
  | 5 | same | stale | 5/5 · 5/5 · 4/5 (run 2: `no Gauge …`) | 5/5 · 5/5 | reached |
  | 6 | + grouped example | stale | 5/5 · 5/5 · 5/5 | 5/5 · 5/5 | reached |
  | 7 | + `Card` clause in the rule | stale | 5/5 · 5/5 · 5/5 | 5/5 · 5/5 | reached |
  | 8 | + "One conference's details" section | stale | aborted after run 2 (all ok) | — | — |
  | 9 | same | **current** (restart 14:15:14) | 5/5 · 5/5 · 5/5 | 5/5 · 5/5 | reached, exit 0 |
  | 10 | + fallback clause in the section (**final**) | current (reload 14:48:05 confirmed) | 5/5 · 5/5 · 5/5 | 5/5 · 5/5 | reached, exit 0 |

  Reference: 2026-09-22 (M2 Task 9, same requests): 5/5 · 5/5 · 5/5 and 5/5 · 5/5. A3 durations
  14–28 s per request in runs 1–3, 12–24 s afterwards.
- Browser (chrome-devtools MCP, isolated context `task5`, shell 4200 with `?capabilities=charts,maps`,
  Berlin picked; probes were `evaluate_script` calls only, screenshots viewed, not saved; the 1280
  window reads `innerWidth` 1163 at dpr 1.65 — Task 2's scaling note; every sample is a fresh
  request-3 answer):
  - Samples 1 and 2 (grouped example served, 1280 and 390 × 844): `Column[Text, Map, Divider,
    Card[Column[h3, Row[Column[caption City, Berlin], Column[caption Date, …Z], Column[caption In
    days, 12], Column[caption Distance, ""]], (Row[Gauge] in sample 2), Divider, Button]]]`. Row
    `flex-wrap: wrap`; at 1280 the four pair Columns (39 / 189 / 55 / 63 px) sit at one y, caption
    x = value x per pair; at 390 (`clientWidth` = `scrollWidth` = 390, card 358 wide) City and
    Date at y 282, In days and Distance at y 355 — whole pairs wrapped. Card: 1-px `#c8d3db` line,
    radius 6, padding 20 24, white, no shadow; dividers `hr` with the 1-px line; captions IBM Plex
    Mono 12 px uppercase `#4e5f6b`. Console: two pre-existing geolocation warnings and "Error
    formatting date: RangeError: Format string contains an unescaped latin alphabet character `n`".
  - Samples 3–6 (stale agent, reverted prompt; 390, 390, 1280, 1280): no `Card`; pairs as
    Columns in 3 of 4 (the model's own habit, seen in Task 1 too), flat caption/value rows in 1;
    `Divider` in 1. The user's two screenshots (Munich) match: no `Card`, flat or paired facts,
    unstyled gauge, raw ISO date, empty distance.
  - Samples 7 and 8 (restarted agent, final strings, 1280): `Column[Text, Map, (Timeline in 8),
    Divider, Card[Column[h3, Row[Column[City], Column[Date], Column[In days / Starts in],
    Column[Distance], (Column[caption Tickets left, Gauge] in 8)], (Gauge in 7), Divider, Button]]]`
    — 1 `Card`, 2 `Divider`s, 4 and 5 pair Columns.
- Probe before finding 1's fix: `?capabilities=charts` (chips "charts loaded", "maps off"),
  request 3 — `Column[Text "Conferences near Berlin", Timeline, Divider, Card[Column[h3,
  Row[Column[City], Column[Date, 2026-10-06], Column[Starts in, 12], Column[Distance from you,
  ""]], Gauge, Divider, Button]]]`, no `.cf-error`, console clean — an empty distance fact where no
  function can compute one.
- Sample 9 (final strings, run-10 prompt, 390 × 844 mobile, Berlin): `Column[Text, Map, Divider,
  Card[Column[h3, Row[Column[City, Berlin], Column[Date, 2026-10-06], Column[In days, 12],
  Column[Distance, ""]], Row[Gauge], Divider, Button "Reserve"]]]`; card x 16, 358 wide; the four
  pairs at y 355 (x 41 / 96 / 191 / 263, widths 39 / 80 / 55 / 63), caption x = value x each;
  `clientWidth` = `scrollWidth` = 390.
- `npm run test:eval` with the new spec — 4 files, 30 passed; `npx prettier --check
  eval/prompt-examples.spec.ts` clean; `npm run test:agent` 30 passed after the fallback clause.
- CSS feasibility probe for mono fact values (not implemented, see Open Issues): the selector
  `a2ui-v09-component-host:has(> a2ui-v09-text .a2ui-text.caption) + a2ui-v09-component-host >
  a2ui-v09-text .a2ui-text` matched exactly the four values behind a caption in sample 5.

### Acceptance Coverage
- T5-AC-01 partial — manual: samples 7–9 on the final strings (9 at 390 px; and 1 and 2 on the
  grouped example alone) show the facts in a `Card` with `Divider`s and every caption grouped
  with its value, basic components plus the announced `Map`/`Gauge`. The harness cannot show
  surfaces, so no eval-run evidence exists; nothing enforces the idiom (register). Automated:
  `eval/prompt-examples.spec.ts` pins that the example the model imitates is a valid surface.
- T5-AC-02 partial — manual: run 10 on the final strings (agent reload confirmed), every request
  5/5, "Gate reached", exit 0; run 9 on the strings without the fallback clause likewise. Paid, non-deterministic, not in CI; the figures are in the table
  above and in `docs/architecture.md`.
- T5-AC-03 partial — manual: `rg -n -i 'entfernt|Tagen|Karte|zeige|nächste|übrig|Konferenz|
  Ticketpreis|Reservieren|Plätze|Standort'` over `shared`, both remotes' `src`, `src/app/agent`,
  `src/app/a2ui`, `agent/src`, `eval` (specs excluded) hits only identifiers containing "Agent";
  `rg Tagen` outside `node_modules`/`docs/work` hits only the spec's frame illustration
  (`docs/specs/visual-language.md:85`, not model-facing). No automated test pins the descriptions.

### Open Issues
- Promoted: the pairing idiom is taught, not enforced; a structural facts component would
  guarantee it (→ improvements register).
- Promoted: the model's invalid `formatDate` format string (→ improvements register).
- Two CSS-only follow-ups go to a fix lane in a fresh session (user decision, handoff written):
  (1) mono fact values — the spec's "mono numerals carry every date, distance and count" does not
  hold in model-composed surfaces; a `:has()` rule on the caption/value pair was verified to match
  exactly the values (Test Evidence); (2) a pair whose value is a component, not a `Text`, takes
  the whole row — the model reads "tickets left with the fitting component" plus the pair idiom as
  "the `Gauge` is the value of a Tickets-left pair" (sample 8 and the user's screenshot at 1280:
  the gauge sits inside the facts row), consistent but visually broken. Both rules belong in
  `src/theme/a2ui.css`, no prompt change, no eval run (→ fix lane). The user added the two
  register defects of the same view to that handoff — the empty `distance` value and the
  `formatDate` format string — as investigate-first items.
- The user looked at 1280 px with the restarted agent: `Card`, pairs and dividers as intended,
  the gauge-in-a-pair issue above, the unstyled timeline (Tasks 6–7) and map (M3).

### Context for Next Task
- Task 6 (Timeline, CSS only) depends on nothing here. The eval gate holds as of 2026-09-24
  (run 9); `docs/architecture.md` "Status and history" carries the figures (Task 9 must not copy
  older ones forward).
- Prompt structure now: the second `FORMAT_RULES` example is the grouping idiom; "One conference's
  details" (three bullets) carries the `Card`, the content and the reserve rule; "Client events"
  only the event-name rule. Static text names no custom component (T7-AC-02 guard).
- Before any paid `npm run eval` after a prompt edit: confirm the agent reloaded — the agent's log
  (`serve-agent.log` in this session's scratchpad; `readlink /proc/<tsx-watch-pid>/fd/1` for a
  later session) prints `[tsx] change in ./src/prompt.ts Restarting...`, or compare the listening
  pid's `ps -o lstart=` with the file's mtime. `git checkout` of a watched file broke the watcher
  once; restart with `npm run start:agent` (kill the watcher tree first, by pid, never `pkill -f`
  with a pattern the calling shell matches).
- `src/theme/a2ui.css` Row rules (`flex-wrap`, `min-width: fit-content`, Column
  `width: auto !important`) are what make a grouped pair move whole; a flat caption/value Row can
  still split below about 360 px (Task 1 finding).
- `npx tsx` fails in the sandbox (IPC pipe); use `node --import tsx <file>`. `npm run eval` needs
  the sandbox off (agent on 3001). Vitest output of the Angular projects is colour-coded — do not
  `grep` it for gate conditions in a chain.
- Dev servers: shell 4200, charts 4201, maps 4202 from earlier sessions; the agent on 3001 from
  this session (`tsx watch`, child restarted 14:15:14). The chrome-devtools tab `task5` is at a
  1280 × 900 emulation (dpr 1) with the last answer on screen.
- The harness prints verdicts and `messageWidget` texts only; to see a surface, use the app.
- Fix lane after `/commit 5` (handoff): the two `a2ui.css` rules above; check on `/playground`
  (the bench has both pair variants) and with request 3 in the app; Task 8 later restyles the
  gauge itself and decides about the duplicated "Tickets left" caption above it.

### Git State
`git diff --stat`:

```
 agent/src/prompt.ts                             | 39 +++++++++++++++++--------
 docs/architecture.md                            | 11 +++++++
 docs/improvements.md                            |  4 ++-
 projects/mfe-charts/src/charts/days-until.fn.ts |  2 +-
 projects/mfe-maps/src/maps/distance.fn.ts       |  2 +-
 projects/mfe-maps/src/maps/map.schema.ts        |  2 +-
 6 files changed, 44 insertions(+), 16 deletions(-)
```

`git status --short` (device-node dotfiles of the sandbox filtered out):

```
 M agent/src/prompt.ts
 M docs/architecture.md
 M docs/improvements.md
 M projects/mfe-charts/src/charts/days-until.fn.ts
 M projects/mfe-maps/src/maps/distance.fn.ts
 M projects/mfe-maps/src/maps/map.schema.ts
?? docs/work/visual-language/task-log/task-5-prompt-examples-eval.md
?? eval/prompt-examples.spec.ts
```

`handoff.md` (untracked) is the fix-lane handoff, not part of this commit.

### Sessions
- claude-code d96ca0d3-7f1d-4562-af9c-deb45b1ff897 (2026-09-24) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/d96ca0d3-7f1d-4562-af9c-deb45b1ff897.jsonl
- claude-code 78a2094e-35eb-4c2b-980c-066085acc4e1 (2026-09-24, continuation after the Codex review) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/78a2094e-35eb-4c2b-980c-066085acc4e1.jsonl
