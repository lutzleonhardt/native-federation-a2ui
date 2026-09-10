# Task 6: Client tools `renderSurface`, `findConferences`, `messageWidget` with the surface data store

Current paths are `/filteredConfs` for the latest search result and `/selectedConf` for each surface’s selection. Historical decisions and test evidence below retain the names used in the original session; current file descriptions, acceptance references and handoff use the new names.

### Task

Built the client-tool layer under `src/app/agent/`: a typed `createFrontendTool` wrapper that
validates arguments at the tool boundary, the `SurfaceDataStore` root signals, the
`RENDER_FAILURE_HANDLER` token, and the three tools — `renderSurface` (schema → guards →
`processMessages` → client-side data mount), `findConferences` (wraps the pure domain function,
returns a compact summary), and `messageWidget` (markdown text, ends the turn) — each with a
framework-free `*.definition.ts` for the Task 9 eval harness.

### Status

DONE — client-tool implementation, the naming/path migration, and the absorbed Codex review (four
hotspot fixes, protocol-envelope tool schema, tool playground, architecture-doc expansion, English
UI strings) are complete and uncommitted. Current verification: `npm run lint`, full `npm test`
(shell **91** in 19 files, agent 14) and `npm run build` each exit 0 — this supersedes the earlier
partial-rerun caveat. Six revert probes confirmed the review fixes are test-guarded.

### Files Modified

