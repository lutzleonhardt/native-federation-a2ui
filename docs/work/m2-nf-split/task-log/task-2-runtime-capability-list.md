# Task 2: Compose catalog and model context from a runtime capability list

### Task

Replaced the two hard-wired vocabulary imports (`assistant-fragments.ts` for the renderer,
`catalog-context.ts` for the model) with one capability list that arrives at bootstrap:
`createAppConfig(capabilities)` provides the renderer catalog and the `AGENT_CAPABILITIES` token,
`catalogToContextEntry` takes the framework-free vocabularies as its argument.

### Status

DONE — implementation complete, all checks green (see Test Evidence). Independent review
performed (Codex blind-spot pass, 2026-09-16): one finding absorbed, one declined with reason
(see Key Decisions). Not committed (`/commit 2` pending).

### Files Modified

- `src/app/a2ui/agent-capabilities.token.ts` (new) — `AGENT_CAPABILITIES` (the one place the app
  learns what is loaded) and `provideAgentCapabilities(capabilities)`, which registers the token
  and the renderer catalog built from the list.
- `src/app/app.config.ts` (modified) — `appConfig` constant became the factory
  `createAppConfig(capabilities)`; the catalog provider is now `provideAgentCapabilities`.
- `src/main.ts` (modified) — passes `[chartsCapability, mapsCapability]` explicitly; the seam the
  federation loader takes over in Task 3.
- `src/app/a2ui/catalog-context.ts` (modified) — `catalogToContextEntry(vocabularies)`: the two
  vocabulary imports and `ASSISTANT_VOCABULARY` are gone; `uniqueByName` replaces
  `withoutReservedNames` and also drops later registrations of a name (first wins, like
  `mergeFragments`); the local `ComponentVocabulary`/`FunctionVocabulary` interfaces gave way to
  the contract's `CapabilityVocabulary` (type-only import).
- `src/app/a2ui/assistant-fragments.ts` (deleted) — the renderer-side hard-wired list.
- `src/app/chat/chat.page.ts` (modified) — the context entry is built from
  `inject(AGENT_CAPABILITIES)` instead of calling the serializer with no arguments; a comment
  says the entries become the agent prompt's sections and why one is a value, one an accessor.
- `shared/capabilities/agent-capability.ts` (modified) — `toFragment` takes one `AgentCapability`
  instead of `(vocabulary, implementations)`, so `capabilities.map(toFragment)` works.
- `src/app/capabilities/charts/index.ts`, `src/app/capabilities/maps/index.ts` (modified) — export
  `chartsCapability` / `mapsCapability` (`{ name, vocabulary, components }`) instead of a
  `CatalogFragment`.
- `eval/run-eval.ts` (modified) — passes `[chartsVocabulary, mapsVocabulary]` from the
  `vocabulary.ts` files directly; no behavior change.
- `eval/model-context.spec.ts` (modified) — T1-AC-01 with the explicit list; new T2-AC-01 Node
  check for a charts-only list.
- `src/app/a2ui/catalog-context.spec.ts` (modified) — the drift test is parameterized over six
  lists (T2-AC-02), one of them with a colliding capability, plus a first-wins/basic-name case;
  the T4-AC-05 tests use the full local list.
- `src/app/chat/chat.page.spec.ts` (modified) — `renderChat(agent, capabilities = LOCAL)` provides
  via `provideAgentCapabilities`; new T2-AC-01 integration test (charts only → announced set,
  `Map` surface → `catalog` correction run).
- `src/app/a2ui/assistant-catalog.spec.ts`, `src/app/a2ui/renderer-integration.spec.ts`,
  `src/app/agent/tools/render-surface.tool.spec.ts`,
  `src/app/agent/tools/surface-tool-renderer.component.spec.ts`,
  `src/app/capabilities/charts/timeline.component.spec.ts`,
  `src/app/capabilities/charts/days-until.fn.spec.ts`,
  `src/app/capabilities/maps/map.component.spec.ts` (modified) — build their catalog from the
  capabilities (`provideAgentCapabilities([...])` or `toFragment(...)`); one provider or import
  line each, no test logic changed.
