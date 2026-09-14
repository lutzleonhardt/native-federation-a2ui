# refactor: One enumeration per capability — vocabulary split from pairing

### Task

Removed the second enumeration of the assistant vocabulary: each capability now names its
components and functions once in a framework-free `vocabulary.ts`, and both consumers — the
Angular pairing in `index.ts` and the model-facing serializer in `catalog-context.ts` — read that
one list. Drift between them is now a compile error instead of a test failure.

### Status

DONE — implementation complete, all checks green (see Test Evidence). Independent review not yet
performed; the change is not committed (`/commit` pending, see Context for Next Task for the
commit-split question).

### Root Cause

Not a bug — structural debt from Tasks 4/5. `catalog-context.ts` must stay importable under Node
(XC-04: shell and eval harness build `context[]` from the same serializer), but the pairing
expression in `capabilities/<area>/index.ts` did two jobs at once:

```ts
export const chartsFragment: CatalogFragment = {
  components: [
    createCustomComponent({ ...GAUGE_META, component: GaugeComponent }),   // pairing (Angular)
    createCustomComponent({ ...TIMELINE_META, component: TimelineComponent }),
  ],                                                                       // enumeration
  functions: [daysUntilFn],
};
```

The enumeration inherited the Angular taint of the pairing, so Node could not read it and
`catalog-context.ts` kept its own copy of the same list. The two lists were only *checked*
against each other by `catalog-context.spec.ts`; nothing prevented them from diverging, and
nothing at all forced a new `*_META` to get an Angular implementation.

### Files Modified

- `src/app/capabilities/charts/vocabulary.ts` (new) — the charts enumeration plus
  `ChartsComponentName`; imports only `*.schema.ts` / `*.fn.ts`, never a `*.component.ts`.
- `src/app/capabilities/maps/vocabulary.ts` (new) — same shape for maps (`Map`, `distanceFn`).
- `src/app/a2ui/custom-component.ts` (modified) — `CapabilityVocabulary<Names>`,
  `ComponentImplementations<Names>` and `toFragment(vocabulary, implementations)` next to
  `createCustomComponent`; the two type-only imports from `assistant-catalog.ts` are erased at
  runtime.
- `src/app/capabilities/charts/index.ts` (modified) — reduced to the pairing table
  (`ComponentImplementations<ChartsComponentName>`) plus `toFragment`.
- `src/app/capabilities/maps/index.ts` (modified) — same.
- `src/app/a2ui/catalog-context.ts` (modified) — `ASSISTANT_VOCABULARY` concatenates the two
  capability vocabularies instead of re-listing five imports.
- `src/app/a2ui/assistant-fragments.ts` (modified) — comment refreshed: the lists are no longer
  "twins" to be compared but one vocabulary with and without its Angular half.
- `docs/architecture.md` (modified) — new invariant "One enumeration per capability".

### Files Read (Context Only)

- `src/app/a2ui/assistant-catalog.ts` (`CatalogFragment`, `AssistantFunction`, `mergeFragments`),
  `src/app/a2ui/catalog-function.ts`, `src/app/a2ui/catalog-context.spec.ts` (the anti-drift pin),
  `src/app/capabilities/charts/gauge.schema.ts`, `src/app/capabilities/charts/days-until.fn.ts`,
  `src/app/capabilities/maps/map.schema.ts` (meta shape and the `satisfies ComponentMeta` idiom).
- `tsconfig.json` / `tsconfig.app.json` (no `noUncheckedIndexedAccess`, `isolatedModules`),
  `eslint.config.js` (no import-cycle rule), `package.json` (test/lint/build scripts).
- `handoff.md` (the parked fix lane), `docs/architecture.md` layer table and invariants section.

### Key Decisions

— session 2026-09-14

- **The name union is the coupling, not a hand-kept list.** The handoff left the choice between a
  written-out union (`'Gauge' | 'Timeline'`) and a derived indexed-access type. Both were
  rejected: a free-standing union couples nothing (a new `*_META` compiles silently), and
  `typeof v.components[number]['name']` needs `as const` on every meta to survive `ComponentMeta.name:
  string` — an indexed-access chain the repo's type guideline avoids in feature code. Instead the
  vocabulary is **keyed by name** and checked against the union from both sides:
  `Record<Names, ComponentMeta>` for the enumeration, `Record<Names, Type<unknown>>` for the
  implementations. Cost: the name appears twice in the literal (`Gauge: GAUGE_META`).
- **`toFragment` is non-generic at the boundary.** Its parameters are `Record<string, …>`;
  exhaustiveness is enforced where the two records are *declared*, not where they are passed.
  `Object.entries` over a generic `Record<Names, …>` widens the key back to `string`, so a generic
  signature would only buy casts inside the helper.
- **`toFragment` lives in `custom-component.ts`, next to `createCustomComponent`.** That adds
  `import type { AssistantFunction, CatalogFragment } from './assistant-catalog'` and with it a
  type-only import cycle — erased at runtime, invisible to ESLint. Placing it in
  `assistant-catalog.ts` would avoid the cycle but separate the two pairing helpers.
- **The meta's `name` stays authoritative; the record key only addresses the implementation.** A
  mismatched key (`Gauge: TIMELINE_META`) is not a compile error but produces duplicate announced
  names, which `catalog-context.spec.ts` rejects.
- **The anti-drift spec stays.** It no longer prevents the drift it was written for, but it pins
  the outcome the refactor claims (announced set == rendered set) and keeps covering the
  serializer itself.

### Review Focus

