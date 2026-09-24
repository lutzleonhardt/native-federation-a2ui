# Fix: a valid `formatDate` pattern in the prompt

### Task
Tell the model that dates in the data are ISO and bound directly, and give it the one valid
`formatDate` grammar, so a detail view never shows a raw timestamp.

### Status
DONE. The eval gate on the changed prompt: 5/5, 5/5 and 5/5 with both capabilities, 5/5 and 5/5
with charts only (second run, after the user topped up the API credits; the first run the same
afternoon was cut off by the credit balance after 11 ok requests — Test Evidence). The agent
served the prompt for both runs (reload 15:30:47, no later change). No independent review
performed. Unit tests and Prettier green on the final code.

### Root Cause
The basic `formatDate` leaves the format grammar to the model, and the prompt named the function
once without a pattern. The model invented patterns with unescaped letters (`n`); a2ui's
implementation catches date-fns's RangeError and returns `date.toISOString()`, which is the raw
timestamp the `Text` showed. Renderer side nothing can tell that fallback from intended text,
which is why the fix is prompt-side.

### Files Modified
- `agent/src/prompt.ts` (modified) — "Bind, never copy": one new paragraph — dates in the data
  are ISO strings and are shown as they are (bind them directly); `formatDate`'s `format` is a
  date-fns pattern such as `yyyy-MM-dd` or `d MMM yyyy`, any other pattern prints a raw timestamp.
- `docs/improvements.md` (modified) — the `formatDate` line (from task 5) ticked with the rule
  and the gate figures.
- `docs/architecture.md` (modified) — "Status and history": the 2026-09-24 `formatDate`-rule
  gate entry.

### Files Read (Context Only)
- `handoff.md`; `docs/improvements.md:44`; `node_modules/@a2ui/web_core/src/v0_9/basic_catalog/
  functions/basic_functions_api.js` (`FormatDateApi`, the token reference) and
  `basic_functions.js` (the `catch` → `toISOString()`); `agent/src/prompt.spec.ts` and
  `eval/prompt-examples.spec.ts` (by grep: nothing pins the paragraph); `docs/architecture.md`
  "Status and history" (where the gate figures go).

### Key Decisions
- **Prompt, not renderer.** The host's text adapter receives the fallback timestamp as a plain
  string; it could only pattern-match ISO timestamps back to dates — guessing, and hiding the
  model's mistake. The design wants ISO dates, which the data already carries, so the rule says
  "bind directly" first and gives the grammar second.
- **Placement**: after the "Never transcribe …" paragraph that names `formatDate`, before the
  `formatString` paragraph; the detail example untouched (it carries no date by Task 5's
  decision, so `formatDate` does not compete with `daysUntil` there).
- **No test**: prose; the basic-only guard (`prompt.spec.ts`, T7-AC-02) is unaffected because
  `formatDate` is a basic function.
- **The cut-off run is not evidence for the gate.** 11/11 before the refusal is consistent with
  run 10 of Task 5 (5/5 everywhere) but is no full run; the lane stayed open until the second,
  complete run.

### Review Focus
- **Behavior claims:** (1) The prompt names a valid date-fns pattern next to `formatDate` and
  says ISO dates are bound directly. (2) The running agent serves that prompt. (3) The gate on
  it: 5/5, 5/5, 5/5 and 5/5, 5/5 — every maps-off answer names the missing map.
- **Plan deviations:** No plan (fix lane).
- **Assumptions / choices:** the eval gate is the acceptance for any prompt change (project
  convention since M1), so the lane did not close on unit tests alone.
- **Scope notes:** None.
- **Read next:** `agent/src/prompt.ts` — the paragraph under "Bind, never copy";
  `docs/architecture.md` "Status and history" — the new gate bullet; this log's Test Evidence —
  the eval log's shape after the cut-off, to recognise an API refusal next time.

### Test Evidence
- `npm run test:agent` (`tsc --noEmit && vitest run`) 4 files, 30 passed after the edit;
  `npx prettier --check agent/src/prompt.ts` clean.
- Agent reload: the watcher's log (`serve-agent.log` in the Task-5 session's scratchpad,
  `readlink /proc/<tsx-watch-pid>/fd/1`) shows `15:30:47 [tsx] change in ./src/prompt.ts
  Restarting...`; the listening child (pid 2481413) started 15:30:47.
- `npm run eval` 15:31–15:37, sandbox off, log in this job's scratchpad (gone with the job):
  charts,maps — runs 1–3 A1 / A2 / A3 ok (A3 22.1 / 15.7 / 17.9 s), run 4 A1 ok, A2 ok, A3
  `expected exactly one renderSurface call, got 0`, run 5 all three `got 0`; charts — A1 0/5
  (`got 0`), A2-without-maps 0/5 (`no messageWidget text names the missing map`); "Gate NOT
  reached", exit 1. The agent log carries 28 `Upstream LLM API error … Your credit balance is too
  low to access the Anthropic API` from run 4's A3 on — every failed request is an API refusal,
  not a model answer. Recognition rule: `got 0` on every request in a row plus
  `no messageWidget text` for the maps-off request is the shape of a dead API key, not of a
  prompt regression.
- One live sample on the new prompt (probe 2 of `fix-pair-layout-rules`, 15:32): the date pair
  bound `/selectedConf/date` directly ("2026-10-06"), no `formatDate` call — one sample, not
  evidence.

— session 2026-09-24, after the credit top-up

- Agent unchanged: child pid 2481413 started 15:30:47 = `prompt.ts` mtime 15:30:47, no reload
  line since.
- `npm run eval` 16:36–16:44, sandbox off, log in this job's scratchpad (gone with the job):
  charts,maps — A1 5/5, A2 5/5, A3 5/5 (A3 16.2 / 16.7 / 19.5 / 13.5 / 18.0 s); charts — A1 5/5,
  A2-without-maps 5/5, each `messageWidget` naming the missing map component and offering the
  timeline or a list; "Gate reached", exit 0. No upstream error in the agent log during the run.

### Open Issues
None.

### Context for Next Task
- Before any paid run: the API credit balance as well as the agent's reload — a refused key
  shows up in the harness as `got 0` on every request, and only the agent's log names it.

### Git State
`git diff --stat`:

```
 agent/src/prompt.ts  | 4 ++++
 docs/architecture.md | 4 ++++
 docs/improvements.md | 2 +-
 3 files changed, 9 insertions(+), 1 deletion(-)
```

`git status --short` (device-node dotfiles of the sandbox filtered out):

```
 M agent/src/prompt.ts
 M docs/architecture.md
 M docs/improvements.md
?? docs/work/visual-language/task-log/fix-format-date-pattern.md
?? handoff.md
```

`handoff.md` is the handoff of both lanes, not part of the commit.

### Sessions
- claude-code 2b8fc760-17f3-42f2-b43e-c21875a383f1 (2026-09-24) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/2b8fc760-17f3-42f2-b43e-c21875a383f1.jsonl
