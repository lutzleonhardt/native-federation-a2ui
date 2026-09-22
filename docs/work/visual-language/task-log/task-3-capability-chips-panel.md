# Task 3: Capability chips and the panel

### Task
Restyle `CapabilityPanelComponent` into chips plus a native `<details>` disclosure in the header's
capability slot: at every width one chip per manifest remote with its name and state as text; on
the desktop the open panel is an overlay hanging from the header stack, on the phone it expands in
place under the strip. Data and behaviour unchanged (one entry per remote, the switch link reloads
with the flipped `?capabilities=`).

### Status
DONE. Independent review performed (Codex, quick mode, 2026-09-22): one MEDIUM accepted as a
documented limit, two blind spots recorded (see Key Decisions). Verified by lint, the shell unit tests (118, one new;
two existing tests follow the new texts) and a browser check with the chrome-devtools MCP at 1280,
1000 and 390 px on the running dev servers, the unreachable state reproduced by blocking the maps
origin from the browser's side. The user's look at the app at desktop and phone width (the plan's
verification rule; the panel is not on the playground bench) is pending. No `ng build` (servers
up). CodeScene gate (`/cs`) not run.

### Files Modified
- `src/app/chat/capability-panel.component.ts` (modified) — `PanelEntry` gains `stateLabel`
  ("off" for `unselected`); `origin` is a string with "—" as fallback and `names()` returns "—"
  for an empty list; `styleUrl` replaces the inline `styles` block.
- `src/app/chat/capability-panel.component.html` (modified) — one `<details>`: the `<summary>` is
  the collapsed strip (mark, one `.cf-chip[data-state]` per entry with `.cf-name`/`.cf-state`,
  the Details toggle); the body `.cf-panel` holds the head row ("Capabilities", mark, "loaded via
  Native Federation") and one `li[data-state]` per entry with a `dl` (origin, components,
  functions) and the switch `a`.
- `src/app/chat/capability-panel.component.css` (new) — chips and their three states, the toggle
  with a CSS chevron, the desktop overlay, head row and rows, the phone strip and in-place rules.
- `src/app/chat/chat-header.component.css` (modified) — `header { position: relative }` as the
  overlay's anchor; Task 2's transitional clip block replaced by the slot rules (`grid-area`,
  `align-self`, right gutter); the phone strip rules (36 px, `--cf-sub`, ink) moved into the panel.
- `src/app/chat/capability-panel.component.spec.ts` (modified) — helpers for chips and `dd`
  facts; T5-AC-01 asserts the `dt` captions and `dd` values per row; one new test (collapsed by
  default, chip texts, body hidden until `open`, links visible when open); the empty-manifest
  test reads the summary.
- `src/app/chat/chat.page.spec.ts` (modified) — the two "loaded from …" expectations now check
  the origins only (two lines; the file stays unformatted at HEAD, see the register).
- `docs/improvements.md` (modified) — one entry promoted: the band's overflow between the phone
  breakpoint and about 920 px.

### Files Read (Context Only)
- `docs/work/visual-language/plan.md` (preamble, Task 3), `task-log/task-2-header-band-picker-favicon.md`,
  `docs/work/m2-nf-split/task-log/task-5-capability-panel.md` (Key Decisions)
- `docs/design/departure/desktop-1280.png`, `desktop-panel-open.png`, `phone-390.png`
- `src/app/chat/chat-header.component.{ts,html}`, `src/app/chat/chat.page.{ts,html,css}`,
  `src/styles.css` (tokens), `src/app/federation/capability-status.ts`, `src/index.html`,
  `angular.json` (test runner: vitest in ChromiumHeadless), `.prettierrc`

### Key Decisions
- **The `<summary>` is the whole collapsed strip, not the word "Details".** A native `<details>`
  hides every child except its summary, and the chips must stay visible at every width. With the
  strip inside the summary, the phone expansion is plain flow (the body follows the summary) and
  the desktop overlay is only `position: absolute` on the body. Consequence: a click anywhere on
  the strip toggles, the chip included; the switch links sit in the body, outside the summary, as
  the plan asks. Rejected: summary = "Details" only with the chips as siblings (the body would
  need its own placement trick on the phone); `display: contents` on `details` (unreliable across
  engines); JS-held open state (plan says native).
