# Task 2: Header band, location picker, title and favicon

### Task
Replace the app-root `<h1>` and the flat chat header with the two-band Departure header — ink
band with title, eyebrow, location picker and the capability slot over a surface band with the
prompts — as its own `ChatHeaderComponent` composed by `ChatPage` (extracted late in the task on the
user's request; the plan said "inside `ChatPage`"), and make "Conference Finder" plus the Native
Federation mark the tab's title and icon.

### Status
DONE. Independent review performed (Codex, quick mode, 2026-09-22): one MEDIUM finding fixed
(the phone hid the select's native label from the accessibility tree), one LOW accepted as a
documented limit (overflow below about 360 px), two blind spots recorded below. Verified by lint,
the shell unit tests (two new) and a browser check at 1280, 760 and 390 px on the running dev
server, re-run after the fix. The user checked the desktop and the phone look on 2026-09-22 ("sieht
gut aus"; the capability slot is Task 3's) — the plan's verification rule is satisfied for this
task. The three dev servers and the agent were left running. No `ng build` this session (the
servers were up; see Task 1's cache incident). CodeScene gate (`/cs`, Codex session) passed; its
one introduced finding in the picker test was fixed there. After both gates the user asked for two
structural changes, done in this session: the header extracted into `ChatHeaderComponent`, and the
inline styles of the page and the picker moved to `.css` files (plan preamble amended). Lint, the
117 tests and the browser probes at 1280 and 390 px were re-run on that state. The CodeScene gate
has not seen the three new component files; re-running `/cs` before `/commit 2` is the user's call.

### Files Modified
- `src/app/chat/chat-header.component.ts` (new) — the chrome as a presentational component:
  `prompts` and `running` as required signal inputs, `send` as output; imports the picker and the
  panel.
- `src/app/chat/chat-header.component.html` (new) — the header as three parts in phone order:
  `.cf-band` (brand with `<h1>` and eyebrow, `<app-location-picker />`, `.cf-sep`), `.cf-prompts`
  (buttons emit `send`), `<app-capability-panel />`.
- `src/app/chat/chat-header.component.css` (new) — the header grid (`'band caps' / 'prompts
  prompts'`, phone: three rows), band, brand, eyebrow space rule, separator, transitional panel
  clipping, prompt buttons with their disabled state, the phone rules under `max-width: 640px`.
- `src/app/chat/chat.page.html` (modified) — composes `<app-chat-header>` (prompts, running,
  send) and `<copilot-chat>`.
- `src/app/chat/chat.page.ts` (modified) — imports the header component instead of picker and
  panel; `styleUrl` instead of the inline block; the store wiring is all that is left (51 lines).
- `src/app/chat/chat.page.css` (new) — the page's flex column and the `copilot-chat` fill rule.
- `src/app/chat/location-picker.component.css` (new) — the picker styles, moved verbatim.
- `docs/work/visual-language/plan.md` (modified) — preamble: "component styles stay inline"
  amended to sibling `.css` files via `styleUrl`, dated and attributed.
- `src/app/chat/location-picker.component.html` (modified) — the label is its own element in
  both states; the city is a `.cf-city` span; the select sits inside the label.
- `src/app/chat/location-picker.component.ts` (modified) — `styleUrl` to the new `.css`; the
  styles there: band colours for label, city, select and Change (32 px, `--cf-ink` fill,
  `--cf-ink-line` border); at phone width the label is visually hidden (1 × 1 px, clipped) so it
  stays the select's native name.
- `src/app/app.ts`, `src/app/app.html` (modified) — the `title` signal and the `<h1>` are gone;
  the root renders the outlet only.
- `src/styles.css` (modified) — the `app-root > h1` rule removed.
- `src/index.html` (modified) — `<title>Conference Finder</title>`; the icon link points at
  `nf-mark.png` (`image/png`).
- `public/nf-mark.png` (new) — the Native Federation mark, 64 × 64 px, 8 KB, transparent canvas
  (`magick … -resize 64x64 -background none -gravity center -extent 64x64`).
- `public/favicon.ico` (deleted) — replaced by the PNG.
- `src/app/app.spec.ts` (modified) — T1-AC-01 now asserts the `router-outlet` instead of the
  removed `<h1>` text.
- `src/app/chat/chat.page.spec.ts` (modified) — two tests added: the band's `h1` text, and the
  picker's three states (select → city + Change → select preselected → city again), asserting in
  both select states that the wrapping `<label>` carries "Your location"; the Change click is a
  plain call on a typed element (CodeScene gate, Codex).
- `docs/improvements.md` (modified) — two entries promoted: the Prettier drift of two files, and
  the header's overflow below about 360 px.

### Files Read (Context Only)
- `docs/work/visual-language/plan.md` (preamble, Task 2), `task-log/task-1-tokens-fonts-bench.md`;
  M2 logs by grep only (`task-4-charts-remote`, `task-6-maps-remote-boundaries`,
  `task-9-english-demo`, `task-5-capability-panel`)
- `docs/design/departure/desktop-1280.png`, `phone-390.png`, `nf-logo.png` (355 × 384 source)
- `src/app/chat/capability-panel.component.{ts,html}`, `src/app/domain/location.store.ts`,
  `src/app/domain/cities.ts`, `src/app/chat/example-prompts.ts`, `src/app/app.routes.ts`,
  `angular.json` (assets), `.prettierrc`

### Key Decisions
- **The header is a grid of three named areas; the DOM is in phone order.** Desktop:
  `grid-template-columns: 1fr auto` with `'band caps' / 'prompts prompts'`, phone: one column
  with `'band' / 'prompts' / 'caps'`. The header paints the ink, the prompt row paints surface
  over it, the phone strip paints `--cf-sub` — no wrapper needs to move between widths.
  Considered and rejected: a flex band containing the panel plus `display: contents` at phone
  width to reorder the panel below the prompts (works, but the DOM would then lie about the
  phone order).
- **The eyebrow claims no width: `contain: inline-size` + `overflow: hidden` + `flex: 1 1 auto`.**
  Inline-size containment makes the eyebrow's intrinsic contribution zero, so neither the brand
  nor the `1fr` track ever reserves space for it; it fills the leftover and is the first thing to
  go. The plan's `min-width: 0` variant would still let the longest word ("FEDERATED") set a
  floor on the grid track. Everything else in the band has `flex-shrink: 0` and `nowrap`.
- **Phone breakpoint 640 px** (`max-width: 640px`), not in the plan; 390 is phone, 1280 desktop.
  The same number sits in `chat.page.ts` and `location-picker.component.ts` — the picker owns
  its own phone rule (label hidden) because emulated encapsulation keeps the chat page from
  reaching into it.
- **The picker is hard-wired to the band colours.** `--cf-ink`, `--cf-ink-line`, `--cf-on-ink`
  and `--cf-surface` directly in its styles; it is only ever used in the band. The select keeps
  `appearance: auto`; Chrome draws the arrow in the text colour and the option list native.
- **City in Plex Mono 400 at 15 px** (plan: 14 px / 500). Only weight 400 is loaded (Task 1);
  a 500 import for one word is not worth the extra font files, and 14 px is not on the scale.
  Task 8 adds the weights its numerals need.
- **Title 21 px** (`--cf-t-7`, plan says 22, snapped per the plan's own rule); phone 17 px
  (`--cf-t-6`). The title stays an `<h1>` — the band carries the app's name, and the page keeps
  a heading.
- **Prompt buttons stretch (`flex: 1 1 auto`) and wrap their text on desktop**, `min-height: 44px`
  instead of a fixed height, as in the frame. At 1280 two of the four English prompts wrap to two
  lines inside their button; the row itself never wraps.
- **Phone prompts: `max-width: 280px` with ellipsis** in addition to the scrolling row. Without
  it the first prompt (≈ 373 px) alone fills a 390-px screen and the row reads as one button;
  the frame truncates the same way. Side gutter 16 px on the scroll row (plan: `8 0 10`) so the
  first button lines up with the title.
- **The unstyled panel is clipped transitionally** (`max-width: 400px; max-height: 76px;
  overflow: hidden` on desktop, `height: 36px` on phone). Unclipped, its ≈ 1300 px max-content
  takes the whole `auto` column at 1280 and hides the eyebrow, and the phone chrome ends around
  250 px — T2-AC-03/04 would be unverifiable until Task 3. The comment in the rule states why;
  Task 3 replaces it with the real slot styling.
- **Disabled prompt buttons: `--cf-sub` fill and border, `--cf-muted` text, default cursor.**
  The existing `[disabled]="running()"` binding is the only state input; no focus styling (D10).
- **`app.spec.ts` asserts the outlet.** The test guarded "renders in a real browser" through the
  `<h1>` text; `router-outlet` presence proves the same without the heading.
- **No AC IDs in the new test names.** `chat.page.spec.ts` already carries `T2-AC-01` from the
  M2 plan (charts only); a second `T2-AC-02` from this plan would be ambiguous. The mapping is
  recorded below instead.
- **Prettier drift reverted.** `prettier --write` reformatted `chat.page.spec.ts` (ten unrelated
  hunks) and `src/index.html` (indentation, `/>`), both unformatted at HEAD; the files were
  restored and only the task's lines re-applied so the diff shows the change set. Both files
  remain unformatted at HEAD — see Open Issues.
- **`public/nf-mark.png`, 64 px.** Non-square source padded to a square transparent canvas; the
  same file serves the 18 px band mark of Task 3 at more than 2×.

— session 2026-09-22, after the Codex quick review

- **The phone label is visually hidden, not `display: none`** (supersedes "the label hidden at
  phone width" above). `display: none` also removed it from the accessibility tree, leaving an
  unnamed combobox at 390 px, in the first-visit state and after Change — a regression against
  the old always-visible label. `position: absolute; width/height: 1px; overflow: hidden;
  clip-path: inset(50%)` keeps the wrapping `<label>` as the select's native name. This is not
  ARIA work (D10 stays): nothing is added, the native association is kept.
- **Overflow below about 360 px is a documented limit, not a fix.** With "Amsterdam" the band
  needs ≈ 358 px (title 144, gap 12, city + Change ≈ 170, gutters 32) and the title never wraps by
  rule; 390 px is the plan's phone width. Promoted to the register for a decision (shorter city
  labels, smaller gap or a wrapping title) rather than bending the space rule here.
- **The label assertion checks the caption, not the whole name.** `select.labels[0].textContent`
  includes the option texts because the label wraps the select, so the test asserts `toContain`;
  the accessible name itself was read off the a11y tree in the browser (see Test Evidence).

— session 2026-09-22, after the user's two structure questions (post review and CodeScene gate)

- **Component styles go to sibling `.css` files (user).** "Ich persönlich hasse Inline-Styles.
  Für kleine Dateien ist es noch vertretbar." The 133-line block had become three quarters of
  `chat.page.ts` and buried the store wiring. `styleUrl` mirrors the existing `templateUrl` rule;
  `app.ts` already used it. The plan preamble said "component styles stay inline in the `.ts` as
  today" — amended in place, dated; the remaining inline blocks (panel, timeline, gauge, widget)
  move when their task touches them, no sweep now. Moved: the page (`chat.page.css`, 9 lines) and
  the picker (`location-picker.component.css`, verbatim).
- **The header is its own component, `ChatHeaderComponent`** (plan: "inside `ChatPage`"). The
  header had grown its own structure (grid, two bands, three areas, phone rules) while the page's
  job is the agent store. Only three things cross the boundary: `prompts` and `running` as
  required signal inputs, `send` as an output the page wires to its `send()`. Picker and panel are
  children of the header; Task 3 works there, not in the page. The page's spec is unchanged —
  every hook (`.cf-prompts button`, `header app-capability-panel`, `header h1`,
  `header app-location-picker`) resolves through the rendered DOM. `:host { display: block }` on
  the header; the grid stays on the inner `<header>` element.
- **Prettier is not run on the plan.** `prettier --write` on `plan.md` reflowed 46 lines of
  prose; reverted, the one-sentence amendment re-applied by hand. Markdown under `docs/` is not
  formatted by Prettier in this repo.

### Review Focus
- **Behavior claims:** (1) at desktop width the header is one 76-px ink band — title and eyebrow
  left, location, separator and capability area right — over a surface band of 44-px prompt
  buttons; when the row gets tight the eyebrow is the only element that loses width (0 px at
  760 px, title/picker/separator unchanged). (2) Without a stored city the band shows a native
  select in band colours, named "Your location" at both widths; picking a city shows it in mono
  with Change; Change brings the select back with the city preselected. (3) At ≤ 640 px the band is 54 px with title and location only,
  the prompts are one horizontally scrolling row, and the chrome ends at 153 px.
- **Plan deviations:** the header lives in `ChatHeaderComponent` (plan: "inside `ChatPage`" →
  extracted on the user's request after the gates → the page keeps the store, the header the
  chrome); component styles in `.css` files (plan preamble: "stay inline" → amended, user
  preference); `app.spec.ts` changed (not in Key Locations → its `<h1>` assertion had to
  go); phone prompt buttons capped at 280 px with ellipsis (plan: scrolling row only → one prompt
  per screen otherwise); the unstyled panel clipped (plan: "sits there unstyled" → the ACs of
  this task were not checkable otherwise); city 400 / 15 px (plan: 500 / 14 → loaded weight, type
  scale); phone prompt padding `8 16 10` (plan: `8 0 10` → gutter alignment).
- **Assumptions / choices:** breakpoint 640 px in two components; grid areas with DOM in phone
  order; `contain: inline-size` for the space rule; picker hard-wired to band tokens; `<h1>` kept
  as the band's heading; buttons stretch and wrap on desktop.
- **Scope notes:** `favicon.ico` deleted and `nf-mark.png` added; the playground routes lose the
  app heading (it lived in `app.html`); `app.css` untouched (still empty); Prettier drift in two
  files reverted rather than absorbed.
- **Read next:** `src/app/chat/chat-header.component.ts` — the three-item boundary to the page
  (`prompts`, `running`, `send`); `src/app/chat/chat-header.component.css` — the header grid and
  the `.cf-eyebrow` rule (containment instead of `min-width: 0`), then the transitional
  `app-capability-panel` block; `src/app/chat/location-picker.component.css` — band tokens used
  directly and the visually-hidden label rule; the new picker test in
  `src/app/chat/chat.page.spec.ts` (state round trip through a synthetic `change` event, label
  assertions).

### Test Evidence
- `npm run lint` — every project "No issues found", sheriff "All projects validated successfully".
- `npm run test:shell` — 19 files, 117 tests passed (115 before; the two new tests in
  `chat.page.spec.ts`; `app.spec.ts` T1-AC-01 green with the outlet assertion).
- `npx prettier --check` on the ten touched source files — clean (`chat.page.spec.ts` and
  `index.html` checked by diff only, see Key Decisions).
- `magick identify public/nf-mark.png` — `PNG 64x64 8-bit sRGB 8134B`.
- Browser check with the chrome-devtools MCP against the dev servers left running by Task 1
  (4200/4201/4202, agent 3001), in a fresh isolated context (`task2-fresh`, empty storage):
  - Maximised window (2327 px): `document.title` "Conference Finder", icon link `nf-mark.png`, no
    `app-root > h1`. Band 76 px, `padding-left` 32, colour white on the header's ink; `h1` "Conference
    Finder" Archivo 21 px / 700 / −0.42 px; eyebrow Plex Mono 10 px, 1.4 px tracking, `#9fb3c2`;
    label 12 px `#9fb3c2`; select 32 px, `#10222f` fill, `#47606f` border, radius 6, Archivo 13 px;
    separator 1 × 26 px `#47606f`; prompt row white with `#c8d3db` bottom line, padding 12 32,
    gap 10; four buttons 44 px, 13 px / 500, radius 6; chat starts at 145 px.
  - 1280 × 900 emulation: eyebrow fully visible (217 px, not clipped); band 708 px + panel column
    432 px; buttons 373/140/407/149 px in one row (two texts wrap inside). Selecting `berlin` on the
    select (synthetic `change`): select gone, "Berlin" Plex Mono 15 px / 400 white, Change 32 px
    in band colours, `localStorage` `conference-finder.city` = `berlin`, label still shown.
  - 760 × 800 emulation (space rule): eyebrow width 0 (scrollWidth 200, clipped), `h1` 178 px,
    picker 210 px, separator 1 px unchanged; the auto column shrank to the panel's min-content
    (182 px); no horizontal page overflow.
  - Disabled look probed by toggling `disabled` on the first button: `#e3e9ee` fill and border,
    `#4e5f6b` text, cursor default; enabled: white, `#10222f`, `#c8d3db`, pointer.
  - 390 × 844 mobile emulation: band 54 px, padding 16, `h1` 17 px; eyebrow, label and separator
    `display: none`; prompt row `overflow-x: auto`, scrollWidth 937 in 390, buttons 280/155/280/166
    px nowrap with ellipsis; panel strip 36 px on `#e3e9ee` with ink text; chrome ends at 153 px
    (chat top); page scrollWidth 390. Change → select 139 × 32 px in band colours, value `berlin`.
  - Console: no errors or warnings on the checked page.
  - Note: after each `emulate` the probe's `innerWidth` read 117 px below the emulated width
    (1163 for 1280, 691 for 760) while the screenshots were at the emulated width; the geometry
    within each probe is consistent, the numbers above are the probe's. In desktop Chrome the phone
    scroll row shows a classic scrollbar under the buttons; phones draw overlay scrollbars.
- Probes were in-browser `evaluate_script` calls only; nothing is in the tree. Screenshots were
  viewed, not saved. The `task2-fresh` tab was left open in the 390-px emulation.

— session 2026-09-22, after the Codex quick review (checks on the final code)

- `npm run test:shell` — 19 files, 117 tests passed after the label fix. One intermediate red:
  the first assertion compared `labels[0].textContent.trim()` to "Your location" and got the
  option texts appended (the label wraps the select); loosened to `toContain`.
- `npm run lint` — every project "No issues found", sheriff "All projects validated successfully".
- `npx prettier --check src/app/chat/location-picker.component.ts` — clean.
- Browser, `task2-fresh` tab at 390 × 844 after the dev server's reload: `.label` computes to
  `position: absolute`, 1 × 1 px, `clip-path: inset(50%)`, `display: block`; band still 54 px,
  page scrollWidth 390. After Change, the accessibility snapshot lists
  `combobox "Your location" … value="Berlin"` under the banner — the name is back at phone width.
- Not checked, by platform: the opened option list on Mobile Safari (iOS draws its own sheet;
  the band colours apply to the closed control only). Recorded as a blind spot of the review.

— session 2026-09-22, CodeScene gate (Codex, `/cs`)

- CodeScene: 5 files checked, 4 scored 10.0, `app.ts` without scorable code; delta without
  findings after one introduced complexity finding in the picker test was fixed — the Change
  click no longer optional-chains (`querySelector('button') as HTMLButtonElement` then `.click()`),
  so a missing button fails the test at once. Codex ran the 14 chat-page tests, ESLint and
  `git diff --check` clean; no register entry.
- `npm run test:shell` on the final code (this session) — 19 files, 117 tests passed.

— session 2026-09-22, after the header extraction and the style move (checks on the final code)

- `npm run lint` — every project "No issues found", sheriff "All projects validated successfully".
- `npm run test:shell` — 19 files, 117 tests passed; `chat.page.spec.ts` untouched by the
  restructure, all hooks resolve through `app-chat-header`.
- `npx prettier --check` on the eight component files (header ts/html/css, page ts/html/css,
  picker ts/css) — clean.
- Browser, `task2-fresh` tab after the dev server's reload: 390 px — `app-chat-header` computes
  `display: block`, band 54 px, four buttons, prompt row scrollWidth 937, panel strip 36 px,
  chat top 153 px, label `position: absolute`; 1280 px — band 708 × 76, eyebrow 223 px not clipped,
  separator 1 × 26, panel column 432 px, prompt row 69 px with 44-px buttons, chat top 145 px,
  no horizontal overflow. Same numbers as before the extraction.

### Acceptance Coverage
- T2-AC-01 partial — the band's name is automated (`chat.page.spec.ts` "the band carries the
  display name as its heading"); `<title>` and icon are manual (`document.title`, `link[rel=icon]`
  on 4200) — `index.html` is not exercised by unit tests.
- T2-AC-02 passed — `chat.page.spec.ts` "the location picker offers the select without a city,
  then the city with Change, then the select again" (incl. the wrapping label in both select
  states); band colours at 1280 and 390 px and the select's accessible name at 390 px manual.
- T2-AC-03 partial — manual: 1280 px probe and screenshot (band, eyebrow visible, location and
  capability area right, prompts below); space rule at 760 px; visual AC.
- T2-AC-04 partial — manual: 390 px probe and screenshot (54-px band, scrolling row, chrome 153 px).
- T2-AC-05 passed — behaviour by the existing test "disables the example buttons while a run is
  in progress and ignores clicks meanwhile"; the disabled look manual (computed colours).
- XC-01, XC-03, XC-04 — contributions only; evaluated at the end of the plan.

All visual coverage is manual by the plan's own rule (a look, not a diff); the user's
confirmation on screen is the remaining step.

### Open Issues
- The capability panel is clipped to its slot and still unstyled: default link blue and the
  hard-coded `#666`/`#b00020` on ink, content cut at 400 × 76 px and 36 px (→ Task 3).
- Promoted: `src/app/chat/chat.page.spec.ts` and `src/index.html` are unformatted at HEAD; a
  repo-wide `prettier --write` as its own chore (→ improvements register).
- Promoted: the header overflows below about 360 px of viewport width ("Amsterdam" at 320 px
  pushes Change past the edge); 390 px is the plan's phone width (→ improvements register).

### Context for Next Task
- The chrome lives in `src/app/chat/chat-header.component.{ts,html,css}`; `ChatPage` only
  composes it (`[prompts]`, `[running]`, `(send)`) above `<copilot-chat>`. Component styles go to
  a sibling `.css` (plan preamble, amended in Task 2); the panel's inline block moves in Task 3.
- The capability slot: `app-capability-panel` is a direct child of `<header>` in
  `chat-header.component.html` with `grid-area: caps` (rules in `chat-header.component.css`). Desktop rules to replace in Task 3: `align-self:
  center; max-width: 400px; max-height: 76px; padding-right: 32px; overflow: hidden`. Phone rules
  (the strip): `height: 36px; padding: 0 16px; background: var(--cf-sub); color: var(--cf-ink)`.
  The header sets `color: var(--cf-surface)`; the panel inherits white on desktop. The clipping
  hides part of the panel's "Switch off" links today (the existing T5-AC-01 test checks DOM and
  href only, not reachability) — check in Task 3 that every toggle is visible and clickable at
  both widths.
- Band geometry: 76 px, `padding-left` 32, gap 24, `column-gap` 24 to the slot; the separator
  is the last child of `.cf-band`. Phone: 54 px, padding 0 16, gap 12; breakpoint `640px` in
  `chat.page.ts` and `location-picker.component.ts`.
- The mark: `public/nf-mark.png` (64 px, transparent square), served at `/nf-mark.png`.
- Test hooks: `header h1`, `header app-location-picker`, `.cf-city`, `.cf-prompts button`,
  `header app-capability-panel` (T5-AC-01 still green).
- Fonts: Plex Mono weight 400 only; Archivo variable 100–900.
- Dev servers: still running outside the sandbox (`pgrep -af 'ng serve'` with the sandbox off);
  never `ng build` while they are up — stop, `npm run clean`, restart.
- chrome-devtools gotchas: `emulate` with a viewport reloads the page and a following probe may
  read a stale `innerWidth`; `resize_page` fails while the window is maximised; use an
  `isolatedContext` for a first-visit state instead of clearing the user's storage.

### Git State
`git diff --stat`:

```
 docs/improvements.md                        |   2 ++
 docs/work/visual-language/plan.md           |   2 +-
 public/favicon.ico                          | Bin 15086 -> 0 bytes
 src/app/app.html                            |   1 -
 src/app/app.spec.ts                         |   2 +-
 src/app/app.ts                              |   6 ++----
 src/app/chat/chat.page.html                 |  10 +--------
 src/app/chat/chat.page.spec.ts              |  31 ++++++++++++++++++++++++++++
 src/app/chat/chat.page.ts                   |  31 +++-------------------------
 src/app/chat/location-picker.component.html |   5 +++--
 src/app/chat/location-picker.component.ts   |   9 ++------
 src/index.html                              |   4 ++--
 src/styles.css                              |   6 ------
 13 files changed, 48 insertions(+), 61 deletions(-)
```

`git status --short` (device-node dotfiles of the sandbox filtered out):

```
 M docs/improvements.md
 M docs/work/visual-language/plan.md
 D public/favicon.ico
 M src/app/app.html
 M src/app/app.spec.ts
 M src/app/app.ts
 M src/app/chat/chat.page.html
 M src/app/chat/chat.page.spec.ts
 M src/app/chat/chat.page.ts
 M src/app/chat/location-picker.component.html
 M src/app/chat/location-picker.component.ts
 M src/index.html
 M src/styles.css
?? docs/work/visual-language/task-log/task-2-header-band-picker-favicon.md
?? public/nf-mark.png
?? src/app/chat/chat-header.component.css
?? src/app/chat/chat-header.component.html
?? src/app/chat/chat-header.component.ts
?? src/app/chat/chat.page.css
?? src/app/chat/location-picker.component.css
```

### Sessions
- claude-code 0e9ee134-d03e-4c33-855a-d6b5a4c59cb7 (2026-09-22) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/0e9ee134-d03e-4c33-855a-d6b5a4c59cb7.jsonl
- codex 01a0c8b3-2621-7f60-b50f-8f13b26f82ab (2026-09-22) — transcript: ~/.codex/sessions/2026/09/22/rollout-2026-09-22T12-39-39-01a0c8b3-2621-7f60-b50f-8f13b26f82ab.jsonl
