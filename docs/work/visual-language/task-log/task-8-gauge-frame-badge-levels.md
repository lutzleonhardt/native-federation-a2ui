# Task 8: Gauge — frame, badge, percentage and level colours

### Task
Restyle the `mfe-charts` Gauge in the Departure look: an own frame, the fill in one of three level
colours by share of the maximum, the `label` prop as a badge that turns amber only when scarce, and
a fixed-locale percentage beside it; props, schema and vocabulary text unchanged.

### Status
DONE. Codex quick review performed: one LOW finding (standalone summary always under the gauge)
fixed, both blind spots addressed — a beside-the-gauge test on the standalone page, and the user's
look recorded (live app at desktop and phone width, Nuremberg 96/360 amber, 2026-09-25). Charts
(46), shell (119), `ng lint mfe-charts`, `sheriff verify` and Prettier are green on the final code;
a Playwright probe of `/playground` and the standalone page `:4201` at 1280 and 390 px confirmed
levels, colours, sizes, the percentage and the row layout. Ready for `/commit 8`.

### Files Modified
- `projects/mfe-charts/src/charts/gauge.component.ts` (modified) — `styleUrl` instead of inline
  styles; host binding `[attr.data-level]`; a private `fraction` (value over max, clamped) feeds
  `dashArray`, `level` (`'high' | 'mid' | 'low'`, thresholds `MID_FROM` 0.3 / `HIGH_ABOVE` 0.65)
  and `percent` (`Intl.NumberFormat('en', { maximumFractionDigits: 1 })` + " %").
- `projects/mfe-charts/src/charts/gauge.component.html` (modified) — frame `div`; svg viewBox
  `0 0 100 58` with `.cf-track`/`.cf-fill` paths (stroke moved to CSS, `stroke-dasharray` stays an
  attribute); value and max as svg text; `.cf-reading` with the `.cf-badge` (optional label) and
  `.cf-percent`. Prettier-formatted (it was unformatted at HEAD).
- `projects/mfe-charts/src/charts/gauge.component.css` (new) — private `--_*` aliases with the
  token fallbacks; host `width: fit-content` with `min-width: fit-content` and `max-width: 100%`;
  frame (surface, 1 px line, radius md, padding 20 26, gap 28, wrap); svg 190 px; value `600 20px`
  mono, max `6.3px` mono muted; badge pill (sub fill, grey dot); nested state blocks for `mid`
  (yellow fill) and `low` (amber fill, attention badge and dot); phone media query at 640 px (host
  100 %, svg 160 px, padding 16 20, gap 20).
- `projects/mfe-charts/src/charts/gauge.component.spec.ts` (modified) — the label assertion moved
  from the svg to the badge; four T8 tests (levels with computed stroke, threshold boundaries,
  badge fill by level, percentage strings).
- `shared/theme/tokens.css` (modified) — `@import '@fontsource/ibm-plex-mono/600.css'` for the
  gauge numerals.
