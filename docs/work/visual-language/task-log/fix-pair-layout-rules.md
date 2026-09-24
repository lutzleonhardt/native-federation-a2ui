# Fix: two layout rules for caption/value pairs

### Task
Give model-composed caption/value pairs the two layout rules the "Departure" look was missing —
the value behind a caption renders mono, and a pair whose value is a component takes the whole
facts row — and find out why the `Distance` value of the same detail view renders empty.

### Status
DONE for the two CSS rules; the empty `Distance` was diagnosed, not fixed — its cause is upstream
(see Root Cause). The user closed the register line on that finding; it keeps the upstream fix and
the options for hiding it in the demo. The user's live check (Munich) confirmed the look. No
independent review performed. Checks on the final code: shell tests 119, lint,
Prettier — green (Test Evidence).

### Root Cause
- **Mono values.** The spec's "mono numerals carry every date, distance and count" held inside
  `Timeline` and `Gauge` only: a value in a model-composed surface is a plain `Text` that CSS
  cannot tell from prose — except by its position right after its caption.
- **Component in the facts line.** The model reads "tickets left with the fitting component"
  plus the pair idiom as "the `Gauge` is the value of a Tickets-left pair" — consistent, but
  Task 1's `width: auto` rule then sizes that pair to its content and it hangs in the facts row.
