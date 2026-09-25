# Task 7: Timeline — the label-overlap rule

### Task
Add the label-overlap rule to the `mfe-charts` Timeline: a pure label-fit estimate in viewBox units
that forces the board layout through the Task-6 `data-layout` hook when one side of the rail cannot
hold its label blocks, independent of the width rule in the CSS.

### Status
DONE. Independent review pending (not performed). Charts (41), shell (119), `ng lint` for charts and
shell, `sheriff verify` and Prettier are green on the final code; a Playwright probe of `/playground`
at 1280 and 390 px confirmed the three samples and the resize invariance. The user looked at the
request-1 rail at desktop width (screenshot in the conversation) and asked about the width switch;
the look at phone width, required by the plan's own rule, is not recorded. Added after the first
wrap-up, on the user's reading of the desktop rail: the month-axis year is four digits.

### Files Modified
- `projects/mfe-charts/src/charts/timeline-labels.ts` (new) — `LabelBlock`, `LabelMetrics`,
  `labelsFit(row, metrics)`: blocks sorted by x, neighbours must keep `minGap` between their
  estimated edges (0.6 em per character, the wider of label and date); no Angular import.
- `projects/mfe-charts/src/charts/timeline-labels.spec.ts` (new) — empty and single rows, the gap
  boundary with the date as the wider part, the label as the wider part, unsorted input.
- `projects/mfe-charts/src/charts/timeline.component.ts` (modified) — the marker carries `label`,
  `date` and `side`; `LABELS` metrics next to `RAIL`; `layout` computed groups the markers by side
  and asks `labelsFit`; host binding `[attr.data-layout]`; `labelOf` became a module-private
  function; the `monthLabelGap` comment now covers the four-digit year.
- `projects/mfe-charts/src/charts/timeline-dates.ts` (modified) — the month-axis year is four
  digits (`MonthMark.year`), no longer `slice(-2)`.
- `projects/mfe-charts/src/charts/timeline-dates.spec.ts` (modified) — year expectations
  `'2026'`/`'2027'`.
- `projects/mfe-charts/src/charts/timeline.component.html` (modified) — rail and board read
  `marker.label` and `marker.date`.
- `projects/mfe-charts/src/charts/timeline.component.spec.ts` (modified) — `REQUEST_1` fixture
  (the seven Angular conferences with fixed dates), `itemsEvery` helper, four T7 tests; T6-AC-01
  expects the year `'2026'`.
- `src/app/playground/playground.ts` (modified) — the Berlin sample is now the set of demo
  request 1 (`topic: 'angular', withinDays: 180`); `isoFromToday` helper; the week sample carries
  a quarter as `range`.
- `docs/improvements.md` (modified) — the collision entry split into a ticked Timeline line and an
  open Map line; the edge-clipping limit promoted.

### Files Read (Context Only)
- `projects/mfe-charts/src/charts/timeline-dates.ts`, `timeline.component.css` (font sizes and the
  container query), `timeline.schema.ts` (`range` is a literal or binding),
  `projects/mfe-charts/src/testing/bound-property.ts`
- `src/app/domain/conferences.json`, `conference.ts`, `find-conferences.ts`,
  `find-conferences.schema.ts`, `src/app/chat/example-prompts.ts`, `eval/scenarios.ts` (what
  request 1 is and which conferences it yields)
- `.prettierrc`, `eslint.config.js` (`prefer-host-metadata-property`), `sheriff.config.ts`,
  `package.json`
- Task logs task-6 (the hook, the geometry, the split option), docs-visual-language-spec (the
  0.6 em hand check), task-1 (the bench samples); `docs/specs/visual-language.md` grepped for the
  rule's wording only.

### Key Decisions
- **One row per call.** `labelsFit` checks one side of the rail; the component builds the two rows
  from the marker's `side`. The alternation is the component's knowledge, the function only knows
  neighbours in x order. Rejected: passing all markers and letting the function assume "every
  second block shares a side" — it would tie the module to the component's alternation rule.
