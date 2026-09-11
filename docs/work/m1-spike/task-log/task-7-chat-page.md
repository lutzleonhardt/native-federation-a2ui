# Task 7: Chat page with agent store, location picker, example prompts, and a mock-agent loop test

### Task

Wired the assistant agent into CopilotKit's prebuilt chat: an `ASSISTANT_AGENT` token behind the
`HttpAgent`, an own `initAgentStore` (tool registration, reactive context entries, render-failure
correction channel), an `AgentStoreHelper` that sends like CopilotKit's own input, the chat page
with location picker and the four example prompts, and a scripted `MockAgent` as the test seam
that drives the full request-3 loop in headless Chromium.

### Status

DONE — six ACs green after the Codex review was absorbed (buttons locked during a run, correction
budget, coalesced corrections, developer message removed): full shell suite 102/102 (19 files),
agent suite 17/17, `npm run lint`, both `tsc` projects and `npm run build` exit 0. The live check against the
real agent (Anthropic, shell on 4300) proved the whole chain — CORS, `findConferences`, the
correction loop — and showed that the model does not yet
know the component vocabulary; that is Task 9's prompt work, recorded below as handoff.

### Files Modified

- `src/app/agent/assistant-agent.token.ts` (new) — `ASSISTANT_AGENT` token (factory: `HttpAgent` against `http://localhost:3001/ag-ui/assistant`, `agentId: 'assistant'`) and `provideAssistantAgent()`: a `COPILOT_KIT_CONFIG` factory registering the token's agent as self-managed; `headers: {}` is mandatory because the core normalizes headers without a null check.
- `src/app/agent/agent-store-helper.ts` (new) — `AgentStoreHelper { sendMessage, continueTurn, reset }` over `Signal<AgentStore>` + `CopilotKit`; `sendMessage` mirrors CopilotKit's `submitInput` (append, then `core.runAgent`) so tools and context ride along; `continueTurn` runs the agent on the transcript as it stands; `createAgentStoreHelper(store)` for injection contexts.
- `src/app/agent/init-agent-store.ts` (new) — `initAgentStore({ agentId, frontendTools, context })`: registers the tools inside a child `EnvironmentInjector` that binds `RENDER_FAILURE_HANDLER` to the correction policy, connects each context entry (`connectAgentContext` accepts accessors), and re-publishes turn-ending tool results to the store (`publishToolResults`, a CopilotKit 0.3.1 bug); timers and subscriptions are cleared on destroy.
- `src/app/agent/render-failure-correction.ts` (new) — `correctRenderFailures(chat, agent, destroyRef)` and `MAX_CORRECTIONS_PER_TURN = 3`: logs each failure, batches the failures of one run into one deferred `continueTurn()`, counts corrections per user turn (reset when a run opens with a user message), gives up with `console.error` once the budget is spent, clears its timer on destroy.
- `src/app/agent/render-failure-handler.token.ts` (modified) — doc comment names the correction run instead of a developer message.
- `src/app/agent/me-context-entry.ts` (new) — `meToContextEntry(me)` (Task 3 handoff): description `User location (me)`, value JSON or an explicit "unknown" text.
- `src/app/a2ui/assistant-fragments.ts` (new) — `ASSISTANT_FRAGMENTS`, the one list behind catalog and context entry (Task 4's advice; own file to avoid a circular import through `assistant-catalog.ts`).
- `src/app/a2ui/assistant-catalog-id.ts` (new) — `ASSISTANT_CATALOG_ID` in a framework-free file so the tool definition (and the Node eval harness) can pin it without pulling in `@a2ui/angular`.
- `src/app/a2ui/assistant-catalog.ts` (modified) — re-exports the constant from its new file; behavior unchanged.
- `src/app/agent/create-frontend-tool.ts` (modified) — `FrontendToolSpec.handler` is a method signature (bivariant parameters) so `initAgentStore` can take a list of differently typed specs without `any`; new `AnyFrontendToolSpec` alias.
- `src/app/agent/tools/render-surface.definition.ts` (modified) — `catalogId` is `z.literal(ASSISTANT_CATALOG_ID)`: an invented id fails at the boundary with the expected value in the issue (live finding, see Test Evidence).
- `src/app/agent/tools/render-surface.tool.spec.ts` (modified) — new test: an invented `catalogId` is rejected as `invalid_args`, the issue names the expected id, the failure handler fires once.
- `src/app/chat/chat.page.ts` + `chat.page.html` (new) — `<copilot-chat [agentId]>` with header (location picker, four prompt buttons, disabled while `store().isRunning()`); calls `initAgentStore`, `createAgentStoreHelper`, `LocationStore.init()`; flex layout in component styles.
- `src/app/chat/location-picker.component.ts` + `.html` (new) — shows the current city; `<select>` over `CITIES` while `me` is undefined or after "Change".
- `src/app/domain/cities.ts` (modified) — adds Dresden for manual selection and nearest-city geolocation matching.
- `src/app/domain/location.store.ts` (modified) — refreshes geolocation on each page load, keeps the saved city as fallback and respects a manual choice during the request; diagnostics thinned to one `console.warn` on a failed request or a missing Geolocation API (user confirmed the behavior live).
- `src/app/domain/location.store.spec.ts` (modified) — covers saved Berlin being replaced by detected Dresden, another request after reload, denied-permission fallback and manual selection winning over a late result.
- `src/app/chat/example-prompts.ts` (new) — `EXAMPLE_PROMPTS`, the four German demo requests verbatim.
- `src/app/chat/chat.page.spec.ts` (new) — T7-AC-01/02 through a real `HttpAgent` with a recording `fetch`; T7-AC-03..06 through the `MockAgent` (request-3 surface, marker click, correction run answering the failed call, coalesced corrections, the per-turn budget and its reset, buttons locked during a run, prompt texts, markdown widget).
- `src/app/testing/mock-agent.ts` (new) — `MockAgent extends AbstractAgent` with a per-run script (array or Observable, so a test can hold a run open) and recorded `inputs`; builders `emptyRun`, `toolCallRun`, `toolCallsRun` (one assistant message with several calls; RUN_STARTED, TOOL_CALL_START/ARGS/END with `parentMessageId`, RUN_FINISHED).
- `src/app/app.config.ts` (modified) — `provideAssistantAgent()`, catalog from `ASSISTANT_FRAGMENTS`.
- `src/app/app.routes.ts` (modified) — default route `''` lazy-loads the chat page; playground routes stay.
- `src/styles.css` (modified) — viewport-filling flex layout under the app title.
- `angular.json` (modified) — CopilotKit stylesheet under `styles` (not in the package's `exports` map, so `@import` fails); initial-bundle budget 5 MB warning / 6 MB error (see Key Decisions).
- `package.json` + `package-lock.json` (modified) — `@ag-ui/client` and `@ag-ui/core` pinned to `0.0.57`, CopilotKit's exact pin; the user-local `start:shell` port line (4300) is still in the diff and is not task scope.
- `agent/src/config.ts` (modified) — `DEFAULT_SHELL_ORIGIN`, `resolveShellOrigin(env)` reading `SHELL_ORIGIN` (user-approved option b).
- `agent/src/server.ts` (modified) — `createApp(agents, shellOrigin = DEFAULT_SHELL_ORIGIN)`; `main` passes the resolved origin and logs it.
- `agent/src/config.spec.ts`, `agent/src/server.spec.ts` (modified) — three new tests: default/blank fallback, trimmed override, and a configured origin that replaces (not extends) the default on the preflight.
- `.env.example`, `README.md` (modified) — `SHELL_ORIGIN` documented.
- `docs/architecture.md` (modified) — Task-7 status: chat page solid in the big picture (edge label names the developer-message return path), `initAgentStore` in the layers table, three new invariants (correction run answers the failed call first; turn-ending tool results reach the store by hand; one `@ag-ui` version), roadmap 1–7 done; the renderSurface round trip now has `initAgentStore` as a participant, a valid/failure `alt` branch, and the two deferred steps (re-publish, correction run) after the handler.
- `docs/improvements.md` (modified) — the four Task-7 items marked done; two promotions from this log.
- `docs/work/m1-spike/plan.md` (modified) — user-approved amendment 2026-09-11: T7-AC-04 reworded to the correction run without a developer message (plus budget and coalescing); the `initAgentStore`/helper instructions and the Task-6 handoff sentence follow.
- `docs/tech-debt-backlog.md` (new) — created by the `/cs` gate in the Codex session: one pre-existing finding (`parseProvider` in `agent/src/config.ts`), grazed by Task 7, not fixed here.
- `docs/work/m1-spike/task-log/task-7-chat-page.md` (new) — this log.

**Outside Task 7:** `chat-page-preview.png` (repo root, untracked) is the visual-probe output kept for the user — do not commit. The user-local `.env` gained `SHELL_ORIGIN=http://localhost:4300` (gitignored). `src/app/chat/__screenshots__/` (gitignored) may still hold a failure screenshot from the red run; deleting it in-session was denied.

### Files Read (Context Only)

- `docs/work/m1-spike/task-log/task-6-client-tools.md` (predecessor), `task-4-assistant-catalog.md` (transport facts, `HttpAgent` probe, "share the fragments" advice), `task-3-conference-domain.md` (`meToContextEntry` deferral, `LocationStore` contract), `task-5-selection-primitives.md` (port/CORS note, via search).
- `src/app/agent/create-frontend-tool.ts`, `render-failure-handler.token.ts`, `surface-data.store.ts`, `tools/*.tool.ts`, `tools/*.definition.ts`, `tools/surface-tool-renderer.component.*` — the Task-6 seam.
- `src/app/a2ui/assistant-catalog.ts`, `catalog-context.ts`, `provide-a2ui-catalog.ts`, `renderer-integration.spec.ts` — catalog, context entry, TestBed pattern.
- `src/app/domain/find-conferences.schema.ts`, `conferences.json`, `conference.spec.ts` — search args, data set and nearby-conference coverage for offered cities.
- `src/app/capabilities/maps/map.component.spec.ts`, `map.component.html`, `distance.fn.ts`, `charts/days-until.fn.ts`, `src/app/playground/playground.ts`, `tool-playground.ts` — marker selectors, function bindings, the Task-6 binding pattern.
- `src/app/app.config.ts`, `app.routes.ts`, `app.html`, `app.spec.ts`, `angular.json`, `tsconfig.json`, `eslint.config.js`, `vitest-base.config.ts`, `package.json`.
- `agent/src/server.ts`, `config.ts`, `server.spec.ts`, `config.spec.ts`, `.env.example`, `README.md`, `docs/architecture.md`.
- `node_modules/@copilotkit/angular/dist/index.d.ts` + `fesm2022/copilotkit-angular.mjs` (config token, `CopilotKit` service, `AgentStore`, `connectAgentContext`, `registerFrontendTool`/`#bindClientTool`, `CopilotChat`, `RenderToolCalls`/`pickToolCallHandler`, `ChatState.submitInput`, `provideCopilotKit`), `node_modules/@copilotkit/core/dist/index.mjs` + `index.d.mts` (`runAgent`, `processAgentResult`, `executeSpecificTool`, `executeToolHandler`, `buildFrontendTools`, `getContextForAgent`, `setRuntimeUrl`, `subscribeToAgentWithOptions`, `waitForPendingFrameworkUpdates`, `normalizeHeaders`).
- `node_modules/@ag-ui/client/dist/index.d.ts` + `index.mjs` (`HttpAgent`, `AbstractAgent`, `requestInit`), `node_modules/@ag-ui/core/dist/index.d.ts` (event and message types), `node_modules/@a2ui/web_core/src/v0_9/schema/common-types.d.ts` and `basic_catalog/components/basic_components.js.map` (function-call binding form, `Button` schema), `node_modules/zod/v4/classic/schemas.d.ts` (variance annotations).

### Key Decisions

— session 2026-09-11

- **`@ag-ui/*` pinned to CopilotKit's exact `0.0.57`.** The plan preamble recorded `0.0.59` as verified, but `@copilotkit/angular@0.3.1` pins `@ag-ui/client` and `@ag-ui/core` to `0.0.57` exactly, so npm kept two copies. Consequences: two `AbstractAgent` classes (tsc rejected the token's agent in the config factory), and the core checks `agent instanceof HttpAgent` (header application, three sites) — a foreign copy would silently miss those paths. After the pin `npm ls` shows one deduped copy. The agent package keeps its own `@ag-ui/*` versions (server side, wire-compatible).
- **Agent behind a token, registered through a `COPILOT_KIT_CONFIG` factory.** `provideCopilotKit` takes a static value, so `provideAssistantAgent()` provides the token with `useFactory` reading `ASSISTANT_AGENT`. Tests override only `ASSISTANT_AGENT`. The core needs no `runtimeUrl`: `setRuntimeUrl(undefined)` returns before any `/info` fetch. `AgentRegistry` assigns `agentId` from the registration key when unset; the token sets it explicitly anyway.
- **Tools registered inside a child `EnvironmentInjector` that binds `RENDER_FAILURE_HANDLER`.** `registerFrontendTool` captures `inject(Injector)` and CopilotKit runs the handler in that injector (`#bindClientTool` → `runInInjectionContext`), so the tool's `inject(RENDER_FAILURE_HANDLER)` resolves the binding. The env injector's `DestroyRef` is itself (`__NG_ENV_ID__`), and the page's `DestroyRef` destroys it, so tools are removed with the page. Component-level providers were rejected: a provider factory cannot reach the page's helper without creating a second `AgentStore`.
- **The correction run is deferred by one macrotask.** `RENDER_FAILURE_HANDLER` fires inside the failing tool call; CopilotKit splices the tool result only after the handler resolves (`executeSpecificTool`). A run started synchronously carries an unanswered tool call — the revert probe made T7-AC-04 fail with the tool message absent from the correction run's input. `setTimeout(0)` runs after the microtask chain that does the splice; `waitForPendingFrameworkUpdates` is a no-op in 0.3.1, so nothing else delays it.
- **Turn-ending tool results are re-published by hand.** The core notifies `onToolExecutionEnd` on *core* subscribers and splices `agent.messages` in place; the Angular `AgentStore` listens to *agent* events only, and nothing in the Angular layer consumes `onToolExecutionEnd` (grep: no consumer). After a `followUp: false` tool the renderer stayed at "Building surface …" until the next run — the first T7-AC-03 run failed exactly so (0 markers, screenshot showed the placeholder). `publishToolResults` subscribes to the core and, one macrotask later, calls `agent.setMessages(agent.messages)` unless a follow-up run is already running (that run publishes on its own).
- **`FrontendToolSpec.handler` became a method signature.** A list of differently typed specs needs `FrontendToolSpec<X>` assignable to `FrontendToolSpec<Record<string, unknown>>`; a function-typed property is contravariant in `Args` and blocks that. Method parameters are bivariant; `z.ZodType` declares `out` variance in zod v4 and `ToolRenderer` is covariant, so the rest assigns. `FrontendToolSpec<any>` behind an eslint-disable was the alternative; rejected in favor of no `any`. Nothing is lost: the boundary validates the arguments at runtime.
- **`copilot-chat` used directly; the headless variant was not built.** Verified in source: `CopilotChatAssistantMessage` renders `copilot-chat-tool-calls-view` with the `agentId`, which resolves `clientToolCallRenderConfigs` by name and agent (fallback to unscoped). The probe screenshot shows the surface inline in the transcript.
- **Stylesheet through `angular.json`.** `@copilotkit/angular/dist/styles.css` (Tailwind v4, `--cpk-*` variables) is not in the package's `exports` map, so `@import` cannot resolve it; the build's `styles` array takes the path directly.
- **Initial-bundle budget raised to 5 MB / 6 MB.** `@copilotkit/core` lacks `sideEffects: false`, so importing the config token from `app.config.ts` drags the whole CopilotKit graph (3.65 MB raw / 1.28 MB transfer chunk) into the initial bundle: 4.39 MB raw, 1.46 MB transfer. Route-level CopilotKit providers were rejected: seven root-provided services inject `CopilotKit`, a second instance would fail on the config token. Promoted as an improvement item.
- **`SHELL_ORIGIN` env in the agent (user-approved option b).** `createApp(agents, shellOrigin)` with `resolveShellOrigin(env)` in `config.ts`; default stays 4200 in the repo. The live check confirmed the mechanism end-to-end only after the agent process was restarted (`tsx watch` does not reload `.env`).
- **`catalogId` pinned as a literal after the live failure `Catalog not found: conference-list`.** The model invented an id although the context entry carried the right one. A literal keeps the standard field and makes the only valid value explicit: a wrong value fails at the boundary as `invalid_args` with the expected value in the zod issue, which the correction run carries back. The constant moved to `assistant-catalog-id.ts` because `assistant-catalog.ts` imports `@a2ui/angular` and the definition must stay framework-free.
- **The standard A2UI envelope stays in the tool arguments (user decision).** Removing `catalogId` — and the further step of letting the shell build the envelope so the model emits only components — was proposed and rejected: A2UI is a standard, models will learn it, M4 recordings and CopilotKit's own `render_a2ui` use the same form. Host rules constrain valid values (literals, no `deleteSurface`, required `path`) without renaming or dropping standard fields. This is the line not to cross.
- **`console.warn` restored in the failure binding.** The default token handler logged; the chat binding had replaced it silently. The live check needed the payload from DevTools before the warning existed.
- **Vocabulary is Task 9's, not schema work.** The live attempts showed the model finding `Text` and `List` on its own but guessing `ConferenceList`, wrapping props under `props`, and using wrong `List` keys. Everything that can be expressed as schema or context entry is self-correcting through zod issues; prompt prose is not. The knowledge-gap table in Context for Next Task records which piece lives where.
- **One spec file, two describes.** T7-AC-01/02 pin the request body through a real `HttpAgent` whose `fetch` option answers with an SSE `Response` of an empty run; T7-AC-03..06 use the `MockAgent`. Both share the page setup; splitting was judged premature.
- **Lazy route for the chat, `<h1>` stays in `app.html`.** Lazy for consistency with the playground routes (it moves only the page chunk; CopilotKit is initial regardless). `app.spec.ts` keeps passing.

— session 2026-09-11

- **Dresden is an offered user location.** A conference need not take place in the user's city; the same city list serves the picker and geolocation matching.
- **Refresh location on every page load (user correction).** The old persisted-city guard prevented any new browser request. The saved city now serves as fallback until geolocation succeeds; only a manual selection in the current page lifetime blocks a late callback.
- **Visible geolocation diagnostics.** `[LocationStore]` logs show fallback restoration, request/skip reason, secure context, browser permission state, coordinates/accuracy, chosen city and errors. An unavailable Permissions API does not prevent the position request.

— session 2026-09-11 (Codex review absorbed)

- **Example buttons are disabled while a run is in progress** (review hotspot 1, HIGH). A send during a run makes `core.runAgent` detach the active run mid-stream, leaving a half-streamed tool call in the transcript; the next request then carries incomplete JSON and an unanswered call. CopilotKit's own input blocks the same way. Small gaps remain (the macrotask between a run's end and a deferred correction), accepted for a demo.
- **The developer message is gone; the correction run is the whole signal** (hotspot 2, MEDIUM). Verified in `@ag-ui/mastra`'s conversion: only `assistant`, `user` and `tool` roles are forwarded, `developer` and `system` are dropped — the message never reached the model, and the live check had shown corrections happening on the tool result alone. Deprecating a function that provably does nothing was rejected; `sendDeveloperMessage` was removed and `continueTurn()` (run on the transcript as it stands) took its place. T7-AC-04 was amended accordingly (user-approved). Whether Task 9 wants an explicit instruction channel — and the server-side mapping that would need — is Task 9's call.
- **Three corrections per user turn, one per run, timers cleared on destroy** (hotspot 3 + blind spot 1). Every correction is a top-level run, so CopilotKit's follow-up depth limit never applied; the reviewer's probe produced twelve corrections in a row. `correctRenderFailures` batches the failures of one run into one deferred run (two failing calls in one assistant message would otherwise start two runs, the second detaching the first), counts corrections per turn, resets the count when a run opens with a `user` message (`onRunInitialized` on the agent — button and typed input alike), and gives up with `console.error`. Policy in its own file; `initAgentStore` stays the wiring.
- **Location diagnostics thinned** after the user confirmed the reload behavior live: one `console.warn` on a failed request or a missing API, the six `console.info` calls and the Permissions-API probe removed.
- **Review items not acted on:** hotspot 4 (port line in `package.json`) is the pre-commit decision already recorded; blind spot 2 (a picker spec driving the real `<select>`) skipped as optional for a demo.

