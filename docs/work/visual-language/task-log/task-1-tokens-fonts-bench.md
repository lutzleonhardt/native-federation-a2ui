# Task 1: Tokens, fonts, light-only scheme and the playground bench

### Task
Lay the theme foundation — `--cf-*` tokens, self-hosted fonts, `color-scheme: only light` and the
A2UI variable mapping in `src/styles.css` — and extend `/playground` with the bench every later
visual task is checked on.

### Status
DONE. Independent review not performed (pending, `/review quick` in a clean session). Verified by
lint, build, the shell unit tests and a browser check at desktop and phone width with dark-mode
emulation on all three origins. Still open per the plan's verification rule: the user's own look
at `/playground` and the app; the three dev servers were left running for it.

### Files Modified
- `src/styles.css` (modified) — tokens, seven-step type scale, `color-scheme: only light`, the two
  fontsource imports, body ground and font, the `--a2ui-*` mapping, the caption rule, the button
  font rule and the three Row rules (nested, native CSS nesting); keeps the `app-root` layout and
  the `h1` rule for Task 2.
- `projects/mfe-charts/src/styles.css`, `projects/mfe-maps/src/styles.css` (modified) —
  `color-scheme: only light`, the ground as a literal with a `--cf-ground` comment, the fallback
  font stack.
- `package.json`, `package-lock.json` (modified) — `@fontsource-variable/archivo ~5.3.0` and
  `@fontsource/ibm-plex-mono ~5.3.0` (both OFL-1.1) in `dependencies`.
- `src/app/playground/playground.ts` (modified) — `benchMessages()` as a second surface
  `playground-bench`, generated timeline items, a hand-built completed `messageWidget` call;
  `.muted` reads the token; prettier formatted the whole file (see Key Decisions).
- `src/app/playground/playground.html` (modified) — bench section with the second surface and
  `app-message-widget`.
- `docs/improvements.md` (modified) — the text-contrast entry ticked; two items promoted (see Open
  Issues).
- `docs/work/visual-language/plan.md` (modified) — one Key Discoveries line added to the Task 4
  block: CopilotKit's scoped preflight overrides the surface font and heading colour inside a
  message (found in the live chat check).

### Files Read (Context Only)
- `docs/work/visual-language/plan.md` (preamble, Task 1), `docs/work/visual-language/task-log/docs-visual-language-spec.md`; M2 logs by grep only (`task-4-charts-remote`, `task-6-maps-remote-boundaries`, `task-9-english-demo`)
- `node_modules/@a2ui/web_core/src/v0_9/basic_catalog/styles/default.js`, `node_modules/@a2ui/angular/fesm2022/a2ui-angular-src-v0_9.mjs` (Text, Button, Card, Divider, Row, Column, ComponentHost), `node_modules/@copilotkit/angular/dist/index.d.ts` (`AngularToolCall`), the two fontsource `index.css` files
- `src/app/agent/tools/message-widget.component.{ts,html,spec.ts}`, `message-widget.definition.ts`, `src/app/playground/tool-playground.ts`, `projects/mfe-charts/src/charts/timeline.schema.ts`, `timeline.component.ts` (`labelOf`), `src/app/a2ui/assistant-catalog.ts`, `src/app/app.routes.ts`, `src/app/app.html`, `angular.json`, `.prettierrc`

### Key Decisions
- **Type scale `--cf-t-1…7` (10, 11, 12, 13, 15, 17, 21 px); A2UI's six sizes map xs=12, s=13,
  m=15, l=17, xl=2xl=21.** Six sizes on a seven-step scale force one duplicate; h1 and h2 share
  the top step so the answer heading looks the same whether the model emits h1 or h2. The
  alternative xl=17 would merge h2 with the facts h3. Steps 10 and 11 stay free for eyebrow and
  band captions of later tasks.
- **The two stray frame colours earn no token.** Link hover `#1D4478` snaps to `--cf-ink`, the
  band separator `#2E4657` to `--cf-ink-line`; both recorded as comments in the token block, the
  one canonical place.
- **The Row rules are global and deliberately so.** `a2ui-v09-row { flex-wrap: wrap }`, its
  children `min-width: fit-content`, and a Column inside a Row `width: auto !important`. The
  `!important` is the only way past the Column host's inline `width: 100%` short of replacing the
  component; `flex-basis: content` would also work but reads worse. Side effect, accepted: the
  Berlin sample's `details` Row is now content-sized (gauge and summary column side by side, the
  column no longer stretches). Every model-composed Row in the chat behaves the same way.
