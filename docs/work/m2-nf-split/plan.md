# Plan: ConferenceFinder — M2 NF-Split

Spec: `docs/spec.md` (v3.3, 2026-09-09) — §8 M2, §3.2–3.4, §3.8, §7, acceptance 4 and 5. Predecessor: `docs/work/m1-spike/plan.md` (M1 gate reached 2026-09-14: eval A1 5/5, A2 5/5, A3 4/5).
Scope: Milestone M2 only — the shell becomes a Native Federation dynamic host, `charts` and `maps` move into `projects/mfe-charts` (4201) and `projects/mfe-maps` (4202), the capability set is selectable at runtime, and the live moment runs (no maps → the answer names the gap; with maps and a reload → the map). Out of scope: the `reserve` handler, the MapLibre upgrade, replay/BYOK/hosting — all M3.
Reference implementation: `~/projects/FrankensteinMeetingRoom` — a working Angular 21.2 + NF v4 host by the same author. Its host shape is the template; its remotes (React/Svelte, own esbuild `build.mjs`, custom elements) are not — ours are Angular projects exposing a TypeScript module.

Decisions taken while planning; do not re-derive:

- **NF v4 line**: `@angular-architects/native-federation-v4@~21.2.11` plus `@softarc/native-federation-orchestrator@^4`, not the v3 package `@angular-architects/native-federation@21.2.6`. v4 runs on Angular 21.2 in the reference project, its `initFederation` hands a loader object into `bootstrapApplication`, and it adds no `postinstall` patch (the v3 one has been a no-op since NF 18.1).
- **The contract deviates from the spec §3.2 sketch.** That sketch types the vocabulary as `A2uiCustomCatalogComponent[]`, which binds it to Angular and makes it unreadable for the Node eval harness. The contract keeps M1's split instead: `{ name, vocabulary, components }`. `frontendTools` and `actionHandlers` are left out until a remote supplies one.
- **The URL is the single source of truth for the selection.** `?capabilities=charts,maps` is a whitelist against the manifest and can never add a remote the manifest does not carry. No localStorage: the selection stays visible, shareable and unit-testable.
- **The contract lives in `shared/capabilities/`**, next to the `agent-contract.ts` that already serves shell, agent and eval — not in a new `libs/` root as spec §3.7 sketches. `shared/` predates that sketch and has already solved cross-project resolution with plain relative imports plus one ESM marker; a second root would need a path alias that holds in four resolvers for no gain.
- **Remotes stay repo-portable.** A remote may depend on the contract folder and on published packages, on nothing else — it has to remain a thing that could move into its own repository on its own server tomorrow, because that is the claim the whole demo makes. The module boundaries in Task 6 are the executable form of that claim, not bookkeeping.
- **Boundaries bind production code.** A shell *spec* may import a remote's source as a fixture; shell production code may not.
- npm stays. The remotes are Angular CLI projects in the one workspace with one `node_modules`.
- **Amended 2026-09-21.** Task 9 was appended after a README brainstorm; Task 8 is unchanged and the tasks run in number order. The README rewrite and the history cleanup are not part of M2: they live in the scope `publication` (`docs/work/publication/plan.md`), which starts after the `visual-language` scope.

M1 conventions stay in force: zoneless, OnPush, signals-first, `inject()`, standalone, `templateUrl` with its own `.html`, RxJS only at the AG-UI boundary. Nothing reachable from a `vocabulary.ts` may import `@a2ui/angular` or `@angular/core` — the Node eval harness reads those files.

> The executing agent may adjust scope and ordering based on more
> up-to-date context discovered during implementation, as long as
> each task still satisfies the sizing rules above.
>
> When a task is finished (DONE or BLOCKED), close it with the
> `/wrap-up N` → `/commit N` pair. `/wrap-up N` writes or extends
> `docs/work/<scope>/task-log/task-{N}-{slug}.md`, where `<scope>`
> is derived from the current git branch, and is safe to run multiple
> times across sessions — it merges. `/commit N` reads that log,
> stages code + summary, and commits them together after showing
> the plan and waiting for confirmation. Optionally run `/review`
> (quick per-task, full before a PR, coverage for large diffs)
> between wrap-up and commit;
> a second `/wrap-up N` can absorb the review findings.