- **The overlay's anchor is the `header` of `ChatHeaderComponent`** (the plan's Key Locations
  name `chat.page.*`; the slot moved in Task 2). `position: relative` on the header and
  `top: 100%` on the body: the header stack includes the prompt row, so the overlay starts below
  it and covers chat content only. `z-index: 20` with no stacking context in between (the header
  has no z-index, the hosts are `display: block`). Width `min(880px, 100% − 64px)` so the overlay
  stays inside the header between 640 and 944 px.
- **Chips are `span[data-state]`; the rows keep `li[data-state]` with the `a`.** Keeps "one `li`
  per capability" the unique list hook. The chip shows name and state label, the row shows the
  facts as a `dl` (dt caption, dd value, mono) — the frame's caption/value pairs. Empty values
  are "—" (frame) instead of the old "none"; a loaded remote without origin shows "—" too. The
  old `<h2>Capabilities</h2>` is the head row's caption now.
- **Phone: the chips wrap and the toggle is chevron-only.** The first version scrolled the chip
  row (`overflow-x: auto`): the nested scroll container's min-content still widened the grid
  column (page 421 px wide at 390), and with `min-width: 0` on the slot the unreachable chip was
  cut and a classic scrollbar sat under the chips — T3-AC-01 wants every state readable without a
  swipe. Now `.cf-chips` wraps (`min-height: 36px` on the summary, one row of 28-px chips plus
  4-px padding) and `.cf-toggle-text` is `display: none` at ≤ 640 px (the frame shows a chevron
  only); "charts loaded" and "maps unreachable" fit one row at 390 with room for a third chip
  on a second row.
- **Chip colours by media query, not by an input.** Band variants on the desktop
  (`--cf-ink-line` border, white name, `--cf-on-ink` state, `--cf-rail-on-ink` dot), strip
  variants at ≤ 640 px (`--cf-line`, ink, `--cf-muted`, `--cf-rail`); the white body uses
  `--cf-rail` for the row dot. Same breakpoint as the header and the picker (640 px, now in three
  files). Unreachable at both widths: `--cf-attention-bg` fill and border, `--cf-attention-ink`
  text, `--cf-attention` dot; the open row repeats the amber dot and state text (same meaning,
  D6). Off: dashed border, muted text, no dot.
- **"Details" keeps its text when open; the chevron flips** (`details[open] .cf-toggle::after`).
  Dropped from the frame: "Schließen" in the panel head (the summary is the toggle), the caret
  above the overlay, the "CAPS" label on the phone strip — frames are orientation. The open panel
  does not close on an outside click or Escape (native `details`).
- **No font weight for the chip name.** Plex Mono loads weight 400 only (Task 1); contrast does
  the job (white/ink name, muted state). Toggle and "Capabilities" caption uppercase mono 11 px
  with tracking.
- **`box-sizing: border-box` on chip, toggle, head row and phone summary** so the plan's 28, 46
  and 36 px are outer sizes; the first probe measured 30-px chips and a 37-px strip.
- **The unreachable state was probed by blocking `fetch` to the maps origin** (chrome-devtools
  `navigate_page` with an `initScript` rejecting URLs containing `4202`) instead of stopping the
  maps server, which is part of the user's `npm start` group; Native Federation then skips the
  remote and the panel shows `unreachable` — the same idea as M2 Task 5's request abort.
- **No AC IDs in the new test name** (Task 2's convention: `T3-AC-*` would collide with M2's
  task 3); the mapping is in Acceptance Coverage.
- **The mark: `alt="Native Federation"` in the summary, `alt=""` in the head row** (decorative
  next to its text); `src="nf-mark.png"` relative to `<base href="/">`, like the icon link.

