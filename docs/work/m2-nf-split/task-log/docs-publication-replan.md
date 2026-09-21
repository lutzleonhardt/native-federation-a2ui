# docs: Re-cut after the README brainstorm — Task 9 appended to M2, new scope `publication`

### Task

Turned the user's README brainstorm of 2026-09-19 into plan changes instead of absorbing it into
Task 8: the M2 plan gains Task 9 (the demo in English, eval re-run), and the README rewrite and the
history cleanup become a scope of their own, `publication`, which starts after the
`visual-language` scope. No code changed.

### Status

DONE — planning-only change, agreed step by step with the user in the session. Not independently
reviewed. Task 8 itself has not been started.

### Root Cause

Not a bug — a scope decision. `/start-task 8` arrived together with a brainstorm that added four
kinds of work to a task whose block covers `docs/architecture.md`, the tour and one README status
line: a code change with its own paid eval gate, a full README, a history rewrite, and media that
need the final design. Above ten files and several independent commits, the task rules ask for a
split instead of silent absorption.

### Files Modified

- `docs/work/m2-nf-split/plan.md` (modified) — new Task 9 "Switch the running demo to English"
  (T9-AC-01…03); one preamble bullet pointing at the `publication` scope; XC-01 now also touches T9.
  Task 8 is unchanged.
- `docs/work/publication/plan.md` (new) — preamble with both predecessors and four decisions;
  Task 1 "Rewrite the README for publication" (the brainstorm's section order, FAQ kernels,
  "Where this pays off", security block, credits — inlined, since `/start-task` reads no chat);
  Task 2 "Make the history publishable".

### Files Read (Context Only)

- `docs/work/m2-nf-split/plan.md` (preamble, Task 8 block, cross-cutting section),
  `docs/work/m2-nf-split/task-log/task-7-eval-capability-sets.md`, `README.md`,
  `docs/architecture.md`, `docs/improvements.md`, the head of `docs/book-learnings.md`.
- `src/app/agent/tools/find-conferences.{tool,definition}.ts`, `src/app/agent/create-frontend-tool.ts`
  (grep), `src/app/chat/example-prompts.ts`, `eval/scenarios.ts`, the head of
  `src/app/domain/conferences.json`.
- `node_modules/@softarc/native-federation-orchestrator` 4.6.1 (type contracts and the `integrity`
  call sites of the bundle), `node_modules/@softarc/native-federation` 4.6.0 (`integrityHashes`).
- `~/.claude/skills/{plan,wrap-up,voice-curate}/SKILL.md` (task schema, fix lane, what the curation
  skill needs as input).

### Key Decisions

- **Tasks run in number order; new work is appended (user requirement).** The first proposal ran
  the English switch before Task 8 ("9 → 8 → 10") because docs quote prompts and gate figures. The
  user rejected any order that differs from the numbering. Renumbering Task 8 was rejected as well:
  AC IDs are append-only once a plan is committed, and the Task 7 log and the register already
  point at "Task 8". Cost of appending: `docs/architecture.md` is written with the 2026-09-18
  figures and Task 9 updates them — one instruction line in Task 9.
- **The eval runs once, at the end of Task 9.** The requests and the `Gauge` description change
  what the model reads, so the earlier figures stop describing the repository; the run yields the
  figures the README quotes.
- **README and history left the M2 plan (user agreed).** They were first appended as Tasks 10 and
  11. The user then pointed out that README media must wait for the design pass, which lives in
  another scope. A check found a second dependency: the planned FAQ answer on design consistency
  (shell sets CSS custom properties, remotes consume them) is not true yet. With both tasks waiting
  for another scope, M2 could never close — hence `docs/work/publication/`, written on this branch
  so it travels through the merges until `feature/publication` exists.
- **The history rewrite is the last task of all.** One pass then covers everything the other
  scopes add. Rejected: doing it first, as the brainstorm's "before you write" list suggested —
  nothing in the writing depends on it, and the repository is still private.
- **A new GitHub repository instead of a rename.** After a force-push the old commits stay
  fetchable by hash; a fresh repository never had them.
- **The removal list stays outside the repository.** Plan and logs become public, so they name
  files, never the removed wording. Plain mentions of the book as a source stay; the README credits
  it openly.
- **SRI is named, never built (user decision).** The brainstorm's open question to the
  Native Federation maintainers was dropped: the installed packages answer it (see Test Evidence).
- **Who writes what.** Reference docs are the agent's; prose carrying the user's voice (README,
  FAQ) is the user's, with verified facts and a check against the code from the agent. Who drafts
  the tour is left open until `docs/architecture.md` stands; recommendation: the agent drafts, the
  user reworks.