## Task 1: Extract the capability contract into `shared/capabilities`

### Instructions

Move everything a remote needs in order to describe a capability out of `src/app/` into a new
`shared/capabilities/` folder, beside the `agent-contract.ts` that already serves shell, agent and
eval, and add the one new type that names a capability as a whole:

```ts
/** What one team contributes: the model-facing vocabulary and the Angular components that implement it. */
export interface AgentCapability {
  readonly name: string;                                  // 'charts'
  readonly vocabulary: CapabilityVocabulary<string>;      // framework-free: names, descriptions, schemas, function impls
  readonly components: ComponentImplementations<string>;  // the Angular half
}
```

Moves (pure relocation, no behavior change): `ComponentMeta`, `CapabilityVocabulary`,
`ComponentImplementations`, `CustomComponent`, `createCustomComponent`, `toFragment` (from
`custom-component.ts`), `AssistantFunction` and `CatalogFragment` (from `assistant-catalog.ts`),
`createCatalogFunction`, `binding`, `actionSchema`, and `dispatchSurfaceAction`.

`mergeFragments` and `createAssistantCatalog` stay in the shell — they know `BasicCatalogBase` and
the basic-catalog name reservations, which is host business, not capability business.

Keep the Node rule per file, not per folder: `dispatchSurfaceAction` imports `@a2ui/angular` and is
therefore reachable only from an `index.ts`/component, never from a `vocabulary.ts`.

Import it the way `agent-contract.ts` is already imported: relative paths, no path alias. That
pattern is proven in all four resolvers that read this repo — the Angular application build, the
Angular unit-test runner, `tsx` for `npm run eval`, and plain Vitest — and `shared/package.json`
already marks the folder ESM for the Node side, which a subfolder inherits. `../../../shared/capabilities/…`
from a remote is noisy; an alias for both contracts at once stays possible later, as its own decision.

### Acceptance

- **T1-AC-01** — The eval harness still assembles the model context under Node: no Angular import
  reaches the vocabulary path during the move.

Otherwise mechanical: the existing shell, agent and eval suites are the safety net.

### Key Locations

- `src/app/a2ui/custom-component.ts`, `catalog-function.ts`, `binding.ts`, `action-schema.ts` — move.
- `src/app/a2ui/assistant-catalog.ts:9-17` (`AssistantFunction`, `CatalogFragment`) — move the two types out, keep `mergeFragments`/`createAssistantCatalog`.
- `src/app/capabilities/shared/surface-action.ts` — move (both remotes use it).
- `shared/package.json` — the existing ESM marker covers the new subfolder; no tsconfig change needed.
- Importers to rewrite: `src/app/capabilities/{charts,maps}/**`, `src/app/a2ui/catalog-context.ts:5-6`, `assistant-fragments.ts`, and the specs listed by `grep -rn "a2ui/custom-component\|a2ui/binding\|a2ui/catalog-function\|a2ui/action-schema" src`.

## Task 2: Compose catalog and model context from a runtime capability list

### Instructions

Today the vocabulary is hard-wired at two module scopes: `assistant-fragments.ts` imports both
capability folders for the renderer, and `catalog-context.ts` imports both `vocabulary.ts` files for
the model. Replace both with one list that arrives at bootstrap:

```ts
// app.config.ts — the capability list becomes an argument, not an import
export const appConfig = (capabilities: readonly AgentCapability[]): ApplicationConfig => ({
  providers: [
    provideA2uiCatalog(createAssistantCatalog(capabilities.map(toFragment))),
    { provide: AGENT_CAPABILITIES, useValue: capabilities },
    ...
  ],
});

// catalog-context.ts — takes the framework-free half only: the eval harness has to call this
// under Node, where an `AgentCapability` cannot be built (its `components` are Angular classes).
export function catalogToContextEntry(vocabularies: readonly CapabilityVocabulary<string>[]): Context
```

