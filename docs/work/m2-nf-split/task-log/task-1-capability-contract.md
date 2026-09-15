# Task 1: Extract the capability contract into `shared/capabilities`

### Task

Moved everything a remote needs to describe a capability out of `src/app/` into
`shared/capabilities/`, next to `agent-contract.ts`, and added `AgentCapability`; a pure
relocation — the shell keeps only the merge (`assistant-catalog.ts`) and the model context.

### Status

DONE — implementation complete, all checks green (see Test Evidence). Independent review not yet
performed; the change is not committed (`/commit 1` pending).

### Files Modified

- `shared/capabilities/agent-capability.ts` (new) — the capability-level half of the contract:
  `CapabilityVocabulary`, `ComponentImplementations`, `toFragment` (from `custom-component.ts`),
  `CatalogFragment` (from `assistant-catalog.ts`) and the new `AgentCapability`.
- `shared/capabilities/custom-component.ts` (moved from `src/app/a2ui/`, trimmed) — keeps the
  component level: `ComponentMeta`, `CustomComponent`, `createCustomComponent` and the canonical
  zod-bridge comment.
- `shared/capabilities/catalog-function.ts` (moved from `src/app/a2ui/`) — gained
  `AssistantFunction` from `assistant-catalog.ts`; no import from the shell any more.
- `shared/capabilities/binding.ts`, `shared/capabilities/action-schema.ts` (moved from
  `src/app/a2ui/`) — unchanged.
- `shared/capabilities/surface-action.ts` (moved from `src/app/capabilities/shared/`) — doc comment
  gained the per-file Node rule; it is the only file in the folder that needs Angular at runtime.
- `src/app/a2ui/custom-component.ts`, `catalog-function.ts`, `binding.ts`, `action-schema.ts`,
  `src/app/capabilities/shared/surface-action.ts` (deleted) — moved; the now-empty
  `capabilities/shared/` folder is gone.
- `src/app/a2ui/assistant-catalog.ts` (modified) — `AssistantFunction` and `CatalogFragment`
  removed, `CatalogFragment` imported from the contract; `mergeFragments`/`createAssistantCatalog`
  untouched.
- `src/app/a2ui/assistant-fragments.ts`, `src/app/a2ui/assistant-catalog.spec.ts` (modified) —
  import paths (the spec now takes `CatalogFragment` from the contract too).
- `src/app/capabilities/charts/{gauge,timeline}.schema.ts`, `maps/map.schema.ts`,
  `charts/vocabulary.ts`, `maps/vocabulary.ts`, `charts/days-until.fn.ts`, `maps/distance.fn.ts`,
  `charts/index.ts`, `maps/index.ts`, `charts/timeline.component.ts`, `maps/map.component.ts`
  (modified) — import paths only (`../../../../shared/capabilities/…`).
- `angular.json` (modified) — `shared/**/*.ts` added to `lintFilePatterns`.
- `eval/model-context.spec.ts` (new) — T1-AC-01 as a Node-runner regression check.
- `docs/architecture.md` (modified) — the Vocabulary layer row names the three locations; new
  invariant "The capability contract is `shared/capabilities/`" with the no-barrel rationale.
- `docs/improvements.md` (modified) — one register entry for Task 8: the how-it-works tour must
  cover the surface data flow (base path, literal vs. `{ path }`, `onUpdate`, the two action
  channels), captured from the in-session walkthrough.
- `docs/tech-debt-backlog.md` (modified) — one `/cs` entry: `dispatchSurfaceAction` has five
  parameters (pre-existing, grazed by the move; the Button-mirror signature stays).

### Files Read (Context Only)

- `shared/agent-contract.ts`, `shared/package.json` — the relative-import pattern and the ESM
  marker the subfolder inherits.