- **Bench as a second surface, not an extension of the Berlin surface.** The plan wants the Berlin
  sample untouched; the message widget hangs in the template exactly as `tool-playground` does.
  Bench timelines carry `items` only — selection is checked on the Berlin sample.
- **`.a2ui-button { font-family: inherit }` added.** `<button>` resets the font to the UA default
  (Arial on this machine) and A2UI exposes no font variable for buttons; the label's size comes
  from the Text's `p` (15 px). Not in the task block; found on the bench.
- **A2UI's disabled button stays hard-coded.** `.a2ui-button:disabled` sets `#e9ecef`/`#6c757d`
  literally, unreachable through variables; no disabled button exists in the app. Promoted.
- **Card padding `20px var(--cf-s-5)`.** 20 is not on the spacing scale; the plan fixed
  "padding 20 24" and the frame follows it. Card margin, divider spacing and button margin are 0:
  Column and Row own the gap.
- **IBM Plex Mono weight 400 only.** The package's default import ships one weight; captions use
  it. Extra weights (gauge numerals) need their own import in that task.
- **Body sets ground and font only, no `color`.** Chrome text stays default black until the
  header band (Task 2) and the chat frame (Task 4) set their own.
- **`npm install --ignore-scripts --save-prefix='~'`.** The root postinstall (Playwright, agent
  install) is unrelated to two CSS packages, and `~` matches the repo convention.
- **Prettier drift absorbed.** `playground.ts` was unformatted at HEAD (noted in M2 tasks 4 and
  9); formatting the whole file adds three hunks to the Berlin sample (import block, two
  `updateDataModel` lines). Kept rather than hand-reverting a file that is being rewritten anyway.

— session 2026-09-22, after the user's questions on the diff

- **The Row rules are nested** (user preference). Native CSS nesting is Baseline 2023; esbuild
  flattens it for the browserslist target, the built CSS shows the three flat selectors.
- **The protocol version in the element names (`a2ui-v09-row`) is accepted.** The package ships
  the v0.8 and v0.9 renderers side by side so both protocol versions can coexist in one app; the
  Row host carries no class or attribute, so there is no version-free hook. The version already
  sits in about forty places (`@a2ui/angular/v0_9` imports, `<a2ui-v09-surface>` in five
  templates); an upgrade is a search-and-replace over `v0_9` and `v09` either way.
- **The remotes keep the ground as a literal.** Their `styles.css` loads only on the standalone
  page, where no shell defines `--cf-*`, so a `var()` would always hit its fallback and suggest a
  link that does not exist; inside the shell the remote's global stylesheet is not loaded at all.
  A `/* --cf-ground */` comment keeps the literal findable. Considered and deferred: a shared
  `tokens.css` under `shared/` that all three stylesheets `@import` (esbuild inlines it at build
  time) — one more file across the federation boundary for one background value; revisit if the
  literals drift.

### Review Focus
- **Behavior claims:** (1) with the OS or DevTools in dark mode, 4200, 4201 and 4202 render with
  the same computed colours as in light mode; (2) every Text variant in a surface is ink on the
  ground or on white, captions muted uppercase mono; (3) a Row of facts wraps whole entries at
  390 px and no value wraps inside itself.
- **Plan deviations:** `.a2ui-button { font-family: inherit }` added (plan: variables only →
  needed because `<button>` ignores the inherited font); `playground.ts` formatted wholesale
  (plan: bench only → three pre-existing drift hunks in the Berlin sample came along).
- **Assumptions / choices:** xl = 2xl = 21 px; stray colours snap instead of tokens; Row rules
  global with one `!important`; card padding literal 20 px; body without `color`.
- **Scope notes:** playground's `.muted` now reads `--cf-muted`; the improvements entry ticked
  before the user's look (the computed colours hold, the user confirms on screen).
- **Read next:** `src/styles.css` — the three Row rules at the end (global effect on every
  model-composed Row, including `!important`); `src/styles.css` — the `--a2ui-*` block (six
  sizes on seven steps); `benchMessages()` in `src/app/playground/playground.ts` (component ids
  and data paths the timeline and gauge tasks will point at).

### Test Evidence
- `npm run lint` — every project "No issues found", sheriff "All projects validated successfully".
- `npx ng build shell` — bundle complete; 13 font files in `dist/shell/browser/media`
  (`archivo-*-wght-normal.woff2`, `ibm-plex-mono-*-400-normal.woff2/.woff`); the only external URL
  in the built CSS is `http://www.w3.org` (SVG namespace), no font host.