- `src/app/agent/create-frontend-tool.ts` (new) — Typed tool specs and registration; validates untrusted arguments, appends the turn-end description for followUp: false, and exposes `onValidationFailure` so boundary rejections reach a failure channel; the doc comment marks which fields pass through with CopilotKit semantics.
- `src/app/agent/create-frontend-tool.spec.ts` (new) — Covers validation, parsed-argument forwarding, metadata and the turn-end suffix.
- `src/app/agent/surface-data.store.ts` (new) — Root signals hold the latest search result; me delegates to LocationStore.
- `src/app/agent/render-failure-handler.token.ts` (new) — Injectable render-failure callback with console.warn default for the later chat integration.
- `src/app/agent/tools/find-conferences.definition.ts` (new) — Framework-free tool definition; explains that the next renderSurface mounts the latest result at /filteredConfs.
- `src/app/agent/tools/find-conferences.tool.ts` (new) — Runs the domain search, replaces the stored result and returns a compact summary with mountedAt: /filteredConfs; `followUp: true` is explicit (mid-turn step, the model reacts to the result).
- `src/app/agent/tools/find-conferences.tool.spec.ts` (new) — Checks compact results, boundary validation, grouping, location handling and the new mount path.
- `src/app/agent/tools/render-surface.definition.ts` (new) — Framework-free protocol-envelope schema (createSurface/updateComponents/updateDataModel with required fields; no deleteSurface) and descriptions for /filteredConfs and the surface-local /selectedConf.
- `src/app/agent/tools/render-surface.tool.ts` (new) — Validates messages and catalog components, collects forbidden model writes on parsed path segments (root writes included), enforces one fresh surface per call (no deleteSurface, taken ids refused), applies model messages and client mount inside one try/catch with rollback, and reports every failure — boundary rejections included — exactly once.
- `src/app/agent/tools/render-surface.tool.spec.ts` (new) — Real-renderer acceptance tests; verifies all reported forbidden paths and mount/selection expectations, plus the review-hardening tests: segment/root bypass variants, boundary rejections reaching the failure handler, fresh-id reuse, deleteSurface (boundary and direct handler), mount-throw rollback, structural envelope-serialization check.
- `src/app/agent/tools/surface-tool-renderer.component.ts` (new) — OnPush ToolRenderer derives the created surface ID and parses completed results.
- `src/app/agent/tools/surface-tool-renderer.component.html` (new) — Displays the pending placeholder, completed surface or error text; UI strings in English ("Building surface …", "Could not build the surface (code).") per user decision.
- `src/app/agent/tools/surface-tool-renderer.component.spec.ts` (new) — Checks pending, success and error display, including forbidden_model_writes.
- `src/app/agent/tools/message-widget.definition.ts` (new) — Framework-free text argument schema and tool description.
- `src/app/agent/tools/message-widget.tool.ts` (new) — Defines the text tool with its renderer, followUp: false and an ok result.
- `src/app/agent/tools/message-widget.component.ts` (new) — Renders markdown asynchronously with a request ID to retain the latest result.
- `src/app/agent/tools/message-widget.component.html` (new) — Displays markdown through Angular-sanitized innerHTML.
- `src/app/agent/tools/message-widget.component.spec.ts` (new) — Checks markdown rendering, the turn-ending tool contract, and that out-of-order async renders keep the latest text (injectable render function).
- `src/app/a2ui/binding.ts` (modified) — Updates the binding example to /selectedConf/remaining.
- `src/app/a2ui/renderer-integration.spec.ts` (modified) — Exercises Gauge bindings and subsequent updates under /selectedConf.
- `src/app/capabilities/charts/days-until.fn.ts` (modified) — Updates the model-facing example to /selectedConf/date.
- `src/app/capabilities/charts/gauge.schema.ts` (modified) — Updates model-facing value/max examples to /selectedConf.
- `src/app/capabilities/charts/timeline.component.spec.ts` (modified) — Updates renderer fixtures and whole-data-model expectations to /filteredConfs.
- `src/app/capabilities/charts/timeline.component.ts` (modified) — Updates the conference-data comment to /filteredConfs.
- `src/app/capabilities/charts/timeline.schema.ts` (modified) — Updates selection and detail-binding examples to /selectedConf.
- `src/app/capabilities/maps/distance.fn.ts` (modified) — Updates model-facing distance examples to /selectedConf.
- `src/app/capabilities/maps/map.component.spec.ts` (modified) — Checks Map rendering from /filteredConfs and selection-to-Text updates through /selectedConf.
- `src/app/capabilities/maps/map.component.ts` (modified) — Updates the conference-data comment to /filteredConfs.
- `src/app/capabilities/maps/map.schema.ts` (modified) — Updates the model-facing selection example to /selectedConf.
- `src/app/playground/playground.ts` (modified) — Updates mounted data, Map/Timeline selection, detail bindings and pick-action context to the new paths.
- `src/app/playground/playground.html` (modified) — Updates the explanatory selection-path text.
- `src/app/playground/tool-playground.ts` + `.html` (new) — dev sandbox at `/playground/tools` (user-approved amendment): drives the real bound pipeline — location picker, `findConferences`, four `renderSurface` scenarios incl. failure cases, `messageWidget` — with `RENDER_FAILURE_HANDLER` bound to a visible log (the Task-7 binding pattern).
- `src/app/app.routes.ts` (modified) — lazy route for the tool playground.
- `docs/spec.md` (modified) — Uses /filteredConfs and /selectedConf throughout scenarios, protocol examples and future work.
- `docs/architecture.md` (modified) — new-path wording plus the Task-6 expansion: "One chat turn, in plain words", the renderSurface round-trip diagram with guard order and failure codes, the "our seam code" column in the layers table, three new invariants, v3.3 roadmap and status refresh; mermaid parse fix (a `;` inside note text ends the statement).
- `docs/work/m1-spike/plan.md` (modified) — Updates current/future task contracts and AC references to the new paths and forbidden_model_writes result; the Task-6 block gained the review amendments (envelope schema, segment guards, fresh-surface contract, onValidationFailure) and the tool-playground amendment; placeholder wording switched to English.
- `docs/work/m1-spike/task-log/task-6-client-tools.md` (new) — Merges task implementation and this session’s naming, path, test and handoff evidence.
- `docs/improvements.md` (modified) — Promotes the four existing Task-7 integration follow-ups that were carried into this merge.

**Outside Task 6:** the user-local `package.json` port change (4200 → 4300) is excluded from the task commit. Gitignored screenshots and test attachments are not task source files. `tool-playground-preview.png` and `tool-playground-error-preview.png` (repo root) are throwaway visual-probe outputs kept for the user — do not commit.

### Files Read (Context Only)

- `docs/work/m1-spike/task-log/task-3-conference-domain.md`, `task-4-assistant-catalog.md`, `task-5-selection-primitives.md` — prior domain, catalog, renderer and handoff decisions.
- `src/app/domain/find-conferences.ts`, `find-conferences.schema.ts`, `conference.ts`, `location.store.ts`, `cities.ts` — search inputs/results, fresh catalog loading, location data and city ids.
- `src/app/a2ui/provide-a2ui-catalog.ts`, `assistant-catalog.ts`, `catalog-context.ts`, `catalog-context.spec.ts`, `assistant-catalog.spec.ts` — provider, vocabulary and context assembly.
- `src/app/capabilities/shared/surface-action.ts`, `src/app/capabilities/charts/timeline.component.html` — surface actions and rendered marker selectors.
- `src/app/app.config.ts`, `package.json`, `angular.json`, `vitest-base.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json` — application providers and verification setup.
- `agent/src/server.ts` — existing shell-origin convention for the Task-7 handoff.
- `node_modules/@copilotkit/core/dist/index.mjs` — argument parsing and handler execution.
- `node_modules/@copilotkit/angular/dist/index.d.ts`, `dist/fesm2022/copilotkit-angular.mjs` — frontend tool types, renderer inputs and captured injection context.
- `node_modules/@copilotkit/shared/dist/standard-schema.mjs` — schema serialization support for root zod v4.
- `node_modules/@a2ui/web_core/src/v0_9/schema/server-to-client.js`, `server-to-client.d.ts`, `common-types.js` — message schemas, the four-variant server-to-client union and component envelopes.
- `node_modules/@a2ui/web_core/src/v0_9/processing/message-processor.js`, `state/data-model.js`, `state/surface-model.js`, `state/*.d.ts` — message application and per-surface data APIs.
- `node_modules/@a2ui/angular/` types and `fesm2022/a2ui-angular-v0_9.mjs` — catalog access, renderer service, Angular signal adapter and asynchronous MarkdownRenderer behavior.

