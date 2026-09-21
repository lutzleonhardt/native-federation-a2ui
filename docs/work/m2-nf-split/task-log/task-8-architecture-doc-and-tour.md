# Task 8: Refresh the architecture doc and write the high-level tour

### Task

Brought `docs/architecture.md` from the M1 monolith to the state after the federation split, wrote
the new tour `docs/how-it-works.md` in the author's voice, and moved the README status with it.

### Status

DONE — documentation only, no production file changed. Independent review performed (Codex quick
review, 2026-09-22): hotspot 1 (the renderer needs parts of both halves) and hotspot 3 (wrong
prompt text for the empty selection) absorbed; hotspot 2 (the tour's "data never passes through the
LLM" is too absolute) accepted as written on the user's decision. The Mermaid blind spot is closed:
the user rendered the diagrams and found them fine. The live demo was not re-run — no behaviour
changed; the live check of Task 7 stands. Both acceptance criteria are covered by scripted checks
plus reading, not by an automated test. Not committed (`/commit 8` pending). `/cs` does not apply:
content-only change.

### Files Modified

- `docs/architecture.md` (modified) — retitled "Architecture"; new "How to read this document"
  table; *Big picture* redrawn (manifest, federation bootstrap, two remotes, contract, both halves
  of each capability and their consumer) plus a capability table; new parent "At runtime, in
  order" with *Boot* (six steps), *One chat turn*, *One AG-UI run* (context in the sequence
  diagram, a per-URL table of what `# Custom Catalog` lists, the three sources the model learns
  from) and *The renderSurface round trip* (guard 4 now names function calls; task numbers removed);
  *Layers and ownership* got a Federation row, the Vocabulary row points at `projects/mfe-*`, and
  the fifth column became a per-layer list below the table; the 18 invariants are grouped under
  four subheadings, with three new ones (whitelist, module boundaries, repo-portability), one added
  later (one Angular for shell and remotes) and one retitled ("The browser owns the data, the model
  only binds to it"); *Roadmap context* became "The eval harness" and "Status and history".
- `docs/how-it-works.md` (new, 421 lines) — the tour: the parts (Mastra, AG-UI, CopilotKit, A2UI),
  what the LLM answers, a capability's two halves, half 1 to the LLM (with a three-source table:
  fixed prompt, `context`, `tools`), half 2 to the renderer (catalog sketch, the four component
  inputs), one remote with both halves (demo in two steps, version note), how the shell finds its
  remotes (whitelist, degraded start, own contract, note on static manifest and SRI), data stays
  in the browser (local tools vs. functions, bindings, what a click does), the monorepo as a
  simplification, the idea in one sentence.
- `README.md` (modified) — Status paragraph now describes the federation split; a "New here?"
  pointer to the tour ahead of the architecture link.
- `docs/improvements.md` (modified) — the tour's surface-data-flow entry ticked; the README
  monorepo entry now points at the tour's section; three new lines (stale log text in
  `src/main.ts:23`, screenshots for the tour after the UI pass, the unrendered Mermaid diagrams).

### Files Read (Context Only)

- `docs/work/m2-nf-split/plan.md` — preamble and the Task 8 block only; one `rg` for "Roadmap"
  across both plans to see whether another task names that heading (none does).
- Task logs: `task-7-eval-capability-sets.md` (predecessor), `docs-publication-replan.md`, targeted
  lines of tasks 1, 3, 4 and 6 (the notes they left for this task, the three boundaries, the
  DevTools observations).
- Host shape: `src/main.ts`, `src/bootstrap.ts`, `src/app/app.config.ts`, `src/app/app.routes.ts`,
  `src/app/federation/{select-capabilities,load-capabilities,capability-status}.ts`,
  `src/app/a2ui/{agent-capabilities.token,assistant-catalog,catalog-context,provide-a2ui-catalog,action-bus}.ts`,
  `src/app/chat/{chat.page,capability-panel.component}.ts`.
