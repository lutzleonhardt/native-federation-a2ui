# docs-visual-language-spec

### Task
Write the visual-language spec "Departure" and add the design frames it refers to.

### Status
DONE. Extended in a second session after the spec was checked against the code; the user decided
the open points in both sessions. No independent review performed. The second contribution is
folded into the first commit by amending it (user request; the commit was not pushed).

### Root Cause
Not a defect — the origin of the work: the app had no visual design (`src/styles.css` is 19 lines,
all other styling is inline per component, the remotes hard-code their colours) and `docs/spec.md`
never mentions appearance, while its §13 needs screenshots and a GIF for Post 2. The look therefore
needs its own spec, and it has to land before M3 captures replay recordings, because part of it
changes prompt examples and with them the model output.

### Files Modified
- `docs/specs/visual-language.md` (new) — the spec: styling zones, decisions, tokens, library mapping, chrome, primitives, widgets, acceptance, key measures.
- `docs/design/departure/desktop-1280.png`, `phone-390.png`, `desktop-panel-open.png`, `tokens-kit.png` (new) — the four frames of direction A at 1:1 CSS pixels.
- `docs/design/departure/nf-logo.png` (new) — source of the Native Federation mark (spec D5).
- `docs/improvements.md` (modified) — three promoted items: replace the PDF-derived frames with clean renders; English demo content; the doubled "Thought for…" line.

### Files Read (Context Only)
- `docs/spec.md` (§0, §4, §8, §8b, §9, §11–13), `docs/work/m2-nf-split/plan.md`, `docs/improvements.md`
- `src/styles.css`, `src/app/chat/chat.page.html`, `src/app/chat/capability-panel.component.{ts,html}`, `angular.json` (order of `styles`)
- `projects/mfe-charts/src/charts/timeline.component.{ts,html}`; gauge and map components by grep only
- `agent/src/prompt.ts` (how surfaces are composed — by the model, from a flat component list)
- `node_modules/@a2ui/angular/fesm2022/*.mjs` (custom properties, selectors, button classes), `node_modules/@copilotkit/angular/dist/styles.css` (scope of the theme variables)
- Claude Design exports outside the repo: two PDFs and the HTML bundle in `~/Downloads`
- Second session: `src/app/agent/tools/message-widget.component.{ts,html}`, `surface-tool-renderer.component.{ts,html}`, `src/app/chat/location-picker.component.{ts,html}`, `src/app/chat/chat.page.ts`, `src/index.html`, `src/app/playground/playground.ts`, `node_modules/@a2ui/web_core/src/v0_9/basic_catalog/styles/default.js`, `node_modules/@copilotkit/angular/dist/fesm2022/copilotkit-angular.mjs`, and the selectors used by the timeline, gauge, panel and chat-page specs

### Key Decisions
Design decisions and their rejected alternatives live in the spec and are not repeated here: section
3 (D1–D9, rejected directions B and C), 8.1 (rail/board rule, DOM measuring rejected), 8.2 (gauge
levels), 10 (open, later). This log keeps what is about the process.

- **Own spec, own plan, own branch — a milestone between M2 and M3.** Not a Task 9 in M2: that plan
  scopes itself to the NF split, and the design is five to seven commits. Not inside M3: M3 already
  holds about ten tasks, and the prompt-example change must precede its replay capture.
- **Committed on `feature/visual-language`, cut from the M2 tip — not on `main`, not in M2.** `main`
  is a strict ancestor of `feature/m2-nf-split` (`0 9`); a commit on `main` would cost M2 its
  fast-forward and force a rebase of an already pushed branch. Inside M2 it would put a foreign spec
  and 1.4 MB of images into that scope's review. After M2 has merged: `git rebase main` replays this
  one docs commit.
- **`/plan` deliberately not run yet.** The last design task extends `docs/architecture.md`, which M2
  Task 8 is about to rewrite; key locations have to be resolved against the refreshed document.
- **The reference is images plus a key-measures table, not the HTML export** (user preference). The
  export is plain markup with inline styles and no classes, and the spec snaps its values to a scale
  anyway; an image costs a fresh session far less context and is what a screenshot gets compared to.
