# docs-demo-variation-decisions: More variation across the four demo badges

### Task

A review of why the four example prompts render nearly the same surface, an assessment of every
lever (prompt rules, badge texts, scorer, new components, new remotes, a reservations view), and
the resulting M3 plan amendment: four badges with four forms, a slider distance filter as a
catalog function inside `mfe-maps` (new Task 3.5), `reserved` deferred.

### Status

DONE — documentation only: the plan is amended, the review's working paper is deleted, no
application code changed. Independent review not performed; the decisions were taken with the
user in this session. Verification consisted of reading renderer, processor and shell code (see
Test Evidence); nothing was run against the model.

### Root Cause

The four badges converged on Timeline plus Map plus Gauge for three reasons that reinforce each
other:

- **One data slice.** All four prompts asked for "Angular, upcoming"; the data set has 30
  conferences in 5 topics, the demo showed the same 9 every time.
- **Prompt rules that reward the full package.** "Wiring — local first" and "One conference's
  details" in `agent/src/prompt.ts` make a selection component plus a detail Card with Gauge the
  best answer to almost anything, and the `Map` description claims every "where"/"near me" question.
- **A scorer that forbids nothing extra.** `A1` checks only "a Timeline bound to `/filteredConfs`",
  `A2` only "a Map"; a surface with all three widgets passes every requirement. Task 4's capture
  uses the same checks as its acceptance rule, so the convergent answers would have been recorded
  into the hosted demo.

The fourth badge added a second detail Card of the first conference rather than the clicked one,
because every new answer pre-sets `/selectedConf` to `confs[0]`; the user's screenshot (Poznań
selected, Berlin offered for reservation) was this effect.

### Files Modified

- `docs/work/m3-reserve-maps-hosting/plan.md` (modified) — scope line; three new decisions in the
  header (four forms, function-in-maps, `reserved` deferred) and the superseded "prompts 2 and 4"
  note; order sentence; new Task 3.5 (slider filter, call-shaped bindings, zero fix); Task 4
  amendment block, badge texts, prompt paragraph, scorer paragraph, matrix, proof, T4-AC-01 and
  T4-AC-04; Task 6 amendment block and the struck "as a chart" example; XC-01 and XC-03. Applied
  by a scratchpad script with an exactly-once check per replacement (16 edits); the script is not
  in the tree.
- `docs/demo-variation-assessment.md` (deleted, was untracked) — another session's working paper
  for the same review; its findings and prompts are superseded by the plan amendment and this
  log, and the docs root holds living documents only.

### Files Read (Context Only)

- `agent/src/prompt.ts`, `src/app/chat/example-prompts.ts`, `src/app/chat/chat-header.component.html`
  + `.css` (the badge strip).
- `projects/mfe-charts/src/charts/vocabulary.ts`, `gauge.schema.ts`, `timeline.schema.ts`,
  `days-until.fn.ts`, `timeline.component.ts` + `.html` (selection highlight);
  `projects/mfe-maps/src/maps/vocabulary.ts`, `map.schema.ts`, `distance.fn.ts`, `map.component.ts`,
  `map-markers.ts` (selection ring, `showMarkers`, `fit`).
- `shared/capabilities/binding.ts`, `catalog-function.ts`, `custom-component.ts`;
  `src/app/a2ui/assistant-catalog.ts`, `catalog-context.ts`, `surface-host-rules.ts`
  (`CLIENT_OWNED_SEGMENTS`, `findSelectionPathViolations`), `reserve-handler.ts`;
  `src/app/agent/tools/render-surface.tool.ts` (`validateRenderRequest`, the mount),
  `find-conferences.definition.ts`, `surface-data.store.ts`; `src/app/domain/conference.ts`,
  `conference.store.ts`, `find-conferences.ts`, `find-conferences.schema.ts`, `conferences.json`.
- `eval/score.ts`, `eval/scenarios.ts`, `eval/run-eval.ts` (runs, `ME`), `eval/prompt-examples.spec.ts`.
- `docs/spec.md` (§0–§2, §4, §8b), `docs/improvements.md`, `docs/how-it-works.md` (grep),
  `docs/work/m3-reserve-maps-hosting/plan.md`, `task-log/task-1-reserve-handler-store.md`,
  `task-log/task-2-maplibre-mfe-maps.md` (status).