- **Outside every plan:** the article (after M3).

### Review Focus

- **Behavior claims:** (1) `/start-task 9` on this branch finds a self-contained block — the
  heading pattern `^## Task 9` matches once and the cross-cutting section is still last.
  (2) `docs/work/publication/plan.md` can be started without this chat: every brainstorm item is
  inlined into Task 1 or Task 2, or named as out of scope.
- **Plan deviations:** No plan (fix lane).
- **Assumptions / choices:** the scope name `publication` assumes a branch `feature/publication`;
  the GIF and the screenshot are part of the README task rather than a task of their own; an
  off-topic eval scenario is optional and settled at the start of Task 9.
- **Scope notes:** a plan for a scope whose branch does not exist yet was written on
  `feature/m2-nf-split`. `docs/improvements.md` untouched — its README and tour entries still name
  the right consumers.
- **Read next:**
  1. `docs/work/publication/plan.md` Task 1, Key Discoveries — the two facts that correct the
     brainstorm (what `findConferences` returns; the design-consistency answer).
  2. `docs/work/publication/plan.md` Task 2, step 1 — what counts as removable and what stays.
  3. `docs/work/m2-nf-split/plan.md` Task 9, Key Discoveries — the noise warning for A3.

### Test Evidence

No tests — nothing executable changed. Checks made while planning (2026-09-19 and 2026-09-21):

- `find-conferences.tool.ts:38-44` — the model receives `{ ok, count, mountedAt, next? }`; `next`
  carries the first hit's `id`, `name`, `city`, `date`, `distanceKm`.
- Orchestrator 4.6.1: manifest entries may be `{ url, integrity }`, `manifestIntegrity` exists, and
  `addIntegrity` copies a remote entry's per-file map into `importMap.integrity`. Builder 4.6.0:
  `features.integrityHashes`, default `false`, unset in all three federation configs.
- `rg 'var\(--'` over `src/`, `projects/mfe-charts/src`, `projects/mfe-maps/src` — no hit.
- Unauthenticated requests to the GitHub repository and to the raw `docs/book-learnings.md` — 404
  both, so the repository is private. `git log --follow -- docs/book-learnings.md` — two commits;
  the file is on `origin/main`.
- Book mentions in all task logs — nine short references, no longer quotation.
- `git filter-repo --version` — installed. `git branch -vv` — `main` and `feature/m2-nf-split`
  track origin, `feature/visual-language` is local and stacked on the Task 7 commit; that scope has
  a spec (`docs/specs/visual-language.md`) and no plan yet.
- `grep -n '^## ' docs/work/m2-nf-split/plan.md` after the edit — Task 8, Task 9, Cross-Cutting
  Acceptance, in that order.
- Living-documents grep (`Task 9|Task 10|Task 11|publication` over `docs/architecture.md`,
  `docs/improvements.md`, `docs/spec.md`) — two hits in `architecture.md`, both about M1's Task 9;
  nothing stale from this change.

### Open Issues

- None of this change's own. The open points are task-local and recorded in the blocks: who drafts
  the tour (→ Task 8), approval of the paid eval run and the optional off-topic scenario
  (→ Task 9), the removal list (→ `publication` Task 2).

### Context for Next Task

- **Order of the remaining work:** Task 8 → Task 9 → close M2 → `visual-language` scope (needs
  `/plan`) → `publication` Task 1 → Task 2.
- **Task 8:** start with `docs/architecture.md`; quote the 2026-09-18 figures from the Task 7 log —
  Task 9 replaces them. Do not link to `docs/book-learnings.md`; it leaves the repository.
- **Working tree:** this change should be committed before Task 8 edits begin, so the two change
  sets stay apart.

### Git State

```
$ git diff --stat
 docs/work/m2-nf-split/plan.md | 66 ++++++++++++++++++++++++++++++++++++++++++-
 1 file changed, 65 insertions(+), 1 deletion(-)

$ git status --short     # sandbox dotfiles omitted
 M docs/work/m2-nf-split/plan.md
?? docs/work/m2-nf-split/task-log/docs-publication-replan.md
?? docs/work/publication/
```

### Sessions

- claude-code 6e189df4-11bc-4a06-8f0e-495a9868943e (2026-09-19) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/6e189df4-11bc-4a06-8f0e-495a9868943e.jsonl
- claude-code 89ddaee4-ee64-4e87-b769-f3021e441cee (2026-09-21) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/89ddaee4-ee64-4e87-b769-f3021e441cee.jsonl
