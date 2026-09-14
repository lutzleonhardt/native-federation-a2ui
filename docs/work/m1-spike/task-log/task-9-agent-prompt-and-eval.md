# Task 9: Agent prompt for requests 1–3 and the `npm run eval` model-behavior harness (M1 gate)

### Task

Gave the agent a system prompt assembled per run from the AG-UI context the shell already
sends, and built a headless Node harness that drives the real agent through the three demo
requests, records the emitted surfaces and scores them — the M1 gate.

### Status

DONE — gate reached: A1 5/5, A2 5/5, A3 4/5, `npm run eval` exit 0. Independent review by
Codex was performed and absorbed: all four hotspots and all three blind spots are addressed.
`npm test` exits 0 (shell 103/103 in 19 files, agent 25/25, eval 16/16), `npm run lint` and
`npm run build` are clean.

Two things changed materially against the first wrap-up. The review showed the scorer was a
weaker sieve than the shell's boundary, so the earlier "5/5 on every request" was measured
too permissively; after the fixes A3 sits **at** the 4/5 bar, not above it. And the XC-03
claim in that wrap-up ("scorer and guard agree on the same reserved paths") was false when
written — the scorer knew two of four client-owned segments. It is true now.

Verification limits remain: the A3 prompt example is close to the request-3 answer, and the
chain "real model → real renderer → click" (XC-01) has still never run end to end.

### Files Modified

- `agent/src/prompt.ts` (new) — `buildInstructions(context)`: output rules, A2UI format rules with two worked examples, wiring/binding/event rules, then the catalog section and the location section. Sections are ordered stable-first so a later prompt-cache breakpoint behind the vocabulary survives a city change. The client-events rule instructs the model to *add* a `reserve` button to any single-conference detail view, not merely which event names are allowed.
- `agent/src/agent.ts` (modified) — `instructions` changed from a constant to a function over `requestContext.get('ag-ui')`, typed through the named `ParkedAgUiInput` rather than narrowed from `unknown`. The placeholder instructions and the "server stays free of A2UI knowledge" comment are gone — that claim no longer holds, and deliberately so.
- `agent/src/prompt.spec.ts` (new) — T9-AC-01 plus the section-order and rule-presence pins.
- `agent/src/agent.spec.ts` (new) — the wiring `prompt.spec.ts` cannot see: park a context under the `ag-ui` key, call `getInstructions`, expect vocabulary and location in the text; a third case pins that two runs with different cities yield different prompts.
- `src/app/a2ui/surface-host-rules.ts` (new) — the host rules an A2UI message list must satisfy beyond its schema (client-owned segments, exactly one `createSurface`, no `deleteSurface`, matching `surfaceId`), framework-free so the shell boundary and the eval scorer share one copy.
- `src/app/agent/tools/render-surface.tool.ts` (modified) — the cross-message rules and the forbidden-write scan moved into `surface-host-rules.ts`; `resolveSurfaceId` dissolved into `findStructuralViolations` + `createdSurface`. 98 lines lighter, same behavior (its spec is unchanged and green).
- `src/app/a2ui/catalog-context.ts` (modified) — the file became framework-free: it now owns the vocabulary list (`GAUGE_META`, `TIMELINE_META`, `MAP_META`, `daysUntilFn`, `distanceFn`) and dedupes against `@a2ui/web_core/v0_9/basic_catalog` instead of reaching `mergeFragments` in `assistant-catalog.ts`. `catalogToContextEntry()` lost its parameter.
- `src/app/a2ui/catalog-context.spec.ts` (modified) — call site updated; new test pins that the serialized vocabulary names equal the names the rendered catalog implements (XC-04 anti-drift).
- `src/app/a2ui/assistant-fragments.ts` (modified) — doc comment no longer claims to be the single list; names its model-facing twin.
- `src/app/chat/chat.page.ts` (modified) — `catalogToContextEntry()` without the fragments argument; the now-unused import dropped.
- `eval/run-eval.ts` (new) — the harness: builds `tools[]` and `context[]` like the shell, drives `HttpAgent` through the three requests × N runs, executes the client tools in Node (`findConferences` real, `renderSurface` recorded, `messageWidget` acknowledged), scores and prints, exits non-zero below the gate. Tool results are flat, matching the shell's shapes exactly; `EVAL_RUNS` must be a positive integer and an empty result can no longer clear the gate.
- `eval/score.ts` (new) — pure scorer: A1/A2/A3 plus the global fail conditions. The host-rule half now comes from `surface-host-rules.ts` instead of a local copy that knew only two of the four client-owned segments and no cross-message rule at all.
- `eval/score.spec.ts` (new) — T9-AC-02 including the three negative cases, plus seven regression cases from the review: writes to `/byMonth`, `/byTopic`, `/` and `""`, a call without `createSurface`, one with two, and one containing `deleteSurface` or a foreign `surfaceId`.
- `eval/tsconfig.json`, `eval/vitest.config.ts`, `eval/package.json` (new) — own TS project, own Node test project, and the `"type": "module"` marker.
- `package.json` (modified) — `eval` and `test:eval` scripts, `test` chains the eval project, `tsx` and `@types/node` as devDependencies.
- `.gitignore` (modified) — `eval/node_modules`, where Vitest puts its cache once the eval project has its own root.
- `docs/work/m1-spike/plan.md` (modified) — Task-9 amendment, see Plan deviations.
- `docs/architecture.md` (modified) — agent-runtime seam, roadmap status, and the invariant "The server knows no A2UI", which the server prompt had made false; it now reads "The server holds no vocabulary" and says what the prompt does carry. The same claim sat a second time in the Mermaid diagram and was corrected there too. Two stale statements fixed on the way: the roadmap still claimed 5/5 on every request, and the header said "Tasks 1–7, status 2026-09-10" while the diagram already showed Task 9. The harness is now named as the second consumer of the framework-free definitions, which is where the no-Angular rule comes from.
- `README.md` (modified) — scripts table gained `test:eval` and `eval` (and `npm test` covers three suites now, not two), plus a "model-behavior gate" section: what the harness answers that the suites cannot, its preconditions, and that a full run spends real API credit.
- `docs/improvements.md` (modified) — three promotions, see Open Issues.
- `docs/spec.md` (modified) — capability table no longer claims `formatString` interpolates; the same line was corrected in the upstream original outside this repo.