- **Empty `Distance`.** None of the handoff's three candidates. The model's call is right
  (`{ "call": "distance", "args": { "a": { "path": "/me" }, "b": { "path": "/selectedConf" } } }`),
  the renderer resolves both object bindings (`DataContext.resolveSignal` hands a `{ path }` arg
  the data model's signal, objects included), and the catalog invoker returns **0**: the next
  conference near Berlin is `ng-forge-berlin`, and every conference in `conferences.json` sits on
  its city's picker coordinates (`cities.ts`), so the user's city and the conference coincide —
  Munich → `ng-atlas-munich` → 0 as well. `@a2ui/angular` 0.10.5's `TextComponent` then drops the
  falsy result: `text = computed(() => this.props()['text']?.value() || '')`. A `daysUntil` of 0
  (conference today) would vanish the same way. The `String()` coercion in
  `provideMarkdownRenderer` never sees the 0 — the `||` runs before it.

### Files Modified
- `src/theme/a2ui.css` (modified) — rule 1: the `.a2ui-text` of the `Text` whose host follows a
  caption's host gets `--cf-font-data`; rule 2 (inside the Row block): a pair `Column` whose value
  child is not `a2ui-v09-text` gets `flex-basis: 100%`.
- `docs/improvements.md` (modified) — the `Distance` line (from task 1) ticked with the cause,
  the upstream fix and the three options for hiding the 0 in the demo.

### Files Read (Context Only)
- `handoff.md`; `docs/work/visual-language/task-log/task-5-prompt-examples-eval.md` (selector
  probe, pair DOM), `task-1-tokens-fonts-bench.md` (the original distance observation);
  `docs/specs/visual-language.md` §1; `docs/work/visual-language/plan.md` (preamble)
- `src/app/playground/playground.ts` (bench pairs), `src/app/a2ui/provide-a2ui-catalog.ts`,
  `assistant-catalog.ts`, `src/app/agent/tools/render-surface.tool.ts` (client data messages,
  `/me`), `src/app/agent/me-context-entry.ts`, `src/app/domain/location.store.ts`,
  `conference.ts`, `conferences.json`, `cities.ts`, `src/app/chat/chat-header.component.html`
- `projects/mfe-maps/src/maps/distance.fn.ts`, `projects/mfe-charts/src/charts/days-until.fn.ts`,
  `shared/capabilities/catalog-function.ts`
- `node_modules/@a2ui/web_core/src/v0_9/rendering/data-context.js` (`resolveSignal`,
  `evaluateFunctionReactive`), `rendering/generic-binder.js`, `state/data-model.js`,
  `state/surface-model.js`, `catalog/types.js` (the invoker's `schema.parse`),
  `basic_catalog/functions/basic_functions.js`; `node_modules/@a2ui/angular/fesm2022/
  a2ui-angular-v0_9.mjs` (`TextComponent`, `CatalogComponent`, `A2uiRendererService`), its
  `CHANGELOG.md`
- `eval/run-eval.ts`, `eval/scenarios.ts` (probe design)

### Key Decisions
- **Both rules key on a2ui's elements only** (`a2ui-v09-text`, `:not(a2ui-v09-text)`), never on
  `app-gauge`: the shell's CSS may know a2ui's DOM, not a remote's.
- **Rule 1 accepts** that a long prose `Text` placed right after a caption turns mono (handoff:
  values here are city, date, count, price). Size and weight unchanged — only Plex Mono 400 loads.
- **Rule 2 uses `flex-basis: 100%`**, not `width`: it wins over the sibling rule's
  `width: auto !important` for the main size, and `min-width: fit-content` still applies. A pair
  whose value is a nested `Row`/`Column` takes the full row too — accepted. The caption then
  stands as a line heading above the component; the label duplicated inside the gauge is Task 8's
  business.
- **Prettier's shape kept**: it joined the rule-2 selector onto one line (94 chars); the rule-1
  selector stays split across combinators as it was written.
- **`Distance`: no in-tree fix.** Rejected: `distance` returning a string (a contract change that
  hides a renderer bug), never returning 0 (wrong data), a shell-owned `Text` that replaces the
  basic one (an upstream template copied for one character, and `mergeFragments` would have to
  let a basic name through), a `patch-package` on `@a2ui/angular` (an install-pipeline decision),
  venue coordinates in the demo data (a data change that dodges the bug). The upstream fix is
  `?? ''` in `TextComponent`. The user closed the register line on the finding; the options stay
  there should the demo need to hide the 0. No unit test
  added: nothing in this tree is the cause, and a characterization test of upstream behavior
  would only pin the bug.
- **Verification ran in Playwright's Chromium, not the chrome-devtools MCP**: the `webmcp-profile`
  was held by another live Claude session's bridge (`chromium-webmcp` skill: close it or ask —
  neither possible in a background job). `playwright` 1.62.1 resolves from the repo root
  (`node_modules`, not a declared dependency; browsers in `~/.cache/ms-playwright`); headless,
  own profile, run with the sandbox off because the dev servers are unreachable from inside it.

### Review Focus
- **Behavior claims:** (1) Every value `Text` whose host directly follows a caption's host
  computes to IBM Plex Mono; captions unchanged — on the bench (grouped and flat) and in two
  live answers. (2) A pair `Column` whose second child is not a `Text` computes to
  `flex-basis: 100%` and sits on its own line below the facts at 1280 and 390 px, row-wide, no
  horizontal overflow. (3) The empty `Distance` is a 0 that a2ui's `Text` renders as nothing;
  the call and the argument resolution are correct.
- **Plan deviations:** No plan (fix lane). Handoff deviations: verification by Playwright, not
  chrome-devtools (above); TODO 3 "fix where the cause is" → the cause is upstream, no fix.
- **Assumptions / choices:** `:has()` taken as available (every current engine since 2023;
  Task 5 already verified the rule-1 selector live).
- **Scope notes:** `docs/improvements.md` — one line ticked with the finding. The `formatDate`
  prompt change of the same handoff is its own lane (`fix-format-date-pattern`) and stays
  uncommitted here (`agent/src/prompt.ts` in the tree belongs to it).
- **Read next:** `src/theme/a2ui.css` — the two new rules next to the Row block;
  `docs/improvements.md` — the `Distance` line (the options); `node_modules/@a2ui/angular/
  fesm2022/a2ui-angular-v0_9.mjs:823` — the `||`.

### Test Evidence
- Final code: `npm run test:shell` 19 files, 119 passed; `npm run lint` — every project "No
  issues found", sheriff "All projects validated successfully"; `npx prettier --check
  src/theme/a2ui.css` clean (after `--write`).
- Probe 1 (throwaway `probe.mjs` in the job scratchpad, gone with the job): Playwright headless
  Chromium, 1280 × 900, dpr 1, `localStorage conference-finder.city = berlin`,
  `/?capabilities=charts,maps` (panel "charts loaded · maps loaded", picker "Berlin"), request 3
  clicked in the header. Model answer: `Column[Text, Map, Timeline, Divider, Card[Column[h3,
  Row[Column[City, Berlin], Column[Date, 2026-10-06, daysUntil as a caption], Column[Distance,
  ""]], Gauge, Divider, Text, Button]]]`. Pairs: City → "Berlin" IBM Plex Mono, Date →
  "2026-10-06" IBM Plex Mono, Distance → "" — captions IBM Plex Mono as before. The three pair
  Columns at one y at 1280 (widths 54 / 90 / 62) and at 390; `clientWidth` = `scrollWidth` at
  both. Through `ng.getComponent(a2ui-v09-text).rendererService.surfaceGroup`: `/me` =
  `{ Berlin, 52.52, 13.405 }`, `/selectedConf` = `ng-forge-berlin` at 52.52 / 13.405,
  `surface.catalog.invoker('distance', { a: /me, b: /selectedConf })` → `0`. Console: only the
  pre-existing geolocation warning. Bench `/playground`: grouped and flat pairs — all six values
  IBM Plex Mono, captions unchanged (card screenshot viewed).
- Probe 2 (`probe2.mjs`, gone): request 3 again — the model built the `Gauge` as the value of a
  fifth pair (`Column[caption Tickets left, Gauge]`). 1280: the four text pairs at y 430
  (x 225 / 295 / 401 / 486), the gauge pair `flex-basis: 100%`, x 225, width 830 = row width,
  y 503. 390: City / Date / Starts in at y 340, Distance wrapped to y 413, the gauge pair
  width 308 = row width at y 463; `scrollWidth` 390. Card screenshots at both widths viewed:
  "TICKETS LEFT" as a line heading above the gauge, facts line intact.
- User live check (2026-09-24, Munich, `web-meridian Linz` selected): City / Date / In /
  Distance values mono (`Linz 2027-06-30 279 202`), the gauge outside a pair below the facts —
  "sieht auch gut aus in meinem Live-Test".
- Both answers' `distance` call, verbatim: `{"call":"distance","args":{"a":{"path":"/me"},
  "b":{"path":"/selectedConf"}},"returnType":"number"}`.

### Open Issues
- The empty `Distance` stays visible in the demo's main flow (the eval's fixed `ME` is Berlin →
  `ng-forge-berlin`); the register line keeps the options should that matter for the recording.
- The caption "Tickets left" above the gauge duplicates the label inside it (→ Task 8).

### Context for Next Task
- A live-answer probe without the MCP browser: Playwright's Chromium via `createRequire` from
  the repo's `package.json`, sandbox off; in dev builds `ng.getComponent(<a2ui-v09-text>)
  .rendererService.surfaceGroup.surfacesMap` exposes every surface's raw `componentsModel` and
  `dataModel` — the model's exact calls without a network capture.
- The next conference for the eval's and the demo's default city is in that city: any
  "N km away" label there is 0 and invisible until the `Text` bug is handled.

### Git State
`git diff --stat`:

```
 agent/src/prompt.ts  |  4 ++++
 docs/improvements.md |  2 +-
 src/theme/a2ui.css   | 15 +++++++++++++++
 3 files changed, 20 insertions(+), 1 deletion(-)
```

`git status --short` (device-node dotfiles of the sandbox filtered out):

```
 M agent/src/prompt.ts
 M docs/improvements.md
 M src/theme/a2ui.css
?? docs/work/visual-language/task-log/fix-format-date-pattern.md
?? docs/work/visual-language/task-log/fix-pair-layout-rules.md
?? handoff.md
```

`agent/src/prompt.ts` and `fix-format-date-pattern.md` belong to the other lane; `handoff.md` is
the handoff, not part of either commit.

### Sessions
- claude-code 2b8fc760-17f3-42f2-b43e-c21875a383f1 (2026-09-24) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/2b8fc760-17f3-42f2-b43e-c21875a383f1.jsonl