- `node_modules/@a2ui/angular/fesm2022/a2ui-angular-src-v0_9.mjs` (`bind`, `SliderComponent`,
  `TextComponent`), `node_modules/@a2ui/web_core/src/v0_9/rendering/data-context.js`,
  `rendering/generic-binder.js`, `processing/message-processor.js`, `catalog/types.js`,
  `schema/common-types.js`, `basic_catalog/components/basic_components.js` (`SliderApi`).
- `src/theme/a2ui.css`, `package.json` (scripts, no `patch-package`).

### Key Decisions

- **Four badges, four forms (user).** Timeline alone; Map with a distance Slider; three comparison
  Cards; Map plus detail Card with the reserve Button. Reserving is the click in badge 4, not a
  badge: spec §2 defines request 4 as the click, and a separate badge cannot know the clicked
  conference (fresh answer, `/selectedConf` pre-set to the first result). Texts:
  1. "Which Angular conferences are coming up in the next six months?"
  2. "Where are the Angular conferences around me? Let me narrow them down by distance with a slider."
  3. "Compare the next three Angular conferences: date, city, ticket price and tickets left."
  4. "Where and when is the next Angular conference near me? When I click one, I want details and a way to reserve a seat."
  Badge 1 stays Angular (about 7 markers) rather than all topics: the Timeline's board layout for
  dense clusters is designed for request 1's size, 21 markers are unverified, and the variation
  comes from the form, not the count.
- **Form rules in the system prompt and negative lists in the capture, not steering clauses in the
  badge text.** The other session's proposal ("Keep this a schedule overview") would have shown
  prompt engineering to visitors and needed a label/text split touching replay keys, eval and
  header. Replay is deterministic: what a badge shows is decided once at capture time, so the
  capture requirement pins the form (wanted and unwanted components) and the badge stays a natural
  question. The eval gate then measures how many retries the capture will need, not whether the
  demo varies.
- **The comparison binds by index and carries no reserve Button.** `Row [Card(/filteredConfs/0),
  Card(/1), Card(/2)]` with `limit: 3`: absolute paths, no List template, no relative paths inside
  custom components (the renderer supports templates, relative resolution inside a `Gauge` in a
  template is unverified). Per-card reserve Buttons would bind `/filteredConfs/<i>/id`, which the
  fixed-selection rule (T1-AC-04) rejects and which would end in correction runs; the prompt rule
  says so explicitly.
- **`withinKm` lives in `mfe-maps`; no third remote.** Spec §8b.1 wanted `mfe-filter`. A third
  selectable remote doubles the recording matrix to 8 sets (32 recordings) and grows manifest, panel
  and deploy script; the function beside `distance` keeps 4 sets. Renderer facts that make it a
  half-day task: `Slider` is in the basic catalog and implemented; `DataContext.resolveSignal`
  re-evaluates a `{ call }` prop in an `effect` whenever an argument path changes; the one blocker is
  `binding()` accepting only literal or `{ path }` while `message-processor.js:247` validates every
  custom prop against that schema. Effort about half a day, the same as a `BarChart`; the effect is
  interaction without a token and the functions half of the federation, so it takes the single
  extension slot and the `BarChart` is dropped. Badge 2 falls back to the plain 300 km map if `A2`
  misses 4 of 5 twice (rule written into Task 4); `withinKm` stays announced either way.
- **The call shape is defined locally on `zod/v3`, never imported from web_core.** The register's
  `k._parse is not a function` came from a union across zod copies.
- **The zero fix is a one-line `patch-package` patch, independent of `reserved`.**
  `TextComponent` in `@a2ui/angular` 0.10.5 computes `props.text.value() || ''` (line 823), so a
  bound 0 renders empty: "0 km" for any visitor whose city hosts a conference (11 German cities in
  the data), `daysUntil` on the event day. The register's Distance-0 entry (2026-09-24) recorded
  the cause and left the remedy open; the alternative, a prompt sentence routing counts through
  `formatNumber`, is a workaround the model must hit every time.