### Files Read (Context Only)

- `src/app/agent/tools/render-surface.tool.ts`, `find-conferences.tool.ts`, `create-frontend-tool.ts` — the tool boundary the harness had to mirror (validation, turn-end suffix, compact result shape).
- `src/app/chat/chat.page.spec.ts::requestThreeSurface` — the verified reference surface; it became both the prompt example and the scorer fixture.
- `src/app/a2ui/assistant-catalog.ts`, `custom-component.ts`, `catalog-function.ts` — where the Angular dependency sat and what the metadata half looks like.
- `@ag-ui/mastra` dist (`applyInputContext`, `streamMastraAgent`), `@mastra/core` (`getInstructions`, `DynamicArgument`), `@copilotkit/core` (`createToolSchema`), `@a2ui/web_core/v0_9/basic_catalog` — the upstream behavior every claim in this log rests on.
- `docs/work/m1-spike/task-log/task-7-chat-page.md` — the knowledge-gap table and the correction contract.
- `docs/work/m1-spike/task-log/task-6-client-tools.md` — the naming history behind `CLIENT_OWNED_PATHS` and `findForbiddenModelWrites`; it still names `resolveSurfaceId`, which this task dissolved (historical record, left as written).

### Key Decisions

— session 2026-09-12

- **The context channel is unchanged; only the server end is new.** Verified: `grep -rl "ag-ui" @mastra/core/dist` hits two documentation files and no runtime code. `@ag-ui/mastra` parks `RunAgentInput.context` under that key and nothing reads it, so a run carried the catalog to the server and dropped it there. That is the whole explanation for the Task-7 live finding that the model invented `ConferenceList` with the correct names sitting in the request.
- **`instructions` as a function, evaluated per run.** `@mastra/core/dist/agent-B8m3ps7U.js:33489` resolves `getInstructions({ requestContext })` inside the stream path and `:33503` calls the function without caching. A constant would freeze the first run's vocabulary and location; the location entry is an accessor in the shell and changes with the picker.
- **The parked AG-UI input is typed, not re-validated.** The first version took `unknown` from `requestContext.get` and narrowed it by hand — a second check for an invariant the route already enforces: `RunAgentInputSchema.safeParse` rejects the request with 400, and that schema makes `context` required. The contract is now a named `ParkedAgUiInput` supplied through `get`'s own return-type parameter; a deliberate-typo probe confirmed tsc enforces it rather than collapsing to `any`. Typing it properly via the class generic was checked and rejected: `TRequestContext` is Mastra's 4th type parameter and invariant, and its own doc comment warns that a narrowed agent stops being assignable to the bare `Agent` — which `server.ts` needs for its `ReadonlyMap<string, Agent>` and `new MastraAgent({ agent })`. The remaining `?? []` covers real optionality (`getInstructions()` outside a run), not structural doubt.
- **Prompt ordered stable-first, volatile-last.** Prompt caching is not enabled (no `cacheControl` in the provider options), so nothing is lost today — but the ordering costs nothing and keeps a later breakpoint behind the vocabulary useful. Enabling caching was deliberately left out of this task: cost optimization, not a gate criterion.
- **`catalog-context.ts` became the framework-free side rather than gaining a new sibling module.** `@a2ui/angular/v0_9` does not load in Node ("partially compiled library… Angular Linker has not processed"), and it was reached only through `mergeFragments` for the basic *names*. `@a2ui/web_core/v0_9/basic_catalog` exports the same names framework-free (18 components, 25 functions, verified by import). A separate `assistant-vocabulary.ts` was rejected as a file without a second consumer; the cost is that the vocabulary is now listed twice — once model-facing, once Angular-bound — which a spec pins against drift.
- **The plan's `formatString("in {0} Tagen", daysUntil(…))` does not exist.** `FormatStringApi` (`basic_functions_api.js:326`) takes one argument and coerces it to a string; the basic catalog has no interpolation function at all. Teaching the model that signature would have produced failures the correction loop could not fix. The example now uses the composition from `chat.page.spec.ts::requestThreeSurface`, which is proven to render, and a prompt rule names the missing capability explicitly.
- **The harness records semantic violations instead of rejecting them.** The shell rejects a write to `/filteredConfs` with `forbidden_model_writes` and starts a correction run. The harness validates only *shape* (the tool's zod schema and `A2uiMessageListWrapperSchema`) and lets host-rule violations through, because the scorer has to see them — a corrected second attempt would hide exactly what is being measured.
- **The gate is a ratio, not the literal number 4.** The first smoke run with `EVAL_RUNS=1` reported a perfect 1/1 as "below gate". `passes >= ceil(runs * 4/5)` judges a short run by the same bar.
- **`eval/` is its own ESM project.** Without `"type": "module"` tsx compiles to CJS, where the top-level `await main()` fails — and CJS interop with the ESM-only a2ui packages would have been the next surprise. Its own `vitest.config.ts` exists because the scorer fits neither existing runner: the shell's is browser-mode, the agent's only sees `agent/src`, and the agent project is deliberately A2UI-free.
- **`schemaToJsonSchema` from `@copilotkit/shared` is imported directly** so the harness converts tool parameters with the exact function the browser uses. `createToolSchema` (which adds the `$schema`/`additionalProperties` stripping) is not exported, so those ~10 lines are mirrored with a comment pointing at the original — the one remaining drift surface on `tools[]`.
- **Scope discussion before implementation (user-driven).** The first file estimate was ~20 and wrong: it bundled the prompt (3 files) with the harness and an inflated set of "framework-free extractions" that collapsed to one changed file once the Node probe showed tool definitions and domain logic already import cleanly. The user pushed back twice; the result was the plan amendment below and a final 16 touched files. A 9a/9b split was proposed and withdrawn.

— session 2026-09-14 (Codex review absorbed)

- **The host rules became one shared module** (`src/app/a2ui/surface-host-rules.ts`), **superseding the 2026-09-12 decision to duplicate them in the harness.** That decision reasoned "~15 lines, duplication is cheaper than a shared module"; the review found three separate defects caused by exactly that copy — the scorer knew `filteredConfs`/`me` but not `byMonth`/`byTopic`, treated a root write as harmless, and enforced no cross-message rule at all, so a call with no `createSurface`, with two of them, or containing `deleteSurface` scored as success. All seven counterexamples were reproduced before the fix. The boundary was evident by then: "what an A2UI message list must satisfy beyond its schema", framework-free, two real consumers. `render-surface.tool.ts` lost 98 lines and its `resolveSurfaceId`, which split into `findStructuralViolations` (rules) and `createdSurface` (the value the tool needs); the tool's own spec is unchanged and green, which is the evidence that the extraction is behavior-preserving.
- **Tool results in the harness are flat, like the shell's.** The first version wrapped everything in `{ ok, result: … }` while the shell returns `{ ok, count, mountedAt, next }` and `{ ok, surfaceId }`. The model reads these fields, so the gate was measuring a context the browser never produces. Same source of error as above: reconstructed instead of shared. The shapes are small enough to keep duplicated, but they are now duplicated *correctly* and the mirroring is stated in a comment.
- **An empty evaluation is not a passed gate.** `EVAL_RUNS=0` and `EVAL_RUNS=abc` both produced "0/0 — Gate reached", exit 0 (reproduced). `positiveInteger()` rejects both, and the gate additionally requires `verdicts.length > 0`.
- **The prompt tells the model to add the reserve button; it did not before.** The rule only listed which event names are allowed. Request 3 never mentions reserving, so the model reasonably left the button out — but the plan scores request 4's contract inside request 3. This is a product rule that was missing from the prompt, not a concession to the scorer.
- **The scorer judges one message list, not a list of calls.** `score()` now returns early when a run did not produce exactly one `renderSurface`; everything below it takes `readonly unknown[]`. Before, the count check and the per-call loop sat side by side, and the requirement checks flattened across *all* calls — a two-surface run could have satisfied A3 by taking the Map from one surface and the Gauge from another, harmless only because the count check failed the run anyway. Correctness from second hand is the kind that disappears in the next refactor. One behavior change: a run with two surfaces now reports only the count, no further detail.
- **`isRecord`/`record` exist once.** Both `surface-host-rules.ts` and `score.ts` had a private copy of the same three-line JSON narrowing; they are now exported from the former, which already declares reading raw model output as its job. A separate `json.ts` was rejected — twelve lines of module for two predicates with two consumers inside the same concern.
- **The first "5/5 on every request" does not survive scrutiny.** After the fixes A3 measured 3/5, and after the prompt rule 4/5. With n=5 and a rate near 0.8, 5/5, 4/5 and 3/5 are all unremarkable, so the fixes cannot be shown to have lowered the rate — but the earlier number was produced by a sieve that is now known to have been too coarse, and A3 currently sits *at* the bar. Recorded as "gate reached, little margin" rather than as a comfortable pass.

### Review Focus

- **Behavior claims:**
  1. Every run request produces a system prompt built from that run's context — catalog entry → "Custom Catalog" section, location entry → closing location line, missing catalog → explicit note — and the agent reads it through the `ag-ui` key the adapter actually writes (T9-AC-01, covered at both levels).
  2. Anything the shell's `renderSurface` boundary rejects also fails the scorer, because both import the same host rules: client-owned writes (all four segments plus the root), more than one or no `createSurface`, `deleteSurface`, a foreign `surfaceId` (T9-AC-02, XC-03).
  3. Against the real agent, requests 1 and 2 wired correctly in 5 of 5 runs and request 3 in 4 of 5; `npm run eval` exits 0 (T9-AC-03).
- **Plan deviations:**
  - Plan T9-AC-03 / the `eval/report.ts` bullet: `docs/eval/<date>-…md` with token usage, provider cross-check as a gate variable → stdout summary only → user-approved trim, plan amended before implementation (2026-09-12).
  - Plan: `agent/src/catalog-instructions.ts`, `eval/client-tools.ts`, `eval/report.ts` as separate files → folded into `prompt.ts` and `run-eval.ts` → nothing at this size justifies the split.
  - Plan line 362 scoring: "exactly one `renderSurface`" listed only under A1 → applied to all three requirements → it is the first output rule.
  - Plan example `formatString("in {0} Tagen", …)` → bare `daysUntil` call plus a caption `Text` → the function does not exist; the spec was corrected on both sides.
  - Plan Key Locations: no `src/app/a2ui/` or `src/app/agent/tools/` changes foreseen → `catalog-context.ts` had to become Node-importable, and `render-surface.tool.ts` gave up its host rules to a shared module → the first is in the plan amendment, the second came out of the review.
  - Files beyond the amended plan: `eval/package.json`, `eval/vitest.config.ts`, `.gitignore`, `@types/node`, `surface-host-rules.ts`, `agent/src/agent.spec.ts`.
- **Assumptions / choices:** eval location fixed to Berlin so runs stay comparable; `EVAL_RUNS` defaults to 5, `EVAL_AGENT_URL` to `localhost:3001`; at most one correction run per request (the shell allows three) to bound cost; prompt in English, surface labels in the examples German because the demo prompts are German; the prompt instructs a `reserve` button on every single-conference detail view.
- **Scope notes:** `docs/architecture.md`, `docs/improvements.md` and `docs/spec.md` updated as living documents; the upstream copy of the spec was corrected outside this repo. `handoff.md` at the repo root parks the vocabulary fix lane and must **not** be committed. Still from Task 7 and not this task's to decide: `start:shell --port 4300`, the untracked `chat-page-preview.png`, and the stray root dotfiles.
- **Read next:**
  1. `src/app/a2ui/surface-host-rules.ts` — one module now decides what both the shell boundary and the gate accept; a wrong rule here is wrong in two places at once.
  2. `agent/src/prompt.ts` — the gate result hangs on this text, in particular the two worked examples and the reserve-button rule added after A3 measured 3/5.
  3. `eval/run-eval.ts::driveRequest` + `pendingToolCalls` — the hand-rolled twin of CopilotKit's turn loop; a bug here silently shortens runs.

### Test Evidence

— session 2026-09-12

- `npm test` → exit 0. Shell 103 passed (19 files, browser mode), agent 22 passed (3 files, after `tsc --noEmit`), eval 9 passed (1 file, after `tsc -p eval/tsconfig.json`).
- `npm run lint` → "All files pass linting." `npm run build` → succeeds (only the pre-existing `node-fetch`/CommonJS warning).
- `npm run eval` against Anthropic `claude-sonnet-5`, agent on 3001, 5 runs × 3 requests:

  ```
  Request 1 (A1): 5/5
  Request 2 (A2): 5/5
  Request 3 (A3): 5/5
  Gate reached.
  ```

  Per-run durations 6.0–18.1 s; A3 the slowest. An earlier `EVAL_RUNS=1` smoke run passed all three and exposed the absolute-threshold bug fixed above.
- Node-importability probes (both temporary, **removed**, no probe left in the tree):
  - `tsx` over `gauge.schema`/`timeline.schema`/`map.schema`, both catalog functions, `render-surface.definition` and `find-conferences` → `metas: Gauge,Timeline,Map` / `fns: daysUntil,distance` / `findConferences -> 9 ng-atlas München`.
  - `import('@a2ui/angular/v0_9')` → fails with the partially-compiled-library error; `import('@a2ui/web_core/v0_9/basic_catalog')` → loads in ~1 s with 18 components and 25 functions. This is the constraint behind the `catalog-context.ts` rewrite and is recorded in the file's own header comment.
  - `catalogToContextEntry()` under `tsx` after the rewrite → `components: Gauge,Timeline,Map`, `functions: daysUntil,distance`, 7936 bytes.
- Not run in this session: any browser interaction with the real agent. The playwright browsers had to be installed first (`npx playwright install chromium`) for the shell suite to run at all.

— session 2026-09-14 (after the review fixes; these supersede the runs above for the current code)

- `npm test` → exit 0: shell 103 passed (19 files), agent 25 passed (4 files, +3 for `agent.spec.ts`), eval 16 passed (+7 host-rule regressions). `npm run lint` clean, `npm run build` succeeds.
- Counterexamples reproduced **before** the fix, all reported `passed: true` by the scorer while the shell rejects them: writes to `/byMonth`, `/byTopic`, `/`, `""`; a call without `createSurface`; a call with two `createSurface`; a call containing `deleteSurface`. Each is now a spec in `eval/score.spec.ts`.
- `EVAL_RUNS=0` and `EVAL_RUNS=abc` reproduced as "Request 1–3: 0/0 · Gate reached" before the fix.
- Gate run 1 after the code fixes, before the prompt rule — **failed**:

  ```
  Request 1 (A1): 5/5    Request 2 (A2): 5/5    Request 3 (A3): 3/5  ← below gate
      run 1: no Button dispatching reserve with id bound to /selectedConf/id
      run 3: no Button dispatching reserve with id bound to /selectedConf/id
  Gate NOT reached.
  ```

- Gate run 2 after the prompt rule — **passed**:

  ```
  Request 1 (A1): 5/5    Request 2 (A2): 5/5    Request 3 (A3): 4/5
      run 4: no Button dispatching reserve with id bound to /selectedConf/id
  Gate reached.
  ```

- Temporary probe for the review findings (`verify-review.ts`, drove `score()` with the counterexamples): **removed**, no probe left in the tree.

### Acceptance Coverage

- T9-AC-01 — `passed`: `agent/src/prompt.spec.ts` ("lists every component and function of the catalog entry under Custom Catalog", "notes the missing vocabulary when no catalog entry arrives") and `agent/src/agent.spec.ts`, which covers the same AC through the real agent and the `ag-ui` key rather than through `buildInstructions` alone.
- T9-AC-02 — `passed`: `eval/score.spec.ts` — the wired surface passes A3; literal `selected`, `/filteredConfs` write and date literal fail it; plus the seven review regressions (three more client-owned paths, root write, missing/duplicate `createSurface`, `deleteSurface`, foreign `surfaceId`).
- T9-AC-03 — `passed`, with little margin: A1 5/5, A2 5/5, **A3 4/5**, exit 0. The first measurement (5/5 across the board) predates the scorer fixes and should not be cited. Per the plan amendment no report file is written; both gate runs are above under Test Evidence, including the failed one.
- XC-03 (contribution) — `passed`. **This line was wrong in the first wrap-up**: it claimed prompt rule, scorer and Task-6 guard agreed on the same reserved paths while the scorer knew two of four segments and no root write. They now agree because both sides import `CLIENT_OWNED_SEGMENTS` and `findForbiddenModelWrites` from `surface-host-rules.ts`.
- XC-04 (contribution) — `passed`: shell and harness call the same `catalogToContextEntry()`, the same tool definitions and now the same host rules; `catalog-context.spec.ts` pins the vocabulary against the rendered catalog. Residual: the JSON-Schema post-processing is still mirrored rather than shared, and the two tool-result shapes are duplicated (correctly, and marked as such).
- XC-01 (contribution) — `partial`: the model half is proven (A3 4/5), the renderer half in T7-AC-03, but no single run has gone from the real model through the real renderer to a marker click. See Open Issues.

### Open Issues

- XC-01 has never run as one chain: real model → real renderer → click with zero network requests. Both halves are green separately. A manual check in the running app would close it (→ XC-01, plan's Cross-Cutting Acceptance).
- Promoted: the A3 prompt example is close to the request-3 answer, so the gate measures "follows a worked example reliably", not "derives the wiring" — harden by varying the request phrasing or thinning the example (→ improvements register).
- Promoted: prompt caching is not enabled; the prompt is already ordered for it (→ improvements register).
- Promoted: `ng lint` covers only `src/**`, so `eval/` and `agent/` are unlinted (→ improvements register).
- Parked for a fix lane after `/commit 9`: the assistant vocabulary is enumerated twice — framework-free in `catalog-context.ts`, Angular-paired in `capabilities/*/index.ts` — because the enumeration and the pairing share a module. Problem, cause and the proposed per-capability split are written up in `handoff.md` at the repo root (delete it once done). A spec catches the drift today; the fix makes it a compile error.
- Resolved this session, no longer open: the `docs/spec.md` / upstream `formatString` claim (corrected on both sides), and the XC-03 mismatch between scorer and shell guard.
- `docs/spec.md` line 168 lists the "missing vocabulary" case (a request against a capability absent from the catalog) as verified by `npm run eval`. The harness covers requests 1–3 only; that case needs a missing remote and therefore M2. Not a gap in this task, but the eval must not be read as covering spec section 7 in full.
- Carried from Task 7, still unresolved and blocking a clean `/commit 9`: the user-local `start:shell --port 4300` line, `chat-page-preview.png`, and the stray dotfiles in the repo root.

### Context for Next Task

- **Signatures:** `buildInstructions(context: readonly Context[]): string`; `catalogToContextEntry(): Context` (no parameter); `score(requirement: 'A1'|'A2'|'A3', calls: readonly RecordedCall[]): { passed, reasons }`; and from `src/app/a2ui/surface-host-rules.ts`: `findStructuralViolations(messages: readonly unknown[]): SurfaceViolation[]`, `findForbiddenModelWrites(messages): string[]`, `createdSurface(messages): { surfaceId, catalogId } | undefined`, `segmentsOf(path)`, `surfaceIdOf(message)`, `CLIENT_OWNED_SEGMENTS`.
- **Host rules live in one place now.** Anything the shell's `renderSurface` boundary rejects must fail the eval scorer too; both import `surface-host-rules.ts`. Adding a rule means adding it there, not in either consumer. `resolveSurfaceId` no longer exists — the Task-6 log still names it, which is correct as history.
- **The two context entries are addressed by `description`** — `'A2UI Custom Catalog'` and `'User location (me)'`. Those strings are the contract between `catalog-context.ts` / `me-context-entry.ts` and `prompt.ts`; renaming one silently empties a prompt section. `agent.spec.ts` now fails if the `ag-ui` key itself is renamed.
- **`catalog-context.ts` must never import `@a2ui/angular`**, directly or through `assistant-catalog.ts` — nor may `surface-host-rules.ts`. Both are reachable from the Node harness. `catalog-context.spec.ts` fails if vocabulary and rendered catalog drift apart.
- **Running the harness:** the agent must be up (`npm run start:agent`) with an API key, restarted after `.env` changes. `EVAL_RUNS=1` for a cheap smoke run (a positive integer is now enforced), `AGENT_PROVIDER`/`AGENT_MODEL` to point at another model. Real API calls, deliberately outside `npm test`.
- **A3 has little margin.** It passes at 4/5. The next prompt or model change should re-run the gate rather than assume it holds, and the failure to watch for is the missing `reserve` button.
- **Basic vocabulary is reachable framework-free** via `@a2ui/web_core/v0_9/basic_catalog` (`BASIC_COMPONENTS` as `ComponentApi[]` with zod schemas, `BASIC_FUNCTIONS`). The Task-7 knowledge-gap table wanted a curated basic subset in the context entry; still deliberately not added — it is the first lever if a later model does worse.
- **Gotchas:** `formatString` is a string coercion, not a template; the basic catalog has no interpolation function. `tsx` opens a unix socket in `TMPDIR`, which a sandboxed shell may refuse. Vitest caches into `eval/node_modules`, gitignored.

### Git State

```text
$ git diff --stat
.gitignore                                 |  1 +
 README.md                                  | 28 ++++++++-
 agent/src/agent.ts                         | 27 +++++---
 docs/architecture.md                       | 24 +++++---
 docs/improvements.md                       |  3 +
 docs/spec.md                               |  2 +-
 docs/work/m1-spike/plan.md                 | 21 +++++--
 package-lock.json                          | 53 ++++++++++++++++
 package.json                               | 10 ++-
 src/app/a2ui/assistant-fragments.ts        |  6 +-
 src/app/a2ui/catalog-context.spec.ts       | 22 +++++--
 src/app/a2ui/catalog-context.ts            | 52 ++++++++++++++--
 src/app/agent/tools/render-surface.tool.ts | 98 ++++++------------------------
 src/app/chat/chat.page.ts                  |  3 +-
 14 files changed, 233 insertions(+), 117 deletions(-)

$ git status --short
 M .gitignore
 M README.md
 M agent/src/agent.ts
 M docs/architecture.md
 M docs/improvements.md
 M docs/spec.md
 M docs/work/m1-spike/plan.md
 M package-lock.json
 M package.json
 M src/app/a2ui/assistant-fragments.ts
 M src/app/a2ui/catalog-context.spec.ts
 M src/app/a2ui/catalog-context.ts
 M src/app/agent/tools/render-surface.tool.ts
 M src/app/chat/chat.page.ts
?? agent/src/agent.spec.ts
?? agent/src/prompt.spec.ts
?? agent/src/prompt.ts
?? chat-page-preview.png
?? docs/work/m1-spike/task-log/task-9-agent-prompt-and-eval.md
?? eval/
?? handoff.md
?? src/app/a2ui/surface-host-rules.ts
(plus pre-existing, not this task's: chat-page-preview.png and stray root dotfiles)
```

### Sessions

- claude-code d69d7ecc-8530-4bf0-8a74-646cc0219eb6 (2026-09-12) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/d69d7ecc-8530-4bf0-8a74-646cc0219eb6.jsonl
