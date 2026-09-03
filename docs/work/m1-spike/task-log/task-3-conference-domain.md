# Task 3: Conference data set, dayOffset loader, location store, and `findConferences` logic

### Task

Built the pure domain layer under `src/app/domain/`: a fictional 30-conference data set, the
`dayOffset` loader that derives dates at load time, haversine distance, the fallback city list, the
pure `findConferences` filter/group logic with its zod-4 argument contract, and the signal-based
`LocationStore`.

### Status

DONE — `npm test` (shell 23, agent 14), `lint` and `build` each exit 0. All seven acceptance
criteria `passed`. Six mutation probes confirmed every AC test actually fails when the behaviour it
guards breaks. Two plan deviations are recorded below; one of them was amended in `plan.md` itself.
A Codex review then surfaced one real defect (radius filtered on the *rounded* distance), one race
(`init()` unguarded against repeated calls and a late geolocation callback) and one factual error in
the spec addition (`Slider` already ships in the basic catalog); the CodeScene gate flagged one
complex conditional. All four are fixed, each code fix verified by a reverting probe; the shell
suite grew from 20 to 23 tests.

### Files Modified

- `src/app/domain/conferences.json` (new) — 30 fictional conferences, ordered by `dayOffset` 3…296.
  9 angular / 7 dotnet / 6 web / 4 ai / 4 cloud, real European cities with real coordinates,
  `url = /conf-sites/<id>.html`. No `date` column — dates are derived, never stored.
- `src/app/domain/conference.ts` (new) — `ConferenceTopic`, `ConferenceRecord`, `Conference`,
  `CONFERENCE_RECORDS`, `isoDatePlusDays(today, days)`, `loadConferences(today)`.
- `src/app/domain/geo.ts` (new) — `GeoPoint`, `haversineKm(a, b)`.
- `src/app/domain/cities.ts` (new) — `City`, `CITIES` (10 fallback cities), `findCity`, `nearestCity`.
- `src/app/domain/find-conferences.schema.ts` (new) — `conferenceTopicSchema`,
  `findConferencesArgsSchema` (zod 4, `.describe()` on every field), `FindConferencesArgs`.
  Framework-free; no Angular import.
- `src/app/domain/find-conferences.ts` (new) — `findConferences(args, ctx)` plus `ConferenceResult`,
  `GroupRow`, `FindConferencesContext`, `FindConferencesResult`. After the review: an internal
  `Candidate` carries the **exact** distance, `nearKm` is decided on it (`withinRadius`, extracted
  for the CodeScene finding) and only `toResult` rounds; `matchesFilters` and `countBy` keep the
  orchestrating function at one abstraction level.
- `src/app/domain/location.store.ts` (new) — `Me`, `LocationStore` (`providedIn: 'root'`, signal
  state, `me`, `init()`, `setCity(id)`). After the review: an `asked` flag makes `init()` ask at
  most once, and `snapTo` ignores a late geolocation callback once a city is known.
- `src/app/domain/conference.spec.ts` (new) — T3-AC-01, T3-AC-06 plus two data-coverage tests.
- `src/app/domain/geo.spec.ts` (new) — T3-AC-02 plus symmetry/zero.
- `src/app/domain/find-conferences.spec.ts` (new) — T3-AC-03/04/05, 8 tests; the synthetic
  300.4 km boundary case was added after the review.
- `src/app/domain/location.store.spec.ts` (new) — T3-AC-07 plus persistence, unknown-id, and (after
  the review) init-idempotence and the pending-prompt race.
- `.gitignore` (modified) — added `.vitest-attachments/`. Vitest Browser Mode writes failure
  screenshots there; `__screenshots__/` was already ignored, this sibling directory was not and would
  have been picked up by a `git add -A`.
- `docs/work/m1-spike/plan.md` (modified) — Task 3 block amended: `meToContextValue` removed,
  the persisted-city-wins rule made explicit (see Key Decisions).
- `docs/spec.md` (modified) — demo request 7, a third live moment, milestone M3+, and a new
  "Fehlendes Vokabular" row in the test table. Discussion outcome, not required by this task.
  Corrected after the review: `Slider` already ships in the basic catalog, so `mfe-filter` delivers
  **only** the catalog function `withinKm` — pure behaviour, the smallest remote of the demo — and
  the §7 eval case is marked as a prerequisite for that live moment.
- `docs/book-learnings.md` (modified) — new section 10 on earth-surface distances, marked
  explicitly as an own note rather than a book learning.

