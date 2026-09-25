# Task 6: Timeline — Departure look with rail and board layouts

### Task
Restyle `TimelineComponent` in `mfe-charts` in the Departure look — token aliases with fallbacks,
surface frame, ring instead of amber for the selection, mono dates, a relative-time caption and a
month axis — and give it a vertical board layout that replaces the rail by container width, with a
host attribute through which Task 7 can force the board.

### Status
DONE. Independent review performed (Codex, quick mode, 2026-09-24): one LOW finding — the
straight-rail test located the selected board row by index, which the fixed fixture dates would
overtake in April 2027 — fixed in the spec; two blind spots — the live chat was not looked at
(deferred to the plan-end XC checks) and the shell suite was not independently re-run (re-run,
119 green). Charts (33), shell (119), `ng lint mfe-charts`, `sheriff verify` and Prettier are
green on the final code. The reviewer checked the standalone page and `/playground` at 390 and
1280 px under a German browser locale (layout switch, English labels, no browser errors); the user
looked at the standalone board with the first and the last row selected, which found the column
shift the subgrid rows now close. Still open by the plan's own rule: the user's look at
`/playground` at desktop and phone width.

### Files Modified
- `projects/mfe-charts/src/charts/timeline.component.ts` (modified) — geometry as constants in
  viewBox units (`RAIL`, `ABOVE`, `BELOW`; viewBox `0 0 832 220`), `items` → `scale` → `markers` /
  `months` / `caption` computeds, `styleUrl` instead of inline styles, `selectedId` private.
- `projects/mfe-charts/src/charts/timeline.component.html` (modified) — frame `div`; rail svg with
  axis, stems, ring + dot, label, date, caption, month axis with ticks, month and year labels;
  board `ol > li.cf-marker` rows with the same classes; two template-lint exemptions for the row click.
- `projects/mfe-charts/src/charts/timeline.component.css` (new) — private `--_*` aliases with the
  token values as fallbacks, host as query container, frame, rail and board styles (subgrid), the
  container query with its arithmetic, the `data-layout="board"` hook.
- `projects/mfe-charts/src/charts/timeline-dates.ts` (new) — `dateScale`, `monthMarks` (month
  starts plus the first-mark collision rule), `relativeDays`; no Angular import.
- `projects/mfe-charts/src/charts/timeline-dates.spec.ts` (new) — pure tests with fixed dates and
  a fixed `today`.
- `projects/mfe-charts/src/charts/timeline.component.spec.ts` (modified) — range arithmetic for
  the new viewBox; the flex test no longer leaves `display: flex` on the body; T6 tests (ring and
  hue, mono dates, month axis, caption in both layouts, container switch, forced attribute, board
  click, straight rail with a wide caption); review fix: the straight-rail test finds the selected
  row by class, not by index.
- `projects/mfe-charts/src/app/app.ts` (modified) — standalone page `main` 48rem → 56rem so the
  rail, not the board, shows at desktop.
- `docs/improvements.md` (modified) — promoted the multi-year month-label limit.

### Files Read (Context Only)
- `projects/mfe-charts/src/charts/timeline.schema.ts`, `days-until.fn.ts` (`daysUntil` reused),
  `projects/mfe-charts/src/app/app.html`, `projects/mfe-charts/src/styles.css`,
  `shared/theme/tokens.css` (token names and values for the fallbacks)
- `src/app/playground/playground.{ts,css}`, `src/app/playground/tool-playground.ts` (Berlin
  sample and bench widths), `src/theme/a2ui.css` (Row rules that could interact with the host)
- `sheriff.config.ts`, `eslint.config.js` (template accessibility preset), `angular.json`
  (ChromiumHeadless runner), `.prettierrc`
- `docs/design/departure/desktop-1280.png`, `phone-390.png`; task logs task-5, task-1 (bench),
  chore-shared-theme

### Key Decisions
- **viewBox `0 0 832 220` = the frame's desktop pixels.** Units equal pixels at the frame's
  width, so the geometry reads without conversion: rail x 64…768, axis y 99, label 12 units
  (13 / 700 selected), date 11, caption and month labels 10, month axis y 184 with 9-unit ticks,
  above group label/date/caption at 12/29/46 and stems from 54, below group at 132/149/166 and
  stems to 120. The fixed-viewBox invariant Task 7 rests on is untouched; only the numbers moved.
- **Host = query container, inner `.cf-frame` = the padded card.** A container cannot style
  itself by its own size query, so padding and border live one level down. Threshold from the
  arithmetic in the CSS comment: 12 × (W − 2·24 − 2·1) / 832 < 11 ⇔ W < 813 px. The frame's padding
  switches with the layout (24 24 18 → 14 14 6).