- `docs/architecture.md` (modified) — the invariant "One enumeration per capability" gained one
  sentence: the loaded list is decided at bootstrap, never by a shell import; `AGENT_CAPABILITIES`
  is where the app reads it.

### Files Read (Context Only)

- `docs/work/m2-nf-split/task-log/task-1-capability-contract.md` — the contract entry points,
  the no-barrel rule, the payload-identity probe and the `tsx`/prettier gotchas.
- `docs/work/m1-spike/task-log/task-9-agent-prompt-and-eval.md` (Key Decisions) — why
  `catalogToContextEntry()` lost its parameter in M1 (framework-free side, `@a2ui/web_core` for the
  basic names); this task re-adds a parameter of a different kind (vocabularies, not fragments).
- `src/app/a2ui/assistant-catalog.ts`, `provide-a2ui-catalog.ts`, `src/app/agent/assistant-agent.token.ts`
  — the merge rule (`uniqueByName`, first wins) and the token-plus-provider file pattern.
- `src/app/agent/tools/render-surface.tool.ts` — where an unknown component is rejected
  (`findUnknownComponents`, code `catalog`) before any message is applied.
- `src/app/capabilities/charts/vocabulary.ts`, `maps/vocabulary.ts`, `shared/capabilities/catalog-function.ts`,
  `custom-component.ts` — the shapes behind `CapabilityVocabulary`.
- `src/app/app.routes.ts`, `src/app/playground/*.ts` — confirmed the playground routes use only
  `ASSISTANT_CATALOG_ID` and need no change.
- `eslint.config.js`, `tsconfig*.json`, `eval/vitest.config.ts`, `.prettierrc` — no import-order
  rule; the three type-check resolutions; the Node runner.

### Key Decisions

— session 2026-09-15

- **`createAppConfig(capabilities)`, not `appConfig`.** The plan sketch kept the constant's name
  for the factory; the user asked for a name that says it builds something. Only `main.ts`
  imports it.
- **Catalog provider and token are one function.** `provideAgentCapabilities(capabilities)` in
  `agent-capabilities.token.ts` bundles `provideA2uiCatalog(createAssistantCatalog(caps.map(toFragment)))`
  and `{ provide: AGENT_CAPABILITIES, useValue }`, the pattern of `assistant-agent.token.ts`. The
  plan sketch shows the two providers inline in the config; the composition has seven consumers
  (config, chat spec, five catalog specs), so inline would have meant seven copies. Cost: specs
  that only need a catalog also receive the token, which is harmless.
- **`toFragment` takes the `AgentCapability`.** Its only callers were the two `index.ts` files,
  which now build the capability instead; the plan's `capabilities.map(toFragment)` needs this
  signature. `index.ts` exports only the capability — keeping `chartsFragment` alongside was
  rejected because Task 4 would carry two forms of the same thing into the remote. Consequence:
  seven specs outside the Key Locations changed one line each (approved before implementation).
- **The serializer resolves duplicates like the renderer: first registration wins.**
  `Object.fromEntries` let the last duplicate win silently, so a second capability announcing
  `Gauge` would have shown the model a schema the renderer does not implement. `uniqueByName`
  skips names taken by the basic catalog or an earlier entry — the same rule and name as in
  `assistant-catalog.ts`, without the warning (the renderer side already logs it). Named
  `firstByName` at first; renamed on review because that named the tie-break, not the
  operation. A spec with a synthetic second `Gauge` pins both sides.
- **`catalogToContextEntry` takes `CapabilityVocabulary<string>[]`, not `AgentCapability[]`**
  (per plan). The shell maps `capability.vocabulary`; the harness imports the `vocabulary.ts`
  files. An `AgentCapability` cannot be built under Node because `components` are Angular
  classes — this asymmetry is what keeps XC-04 provable there.
- **T2-AC-01 as one integration test in `chat.page.spec.ts`.** With `MockAgent` and a
  charts-only list, one test sees both halves: the recorded run context announces exactly
  `Gauge`, `Timeline`, `daysUntil`, and the `Map` surface comes back as a correction run with
  code `catalog`. The alternative — a second TestBed configuration in
  `render-surface.tool.spec.ts` — would have proven only the boundary half. The Node twin lives
  in `eval/model-context.spec.ts`.
