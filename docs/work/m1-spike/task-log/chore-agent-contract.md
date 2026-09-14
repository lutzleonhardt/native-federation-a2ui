# chore: One contract module for shell, agent server and eval harness

### Task

Replaced the independently written copies of the four constants that shell, agent server and eval
harness must agree on — agent id, port, `/ag-ui/:agentId` route shape, and the two context-entry
descriptions — with one import-free leaf module, `shared/agent-contract.ts`, that all three
projects import.

### Status

DONE — implementation complete, all checks green (see Test Evidence), including a live smoke test
of the now-computed routes. Independent review not yet performed; the change is not committed
(`/commit` pending, see Context for Next Task for the commit-split question).

### Root Cause

Not a bug — debt accumulated across tasks, older than Task 9: agent id and port come from Tasks 2
and 7, only the two context descriptions from Task 9. `ASSISTANT_AGENT_ID = 'assistant'` was
defined from scratch twice (`src/app/agent/assistant-agent.token.ts`, `agent/src/agent.ts`), the
agent URL spelled out three times (shell token, `agent/src/server.ts`, `eval/run-eval.ts`), and
the two `description` strings that address the context entries existed once on the producing side
and once in `agent/src/prompt.ts`. Nothing failed if one side changed — a renamed description
would have silently emptied a prompt section.

### Files Modified

- `shared/agent-contract.ts` (new) — `ASSISTANT_AGENT_ID`, `AGENT_PORT`,
  `CATALOG_CONTEXT_DESCRIPTION`, `LOCATION_CONTEXT_DESCRIPTION`, `agUiPath()`, `localAgentUrl()`;
  no imports of its own.
- `shared/package.json` (new) — `{ "type": "module" }`; without it the agent's `nodenext` +
  `verbatimModuleSyntax` reads the file as CommonJS and fails with TS1287.
- `agent/src/agent.ts` (modified) — dropped its own `ASSISTANT_AGENT_ID`, imports the shared one.
- `agent/src/server.ts` (modified) — dropped its own `AGENT_PORT`; both route strings now come
  from `agUiPath('*')` / `agUiPath(':agentId')`.
- `agent/src/prompt.ts` (modified) — `CATALOG_ENTRY` / `LOCATION_ENTRY` replaced by the shared
  constants; the comment they carried moved to the contract module.
- `agent/src/agent.spec.ts`, `agent/src/prompt.spec.ts` (modified) — context fixtures use the
  shared descriptions instead of repeating the strings.
- `agent/src/server.spec.ts` (modified) — imports the agent id from the contract; its
  `/ag-ui/...` route literals stay on purpose.
- `src/app/agent/assistant-agent.token.ts` (modified) — `ASSISTANT_AGENT_URL` is built via
  `localAgentUrl(ASSISTANT_AGENT_ID)`; the local id definition is gone.
- `src/app/a2ui/catalog-context.ts`, `src/app/agent/me-context-entry.ts` (modified) — the two
  descriptions come from the contract.
- `src/app/chat/chat.page.ts`, `src/app/chat/chat.page.spec.ts` (modified) — import the agent id
  from the contract instead of from the token module.
- `eval/run-eval.ts` (modified) — default `AGENT_URL` and the `HttpAgent` agent id from the
  contract.
- `docs/architecture.md` (modified) — new invariant "The shell/agent/eval contract is one file".
- `docs/improvements.md` (modified) — one promotion, see Open Issues.

### Files Read (Context Only)

- `agent/tsconfig.json` (`nodenext`, `verbatimModuleSyntax`, `noUnusedLocals`),
  `eval/tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json` — the three module resolutions
  the shared file has to satisfy.
- `agent/src/config.ts` usage in `server.ts` (`SHELL_ORIGIN`, `DEFAULT_SHELL_ORIGIN`) — confirmed
  the 4200/4300 origin pair is a separate concern and stays out of the contract.
- `@ag-ui/mastra` dist (`applyInputContext`) — established that the `ag-ui` request-context key is
  hardcoded upstream (see Key Decisions).