- **Both layouts in the DOM, CSS chooses.** Rail markers stay `g.cf-marker` (the shell, maps and
  charts specs count exactly that selector), board rows are `li.cf-marker` with `.cf-selected`,
  `.cf-date`, `.cf-label`, `.cf-caption`; the board dot is a CSS span. `:host([data-layout='board'])`
  forces the board — a CSS hook only; Task 7 adds the host binding when its rule exists.
- **Pure date module `timeline-dates.ts`.** `dateScale` maps times to x and is shared by markers
  and month marks; `monthMarks(scale, minGap)` returns x-positioned marks; `relativeDays` uses
  `Intl.RelativeTimeFormat('en', { numeric: 'auto' })` over `daysUntil`, so ±1 reads
  "tomorrow"/"yesterday" next to "in 3 days", "today", "5 days ago". Months come from a fixed
  twelve-entry table — a closed set, English whatever the browser says, no Intl involved.
- **Month-axis collision rule.** A month start closer than 28 units to the `from` mark replaces
  it and takes over the year. Found on 4201, where "AUG" sat on "SEP" (Aug 28 vs Sep 1, four days
  of 140). Consequence against the plan's example: a first marker on Sep 26 renders "OCT 26 · NOV …"
  instead of "SEP 26 · OCT …" — the frame's tick spacing is not to scale, the rail is. Rejected:
  keeping the from label and dropping the colliding month start (loses a month behind an
  unlabelled tick). 28 units is an estimate (three mono characters at 10 units ≈ 20), not a
  measured width.
- **Board columns via subgrid (user finding).** Each row was its own grid with a `max-content`
  date column; a selected row whose caption is one character wider than a date ("27 DAYS AGO",
  "IN 113 DAYS") widened only its own column and shifted dot and rail segment. The `ol` now owns
  the columns and the rows use `grid-template-columns: subgrid`. Test added (first row selected
  with "200 days ago", all dots at one x).
- **Board rows are pointer-only.** The template accessibility preset flags `li (click)` for
  keyboard events and focus (it does not inspect the SVG `g`); both rules are exempted in the
  template with the reason, consistent with the rail markers and D10.
- **Approved before implementation:** standalone `main` 56rem like the playground; no board
  span caption ("SEP 26 → MAR 27" from the phone frame); no 44-px rows (thirty rows would be
  1,700 px tall, the whole row is the target); no month-label thinning for multi-year spans.
- **Caption uppercase with letter-spacing in both layouts** (desktop frame), the DOM text stays
  lowercase English so tests and readers see "in 3 days".
- **Test mechanics.** Container queries resolve on layout; `getComputedStyle` on a hidden
  descendant does not force one, the host's `getBoundingClientRect()` does (`resize()` helper).
  The legacy flex test set `display: flex` on the body and never reset it, which made a 1000-px
  host shrink to the 414-px runner viewport in later tests — `try/finally` now restores it.
- Lines carry `vector-effect: non-scaling-stroke`, so the 1–2 px axes stay crisp at any width.

— session 2026-09-25
- **Accepted finding: Codex quick review (2026-09-24)** — the straight-rail test asserted the
  caption on `rows[0]`, mixing "today − 200 days" with fixed 2026 fixture dates; from 3 April 2027
  another item sorts first and the test fails with a correct component. Fixed by locating the row
  via `.cf-selected`; the test's intent (a caption wider than a date) does not depend on the
  position. Fixing the clock was rejected: the component has no injection point for `today`, and
  adding one for a test is more machinery than the finding warrants.
- **Blind spot "live chat not checked" → follow-up, not now.** The switch follows the host's own
  width, so any Card/Row nesting the model composes only moves where the switch lands (a Card with
  24 px padding leaves about 832 px at 1280, just above the threshold; a Row beside another
  component falls below). The look in the chat belongs to the plan-end XC checks and needs the
  agent with credits.
- **Blind spot "shell suite not independently confirmed" → closed** by re-running it on the final
  code (see Test Evidence).
- **Keep the CSS switch; no `@if` on a measured width (user, 2026-09-25).** Container queries have
  no JavaScript counterpart (nothing like `matchMedia`); an `@if` would need a `ResizeObserver`
  feeding a signal, a first render before its first callback, and the shell specs that count
  `g.cf-marker` in the 414-px runner would lose the svg. The container query is built in and the
  stabler implementation; `data-layout` is our own `data-*` convention through which Task 7's rule
  reaches the same CSS.