### Review Focus

- **Behavior claims:**
  1. Every run request carries the three tools and the two context entries (`A2UI Custom Catalog`, `User location (me)`), and a city change reaches the next run without re-registration (T7-AC-01/02). Each page load refreshes the saved city through geolocation; manual choices made during the request win.
  2. A scripted request-3 answer renders inline in the chat; clicking the second Map marker switches the bound name; `findConferences` triggers exactly one follow-up run and `renderSurface` none; `fetch` is never called (T7-AC-03).
  3. A rejected `renderSurface` starts exactly one correction run whose request ends with the failed call's tool result (code and issues); several failures in one run share one correction; after three corrections in a user turn the shell stops, and the next user message resets the budget (T7-AC-04). The example buttons are disabled while a run is in progress.
- **Plan deviations:**
  - Task 3: persisted city wins over geolocation → refresh on every page load, persisted city as fallback → explicit user correction during Task 7; Dresden and diagnostics added on request.
  - Plan preamble: `@ag-ui/*@0.0.59` verified → pinned to `0.0.57` → CopilotKit's exact pin, one `AbstractAgent` class.
  - Plan: `initAgentStore` "binds `RENDER_FAILURE_HANDLER` to `sendDeveloperMessage`" and T7-AC-04 "exactly one developer message" → a deferred correction run without any message, budgeted and coalesced (plan amended 2026-09-11) → the Mastra adapter drops `developer` messages, and the review found the unbounded loop.
  - Plan: nothing about send locking → example buttons disabled while `isRunning` → review hotspot 1.
  - Plan: nothing about store refresh → `publishToolResults` added → CopilotKit 0.3.1 gap for `followUp: false` tools.
  - Plan (Task 6 type): `handler` as function property → method signature → heterogeneous tool list without `any`.
  - Plan: `catalogId: string` in the tool schema → literal → live failure; user confirmed keeping the standard field.
  - Plan Key Locations: no `agent/` changes → `SHELL_ORIGIN` env in `config.ts`/`server.ts` → user-approved option b for the live check.
  - Plan: budgets untouched → initial budget 5/6 MB → CopilotKit cannot leave the initial bundle.
  - Plan: registration "via `COPILOT_KIT_CONFIG` factory" under `init-agent-store.ts` → lives in `assistant-agent.token.ts` as `provideAssistantAgent()` → providers belong to app config, not to the injection-time helper.
  - Plan: `copilot-chat` or headless fallback → `copilot-chat` only → verified renderer resolution in source.
  - New files outside Key Locations: `assistant-fragments.ts`, `assistant-catalog-id.ts`, `me-context-entry.ts`; templates as `.html` per project rule. ~16 files, user-approved without split.