Created and removed again during the task (see Test Evidence): `agent/src/nodeimport.probe.spec.ts`,
a tsx probe under `$TMPDIR`, `src/app/domain/__screenshots__/`, `.vitest-attachments/`.

### Files Read (Context Only)

- `docs/work/m1-spike/plan.md` — preamble + Task 3 block.
- `docs/work/m1-spike/task-log/task-2-agent-server.md` — predecessor; supplied the sandbox
  device-node warning and the plan-deviation reporting pattern.
- `docs/work/m1-spike/task-log/task-1-workspace-scaffold.md` — Task 3 depends on Task 1; supplied
  the browser-mode test chain (no Node target in the shell) and the lint rule set.
- `docs/book-learnings.md` §3.3, §3.4, §3.5, §4.2, §4.5, §4.6, §5, §7 — for the A2UI transport and
  snapshot discussion.
- `docs/spec.md` §2, §6, §7, §8 — demo requests, prompt principles, tests, milestones.
- `node_modules/@a2ui/web_core/src/v0_9/catalog/types.d.ts`, `schema/common-types.d.ts`,
  `basic_catalog/functions/basic_functions.d.ts` — catalog/function model, `functionCall` binding
  shape, the 25 basic functions.
- `node_modules/@ag-ui/core/dist/index.d.ts` — `ContextSchema`.
- `node_modules/@a2ui/angular/fesm2022/a2ui-angular-src-v0_9.mjs` —
  `DEFAULT_COMPONENT_IMPLEMENTATIONS`; verified the Codex claim that `slider` is already registered
  (18 basic components in total).

### Key Decisions

— session 2026-09-03

- **Data set stays fictional, and the reason is `dayOffset`.** Because dates are derived from
  `today + dayOffset` at load time, they are necessarily invented; attaching invented dates to real
  conference names would be misinformation. Real conferences with real dates were weighed and
  rejected: they would age out, which is exactly what `dayOffset` exists to prevent, and would rot
  the M4 replay recordings. Authenticity is bought where it costs nothing — real cities, real
  coordinates, realistic prices and capacities.
- **Three names renamed after a collision check.** `ai-foundry` → `ai-loft` (Azure AI Foundry is a
  Microsoft product), `ai-meridian` → `ai-atlas` (Meridian AI is a real company), `dotnet-anvil` →
  `dotnet-kiln` (an existing .NET library on GitHub). None of the 30 collides with a real
  conference. Deliberately-invented names beat near-misses of real brands: a near-miss reads like a
  misremembered real event.
- **Date arithmetic goes through `Date.UTC` on the local calendar components of `today`.** `today`
  is a local-calendar concept (the app passes `new Date()`), but formatting a local midnight with
  `toISOString` shifts the day in any non-UTC zone. Taking the local Y/M/D, treating it as UTC and
  adding days keeps the result free of both timezone and DST drift.
- **`groupBy` runs on the final result, after `limit`.** T3-AC-05 requires the rows to sum to
  `confs.length`, which is only achievable this way. Guarded by its own test.
- **`nearKm` without a known location is a no-op, not an exclusion.** The model may ask for "near
  me" before the user has picked a city; treating that as "no hits" would report an empty result for
  a question the data can answer. The reason sits as a comment on `matchesFilters`.
- **JSON typed by an asserted cast, not by runtime validation.** JSON literals widen to `string`, so
  the topic union cannot survive the import. A production zod schema over the data would run on
  every app start for a file that ships with the bundle. Instead the cast is backed by the AC-06
  spec, which validates the file against the same shape — the comment at `CONFERENCE_RECORDS` says
  so, which is what makes it a checked claim rather than an assumed one.
- **`ConferenceTopic` written as an explicit union, not derived from a const array.** The repo
  guideline prefers named unions and modest duplication over indexed-access chains for small closed
  sets. The runtime counterpart lives once, as `conferenceTopicSchema`, and the data spec validates
  against it — so a divergence between the two shows up as a failing test rather than as a silent
  type hole.
- **`distanceKm` lives on `ConferenceResult`, not on `Conference`.** `loadConferences` never produces
  a distance; putting an optional `distanceKm` on `Conference` would make the loader's return type
  lie about what it can contain.
- **A persisted city wins over geolocation.** The plan only said "the chosen city persists"; without
  this rule a returning user would be prompted on every reload. Recorded here because it is the one
  genuine interpretation gap in the task text, and it is now also stated in `plan.md`.