### Key Decisions

— session 2026-09-10

- **The tool boundary validates because CopilotKit does not.** Verified in
  `@copilotkit/core`: `executeToolHandler` calls `parseToolArguments` (JSON.parse + object
  coercion) and passes the result straight to the handler — `parameters` is only serialized for
  the model. `bindFrontendTool` therefore runs `parameters.safeParse` and returns
  `{ ok: false, code: 'invalid_args', result: issues }` before any handler sees the args. This
  closes Task 3's open issue; the probe there (`{ withinDays: "90" }` silently yielding a wrong
  date) is now a red test without the guard.
- **`bindFrontendTool` exported separately from `createFrontendTool`.** Registration needs the
  CopilotKit provider (`inject(CopilotKit)`), which Task 6 specs don't have; the bound config is
  the artifact worth testing (description suffix + validation + handler pass-through). Specs
  exercise exactly what production registers; `createFrontendTool` itself is one line and gets its
  first real caller in Task 7.
- **Own narrow `FrontendToolContext` (`{ toolCall: { id } }`) instead of importing
  `FrontendToolHandlerContext`.** The real type lives in `@copilotkit/core` — a transitive
  dependency (the Task-1 `supports-color` lesson applies to imports). Contravariance makes the
  narrow-context handler assignable to CopilotKit's config without casts, and tests can build the
  context without any foreign import.
- **surfaceId consistency is our check, not the library's.** `A2uiMessageListWrapperSchema` is a
  plain strict object over a message union — no cross-message refine (verified in
  `server-to-client.js`). The handler requires exactly one `createSurface` and rejects messages
  targeting another surfaceId, with issues shaped like the zod issues they sit next to
  (`{ path, message }`), so T6-AC-04's "zod issues in result" holds for both failure kinds.
- **Unknown component names are pre-checked against the catalog.** The processor validates props
  only for names the catalog knows and silently skips the rest (`if (componentApi)` with no else,
  verified in `message-processor.js`) — an unknown name would reach the screen as a blank spot and
  the model would never learn. The handler resolves the surface's catalog via
  `A2UI_RENDERER_CONFIG` (public token) and fails with `code: 'catalog'` listing the unknown
  names. An unknown *catalog id* stays with the processor, which throws for it.
- **Catalog errors roll the surface back.** `processMessages` applies messages one by one, so a
  failing `updateComponents` leaves the surface of an already-applied `createSurface` behind —
  the catch deletes it (`deleteSurface`), but only when it did not exist before the call, so a
  pre-existing surface with a colliding id is never destroyed. This is what makes T6-AC-03's
  "no new surface" observable.
- **Mount rules kept literal to the plan.** Reserved = the four paths or below; `/conf` is not
  reserved (the model may pre-select); a root write (`path` absent) is not reserved — the mount
  runs after the model's messages and re-establishes `/confs`, `/me` & co. anyway. `/me` is
  mounted only when the location is known; `/conf = confs[0]` is skipped when the model wrote
  `/conf` or below, or when the result is empty.
- **`messageWidget` renders markdown through the a2ui `MarkdownRenderer`.** Already provided by
  `provideA2uiCatalog` (Task 5), and `@a2ui/markdown-it` is installed, so real HTML comes out.
  The component mirrors the basic `Text`'s effect + requestId pattern — the canonical solution
  for out-of-order async renders while args stream. Angular's `[innerHTML]` sanitization stays on.
- **Definitions live on root zod (v4).** `schemaToJsonSchema` in `@copilotkit/shared` handles v4
  natively (Standard JSON Schema path) — verified before choosing. The web_core wrapper schema is
  used at runtime only (`safeParse`), its issues travel as `unknown`; no new universe crossing,
  and `tsc` stays at ~2 s (the Task-4 OOM canary is quiet).