### Review Focus
- **Behavior claims:** (1) With the host at 813 px or wider the rail shows: the selected dot ringed
  in ink with the same blue as every other dot, mono dates, a month axis such as
  "OCT 26 · NOV · … · MAY" in English whatever the browser locale; narrower, the board with date,
  dot on a continuous rail and label per row. (2) The selected item carries an English relative-day
  caption in both layouts. (3) `data-layout="board"` on the host forces the board at any width.
- **Plan deviations:** month axis first label (plan: "SEP 26 · OCT · …" → a month start within
  28 units replaces the from mark → "OCT 26 · NOV · …", because the rail is to scale and the labels
  would overlap); board rows exempted from two template-lint rules (not in the plan; D10).
- **Assumptions / choices:** the switch threshold uses the regular 12-unit label, not the 13-unit
  selected one; the 28-unit month-label gap is an estimate; `numeric: 'auto'` for the caption.
- **Scope notes:** `app.ts` width only; the flex-test cleanup in the spec; one register line in
  `docs/improvements.md`. Nothing else outside the component.
- **Read next:** `timeline.component.css`, the `@container` block and the two rules after it
  (the arithmetic, the forced hook, the subgrid rows); `timeline-dates.ts` `monthMarks` (collision
  rule and year hand-over); `timeline.component.spec.ts` T6-AC-03 and the straight-rail test
  (the `resize()` helper, the board-row click).

### Test Evidence
- `npm run test:charts`: 5 files, 33 passed (`timeline.component.spec.ts` 12,
  `timeline-dates.spec.ts` 10, gauge, days-until, app). Final code.
- `npm run test:shell`: 19 files, 119 passed — the `g.cf-marker` counts in `chat.page.spec.ts` and
  `render-surface.tool.spec.ts` are unaffected by the board rows. Final code.
- `npx ng lint mfe-charts`: all files pass (after the two-rule exemption). `npx sheriff verify`:
  all projects validated. `prettier --check` on the changed files: clean; `gauge.component.html`
  carries a pre-existing warning, untouched.
- Browser probe, Playwright 1.62 from `node_modules` with the sandbox off (the chrome-devtools
  profile is held by another session; the dev servers 4200/4201/4202 and the agent on 3001 were
  already running outside the sandbox): 4201 and `/playground` at 1280 × 900 and 390 × 844.
  Host 896 px → svg `block`, board `none`, rendered label 12.2 px, frame padding 24/24/18; host
  358 px → svg `none`, board `grid`, padding 14/14/6. Fonts "Archivo Variable" (labels) and
  "IBM Plex Mono" (dates); dot fill `rgb(43, 95, 168)` selected and unselected alike. Months
  "SEP OCT NOV DEC JAN", years "26 27" on 4201 (after the collision rule; "AUG SEP …" before);
  "OCT NOV DEC JAN FEB MAR APR MAY" on the Berlin sample; captions "in 15 days" (4201) and
  "in 12 days" (Berlin). Board on 4201 at 390 with the first and the last row clicked: all dots at
  x = 115.6, captions "27 days ago" and "in 113 days". Screenshots looked at in the job scratchpad;
  nothing of the probe is in the tree (scripts lived in the sandbox tmp).
- Diagnosis probe: a throwaway `zz-debug.spec.ts` located the body `display: flex` leak; removed.
  The vitest failure-screenshot directory `projects/mfe-charts/src/charts/__screenshots__/` is
  gitignored and was left in place (deleting it was denied in the sandbox).
- User look (2026-09-24): the 4201 board with the first and the last release selected — the shifted
  rail segment, fixed by the subgrid rows and re-checked with the probe above.

— session 2026-09-25
- After the review fix (final code, 2026-09-24 19:08): `npm run test:charts` 5 files, 33 passed;
  `npm run test:shell` 19 files, 119 passed — the run that closes the reviewer's blind spot, since
  the earlier shell run predated the subgrid change; `npx ng lint mfe-charts` all files pass.
- Independent review (Codex, quick mode, 2026-09-24): 33 charts tests passed on its side; the
  standalone page and `/playground` at 390 and 1280 px under a German browser locale showed the
  layout switch, English month and caption labels and no browser errors.

### Acceptance Coverage
- T6-AC-01 — passed: `timeline.component.spec.ts` "T6-AC-01 rings the selected marker without a
  second hue and draws an English month axis" (ring only on the selected marker, identical
  computed dot fill, mono date font, months SEP OCT NOV, year 26); `timeline-dates.spec.ts`
  `monthMarks`. The English months rest on the fixed table; the reviewer confirmed them under a
  German browser locale on both pages.