- **`setCity` throws on an unknown id** rather than silently doing nothing. The picker only offers
  ids from `CITIES`, so an unknown one is a programming error — same reasoning as the unknown
  `AGENT_PROVIDER` in Task 2.
- **The pure function does not validate its arguments; the tool boundary does.** Validation belongs
  where untrusted input enters (Task 6), so there is exactly one such place, and unit tests and the
  eval harness can call `findConferences` directly without paying for it. Both sides carry a short
  comment: the rationale on the schema, a one-line pointer on the function.
- **`z.infer` for `FindConferencesArgs`** — a deliberate deviation from the "prefer explicit named
  types" guideline. A hand-written interface next to the schema would be two sources of truth, and a
  divergence between a validator and its type is invisible precisely where it matters.
- **Plan deviation: `meToContextValue` and `MeContextValue` dropped.** The plan asked for a
  projection to `{ city, lat, lon }`. Two findings killed it: the produced type was structurally
  identical to `Me`, so the projection was an identity function; and an AG-UI `Context` is
  `{ description: string, value: string }`, so the real conversion is a *serialisation* whose
  `description` text is prompt design. Writing it now would mean guessing at prompt format. It
  belongs where the context is assembled, named `meToContextEntry(me): Context` to match
  `catalogToContextEntry`. `plan.md` was amended accordingly at the user's request.

— session 2026-09-03 (after Codex review + CodeScene gate)

- **Radius decided on the exact distance; only the emitted value is rounded.** The original code
  rounded in the mapping step, so a conference at 300.4 km got `distanceKm: 300` and wrongly passed
  `nearKm: 300`. An internal `Candidate { conf, distanceKm }` now carries the exact haversine value
  through filtering; `toResult` rounds at the end. The invariant sits as a comment on `Candidate`.
- **`init()` asks at most once, and a manual choice survives the pending prompt.** Two distinct
  windows, two guards: the `asked` flag stops a second `getCurrentPosition` while the permission
  prompt is still open (before, `location()` was still `undefined` then, so the old guard did not
  hold); the check in `snapTo` drops a late success callback once a city is known — the prompt can
  stay open for minutes, and the user may pick a city meanwhile. Accepted cost: after a denial we
  never re-ask even if browser permissions change later; the plan says "asks once" and `setCity` is
  the escape hatch. No re-call of `init()` is ever needed — the browser fires the original callback
  whenever the user answers.
- **`withinRadius` extracted from the three-conjunct radius condition** (CodeScene: complex
  conditional, the only Topf-A finding; scores 9.68–10.0 otherwise). Not just appeasement: the
  middle conjunct is the deliberate ignore-without-location semantics, and the comment now sits on
  the exact line embodying it instead of floating above a compound expression.
- **Spec claim corrected: the demo's missing piece is a function, not a component.** Codex was
  right that `slider` is already in `DEFAULT_COMPONENT_IMPLEMENTATIONS`; sharper still, **none** of
  the 25 basic functions transforms arrays. `mfe-filter` therefore ships only `withinKm`, which
  makes the live moment stronger (the same slider is dead before and live after) and makes the §7
  "Fehlendes Vokabular" eval case a prerequisite rather than a nice-to-have — an *available* slider
  actively invites the model to build an inert one.
- **Methodological lesson recorded deliberately:** the six own mutation probes missed the rounding
  bug because they only mutated the code, never the data's relationship to the boundary. The
  74 km gap the first session praised as "robust" (281 inside vs 355 outside) is exactly what hid
  the defect — robust test data and revealing test data are not the same thing. The fix's test uses
  a synthetic boundary point instead of the shipped data set.

- **Behavior claims:**
  1. `loadConferences(today)` derives every `date` as `today + dayOffset` and never mutates the
     imported JSON — so the demo does not age and replay recordings stay valid.
  2. `findConferences` filters by topic, date cutoff and radius, sorts by date, limits, and groups
     the *limited* result into `{ label, value }` rows that sum to `confs.length`. The radius is
     decided on the **exact** distance (300.4 km fails `nearKm: 300`); the emitted `distanceKm` is
     the rounded integer and present only when the location is known.
  3. `LocationStore` asks for geolocation at most once regardless of how often `init()` runs, a
     city picked while the permission prompt is open survives the late callback, `me` stays
     `undefined` on denial until `setCity`, and a persisted city never re-prompts.
- **Assumptions / choices:** Four spec gaps were closed by decision, all listed above: grouping runs
  after `limit`; `nearKm` without a location is ignored; a persisted city beats geolocation; and
  `dayOffset: 42` had to exist in the data for T3-AC-01 to be readable literally (the entry is
  `ai-atlas Zürich`). Plus the `meToContextValue` deviation.