- `src/app/a2ui/catalog-context.ts`, `catalog-context.spec.ts` — confirmed no change needed (they
  import the vocabularies, not the moved modules).
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json`, `eval/tsconfig.json`,
  `eval/vitest.config.ts`, `agent/tsconfig.json`, `eslint.config.js`, `angular.json`, `.prettierrc`
  — the four resolvers and the lint/format scope.
- `docs/work/m1-spike/task-log/refactor-vocabulary-single-source.md`, `chore-agent-contract.md` —
  the M1 placement decision for `toFragment`, the payload-identity probe, the four type-check runs.
- `eval/run-eval.ts`, `eval/score.spec.ts` — where the harness imports the shell, and the spec
  style of the eval project.

### Key Decisions

— session 2026-09-15

- **Three-file split of the contract, not a 1:1 move.** `agent-capability.ts` holds the
  capability level (`CapabilityVocabulary`, `ComponentImplementations`, `CatalogFragment`,
  `toFragment`, `AgentCapability`), `custom-component.ts` keeps the component level,
  `catalog-function.ts` gains `AssistantFunction`. Reason: one file per abstraction level, and the
  new type needs a home whose name says what it is. Cost: gives up M1's preference to keep
  `toFragment` next to `createCustomComponent` (they are one import apart now). The type-only
  cycle M1 accepted for that placement (`custom-component ↔ assistant-catalog`) disappears in
  either variant, because `CatalogFragment`/`AssistantFunction` move into the contract — it was
  not an argument for the split. Approved by the user.
- **No barrel in `shared/capabilities/`.** An ESM import evaluates every module a barrel
  re-exports; Node has no tree-shaking, and `surface-action.ts` imports `@a2ui/angular` at
  runtime, which fails under Node at import time (verified, see Test Evidence). A barrel without
  `surface-action` would be a silent trap: the next export "for completeness" breaks only
  `npm run eval`. Canonical statement in `docs/architecture.md`; `surface-action.ts` carries the
  pointer.
- **Type-only Angular imports stay in the contract.** `custom-component.ts` (`Type`,
  `AngularComponentImplementation`) and `agent-capability.ts` (`Type`) import Angular with
  `import type`, erased under `isolatedModules`. The plan preamble's "nothing reachable from a
  `vocabulary.ts` may import `@angular/core`" is a runtime rule — unchanged from M1.
- **Lint scope extended to `shared/**/*.ts`.** The moved files would otherwise silently drop out
  of `ng lint`. The flat ESLint config already matched `**/*.ts`; only `lintFilePatterns` needed
  the pattern. `agent-contract.ts` is linted now too and passes.
- **T1-AC-01 gets an automated Node check.** `eval/model-context.spec.ts` runs in the eval
  Vitest project (`environment: node`) and pins the description and the five names. The existing
  `catalog-context.spec.ts` runs in the browser runner and cannot prove Node-loadability.
- **`catalog-context.ts` untouched.** The plan's Key Locations listed its lines 5–6 as an
  importer to rewrite; those lines import the vocabularies, which stay in `src/app/capabilities/`
  until Tasks 4 and 6.
- **Working tree stays unstaged during implementation** (user preference, now in the global
  CLAUDE.md). `git mv` had staged the renames and I had staged the rest for an overview; both
  reset — the moves show as `D old` + `?? new`.

### Review Focus

- **Behavior claims:** (1) the serialized model context is byte-identical to before the move
  (7940 bytes, components `Gauge,Timeline,Map`, functions `daysUntil,distance`); (2) inside
  `shared/capabilities/` only `surface-action.ts` imports Angular at runtime, and no
  `vocabulary.ts`, `*.schema.ts` or `*.fn.ts` imports it; (3) shell, agent and eval suites keep
  their counts, eval +1 for the new spec.
- **Plan deviations:** Key Locations named `catalog-context.ts:5-6` as an importer to rewrite →
  left untouched → it imports vocabularies, not the moved modules. Plan lists
  `CapabilityVocabulary`/`ComponentImplementations`/`toFragment` under `custom-component.ts` →
  placed in the new `agent-capability.ts` → cohesion (approved). Beyond the block: lint scope,
  the Node spec, the architecture-doc invariant (approved before implementation).
- **Assumptions / choices:** the `AgentCapability` field comments are shorter than the plan
  sketch (printWidth 100); the type has no consumer yet — Task 2 is its first.
- **Scope notes:** `docs/architecture.md` (layer row + one invariant), `angular.json` (one
  line), `surface-action.ts` doc comment (+3 lines). No behavior change anywhere.
- **Read next:**
  1. `shared/capabilities/agent-capability.ts` — the whole contract head in 48 lines; check that
     nothing but `./catalog-function` and `./custom-component` is imported.
  2. `src/app/a2ui/assistant-catalog.ts:1-6` — the shell's only contract import; merge logic
     below is unchanged.
  3. `eval/model-context.spec.ts` and `docs/architecture.md:230-237` — the AC-01 guard and the
     canonical no-barrel rule it protects.

### Test Evidence

— session 2026-09-15

- **Payload identity (T1-AC-01).** Before the move:
  `node --import tsx --input-type=module -e "import {catalogToContextEntry} from './src/app/a2ui/catalog-context'; process.stdout.write(catalogToContextEntry().value)"`
  → 7940 bytes, saved to the session scratchpad. After: `diff` against it is empty —
  byte-identical, keys `Gauge,Timeline,Map` / `daysUntil,distance`. The probe files live in the
  scratchpad only; nothing in the tree. (The `tsx` CLI itself cannot run inside the Claude
  sandbox — it opens an IPC pipe; the `node --import tsx` loader form works.)
- **Node-load probe of the Angular-bound file** (answering the "why no barrel" question):
  `node --import tsx --input-type=module -e "import './shared/capabilities/surface-action'"` →
  `Error: The injectable 'PlatformLocation' needs to be compiled using the JIT compiler, but
  '@angular/compiler' is not available.` — the per-file rule is a runtime necessity.
- **Runtime-import scan:** `rg -n "^import (?!type)" shared/capabilities --pcre2 | rg "@angular|@a2ui/angular"`
  → only `surface-action.ts:1-2`.
- Type-checks, all four resolutions: `npx tsc -p tsconfig.app.json --noEmit`,
  `-p tsconfig.spec.json`, `-p eval/tsconfig.json`, `npm --prefix agent run typecheck` — 0 errors.
- `npm run lint` (now including `shared/`) — "All files pass linting".
- `npm run test:eval` — 2 files, 17 passed (16 + the new spec). `npm run test:agent` — 25 passed.
  `npm run test:shell` — 19 files, 103 passed.
- `npm run build` — succeeds; the two CommonJS bailout warnings (`@copilotkit/shared`,
  `@segment/analytics-node`) are pre-existing.
- No `npm run eval` — nothing model-facing changed (payload identity above).
- **Formatting note.** `prettier --write` over the touched folders reformatted six files that were
  never prettier-clean (`angular.json`, two specs, two components, `map.schema.ts`); those were
  restored from HEAD and only the import/lint edits re-applied, so the diff carries no formatting
  noise.

### Acceptance Coverage

- **T1-AC-01** — passed — `eval/model-context.spec.ts` ("T1-AC-01: assembles the catalog entry
  from the capability vocabularies") is green under `npm run test:eval`; the byte-identical
  payload probe above confirms the same path by hand.

### Open Issues

- Promoted: the how-it-works tour should explain the surface data flow and the two action
  channels (→ improvements register, picked up by Task 8).

### Context for Next Task

- Contract entry points: `shared/capabilities/agent-capability.ts` exports
  `AgentCapability { name; vocabulary: CapabilityVocabulary<string>; components: ComponentImplementations<string> }`,
  `CatalogFragment` and `toFragment(vocabulary, implementations): CatalogFragment`;
  `catalog-function.ts` exports `AssistantFunction` and `createCatalogFunction`;
  `custom-component.ts` exports `ComponentMeta`, `CustomComponent`, `createCustomComponent`;
  `binding.ts`, `action-schema.ts`, `surface-action.ts` are unchanged.
- `AgentCapability` has no consumer yet. For Task 2 the natural shape is
  `charts/index.ts` exporting `{ name: 'charts', vocabulary: chartsVocabulary, components: IMPLEMENTATIONS }`,
  the shell calling `toFragment(cap.vocabulary, cap.components)`, and `catalog-context.ts`
  taking the vocabularies from the list instead of importing the two modules.
- Extend `eval/model-context.spec.ts` in Task 2 rather than adding another Node spec — it is the
  only automated proof that the context path loads without Angular.
- Import depth: `../../../../shared/capabilities/…` from `src/app/capabilities/<area>/`; from
  `projects/mfe-*/src/app/…` it gets deeper. The alias decision is deferred per the plan preamble.
- Gotchas: the `tsx` CLI does not run inside the Claude sandbox (IPC pipe EPERM) — use
  `node --import tsx --input-type=module -e "…"`; `prettier --write` on whole folders touches
  files that were never formatted — format only the files you changed.

### Git State

```
$ git diff --stat
 angular.json                                      |  1 +
 docs/architecture.md                              | 10 +++-
 src/app/a2ui/action-schema.ts                     |  9 ---
 src/app/a2ui/assistant-catalog.spec.ts            |  5 +-
 src/app/a2ui/assistant-catalog.ts                 | 14 +----
 src/app/a2ui/assistant-fragments.ts               |  2 +-
 src/app/a2ui/binding.ts                           | 12 ----
 src/app/a2ui/catalog-function.ts                  | 28 ---------
 src/app/a2ui/custom-component.ts                  | 69 -----------------------
 src/app/capabilities/charts/days-until.fn.ts      |  6 +-
 src/app/capabilities/charts/gauge.schema.ts       |  4 +-
 src/app/capabilities/charts/index.ts              |  7 ++-
 src/app/capabilities/charts/timeline.component.ts |  2 +-
 src/app/capabilities/charts/timeline.schema.ts    |  6 +-
 src/app/capabilities/charts/vocabulary.ts         |  2 +-
 src/app/capabilities/maps/distance.fn.ts          |  6 +-
 src/app/capabilities/maps/index.ts                |  7 ++-
 src/app/capabilities/maps/map.component.ts        |  2 +-
 src/app/capabilities/maps/map.schema.ts           |  6 +-
 src/app/capabilities/maps/vocabulary.ts           |  2 +-
 src/app/capabilities/shared/surface-action.ts     | 24 --------
 21 files changed, 45 insertions(+), 179 deletions(-)