— session 2026-09-22, after the Codex quick review

- **The tablet overflow is accepted as a documented limit (user).** Codex measured the band at
  800 px: page 919 px wide with both remotes loaded, 954 px with maps unreachable, the Details
  toggle outside the viewport — the register entry from this wrap-up. Not fixed: the demo has no
  tablet target ("Es ist eine Demo-App"), the plan's widths are 1280 and 390, and the space rule
  is Task 2's decision. A fix would be the capability strip from 920 px down instead of 640
  (about ten lines in the header and panel CSS), noted in the register for a later decision.
- **Two blind spots recorded, no action:** the tests assert texts and `checkVisibility()`, not
  viewport bounds — by the plan's rule (a look, not a diff), geometry tests are out; three remotes
  exist only as a spec fixture, the manifest has two. The user's look on screen stays the
  remaining step.

### Review Focus
- **Behavior claims:** (1) Collapsed at every width, the strip shows the mark and one chip per
  manifest remote reading `<name> loaded | unreachable | off`; "loaded via Native Federation"
  and the switch links exist only in the details body. (2) On the desktop the open body is an
  880-px overlay starting at the header's bottom edge (145 px at 1280) whose right edge is 32 px
  in; the four prompt buttons stay the hit target at their centres. At ≤ 640 px the body is static
  and pushes the chat down (chat top 154 → 404 at 390 with two remotes). (3) Only the
  `unreachable` chip has an amber fill; every open row lists origin, components and functions,
  and its link carries the flipped query (hrefs unchanged, T5-AC-02).
- **Plan deviations:** summary = whole strip (plan: a "Details" toggle → the chips would be hidden
  otherwise → chips inside the summary); Key Locations `chat.page.ts/html` → the slot and anchor
  are in `chat-header.component.css` (moved in Task 2); phone toggle chevron-only and wrapping
  chips (plan: "Details" toggle in the strip → the unreachable chip did not fit at 390 px);
  "—" for empty values (plan silent, frame); no "Schließen", caret or "CAPS" from the frame.
- **Assumptions / choices:** chips are non-list `span`s; a click on a chip toggles; no close on
  outside click; no `aria-*` (D10); breakpoint 640 repeated in the panel CSS; the empty-manifest
  message sits in the strip, the toggle then opens a body with the head row only.
- **Scope notes:** `chat.page.spec.ts` touched in two expectation lines only; `docs/improvements.md`
  gains one line; the panel is not on the playground bench; the interim `min-width: 0` slot rule
  was removed again before the end of the session.
- **Read next:** `src/app/chat/capability-panel.component.html` — the single `details` with the
  strip as its summary; `src/app/chat/capability-panel.component.css` — the `.cf-panel` block
  (overlay) and the `@media` block (strip, wrapping chips, static body);
  `src/app/chat/chat-header.component.css` — the `header` rule and the slot rules (anchor, clip
  block gone); the new test in `src/app/chat/capability-panel.component.spec.ts`
  (`checkVisibility()` closed and open).

### Test Evidence
- `npm run lint` — every project "No issues found", sheriff "All projects validated successfully"
  (run on the final code).
- `npm run test:shell` — 19 files, 118 tests passed (117 before; the new test in the panel spec).
  Re-run on the final code after the phone and border-box edits: 19 files, 118 passed.
- `npx prettier --check` on the panel `.ts/.html/.css/.spec.ts` and `chat-header.component.css` —
  clean; `chat.page.spec.ts` checked by diff (two lines).