- `npm run test:shell` — 19 files, 115 tests passed (after the lockfile change, vite re-optimised).
- `npx prettier --check` on the five touched source files — clean.
- After nesting the Row rules: prettier clean, `npx ng build shell` OK, the built CSS contains
  `a2ui-v09-row{flex-wrap:wrap}`, `a2ui-v09-row>a2ui-v09-component-host>*{min-width:fit-content}`
  and `…>a2ui-v09-column{width:auto!important}` — esbuild lowered the nesting.
- Browser check with the chrome-devtools MCP against dev servers 4200/4201/4202 started outside
  the sandbox (`nohup npm run start:{shell,charts,maps}`, logs in the session scratchpad):
  - `/playground` at 1280 px: `color-scheme` computes to `light only`; body `rgb(237,241,244)`
    with Archivo; `document.fonts` loaded: Archivo Variable 100–900, IBM Plex Mono 400; font
    requests: three `localhost:4200/media/*.woff2`, nothing else. Card: `1px solid #c8d3db`, no
    shadow, radius 6, padding 20 24. Divider: 1 px line, margin 0. Row and Column: no border, no
    background, `flex-wrap: wrap`, Column width auto (80 px). Buttons: default white/ink/line
    border, primary ink/white, borderless transparent/ink. Texts: h3 17 px Archivo, caption 12 px
    Plex Mono uppercase, 0.72 px letter-spacing, `#4e5f6b`, `em` upright; body 15 px `#10222f`.
    Timelines: 30 and 4 markers. Widget renders the markdown.
  - Dark emulation (`matchMedia('(prefers-color-scheme: dark)')` true) on `/playground`, `/`
    (CopilotKit container `oklch(1 0 0)`, no `.dark` class), 4201 and 4202 (`light only`, ground,
    fallback stack, no font requests): computed colours identical to light.
  - 390 px mobile emulation on `/playground`: every value one line; the three grouped pairs on one
    row (equal y); the flat row wraps "Tickets left · 68 of 450" as whole entries to the second
    line; the buttons wrap with the borderless one on the second line; button font Archivo.
- Flat-row wrap by available width (bench section narrowed in the DOM, viewport 1280):
  390/375/360 px → `Date 2026-09-22 Distance 359 km` / `Tickets left 68 of 450`;
  340/320 px → `Date 2026-09-22 Distance` / `359 km Tickets left 68 of 450` — below about 360 px
  a flat caption separates from its value (Codex review finding, reproduced).
- Incident: `npx ng build shell` while the three dev servers were running made them re-bundle the
  Native Federation cache ("Re-bundling all internal libraries and exposed modules"); the shell
  then served a prod-built shared `@angular/core` chunk to dev-compiled app code and the page
  went blank with `ReferenceError: ngDevMode is not defined` (`app.ts:12`). The M2 task-4 log
  predicted exactly this pairing but had never seen it in the repo. Remedy as documented there:
  stop the servers, `npm run clean`, restart — afterwards `typeof ngDevMode === 'object'`,
  `app-root` has 3 children, both surfaces render.
- Live chat answer (agent on 3001, prompt "Where and when is the next one near me? …", two model
  calls, Berlin at 1280 px and the persisted Zurich at 390 px):
  - Colours inside the CopilotKit message: body values `#10222f`, captions `#4e5f6b` mono
    uppercase 12 px, h2 21 px / h3 17 px in Archivo but coloured Tailwind `gray-900`
    (`oklch(0.21 0.034 264.665)`) by CopilotKit's heading rule — all ≥ 4.5:1, nothing near-white.
  - Font: body `p` inside the message computes to CopilotKit's `ui-sans-serif, system-ui, …`
    (its scoped preflight on `[data-copilotkit]`), not Archivo — inheritance stops at the chat
    frame. Headings get Archivo through `--a2ui-font-family-title`, captions Plex Mono through the
    caption rule.
  - 390 px: no horizontal overflow (`scrollWidth` 390), the Map scales to the 358 px message
    width, the model's four grouped caption/value Columns sit on one row, every value one line.
  - Desktop run: the model's `Distance` value rendered empty (a function-call Text with no
    result); Zurich came back after the reload although Berlin had been picked — both outside
    this task, noted below.
- Probes were in-browser `evaluate_script` calls only; nothing is in the tree. Screenshots were
  viewed, not saved.

### Acceptance Coverage
- T1-AC-01 partial — manual: dark emulation on 4200 (`/playground`, `/`), 4201 and 4202 gives the
  same computed colours as light; visual AC, no automated test.
- T1-AC-02 partial — manual: computed colours of every Text variant on the bench are ink
  (`#10222f`, ≈ 16:1 on white) or muted (`#4e5f6b`, 4.6:1 on ground); confirmed in a live chat
  answer at 1280 and 390 px (headings `gray-900` from CopilotKit, still dark).