- **Frames come from the PDF export** (`pdftoppm -r 96`, which yields exactly 1280 × 1900 etc.):
  headless Chromium cannot run inside the sandbox, and the unsandboxed run was declined. Hence the
  glitches the spec names.
- **Wrap-up through the fix lane with a `docs-` stem.** It gives a spec session a log and a
  transcript archive without plan ceremony; the design rationale stays in the spec so that each
  decision has one canonical place.

User decisions taken in this session, all recorded in the spec: direction A; mobile variant;
collapsible capability panel; calendar postponed; MapLibre stays an M3 task; self-hosted fonts; the
eyebrow text; no CSS framework; three gauge levels; images over HTML.

— session 2026-09-19 (spec checked against the code)

- **The review read the code, it did not run the app.** Every finding is a fact from a source file
  or from `node_modules`; nothing was confirmed in a browser. The spec's new section 10a names the
  bench for that.
- **Findings went into the spec, not into this log**: the dark-mode root cause (D7), the
  authoritative A2UI variable list and the caption hook (section 5), CopilotKit's slot classes,
  column width and input layout (sections 5 and 6), the two chat-side renderers (7.1), the location
  picker's select state (6), the A3 risk (7), the verification bench (10a).
- **Amended instead of a second commit**, at the user's request: the first commit was local only,
  and one commit keeps the later `git rebase main` to a single replay.

User decisions of this session, recorded in the spec: English throughout, including the text
components generate, with the German demo content to follow later (D9, section 10); add-file and
microphone buttons hidden (section 6); no keyboard or ARIA work (D10 — supersedes the focus state
and the keyboard clause of acceptance 6 from the first session); an 880 px chat column (section
5); the Native Federation mark as favicon, because the demo goes onto the official NF site (D5).

### Review Focus
- **Behavior claims:** docs only — (1) every library claim in spec section 5 was checked against `node_modules`, not recalled; (2) the spec names every place in the shell and the remotes that carries its own styles, either as a zone or as out of scope; (3) the spec is sufficient input for `/plan`: zones, tokens, key measures, acceptance 1–20, verification bench.
- **Plan deviations:** No plan (fix lane)
- **Assumptions / choices:** the seven-step type scale and the two gauge level colours are proposals to settle on screen; the 0.6 em label-width estimate was checked by hand for the seven items of request 1 only (narrowest gap about 5.5 viewBox units, between "ng-foundry Wien" and "ng-harbor Kopenhagen") and has not run as code; the container-query threshold depends on the final `viewBox`.
- **Scope notes:** `docs/spec.md` is untouched — its follow-ups are listed in spec section 11 because that file is mirrored in the a2ui repo. Whether CopilotKit's slot class inputs are exposed on `copilot-chat` itself was not checked; the spec marks it open.
- **Read next:** spec §2 (the zone table every task inherits — a drawn answer layout is an illustration, not a contract); D7 (`color-scheme: only light` and why it is not optional); §8.1 (the rail/board rule and the fixed-`viewBox` invariant it rests on).

### Test Evidence
Docs only, no test run. Checks made during the session:

- `@a2ui/angular`: the listed `--a2ui-*` names exist; selectors include `a2ui-v09-card` and `a2ui-v09-divider`; `Column` and `Row` expose `--a2ui-column-gap` / `--a2ui-row-gap` only; `.a2ui-button.borderless` and `primary` exist.
- `@copilotkit/angular/dist/styles.css`: theme variables on `[data-copilotkit]`, dark values under `.dark [data-copilotkit]`, no `prefers-color-scheme` block, `--radius: 0.625rem`.
- `angular.json`: `src/styles.css` precedes CopilotKit's stylesheet in `styles`.
- npm registry: `@fontsource-variable/archivo` 5.3.0 and `@fontsource/ibm-plex-mono` 5.3.0, both OFL-1.1.
- `git rev-list --left-right --count main...feature/m2-nf-split` → `0 9`.
- Frame sizes: 1280 × 1900, 390 × 1660, 640 × 2140, 1280 × 1900.
— session 2026-09-19 (spec checked against the code)