- **Assumptions / choices:** one agent id `assistant`; tools registered with that `agentId`; `me` context value is JSON or the text `unknown — the user has not chosen a city yet`; UI strings English, example prompts German verbatim; location picker uses `CITIES` from `domain/`; `MAX_CORRECTIONS_PER_TURN = 3`.
- **Scope notes:** the user-local `start:shell` port line in `package.json` is still in the diff and must be reverted or consciously accepted before `/commit 7` (the dependency pins in the same file must be committed, `package-lock.json` too). `chat-page-preview.png` at the repo root is a kept probe output, not source. `docs/architecture.md` status/invariants refresh is deliberate doc scope. The location-store diagnostics added by the parallel session were thinned again in the same task.
- **Read next:**
  1. `src/app/agent/init-agent-store.ts` — both CopilotKit workarounds and their invariants live here; every AC-03/04 claim hangs on this file.
  2. `src/app/agent/render-failure-correction.ts` — budget, coalescing and reset in ~50 lines; the three T7-AC-04 specs and the button-lock spec in `chat.page.spec.ts` are its guards.
  3. `src/app/domain/location.store.ts::init/snapTo/setCity` — distinguish a restored fallback from a manual choice made during the current page lifetime.

### Test Evidence

— session 2026-09-11

```
$ ./node_modules/.bin/tsc --noEmit -p tsconfig.app.json   → clean (after the @ag-ui pin)
$ ./node_modules/.bin/tsc --noEmit -p tsconfig.spec.json  → clean
$ npm run lint    → exit 0 ("All files pass linting")
$ npm run test:shell -- --watch=false --include='src/app/chat/chat.page.spec.ts'
    first run: 5 passed, 1 failed (T7-AC-03: 0 markers — surface stuck at "Building surface …")
    after publishToolResults: 6 passed
$ npm run test:shell -- --watch=false   → 97 passed (19 files); after the catalogId spec: 98 passed
$ npm run test:agent                    → 17 passed (2 files; 14 + 3 new)
$ npm run build   → first: ERROR "bundle initial exceeded maximum budget. Budget 1.00 MB was not met by 3.39 MB
                    with a total of 4.39 MB"; after the budget change: exit 0, initial 4.39 MB raw / 1.46 MB transfer
```

