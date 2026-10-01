# Task 6: Docs — reserve, replay, map zone, spec

### Task

Bring the documentation up to M3: the reserve click without the model, the agent modes with the
recordings, MapLibre, the deploy layout, the four badges and the ownership rule across the
federation boundary — in `docs/architecture.md`, `docs/how-it-works.md`, `docs/spec.md` (v3.5),
`docs/specs/visual-language.md` §8.3 and `docs/improvements.md`. Documentation only.

### Status

DONE — implementation and task-local verification complete. A Codex quick review ran before this
log existed (so without it as intent context); its four points were triaged with the user: two
fixed, one declined, one answered by this log. No further review is pending. T6-AC-01 is a
reading criterion that only the user's read can confirm; the user announced a closer pass over
`docs/how-it-works.md` afterwards.

### Files Modified

- `docs/architecture.md` (modified, 600 → 935 lines) — "How to read" rows and lead; *Big picture*
  diagram (`ReplayAgent`, reserve handler, `ConferenceStore`, `filterWithinKm`, the deploy
  manifest) and capability table; boot step for the agent mode, `createAppConfig(remotes, agent)`
  and the one-place wiring rule; guard list (client-owned `/selectedConf`, the selection rule as
  guard 4); new runtime sections "A click, without the model" and "Agent modes: local and
  replay" (the modes, what can be asked live, the recordings file, how a turn is played, the
  recorder and the capture procedure); *Layers and ownership*: `ReplayAgent` in Transport, a "Map
  drawing" row, seam bullets (`A2uiActionBus`, the `@a2ui/angular` patch, `MAP_RESOURCES`,
  `recolour`, the deploy script); new "Who ships what"; the `Map` row of *Styling zones*;
  invariants: the fixed selection path, `binding()`'s three shapes, schemas without `$ref`, "an
  answer's structure is the record", a new group "Replay and recordings", the popup-free map and
  the offline-map/testing-folder rule; new "Development and deployment"; *Status and history*: M3,
  the 2026-09-29 eval gate, what was not built, next.
- `docs/how-it-works.md` (modified, 438 → 495 lines) — `filterWithinKm` in the three catalog
  examples; the two-step demo on badge 2; MapLibre in two sentences; the version note now names
  the recordings as stored surfaces; the slider as a control without the LLM; reserving and "what
  can a team ship" at the end of "What happens on a click"; new section "The hosted demo is a
  recording".
- `docs/spec.md` (modified) — status v3.5; §2 rewritten to the four badges with what each proves,
  request 4 as the Button click, the live moment on badge 2; §3.1 badge line and `filterWithinKm`;
  §3.7 `build:deploy` instead of `capture`; §3.8 and §4 MapLibre, the `filterWithinKm` row, the
  three prop shapes; §7 the three rows (recorded tool calls, the four eval cells, the slider
  case); §8 M3; §8b.1 marked as realised inside `mfe-maps`; §9 E10–E12; §12 criteria 1, 2, 4, 6.