- `projects/mfe-charts/src/styles.css` (modified) — the shell's two Row rules for the standalone
  page: `a2ui-v09-row { flex-wrap: wrap }` and a content-sized Column inside a Row
  (`width: auto !important` over the Column host's inline `width: 100%`).
- `projects/mfe-charts/src/app/app.spec.ts` (modified) — "T8-AC-04: keeps the summary column
  beside the gauge at desktop width" (viewport 1280 via `@vitest/browser/context`; summary left of
  edge at or past the gauge's right edge, and narrower than the gauge).
- `src/app/a2ui/renderer-integration.spec.ts` (modified) — T4-AC-06 reads the label from
  `app-gauge` instead of its `svg`.
- `docs/improvements.md` (modified) — the promoted entry on the caption the model sets above the
  gauge, next to the related pairing entry.

### Files Read (Context Only)
- `projects/mfe-charts/src/charts/timeline.component.{ts,css}` (alias block, host binding,
  container-query pattern), `gauge.schema.ts`, `projects/mfe-charts/src/testing/bound-property.ts`,
  `projects/mfe-charts/src/app/{app.ts,app.html,app.spec.ts}`
- `shared/theme/tokens.css`, `src/theme/a2ui.css` (Row wrap and `min-width: fit-content` rules),
  `src/app/chat/capability-panel.component.css` (chip attention idiom),
  `src/app/agent/tools/message-widget.component.spec.ts` (computed-style probe pattern),
  `src/app/playground/playground.ts`, `src/app/domain/conferences.json` (remaining/capacity ratios)
- `docs/design/departure/{desktop-1280,phone-390,tokens-kit}.png` (orientation), `.prettierrc`,
  `angular.json` (ChromiumHeadless runner), `package.json`, `node_modules/@fontsource/ibm-plex-mono/`
  (available weights)
- Task logs task-7, task-6 (alias pattern, the unformatted gauge template), task-1 (the
  weight-400-only note), fix-pair-layout-rules (the duplicated caption); task-3/task-4 grepped for
  the attention idiom

### Key Decisions
- **One clamped fraction for arc, level and percentage.** `value / max` clamped to 0..1 (0 when
  `max` is 0) drives all three: `value > max` shows a full arc, green and "100 %", never "120 %";
  `max = 0` shows "0 %" and amber. Rejected: an unclamped percentage next to a clamped arc — two
  readings of one number.
- **Thresholds `> 0.65` high, `>= 0.3` mid, else low.** "Above 65 %" excludes 65, "from 30"
  includes 30; the boundary test pins 29/30/65/66.
- **The level is a host attribute (`app-gauge[data-level]`), not an attribute on the inner frame
  (user question).** Same contract shape as the timeline's `data-layout`: tests and DevTools read
  the state on the element a2ui renders, without knowing the inner DOM. Not about saving a
  container — `.cf-frame` exists either way.
- **State-grouped CSS nesting (user question).** `:host([data-level='low']) { .cf-fill … .cf-badge
  … &::before … }` gathers everything amber changes in one block, so the "amber means scarce" rule
  stands in one place. First selector nesting in a component stylesheet of this repo (component
  CSS nested only inside `@media`/`@container` so far); Angular 21's emulated encapsulation rewrote
  it correctly — proven by the computed-stroke tests and the live probe.
- **Numerals stay svg text; the sizes come from the svg width.** viewBox `0 0 100 58` (the arc
  alone; the label left the svg); the svg is fixed at 190 px on desktop and 160 px on the phone, so
  the 20-unit value renders at 38 and 32 px and the 6.3-unit max at 12 and 10 px — the plan's
  "32/38 px" from one font size. Keeps the `svg` and `path[stroke-dasharray]` hooks and the
  svg-text assertion of the standalone page's spec. Rejected: an HTML overlay with literal px
  sizes — two more test changes for no visible gain.
- **Plex Mono 600 imported in `tokens.css` (user, 2026-09-25).** The default import ships weight
  400 only (task-1 log); the frames' numerals are heavy, and 38 px at 400 read thin next to Archivo
  700. One import line in the theme file that the shell and every remote's standalone page load;
  fontsource's unicode-range means only the latin 600 file downloads. Open alternative: drop the
  line if 400 looks right on screen.
- **Phone switch by viewport media query at 640 px (the shell's breakpoint), not a container
  query.** A container query needs a `width: 100%` host, which in the `Row [gauge, summary]` would
  push the summary column under the gauge; `fit-content` keeps it beside.
- **`min-width: fit-content` on the host (probe finding).** On the standalone page the shell's
  `min-width: fit-content` rule for Row children does not load, and the a2ui Column's inline
  `width: 100%` squeezed the gauge to 272 px with the badge wrapped under the arc. `min-width:
  fit-content` resolves to the content width where the container has room and to the container
  width where it has not, so a narrow container still wraps the badge under the arc (`flex-wrap:
  wrap` on the frame) while a greedy sibling cannot squeeze it.
- **The standalone page's Row wraps (probe finding).** With the gauge full width at 390 px, the
  plain a2ui Row (no wrap without the shell's zone CSS) pushed the summary column out of view;
  `a2ui-v09-row { flex-wrap: wrap }` in the remote's standalone stylesheet mirrors the shell. The
  gauge's own CSS is not made responsible for its siblings.
- **Badge idiom follows the capability chip.** Pill, mono 11 px, a 6-px dot before the text: grey
  (`--cf-muted`) on the `--cf-sub` fill by default, `--cf-attention` on
  `--cf-attention-bg`/`--cf-attention-ink` below 30 % — the tokens kit's "neutral: grey dot, no
  signal colour". The frame's amber badge border was not copied; fill and text are what the plan
  names.
- **"2.4 %" with a space, `nowrap`.** The plan's rendering; `Intl`'s `style: 'percent'` would
  give "2.4%". The reading column is `white-space: nowrap`, so the space never breaks.
- **aria-label unchanged** (`Tickets left: 12 of 500` on the svg); badge and percentage are
  visible text beside it. ARIA work is outside the plan's scope.

— session 2026-09-25 (after Codex quick review)
- **Fixed finding: Codex — the standalone Row wrap alone dropped the summary under the gauge at
  every width** (row 248 px instead of 152 at 1280, the Column's inline `width: 100%` claiming the
  row). The shell pairs the wrap with a content-sized Column; the standalone stylesheet now carries
  both rules. Rejected: limiting the wrap to the phone breakpoint — the desktop state would rest on
  squeezing a 100 %-wide Column, as before Task 8, and the two pages would lay out the same Row by
  different rules.
- **The standalone test sets its own viewport.** The runner's default viewport is 414 px wide,
  where the gauge's phone rule makes it full width and the summary wraps by design;
  `page.viewport(1280, 800)` from `@vitest/browser/context` puts the test at desktop width. The
  second assertion (summary narrower than the gauge) is what tells "both rules" from "no
  stylesheet at all": without any rule the Row does not wrap and the squeezed Column still sits
  beside the gauge, row-wide.

### Review Focus
Codex quick review done (one LOW finding, fixed; blind spots addressed). Map for a second look:
- **Behavior claims:** (1) 80/100 renders green, 50/100 yellow, 20/100 amber, the stroke resolved
  through the token chain to the fallback; 30 and 65 are yellow, 66 green. (2) The badge is
  amber-tinted with attention ink only below 30 %, `--cf-sub` at 30 and above. (3) 12/500 reads
  "2.4 %", 500/500 "100 %", 1/3 "33.3 %", max 0 "0 %", in `en` whatever the browser language.
  (4) On the standalone page the summary column stands beside the gauge at 1280 px and below it
  at 390 px.
- **Plan deviations:** Key Locations named the gauge files only → `tokens.css` (one font import,
  foreseen by the task-1 log), the remote's `styles.css` and `app.spec.ts` (the shell's two Row
  rules for the standalone page, and the test that pins them) and the shell's
  `renderer-integration.spec.ts` (the assertion followed the label out of the svg) were touched →
  one to nineteen lines each, reasons in Key Decisions. "Arc about 190 × 110" → svg 190 × 110
  on desktop, 160 × 93 on the phone → the phone frame shows a smaller arc, and one svg width gives
  both numeral sizes.
- **Assumptions / choices:** clamped percentage; the boundary sides of the thresholds; weight 600;
  the 640-px viewport breakpoint; the grey dot in the neutral badge; `min-width: fit-content` on
  the host.
- **Scope notes:** `gauge.component.html` is now Prettier-formatted (unformatted at HEAD, noted in
  task 6). The standalone page's stylesheet gained the shell's two Row rules and its spec a layout
  test. Nothing else outside the component.
- **Read next:** `gauge.component.css` `:host` (the `width`/`min-width`/`max-width` triple and its
  comment) and the two nested state blocks; `gauge.component.ts` `fraction`/`level`/`percent` (the
  clamping and the threshold sides); `projects/mfe-charts/src/styles.css` next to
  `src/theme/a2ui.css` lines 72–86 (the duplicated Row rules, and which shell rule was left out).

### Test Evidence
- `npm run test:charts`: 6 files, 45 passed (gauge 7: T4-AC-01, real size, badge + arc, four T8
  tests; timeline 16, labels 4, dates 10, days-until, app). Final code.
- `npm run test:shell`: 19 files, 119 passed after the `renderer-integration.spec.ts` assertion
  moved to `app-gauge` (it failed once on the svg: `expected '12/ 100' to contain 'Tickets left'`).
  Run before the host `min-width` and the standalone Row rule; neither changes a DOM the shell
  suite reads.
- `npx ng lint mfe-charts`: all files pass. `npx sheriff verify`: all projects validated.
  `prettier --check` on the seven touched files: clean.
- Playwright 1.62 from `node_modules` with the sandbox off (dev servers 4200/4201/4202/3001 were
  running outside it); script `gauge-probe.mjs` and screenshots in the job scratchpad
  (`~/.claude/jobs/78a2094e/tmp/`), nothing in the tree:
  - `/playground` 1280 × 900: host 388 × 152, svg 190 × 110, value `20px` viewBox units at weight
    600 in IBM Plex Mono (`document.fonts.check('600 38px "IBM Plex Mono"')` true); Munich 12/500
    → `data-level="low"`, fill `rgb(225, 115, 11)`, badge "Tickets left" on `rgb(253, 240, 226)`
    in `rgb(138, 70, 7)`, "2.4 %". Dispatched click on the third marker (Hamburg 88/260) → `mid`,
    fill `rgb(226, 177, 0)`, badge `rgb(227, 233, 238)`, "33.8 %".
  - `/playground` 390 × 900: host 358 (the full column), svg 160 × 93, same colours and text.
  - `:4201` 1280: release 2.1 21/30 → `high`, fill `rgb(47, 143, 91)`, badge "Issues closed"
    neutral, "70 %"; host 395 × 152 after the `min-width` (272 × 226 with the badge wrapped under
    the arc before it). 390: host 358 × 127 after the Row-wrap rule, the summary column below the
    gauge (pushed past the right edge before it).
  - No console errors on any page.
- User look (2026-09-25): two screenshots of the live app in the conversation — the detail card
  for "dotnet-lantern Nuremberg" at desktop width (gauge beside the facts, 96/360 amber, badge
  "Tickets left" in the attention style, "26.7 %") and at phone width (gauge full width below the
  facts, arc 160 px). Accepted.

— session 2026-09-25 (after Codex quick review)
- Codex quick review on the working tree: LOW "desktop layout of the standalone page wraps
  needlessly" (`styles.css:14`, row height 248 instead of 152 at 1280) — reproduced with a
  Playwright probe (`row-probe.mjs`, job scratchpad): the summary Column computed 896 px wide.
- After the Column rule: `npm run test:charts` 6 files, 46 passed (the new `app.spec.ts` test
  included). `npx ng lint mfe-charts`: all files pass. `prettier --check` on `styles.css` and
  `app.spec.ts`: clean. Final code.
- Mutation check: with the Column rule removed the new test fails — `expected 192 to be greater
  than or equal to 587` (the summary at the row's left edge, one line down); the file was restored
  from a copy, `git diff` on it back to the eleven added lines. Nothing of the probe in the tree.
- Probe after the rule: `:4201` at 1280 — Row 896 × 152, gauge 395 px, summary Column 84 px;
  `/playground` at 1280 unchanged (152, 388, 103).
- The shell suite was not re-run after the review fixes: both touch `projects/mfe-charts` files
  the shell does not load (its standalone stylesheet and spec).

### Acceptance Coverage
- T8-AC-01 — passed: `gauge.component.spec.ts` "T8-AC-01 colours the fill green, yellow or amber
  by the share of the maximum" (attribute and computed `stroke` at 80/50/20 %) and "T8-AC-01 yellow
  starts at 30 % and includes 65 %"; live: Munich amber, Hamburg yellow, release 2.1 green.
- T8-AC-02 — passed: "T8-AC-02 the badge takes the attention style only below 30 %" (computed
  background at 20/30/80 %); the live badge colours above.
- T8-AC-03 — passed: "T8-AC-03 states the percentage in English with one decimal at most" (2.4 %,
  100 %, 33.3 %, 0 %; no domain wording in the template). Limit: the browser language cannot be
  switched in the test; the guarantee is the fixed `'en'` locale of `PERCENT`.
- T8-AC-04 — passed: `app.spec.ts` renders the standalone page with the gauge and "T8-AC-04:
  keeps the summary column beside the gauge at desktop width" pins the Row rules; the Departure
  look on `:4201` at 1280 and 390 px confirmed by the Playwright probe and screenshots; the user's
  look at both widths recorded (live app, 2026-09-25).
- XC-01, XC-02, XC-05, XC-06 — contributed: tokens via private aliases with fallbacks, a bare
  colour only as fallback, the `path[stroke-dasharray]` and `svg` hooks kept, non-zero rendered
  size tested.

### Open Issues
- Promoted: the model's caption "Tickets left" above the gauge duplicates the badge inside it —
  the `label` prop is the badge by plan, the caption is the prompt's pair idiom (→ improvements
  register).

### Context for Next Task
- The gauge's contract for the docs: `app-gauge[data-level="high" | "mid" | "low"]` by clamped
  `value / max` (`> 0.65` / `>= 0.3` / below); amber (attention) is the `low` level only, on fill,
  badge and dot; yellow is fill only. The percentage is
  `Intl.NumberFormat('en', { maximumFractionDigits: 1 })` + " %".
- Sizes: svg 190 px (phone 160 px, viewport `<= 640px`), viewBox `0 0 100 58`; numeral 20 units =
  38/32 px, max 6.3 units = 12/10 px. Frame padding 20 26 (phone 16 20), gap 28 (20).
- Theme: `tokens.css` imports Plex Mono 400 and 600; the gauge is 600's only consumer. The remote's
  standalone `styles.css` duplicates two of the shell's three Row rules from `src/theme/a2ui.css`
  (wrap, content-sized Column; not the `flex-basis: 100%` for a Column holding a non-Text) — Task
  9's "theme across the federation boundary" can name this duplication and its limit.
- Playground: the Berlin sample (request 1) shows only `low` and `mid`; `high` is on `:4201`
  (48/48, 21/30). Request 1's Stuttgart (66.8 %) lies outside the 180-day window.
- Spec follow-ups for Task 9: the frames' "Restkarten"/"des Kontingents" wording is not built, the
  percentage stands alone, the badge border is not amber.

### Git State
`git diff --stat`:
```
 docs/improvements.md                               |   1 +
 projects/mfe-charts/src/app/app.spec.ts            |  19 ++++
 .../mfe-charts/src/charts/gauge.component.html     |  30 +++---
 .../mfe-charts/src/charts/gauge.component.spec.ts  | 102 ++++++++++++++++++++-
 projects/mfe-charts/src/charts/gauge.component.ts  |  54 +++++------
 projects/mfe-charts/src/styles.css                 |  11 +++
 shared/theme/tokens.css                            |   1 +
 src/app/a2ui/renderer-integration.spec.ts          |   2 +-
 8 files changed, 172 insertions(+), 48 deletions(-)
```
`git status --short`:
```
 M docs/improvements.md
 M projects/mfe-charts/src/app/app.spec.ts
 M projects/mfe-charts/src/charts/gauge.component.html
 M projects/mfe-charts/src/charts/gauge.component.spec.ts
 M projects/mfe-charts/src/charts/gauge.component.ts
 M projects/mfe-charts/src/styles.css
 M shared/theme/tokens.css
 M src/app/a2ui/renderer-integration.spec.ts
?? docs/work/visual-language/task-log/task-8-gauge-frame-badge-levels.md
?? projects/mfe-charts/src/charts/gauge.component.css
```

### Sessions
- claude-code 97eae42a-467b-4f49-a2be-3958fa5285e4 (2026-09-25) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/97eae42a-467b-4f49-a2be-3958fa5285e4.jsonl