- **`reserved` per conference is deferred (user).** Design if it is ever built: a `reserved` field
  on `ConferenceResult`/a `MountedConference` type set by the existing `applyReservations` join
  (the store stays the single home of "mine", the confs are recreated from the immutable JSON on
  every tool call), a second `updateDataModel` per fixed home in the handler (the two fixed homes
  are the Task-1 decision, not the rejected id search across the data model; the index lookup in
  the client-mounted `/filteredConfs` is unavoidable because the entry's position is runtime data),
  and the field in Task 4's typed field list with the drift test against `ConferenceResult`, not
  `ConferenceRecord`. Rejected variant: mount the original `remaining` and let the surface compute
  `subtract(remaining, reserved)`; it moves correctness into the model's arithmetic and needs a
  call-shaped `Gauge.value`. Larger variant for a "my reservations" tile with a total: an
  `onlyReserved` argument on `findConferences` evaluated against the store in the browser plus a
  totals mount at a client-owned path; about three hours; empty state in replay is a list of nothing
  with €0. Deferred because the gauge already shows the cross-surface state (reserve in badge 4,
  badge 3 shows the lower gauge), the feature is shell domain beside the federation thesis, and the
  detail Card is the requirement with the least gate slack. Task 6 sharpens the register entry.
- **Dropped in the same review:** `BarChart` on `/byTopic`/`/byMonth` (a second output shape, no
  new mechanism; the slider takes the extension slot); a `sortBy` tool argument (the next Angular
  conference is already the 12-of-500 one, so "almost sold out" adds no visible variation);
  `myReservations` tool; facts component (register 46, layout not variety); a Timeline-plus-Map
  badge without Card (shows the two known widgets again; the comparison is the better new form);
  a third remote of any kind; List templates in the prompt (unverified relative paths in custom
  components, not needed with index paths).
- **The eval plays each badge as the first message of a fresh session**, as the capture does: the
  badges are self-contained and replay ignores history, so a conversation-style eval would measure
  behaviour the demo never shows. Written into Task 4.
- **Task numbering.** The new task is 3.5: it must precede Task 4 (vocabulary, announced schemas
  and Text rendering change before anything is recorded) and is independent of Task 3, so both can
  run in parallel. Existing task numbers and logs stay as they are.
- **`docs/improvements.md` untouched here.** The register changes (reservations entry, Distance-0
  note) are Task 6's, as the approved table said; this fix lane changes the plan only.
- **Working paper deleted.** `docs/demo-variation-assessment.md` sat in the docs root beside the
  living documents; decision material belongs in the work scope, and its content is in the plan
  amendment and this log.

### Review Focus

- **Behavior claims:** none in code. The plan now (1) names four badge texts and the form each
  must render, (2) adds Task 3.5 with acceptance criteria that are checkable without a model,
  (3) keeps the recording matrix at 16.
- **Plan deviations:** No plan (fix lane). The amendment itself supersedes the header decision
  "Prompts 2 and 4 become self-contained" and Task 4's `A4` requirement; both are marked in place.
- **Assumptions / choices:** the model can produce the nested `withinKm` call with three arguments
  and an initial `updateDataModel` for the slider path (spec §8b.1 names this as the risk; the eval
  decides, the fallback rule is written); index-bound Cards are within the model's reach; the
  Timeline with about 7 Angular markers stays the designed density.
- **Scope notes:** the deleted working paper was untracked and written by another session; nothing
  else outside the plan changed.
- **Read next:** `plan.md` header decisions (the three new bullets, the reasoning in one place);
  `plan.md` Task 3.5 "Key Discoveries" (the renderer facts with file:line that make the task
  small); `plan.md` Task 4 "Scorer" (the negative lists and the fallback rule, the two things the
  hosted demo's variation depends on).

### Test Evidence

Documentation only; no test suite run. Verification by reading, all on the installed packages
(`@a2ui/angular` 0.10.5, `@a2ui/web_core` matching):

- `Slider` present: `BASIC_COMPONENTS` lists it (node one-liner over
  `@a2ui/web_core/v0_9/basic_catalog`); `SliderComponent` at `a2ui-angular-src-v0_9.mjs:2131`,
  `value.onUpdate` at line 2149; `SliderApi` schema `basic_components.js:356` (`label`, literal
  `min`/`max`, dynamic `value`).
- Reactive call props: `rendering/data-context.js:146-201` (`resolveSignal`, argument signals,
  `effect` re-evaluating `evaluateFunctionReactive`); the Angular binder resolves every prop through
  it (`a2ui-angular-src-v0_9.mjs:205-222`). `A2uiReturnType` includes `'array'`.
- Schema validation of custom props: `processing/message-processor.js:236-251`
  (`componentApi.schema.safeParse(properties)`, throws `A2uiValidationError`); `binding()` is
  `z.union([schema, { path }])` (`shared/capabilities/binding.ts`), so a `{ call }` fails today.
- `FunctionCallSchema` shape: `schema/common-types.js:22-30`.
- Zero rendering: `a2ui-angular-src-v0_9.mjs:823` `this.props()['text']?.value() || ''`.
- Fixed selection rule: `surface-host-rules.ts:89-114` rejects a `reserve` context outside
  `/selectedConf/id`; `reserve-handler.ts` `remainingPathsOf` writes the two fixed homes.
- Data: `conferences.json` has 30 rows (angular 9, dotnet 7, web 6, cloud 4, ai 4; 9 countries);
  the next three Angular conferences cost 750/690/540 with 12/68/88 tickets left; Angular
  conferences lie 0 to about 670 km from Berlin (python over the JSON).
- Plan edit script: 16 replacements, each asserted to match exactly once, plus two `sed` line edits marking the stale request-4 notes as superseded; `git diff --stat`
  afterwards: 168 insertions, 27 deletions in `plan.md` only. The script lived in the session
  scratchpad and is gone from the tree (it was never in it).

### Open Issues

- Slider filter, call-shaped bindings, zero patch (→ Task 3.5).
- Badge texts, prompt form rules, scorer negative lists, fresh-session eval, matrix, fallback rule
  for badge 2 (→ Task 4).
- Spec §2/§3.1/§4/§7/§8b.1/§9/§12 on both sides, tour and architecture, register entries for
  reservations and Distance-0 (→ Task 6).

### Context for Next Task

- Task 3.5 and Task 3 are independent; Task 4 needs both. Nothing may be captured before Task 3.5
  lands: the announced schemas gain the call alternative and `withinKm` joins the maps vocabulary.
- The four badge texts are in `plan.md` Task 4 "Badges", verbatim; `eval/scenarios.ts` and the
  `PROMPTS` literal in `chat.page.spec.ts` must match them character for character.
- Gotcha for Task 3.5: define the call shape on the root `zod/v3` line; the catalog-context spec
  serializes every prop schema and will change for all custom props at once. After the
  `patch-package` lockfile change, restart any running dev server before trusting `ng test`
  (vite deps cache).
- Gotcha for Task 4: a comparison Card must not carry a reserve Button; the fixed-selection rule
  would reject it. The prompt paragraph says so, the `A-compare` requirement checks it.

### Git State

`git diff --stat`:

```
 docs/work/m3-reserve-maps-hosting/plan.md | 195 +++++++++++++++++++++++++-----
 1 file changed, 168 insertions(+), 27 deletions(-)
```

`git status --short` (repository files only; the sandbox additionally shows untracked
`.bashrc`, `.gitconfig`, `.mcp.json`, `.claude/…` and similar entries, which are its own /dev/null
masks over sensitive paths, not files of this repository):

```
 M docs/work/m3-reserve-maps-hosting/plan.md
?? docs/work/m3-reserve-maps-hosting/task-log/docs-demo-variation-decisions.md
```

`docs/demo-variation-assessment.md` was untracked and is deleted; it leaves no git trace.

### Sessions

- claude-code 63fe501c-cf61-44db-8407-3b53e18b8daa (2026-09-28) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/63fe501c-cf61-44db-8407-3b53e18b8daa.jsonl