Browser-mode runs and `npm install` needed the sandbox bypass (Vitest binds a local server; npm's
cache under `~/.npm/_cacache` is read-only in the sandbox). `npm install` after the pin: "removed 15
packages, changed 5"; `npm ls @ag-ui/client @ag-ui/core` shows one deduped `0.0.57` tree.

**Revert probe (one fix reverted, restored, suite green):**

| Reverted fix | Caught by |
|---|---|
| correction run synchronous instead of `setTimeout(0)` | T7-AC-04 (exactly this, 1/6): `expected -1 to be greater than -1` — the failed call's tool message was absent from the correction run's input |

The `publishToolResults` fix is covered by history rather than a revert: T7-AC-03 was red before it
(0 markers, placeholder in the failure screenshot) and green after; nothing else changed in between.

**Visual probe (temporary, removed):** `src/app/chat/chat.page.probe.spec.ts` rendered the chat
page at 1280×860 with the `MockAgent` (findConferences → request-3 surface → messageWidget) and
wrote `chat-page-preview.png` to the repo root (untracked, kept for the user). It shows the Map with
labeled markers and the Berlin center mark, the name, `daysUntil` (3) and `distance` (504) rendered
through `{ call, args, returnType }` bindings on basic `Text`, the Gauge 12/500, the Reserve button,
and the markdown widget. Probe spec deleted; no probe remains in the tree. The `@vitest/browser/context`
import is deprecated in favor of `vitest/browser` (noted for the next probe).