- **Tools are exported const specs; registration is Task 7's move.** No app wiring in this task —
  the chat page calls `createFrontendTool(...)` in its injection context. Avoids a dead
  registration site now and keeps the specs the only consumers.

— session 2026-09-10

- **Names describe ownership.** `CLIENT_OWNED_PATHS` replaces `RESERVED_PATHS`: the model may bind these paths, while their values are supplied by the client. `PRIVATE_PATHS` was rejected because it would suggest the paths cannot be read.
- **Plural search returns every forbidden write.** `findForbiddenModelWrites(messages): string[]` replaces the first-match `findReservedWrite`. The result uses `code: 'forbidden_model_writes'` and lists every detected path, so one response identifies all detected writes. Tests assert the same details in the returned result and the failure callback.
- **Message creation is separate from application.** `createClientDataMessages` replaces `mountMessages`. It returns A2UI updates; `renderer.processMessages` applies them. Names beginning with `mount` were rejected because the helper itself does not mutate renderer state.
- **Paths make the data’s meaning explicit.** `/filteredConfs` replaces `/confs` for the last search result, and `/selectedConf` replaces `/conf` for the selection within one surface. Tool results, guards, catalog descriptions, examples, playground, tests, spec and active plan use the same names. Existing domain-result fields and the store signal remain named `confs`.
- **Search precedes mounting.** `findConferences` replaces the stored result and returns a summary; it does not allocate a surface. `renderSurface` applies the model’s structure and then mounts client data for that surface. The find-tool description now states this timing explicitly. No `/allConfs` path was added: `findConferences({})` already performs a fresh search without filters.
- **Scope for this wrap-up.** The user requested that review findings be handled elsewhere. This contribution records the implemented changes and verification, without adding those findings to the log or improvements register.

— session 2026-09-10 (Codex review absorbed)

- **Guard decides on parsed segments.** Codex showed the string-prefix check was bypassable:
  `DataModel.parsePath` splits on `/` and drops empty segments, so `me`, `/me` and `/me/` address
  the same location, and `set('', …)`/`set('/', …)` replaces the whole model (verified in
  `data-model.js`). `findForbiddenModelWrites` and the `/selectedConf` detection now parse the
  same way; root writes are forbidden as a whole.