- Browser: chrome-devtools MCP, isolated context `task3`, dev servers left running by Task 1
  (4200/4201/4202, agent 3001); `evaluate_script` probes, screenshots viewed, not saved.
  - 1280 × 900, `?capabilities=charts,maps`: `details.open` false, `.cf-panel.checkVisibility()`
    false; mark 18 px visible; chips "charts loaded" 119 px and "maps loaded" 106 px, Plex Mono
    11 px, border `#47606f`, name white, state `#9fb3c2`, dot `#6e9be0`; toggle "DETAILS" white
    pill 86 × 28; slot 385 px; eyebrow 264 px (not clipped); chat top 145. Open (summary click):
    body `position: absolute`, 880 × 248 at y 145, right edge 32 px in, radius `0 0 6 6`, shadow
    `rgba(16, 34, 47, 0.18) 0 10 28`, z-index 20; head row 46 px on `#e3e9ee` with the mark and
    "loaded via Native Federation"; rows: charts → dt `origin, components, functions`, dd
    `http://localhost:4201/`, `Gauge, Timeline`, `daysUntil`, "Switch off → ?capabilities=maps";
    maps → `http://localhost:4202/`, `Map`, `distance`, "Switch off → ?capabilities=charts";
    `elementFromPoint` at the centre of all four prompt buttons returns the button; a point inside
    the overlay hits the overlay, one below it hits the chat.
  - `?capabilities=charts`: chips "charts loaded" and "maps off" (73 px, dashed `#47606f`, text
    `#9fb3c2`, no dot); links "Switch off → ?capabilities=", "Switch on → ?capabilities=charts,maps".
  - `?capabilities=charts,maps` with the fetch block on 4202: chips "charts loaded" (unchanged,
    no amber) and "maps unreachable" (139 px, fill and border `#fdf0e2`, text `#8a4607`, dot
    `#e1730b`); open rows: maps dd "—", "—", "—", state text `#8a4607`, dot `#e1730b`; the
    charts row dot `#2b5fa8` on white; console without errors.
  - 1000 × 800, unreachable chip (space rule): eyebrow 0 px (scrollWidth 200), h1 178, picker
    215, separator 1 unchanged, slot 418; the band overflows the probe's 909-px layout by 23 px
    (document scrollWidth 932) — nothing else shrinks, see Open Issues; overlay 845 px =
    `min(880, 100% − 64)`.
  - 390 × 844 mobile, fetch block on 4202. First version (scrolling chip row): page 421 px wide
    (`documentElement.clientWidth` 390, `scrollWidth` 421), the Details pill and the select cut
    off in the screenshot; with `min-width: 0` on the slot: page 390 but "maps unreacha…" cut and
    a classic scrollbar under the chips → wrapping chips, chevron-only toggle. Final strip: page
    390, summary `#e3e9ee` with ink text, chips 120 + 139 px in one row, borders `#c8d3db`, dot
    `#2b5fa8`, toggle 29 × 29 with `.cf-toggle-text` not visible, strip 37 px, chat top 154 (the
    border-box edit came after this probe: 36 px and 153 by arithmetic, not re-measured at 390).
    Open: body `position: static`, 390 × 250 directly under the strip, no shadow, head 46 px, both
    rows with visible links (72 × 15 px at the right), chat top 404, no horizontal overflow, the
    first prompt button still the hit target.
  - Final 1280 probe after all edits (both loaded): chip rect height 27.99 px (30 before the
    border-box edit), toggle text visible, chat top 145, eyebrow 264 px, document scrollWidth
    equals the viewport. Console: only the two geolocation warnings (`LocationStore`, pre-existing).
- Probes were in-browser only; the fetch-blocking `initScript` applies to one navigation and is
  gone; nothing is in the tree. The `task3` tab was left open at 1280 × 900.

### Acceptance Coverage
- T3-AC-01 passed — `capability-panel.component.spec.ts` "starts collapsed with a chip per remote
  that names its state; the details open on demand" (`details.open` false after render, chips
  `charts loaded`, `maps unreachable`, `tables off`, body not visible); both widths manual
  (1280 and 390 probes: `open` false after load, every chip visible).
- T3-AC-02 partial — manual only, visual AC by the plan's rule: 1280 probe (overlay rect at the
  header's bottom edge, `elementFromPoint` on the four prompt buttons) and 390 probe (body
  `position: static`, chat top 404, first prompt still the hit target).