- T1-AC-03 partial — manual: font requests only from `localhost:4200`; the built CSS names no
  font host.
- T1-AC-04 partial — manual: computed styles of Column, Row, Card, Divider and caption on the bench.
- T1-AC-05 partial — manual: 1280 and 390 px probes (line counts and y positions); the flat
  row keeps caption and value together down to 360 px, below that they can split (see Test
  Evidence) — flexbox has no keep-with-next, pairing needs the grouping of Task 5.
- T1-AC-06 partial — manual: the bench shows the card with divider, both pair variants, the three
  buttons, the widget and both timelines; seen at both widths.
- XC-01, XC-02 — contributions only; evaluated at the end of the plan.

All coverage is manual by the plan's own rule (a look, not a diff); the user's confirmation on
screen is the remaining step.

### Open Issues
- The 30-item bench timeline's labels overlap heavily (→ Task 7).
- In a flat Row a caption can separate from its value below about 360 px of available width;
  CSS cannot keep two sibling flex items together (→ Task 5, grouped caption/value pairs).
- Inside a chat message CopilotKit's scoped preflight wins over inheritance: body text in a
  surface is `ui-sans-serif, system-ui`, headings `gray-900` instead of ink — set
  `font-family: var(--cf-font-ui)` and the heading colour under `[data-copilotkit]` (→ Task 4,
  recorded in its Key Discoveries).
- Promoted: a live answer rendered the `Distance` value empty — a function-call Text without a
  result, one run (→ improvements register).
- After a reload the location picker showed Zurich although Berlin had been picked in the same
  browser profile; one observation, not reproduced, may be an older persisted choice (no task).
- Chrome text is default black — body sets no `color` (→ Task 2 header band, Task 4 chat frame).
- The `app-root > h1` rule stays in `src/styles.css` until the heading goes (→ Task 2).
- Promoted: A2UI's `.a2ui-button:disabled` colours are hard-coded and unreachable through
  variables (→ improvements register).

### Context for Next Task
- Tokens live on `:root` in `src/styles.css`; type scale `--cf-t-1…7`; spacing `--cf-s-1…7`;
  radii `--cf-r-sm/md/pill`; fonts `--cf-font-ui`/`--cf-font-data`. Remotes read them with the
  token value as fallback and never import the file.
- Bench: surface `playground-bench`; component ids `card`, `grouped`, `flat`, `divider`,
  `buttons`, `btn-{default,primary,borderless}`, `year`, `week`; data paths `/year` (30 items,
  12 days apart from today) and `/week` (4 items, 2 days apart). Button clicks log
  `bench {"variant":…}` in the actions list.
- Dev servers: started outside the sandbox and left running for the user's look; stop with
  `pkill -f 'ng serve'` (check with `pgrep -af 'ng serve'` outside the sandbox). Never run
  `ng build` while they are up: it poisons the Native Federation cache and the shell boots with
  `ngDevMode is not defined` — stop, `npm run clean`, restart.
- Gotchas: the Column host's inline `width: 100%` needs `!important`; `<button>` needs
  `font-family: inherit`; a caption renders as `<em>`, hence the upright rule; the chrome-devtools
  `emulate` with a viewport reloads the page (probe after a wait) and `resize_page` fails while
  the window is maximised.
- CopilotKit is still default-styled (Task 4); the chat body is ground-coloured with the white
  CopilotKit container on top.

### Git State
`git diff --stat`:

```
 docs/improvements.md               |   4 +-
 package-lock.json                  |  20 ++++++
 package.json                       |   2 +
 projects/mfe-charts/src/styles.css |   7 ++
 projects/mfe-maps/src/styles.css   |   7 ++
 src/app/playground/playground.html |  15 +++-
 src/app/playground/playground.ts   | 138 +++++++++++++++++++++++++++++++++----
 src/styles.css                     | 138 ++++++++++++++++++++++++++++++++++++-
 8 files changed, 314 insertions(+), 17 deletions(-)
```

`git status --short` (device-node dotfiles of the sandbox filtered out):

```
 M docs/improvements.md
 M package-lock.json
 M package.json
 M projects/mfe-charts/src/styles.css
 M projects/mfe-maps/src/styles.css
 M src/app/playground/playground.html
 M src/app/playground/playground.ts
 M src/styles.css
```

### Sessions
- claude-code c1b3f98b-18a0-4bbe-8a6e-da2bf225b4ec (2026-09-22) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/c1b3f98b-18a0-4bbe-8a6e-da2bf225b4ec.jsonl