**Live check by the user (real agent, Anthropic, shell on 4300):**

1. First attempt: `Access to fetch … blocked by CORS policy` — the running agent still used the
   default origin. `SHELL_ORIGIN=http://localhost:4300` added to `.env`; a curl preflight before the
   restart returned 204 without `access-control-allow-origin`, confirming the old process. After the
   restart: preflight 204 with the header, every run fetch 200.
2. Request 1 → `findConferences` found 3 conferences, the answer said "ca. 504 km entfernt" (the
   `me` context reached the model). `renderSurface` failed twice with `catalog`, each followed by a
   correction run ("Thought for a few seconds"), then a text fallback.
3. Developer-message payload from DevTools: `{"type":"a2ui_render_error","code":"catalog",
   "issues":"Catalog not found: conference-list"}` → `catalogId` literal added.
4. Second session, with `console.warn`: three attempts — `Unknown component(s): ConferenceList,
   ConferenceCard.`, `Text (title): Unrecognized key(s) in object: 'props'`, `List (list):
   Unrecognized key(s) in object: 'items', 'child'` — then a correct text answer. The correction
   loop works; the model lacks the basic-component vocabulary (→ Task 9).

— session 2026-09-11

- `npm run test:shell -- --watch=false --include=src/app/domain/location.store.spec.ts --include=src/app/chat/chat.page.spec.ts` → **13 passed (2 files)** after the reload change, including all six Task-7 ACs.
- `./node_modules/.bin/eslint src/app/domain/location.store.ts src/app/domain/location.store.spec.ts` → exit 0; `git diff --check` for both files → clean.
- The user's browser screenshot confirmed the old failure: Berlin restored from localStorage, geolocation skipped. The final reload behavior is covered by mocked browser callbacks; the real permission dialog was not rechecked.