The shell passes `capabilities.map((c) => c.vocabulary)`; the eval harness imports the `vocabulary.ts`
files directly. That asymmetry is the point — it is what keeps XC-04 provable under Node.

`src/main.ts` passes the two local capabilities for now (`chartsCapability`, `mapsCapability`) — they
move out in Tasks 4 and 5, and this signature is what lets them. Delete `assistant-fragments.ts`.
The chat page reads `AGENT_CAPABILITIES` instead of calling the serializer with no arguments; the
eval harness passes its own list.

Keep the drift spec from M1 (`catalog-context.spec.ts`) and parameterize it: for any capability list,
announced vocabulary and rendered catalog name the same set.

### Acceptance

- **T2-AC-01** — Given a capability list that contains charts only, the vocabulary announced to the
  model contains neither `Map` nor `distance`, and a surface that uses `Map` is rejected by the
  render boundary. (XC-04)
- **T2-AC-02** — For any capability list, the set announced to the model and the set the renderer
  implements are identical.

### Key Locations

- `src/app/app.config.ts:14-21`, `src/main.ts:5` — config becomes a factory.
- `src/app/a2ui/catalog-context.ts:28-45` — `ASSISTANT_VOCABULARY` disappears into the parameter.
- `src/app/a2ui/assistant-fragments.ts` — delete.
- `src/app/chat/chat.page.ts:48-52` — context entry from the token.
- `eval/run-eval.ts:105` — explicit list.
- Specs: `src/app/a2ui/catalog-context.spec.ts:14,47`, `src/app/chat/chat.page.spec.ts:28`.

### Key Discoveries

- New token `AGENT_CAPABILITIES` is the only place the rest of the app learns what is loaded; the
  capability panel (Task 5) reads the same token.
- `createAssistantCatalog` already drops names the basic catalog owns and logs duplicates —
  capability order decides who wins, so keep the list order stable (manifest order).

## Task 3: Turn the shell into a Native Federation dynamic host

### Instructions

Install `@angular-architects/native-federation-v4@~21.2.11` and
`@softarc/native-federation-orchestrator@^4`, then run the schematic:

```
ng add @angular-architects/native-federation-v4 --project shell --type dynamic-host --port 4200
```

Expect it to rename the current `build`/`serve` targets to `esbuild`/`serve-original` and put the NF
builder in front of them, to add `es-module-shims` to `polyfills`, to generate `federation.config.mjs`
and `tsconfig.federation.json`, and to split `main.ts` into a two-phase bootstrap. It adds **no**
`postinstall` — our existing one (`playwright install chromium && npm --prefix agent install`) stays
untouched.

Then make the selection explicit. `initFederation` accepts a manifest *object*, so the whitelist is a
pure function and never touches NF internals:

```ts
// main.ts — resolve first, then federate, then bootstrap
const manifest = await fetch('federation.manifest.json').then((r) => r.json());
const nf = await initFederation(selectCapabilities(manifest, location.search), { ... });
const capabilities = await loadCapabilities(nf, Object.keys(selected)); // unreachable → log and skip
bootstrapApplication(App, appConfig([...capabilities, chartsCapability, mapsCapability]));
```

The manifest starts empty (`{}`) and the two local capabilities keep being passed in, so the app
behaves exactly as before; Tasks 4 and 5 move them from the second list into the first.

Add a `clean` script (`rm -rf dist .angular/cache node_modules/.cache/native-federation`); it is
the remedy when switching between `ng build` and `ng serve` boots from a poisoned NF artifact
cache and crashes with `ngDevMode is not defined`. Do not pre-set `ngDevMode` in `main.ts` as the
reference project does: the shared dev chunk of `@angular/core` reads that global, so a
`??= false` guard switches Angular's dev mode off in every dev session (decided in Task 4).

**Measure the build hang before working around it.** Run `ng build` once, unwrapped, and watch
whether the process exits after the artifacts are written. Only if it hangs, add the watchdog from
the reference project (`scripts/ng-build.mjs`: run `ng build` in its own process group, poll for
`dist/shell/browser/index.html`, kill the group and exit 0 once it appears, propagate a real compile
failure, 5-minute ceiling). Record the measurement in the task log either way.