- Contract and remotes: `shared/capabilities/*` (heads), `shared/agent-contract.ts`,
  `projects/mfe-{charts,maps}/src/capability.ts`, `projects/mfe-maps/src/maps/{vocabulary,map.schema,geo,map.component}.ts`,
  `projects/mfe-maps/src/app/maps-catalog.ts`, `projects/mfe-charts/src/charts/{timeline.component,gauge.schema,days-until.fn}.ts`,
  the three `federation.config.mjs`, `sheriff.config.ts`, `eslint.config.js`, `package.json` (lint scripts).
- Agent and tools: `agent/src/{prompt,agent}.ts`, `src/app/agent/{create-frontend-tool,init-agent-store,render-failure-correction}.ts`,
  `src/app/agent/tools/{render-surface.tool,render-surface.definition,find-conferences.tool,surface-tool-renderer.component}.*`,
  `eval/run-eval.ts` (`toAgUiTool`), `agent/node_modules/@ag-ui/mastra/dist/mastra-*.mjs` (grep for `clientTools`).
- External: the author's dev.to article "Frankenstein Meeting Room" (English and German version, as
  voice reference) and `https://native-federation.com/docs/v4/devtools/` (what the extension shows).

### Key Decisions

— session 2026-09-21 / 2026-09-22

- **Two documents, two ways of reading (user question, agreed).** `architecture.md` is a reference
  that is searched — by people changing the code and by coding agents; `how-it-works.md` is read
  top to bottom. The architecture intro says so, and the README leads with the tour.
- **A reference still needs a guiding thread (user feedback: "dense, no thread, only facts").**
  Structure was added without touching the wording of rules: a question → section table at the
  top, one parent heading for everything that happens in time order, lead sentences per section,
  the over-full fifth table column turned into a list, invariants grouped by area. The invariants
  were moved by a script with an assertion that none is lost or duplicated. Linked heading texts
  were kept so anchors survived.
- **Living docs do not lean on workflow artifacts (user decision).** Milestones, task numbers, AC
  IDs, dates and `docs/work/` references were removed from the body of both documents.
  `architecture.md` confines them to its last section, "Status and history"; a spec is cited by
  file (`src/app/chat/chat.page.spec.ts`), not by AC ID. The old *Roadmap context* was split: what
  the eval harness *is* moved into a timeless section, figures and milestones into the status
  section. README "Status" may name the milestone.
- **The tour is written in the author's voice; the reference is not.** Voice markers were taken
  from the author's article (short declarative sentences, "I" for decisions, bold lead-ins for pitfalls,
  numbers instead of adjectives) and applied to the whole tour in one pass, in plain English on
  purpose (international readers). `architecture.md` got no voice pass: a lookup document carries
  no first-person narrative, and rewording eighteen rules risks shifting their meaning.
- **The agent drafted, the author reworked (closes the open point of the re-plan log).** The
  author then went through the tour section by section with dictated notes; each note was checked
  against the code before it went in, and decisions the author can override were named every time. One
  section ("The parts") was curated from the author's dictation with the `voice-curate` skill.
- **Corrections made to dictated content, each verified in code:** the AG-UI adapter is
  `@ag-ui/mastra`, not project code; the `renderSurface` UI element is ours and CopilotKit only
  places it (`component: SurfaceToolRendererComponent`, which renders `<a2ui-v09-surface>`); A2UI
  does not build on CopilotKit; the conference search is a client tool, not an A2UI function — the
  tour now separates "local tools" (AG-UI/CopilotKit, fill the data model) from "functions" (A2UI,
  compute a prop value, arguments can be bindings); the fixed prompt does *not* say which
  components exist; what limits a remote to plain Angular components is the `@a2ui/angular`
  catalog (`Record<Names, Type<unknown>>`), not CopilotKit.