- **Behavior claims:** (1) the serialized model context is byte-identical to before the refactor,
  same order (`Gauge,Timeline,Map` / `daysUntil,distance`); (2) an announced component without an
  Angular implementation — or an implementation without an announcement — fails `tsc`;
  (3) `catalog-context.ts` still loads under Node, i.e. nothing Angular entered its import graph.
- **Plan deviations:** No plan (fix lane). The handoff's step 2 explicitly left the union decision
  open; the chosen third option is recorded under Key Decisions.
- **Assumptions / choices:** the name union is written out per capability (`ChartsComponentName`,
  `MapsComponentName`) — one line of manual upkeep, but guarded in both directions by the two
  `Record`s, so it cannot silently fall behind.
- **Scope notes:** `assistant-fragments.ts` carried a comment that the split made wrong (two lists
  to compare) — rewritten, no code change. `docs/architecture.md` gained the invariant; it had no
  canonical statement of this rule before.
- **Read next:**
  1. `src/app/capabilities/charts/vocabulary.ts` + `charts/index.ts` — the whole split in two
     short files; `maps/` is the same shape with one component.
  2. `src/app/a2ui/custom-component.ts` — `CapabilityVocabulary`, `ComponentImplementations`,
     `toFragment`: where the compile-time guarantee actually lives.
  3. `src/app/a2ui/catalog-context.ts:28-36` — the consumer side; check that only vocabulary
     modules are imported.

### Test Evidence

— session 2026-09-14

- **Payload identity (the central claim).** Before the refactor:
  `npx tsx -e "import {catalogToContextEntry} from './src/app/a2ui/catalog-context'; console.log(catalogToContextEntry().value)"`
  → 7940 bytes (7941 with `console.log`'s newline). After: `diff` against the baseline is empty —
  byte-identical, components `Gauge,Timeline,Map`, functions `daysUntil,distance`. (The handoff
  quoted 7936 bytes; the before/after pair measured in this session is what the check rests on.)
  The same probe run again after Lane 2 stayed identical.
- **Drift probe — removed again.** Two temporary edits, each reverted from a backup copy
  immediately after the check; `npx tsc -p tsconfig.app.json --noEmit` is back to 0 errors and the
  tree holds no probe leftovers:
  - implementation deleted → `TS2741: Property 'Timeline' is missing in type '{ Gauge: typeof
    GaugeComponent; }' but required in type 'ComponentImplementations<ChartsComponentName>'`
  - meta added without extending the union → `TS2353: Object literal may only specify known
    properties, and 'Sparkline' does not exist in type 'Record<ChartsComponentName,
    ComponentMeta<ZodTypeAny>>'`
- `npm test` — shell 103 passed (19 files), agent 25 passed, eval 16 passed.
- `npm run lint` — "All files pass linting". `npm run build` — succeeds (the two CommonJS bailout
  warnings from `@copilotkit/shared` and `@segment/analytics-node` are pre-existing).
- `npx tsc -p tsconfig.app.json --noEmit`, `-p tsconfig.spec.json`, `-p eval/tsconfig.json` — 0.
- No `npm run eval` — nothing model-facing changed (see payload identity).

### Open Issues

None.

### Context for Next Task

- **Two lanes share two files, which the commit split has to respect.** This working tree holds
  three fix lanes; `refactor-render-surface-validation` is disjoint, but this lane and
  `chore-agent-contract` overlap: `src/app/a2ui/catalog-context.ts` and `docs/architecture.md`
  carry changes from *both* lanes. Committing either lane with whole-file staging produces a
  commit that does not build (lane 1's `catalog-context.ts` imports `shared/agent-contract`;
  lane 2's imports `capabilities/*/vocabulary`). Two clean commits therefore need hunk-level
  staging for exactly those two files — otherwise both lanes belong in one commit.
- `toFragment(vocabulary, implementations)` and `CapabilityVocabulary<Names>` /
  `ComponentImplementations<Names>` are the interface a new capability implements: add
  `vocabulary.ts` with a name union, then the `IMPLEMENTATIONS` record in `index.ts`.
- M2 relevance: the vocabulary lives per capability precisely because charts and maps become
  Native Federation remotes — `vocabulary.ts` is the framework-free half that the shell keeps
  needing after the cut.

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
 src/app/a2ui/assistant-fragments.ts        |   6 +-   ←
 src/app/a2ui/catalog-context.ts            |  19 ++---  ← lanes 1 + 2
 src/app/a2ui/custom-component.ts           |  26 +++++++   ←
 src/app/agent/assistant-agent.token.ts     |   4 +-
 src/app/agent/me-context-entry.ts          |   3 +-
 src/app/agent/tools/render-surface.tool.ts | 111 +++++++++++
 src/app/capabilities/charts/index.ts       |  17 ++---   ←
 src/app/capabilities/maps/index.ts         |  12 ++--   ←
 src/app/chat/chat.page.spec.ts             |   3 +-
 src/app/chat/chat.page.ts                  |   2 +-
 19 files changed, 174 insertions(+), 95 deletions(-)

$ git status --short     # untracked, repo files only; sandbox dotfiles omitted
?? docs/work/m1-spike/task-log/chore-agent-contract.md
?? docs/work/m1-spike/task-log/refactor-render-surface-validation.md
?? docs/work/m1-spike/task-log/refactor-vocabulary-single-source.md
?? shared/
?? src/app/capabilities/charts/vocabulary.ts   ←
?? src/app/capabilities/maps/vocabulary.ts   ←
?? chat-page-preview.png   ← throwaway, stays uncommitted
?? handoff.md              ← the parked-lane brief, stays uncommitted
```

### Sessions

- claude-code e79c70b1-1868-4a83-953f-ca42891f4948 (2026-09-14) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/e79c70b1-1868-4a83-953f-ca42891f4948.jsonl