— session 2026-09-11 (Codex review absorbed)

```
$ npm run test:shell -- --watch=false --include=src/app/chat/chat.page.spec.ts --include=src/app/domain/location.store.spec.ts
    → 16 passed (2 files): 9 chat (three T7-AC-04 variants, button lock) + 7 location
$ npm run test:shell -- --watch=false   → 102 passed (19 files)
$ npm run lint    → exit 0;  tsc app + spec → clean
```

Review claims re-verified before acting: `@ag-ui/mastra/dist/mastra-*.mjs` converts `role === 'assistant' | 'user' | 'tool'` only (developer messages dropped); a second click during a streamed run detaches the run (CopilotKit `runAgent` → `detachActiveRun`). The earlier revert probe stays meaningful: with a synchronous correction the failed call's tool result would not be the last message of the correction run, which the reworded T7-AC-04 asserts.

### Acceptance Coverage

- **T7-AC-01** — passed. `src/app/chat/chat.page.spec.ts::T7-AC-01`: the recorded `HttpAgent` request carries `tools[]` = `findConferences`, `messageWidget`, `renderSurface`, a context entry `A2UI Custom Catalog` whose value names `"Gauge"` and `"daysUntil"`, and the `User location (me)` entry.
- **T7-AC-02** — passed. `chat.page.spec.ts::T7-AC-02`: `setCity('berlin')` then `setCity('wien')` change the `me` value of the next run's request body.
- **T7-AC-03** — passed. `chat.page.spec.ts::T7-AC-03`: button 3 → scripted `findConferences` + `renderSurface` → Map markers and `Text(/selectedConf/name)` in the chat; clicking the second marker shows the second conference's name; two runs total; `fetch` spy never called.
- **T7-AC-04** — passed (amended wording). Three `chat.page.spec.ts::T7-AC-04` tests: a forbidden `/me` write starts exactly one correction run whose last message is the failed call's tool result (`forbidden_model_writes`, issues naming `/me`) and no third run; two failing calls in one run share one correction; an always-failing agent gets 1 + 3 runs per user turn, `console.error` once, and the next user message opens a fresh budget.
- **T7-AC-05** — passed. `chat.page.spec.ts::T7-AC-05`: four buttons, each sends its literal German text as the last `user` message of a new run.
- **T7-AC-06** — passed. `chat.page.spec.ts::T7-AC-06`: a scripted `messageWidget` call renders `<strong>next</strong>` inside `copilot-chat`; no follow-up run.

