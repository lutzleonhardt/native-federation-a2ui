# docs-task-4-split: Task 4 split at the eval gate — Task 4.5 takes the capture

### Task

The M3 plan amendment that splits Task 4 into Task 4 (badge texts, prompt, scorer, matrix, the
shared drive loop, the eval gate) and a new Task 4.5 (capture script, the sixteen recordings, the
replay proof), decided at Task 4's start before any code was written.

### Status

DONE — documentation only: `plan.md` is amended, no application code changed. Independent review
not performed; the split and its cut were decided with the user in this session, and the user
reviews the diff before committing. Task 4 has not started; its briefing is re-run on the reduced
block in a fresh session.

### Root Cause

Task 4 as planned touched about eighteen files across five concerns — badge texts, prompt rules,
scorer, the drive-loop extraction, the capture script, the recordings and a proof spec — above
the ten-file threshold at which `/start-task` asks for a split. The file count was the plan's own
(every file was a listed key location), so nothing was hidden; what made the block too large was
its two paid model steps with different failure modes. The eval gate may need prompt iterations and
carries a decision of its own (the badge-2 fallback rule). The capture is a second paid step whose
result is a large generated JSON diff. One commit would have mixed scorer and drive logic, whose
review is about code, with sixteen recordings, whose review is about content.

### Files Modified

- `docs/work/m3-reserve-maps-hosting/plan.md` (modified) — preamble order sentence (Task 1 and 3
  before Task 4.5, Task 3.5 before Task 4, Task 4 before Task 4.5); Task 3 key location "fixture
  until Task 4.5 captures"; Task 4 retitled, a third amendment note with the split and the AC
  mapping, new "Depends on", new **Drive** and **Matrix** paragraphs, the Capture and Proof
  paragraphs and T4-AC-02 to -04 removed, T4-AC-05 reworded to its eval half, quick check = the
  gate, key locations extended by `agent/src/prompt.ts` and the tool definition (previously only
  in the amendment text), key discoveries trimmed to the gate; new Task 4.5 block with Capture,
  Proof, T4.5-AC-01 to -04, the capture quick check, key locations and discoveries; `withinKm` →
  `filterWithinKm` in the two operational Scorer lines. Applied by a scratchpad script that
  asserted the start of every sliced line and an exactly-once match for every replacement; the
  script is not in the tree.

### Files Read (Context Only)

- `docs/work/m3-reserve-maps-hosting/plan.md` (preamble and the Task 4 block; headings and
  `Task 4` / `T4-AC` references elsewhere by grep only), `task-log/task-3.5-*.md`,
  `task-log/task-3-*.md`, `task-log/docs-demo-variation-decisions.md` (lines 60–220),
  `task-log/task-1-*.md` and `task-2-*.md` (grep), `docs/improvements.md` (lines 25–35).
- `eval/run-eval.ts`, `eval/score.ts`, `eval/score.spec.ts`, `eval/scenarios.ts`,
  `eval/scenarios.spec.ts`, `eval/prompt-examples.spec.ts`, `eval/model-context.spec.ts` (head),
  `eval/tsconfig.json`, `eval/vitest.config.ts`, `eval/package.json`.
- `agent/src/prompt.ts`, `agent/src/prompt.spec.ts`, `agent/src/agent.ts`, `agent/src/server.ts`
  (head), `agent/src/config.ts`, `agent/package.json` (scripts).
- `src/app/chat/example-prompts.ts`, `src/app/chat/chat.page.spec.ts` (header, helpers, fixtures,
  the replay describe), `src/app/replay/recordings.ts`, `replay-agent.ts`, `scripted-run.ts`,
  `src/app/agent/tools/find-conferences.definition.ts`, `find-conferences.tool.ts`,
  `render-surface.definition.ts`, `message-widget.definition.ts`, `render-failure-correction.ts`,
  `render-surface.tool.ts` (grep), `me-context-entry.ts`, `src/app/agent/surface-data.store.ts`
  (`setResult`), `src/app/domain/conference.ts`, `find-conferences.ts`,
  `find-conferences.schema.ts`, `location.store.ts` (`Me`), `src/app/a2ui/surface-host-rules.ts`
  (exports, `CLIENT_OWNED_SEGMENTS`).
- `public/recordings.json`, `public/federation.manifest.json`, `package.json` (scripts,
  devDependencies), `tsconfig.json`, `tsconfig.spec.json`, `.gitignore`, `sheriff.config.ts`,
  `.env` / `.env.example` (existence only).

### Key Decisions

- **Split at the gate (user).** The briefing had proposed one task in two phases with a stop after
  the gate; the user preferred two tasks. Reasons as in Root Cause: two paid steps with different
  failure modes, and a code commit kept apart from a generated-content commit.
- **The drive extraction is Task 4's, not Task 4.5's.** `eval/drive.ts` serves the eval itself, is
  testable without a model (`drive.spec.ts` pins the rejected-surface recording, register entry
  30), and T4-AC-05's eval half needs it; Task 4.5 only consumes it. Task 4 stays at about
  thirteen files, half of them small eval files.
- **AC ids moved, not reused.** T4-AC-02 to -04 became T4.5-AC-01 to -03 with a "(from …)" tag;
  T4-AC-05 keeps its eval half in Task 4 and gives the capture half to the new T4.5-AC-04;
  T4-AC-01 is unchanged. Task 4 therefore has AC-01 and AC-05 with a gap, which is preferable to
  renumbering an id that logs and the plan's cross-cutting section may cite.