- **Scope notes:** Beyond the task surface: `.gitignore` gained `.vitest-attachments/` (a real gap —
  those files are not ignored and would be committed by `git add -A`); `plan.md` was amended for the
  dropped projection; `docs/spec.md` and `docs/book-learnings.md` grew sections from the design
  discussion that followed the implementation. Deliberately **not** done: no runtime validation in
  the domain layer, no `Slider`/filter-function work (recorded as spec request 7 / M3+).
- **Read next:**
  1. `src/app/domain/find-conferences.ts` — `Candidate`, `toResult`, `withinRadius`: the
     exact-vs-rounded distance split and the ignore-without-location semantics are the decisions the
     review already had to correct once; both are now pinned by tests.
  2. `src/app/domain/location.store.ts` — `init()`/`snapTo`: two guards for two different race
     windows (second prompt while pending, late callback after a manual choice).
  3. `src/app/domain/conference.ts:29-46` — `CONFERENCE_RECORDS` and `isoDatePlusDays`; the cast and
     the UTC round-trip are the non-obvious parts, and the comment explains why the cast is checked.

### Test Evidence

— session 2026-09-03

```
$ npm test      # shell 20 passed (5 files), agent 14 passed (2 files)   → exit 0
$ npm run lint  → exit 0   ("All files pass linting")
$ npm run build → exit 0
```

**Mutation probes — six defects introduced, each reverted, tree verified restored via
`diff -r` against a backup.** Every one was caught by exactly the intended test:

| Mutation | Caught by |
|---|---|
| grouping before `limit` instead of after | T3-AC-05 groups-the-limited-result |
| `nearKm` rejects conferences when the location is unknown | T3-AC-04 omits-distanceKm-and-ignores-nearKm |
| local-time instead of UTC date arithmetic | T3-AC-01 derives-the-date |
| a `date` column added to the JSON | T3-AC-01 and T3-AC-06 (2 failures) |
| `init()` without the persisted-city guard | restores-the-chosen-city |
| `lat`/`lon` swapped when adopting a city | T3-AC-07 denied-permission |

Two earlier probe attempts were themselves faulty and were redone: the `nearKm` mutation first
produced a type error rather than a behaviour change (wrong parenthesisation), and the lat/lon
mutation initially targeted the wrong file and silently did nothing. Both are the classic `sed`
failure mode — a no-op that looks like a passing run.

**Data-set measurements** (node script over `conferences.json`, reproducible):

```
Berlin–München:                504.3 km          ← T3-AC-02 wants 504 ± 5
conferences within 300 km:     Berlin 8 · München 7 · Wien 5 · Zürich 6 · Hamburg 6
                               Köln 11 · Frankfurt 8 · Amsterdam 7 · Prag 10 · Warschau 3
Berlin 300 km boundary:        inside max 281 km | next outside 355 km   ← 74 km margin
```

**Distance-method comparison** (raised during review of the haversine choice, 10 cities × 30
conferences): naive degree Pythagoras gives 64.3 % max error, 352/4350 inverted orderings and 20
differing radius memberships; the cos-corrected equirectangular form gives 0.2 %, 0 and 0. Haversine
kept — the reasoning is recorded in `docs/book-learnings.md` §10, not in the code.

**Temporary probes — all removed, none remain in the tree:**