- T6-AC-02 — passed: "T6-AC-02 captions the selected item with an English relative time in both
  layouts" ("in 3 days" twice); `relativeDays` cases with a fixed `today` in `timeline-dates.spec.ts`;
  the English caption confirmed by the reviewer under a German browser locale.
- T6-AC-03 — passed: "T6-AC-03 shows the board in a narrow container, the rail in a wide one, the
  board when forced" (600 px → board, 1000 px → rail, forced attribute; rows carry the classes; a
  row click writes the item) and "keeps the board rail straight when the selected caption is wider
  than the dates". The runner viewport stays at 414 px throughout, so the switch demonstrably
  follows the host, not the window.
- T6-AC-04 — partial: manual — Playwright on 4201 at 1280 and 390 (values above), the user's own
  screenshots of the 4201 board, and the reviewer's look at 4201 at 390 and 1280 px under a German
  locale; the standalone page's look has no automated check.
- XC-01, XC-02, XC-05, XC-06 — contributions only; evaluated at the end of the plan.

### Open Issues
- Item labels overlap at the right end of the Berlin sample at desktop and on the 30-item bench
  (→ Task 7).
- `gauge.component.html` is unformatted at HEAD (→ Task 8, which restyles the gauge).
- Promoted: month labels collide for spans beyond about two years (→ improvements register).
- The timeline inside model-composed Card/Row nesting in the live chat has not been looked at;
  the switch follows the host width, only where it lands can differ (→ XC-01/XC-02 at the plan end).

### Context for Next Task
- Forcing the board: `:host([data-layout='board'])` exists in `timeline.component.css`; Task 7
  adds a host binding such as `'[attr.data-layout]': 'layout()'` returning `'board'` or `null`.
- Geometry for the overlap rule: `RAIL` in `timeline.component.ts` (width 832, xMin 64, xMax 768),
  label 12 units regular / 13 selected in the CSS, middle-anchored, alternating `ABOVE`/`BELOW` by
  index. `markers()` already carries x in viewBox units; a per-character width factor for Archivo
  at 12 units is the missing input.
- `monthMarks` thins only the first mark; item labels are untouched by this task.
- Testing container-query-dependent styles: the runner viewport is 414 px wide — set the host
  width inline and force layout via the host's `getBoundingClientRect()` (see `resize()` in the
  spec); never leave `display: flex` on the body.
- Playwright from `node_modules` with the sandbox off drives 4200/4201 when the chrome-devtools
  profile is busy; element screenshots of `app-timeline` plus `getComputedStyle` reads were enough.
- Option, decided by Task 7 (user, 2026-09-25): split the rendering into `app-timeline-rail` and
  `app-timeline-board` children, both rendered, the parent keeping data prep, frame and the CSS
  switch (it would hide a child instead of `svg`/`ol`); the spec hooks keep working through the
  parent DOM, `labelOf()` would move into the marker as a `label` field. Worth it once the overlap
  rule and a label-width estimate push the parent past about 250 lines or pile up rail geometry
  the board does not need; today 145/80/209 lines (ts/html/css) do not justify it. The switch
  stays CSS either way — no `@if` on a measured width.

### Git State
`git diff --stat`:
```
 docs/improvements.md                               |   1 +
 projects/mfe-charts/src/app/app.ts                 |   3 +-
 .../mfe-charts/src/charts/timeline.component.html  |  99 ++++++++++---
 .../src/charts/timeline.component.spec.ts          | 159 +++++++++++++++++++--
 .../mfe-charts/src/charts/timeline.component.ts    | 131 +++++++++--------
 5 files changed, 294 insertions(+), 99 deletions(-)
```
`git status --short`:
```
 M docs/improvements.md
 M projects/mfe-charts/src/app/app.ts
 M projects/mfe-charts/src/charts/timeline.component.html
 M projects/mfe-charts/src/charts/timeline.component.spec.ts
 M projects/mfe-charts/src/charts/timeline.component.ts
?? docs/work/visual-language/task-log/task-6-timeline-rail-board.md
?? projects/mfe-charts/src/charts/timeline-dates.spec.ts
?? projects/mfe-charts/src/charts/timeline-dates.ts
?? projects/mfe-charts/src/charts/timeline.component.css
```

### Sessions
- claude-code 3cb0d15d-3980-4d4c-831e-d05937e15932 (2026-09-24) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/3cb0d15d-3980-4d4c-831e-d05937e15932.jsonl
- codex 01a0d3f0-33b4-7321-9c35-8a8e7c7e79ca (2026-09-25) — transcript: ~/.codex/sessions/2026/09/24/rollout-2026-09-24T17-02-09-01a0d3f0-33b4-7321-9c35-8a8e7c7e79ca.jsonl
