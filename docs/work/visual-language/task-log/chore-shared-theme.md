# chore-shared-theme

### Task

Split the shell's global stylesheet into a token file shared with the remotes, an A2UI zone file and
a CopilotKit zone file, and let both remotes' standalone pages read the shared tokens.

### Status

DONE. Pure restructuring plus a ten-line harness change; no component or runtime contract changed.
No independent review performed (the diff is a verbatim move, verified by declaration parity, the
unit suites and a look at all three pages). Ready for `/commit fix`.

### Root Cause

Not a defect. After Task 4, `src/styles.css` carried three responsibilities in 324 lines: the
`--cf-*` tokens, the A2UI mapping and rules, and a 176-line CopilotKit block. The token block lived
only in the shell, so a remote's standalone page could copy literals at best (`#edf1f4`, the system
font stack) and drifted from the theme: no Archivo, no shared ground value.

### Files Modified

- `shared/theme/tokens.css` (new) — the remotes' contract: the two `@fontsource` imports and the `:root` token block (`color-scheme: only light`, every `--cf-*` token), moved verbatim from `src/styles.css`.
- `src/theme/a2ui.css` (new) — the `--a2ui-*` mapping in its own `:root`, plus the caption, button and row rules; moved verbatim.
- `src/theme/copilotkit.css` (new) — the CopilotKit block moved verbatim, header comment included (canonical place for the `angular.json` load-order invariant).
- `src/styles.css` (modified) — now the manifest: three `@import`s in cascade order, then the `html`/`body`/`app-root` base rules.
- `projects/mfe-charts/src/styles.css`, `projects/mfe-maps/src/styles.css` (modified) — import the shared tokens; ground and font via `var(--cf-*)` instead of literals.
- `docs/work/visual-language/plan.md` (modified) — one amendment sentence on the "theme is custom properties" bullet (tokens live in the shared file; components keep their fallbacks).

### Files Read (Context Only)

- `handoff.md` (the prior session's line-exact split instructions), `angular.json` (the three `styles` entries, lines 77/208/339, unchanged)
- `src/app/agent/tools/message-widget.component.spec.ts` (the `--cf-sub` fill assertion that probes the token chain)
- `shared/package.json`, `projects/mfe-charts/src/capability.ts` (the existing relative-path pattern across the federation boundary)
- `docs/work/visual-language/task-log/docs-visual-language-spec.md` (lane log format)

### Key Decisions

- **Shared file, not host CSS.** The remotes import `shared/theme/tokens.css`, the same cross-boundary pattern as the TS contracts under `shared/`. The plan's rule "a remote never imports host CSS" still holds: the shell's `src/styles.css` and the zone files stay the shell's. Copying the token block into each remote was rejected because it is exactly the literal drift this chore removes.
- **A2UI and CopilotKit deliberately not shared.** A remote's standalone page renders neither library in the shell's sense (the charts and maps pages use a plain A2UI host with A2UI's own defaults, and no chat), so the two zone files live under `src/theme/` and are the shell's alone.
- **Components keep their fallbacks.** Inside the shell a remote's own `styles.css` never loads, so the private aliases `var(--cf-x, <value>)` in remote components stay; the shared file only serves the standalone pages. Recorded in the plan amendment and in the header of `tokens.css`.
- **Zone order = cascade order.** The manifest imports tokens, then A2UI, then CopilotKit; the base rules follow because CSS requires `@import`s first. The shell bundle stays unlayered, so it keeps winning over CopilotKit's `@layer` utilities; only CopilotKit's unlayered variable block depends on `angular.json` loading its stylesheet first, which is unchanged.
- **Comments moved verbatim.** The CopilotKit header still says "this block wins by order"; it now names the file, which reads correctly. The A2UI file got a two-line header, the token file a header stating the contract.
- **`plan.md` left as prettier finds it.** `npx prettier --check` fails on the plan already at HEAD (aligned comments inside a fenced token block, not the amended line); reformatting it is unrelated to this chore.

### Review Focus

- **Behavior claims:** (1) The shell renders exactly as after Task 4: Archivo body font, ground `#edf1f4`, `--cpk-container-3xl` resolves to `55rem` and the chat column measures 880 px. (2) The standalone pages at 4201 and 4202 now render in Archivo on the token ground with `color-scheme: light only`, all via `var(--cf-*)`. (3) The three new files plus the manifest contain the same 88 custom-property declarations as the old `src/styles.css`.
- **Plan deviations:** No plan (fix lane). The handoff was followed line by line.
- **Assumptions / choices:** the bare `@fontsource` imports resolve from `shared/theme/` through the workspace `node_modules` (verified: both remote bundles carry the eight `@font-face` rules).
- **Scope notes:** None. `angular.json` untouched; no component file touched.
- **Read next:** `src/styles.css` (the manifest — the import order is the only thing that could go wrong); `shared/theme/tokens.css` header (the contract sentence); `projects/mfe-charts/src/styles.css` (the relative depth `../../../shared/`).

### Test Evidence

— session 2026-09-24

- Declaration parity: `grep '^\s*--[a-z0-9-]+:'` over the old `src/styles.css` vs. the three new files, sorted — identical, 88 declarations.
- `npx prettier --check` on the six CSS files: clean. On `plan.md`: warns, but `git show HEAD:… | prettier --check` warns identically (pre-existing, see Key Decisions).
- `npm run lint`: all projects validated, no issues.
- `npm run test:shell`: 19 files, 119 passed (includes the `--cf-sub` fill probe in `message-widget.component.spec.ts`). `npm run test:charts`: 18 passed. `npm run test:maps`: 10 passed.
- Served bundles (dev servers 4200/4201/4202 running outside the sandbox, no restart needed): all three contain `color-scheme: only light`, `--cf-ground: #edf1f4`, `Archivo Variable` and eight `@font-face` rules; the shell bundle additionally the `--a2ui-*` set and `--cpk-container-3xl`.
- Browser (chrome-devtools, `getComputedStyle`): 4200 body font `"Archivo Variable", system-ui, sans-serif`, background `rgb(237, 241, 244)`, `--cpk-container-3xl` = `55rem`, chat column 880 px, fonts loaded: Archivo Variable, IBM Plex Mono. 4201 and 4202: same font and background, `color-scheme: light only`, `--cf-rail` = `#2b5fa8`. Screenshots looked at for all three pages; no visual change on the shell.
- No temporary probes in the tree.

### Open Issues

None.

### Context for Next Task

- Task 9 (theme documentation across the federation boundary) should name `shared/theme/tokens.css` as the remotes' contract and the two zone files under `src/theme/` as the shell's.
- Gotcha: only `angular.json` changes need a dev-server restart; new files reached through `@import` are picked up live.

### Git State

`git diff --stat`:

```
 docs/work/visual-language/plan.md  |   2 +-
 projects/mfe-charts/src/styles.css |  12 +-
 projects/mfe-maps/src/styles.css   |  12 +-
 src/styles.css                     | 312 +------------------------------------
 4 files changed, 16 insertions(+), 322 deletions(-)
```

`git status --short`:

```
 M docs/work/visual-language/plan.md
 M projects/mfe-charts/src/styles.css
 M projects/mfe-maps/src/styles.css
 M src/styles.css
?? handoff.md
?? shared/theme/
?? src/theme/
```

(`handoff.md` is the temporary handoff document and is not part of the commit.)

### Sessions

- claude-code 72b6050c-a32c-4bb8-aa6a-9a166bf34339 (2026-09-24) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/72b6050c-a32c-4bb8-aa6a-9a166bf34339.jsonl