- `agent/src/nodeimport.probe.spec.ts` — answered whether the domain modules are importable from
  Node for the Task 9 eval harness. Result: **runtime works** (loaded all 30 conferences and ran
  `findConferences` under the agent's Vitest Node runner); the JSON import was *not* the problem.
  `tsc --noEmit` under the agent's `nodenext` config fails with `TS2835` — relative imports need
  explicit `.js` extensions. Carried forward as an Open Issue. File removed.
- A tsx probe under `$TMPDIR` — hit the same sandbox limit documented in Task 2:
  `EPERM: listen` on the tsx IPC socket. No code defect. Removed.
- `src/app/domain/__screenshots__/` (7 PNGs) and `.vitest-attachments/` (7 PNGs) — failure
  screenshots produced by the mutation runs. Both removed; the latter is now gitignored.

— session 2026-09-03 (after Codex review + CodeScene gate)

```
$ npm test      # shell 23 passed (5 files), agent 14 passed (2 files)   → exit 0
$ npm run lint  → exit 0
$ npm run build → exit 0
```

**Each review fix verified by a reverting probe** — fix undone, exactly the new test fails, fix
restored:

| Reverted | Failing test |
|---|---|
| rounding moved back before the filter | T3-AC-04 decides the radius on the exact distance |
| `asked` guard removed from `init()` | asks for geolocation only once, however often init runs |
| late-callback guard removed from `snapTo` | keeps a city picked while the permission prompt is open |

The third probe needed two attempts: a perl `\Q…\E` pattern treated `\n` literally and silently
changed nothing — the same no-op failure mode as the two redone probes of the first session, caught
the same way (grep confirming the mutation actually landed before trusting the green/red result).

**Codex claim verified before acting:** `slider` found in `DEFAULT_COMPONENT_IMPLEMENTATIONS`
(`a2ui-angular-src-v0_9.mjs`), alongside 17 other basic components; the 25 basic functions contain
no array transformation. Both facts recorded in the corrected spec text with the verification date.

The CodeScene gate ran externally (10 files, scores 9.68–10.0, one Topf-A finding, none in Topf B);
the extraction was re-verified here by the full suite, not by re-running the gate in this session.

- **T3-AC-01** — passed. `conference.spec.ts::loadConferences T3-AC-01 derives the date from today
  plus dayOffset` (today = 2026-01-01, `dayOffset: 42` → `2026-02-12`) and
  `::T3-AC-01 derives every date without touching the imported JSON`, which checks every entry
  against `isoDatePlusDays` and asserts no imported record carries a `date` key.
- **T3-AC-02** — passed. `geo.spec.ts::T3-AC-02 measures Berlin to München as 504 km`; measured
  504.3 km. A second test covers symmetry and identity.
- **T3-AC-03** — passed. `find-conferences.spec.ts::T3-AC-03 returns only angular conferences within
  90 days, sorted by date` and `::T3-AC-03 limit returns the first entries of the same query`, which
  asserts the limited result equals `all.slice(0, 2)` of the identical unlimited query rather than
  just checking the length.
- **T3-AC-04** — passed, in both directions and at the boundary. `::T3-AC-04 keeps only conferences
  within nearKm and reports an integer distance`, `::T3-AC-04 omits distanceKm and ignores nearKm
  while the location is unknown` (asserting the result is *identical* to the query without
  `nearKm`), and — added after the review — `::T3-AC-04 decides the radius on the exact distance,
  not on the rounded one`, a synthetic conference 2.7016° due north of Berlin (300.4 km, rounds to
  300): excluded at `nearKm: 300`, included at `301`.
- **T3-AC-05** — passed, with one test beyond the AC text. Month and topic grouping each assert the
  label format, that the sibling grouping key is absent, and that the values sum to `confs.length`;
  `::T3-AC-05 groups the limited result rather than the full match set` pins the ordering decision.
- **T3-AC-06** — passed. `conference.spec.ts::T3-AC-06 holds at least 30 valid records with unique
  ids and no date field` parses the raw JSON with a `z.strictObject` schema (strict, so an added
  `date` column fails), then checks id uniqueness and `remaining ≤ capacity`. Two further tests
  guard the demo rather than the AC: every fallback city has conferences within 300 km, and the
  flagship topics carry ≥ 8 angular / ≥ 6 dotnet.
- **T3-AC-07** — passed. `location.store.spec.ts::T3-AC-07 snaps a granted position to the nearest
  offered city` (a spy resolves near Garching → `München`) and `::T3-AC-07 stays undefined on a
  denied permission until a city is picked` (error callback → `undefined`, then `setCity('berlin')`
  yields Berlin with its coordinates). Four supporting tests cover persistence, the unknown-id
  throw, and — after the review — init-idempotence (`getCurrentPosition` called once across three
  `init()` calls) and the pending-prompt race (a held callback answered after `setCity('berlin')`
  does not overwrite Berlin).

### Open Issues

- **The Node eval harness cannot typecheck against the domain modules as they stand.** Runtime is
  fine; `tsc --noEmit` under `agent/`'s `nodenext` config rejects the extensionless relative imports
  (`TS2835`). The fix is a config choice in the harness — a tsconfig with bundler resolution, or
  `.js` extensions in the specifiers — not a change here. (→ Task 9)
- **The tool-boundary validation is currently a claim, not a test.** The comments on
  `findConferencesArgsSchema` and `findConferences` state that arguments are parsed before the pure
  function runs, but nothing yet proves that `{ withinDays: "90" }` is rejected. Measured what
  happens without the guard: `isoDatePlusDays(today, "90")` silently yields `2026-07-09` instead of
  `2026-04-01` — a plausible wrong answer, not a crash. (→ Task 6)
- **`meToContextEntry(me): Context` still has to be written** where the context is assembled,
  alongside `catalogToContextEntry`. (→ Task 6/7)
- **The `url` fields point at pages that do not exist yet.** `/conf-sites/<id>.html` is the M3
  deliverable; until then any UI binding the URL renders a dead link. (→ M3)
- **The A2UI structure the model emits is never validated server-side.** Our server knows no A2UI by
  design, so the book's `renderA2uiTool` gate does not exist here. Acceptable for a single-user local
  demo; an open flank once hosted or once remotes contribute foreign catalogs. (→ M2/M3)

### Context for Next Task

- **Signatures**, all pure and importable from a Node runner:
  - `loadConferences(today: Date): Conference[]` — `Conference = ConferenceRecord & { date: string }`.
  - `isoDatePlusDays(today: Date, days: number): string` — the single owner of calendar arithmetic;
    reuse it rather than recomputing cutoffs.
  - `haversineKm(a: GeoPoint, b: GeoPoint): number`.
  - `findConferences(args: FindConferencesArgs, ctx: { confs, me?, today }): { confs, byMonth?, byTopic? }`
    where results are `ConferenceResult = Conference & { distanceKm?: number }` and group rows are
    `{ label, value }`.
  - `CITIES`, `findCity(id)`, `nearestCity(point)`.
  - `LocationStore { me: Signal<Me | undefined>; init(); setCity(id) }`, `Me = { lat, lon, city }`
    where `city` is the display name; `localStorage` holds the city **id** under
    `conference-finder.city`.
- **The tool wraps, it does not re-implement.** Task 6's handler runs `loadConferences(today)`,
  passes `me` from `LocationStore`, parses arguments with `findConferencesArgsSchema`, and calls the
  pure function. `findConferences` itself trusts its arguments.
- **Derived views come from the tool.** `byMonth`/`byTopic` are produced here so the model never
  computes them; they are already chart-bindable `{ label, value }` rows.
- **Data facts worth knowing when writing prompts or tests:** 30 conferences, `dayOffset` 3…296, the
  soonest is `ng-atlas München` (offset 3, only 12 of 500 seats left — a natural `reserve` demo);
  `ai-atlas Zürich` is the `dayOffset: 42` entry used by T3-AC-01. Every fallback city has at least
  three conferences within 300 km, so "near me" answers for any picked city.
- **Browser-mode testing gotchas:** the shell has no Node test target, so every domain spec runs in
  headless Chromium. `navigator.geolocation` must be spied on (`vi.spyOn(navigator.geolocation,
  'getCurrentPosition')`) — never let a test reach the real API, or it waits on a permission prompt.
  `localStorage` is real and leaks between tests; clear it in `beforeEach`. A failing browser test
  writes PNGs to `__screenshots__/` and `.vitest-attachments/`; both are now gitignored.
- **The basic catalog is bigger than the plan assumes.** `@a2ui/angular` ships 18 components
  (`text row column button textField image icon video audioPlayer list card tabs modal divider
  checkBox choicePicker slider dateTimeInput`) — before adding a catalog component, check whether it
  already exists. The 25 basic *functions* contain no array transformation; that gap is real and is
  what `mfe-filter` (spec M3+) will fill.
- **Sandbox note, unchanged from Task 2:** the repo root repeatedly gains character devices
  (`.bashrc`, `.mcp.json`, `.claude/*`). They are not real files. Stage `src/app/domain` and the
  named doc files explicitly; never `git add -A`.

### Git State

```
$ git diff --stat
 .gitignore                 |  3 +++
 docs/book-learnings.md     | 46 ++++++++++++++++++++++++++++++++++++++++++++++
 docs/spec.md               |  8 ++++++++
 docs/work/m1-spike/plan.md |  2 +-

$ git status --short        # repo files only; sandbox device nodes omitted
 M .gitignore
 M docs/book-learnings.md
 M docs/spec.md
 M docs/work/m1-spike/plan.md
?? docs/work/m1-spike/task-log/task-3-conference-domain.md
?? src/app/domain/
```

### Sessions

- claude-code f4f5a3d6-2c65-4b67-9b21-06cee0dc6319 (2026-09-03) — transcript: /home/lutz/.claude/projects/-home-lutz-projects-conference-finder/f4f5a3d6-2c65-4b67-9b21-06cee0dc6319.jsonl