### Open Issues

- The model does not know the basic-component vocabulary (`Row`, `Column`, `Text`, `Button`, `List`), the flat-props rule, the function-call binding form `{ call, args, returnType }`, nor the record shape behind `/filteredConfs` and `/selectedConf`; live it invents names and gives up after three attempts. Decide per item between schema, context entry and prompt (see the table in Context for Next Task). (→ Task 9)
- The Mastra adapter forwards only `assistant`, `user` and `tool` messages; `developer` and `system` are dropped (verified). The correction loop therefore speaks to the model through the tool result only. If Task 9 wants an explicit instruction channel, it needs a server-side mapping before `MastraAgent.run`. (→ Task 9)
- Promoted: CopilotKit sits in the initial bundle (4.4 MB raw) because `@copilotkit/core` lacks `sideEffects: false`; a route-level CopilotKit would need its seven root consumers moved too (→ improvements register).
- Promoted: revisit the two `initAgentStore` workarounds (tool-result re-publish, deferred correction run) on the next CopilotKit upgrade — both patch 0.3.1 behavior that a later version may notify natively (→ improvements register).

### Context for Next Task

- **Location:** `init()` requests geolocation once per page load even with a persisted city. The saved city is a fallback; `setCity()` protects a current-page manual choice from a late callback. Only failures log (`[LocationStore]` warn).
- **Signatures:** `initAgentStore({ agentId, frontendTools: readonly AnyFrontendToolSpec[], context: readonly (Context | (() => Context))[] }): Signal<AgentStore>`; `createAgentStoreHelper(store): AgentStoreHelper { sendMessage(text), continueTurn(), reset() }`; `correctRenderFailures(chat, agent, destroyRef): RenderFailureHandler`, `MAX_CORRECTIONS_PER_TURN = 3`; `ASSISTANT_AGENT: InjectionToken<AbstractAgent>`, `ASSISTANT_AGENT_ID = 'assistant'`, `provideAssistantAgent(): Provider`; `meToContextEntry(me): Context`; `ASSISTANT_FRAGMENTS`; `ASSISTANT_CATALOG_ID` (framework-free file); `EXAMPLE_PROMPTS` (the four German texts, reusable by the M4 capture script).
- **Test seams:** `MockAgent(script)` with `inputs: RunAgentInput[]` — a script returns an event array or an Observable (a `Subject` holds a run open); `toolCallRun(input, name, args, toolCallId?)`, `toolCallsRun(input, calls)`, `emptyRun(input)`; TestBed providers `provideA2uiCatalog(createAssistantCatalog(ASSISTANT_FRAGMENTS))`, `provideAssistantAgent()`, `{ provide: ASSISTANT_AGENT, useValue }`. For request pins: `new HttpAgent({ agentId, url, fetch })` where `fetch` returns a `Response` with `Content-Type: text/event-stream` and `data: {…}\n\n` lines. Stub `navigator.geolocation.getCurrentPosition` and clear `localStorage` per test.
- **What the model receives per run:** `tools[]` = the three definitions as JSON schema (`messageWidget` and `renderSurface` descriptions end with "Calling this tool ends your turn."), `context[]` = `A2UI Custom Catalog` (custom components + functions, JSON) and `User location (me)`. The `renderSurface` envelope now pins `version: 'v0.9'` and `catalogId`.
- **Knowledge-gap inventory for the prompt/context design (Task 9):**

  | Knowledge | Model has it today? | Where it belongs |
  |---|---|---|
  | `catalogId`, `version`, envelope forms | yes (tool schema, literals) | done |
  | basic components: names and props | no | curated subset in the context entry (schema form), or prompt |
  | props sit flat next to `id`/`component` | weak hint only | sharpen the `looseObject` describe in the tool schema |
  | `Map`/`Gauge`/`Timeline` props | yes (context entry) | done |
  | function-call binding form `{ call, args, returnType }` | no | context entry, next to the functions |
  | `Button` `action` form | no | Button schema in the context entry, or prompt |
  | record shape behind `/filteredConfs`, `/selectedConf` (`remaining`, `capacity`, `lat`, `lon`) | partial (describe examples; the compact search result omits them) | a data-model context entry |
  | which composition fits request 3 | no (its job) | prompt example — the probe's surface in `chat.page.spec.ts::requestThreeSurface` is the reference |