- **Briefing decisions written into the plan as instructions:** the drive record keeps the calls
  per run in Task 3's recording shape (`{ name, args }`, `rejected: true`) so scorer, gate and
  capture read one form; the eval plays the seven form cells and the `host-rules` cells are
  checked at capture (T4-AC-01 already named only those seven); the proof spec shares the chat
  spec's TestBed helpers through a harness module instead of copying them. These were the
  briefing's recommendations; the user approved the amendment as a whole and can still object at
  Task 4's start.
- **Left open on purpose: `updateDataModel` on the Slider's path as part of `A2`.** Task 3.5's
  deferred finding (strict `maxKm`, an unwritten path renders an empty map) argues for it; it is
  recorded as a Key Discovery in Task 4 and decided when the task starts, not pre-empted here.
- **No Timeline under the slider in badge 2 (user asked, after Task 3.5's playground surface).**
  Not in the prompt, not in the badge, not in the `filterWithinKm` description: badge 1 is the
  Timeline and the Timeline-plus-Map badge was dropped in the demo-variation review; the planned
  prompt rule forbids adding a timeline the user did not ask for and A2's negative list forbids
  it; a Timeline under a slider needs a pinned `range`, which a model would write as date
  literals that age in a recording, or leave out, which makes the axis rescale on every step.
  The playground already shows that one call feeds two components; Task 6 can point at it.
- **The recordings file's "header comment" is a top-level `note` key.** JSON has no comments and
  `parseRecordings` reads `format`, `a2ui` and `recordings` only, so an extra key is ignored.
  Written into Task 4.5's Capture paragraph.
- **`withinKm` renamed only where the text is operational.** The two Scorer lines now say
  `filterWithinKm` (Task 3.5's name); the amendment notes keep `withinKm` as history, and
  Task 3.5's and Task 6's blocks were not touched.
- **Identity `docs-task-4-split`.** A docs stem like `docs-demo-variation-decisions`; the work is a
  plan amendment, not a fix.

### Review Focus

- **Behavior claims:** none in code. The plan now (1) has a Task 4 whose proof is the eval gate
  and a Task 4.5 whose proof is sixteen `ok` lines plus the replay spec, with disjoint acceptance
  criteria that together still cover the old T4-AC-01 to -05; (2) keeps all sixteen matrix cells
  covered (seven by the gate, nine by the capture's own check); (3) names the new ordering
  constraint in the preamble.
- **Plan deviations:** No plan (fix lane). The amendment supersedes Task 4's original block; the
  earlier amendment notes stay in place.
- **Assumptions / choices:** the badge-2 fallback rule stays with the gate in Task 4; T4-AC-01's
  seven cells are the whole gate; the drive extraction is testable without a model call.
- **Scope notes:** two lines outside the Task 4 block changed (preamble order sentence, Task 3's
  fixture note); nothing else. The scratchpad script never entered the tree.
- **Read next:** `plan.md` Task 4 "Drive" and "Matrix" — the two new instruction paragraphs;
  Task 4.5 "Capture" — the abort rule and the `note` key; the third amendment note in Task 4 —
  the AC mapping.

### Test Evidence

Documentation only; no test suite run.

- The splice script asserted the first characters of 34 sliced or referenced lines and an
  exactly-once match for each of the 8 in-line replacements before writing; output
  `644 -> 682 lines`. A first invocation with a wrong scratchpad path failed on file-not-found
  before touching the plan; the second ran once. The script lives in the session scratchpad and
  is not in the tree.
- `grep -n '^## Task'` after the edit: Task 1, 2, 3, 3.5, 4 (line 363), 4.5 (line 503), 5 (562),
  6 (611), in order.
- `git diff --stat`: `plan.md` 94 insertions, 32 deletions, one file. The new Task 4 and Task 4.5
  blocks and the two outside lines were read back in full.
- `grep -n 'withinKm'` before the rename showed the two operational Scorer lines (432, 448)
  beside the historical amendment and Task 3.5 / Task 6 lines; only those two were changed.

### Open Issues

- Whether `A2` requires the `updateDataModel` on the Slider's path in the same surface (→ Task 4,
  decided at task start; Key Discovery in the block).

### Context for Next Task

- Run `/start-task 4` in a fresh session; the block is `plan.md` lines 363–502, Task 4.5 follows at
  503–561. The briefing's decisions 2 (record shape), 3 (seven gate cells) and 5 (shared test
  harness) are plan text now; decision 4 (`updateDataModel` in `A2`) is open; decision 1 was the
  split.
- Task 4's deliverable for Task 4.5: the gate figures on the final strings in Task 4's log,
  `eval/drive.ts` with `driveRequest` returning runs of `{ name, args, rejected? }` calls, and the
  matrix in `eval/scenarios.ts` with vocabularies and a requirement per set × badge.
- Cost: the gate is about 35 requests (seven cells × five runs, one or two model calls each); a
  prompt iteration repeats it. The capture is sixteen requests plus retries. Both run outside the
  sandbox against the user's agent server; check that `tsx watch` reloaded `prompt.ts` before a
  paid run.

### Git State

`git diff --stat`:

```
 docs/work/m3-reserve-maps-hosting/plan.md | 126 ++++++++++++++++++++++--------
 1 file changed, 94 insertions(+), 32 deletions(-)
```

`git status --short` (repository files only; the sandbox additionally shows untracked `.bashrc`,
`.gitconfig`, `.mcp.json`, `.claude/…` and similar entries, its own masks over sensitive paths,
not files of this repository):

```
 M docs/work/m3-reserve-maps-hosting/plan.md
?? docs/work/m3-reserve-maps-hosting/task-log/docs-task-4-split.md
```

### Sessions

- claude-code b5c12af5-f78b-4e80-96bb-a100340e21c5 (2026-09-28) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/b5c12af5-f78b-4e80-96bb-a100340e21c5.jsonl