### Acceptance

- **T3-AC-01** — `npm run build` terminates on its own within normal build time, and still exits
  non-zero when the code has a compile error.
- **T3-AC-02** — A manifest entry that cannot be reached does not stop the app: it starts, logs the
  skipped remote, and runs with the remaining vocabulary.
- **T3-AC-03** — The query parameter only narrows: a name that is not in the manifest is ignored, an
  empty selection leaves the basic catalog alone, and no parameter means every manifest entry.

### Key Locations

- `src/main.ts`, new `src/bootstrap.ts` — two-phase bootstrap.
- New `src/app/federation/select-capabilities.ts` (+ spec) and `load-capabilities.ts`.
- New `federation.config.mjs`, `tsconfig.federation.json`, `public/federation.manifest.json`.
- `angular.json` (shell architect), `package.json` (scripts), `tsconfig.app.json`.

### Key Discoveries

- `initFederation(remotesOrManifestUrl: string | FederationManifest, options?)` — the object overload
  is what makes the whitelist pure; the reference host passes a URL because it has no switch.
- Reference files worth reading before starting: `packages/shell/src/main.ts`,
  `packages/shell/angular.json`, `packages/shell/federation.config.mjs`,
  `docs/build-modes.md` in `~/projects/FrankensteinMeetingRoom`.
- The hang is an Angular-side defect, fixed by angular-cli PR #33715 (merged 2026-07-31 into `main`
  and `22.1.x`, **not** backported to the 21.2 LTS line): 22.1.x disposes the build result before
  yielding it to the consumer, 21.2.x only in the generator's `finally`. NF's post-step keeps the
  generator suspended, so worker handles stay open. Angular 22 is not an option here — there is no
  22.x build of `native-federation-v4` (`latest` is 21.2.11).
- `@angular/build:unit-test` may resolve its build target to the now NF-wrapped `build`. If the test
  run breaks, point it at `shell:esbuild:development` explicitly.

## Task 4: Move charts into the `mfe-charts` remote

### Instructions

Create `projects/mfe-charts` as an Angular application, initialize it as an NF remote on port 4201,
and move the charts capability into it: `gauge.component.*`, `timeline.component.*`, their schemas
and specs, `days-until.fn.*`, and `vocabulary.ts`. The former `index.ts` becomes the exposed module:

```js
// projects/mfe-charts/federation.config.mjs
exposes: { './capabilities': './projects/mfe-charts/src/capabilities.ts' }
```

```ts
// projects/mfe-charts/src/capabilities.ts — the pairing, and the only thing the shell imports at runtime
export const chartsCapability: AgentCapability = {
  name: 'charts',
  vocabulary: chartsVocabulary,
  components: { Gauge: GaugeComponent, Timeline: TimelineComponent },
};
```

Share the runtime singletons in `federation.config.mjs` — `@angular/*` (with
`includeSecondaries: { keepAll: true }` on `@angular/core`), `@a2ui/angular`, `@a2ui/web_core`,
`@copilotkit/angular`, `@ag-ui/core`, `@ag-ui/client`, `zod` including `zod/v3`, and `rxjs` — each
`singleton: true, strictVersion: true`. Add the remote to `public/federation.manifest.json`, add
`start:charts` and fold it into `start`, and give the project its own `test` and `lint` targets.
Remove the local charts import from `src/main.ts`.

The shell's own specs may keep importing the charts sources directly as fixtures; the boundary this
task establishes is about the shipped bundle.

**Give the remote its own face.** A remote is a complete Angular application, so let it run alone on
`localhost:4201`: a small root page that provides the A2UI renderer with its own vocabulary and
renders a hand-built surface. It needs no shell helper — `provideA2Ui` with
`new BasicCatalogBase({ id, extraComponents })` and a logging action handler is the whole host, and
writing those five lines here proves the remote works with *any* host, not only ours.

Feed that page sample data that has nothing to do with conferences — releases, festivals, whatever
has a date. The vocabulary is domain-neutral by design (spec §1: a timeline shows anything with a
date), and its own page is the place that shows it rather than claims it. The data stays literal and
local: the remote must not reach into `src/app/domain/**`.