- **Token file lives in `src/app/a2ui/`** next to the catalog plumbing. It imports
  `@angular/core` at runtime, so nothing Node-reachable (`catalog-context.ts`,
  `surface-host-rules.ts`) may import it; the eval suite would fail at import time if it did.
- **`inject(AGENT_CAPABILITIES)` inline in the `store` initializer of `ChatPage`**, no extra
  field: the page has no other reader of the list.
- **One sentence in `docs/architecture.md`** rather than leaving it to Task 8: the doc's
  invariant described the per-capability halves but not who decides the list; that is the new
  architectural fact of this task.
- **Working tree stays unstaged** (global rule); the deleted file shows as `D`, the new token
  file as `??`.

— session 2026-09-16 (Codex blind-spot review absorbed)

- **Collision coverage extended (Codex finding taken).** The equality test ran only over lists
  without conflicts, because the five local names are all custom, and the duplicate case
  checked one component. A synthetic `colliding` capability now announces a duplicate
  component (`Gauge`), a basic component name (`Text`), a duplicate function (`daysUntil`) and
  a basic function name (`formatDate`). It is one more entry in the `it.each` list; the
  first-wins test asserts the winner for component and function and that basic names are
  absent from the announced payload.
- **No `processMessages` assertion in the T2-AC-01 chat test (Codex finding declined).** The
  claim "rejected before any message reaches the renderer" is pinned by
  `render-surface.tool.spec.ts` T6-AC-03 (unknown name → no surface left behind) on the same
  code path; the chat test proves the charts-only catalog content. A spy on the renderer
  service would assert library internals for a fact already covered.
- **Comments on the two providers and the run context** (user review):
  `provideAgentCapabilities` marks the renderer half and the model half; `chat.page.ts` says
  the entries become the agent prompt's vocabulary and location sections and why the catalog
  entry is a value while `me` is an accessor.

### Review Focus

- **Behavior claims:** (1) for the full local list the serialized model context is byte-identical
  to before (7940 bytes, keys `Gauge,Timeline,Map` / `daysUntil,distance`); (2) with
  `[chartsCapability]` the run context announces neither `Map` nor `distance`, and a surface
  using `Map` fails with code `catalog` before any message reaches the renderer; (3) for any list
  — empty, one capability, both, reversed, with duplicate and basic names — announced and
  rendered names are equal; a duplicate resolves to the first registration on both sides, and
  basic names are never announced.
- **Plan deviations:** `appConfig` factory → `createAppConfig` → user's naming. Two inline
  providers → `provideAgentCapabilities` → seven consumers. `toFragment(vocabulary, implementations)`
  → `toFragment(capability)` → required by `capabilities.map(toFragment)`. Key Locations
  incomplete: `shared/capabilities/agent-capability.ts`, `charts/index.ts`, `maps/index.ts` and
  seven specs importing `chartsFragment`/`mapsFragment` were not listed → all changed → approved.
  Beyond the block: serializer first-wins rule (approved), the architecture-doc sentence.