- **Design line (user decision):** keep the standard A2UI envelope in the tool arguments; constrain valid values with literals and host rules, never drop or rename protocol fields. Prefer schema and context entries over prompt prose because zod issues make them self-correcting through the correction run.
- **Correction contract:** a failed `renderSurface` leaves its tool result `{ ok: false, code, result }` in the transcript (codes as in Task 6: `invalid_args`, `invalid_messages`, `forbidden_model_writes`, `catalog`) and the shell starts one correction run per failing run, at most three per user turn. Nothing else is sent; the tool result is what the model reads.
- **Node-importable pieces for the eval harness:** `tools/*.definition.ts` import only `zod` and `assistant-catalog-id.ts`. `catalogToContextEntry` lives in `catalog-context.ts`, which reaches `@a2ui/angular` through `assistant-catalog.ts` — check whether Node tolerates that import before reusing it, or split the metadata path the way the catalog id was split.
- **Gotchas:** the agent must be restarted after `.env` changes; `SHELL_ORIGIN` replaces, not extends, the default; the `uuid` alias in `vitest-base.config.ts` is still load-bearing; render failures are logged via `console.warn`, an exhausted correction budget via `console.error`; the example buttons stay disabled while `isRunning`; the CopilotKit stylesheet ships a Tailwind preflight (no visible side effects so far); `@vitest/browser/context` is deprecated in favor of `vitest/browser`.

### Git State

```text
$ git diff --stat
 .env.example                                     |   4 +
 README.md                                        |   3 +-
 agent/src/config.spec.ts                         |  13 +-
 agent/src/config.ts                              |   7 +
 agent/src/server.spec.ts                         |  43 ++++-
 agent/src/server.ts                              |  12 +-
 angular.json                                     |   7 +-
 docs/architecture.md                             |  76 ++++++---
 docs/improvements.md                             |  10 +-
 docs/work/m1-spike/plan.md                       |   8 +-
 package-lock.json                                | 207 +++--------------------
 package.json                                     |   6 +-
 src/app/a2ui/assistant-catalog.ts                |   3 +-
 src/app/agent/create-frontend-tool.ts            |  10 +-
 src/app/agent/render-failure-handler.token.ts    |   2 +-
 src/app/agent/tools/render-surface.definition.ts |   4 +-
 src/app/agent/tools/render-surface.tool.spec.ts  |  12 ++
 src/app/app.config.ts                            |   7 +-
 src/app/app.routes.ts                            |   4 +
 src/app/domain/cities.ts                         |   1 +
 src/app/domain/location.store.spec.ts            |  37 +++-
 src/app/domain/location.store.ts                 |  18 +-
 src/styles.css                                   |  20 ++-
 23 files changed, 255 insertions(+), 259 deletions(-)

$ git status --short        # repo files only; sandbox dotfiles omitted
 M .env.example
 M README.md
 M agent/src/config.spec.ts
 M agent/src/config.ts
 M agent/src/server.spec.ts
 M agent/src/server.ts
 M angular.json
 M docs/architecture.md
 M docs/improvements.md
 M docs/work/m1-spike/plan.md
 M package-lock.json
 M package.json
 M src/app/a2ui/assistant-catalog.ts
 M src/app/agent/create-frontend-tool.ts
 M src/app/agent/render-failure-handler.token.ts
 M src/app/agent/tools/render-surface.definition.ts
 M src/app/agent/tools/render-surface.tool.spec.ts
 M src/app/app.config.ts
 M src/app/app.routes.ts
 M src/app/domain/cities.ts
 M src/app/domain/location.store.spec.ts
 M src/app/domain/location.store.ts
 M src/styles.css
?? chat-page-preview.png
?? docs/tech-debt-backlog.md
?? docs/work/m1-spike/task-log/task-7-chat-page.md
?? src/app/a2ui/assistant-catalog-id.ts
?? src/app/a2ui/assistant-fragments.ts
?? src/app/agent/agent-store-helper.ts
?? src/app/agent/assistant-agent.token.ts
?? src/app/agent/init-agent-store.ts
?? src/app/agent/me-context-entry.ts
?? src/app/agent/render-failure-correction.ts
?? src/app/chat/
?? src/app/testing/mock-agent.ts
```

### Sessions

- claude-code a80be9e2-10a0-40e4-9c0f-44cd481bb549 (2026-09-11) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/a80be9e2-10a0-40e4-9c0f-44cd481bb549.jsonl

- codex 01a08d1e-2e4c-7641-8eb6-00471a3af1db (2026-09-11) — transcript: ~/.codex/sessions/2026/09/10/rollout-2026-09-10T22-59-20-01a08d1e-2e4c-7641-8eb6-00471a3af1db.jsonl