- **Protocol envelope in the tool schema.** Codex measured the official wrapper envelope at
  ~2.7 kB serialized — the "too large" rationale only holds for component-level schemas. Own
  zod-v4 envelope (never web_core's instance: the zod-universe rule), message forms with required
  fields, `deleteSurface` deliberately absent, `version` pinned to `'v0.9'`. Consequence: a
  message missing `version` now fails at the boundary as `invalid_args`; the cross-message checks
  stay handler-level `invalid_messages`. Plan amended, user-approved.
- **Boundary rejections reach the failure channel.** `followUp` is static, so an `invalid_args`
  return would otherwise end the turn with no correction signal. `bindFrontendTool` gained the
  optional `onValidationFailure(context, issues)` hook; `renderSurfaceTool` binds it to
  `RENDER_FAILURE_HANDLER`.
- **Mount inside the try, rollback unconditional, fresh-id precheck.** A schema-valid root write
  with `value: []` made the subsequent mount throw *outside* the old try (rejected promise, no
  failure signal, surface left behind). Mount now shares the try/catch; the fresh-id precheck
  (`invalid_messages`, speaking issue) makes any surface in the catch ours, so `existedBefore`
  disappeared and the rollback became unconditional. `deleteSurface` is rejected at the boundary
  (not in the envelope union) *and* in `resolveSurfaceId` (defense in depth for direct handler
  calls) — a new answer can no longer replace an earlier chat surface.
- **Serialization test sharpened to structure.** The first envelope-serialization test was
  satisfiable by the `describe()` texts alone (revert probe stayed green — the same weakness
  class as Task 5's AC-05 finding). It now asserts the `anyOf` forms and their property keys;
  the repeated probe fails it.
- **UI strings switched to English** (user decision; the plan's German placeholder text was
  updated). The tool playground stays German — a dev page for the user.
- **`FrontendToolSpec` documents its pass-through, and stays a mirror.** A user question showed
  the type didn't communicate that the shared fields carry CopilotKit semantics (`followUp` is
  evaluated by CopilotKit's run loop, verified in core). Doc comment added. Extending
  `FrontendToolConfig` was considered and rejected: the type would then admit future upstream
  fields that `bindFrontendTool`'s explicit field copy silently drops, and the repo guideline
  prefers locally readable types; drift is already caught at the `registerFrontendTool` call.
- **Tool playground added as a user-approved amendment.** `/playground/tools` drives the real
  bound pipeline (boundary validation included) with `RENDER_FAILURE_HANDLER` bound to a visible
  log via a child injector — the exact binding pattern Task 7 needs. Rationale mirrors Task 5's
  playground: the tool layer was invisible until Task 7.
- **Mermaid gotcha recorded:** a `;` inside sequence-diagram note text ends the statement and
  breaks parsing (hit in `architecture.md`, present since Task 4); replaced with a dash.

### Review Focus

- **Behavior claims:**
  1. `renderSurface` accepts only a boundary-valid (protocol envelope), single-fresh-surface,
     known-component message list without client-owned writes — where `me`, `/me/`, `''` and `'/'`
     count as client-owned writes; on any failure, boundary rejections included,
     `RENDER_FAILURE_HANDLER` fires exactly once and no surface remains, even when the client
     mount itself throws.
  2. A batch writing `/filteredConfs` and `/me` returns `forbidden_model_writes` listing both
     paths; an allowed `/title` write is not reported; the model's `/selectedConf` preselection
     survives the mount; a reused surfaceId is refused with a speaking issue and the first
     surface stays intact.
  3. `findConferences` returns a compact summary with `mountedAt: '/filteredConfs'`; its tested
     results omit `lat`, `lon` and `capacity`. Catalog examples and both playgrounds bind the
     same list and selection paths.
- **Plan deviations:**
  - Processor-based unknown-component validation was supplemented with a catalog pre-check because the installed processor skips unknown names.
  - Rollback was added after processor errors because the message batch is applied incrementally.
  - The wrapper was split into `createFrontendTool` and testable `bindFrontendTool`; handler context uses a narrow local type rather than a transitive CopilotKit import.
  - User-approved naming and path amendments required touching catalog metadata, existing integration tests, playground and current documentation outside the original Task-6 file list. The active plan now reflects the path and error-result changes.
  - The review amendments are recorded in the plan itself (user-approved 2026-09-10): protocol-envelope tool schema replacing the planned loose `unknown[]`, segment-based guard semantics, fresh-surface contract, `onValidationFailure`, tool playground. Consequence: a missing `version` fails as boundary `invalid_args` instead of the plan's original handler-level `invalid_messages`.
- **Assumptions / choices:** `/selectedConf` is initially the first result when available and may be preselected by an explicit model write. `/me` and grouped rows are mounted when present. Internal search-result fields retain `confs`; the external A2UI path is `/filteredConfs`. The envelope pins `version: 'v0.9'` and requires `path` on `updateDataModel` — deliberately stricter than the runtime schema, as model guidance. UI strings are English; the tool playground stays German (dev page).
- **Scope notes:** frontend-tool registration and chat integration belong to Task 7. The user-local `package.json` port adjustment stays outside the task commit. The `architecture.md` expansion (plain-words walkthrough, round-trip diagram, seam-code column) is deliberate in-commit doc scope. Two throwaway screenshots sit untracked at the repo root.
- **Read next:**
  1. `src/app/agent/tools/render-surface.tool.ts` — the guard chain order and the unconditional rollback; every AC and review fix hangs on this file.
  2. `src/app/agent/tools/render-surface.definition.ts` — the envelope schema is the new model-facing contract (and what Task 9's prompt no longer has to teach).
  3. `src/app/playground/tool-playground.ts` — the working reference for Task 7's `RENDER_FAILURE_HANDLER` binding and bound-handler invocation.

### Test Evidence

— session 2026-09-10

```
$ npm run lint  → exit 0   ("All files pass linting")
$ npm test      # shell 82 passed (18 files), agent 14 passed (2 files)   → exit 0
$ npm run build → exit 0
```

Shell suite grew 59 → 82 (+23): 4 wrapper tests, 4 findConferences tests, 9 renderSurface tests,
3 renderer-component tests, 2 messageWidget tests, plus one placeholder test. Playwright's
Chromium headless shell had to be re-downloaded (revision 1234, Chrome 151) before the first run.

Two intermediate failures drove design decisions (recorded above): the unknown-component case
returned `ok: true` because the processor skips unknown names (→ catalog pre-check via
`A2UI_RENDERER_CONFIG`), and the surface-renderer spec asserted markdown text synchronously
(→ `vi.waitFor`; the basic `Text` renders markdown async).

**Mutation probes — five defects introduced, each reverted, final suite green:**

| Mutation | Caught by |
|---|---|
| client mount removed from the handler | T6-AC-01 + T6-AC-05 mounts-/me (2/82) |
| reserved-path guard disabled | T6-AC-02 + T6-AC-06 exactly-once (2/82) |
| surface rollback removed from the catch | T6-AC-03 Card test (exactly this, 1/82) |
| wrapper validation skipped (`args as Args`) | wrapper invalid-args + findConferences boundary (2/82) |
| `/conf` preset no longer honors the model's write | T6-AC-05 keeps-model-/conf (exactly this, 1/82) |

No temporary probes were created this session. The failure screenshots written by the red runs
(`src/app/agent/tools/__screenshots__/`, `.vitest-attachments/`) are gitignored; deleting them
in-session was denied — they stay for manual cleanup and cannot enter the commit.

— session 2026-09-10

Verification during the naming/path changes:

```text
npm run test:shell -- --watch=false --include='src/app/agent/tools/*.spec.ts'
  → exit 0; 19 tests passed in 4 files after the helper/error-result renames.
./node_modules/.bin/tsc --noEmit -p tsconfig.app.json
  → exit 0 after the createClientDataMessages rename.
./node_modules/.bin/eslint src/app/agent/tools/render-surface.tool.ts
  → exit 0 after the createClientDataMessages rename.
npm run lint
  → exit 0; all files pass linting after the path migration.
npm run build
  → exit 0 after the path migration.
npm run test:shell -- --watch=false
  → 81 passed, 1 failed: a whole-data-model assertion still expected the old confs key.
```

That assertion was updated to `filteredConfs`. The affected suite was then rerun:

```text
npm run test:shell -- --watch=false --include=src/app/capabilities/charts/timeline.component.spec.ts
  → exit 0; all 8 Timeline tests passed.
git diff --check
  → exit 0.
```

The last full shell run plus the successful affected-suite rerun cover all 82 existing shell tests; a second full-suite run was not performed. The agent’s 14-test evidence above belongs to the first implementation session; agent code was not changed or retested in this contribution. A path search found no old `/confs` or `/conf` bindings in source or current documentation outside historical task logs; `/conf-sites/...` URLs retain their original names.

Browser tests required execution outside the filesystem/network sandbox so Vitest could bind its local server. One automatic approval review timed out; the permitted retry succeeded. The temporary review-probe spec and its screenshots were removed. Its findings are omitted as requested. No temporary probe remains in the source tree. This wrap-up adds documentation only and reuses the recorded checks.

— session 2026-09-10 (Codex review absorbed)

```
$ npm run lint  → exit 0   ("All files pass linting")
$ npm test      # shell 90 passed (19 files), agent 14 passed (2 files)   → exit 0
$ npm run build → exit 0
```

Shell suite 82 → 90 (+8): boundary no-path rejection, structural envelope-serialization check,
boundary-rejection-fires-handler, fresh-id reuse, deleteSurface at the boundary and past it
(direct handler call), mount-throw rollback (renderer spy), markdown out-of-order. The full suite
ran green repeatedly this session, superseding the earlier partial-rerun caveat.

**Revert probes — six fixes reverted one at a time, each caught by exactly the predicted tests,
all restored, final suite green:**

| Reverted fix | Caught by |
|---|---|
| segment guard back to string prefix | T6-AC-02 (exactly this, 1/90) |
| `onValidationFailure` call removed from the wrapper | boundary-rejection + AC-02 no-path + AC-04 (3/90) |
| mount moved back out of the try | mount-rollback test (exactly this, 1/90) |
| fresh-id precheck removed | reused-surfaceId test (exactly this, 1/90) |
| `deleteSurface` branch removed from `resolveSurfaceId` | direct-handler test (exactly this, 1/90) |
| envelope back to `unknown[]` | 4 tests — but only after sharpening the serialization test to structural assertions; its first version stayed green under this probe (satisfiable via `describe()` texts) |

**Visual probe (temporary, removed):** `tool-playground.probe.spec.ts` drove the sandbox in
headless Chromium — city pick, `findConferences`, valid scenario, `messageWidget`, then the
forbidden-write scenario — and captured `tool-playground-preview.png` +
`tool-playground-error-preview.png` (repo root, kept for the user, untracked). The happy path
shows the real Timeline with mounted selection and the markdown widget; the error shot shows the
English error text and the `RENDER_FAILURE_HANDLER` entry in the visible log. Probe spec deleted;
no probes remain in the tree.

Post-merge addendum (user request): `followUp` is now a **required** field on `FrontendToolSpec`
(and always present on the bound tool) — relying on CopilotKit's implicit default required
insider knowledge, so the compiler now forces every tool to decide. `findConferencesTool`
declares `followUp: true` with a does-not-end-the-turn assertion (shell suite 90 → 91; lint
green after both changes).

### Acceptance Coverage

The review assessment excluded from the earlier contribution has since been absorbed in-session (see the Codex-review Key Decisions and Test Evidence blocks).

- **T6-AC-01** — passed. `src/app/agent/tools/render-surface.tool.spec.ts::T6-AC-01`: three Timeline markers render from `/filteredConfs` with no model-authored data messages.
- **T6-AC-02** — passed. `render-surface.tool.spec.ts::T6-AC-02`: explicit writes to `/filteredConfs`, `/me` and `/filteredConfs/0` — plus the bypass variants `me`, `/me/`, `''` and `'/'` — return `forbidden_model_writes` and leave no new surface; an `updateDataModel` without a `path` is rejected at the boundary (`invalid_args`) and still fires the failure handler.
- **T6-AC-03** — passed. The two `render-surface.tool.spec.ts::T6-AC-03` tests reject an unknown component and a Card with `children`, returning details and leaving no new surface.
- **T6-AC-04** — passed. The two `render-surface.tool.spec.ts::T6-AC-04` tests reject a missing version — since the envelope amendment at the tool boundary (`invalid_args`, zod issues, one failure-handler call) — and a mismatched surface ID (handler-level `invalid_messages` with issue details).
- **T6-AC-05** — passed. The two `render-surface.tool.spec.ts::T6-AC-05` tests cover `/me`, initial `/selectedConf`, grouped rows, an allowed `/title` update and preservation of model preselection.
- **T6-AC-06** — passed. `render-surface.tool.spec.ts` checks one callback with both forbidden paths, one callback on catalog failure and no callback on success.
- **T6-AC-07** — passed. `src/app/agent/tools/surface-tool-renderer.component.spec.ts` checks the pending display ("Building surface …"), the completed surface and the English error text including the failure code.
- **T6-AC-08** — passed. `src/app/agent/tools/find-conferences.tool.spec.ts::T6-AC-08` checks stored distanceKm and the compact summary without lat/lon/capacity; supporting tests cover invalid arguments, grouped counts and absent location.

### Open Issues

- Promoted: Wire RENDER_FAILURE_HANDLER to the Task-7 chat correction run (→ improvements register).
- Promoted: Verify frontend-tool registration with the real CopilotKit provider in Task 7 (→ improvements register).
- Promoted: Implement meToContextEntry when assembling the Task-7 agent context (→ improvements register).
- Promoted: Align the shell development port and agent CORS origin for Task 7 (→ improvements register).

### Context for Next Task

- **Registration:** call `createFrontendTool(spec)` in an injection context. Ready-made specs are `findConferencesTool`, `renderSurfaceTool` and `messageWidgetTool`; framework-free `*.definition.ts` files remain reusable by the Task-9 eval harness. `/playground/tools` is the working reference for binding `RENDER_FAILURE_HANDLER` (child injector) and invoking bound handlers.
- **Wrapper:** `bindFrontendTool(spec): BoundFrontendTool` supplies argument validation, the turn-end suffix and the optional `onValidationFailure(context, issues)` hook (renderSurface binds it to the failure handler). `FrontendToolContext` exposes `toolCall.id`; results use `{ ok, code?, result? }` with tool-specific success fields.
- **renderSurface contract:** the tool schema itself carries the protocol envelope — exactly one `createSurface` with a fresh id (reuse refused), `updateComponents`, `updateDataModel` with a required `path`; no `deleteSurface`. The Task-9 prompt therefore only needs component-level format rules and examples, not the message forms.
- **Store:** `SurfaceDataStore { confs, byMonth, byTopic, me, setResult(result) }` keeps the last search result. Each `findConferences` call starts from `loadConferences(today)` and its own arguments; `{}` removes the previous search restrictions by replacing the result.
- **Surface paths:** bind list views to `/filteredConfs` and selection/detail views to `/selectedConf` and its subpaths. `/me`, `/byMonth` and `/byTopic` keep their names. Mounting happens during `renderSurface`, after the model’s messages. The default selection is the first result unless the model wrote `/selectedConf` or below.
- **Search summary:** `{ ok: true, count, mountedAt: '/filteredConfs', next? }`. `mountedAt` names the subsequent mount location; the search itself does not call the renderer or create a surface.
- **Current symbols:** `CLIENT_OWNED_PATHS`, `findForbiddenModelWrites(messages): string[]`, `createClientDataMessages(surfaceId, store, modelWroteSelectedConf): A2uiMessage[]`.
- **Failure codes:** `invalid_args` (boundary — schema/envelope violations; also fires the failure handler via the hook); `invalid_messages` (cross-message: consistency, `deleteSurface`, taken surfaceId); `forbidden_model_writes` (lists every detected path, decided on parsed segments); `catalog` (unknown components, processor throws, mount failures — the surface is rolled back). Exactly one `RENDER_FAILURE_HANDLER` call (`{ toolCallId, code, issues }`) per failed call; Task 7 supplies the chat integration.
- **Dependencies and gotchas:** use `provideA2uiCatalog` for renderer/catalog/markdown providers; keep `inject()` before the first `await`; avoid CopilotKit’s built-in names `render_a2ui` and `AGUISendStateSnapshot`. Basic Text markdown rendering is asynchronous, so assertions may need `vi.waitFor`.
- **Test seam:** call `bindFrontendTool(tool).handler(rawArgs, { toolCall: { id } })` inside `TestBed.runInInjectionContext` with the real assistant catalog; see `render-surface.tool.spec.ts`. The playground and Map integration tests demonstrate the current paths.
- **Planned integration follow-ups:** the existing Task-7 handoff items were promoted to `docs/improvements.md` during this merge. The local package.json port change is still excluded from the task commit.

### Git State

Captured after the review absorption. `git diff --stat` excludes the untracked files; the file list above includes them.

```text
$ git diff --stat
 docs/architecture.md                               | 125 ++++++++++++++++-----
 docs/improvements.md                               |   4 +
 docs/spec.md                                       |  28 ++---
 docs/work/m1-spike/plan.md                         |  51 +++++----
 package.json                                       |   2 +-
 src/app/a2ui/binding.ts                            |   2 +-
 src/app/a2ui/renderer-integration.spec.ts          |  10 +-
 src/app/app.routes.ts                              |   4 +
 src/app/capabilities/charts/days-until.fn.ts       |   2 +-
 src/app/capabilities/charts/gauge.schema.ts        |   4 +-
 .../capabilities/charts/timeline.component.spec.ts |  10 +-
 src/app/capabilities/charts/timeline.component.ts  |   2 +-
 src/app/capabilities/charts/timeline.schema.ts     |   2 +-
 src/app/capabilities/maps/distance.fn.ts           |   4 +-
 src/app/capabilities/maps/map.component.spec.ts    |  16 +--
 src/app/capabilities/maps/map.component.ts         |   2 +-
 src/app/capabilities/maps/map.schema.ts            |   2 +-
 src/app/playground/playground.html                 |   2 +-
 src/app/playground/playground.ts                   |  24 ++--
 19 files changed, 191 insertions(+), 105 deletions(-)

$ git status --short        # repo files only; sandbox dotfiles omitted
 M docs/architecture.md
 M docs/improvements.md
 M docs/spec.md
 M docs/work/m1-spike/plan.md
 M package.json              ← user-local port change, exclude from commit
 M src/app/a2ui/binding.ts
 M src/app/a2ui/renderer-integration.spec.ts
 M src/app/app.routes.ts
 M src/app/capabilities/charts/days-until.fn.ts
 M src/app/capabilities/charts/gauge.schema.ts
 M src/app/capabilities/charts/timeline.component.spec.ts
 M src/app/capabilities/charts/timeline.component.ts
 M src/app/capabilities/charts/timeline.schema.ts
 M src/app/capabilities/maps/distance.fn.ts
 M src/app/capabilities/maps/map.component.spec.ts
 M src/app/capabilities/maps/map.component.ts
 M src/app/capabilities/maps/map.schema.ts
 M src/app/playground/playground.html
 M src/app/playground/playground.ts
?? docs/work/m1-spike/task-log/task-6-client-tools.md
?? src/app/agent/
?? src/app/playground/tool-playground.html
?? src/app/playground/tool-playground.ts
?? tool-playground-error-preview.png    ← throwaway, do not commit
?? tool-playground-preview.png          ← throwaway, do not commit
```

The `package.json` diff is user-local and must not be staged for Task 6.

### Sessions

- claude-code 97de337b-ef50-4828-ac27-1d7256358550 (2026-09-10) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/97de337b-ef50-4828-ac27-1d7256358550.jsonl
- codex 01a0872f-ee0b-7371-992f-09480faa3d8d (2026-09-10) — transcript: ~/.codex/sessions/2026/09/09/rollout-2026-09-09T19-21-00-01a0872f-ee0b-7371-992f-09480faa3d8d.jsonl