**See it, do not infer it.** `/playground` builds its surface from component *names* and imports
nothing from a capability folder, so it keeps working across the move and is the cheapest visual
proof — no model call involved. Walk it once and write the result into the task log:

1. `npm start`, open `/playground`: Timeline and Gauge still draw, and their chunk is served from
   `localhost:4201` (network tab), not out of the shell bundle.
2. Stop the charts dev server, reload: the shell starts, logs the skipped remote, renders everything
   else, and only Timeline and Gauge are missing. This is the step a monolith cannot pass.
3. `?capabilities=` (empty) has the same effect deliberately, while maps — still local at this
   point, and therefore not in the manifest — stays untouched.

### Acceptance

- **T4-AC-01** — With charts served from the remote, a surface that uses `Gauge` and `daysUntil`
  renders in the shell and its props validate — one zod instance across the boundary, no duplicate
  registration. (XC-03)
- **T4-AC-02** — Taking the remote out of the manifest takes `Gauge`, `Timeline` and `daysUntil` out
  of the vocabulary announced to the model, and the shell still starts.
- **T4-AC-03** — `localhost:4201` renders the charts vocabulary on its own, with the shell not
  running, over data that is not conference data.
- **T4-AC-04** — The move changes nothing the model sees: for the full capability set, the serialized
  vocabulary is identical before and after. (A description edited in passing would otherwise change
  model behaviour without anyone noticing until the next eval run.)

### Key Locations

- New `projects/mfe-charts/**` (application + `federation.config.mjs` + `capabilities.ts` + the standalone page).
- Moved from `src/app/capabilities/charts/**` (7 sources + 4 specs).
- `angular.json` (new project targets), `package.json` (scripts), `public/federation.manifest.json`, `src/main.ts`.
- `eval/run-eval.ts` — one import line: the charts vocabulary now comes from the remote's source.

### Key Discoveries

- The vocabulary/pairing split from M1 is what makes this move cheap: `vocabulary.ts` stays
  framework-free and is imported by the Node eval harness *from the remote's source*, not through
  federation; only `capabilities.ts` crosses the wire.
- Zod is the known duplication risk (spec §10). Two copies show up as a schema that refuses a value
  the other copy produced — assert on a real prop validation, not on `instanceof`.

## Task 5: Capability panel — show the loaded remotes and switch them

### Instructions

Add a panel to the chat page that makes the federation visible and switchable — the spec calls it a
demo component, and it is what turns the live moment into a click instead of a file edit. For every
manifest entry show one of three states, because a remote that failed to load must not look like one
that was switched off:

- selected and loaded — with the components and functions it contributed,
- selected but unreachable,
- not selected.

A toggle writes the new selection into the URL and lets the browser reload; there is no in-app
state for it:

```ts
protected toggle(name: string): void {
  location.search = toQuery(this.selection().toggled(name)); // reload is the binding model (spec §3.3)
}
```

At this point the manifest holds one entry, charts; maps arrives in the next task and must need no
change here. That is the panel's own test — it renders the manifest, not a hard-coded pair — and it
is why it ships now: the maps move is verified by clicking, including the "selected but unreachable"
state when its dev server is down.

The remote's origin for the loaded case comes from the orchestrator
(`nf.adapters.remoteInfoRepo.tryGet(name).get().scopeUrl`), so the panel can show where a capability
actually came from.

### Acceptance

- **T5-AC-01** — The panel lists every manifest remote in exactly one of the three states, and for a
  loaded one it names the components and functions that remote contributed.
- **T5-AC-02** — Toggling a capability reloads the app with the new selection, and the selection is
  readable in the URL, so the before/after of the live moment can be shared as two links.

### Key Locations

- New `src/app/chat/capability-panel.component.{ts,html}` (+ spec).
- `src/app/chat/chat.page.{ts,html}` — placement next to the location picker.
- `src/app/federation/select-capabilities.ts` — the query writer belongs next to the reader.
- `src/app/app.config.ts` — the loader result has to reach the panel (states, not just vocabulary).