- T3-AC-03 passed — the same new test: the summary mark `checkVisibility()` true while collapsed,
  "loaded via Native Federation" inside the body that is hidden closed and visible open; the head
  row's mark manual (1280 open probe).
- T3-AC-04 passed — T5-AC-01 (dt captions and dd values per row) and T5-AC-02 (flipped hrefs) in
  the panel spec, plus the page spec's T5-AC-01 (first link `?capabilities=maps`); the reload is
  the browser's — hrefs read in all three states, no link clicked (it would have dropped the
  probe context).
- T3-AC-05 partial — manual: computed colours at 1280 and 390 (amber fill, text and dot only on
  `data-state="unreachable"`; loaded and off chips transparent with band or strip borders).
- XC-01, XC-03, XC-04, XC-05 — contributions only; evaluated at the end of the plan.

All visual coverage is manual by the plan's own rule (a look, not a diff); the user's look on
screen is the remaining step.

### Open Issues
- Promoted: between the phone breakpoint (640 px) and about 920 px the ink band overflows
  horizontally once the eyebrow is gone — the space rule shrinks nothing else by design; a tablet
  rule needs a decision (→ improvements register).
- The user's look at 1280 and 390 px is pending (plan rule); the CodeScene gate has not seen the
  new files.

### Context for Next Task
- Task 4 (chat frame): the header stack is 145 px on the desktop and 153 px on the phone
  (unchanged); the overlay is `z-index: 20` in the root stacking context — a CopilotKit element
  with a higher z-index near the top of the chat would poke through; the chat's own input sits at
  the bottom.
- Panel structure: host `app-capability-panel` is `display: block`; `details > summary` is the
  strip; the body `.cf-panel` is absolute on the desktop (anchor: the header) and static at
  ≤ 640 px. Breakpoint 640 now in three files (header, picker, panel).
- Test hooks: `summary .cf-chip[data-state]` with `.cf-name`/`.cf-state`; `li[data-state]` with
  `dt`/`dd` and the `a`; `header app-capability-panel` (page spec T5-AC-01 green).
- chrome-devtools gotchas: to reproduce `unreachable`, navigate with an `initScript` that rejects
  `fetch` for the remote's origin (one navigation only); after a mobile `emulate` the probe's
  `innerWidth` read 421 while `documentElement.clientWidth` was 390 — use `clientWidth` and
  `scrollWidth` for overflow questions; the desktop probes still read 117 px below the emulated
  width (Task 2's note).
- Dev servers still running outside the sandbox (`pgrep -af 'ng serve'` with the sandbox off);
  never `ng build` while they are up.

### Git State
`git diff --stat`:

```
 docs/improvements.md                            |  1 +
 src/app/chat/capability-panel.component.html    | 68 +++++++++++++++----------
 src/app/chat/capability-panel.component.spec.ts | 50 +++++++++++++++---
 src/app/chat/capability-panel.component.ts      | 47 ++++-------------
 src/app/chat/chat-header.component.css          | 11 +---
 src/app/chat/chat.page.spec.ts                  |  4 +-
 6 files changed, 100 insertions(+), 81 deletions(-)
```

`git status --short` (device-node dotfiles of the sandbox filtered out):

```
 M docs/improvements.md
 M src/app/chat/capability-panel.component.html
 M src/app/chat/capability-panel.component.spec.ts
 M src/app/chat/capability-panel.component.ts
 M src/app/chat/chat-header.component.css
 M src/app/chat/chat.page.spec.ts
?? docs/work/visual-language/task-log/task-3-capability-chips-panel.md
?? src/app/chat/capability-panel.component.css
```

### Sessions
- claude-code 9d059ced-8f8d-4020-b866-77c7941f1d70 (2026-09-22) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/9d059ced-8f8d-4020-b866-77c7941f1d70.jsonl
- codex 01a0c932-24e0-7c83-a858-c1f839b4189f (2026-09-22) — transcript: ~/.codex/sessions/2026/09/22/rollout-2026-09-22T14-58-21-01a0c932-24e0-7c83-a858-c1f839b4189f.jsonl