- **Assumptions / choices:** list order equals manifest order and decides duplicate winners
  (plan's Key Discoveries); capability names are `'charts'` and `'maps'` (no consumer reads them
  yet — Task 5's panel will); the harness keeps importing `vocabulary.ts` files, never
  `index.ts`.
- **Scope notes:** `docs/architecture.md` (+1 sentence); `eval/run-eval.ts` (two imports and the
  call, no behavior change; its pre-existing prettier drift on untouched lines was left alone);
  seven specs (one line each).
- **Read next:**
  1. `src/app/a2ui/agent-capabilities.token.ts` — the whole composition in 20 lines; the only
     runtime Angular import this task adds.
  2. `src/app/a2ui/catalog-context.ts::uniqueByName` against
     `src/app/a2ui/assistant-catalog.ts::uniqueByName` — the two sides of one rule, same name.
  3. `src/app/chat/chat.page.spec.ts` "T2-AC-01 with charts only" — the end-to-end claim,
     including how the `Map` rejection reaches the correction run.

### Test Evidence

— session 2026-09-15

- **Payload identity (full list).** Before the change:
  `node --import tsx --input-type=module -e "import {catalogToContextEntry} from './src/app/a2ui/catalog-context'; process.stdout.write(catalogToContextEntry().value)"`
  → 7940 bytes. After:
  `… -e "import {catalogToContextEntry} from './src/app/a2ui/catalog-context'; import {chartsVocabulary} from './src/app/capabilities/charts/vocabulary'; import {mapsVocabulary} from './src/app/capabilities/maps/vocabulary'; process.stdout.write(catalogToContextEntry([chartsVocabulary, mapsVocabulary]).value)"`
  → 7940 bytes, `diff` empty — byte-identical. Both outputs live in the session scratchpad only;
  nothing in the tree.
- Type-checks, all three shell/eval resolutions: `npx tsc -p tsconfig.app.json --noEmit`,
  `-p tsconfig.spec.json`, `-p eval/tsconfig.json` — 0 errors. (`agent/` untouched.)
- `npm run lint` — "All files pass linting".
- `npm run test:eval` — 2 files, 18 passed (17 + the T2-AC-01 Node check).
- `npm run test:shell` — 19 files, 109 passed (103 + 6: five parameterized lists and the
  duplicate case in `catalog-context.spec.ts`, T2-AC-01 in `chat.page.spec.ts`).
- `npm run build` — succeeds; the CommonJS bailout warnings (`@copilotkit/shared`,
  `@segment/analytics-node`) are pre-existing.
- `npx prettier --check` on the rewritten files — clean after formatting
  `catalog-context.spec.ts`. `eval/run-eval.ts` is flagged, but `git show HEAD:eval/run-eval.ts`
  was already not prettier-clean and every flagged line is untouched by this task; left as is to
  keep the diff free of formatting noise.
- No `npm run eval` — nothing model-facing changed (payload identity above).

— session 2026-09-16 (after the review edits: colliding list entry, `uniqueByName` rename,
comments)

- `npx tsc -p tsconfig.spec.json --noEmit` and `-p tsconfig.app.json --noEmit` — 0 errors;
  `npm run lint` — "All files pass linting"; `npm run test:eval` — 18 passed (unchanged);
  `npm run test:shell` — 19 files, 110 passed (109 + the colliding list entry). These runs
  cover the final code state; the 2026-09-15 counts above predate the review edits.
- Not repeated: `npm run build` and the payload probe — the review edits touched a spec, a
  private helper's name and comments; `catalog-context.ts` is exercised unchanged by the Node
  suite.

### Acceptance Coverage

- **T2-AC-01** — passed — `src/app/chat/chat.page.spec.ts` "T2-AC-01 with charts only: the
  context announces neither Map nor distance, and a Map surface is rejected as unknown"
  (announced keys exactly `Gauge`, `Timeline` / `daysUntil`; the correction run's tool message
  carries code `catalog` naming `Map`) and `eval/model-context.spec.ts` "T2-AC-01: a charts-only
  list announces neither Map nor distance" under Node. XC-04 contribution: both call the same
  `catalogToContextEntry`.
- **T2-AC-02** — passed — `src/app/a2ui/catalog-context.spec.ts` describe "T2-AC-02 announced and
  rendered vocabulary name the same set": six lists (none, charts, maps, both, maps-first,
  charts plus a colliding capability) via `it.each`, plus "resolves a duplicate name to the
  first registration and drops basic names".

### Open Issues