- `handoff.md` (the parked fix lane with the verified probe results).

### Key Decisions

— session 2026-09-14

- **`agUiPath` returns a literal type, not `string`.** Hono derives the typed path parameter from
  the route literal; with `agUiPath(agentId: string): string` the server's
  `c.req.param('agentId')` degrades to `string | undefined` (TS2345). The generic
  `agUiPath<Segment extends string>(agentId: Segment): \`/ag-ui/${Segment}\`` keeps the single
  source *and* Hono's inference. This is a deliberate exception to the repo's "no advanced type
  machinery in feature code" default, documented in one comment at the declaration.
- **`localAgentUrl(agentId)` added beyond the handoff's list.** Shell token and eval default build
  the identical `http://localhost:3001/ag-ui/assistant`; with only `AGENT_PORT` + `agUiPath` that
  composition would be duplicated in two places. `AGENT_PORT` and `agUiPath` stay exported — the
  server needs the parts, not the URL.
- **No pass-through re-exports.** The handoff proposed re-exporting `ASSISTANT_AGENT_ID` from
  `agent/src/agent.ts` so existing importers keep working; instead all six consumers import the
  contract directly. One less alias, and every call site says where the value comes from.
- **Which literals stay, and where.** The producing side keeps them as the pin, so a rename stays
  a visible decision: `catalog-context.spec.ts` ('A2UI Custom Catalog'), `chat.page.spec.ts`
  ('User location (me)', and the fake `http://agent.test/ag-ui/assistant`), and
  `server.spec.ts`, which posts to the literal route while `server.ts` composes it. The
  consuming agent specs use the constants — they test the mechanism, not the string.
- **`AG_UI_KEY = 'ag-ui'` deliberately stays out of the contract** (user question in-session). It
  is not an agreement between our three projects but between `agent/src/agent.ts` and
  `@ag-ui/mastra`, which hardcodes `this.requestContext.set('ag-ui', { context: e })` in
  `applyInputContext`. Shell and eval never touch the key, and we cannot rename it — a shared
  constant would suggest otherwise. The duplicated literal in `agent.spec.ts` is the intentional
  pin for *our* side of it.

### Review Focus

- **Behavior claims:** (1) shell, agent server and eval harness resolve agent id, port, route
  shape and both context descriptions from one module — a rename there reaches all three;
  (2) the running server still serves the same routes: 400 on an invalid body, 404 for an unknown
  agent, 204 on the CORS preflight; (3) nothing model-facing changed — the prompt text and the
  serialized context are identical, the constants carry the same values.
- **Plan deviations:** No plan (fix lane). Deviations from the handoff's proposal: `agUiPath`'s
  signature, the added `localAgentUrl`, and no re-export from `agent.ts` — all under Key Decisions.
- **Assumptions / choices:** `shared/` sits at the repo root, outside every `tsconfig` `include`;
  it enters each program through the import, which is why all four type-checks were run
  explicitly. The shell dev-server port vs. `SHELL_ORIGIN` (4300/4200) is a different pair and was
  left alone.
- **Scope notes:** `chat.page.ts` / `chat.page.spec.ts` were not on the handoff's site list — they
  imported the agent id from the token module, which no longer defines it.
  `docs/architecture.md` gained the invariant.
- **Read next:**
  1. `shared/agent-contract.ts` — 20 lines; the import-free rule and `agUiPath`'s literal return
     type are the two things that make it work in three resolutions.
  2. `agent/src/server.ts:11,24,26` — route composition; the typed `c.req.param('agentId')`
     immediately below is what the literal type protects.
  3. `src/app/agent/assistant-agent.token.ts` — the URL is now derived; no spec pins its value.

### Test Evidence

— session 2026-09-14

- `npm test` — shell 103 passed, agent 25 passed, eval 16 passed (unchanged counts).
- Type-checks, all four resolutions: `npm --prefix agent run typecheck` (nodenext),
  `npx tsc -p tsconfig.app.json --noEmit`, `-p tsconfig.spec.json`, `-p eval/tsconfig.json` — 0
  errors each. The TS2345 above was found by exactly this run and fixed before anything else.