- `@a2ui/web_core/.../styles/default.js`: `:where(:root) { color-scheme: light dark; }`; `--a2ui-color-on-background: light-dark(#333, #eee)`; font sizes derived from `--a2ui-font-size: 1rem` and `--a2ui-font-scale: 1.2`; injected through `document.adoptedStyleSheets`.
- `@a2ui/angular` `TextComponent`: no `ViewEncapsulation` override in the bundle; caption rule is `.a2ui-text.caption` with `--a2ui-font-size-xs` and `--a2ui-text-caption-color, light-dark(#666, #aaa)`.
- `@copilotkit/angular`: `.cpk\:max-w-3xl { max-width: var(--cpk-container-3xl) }` with `--cpk-container-3xl: 48rem`; class inputs found by name (`userMessageClass`, `assistantMessageClass`, `reasoningMessageClass`, `inputContainerClass`, `featherClass`, `disclaimerText`, `addFileButtonClass`, `startTranscribeButtonClass`, …); the reasoning label is `Thinking…` / `Thought for …`.
- `src/index.html`: `lang="en"`, `<title>Shell</title>`, `favicon.ico`.
- `docs/improvements.md`: the A3 entry ("on the gate without slack") and the text-contrast entry.
- German strings remain in `example-prompts.ts`, `eval/scenarios.ts`, `agent/src/prompt.ts`, `gauge.schema.ts`, the playground pages and several specs.
- Temporary probes: the scripts that unpacked the HTML export ran in the session scratchpad only. Four cleaned HTML frames were placed in `docs/design/departure/` for a moment and removed again; nothing of either is in the tree.

### Open Issues
- The follow-ups in `docs/spec.md` (milestone line in §8, display name in §9 E1) and the undecided repository rename are listed in spec section 11 (→ `/plan` on this branch).
- The NF mark needs an SVG — spec section 10, a user action; its use is settled.
- Promoted: the frames carry the PDF export's text-fitting glitches (→ improvements register).
- Promoted: the demo content is still German and its translation needs an eval run (→ improvements register).
- Promoted: "Thought for…" appears twice per answer (→ improvements register).

### Context for Next Task
- Order: finish M2 Task 8 on `feature/m2-nf-split`, merge M2 into `main`, then `git switch feature/visual-language && git rebase main`, then `/plan docs/specs/visual-language.md` with `Predecessor: m2-nf-split`.
- Rough slicing from both sessions, for `/plan` to verify: tokens, fonts, `color-scheme` and library mapping, with the playground bench · header, location picker, `<title>` and favicon · capability panel · chat frame and the two chat-side renderers · agent primitives (CSS only) · prompt examples with an eval run (the only task outside CSS, kept revertible; the English switch can share its run) · timeline rail · timeline board with the fit rule · gauge · architecture doc (theme across the federation boundary). That is past eight — expect `/plan` to merge some.
- The map is out: its kit (spec 8.3) feeds the M3 MapLibre task, and the tokens must exist before that task.
- Two register entries close with this work: the Timeline half of the label-collision entry and the text-contrast entry in `docs/improvements.md`.
- Sandbox gotcha: inside the sandbox `git status` lists dotfiles such as `.bashrc` and `.gitconfig` in the repo root; they are device-node mount points of the sandbox, not files.

### Git State
Before the amend, on `feature/visual-language` (`3a90945` holds the first contribution).

`git diff --stat`:

```
 docs/improvements.md          |   2 +
 docs/specs/visual-language.md | 165 ++++++++++++++++++++++++++++++++----------
```

`git status --short -- docs/` (limited to `docs/` because of the sandbox gotcha above):

```
 M docs/improvements.md
 M docs/specs/visual-language.md
 M docs/work/visual-language/task-log/docs-visual-language-spec.md
```

### Sessions
- claude-code 034bb080-cb52-449d-9533-c9628228e056 (2026-09-19) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/034bb080-cb52-449d-9533-c9628228e056.jsonl
- claude-code 6e189df4-11bc-4a06-8f0e-495a9868943e (2026-09-19) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/6e189df4-11bc-4a06-8f0e-495a9868943e.jsonl
