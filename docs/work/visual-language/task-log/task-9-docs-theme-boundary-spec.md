# Task 9: Docs — theme across the federation boundary, spec follow-ups, register

### Task
Document the Departure look where the next reader looks: the styling zones and their owners, the
theme rule across the federation boundary and the two widget invariants in `docs/architecture.md`;
two corrected sentences in the tour; the design milestone and display name in `docs/spec.md` (both
sides); the visual-language spec set to implemented with its open points settled.

### Status
DONE. Documentation only, no production file changed. No independent review performed yet — the
log is ready for `/review quick`. The quick functional check (grep over the two doc bodies) and the
two-sided spec diff are green; Prettier state of the four files is unchanged from HEAD.

### Files Modified
- `docs/architecture.md` (modified) — "How to read": one sentence and one table row for the styling
  zones; new sub-section "Styling zones" at the end of "Layers and ownership" (five zones with owner
  and channel, the shell's stylesheet manifest, the load-order pointer, what a standalone page
  re-declares); new bullet "The theme crosses the boundary as custom properties, never as CSS" under
  "Federation and boundaries"; new invariant group "Theme and widgets" (`color-scheme: only light`
  with its reason; the Timeline as one uniformly scaled SVG with the two layout deciders); "Status
  and history": one bullet for this scope and the look's spec next to `docs/spec.md`.
- `docs/how-it-works.md` (modified) — the demo's step 2 names the panel's *Switch on* link; "A
  remote is down" describes the chips (_loaded_, _unreachable_, _off_) and the panel behind
  _Details_ instead of "_not selected_".
- `docs/spec.md` (modified, German) — §8: the paragraph "Visuelle Sprache „Departure" (zwischen M2
  und M3)" between M2 and M3; the M3 MapLibre sentence points at `docs/specs/visual-language.md`,
  Abschnitt 8.3; §9 E1: display name **Conference Finder** for title and header, project name
  unchanged.
- `~/projects/a2ui/docs/spec/spec-federated-capabilities.md` (outside this repo, overwritten) —
  the mirrored copy, now byte-identical to `docs/spec.md` (see Key Decisions).
- `docs/specs/visual-language.md` (modified) — status line "implemented, 2026-09-25 (draft v1,
  2026-09-19)"; §10: the caption/value grouping and the CopilotKit slot-class finding recorded as
  settled, the English demo content as done; §10a: the bench sentence updated and the user
  decision "a look, not a diff" in place of the screenshot ritual.

### Files Read (Context Only)
- `docs/improvements.md` (both entries the task names are ticked: the Timeline half of the
  collision entry, line 7, and the text-contrast entry, now line 31 — nothing to change)
- `shared/theme/tokens.css`, `src/styles.css`, `src/theme/a2ui.css`, `src/theme/copilotkit.css`,
  `projects/mfe-charts/src/styles.css`, `projects/mfe-maps/src/styles.css`, `angular.json`
  (`styles` entries, lines 77/208/339) — the theme facts the doc states
- `projects/mfe-charts/src/charts/gauge.component.css`, `timeline.component.css` (alias blocks, the
  host width comment, the `@container (width < 813px)` rule), `timeline.component.ts` (`layout`,
  `data-layout` host binding), `timeline-labels.ts` (`labelsFit`), `gauge.component.spec.ts`
- `src/app/chat/chat.page.html`, `chat-header.component.html`, `location-picker.component.html`,
  `capability-panel.component.{html,ts}` (chip and toggle wording), `src/index.html` (`<title>`)
- `docs/work/visual-language/plan.md` (preamble and this block), task logs task-8 (predecessor),
  chore-shared-theme, docs-visual-language-spec; grepped task-1 (`color-scheme`), task-6 (viewBox
  and container decisions), task-7 (the estimate rule)

### Key Decisions
- **The theme invariant says "even in a host that declares no `--cf-*`", not "from fallbacks alone"
  (user question, 2026-09-25).** The plan's wording predates the shared token file
  (chore-shared-theme, 2026-09-24): since then each remote's standalone stylesheet imports
  `shared/theme/tokens.css`, so on the standalone page the tokens are defined and the fallback
  never fires. The fallback is the portability guarantee — a remote inside a host that carries no
  tokens still renders the Departure look — and that is what the doc states. The chore log's
  reason for keeping the fallbacks ("the standalone stylesheet never loads inside the shell") is
  not the operative one either: inside the shell the shell's own import defines the tokens.