- `npm run lint` — "All files pass linting". `npm run build` — succeeds.
- **Live smoke test of the computed routes** (`npm run start:agent`, stopped again afterwards; no
  process left running):
  - `POST localhost:3001/ag-ui/assistant` with `{"threadId":"x"}` → `400`
  - `POST localhost:3001/ag-ui/unknown` → `404`
  - `OPTIONS localhost:3001/ag-ui/assistant`, `Origin: http://localhost:4200` → `204`
- Context payload after the change: description `A2UI Custom Catalog`, value byte-identical to the
  pre-refactor baseline (`diff` empty) — the shared constant carries the same string.
- No `npm run eval` — no model-facing content changed.

### Open Issues

- Promoted: an upstream rename of the `ag-ui` request-context key would go unnoticed
  (→ improvements register).

### Context for Next Task

- **Two lanes share two files, which the commit split has to respect.** This working tree holds
  three fix lanes; `refactor-render-surface-validation` is disjoint, but this lane and
  `refactor-vocabulary-single-source` overlap: `src/app/a2ui/catalog-context.ts` and
  `docs/architecture.md` carry changes from *both*; whole-file staging of either lane alone
  produces a commit that does not build. Two clean commits need hunk-level staging for those two
  files — otherwise both lanes belong in one commit.
- Adding a constant to the contract: keep the module import-free, and remember the agent imports
  it with the `.js` extension (`../../shared/agent-contract.js`) while shell and eval import it
  without one. That asymmetry is unavoidable with three module resolutions in one repo.
- M2/M4 relevance: replay and BYOK agents swap in at `ASSISTANT_AGENT`; the contract already
  separates id, port and route so a non-local agent URL only replaces `localAgentUrl`.

### Git State

```
$ git diff --stat        # the tree holds THREE independent fix lanes; this lane marked ←
 agent/src/agent.spec.ts                    |  12 ++--   ←
 agent/src/agent.ts                         |   3 +-   ←
 agent/src/prompt.spec.ts                   |   8 ++-   ←
 agent/src/prompt.ts                        |  16 ++---   ←
 agent/src/server.spec.ts                   |   2 +-   ←
 agent/src/server.ts                        |   9 ++-   ←
 docs/architecture.md                       |  10 +++   ← lanes 1 + 2 (one bullet each)
 docs/improvements.md                       |   1 +   ←
 eval/run-eval.ts                           |   5 +-   ←
 src/app/a2ui/assistant-fragments.ts        |   6 +-
 src/app/a2ui/catalog-context.ts            |  19 ++---  ← lanes 1 + 2
 src/app/a2ui/custom-component.ts           |  26 +++++++
 src/app/agent/assistant-agent.token.ts     |   4 +-   ←
 src/app/agent/me-context-entry.ts          |   3 +-   ←
 src/app/agent/tools/render-surface.tool.ts | 111 +++++++++++
 src/app/capabilities/charts/index.ts       |  17 ++---
 src/app/capabilities/maps/index.ts         |  12 ++--
 src/app/chat/chat.page.spec.ts             |   3 +-   ←
 src/app/chat/chat.page.ts                  |   2 +-   ←
 19 files changed, 174 insertions(+), 95 deletions(-)

$ git status --short     # untracked, repo files only; sandbox dotfiles omitted
?? docs/work/m1-spike/task-log/chore-agent-contract.md
?? docs/work/m1-spike/task-log/refactor-render-surface-validation.md
?? docs/work/m1-spike/task-log/refactor-vocabulary-single-source.md
?? shared/   ←
?? src/app/capabilities/charts/vocabulary.ts
?? src/app/capabilities/maps/vocabulary.ts
?? chat-page-preview.png   ← throwaway, stays uncommitted
?? handoff.md              ← the parked-lane brief, stays uncommitted
```

### Sessions

- claude-code e79c70b1-1868-4a83-953f-ca42891f4948 (2026-09-14) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/e79c70b1-1868-4a83-953f-ca42891f4948.jsonl