- **Sizes and gap.** Label 12 units for every label — the plan's 0.6 em at the regular size covers
  the bold 13-unit selected label; date 11 units, so a ten-character date is 66 units wide and the
  wider part of any block whose label is shorter than ten characters. Minimum gap 6 units, half a
  label character (user, 2026-09-25). Both faces share the 0.6 factor, so one constant.
- **The marker carries `label`, `date`, `side`.** Template and rule read the same fields; `labelOf`
  is module-private. The rail/board child split from the Task-6 option was not taken: the component
  is 170 lines and the rule adds no rail geometry the board does not need.
- **Playground samples changed (user, 2026-09-25).** The 300-km Berlin sample has eight items,
  and Hanover and Dresden overlap by 66 units at the right end — the rule boards it, correctly.
  It is now the request-1 set, so the bench shows the rail with real names. The week sample
  without a range spreads four items 2 days apart over the whole rail (469 units apart) and fits;
  a quarter as `range` squeezes them to the board and makes the range case visible on the bench.
- **AC-04 wording.** "A range narrower than their span" spreads the items apart and pushes them off
  the rail; it is a wider range that squeezes. Implemented and tested with the wider range.
- **Edges are not part of the rule.** A block that reaches past the viewBox is clipped, not
  overlapping. At the 0.6 em estimate, "ng-lantern Leipzig" (18 characters) is 0.8 units past the
  64-unit margin, so an edge check would board request 1 although the real font fits with room.
  Promoted to the register instead.
- **Why browser font settings cannot break the estimate (user question).** The rail's `12px` is a
  viewBox unit: labels, dates and rail scale together with the svg, zoom and display scaling
  included; the browser's "large fonts" preference changes `medium`/`rem`, not absolute `px`. Not
  verified: Chrome's accessibility "minimum font size", which clamps computed sizes and may reach
  SVG text; a font fallback (Archivo not loaded) is covered by the conservative factor.
- **The two conditions stay independent (user question on the switch at about 860 px).** The
  container query at 813 px is Task 6's legibility derivation (a 12-unit label under 11 px), and the
  880-px chat column sits close to it; `data-layout` comes from the labels only. The one knob for
  more room in the chat is that query, at the cost of labels under 11 px.
- **Offered, not added:** an explicit test that two close items on different sides keep the rail
  while a third on the same side boards it; today the trait is implicit in T7-AC-03 (Munich and
  Berlin are 38 units apart on different sides, a collision on one row).

— session 2026-09-25
- **Four-digit year on the month axis (user, 2026-09-25).** Reading the desktop rail, the user took
  "OCT 26" for 26 October: a two-digit year under a month label reads as a day of month. The
  frame's "SEP 26" is orientation, not a rule. "2026" in mono at 10 units with letter-spacing is
  about 26 wide, under the 28-unit `monthLabelGap` of the collision rule. Rejected: "’26" — still
  a two-digit number under a month. Spec §8.1's example ("SEP 26 · OCT · … · MAR 27") is now
  stale → Task 9 spec follow-ups.
- **Rail/board child split: not now (user question, 2026-09-25).** The Task-6 trigger (about 250
  lines, or rail geometry the board does not need) is not reached: 168/80/212 lines, the rule
  added 20 lines of decision and no geometry. A split costs six files, the `--_*` alias block
  twice, inputs and outputs for markers, caption and pick, and a moved CSS switch; Tasks 8 and 9
  do not touch the timeline. Revisit with the first task that gives one layout its own behaviour.
- **`labelOf`'s `label ?? name ?? id` is a domain leak (user finding, 2026-09-25) → register, not
  now.** The shell mounts `/filteredConfs` with the conference objects as they are; both remotes
  adapt to `name`. The fix belongs at the mount (`label: conf.name`) and crosses the federation
  boundary and the map, so it is a separate fix after this commit; the `?? id` guard stays for
  path-bound data that bypasses validation.

### Review Focus
- **Behavior claims:** (1) Thirty items 12 days apart show the board at any host width, with all
  thirty labels as rows. (2) The seven Angular conferences of request 1 show the rail at a host of
  813 px or wider, the selected one bold. (3) The same items flip to the board when a `range`
  wider than their span squeezes them; resizing the host never changes the attribute.
