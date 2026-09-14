# refactor: Extract render-request validation from the renderSurface handler

### Task

Split the `renderSurface` tool handler into "is this request acceptable?" and "apply it": the six
rejection checks moved into `validateRenderRequest`, which returns either the surface to render or
the code and payload the model gets back. Behavior is unchanged.

### Status

DONE — CodeScene finding cleared (file back to 10.00), all shell checks green. Independent review
not performed; not committed.

### Root Cause

CodeScene gate finding from the Task-9 change, overlooked when that task closed:

> `src/app/agent/tools/render-surface.tool.ts:25` · handler · Complex Method, cc=9 · introduced ·
> XC-03 — score 10.00 → 9.68.

Task 9 added the `surface === undefined` guard (`createSurface needs both a surfaceId and a
catalogId`, commit `220f9b0`), which pushed an already branch-heavy handler to the threshold. The
underlying shape, not the one guard, is the cause: the handler carried the whole validation
cascade *and* the apply/rollback step, so every new rule made it worse.

### Files Modified

- `src/app/agent/tools/render-surface.tool.ts` (modified) — `validateRenderRequest` +
  `RenderRequest` added; the handler now injects, validates once, applies, rolls back on throw.
  The `A2UI_RENDERER_CONFIG` injection moved up to the other three; the rollback comment's
  reference to "the fresh-id check above" was corrected to name the function.

### Files Read (Context Only)

- `src/app/agent/tools/render-surface.tool.spec.ts` — the 20 specs that pin every rejection path
  (they are the safety net for this refactor) and the `TestBed` setup, which always provides
  `provideA2uiCatalog(...)`.
- `src/app/a2ui/surface-host-rules.ts` — `createdSurface`'s return shape.
- `@a2ui/angular` types — `processMessages(messages: A2uiMessage[])` takes a mutable array, which
  fixes the `messages` field of `RenderRequest`.

### Key Decisions

— session 2026-09-14

- **A discriminated union, not `Rejection | undefined`.** The validator also produces the
  `surface` the apply step needs; a bare "rejection or nothing" return would leave `surface`
  un-narrowed in the handler and force a non-null assertion. `RenderRequest` carries either
  `{ ok: true, messages, surface }` or `{ ok: false, code, result }`.
- **The rejection shape mirrors `ToolResult`,** so it maps 1:1 onto the existing `fail(code,
  result)`. `fail` stays in the handler: the failure handler and `context.toolCall.id` are the
  handler's business, and keeping them there leaves exactly one notification site.
- **`A2UI_RENDERER_CONFIG` is injected with the other dependencies now.** It used to be read
  halfway down, after four guards. The handler's synchronous prefix is still the injection
  context, and every spec provides the token through `provideA2uiCatalog`.
- **The validator takes the renderer, not a predicate.** The "surfaceId already taken" rule
  consults host state; passing an `isTaken` callback would abstract one call site for nothing.

### Review Focus

- **Behavior claims:** (1) every rejection returns the same code and payload as before and still
  fires `RENDER_FAILURE_HANDLER` exactly once; (2) the rollback path is untouched — a throw during
  apply still deletes the surface; (3) the handler's cyclomatic complexity drops from 9 to 4 and
  the extracted function sits at 7.
- **Plan deviations:** No plan (fix lane).
- **Assumptions / choices:** the validator's parameter order (args, renderer, catalogs) keeps the
  host state in the middle; the `surface` shape is written inline in the union rather than exported
  from `surface-host-rules.ts` — one line, and that module stays untouched.
- **Scope notes:** None — one file, no spec changes.
- **Read next:**
  1. `src/app/agent/tools/render-surface.tool.ts:25-53` — the handler after the cut.
  2. `…:62-130` — `RenderRequest` and `validateRenderRequest`; compare the six branches against
     the specs named in `render-surface.tool.spec.ts`.

### Test Evidence

— session 2026-09-14

- `cs check src/app/agent/tools/render-surface.tool.ts` → `Code health score: 10.00` (was 9.68);
  the Complex Method finding is gone.
- `ng test shell` — 103 passed (19 files), including all 20 `renderSurfaceTool` specs: schema
  rejection, structural violations, reused surfaceId, forbidden model writes, unknown component,
  boundary rejection, rollback on a throwing data mount. No spec needed a change, which is the
  evidence that behavior is identical.
- `npx tsc -p tsconfig.app.json --noEmit` → 0. `npm run lint` → "All files pass linting".
  `npm run build` → succeeds.
- Agent and eval suites not re-run: this lane touches shell code only (they were green in the same
  tree earlier in the session).

### Open Issues

None.

### Context for Next Task

- Independent of the two other lanes in this tree (`refactor-vocabulary-single-source`,
  `chore-agent-contract`) — no shared file, so this one commits cleanly on its own.
- A new rejection rule belongs in `validateRenderRequest` and returns `{ ok: false, code, result }`;
  only `code` values the prompt/correction loop understands should be introduced.

### Git State

```
$ git diff --stat        # the tree holds THREE independent fix lanes; this lane marked ←
 agent/src/agent.spec.ts                    |  12 ++--
 agent/src/agent.ts                         |   3 +-
 agent/src/prompt.spec.ts                   |   8 ++-
 agent/src/prompt.ts                        |  16 ++---
 agent/src/server.spec.ts                   |   2 +-
 agent/src/server.ts                        |   9 ++-
 docs/architecture.md                       |  10 +++   ← lanes 1 + 2 (one bullet each)
 docs/improvements.md                       |   1 +
 eval/run-eval.ts                           |   5 +-
 src/app/a2ui/assistant-fragments.ts        |   6 +-
 src/app/a2ui/catalog-context.ts            |  19 ++---  ← lanes 1 + 2
 src/app/a2ui/custom-component.ts           |  26 +++++++
 src/app/agent/assistant-agent.token.ts     |   4 +-
 src/app/agent/me-context-entry.ts          |   3 +-
 src/app/agent/tools/render-surface.tool.ts | 111 +++++++++++   ←
 src/app/capabilities/charts/index.ts       |  17 ++---
 src/app/capabilities/maps/index.ts         |  12 ++--
 src/app/chat/chat.page.spec.ts             |   3 +-
 src/app/chat/chat.page.ts                  |   2 +-
 19 files changed, 174 insertions(+), 95 deletions(-)

$ git status --short     # untracked, repo files only; sandbox dotfiles omitted
?? docs/work/m1-spike/task-log/chore-agent-contract.md
?? docs/work/m1-spike/task-log/refactor-render-surface-validation.md
?? docs/work/m1-spike/task-log/refactor-vocabulary-single-source.md
?? shared/
?? src/app/capabilities/charts/vocabulary.ts
?? src/app/capabilities/maps/vocabulary.ts
?? chat-page-preview.png   ← throwaway, stays uncommitted
?? handoff.md              ← the parked-lane brief, stays uncommitted
```

### Sessions

- claude-code e79c70b1-1868-4a83-953f-ca42891f4948 (2026-09-14) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/e79c70b1-1868-4a83-953f-ca42891f4948.jsonl