- **The a2ui copy was overwritten wholesale, not edited in parallel (user, 2026-09-25).** The
  copy at `~/projects/a2ui/docs/spec/spec-federated-capabilities.md` still stood at v3.2
  (2026-08-27): the four local commits since (the v3.3 re-scope, and the task-3, task-6 and task-9
  edits of the M1/M2 scopes) were never mirrored. It contained nothing the local file lacks (its
  one later line, the `daysUntil`/`formatString` clarification, is in the local file too), so the
  edited local file replaced it; `diff` is empty. Applying only the two edits to the stale copy
  would have kept the drift and failed "identically". The a2ui repository has no commit yet and
  `docs/` is untracked there; committing it is the user's step, outside this scope.
- **Two stale sentences in the visual-language spec fixed beyond the task's list.** §10's
  "Later — English demo content" was done on 2026-09-22 (M2's task 9), and §10a's "It lacks what
  this work styles: extend its sample …" was done by the first task of this scope; a spec whose
  status says implemented must not carry either. Kept to one bullet and one clause.
- **`docs/spec.md` keeps "Entwurf v3.3" and gets no new E-row.** The two edits are additions
  inside the existing structure, not a re-scope; E8 documents re-scopes, not milestones.
- **Styling zones live as a `###` inside "Layers and ownership".** The "how to read" map needs an
  anchor, and the zones are ownership material — the same question the section already answers
  for packages. The chat-side renderers are listed under shell chrome (grouped by owner), where the
  visual-language spec's zone table lists them on their own row.
- **"Theme and widgets" is a new invariant group.** The existing groups are named by the area a
  change touches; a stylesheet change touches none of them. Two rules only, as the task names; the
  gauge's `data-level` appears in one clause because the task-8 log handed it over for the docs
  and it has the same contract shape as `data-layout`.
- **The CopilotKit load-order invariant stays canonical in `src/theme/copilotkit.css`.** The
  architecture doc points at that header in one sentence instead of restating the `@layer`
  argument (one canonical location per invariant).
- **The status bullet carries dates, never task numbers**, and the eval figures stay where the
  2026-09-24 bullets already hold them (the task-5 log asked that they not be copied).

### Review Focus
- **Behavior claims:** (1) From `docs/architecture.md` alone a reader can name, for each of the
  five styling zones, who renders it and through which variables or classes the look reaches it,
  and can state why a remote component carries a fallback per token. (2) `docs/spec.md` and the
  a2ui copy are byte-identical, and both name the design milestone between M2 and M3 and the
  display name "Conference Finder". (3) The bodies of the architecture doc and the tour contain no
  task number, AC ID or plan reference.
- **Plan deviations:** "renders the same look from fallbacks alone" → "renders the Departure look
  even in a host that declares no `--cf-*`" → the standalone page imports the token file since
  2026-09-24 (Key Decisions). "Change both sides identically" → the a2ui copy was replaced by the
  edited local file → it was two months stale. Spec §10/§10a → one done-bullet and one bench
  clause beyond the three listed edits → stale sentences under an "implemented" status.
  `docs/improvements.md` → untouched → both entries were already ticked (the plan's line 28 is now
  line 31).
- **Assumptions / choices:** the tour's chrome wording ("chip", "_off_", "_Details_", "_Switch
  on_") is taken from `capability-panel.component.{html,ts}`; "the few rules those variables do not
  reach" summarises `src/theme/a2ui.css` without listing them; the German milestone paragraph
  condenses the plan's scope sentence and the spec's §1 into the look's four traits.
- **Scope notes:** one file outside this repository (the a2ui copy). `README.md` untouched, as the
  task says. No production file touched.
- **Read next:** `docs/architecture.md` "Styling zones" (the table's channel column — each cell is
  a claim about a file) and the theme bullet under "Federation and boundaries" (the fallback
  reasoning that replaced the plan's wording); `docs/spec.md` §8, the new paragraph, against
  `docs/specs/visual-language.md` §1 and §3 (is the look described with the spec's own words);
  `docs/specs/visual-language.md` §10 second and third bullets (the CopilotKit list matches the plan
  preamble and the improvements entry on the dead `assistantMessageClass`).

### Test Evidence
Docs only; no test suite touches these files.

- Quick functional check:
  `grep -n 'Task [0-9]\|T[0-9]-AC\|plan\.md' docs/architecture.md docs/how-it-works.md` → no
  output, exit 1 (the same as at HEAD; "Status and history" starts at line 542 and holds none
  either).
- Two-sided spec: `diff docs/spec.md ~/projects/a2ui/docs/spec/spec-federated-capabilities.md` →
  empty, "IDENTICAL". Before the task the same diff showed the v3.2/v3.3 gap (about 60 changed
  lines) — the copy was checked against `git show 2813550:docs/spec.md` (the initial version,
  one line apart) before the overwrite decision.
- `npx prettier --check` on the four files: `docs/how-it-works.md` clean (clean at HEAD too);
  `architecture.md`, `spec.md`, `specs/visual-language.md` warn — identical to HEAD, pre-existing,
  not reformatted.
- Headings and anchors: `grep -n '^##' docs/architecture.md` shows `### Styling zones` (348) and
  `### Theme and widgets` (509); the two new map links target real headings.
- Facts checked against the code before writing: `color-scheme: only light` appears once, in
  `shared/theme/tokens.css` with the light-dark comment; the charts and maps standalone stylesheets
  import that file and nothing from `src/`; `src/styles.css` imports tokens, A2UI zone, CopilotKit
  zone in that order; `angular.json` loads CopilotKit's stylesheet before `src/styles.css`;
  `timeline.component.css` — viewBox 832 units, `@container (width < 813px)`, `data-layout`
  forced hook; `labelsFit` is a pure function over `LabelBlock[]` in viewBox units; the panel's
  chip label is `'off'` for `unselected`, its links read "Switch on"/"Switch off", the summary
  toggle "Details"; `<title>` and `<h1>` read "Conference Finder".
- Sandbox: the first `cp` into `~/projects/a2ui` was refused (read-only file system outside the
  working directory) and re-run with the sandbox off; the diff above ran after it. No temporary
  files in either tree.

### Acceptance Coverage
- T9-AC-01 — partial: manual — the "Styling zones" table names owner and channel per zone and the
  federation bullet states the fallback rule; no automated check can judge "a reader can tell"
  — the reviewer's read is the check.
- T9-AC-02 — passed: `diff` between `docs/spec.md` and the a2ui copy is empty; §8 and §9 E1 carry
  the milestone paragraph and the display name (Git State shows the six-line `spec.md` diff).
- T9-AC-03 — passed: the quick-check grep over both bodies returns nothing.

### Open Issues
None. The visual items still open (NF mark as SVG, the tablet and sub-360-px header rules, the gauge
caption duplicate, the disabled-button colours, the multi-year month axis, the rail edge clip) are
in `docs/improvements.md` already; nothing new was promoted.

### Context for Next Task
- This closes the `visual-language` scope; the next scopes are `publication` (rewrites
  `README.md`, deliberately left alone here) and M3 (`reserve`, MapLibre with the map kit in
  spec §8.3, hosting).
- `docs/spec.md` and `~/projects/a2ui/docs/spec/spec-federated-capabilities.md` are in sync as of
  2026-09-25; every future edit to the spec goes to both, and the a2ui side is uncommitted (repo
  without a first commit, `docs/` untracked).
- The architecture doc now has a fifth invariant group, "Theme and widgets", and a "Styling zones"
  sub-section; a future zone (the map after MapLibre) gets a row there and its channel.
- The theme's fallback rule as documented: token file imported by shell and standalone pages, the
  alias fallback is for a host without `--cf-*` — the earlier logs' wording ("from fallbacks
  alone") is superseded.

### Git State
`git diff --stat`:
```
 docs/architecture.md          | 67 +++++++++++++++++++++++++++++++++++++++++--
 docs/how-it-works.md          | 13 +++++----
 docs/spec.md                  |  6 ++--
 docs/specs/visual-language.md | 33 ++++++++++++---------
 4 files changed, 95 insertions(+), 24 deletions(-)
```
`git status --short`:
```
 M docs/architecture.md
 M docs/how-it-works.md
 M docs/spec.md
 M docs/specs/visual-language.md
?? docs/work/visual-language/task-log/task-9-docs-theme-boundary-spec.md
```
Outside the repo: `~/projects/a2ui/docs/` untracked (`?? docs/`), the spec copy overwritten.

### Sessions
- claude-code aed2dfae-a97d-4a79-bf72-93b02b608611 (2026-09-25) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/aed2dfae-a97d-4a79-bf72-93b02b608611.jsonl