- **Plan deviations:** AC-04 "range narrower than their span" → tested with a wider range → a
  narrower range spreads the items. Quick check "the Berlin sample the rail" → the sample is now
  request 1's set → the 300-km set has a real collision at the right end. "Four within one week do
  not [fit]" → the week sample got a quarter range → without a range the scale spreads them and
  they fit. Register entry "ticked half" → split into two lines. Outside the task block: the
  month-axis year (Task 6, frame "SEP 26") → four digits → the user read the two-digit year as a
  day.
- **Assumptions / choices:** minimum gap 6 units; label size 12 for every label including the
  selected one; edges unchecked; `withinDays: 180` as the "next few months" of request 1.
- **Scope notes:** `playground.ts` gained the `isoFromToday` helper; the marker shape changed
  (`label`, `date`, `side`), which touched the template; two promoted register lines; the
  four-digit year in `timeline-dates.ts` with its two spec updates. Nothing else outside the
  component.
- **Read next:** `timeline-labels.ts` (`halfWidth` and the gap arithmetic); `timeline.component.ts`
  `layout` (the grouping by side and the `null`/`'board'` contract); `timeline.component.spec.ts`
  "T7-AC-02 T7-AC-04" (the range is set after the first render through the fake bound property's
  signal).

### Test Evidence
- `npm run test:charts`: 6 files, 41 passed (`timeline.component.spec.ts` 16,
  `timeline-labels.spec.ts` 4, `timeline-dates.spec.ts` 10, gauge, days-until, app). Final code.
- `npm run test:shell`: 19 files, 119 passed (the playground change). Final code.
- `npx ng lint mfe-charts`, `npx ng lint shell`: all files pass. `npx sheriff verify`: all projects
  validated. `prettier --check` on the changed files: clean; `docs/improvements.md` warns at HEAD
  already (emphasis style in untouched lines) and was left alone.
- Estimate by hand (node one-liner over `conferences.json`, not in the tree): the 300-km Berlin set
  is eight items, same-side gaps at 12 units — Berlin/Hamburg 17.8, Hanover/Dresden −66.1 (a
  collision); the request-1 set — narrowest same-side gap Vienna/Copenhagen 63.8, Munich/Berlin
  38 units apart but on different sides.
- Playwright 1.62 from `node_modules` with the sandbox off (the dev servers 4200/4201/4202 were
  running outside it): `/playground` at 1280 × 900 — three hosts at 896 px; request-1 timeline
  `data-layout` absent, svg `block`, 7 markers with the seven names; year sample `board`, 30 rows;
  week sample `board`, 4 rows. At 390 × 844 the attributes are unchanged and all three show the
  board through the width rule. No console errors. The element screenshot of the request-1 rail:
  no touching labels, Leipzig inside the frame. Script and screenshots live in the job scratchpad
  (`~/.claude/jobs/78a2094e/tmp/`), nothing in the tree.
- User look (2026-09-25): the request-1 rail at desktop width, screenshot in the conversation.

— session 2026-09-25
- After the four-digit year (final code): `npm run test:charts` 6 files, 41 passed;
  `npx ng lint mfe-charts` all files pass; `prettier --check` on the four touched charts files
  clean. The shell suite was not re-run: the change is inside `mfe-charts` and the shell specs
  count markers, not month labels.
- Playwright on `/playground` at 1280 px after the change: the request-1 axis reads months
  "OCT NOV DEC JAN FEB MAR" with years "2026 2027"; the two board samples unchanged. Script in the
  job scratchpad, nothing in the tree.

### Acceptance Coverage
- T7-AC-01 — passed: `timeline.component.spec.ts` "T7-AC-01 forces the board for thirty items whose
  label blocks cannot share the rail" (attribute, svg hidden, board shown, thirty row labels);
  `timeline-labels.spec.ts` gap boundaries; the year sample on `/playground` via Playwright.