## Task 6: Move maps into the `mfe-maps` remote and enforce the boundaries

### Instructions

Repeat Task 4 for maps on port 4202: `map.component.*`, `map.schema.ts`, `geo.ts`, `distance.fn.*`
and `vocabulary.ts` move into `projects/mfe-maps`, `capabilities.ts` exposes `mapsCapability`,
manifest entry, `start:maps`, own `test`/`lint` targets. After this the shell owns no vocabulary of
its own — `src/app/capabilities/` is gone.

Then lock the module graph in with Sheriff (`@softarc/sheriff-core`, as in the book repo) or an
equivalent lint rule, with three rules:

- the shell's production code imports nothing from `projects/mfe-*`,
- a remote imports only `shared/capabilities` and framework packages — never `src/app/domain/**`,
  `src/app/agent/**` or `shared/agent-contract.ts` (agent id, port and route are host business; the
  domain rule is M1's XC-05, until now only a convention),
- `shared/capabilities` imports nothing from either side.

Spec files are exempt.

**Give the remote its own face**, as in Task 4: `localhost:4202` renders the maps vocabulary alone,
over points that are not conferences — anything with coordinates.

**See it, do not infer it.** Same walk as in Task 4, now with both remotes — plus the one that
matters: open the chat with `?capabilities=charts` and ask request 2 ("Zeig sie auf einer Karte").
The answer has to name the missing capability instead of drawing a map; with the parameter removed
and a reload, the map is back. That is the live moment, demonstrated by hand before Task 7 automates
the same judgement.

### Acceptance

- **T6-AC-01** — `localhost:4202` renders the maps vocabulary on its own, with the shell not running,
  over data that is not conference data.
- **T6-AC-02** — Without maps in the selection the shell announces no `Map` and no `distance` and
  renders every other surface unchanged; with maps selected and a reload, both are back. (XC-01)
- **T6-AC-03** — A production import that crosses one of the three boundaries fails the check with a
  message naming the rule.

### Key Locations

- New `projects/mfe-maps/**`; moved from `src/app/capabilities/maps/**` (6 sources + 3 specs).
- `eval/run-eval.ts` — the maps vocabulary now comes from the remote's source; T4-AC-04's before/after check applies here too.
- New `sheriff.config.ts` (or the equivalent lint config), `eslint.config.js`.
- `angular.json`, `package.json`, `public/federation.manifest.json`, `src/main.ts`.

## Task 7: Eval — capability sets and the missing-vocabulary case

### Instructions

Make the capability set an input of the harness (`EVAL_CAPABILITIES=charts,maps`, default both),
built from the remotes' framework-free `vocabulary.ts` files, and add the scenario that guards the
before-half of the live moment (spec §7, last row): request 2 with charts only.

This task only adds. A1, A2 and A3 keep their prompts, their scoring and their gate — they are the
M1 result and the regression net for everything M2 moved; with the default set the run must produce
the same verdicts as before.

The scored answer must not contain a `Map` or any other component outside the announced vocabulary,
and must name the missing capability. Two harness changes make that measurable:

- record `messageWidget` calls too — today only `renderSurface` calls reach the scorer, so an honest
  refusal is invisible to it,
- both tools end the turn, so the model has to emit them in one assistant message if it wants to
  both explain and render; accept that shape.

Same gate as the other requests: ≥ 4 of 5.

The prompt is a known cause, not a suspicion (observed in Task 5, 2026-09-18): with charts switched
off the shell announced only `Map` and `distance`, yet the model answered request 2 with a `Timeline`
— it followed the hard-coded request-2 example in `FORMAT_RULES` (`agent/src/prompt.ts`), which
shows `Timeline`; the request-3 example ships `Map`, `Gauge`, `daysUntil` and `distance` the same
way, and both stand ~70 lines above the "use only components listed below" rule. Rewrite both
examples with basic-catalog components only (`Text`, `Column`, `Row`, `Button`) and let the catalog
descriptions carry the custom components; generate examples from the announced vocabulary only if
the default-set verdicts drop. Changing the prompt text is allowed — acceptance 4 requires that
switching a remote needs no change in `agent/` *at runtime*, not that the prompt is frozen. The
mirror case (maps only, request 2 without a `Timeline`) is not scored; it is the same defect.

### Acceptance

- **T7-AC-01** — The harness runs a named capability set end to end and announces exactly that set's
  vocabulary to the model. (XC-04)
- **T7-AC-02** — With charts only, request 2 is answered without a `Map`, without any component
  outside the announced vocabulary, and the answer names what is missing — in at least 4 of 5 runs.
  (XC-01)

### Key Locations

- `eval/run-eval.ts:38-45` (requests), `:61-65` (tool specs), `:105` (context), `:246-255` (recorder).
- `eval/score.ts:22` (`Requirement`), `:66-78` (dispatch), `:86-98` (`mapFailures`) — plus `eval/score.spec.ts`.
- `agent/src/prompt.ts` (`FORMAT_RULES`, both examples; the vocabulary rule in `WIRING_RULES`).
- `projects/mfe-charts/src/vocabulary.ts`, `projects/mfe-maps/src/vocabulary.ts` — read under Node.

### Key Discoveries

- Recordings for the M3 replay mode are keyed by (conversation path × capability set) — the set is
  part of the prompt context, so a recording made with maps is invalid without it. Nothing to build
  here; it is why this task's scenario shape matters later.

## Task 8: Refresh the architecture doc and write the high-level tour

### Instructions

Two documents, two altitudes, one goal: the docs tell the M2 truth.

`docs/architecture.md` is the precise one, written for whoever changes the code next. All three of
its mermaid diagrams and its ownership table still describe a monolith. Refresh *Big picture* (shell,
two remotes, the contract, manifest → selection → loader), *One AG-UI run* (the vocabulary section of
the prompt is assembled from whatever capabilities loaded, so the same run differs per capability
set), and the layers/ownership table; extend *Invariants worth knowing* with the three module
boundaries, the repo-portability rule and the whitelist rule; move *Roadmap context* on to M3. The
README's status section still says "monolith spike" — it moves with it.

Then write the tour, a new `docs/how-it-works.md` linked from the README: the piece that could be
published as-is and explains the mental model rather than the file list.

- A capability has two halves, and they travel to two different consumers.
- The **vocabulary** — names, descriptions, prop schemas — is serialized into the AG-UI context and
  lands in the agent's system prompt. That is how the model learns which A2UI components exist and
  what their props mean; it never sees an Angular class.
- The **implementation** — the Angular components — is registered in the A2UI catalog. That is how
  the renderer turns the model's message list into UI; it never sees a description.
- Both halves ship in the same remote, so adding a remote extends in one step what the model can
  *say* and what the browser can *draw* — which is the whole claim.
- The monorepo here is a simplification. In a real setup the remotes live in other repositories, on
  other servers, maintained by other teams, and the contract is a published, versioned package;
  shared singletons are then negotiated at load time instead of guaranteed by one `node_modules`.

Write each invariant once. The tour explains the idea and links into `architecture.md` for the
mechanism; `architecture.md` stays the canonical place for the invariants. The monorepo paragraph is
written here and condensed — not repeated — by the M3 README and post.

### Acceptance

- **T8-AC-01** — Every diagram and every ownership row in `docs/architecture.md` names only modules
  that exist after Task 7, and each capability appears with both of its halves and their consumer.
- **T8-AC-02** — The tour reads standalone: following its argument requires opening no file it names.

### Key Locations

- `docs/architecture.md:39-75` (Big picture), `:79-94` (One AG-UI run), `:104-127` (renderSurface
  round trip), `:143-172` (Layers and ownership), `:173-234` (Invariants), `:235-248` (Roadmap).
- New `docs/how-it-works.md`; `README.md:11-19` (Status, and the link to the tour).

### Key Discoveries

- The register already carries the M3 README entry for the monorepo point; this task is where the
  argument is written, so the M3 task links instead of re-deriving it.

## Task 9: Switch the running demo to English

### Instructions

The repository goes public with an English README, so everything the demo shows or sends becomes
English — without i18n: strings are replaced, no translation layer is added.

- The example prompts and the eval's demo requests. They stay the same sentences in both places.
- The conference data and the city list: English city names (Munich, Cologne, Zurich, Brussels,
  Nuremberg), the conference names built from them, and the ids and `url` slugs that carry the German
  spelling.
- Vocabulary the model reads: the `Gauge` description quotes a German label ("Restkarten").
- The scorer's keyword for `A2-without-maps` (`/karte|map/i`): the model answers in the language of
  the request, so English requests yield English texts.
- German fixtures and labels in specs, the playground and `agent/requests.http`.

`docs/` is out of scope — the spec and the early task logs stay German.

Then run the model-behavior gate once, on the final strings, and record the figures in the task log.
It comes last in this task because the requests and one component description change what the model
reads: the figures of 2026-09-18 no longer describe the repository, and the README quotes the new
ones. Update the figures wherever the docs cite them.

### Acceptance

- **T9-AC-01** — No German word is left outside `docs/`: no prompt, data value, vocabulary
  description, label or fixture. Proper names without an English form keep their spelling.
- **T9-AC-02** — Shell and eval harness send the same demo requests, word for word.
- **T9-AC-03** — A full eval run on the English strings reaches the gate for both capability sets;
  the figures and the `messageWidget` texts of the charts-only set are in the task log. Contributes
  to XC-01.

### Quick functional check

Start everything, deselect maps, send the first two example prompts: the second answer names the
missing map in English.

### Key Locations

- `src/app/chat/example-prompts.ts`, `src/app/chat/chat.page.spec.ts:23-26`,
  `eval/scenarios.ts:20-23`, `eval/score.ts:56` (`MAP_WORD`), `eval/score.spec.ts`.
- `src/app/domain/conferences.json`, `src/app/domain/cities.ts`,
  `src/app/domain/{geo,location.store}.spec.ts`.
- `projects/mfe-charts/src/charts/gauge.schema.ts:15` and the specs asserting "Restkarten"
  (`gauge.component.spec.ts`, `src/app/a2ui/{catalog-context,renderer-integration}.spec.ts`),
  `src/app/playground/playground.ts:61`.
- `projects/mfe-maps/src/app/app.ts`, `projects/mfe-maps/src/maps/{geo.ts,map.component.spec.ts,distance.fn.spec.ts}`.
- `src/app/playground/tool-playground.{ts,html}`,
  `src/app/agent/tools/{render-surface.tool,message-widget.component}.spec.ts`,
  `agent/requests.http:18`.
- `README.md` (eval section), `docs/architecture.md` (gate figures).

### Key Discoveries

- About 20 files, all mechanical string changes — above the usual size, but one goal and one commit.
- The eval spends real API credit: 25 requests per full run, about five minutes; `EVAL_RUNS=1` is the
  smoke run. The agent has to run outside the sandbox; check outside the sandbox whether the user
  already has one listening on 3001.
- The gate is 4 of 5 per request. A3 sat at 4/5 without slack in both default-set runs of Task 7, so
  a 3/5 after the switch is as likely noise as a regression — run again before touching the prompt.
- Optional, settled at task start: an off-topic scenario ("write me a Python function" → a refusal
  via `messageWidget`). If wanted, it goes in before the paid run so that one run covers it.

## Cross-Cutting Acceptance

- **XC-01** — The live moment: with maps in the selection request 2 produces a map; without it the
  answer names the gap and builds no dead controls; nothing in `agent/` changes between the two.
  **Touches:** T3, T5, T6, T7, T9.
- **XC-02** — The shell's production code imports nothing from a remote project, and a remote imports
  only the capability contract and framework packages. **Touches:** T1, T4, T6.
- **XC-03** — One zod and one Angular across the remote boundary: a component whose schema was
  defined in a remote validates inside the shell's renderer at runtime. **Touches:** T3, T4, T6.
- **XC-04** — Shell and eval harness announce the same vocabulary for the same capability set.
  **Touches:** T2, T4, T6, T7.