- **Three sources, one table.** How the LLM learns what: fixed prompt (agent server, Mastra's
  `instructions`), `context` (remotes through the shell → `# Custom Catalog`), `tools` (shell,
  registered in CopilotKit, handed to Mastra as `clientTools`). The same fact went into
  `architecture.md`, *One AG-UI run*.
- **Data got its own tour section.** The author asked for data model, tools and functions inside
  "What the LLM answers" and warned about overload in the same breath; the section keeps a
  four-line pointer and everything about data lives in "Data stays in the browser", with the former
  "What happens on a click" as its subsection.
- **Claims were narrowed rather than dropped.** "The vocabulary needs no version number" became
  "the vocabulary *itself*", followed by a note: shell and remotes need compatible Angular versions
  (components are created inside the shell's tree), and a stored surface needs a version or a
  catalog hash. "The LLM invents a `Map` anyway" became "can still invent" — the prompt does what
  it can, how often it happens depends on the LLM (stated, not measured), then the shell's check
  takes over. Status sentences that would need updating ("a handler for `reserve` is planned") were
  replaced by capability statements ("the shell can handle it locally, or turn it into a new
  request").
- **History left the tour.** The red/green story of the prompt examples was cut to two sentences
  pointing at the eval; the figures stay in `architecture.md`, "Status and history". The tour
  therefore carries no figure that a later eval run invalidates.
- **"LLM" in the tour, "model" in the reference.** The author's word is LLM; in `architecture.md`
  "model" is part of fixed terms (model context, model-facing). "Custom component" was removed from
  the tour's prose because it collides with the HTML term; `# Custom Catalog` stays, it is the real
  prompt heading.
- **Hint blocks use GitHub's alert syntax (`> [!NOTE]`).** They render as a box on GitHub and
  degrade to a quote elsewhere.
- **The register entry on the surface data flow was absorbed (agreed at task start),** although the
  plan block does not list it. The stale log text in `src/main.ts:23` was *not* fixed: this is a
  docs-only task, so it went to the register.
- **Not done on purpose:** naming `updateDataModel` in the tour (a message-type name adds nothing
  to the mental model; it is now in the architecture invariant); a claim that the DevTools
  extension is the author's; a link for SRI (no verified URL); a statement on whether A2UI's Lit
  renderer could host closed islands (not checked — the tour only says they "would need a
  different renderer").

— session 2026-09-22 (Codex quick review absorbed)

- **The two halves are not a clean cut on the renderer's side (Codex hotspot 1 taken) — supersedes
  the tour's first wording "the same names, but no description and no schema … each side gets only
  the half it needs".** `toFragment` joins both halves: `createCustomComponent` puts name,
  description, schema and component into every catalog entry, and the functions come from the
  vocabulary half. The tour now says so: the LLM gets only the vocabulary half; the renderer gets
  the components plus names, schemas (to validate the props the LLM wrote) and functions; only the
  descriptions are of no use to it. The pseudocode passes the whole capabilities to the renderer,
  the `functions` comment in the capability block names both consumers, and "It never sees a
  description" is gone. `architecture.md` got the same fact in one sentence under the capability
  table; the diagram was left alone because the user had just checked its rendering.
- **The empty selection sends an empty catalog, not no catalog (Codex hotspot 3 taken).** The chat
  page always sends the catalog entry, so `/?capabilities=` yields `components: {}` and
  `functions: {}`; the prompt's fallback text only appears for a client that sends no entry. The
  per-URL table and a sentence below it now say that. The user was indifferent; it was fixed
  because a reference document should not carry a statement a probe has shown false.
- **"It never passes through the LLM" stays (Codex hotspot 2, user decision).** Codex is right
  that the user's location travels in the context and that the search returns the hit count and
  the first hit. The second exception stands two sentences below the claim in the tour, the first
  is in the three-source table of `architecture.md`. The user prefers the plain opening sentence.

### Review Focus

- **Behavior claims:** (1) Every path, link target and code identifier that `docs/architecture.md`
  and `docs/how-it-works.md` name exists in the tree, and each capability appears with its
  vocabulary half, its implementation half and the consumer of each. (2) The tour can be followed
  without opening a file: every term is introduced before it is used (remote, shell, capability,
  A2UI, AG-UI), and every link is a "for the mechanism" pointer. (3) Outside
  `architecture.md` → "Status and history" neither document names a milestone, task, AC ID or date.
- **Plan deviations:** "move *Roadmap context* on to M3" → the section was split into "The eval
  harness" and "Status and history" → user decision that the document must stand without workflow
  artifacts · "refresh" of the listed sections → the document was also restructured (reading table,
  runtime parent heading, table column turned into a list, grouped invariants) → user feedback that
  it had no guiding thread; the Key Locations line ranges described the M1 file and no longer apply ·
  the tour's five planned points → all present, plus an overview of the parts, the tools channel,
  a data section, a catalog sketch with the component inputs and two note blocks → added from the
  author's review notes · "the register already carries the M3 README entry" → that entry was
  amended to point at the tour, and the separate tour entry (surface data flow) was implemented and
  ticked · not in the block: `docs/improvements.md` changed (one tick, one amendment, three new
  lines).
- **Assumptions / choices:** the tour hedges where nothing was measured ("a `Map` fits", "how
  often depends on the LLM"); "local tools" keeps the author's word and names the upstream aliases
  once; the invariant title was changed because the author found the old one meaningless; SRI is
  named, not built (earlier user decision); the `> [!NOTE]` syntax assumes GitHub as the reader's
  renderer; first person ("I kept the agent server thin", "I defined this contract myself") is
  deliberate; the opening of "Data stays in the browser" is deliberately absolute although the
  location and the first hit do reach the LLM (review hotspot 2, accepted).
- **Scope notes:** `docs/improvements.md`; README only in its Status section. No file under `src/`,
  `projects/`, `shared/`, `agent/` or `eval/` changed. `docs/spec.md` untouched and not stale
  (grep, see Test Evidence).
- **Read next:**
  1. `docs/how-it-works.md`, "The parts" and the table in "Half 1 travels to the LLM" — the densest
     factual claims; compare with `agent/src/prompt.ts` (`buildInstructions`),
     `src/app/agent/create-frontend-tool.ts` and `src/app/chat/chat.page.ts`.
  2. `docs/architecture.md`, "Invariants worth knowing" — regrouped by script; check the new "One
     Angular for shell and remotes" against the three `federation.config.mjs` and the retitled data
     invariant against `createClientDataMessages` in `render-surface.tool.ts`.
  3. `docs/how-it-works.md`, "Half 2 travels to the renderer" and the pseudocode in "One remote,
     both halves" — rewritten after the review; compare with `toFragment` in
     `shared/capabilities/agent-capability.ts` and `createCustomComponent` in
     `shared/capabilities/custom-component.ts`.

### Test Evidence

— session 2026-09-21 / 2026-09-22

No test suite applies; nothing executable changed. All checks below were run on the final state of
the files (2026-09-22, after the last edit):

- **Paths:** the 18 backticked repo paths named in the two documents all exist
  (`rg -o` over both files, `test -e` per hit — no output).
- **Links:** 19 anchor links across `docs/architecture.md`, `docs/how-it-works.md` and `README.md`
  resolve to an existing heading (script over the GitHub slug rule) — 0 broken. The external
  DevTools URL was fetched: the page exists and lists the tabs Packages, Remotes, Graph, Import Map.
- **Identifiers:** 82 backticked identifiers; 77 occur in the project's code. The other five are
  upstream names: `render_a2ui`, `AGUISendStateSnapshot`, `ComponentApi` (already in the M1 text),
  `clientTools` (Mastra's option; found in the `@ag-ui/mastra` bundle) and `integrity` (field of a
  Native Federation manifest entry, see the re-plan log).
- **Workflow references:** no hit for task numbers, milestones, AC IDs, `plan.md`, `task-log` or a
  date before "Status and history" in `architecture.md`, none at all in the tour.
- **Stale terms:** no hit for `src/app/capabilities`, `capabilities/<area>`,
  `createAppConfig(capabilities)`, "M1 Monolith", "monolith spike", "Roadmap context".
- **Facts checked against code while writing:** basic catalog has 18 components and 25 functions
  (`node -e` on `@a2ui/web_core`); both haversine copies are pinned by specs; `findConferences`
  returns `{ ok, count, mountedAt, next? }`; the client mount uses `updateDataModel` messages;
  `AGENT_PORT = 3001`; `npm run lint` = `ng lint && npm run lint:boundaries`, the latter
  `sheriff verify`; `integrityHashes` is set in none of the three federation configs; all three
  share Angular as `singleton` with `strictVersion`; `MapComponent` declares exactly the four
  inputs the tour shows; `MapProps` mirrors `mapSchema`; nothing in the chat subscribes to
  `A2uiActionBus` (only the playground does); a click re-renders the `distance` binding (Task 6
  log).
- **Prettier:** `npx prettier --check docs/how-it-works.md` — clean (one `prettier-ignore` on each
  of the two compact JSON blocks; `prettier --write` was run on this file only, to align the
  table). `docs/architecture.md`, `README.md` and `docs/improvements.md` were not
  prettier-formatted at HEAD and stay hand-formatted.
- **Living-documents grep** (`Roadmap context|Structure from the model|how-it-works|architecture\.md`
  over `docs/spec.md` and `docs/improvements.md`): no hit in `docs/spec.md`; the three register
  hits are the entries this task wrote or amended.
- **Session transcript:** unrelated to the documents, recorded because it was investigated — a
  short reminder text reached the agent repeatedly; a grep over the repository, the Claude Code
  configuration and this session's transcript found it nowhere on the machine. It influenced no
  content.
- **Not verified:** Mermaid rendering (no `mmdc`; `mermaid-cli` is in the `extra` repository).
- Probes and backups lived in the session scratchpad only; nothing temporary is in the tree.

— session 2026-09-22 (after the review fixes)

- Codex verified independently on the pre-fix text: 27 local links and 18 repository paths without
  an invalid target; it probed `buildInstructions([catalogToContextEntry([])])` and got JSON with
  `catalogId`, `components: {}`, `functions: {}`; it changed no files.
- Both findings were re-checked in code before fixing: `createCustomComponent` returns
  `{ name, description, schema, component }`; `catalogSection` prints the fallback text only for
  `value === undefined`, and `chat.page.ts:57` always passes an entry.
- Re-run on the final files: 18/18 paths exist; 19 anchor links, 0 broken; 83 identifiers, the same
  five upstream names outside the project's code; no workflow reference outside "Status and
  history"; `npx prettier --check docs/how-it-works.md` clean.
- **Mermaid:** rendered and checked by the user on 2026-09-22 ("they all render fine") — this
  overtakes "Not verified: Mermaid rendering" above. The review fixes did not touch a diagram.
- Not re-run: the live demo (charts only → text plus timeline, maps switched on → map). Nothing
  executable changed; the evidence is Task 7's live check and eval runs.

### Acceptance Coverage

- **T8-AC-01** — partial — scripted for every path and identifier in prose, tables and ownership
  rows (see Test Evidence: 18/18 paths, 82 identifiers, stale-term grep); the capability table in
  *Big picture* lists each capability with both halves and their consumer, and since the review
  the prose says that the renderer consumes both. Diagram node labels are plain Mermaid text and
  were compared with the tree by reading; the user rendered the diagrams and found them fine.
- **T8-AC-02** — partial — a reading criterion by nature: one complete top-to-bottom read by the
  agent on the final text (three defects found and fixed: a dangling "shown above", an either/or
  that contradicted the subsection below it, a ragged line) and a section-by-section review by the
  author, who signed the text off. The tour names two files (`federation.manifest.json`,
  `./capability`) and explains both in place. The review found one passage that read well but was
  wrong (hotspot 1); it is corrected.

### Open Issues

- The gate figures in `docs/architecture.md`, "Status and history", are those of 2026-09-18 and
  change with the next eval run (→ Task 9).
- README still says the tour explains the idea "without opening any code", a sentence the author
  removed from the tour itself; the README is rewritten as a whole later (→ scope `publication`,
  Task 1).
- Resolved in the review session: the Mermaid diagrams were rendered and checked by the user; the
  register line is ticked.
- Promoted: screenshots for the tour after the UI pass (→ improvements register, source: user).
- Promoted: stale log text in `src/main.ts:23` (→ improvements register).

### Context for Next Task

- **Task 9 (demo in English, eval re-run):** figures live in exactly one place —
  `docs/architecture.md`, "Status and history", bullet "Eval gate". The tour quotes no figure and
  no German prompt; it paraphrases the map request in English and quotes the `Map` description in
  shortened form in two blocks ("Shows items that have lat/lon as labelled markers. A click
  writes …") — update those if the description changes. The sentence below the per-URL table in
  *One AG-UI run* quotes the start of the prompt's fallback line ("No custom vocabulary
  available …") from `agent/src/prompt.ts`.
- **Rules for both documents, decided by the author in this task:** no milestone, task number, AC
  ID, date or `docs/work/` path outside "Status and history"; a reference needs a reading table and
  lead sentences; the tour says "LLM", stays plain and first-person, and prefers a short block of
  skeleton code or a small table over a paragraph.
- **Anchors other files depend on:** `how-it-works.md#the-monorepo-is-a-simplification` (from the
  architecture invariant "Remotes stay repo-portable"); `architecture.md#one-ag-ui-run`,
  `#the-rendersurface-round-trip`, `#the-eval-harness`, `#big-picture`,
  `#invariants-worth-knowing` (from the tour); `README.md#adding-a-remote` (from the tour).
- **Quick check after any edit to either document** (fish; expected output: `checked` only):
  `for p in (rg -oNI '`((src|shared|projects|docs|agent|eval|public)/[^` ]*)`' -r '$1' docs/architecture.md docs/how-it-works.md | sort -u); test -e $p; or echo MISSING $p; end; echo checked`
- **For the article, not for any plan:** whether A2UI's Lit renderer accepts custom elements in a
  catalog decides if closed islands (a custom element wrapping its own Angular) could be remotes
  too; not researched here.
- **Gotchas:** prettier reformats fenced `ts`/`jsonc` blocks inside Markdown — compact JSON needs
  `<!-- prettier-ignore -->`, and trailing aligned comments do not survive, so comments sit on
  their own line; a table added to the tour needs `prettier --write` for the column alignment.

### Git State

```
$ git diff --stat
 README.md            |  11 +-
 docs/architecture.md | 466 +++++++++++++++++++++++++++++++++++++++------------
 docs/improvements.md |   7 +-
 3 files changed, 370 insertions(+), 114 deletions(-)

$ git status --short     # sandbox dotfiles omitted
 M README.md
 M docs/architecture.md
 M docs/improvements.md
?? docs/how-it-works.md
?? docs/work/m2-nf-split/task-log/task-8-architecture-doc-and-tour.md
```

### Sessions

- claude-code ebf12817-bd44-4c53-ab93-1e41c5adedd1 (2026-09-22) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/ebf12817-bd44-4c53-ab93-1e41c5adedd1.jsonl
- codex 01a0c620-23b9-7970-96d7-8681b612dbe0 (2026-09-22) — transcript: ~/.codex/sessions/2026/09/22/rollout-2026-09-22T00-39-50-01a0c620-23b9-7970-96d7-8681b612dbe0.jsonl