- The local capabilities still live under `src/app/capabilities/` and `main.ts` names them
  explicitly (→ Task 3 replaces the list with the loader's, Tasks 4 and 6 move the folders).

### Context for Next Task

- **Signatures:** `createAppConfig(capabilities: readonly AgentCapability[]): ApplicationConfig`
  (`src/app/app.config.ts`); `provideAgentCapabilities(capabilities): EnvironmentProviders` and
  `AGENT_CAPABILITIES: InjectionToken<readonly AgentCapability[]>`
  (`src/app/a2ui/agent-capabilities.token.ts`); `toFragment(capability: AgentCapability): CatalogFragment`;
  `catalogToContextEntry(vocabularies: readonly CapabilityVocabulary<string>[]): Context`;
  `chartsCapability` / `mapsCapability` from `src/app/capabilities/<area>/index.ts`.
- **The seam for Task 3 is `src/main.ts`:** today
  `bootstrapApplication(App, createAppConfig([chartsCapability, mapsCapability]))`; the
  federation host resolves the manifest and the `?capabilities=` whitelist, loads the remotes,
  and hands the resulting list to the same `createAppConfig`. List order is manifest order and
  decides who wins a duplicate name on both sides.
- **Specs build a catalog with `provideAgentCapabilities([chartsCapability, mapsCapability])`**
  (TestBed) or `createAssistantCatalog([toFragment(chartsCapability)])` (no TestBed). When charts
  move (Task 4), the shell specs may import the remote's source as a fixture — production code
  may not (plan preamble).
- **The eval harness imports `vocabulary.ts` files, never `index.ts`** — `index.ts` imports the
  Angular components. When the folders move, `eval/run-eval.ts` and `eval/model-context.spec.ts`
  need the new `vocabulary.ts` paths.
- **Gotchas:** `agent-capabilities.token.ts` imports `@angular/core` at runtime — keep it out of
  `catalog-context.ts` and `surface-host-rules.ts`, or `npm run test:eval` fails at import. The
  `tsx` CLI does not run inside the Claude sandbox; use `node --import tsx --input-type=module -e "…"`.
  Format only the files you changed — several files were never prettier-clean.

### Git State

```
$ git diff --stat
 docs/architecture.md                               |  5 +-
 eval/model-context.spec.ts                         | 16 +++-
 eval/run-eval.ts                                   |  8 +-
 shared/capabilities/agent-capability.ts            |  7 +-
 src/app/a2ui/assistant-catalog.spec.ts             | 12 +--
 src/app/a2ui/assistant-fragments.ts                | 10 ---
 src/app/a2ui/catalog-context.spec.ts               | 93 +++++++++++++++++++---
 src/app/a2ui/catalog-context.ts                    | 57 ++++++-------
 src/app/a2ui/renderer-integration.spec.ts          | 10 +--
 src/app/agent/tools/render-surface.tool.spec.ts    | 10 +--
 .../tools/surface-tool-renderer.component.spec.ts  | 10 +--
 src/app/app.config.ts                              | 27 ++++---
 src/app/capabilities/charts/days-until.fn.spec.ts  |  7 +-
 src/app/capabilities/charts/index.ts               | 13 +--
 .../capabilities/charts/timeline.component.spec.ts | 12 +--
 src/app/capabilities/maps/index.ts                 | 13 +--
 src/app/capabilities/maps/map.component.spec.ts    | 10 +--
 src/app/chat/chat.page.spec.ts                     | 57 +++++++++++--
 src/app/chat/chat.page.ts                          |  9 ++-
 src/main.ts                                        | 10 ++-
 20 files changed, 264 insertions(+), 132 deletions(-)

$ git status --short     # sandbox dotfiles and this log omitted
 M docs/architecture.md
 M eval/model-context.spec.ts
 M eval/run-eval.ts
 M shared/capabilities/agent-capability.ts
 M src/app/a2ui/assistant-catalog.spec.ts
 D src/app/a2ui/assistant-fragments.ts
 M src/app/a2ui/catalog-context.spec.ts
 M src/app/a2ui/catalog-context.ts
 M src/app/a2ui/renderer-integration.spec.ts
 M src/app/agent/tools/render-surface.tool.spec.ts
 M src/app/agent/tools/surface-tool-renderer.component.spec.ts
 M src/app/app.config.ts
 M src/app/capabilities/charts/days-until.fn.spec.ts
 M src/app/capabilities/charts/index.ts
 M src/app/capabilities/charts/timeline.component.spec.ts
 M src/app/capabilities/maps/index.ts
 M src/app/capabilities/maps/map.component.spec.ts
 M src/app/chat/chat.page.spec.ts
 M src/app/chat/chat.page.ts
 M src/main.ts
?? src/app/a2ui/agent-capabilities.token.ts
```

### Sessions

- claude-code 6344208d-0c2a-4507-9598-e145b1fab3f5 (2026-09-15) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/6344208d-0c2a-4507-9598-e145b1fab3f5.jsonl