- T7-AC-02 — passed: "T7-AC-02 T7-AC-04 four items of one week fit their own rail and are boarded
  when a quarter squeezes them". Both states satisfy the AC's text (readable, no overlap); the
  plan's expectation that four in a week do not fit holds only under a range.
- T7-AC-03 — passed: "T7-AC-03 draws the rail for the seven conferences of request 1" (fixed dates
  with request 1's offsets, Copenhagen selected); the request-1 sample on `/playground` with the
  real fonts via Playwright and the user's look.
- T7-AC-04 — passed: the AC-02 test's second half — the same four items flip to the board once a
  quarter range is set; with the wording clarification recorded in Key Decisions.
- T7-AC-05 — passed: "T7-AC-05 keeps the overlap decision when the host is resized" (dense and
  sparse hosts at 1000/600/1000 px, the sparse board at 600 px by the width rule alone); `labelsFit`
  has no width input; Playwright at 390 px.

### Open Issues
- Promoted: a label longer than about 17 characters on the first or last marker can be clipped by
  the viewBox edge (→ improvements register).
- Promoted: `labelOf`'s `label ?? name ?? id` is a conference-domain leak in the charts and maps
  remotes; the shell should mount `/filteredConfs` with a `label` (→ improvements register).
- Spec §8.1 still shows two-digit years in its month-axis example ("SEP 26 · … · MAR 27"), the
  rail now renders "2026" (→ Task 9, spec follow-ups).

### Context for Next Task
- The layout contract: `data-layout="board"` is now set by the component (`layout()` returns
  `'board'` or `null`); the CSS hook from Task 6 is unchanged. The T6-AC-03 test still sets the
  attribute by hand — that works because Angular writes the binding only when its value changes.
- `LABELS` in `timeline.component.ts` mirrors the font sizes in `timeline.component.css` (12 label,
  11 date); change both or the estimate drifts.
- The bench on `/playground`: the first timeline is request 1's seven Angular conferences (rail at
  desktop), the year sample thirty items (board), the week sample four items on a quarter range
  (board). The 300-km Berlin set is gone from the playground.
- For Task 9's docs: two conditions, each sufficient — the width rule (container query, 813 px,
  legibility) and the label rule (estimate in viewBox units, items and range only). The rule's
  constants: 0.6 em per character, label 12, date 11, gap 6.
- The Berlin/request-1 distinction matters for any future "the Berlin sample" wording: request 1 is
  `topic: 'angular', withinDays: 180` from Berlin, not `nearKm: 300`.
- Month-axis years are four digits (`MonthMark.year` = `'2026'`); the spec's §8.1 example and any
  doc that quotes "SEP 26" need the new form (Task 9).

### Git State
`git diff --stat`:
```
 docs/improvements.md                               |  5 +-
 .../mfe-charts/src/charts/timeline-dates.spec.ts   | 10 +-
 .../mfe-charts/src/charts/timeline-dates.ts        |  4 +-
 .../mfe-charts/src/charts/timeline.component.html  |  8 +-
 .../src/charts/timeline.component.spec.ts          | 92 ++++++++++++++++++++++-
 .../mfe-charts/src/charts/timeline.component.ts    | 37 +++++++--
 src/app/playground/playground.ts                   | 31 +++++---
 7 files changed, 156 insertions(+), 31 deletions(-)
```
`git status --short`:
```
 M docs/improvements.md
 M projects/mfe-charts/src/charts/timeline-dates.spec.ts
 M projects/mfe-charts/src/charts/timeline-dates.ts
 M projects/mfe-charts/src/charts/timeline.component.html
 M projects/mfe-charts/src/charts/timeline.component.spec.ts
 M projects/mfe-charts/src/charts/timeline.component.ts
 M src/app/playground/playground.ts
?? docs/work/visual-language/task-log/task-7-label-overlap-rule.md
?? projects/mfe-charts/src/charts/timeline-labels.spec.ts
?? projects/mfe-charts/src/charts/timeline-labels.ts
```

### Sessions
- claude-code 169f18eb-7093-4ace-8914-d4ad55afaabf (2026-09-25) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/169f18eb-7093-4ace-8914-d4ad55afaabf.jsonl