- `docs/specs/visual-language.md` (modified) — §8.3 status: implemented, the popup dropped.
- `docs/improvements.md` (modified) — the reservations entry sharpened (two variants, deferred);
  the ownership entry ticked; pointers on the two README entries (agent modes, model dependence)
  to their new homes; two new entries from this wrap-up (third-party glyph host against the
  visual-language spec; the spec's header line).

### Files Read (Context Only)

- `docs/work/m3-reserve-maps-hosting/plan.md` (preamble, Task 6), `task-log/task-5-*.md` in full,
  the hand-off passages to Task 6 in the logs of Tasks 1, 2, 3, 3.5, 4 and 4.5 (by `rg 'Task 6'`).
- `docs/work/publication/plan.md` (Task 1 instructions, on the user's question about the README).
- `src/main.ts`, `src/bootstrap.ts`, `src/app/app.config.ts`, `src/app/agent/agent-mode.ts`,
  `assistant-agent.token.ts`, `init-agent-store.ts`, `render-failure-correction.ts`,
  `surface-data.store.ts`, `tools/render-surface.tool.ts`; `src/app/replay/recordings.ts`,
  `replay-agent.ts`, `paced-run.ts`, `recorder.ts`, `recordings-file.spec.ts` (test names);
  `src/app/a2ui/reserve-handler.ts`, `action-bus.ts`, `provide-a2ui-catalog.ts`,
  `surface-host-rules.ts`, `catalog-context.ts`; `src/app/domain/conference.store.ts`,
  `location.store.ts`, `find-conferences.schema.ts`; `src/app/chat/example-prompts.ts`,
  `chat-header.component.html`, `capability-panel.component.html`, `location-picker.component.html`,
  `chat.page.recorded.spec.ts` (head, test names); `src/environments/*`; `src/theme/copilotkit.css`
  (grep).
- `shared/capabilities/binding.ts`, `surface-action.ts`; `projects/mfe-maps/src/maps/vocabulary.ts`,
  `filter-within-km.fn.ts`, `map-resources.ts`, `map-style.ts`, `map.component.ts`,
  `map.component.css`, `src/testing/offline-map.ts`, `federation.config.mjs`.
- `agent/src/prompt.ts` (sections), `scripts/build-deploy.mjs`, `angular.json` (deploy),
  `package.json` (scripts), `tsconfig.app.json`, `patches/@a2ui+angular+0.10.5.patch`,
  `public/recordings.json` (shape of all sixteen cells, the two gap texts), `README.md` (headings).

### Key Decisions

- **Every statement was read from the code, not from the task logs.** The logs gave the list of
  what was undocumented; three of their claims no longer held or were sharper in the code (below).
- **The map has no popup.** The plan asked to document "popup label only"; Task 2 dropped the
  popup (a DOM popup is invisible to MapLibre's collision index). Spec §4, the architecture doc and
  §8.3 say: ring plus a bold label placed first.
- **Two runtime sections instead of a "click section" (user, briefing).** The plan assumed a click
  section in `architecture.md`; there was none. "A click, without the model" and "Agent modes:
  local and replay" continue "At runtime, in order"; the rules went to the invariant group "Replay
  and recordings", the layout to its own "Development and deployment".
- **The selection rule joined the guard list.** `findSelectionPathViolations` (Task 1) was missing
  from the documented guard order and `/selectedConf` from the client-owned paths; the catalog
  check is now guard 5 and the cross-reference in "One AG-UI run" follows.
- **The a2ui copy of the spec is not mirrored (user, 2026-09-30: "a2ui Kopie ist egal,
  ignorieren").** `docs/spec.md` is the authoritative file; the copy stays at v3.4. Supersedes
  the plan's "change both sides identically" and half of T6-AC-02.
- **No line in the Details panel (user, briefing).** The amendment offered one "if it has room";
  it would have been the only code change, the section already has three paragraphs, and the
  hosted replay has no free text.
- **Register "tick 8, 21, 25, 30".** The numbers were line numbers at planning time. 8, 21 and 25
  were ticked by Tasks 2, 3 and 5; 24 already carries the manual check; "30" is the drive-loop
  extraction, which the plan's preamble keeps open. Nothing was ticked for them.
- **Spec corrections beyond the plan's list (user, briefing):** §7 "Modell-Verhalten" and
  "aufgezeichnete Events", §3.7's `capture` script, the live-moment line, the `mfe-maps` row of
  §3.1 — open issues of Tasks 3 and 4. Older drift from before M2 (the contract code in §3.2/§3.3)
  stays.
- **Both eval runs in the status (user, briefing).** Task 4's 5/5 in all four cells, and the run
  on the strings the recordings were captured with (5/5, 4/5, 5/5, 4/5).
- **The tour stays light and in the user's voice (user).** `how-it-works.md` is hand-curated and
  the README's base; mechanics went to the architecture doc. The replay section was written at
  48 lines and cut to 28 on the user's remark that it was long for its content; its lead is now
  the core statement ("I made recordings, so that the hosted demo needs no LLM and no API key").
  The list of example requests and limits moved to `architecture.md` "Agent modes".
- **Honesty in the tour, not only in the README (user).** The publication plan's rule is that a
  fact without a home in the docs is added there first; so the non-determinism note (the hosted
  answers are a selection, recorded by the user, differing from click to click) lives in the
  replay section, and the README entry in the register points there.
- **The recordings are not a persistence mechanism (user, after the review).** They save LLM calls
  for the demo. The file pins the A2UI version and its own format, nothing about the catalog; a
  breaking remote change is refused by the guards at playback and caught earlier by
  `chat.page.recorded.spec.ts`, a change of wording plays on unnoticed. The tour's version note
  and the re-capture invariant say so; "real persistence would need a better safeguard".
- **Reacting in the shell is a scope decision (user, after the review).** The tour first said a
  remote "cannot ship" the reaction to an event; it now says the demo keeps it in the shell and
  that a remote could expose events and handlers as well, calling its team's backend.
- **Dresden and the recordings link in the tour (user).** The pinned location is named, and
  `public/recordings.json` is linked as the place to read what the LLM said.
- **Fixed finding: Codex quick review — "replay promises no request".** The map still loads style,
  tiles and glyphs from OpenFreeMap in replay. The diagram node reads "no model, no server", the
  mode table "no server, no key".
- **Fixed finding: Codex quick review — the tour said "This demo does not store surfaces yet".**
  Rewritten as above.
- **Declined finding: Codex quick review — the a2ui spec copy is out of sync (T6-AC-02) — the
  user's decision of 2026-09-30, not an omission; the copy is no longer a source anyone works
  from.** The reason lives in the register entry on the spec's header line.

### Review Focus

- **Behavior claims:** (1) From `docs/architecture.md` alone a reader can follow a reserve click
  from the Button to the Gauge without a model ("A click, without the model"), say what a
  recording holds and when it must be re-captured ("Agent modes", "Replay and recordings"), and
  how the deployed tree differs from `npm start` ("Development and deployment"). (2) `docs/spec.md`
  is v3.5 and says that the map is MapLibre and that your own key means the local agent server.
  (3) Neither doc body names a task number, an AC ID or the plan.
- **Plan deviations:** spec mirrored on both sides, byte-identical → `docs/spec.md` only → user
  decision. "Popup label only" → no popup → the code has none. A click section in
  `architecture.md` → new sections → none existed. Tick 8, 21, 25, 30 → nothing ticked → already
  done or kept open by the preamble. The Details-panel line → not built → user decision. "Task 4's
  eval figures" → both runs. Additional spec edits (§3.1, §3.7, §7, live moment) → open issues of
  earlier logs. The Distance-0 entry → untouched, Task 3.5 had already noted the patch.
- **Assumptions / choices:** the eval gate of Task 4 is dated 2026-09-29 (the session of gate
  round 3); "Who ships what" states the three conditions for remote-owned handlers although
  nothing of it is built; the badge descriptions in spec §2 follow the `charts,maps` recordings.
- **Scope notes:** `docs/improvements.md` gained two entries and two pointers beyond the plan;
  `tmp/architecture-big-picture.png` (git-ignored) is the rendered diagram.
- **Read next:** `docs/how-it-works.md` "The hosted demo is a recording" and the end of "What
  happens on a click" — the user's voice, the passages most likely to be reworked;
  `docs/architecture.md` "Agent modes: local and replay" — the longest new section, check it
  against `src/app/replay/replay-agent.ts` and `recorder.ts`; `docs/spec.md` §2 — the rewritten
  table.

### Test Evidence

- Quick functional check (final text):
  `rg -n 'Task [0-9]|T[0-9.]+-AC|plan\.md' docs/architecture.md docs/how-it-works.md` — no hit,
  not even in "Status and history" (which names M3 and dates only). The `diff` against the a2ui
  copy was dropped with the mirror.
- Anchor links: a node one-liner (gone) slugged every heading of `architecture.md`,
  `how-it-works.md` and `README.md` and resolved all 29 `](…#…)` links of the two docs — 0 broken.
  Run before the review fixes; no heading changed afterwards, the tour gained one relative link,
  `../public/recordings.json`, whose target exists.
- `npx prettier --check docs/how-it-works.md` — clean on the final text (clean at HEAD too). The
  other four docs warn as they did at HEAD.
- Mermaid: the three diagrams of `architecture.md` were extracted and rendered with
  `npx @mermaid-js/mermaid-cli` on Playwright's Chromium (outside the sandbox; Chromium does not
  start inside it); all three render, the changed *Big picture* was looked at. Rendered before the
  one-label change of the review fix ("no model, no server"), which is plain text inside a node.
  The files lived in the session scratchpad; a copy is `tmp/architecture-big-picture.png`.
- Facts checked against the code while writing: boot order (`src/main.ts`), the reserve path
  (`reserve-handler.ts`, `conference.store.ts`, `surface-data.store.ts`), replay
  (`replay-agent.ts`: last user message, run index, id suffix, the not-recorded text;
  `recordings.ts`: pins and refusal), the recorder's three rules (`recorder.ts`), the deploy
  script, the shape of all sixteen recordings and the two gap texts of badge 2 (a node one-liner
  over `public/recordings.json`, gone), commit `375dec3` touching no vocabulary, prompt or shell
  production file.
- Replay on a refused surface, read not run: `correctRenderFailures` continues the turn without a
  user message, `ReplayAgent` then finds no further recorded run and answers with an empty run —
  the visitor sees the error text, nothing loops.
- No test suite was run: no code changed.

### Acceptance Coverage

- `T6-AC-01` — partial — manual: the three explanations exist as sections and were written from
  the code; whether a reader can explain them from the doc alone is the user's read.
- `T6-AC-02` — partial — `docs/spec.md` says both (`rg -c 'lokaler Agent-Server|MapLibre'`: 7
  lines); the byte-identical a2ui copy was dropped by the user's decision of 2026-09-30.
- `T6-AC-03` — passed — the quick-check grep has no hit in either doc.

### Open Issues

- Promoted: the visual-language spec's "no request to a third-party font host" (D3, acceptance
  12) is contradicted by the map's glyphs from OpenFreeMap (→ improvements register).
- Promoted: `docs/spec.md` line 4 still describes the spec as moving into the project repository;
  the a2ui copy is no longer mirrored (→ improvements register).
- `docs/architecture.md` grew to 935 lines, 327 of them "At runtime, in order". Not an issue the
  user raised; if the reference gets hard to search, "Agent modes" is the part that could move
  into its own document.

### Context for Next Task

- Task 6 was the last task of this scope; the plan's cross-cutting acceptance is the remaining
  gate before the merge.
- Publication scope (README): the facts now have homes to link to — the agent modes and what can
  be asked live (`architecture.md` "Agent modes: local and replay"), the deploy command and its
  two `clean` rules ("Development and deployment"), the ownership rule ("Who ships what"), the
  non-determinism note and the monorepo argument (`how-it-works.md`). The user writes README
  prose; the tour is its base and carries the user's voice — extend it sparingly.
- `docs/spec.md` is the only spec; do not mirror to `~/projects/a2ui`.
- Gotchas: Mermaid renders locally with `npx -y -p @mermaid-js/mermaid-cli mmdc -i x.mmd -o x.png
  -p puppeteer.json`, the config pointing `executablePath` at Playwright's Chromium, sandbox off;
  the section anchors `#a-click-without-the-model`, `#agent-modes-local-and-replay`,
  `#who-ships-what`, `#replay-and-recordings` and `#development-and-deployment` are linked from
  the tour and the "How to read" table — renaming a heading breaks them.

### Git State

```
$ git diff --stat
 docs/architecture.md          | 415 ++++++++++++++++++++++++++++++++++++++----
 docs/how-it-works.md          |  83 +++++++--
 docs/improvements.md          |  10 +-
 docs/spec.md                  |  58 +++---
 docs/specs/visual-language.md |   4 +
 5 files changed, 490 insertions(+), 80 deletions(-)

$ git status --short   (sandbox mask entries such as .bashrc, .claude/ omitted)
 M docs/architecture.md
 M docs/how-it-works.md
 M docs/improvements.md
 M docs/spec.md
 M docs/specs/visual-language.md
?? docs/work/m3-reserve-maps-hosting/task-log/task-6-docs-reserve-replay-map.md
```

### Sessions

- claude-code b37258de-0ccc-43f3-8c9e-fbf85d2a82f2 (2026-10-01) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/b37258de-0ccc-43f3-8c9e-fbf85d2a82f2.jsonl
- codex 01a0f11c-7caa-70b0-8afa-b0d02b62df52 (2026-10-01) — transcript: ~/.codex/sessions/2026/09/30/rollout-2026-09-30T08-59-31-01a0f11c-7caa-70b0-8afa-b0d02b62df52.jsonl