$ git status --short     # sandbox dotfiles omitted; the five D/?? pairs are moves
 M angular.json
 M docs/architecture.md
 D src/app/a2ui/action-schema.ts
 M src/app/a2ui/assistant-catalog.spec.ts
 M src/app/a2ui/assistant-catalog.ts
 M src/app/a2ui/assistant-fragments.ts
 D src/app/a2ui/binding.ts
 D src/app/a2ui/catalog-function.ts
 D src/app/a2ui/custom-component.ts
 M src/app/capabilities/charts/days-until.fn.ts
 M src/app/capabilities/charts/gauge.schema.ts
 M src/app/capabilities/charts/index.ts
 M src/app/capabilities/charts/timeline.component.ts
 M src/app/capabilities/charts/timeline.schema.ts
 M src/app/capabilities/charts/vocabulary.ts
 M src/app/capabilities/maps/distance.fn.ts
 M src/app/capabilities/maps/index.ts
 M src/app/capabilities/maps/map.component.ts
 M src/app/capabilities/maps/map.schema.ts
 M src/app/capabilities/maps/vocabulary.ts
 D src/app/capabilities/shared/surface-action.ts
?? eval/model-context.spec.ts
?? shared/capabilities/action-schema.ts
?? shared/capabilities/agent-capability.ts
?? shared/capabilities/binding.ts
?? shared/capabilities/catalog-function.ts
?? shared/capabilities/custom-component.ts
?? shared/capabilities/surface-action.ts
```

### Sessions

- claude-code 20df59da-d664-47cc-a497-7f3023d934a5 (2026-09-15) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/20df59da-d664-47cc-a497-7f3023d934a5.jsonl
