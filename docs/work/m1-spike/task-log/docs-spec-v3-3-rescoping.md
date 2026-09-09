# docs: Re-scope spec to v3.3 — two remotes, requests 1–4, replay-first publication

### Task

Slimmed the project scope on the basis of a Codex proposal the user accepted after discussion:
spec bumped to v3.3 (requests 5–7, `mfe-embed`, `BarChart`/`ChartGrid`, `submitAnswer`,
`mfe-filter` moved to a non-binding "Spätere Erweiterungen" section; milestones compressed to
three with replay-first publication), and the m1-spike plan amended (M1 gate = requests 1–3,
Task 8 moved to the M3 scope, order 6 → 7 → 9).

### Status

DONE — documentation-only change; consistency-checked by grep for orphaned references
(no `WebFrame`/`submitAnswer`/`BarChart`/`ChartGrid`/`mfe-embed`/`M4` references remain outside
§8b and the decision log).

### Root Cause

Not a bug — a deliberate scope decision. The drivers, in priority order (recorded in-session):
(1) **risk order** — no model has composed anything yet; the chain 6 → 7 → 9 tests the project's
riskiest assumption (model wiring, spec risk #1) before any NF investment, while Task 8 is
deterministic shell code that can land any time; (2) **eval surface** — every vocabulary item
multiplies prompt surface and eval cases; the cut halves the eval matrix, not the codebase;
(3) **demo dramaturgy** — requests 5–7 are second instances of already-proven points (second
composition case, third remote, second agent flow); (4) **reach** — a mandatory replay mode makes
the hosted demo experienceable without an API key.

### Files Modified

- `docs/spec.md` (modified) — v3.3: header + E8 decision row; request table cut to 1–4 (request 3
  without `WebFrame`, "zwei Ursprünge"); flagship plugin-difference sentence rewritten to two
  remotes; container-claim (`ChartGrid[Map]`) moved to §8b with its demonstrator; single
  Live-Moment (maps degradation); `mfe-embed` removed from architecture/repo layout/scripts;
  primitives table trimmed (Map without `filter?`/`mode?`, MapLibre-upgrade note); `submitAnswer`
  handler and conf-sites removed (prompt rule reworded); tests: "ohne Netzwerk" → "ohne
  Agentenrequest", eval on requests 1–3 with the reserve-button contract scored in request 3,
  missing-vocabulary example now "request 2 without mfe-maps"; milestones M1–M4 → M1–M3 (M3 =
  reserve + MapLibre inside `mfe-maps` + hosting with mandatory, clearly labelled replay and
  optional BYOK); new §8b "Spätere Erweiterungen" (order: `mfe-filter` first with the full Kür
  argument, then embed, BarChart/ChartGrid + ex-request 5, submitAnswer + ex-request 6);
  non-goals: tiles allowed from M3, Toggle = Reload made explicit; acceptance criteria renumbered
  to requests 1–3 with (M3) markers.
- `docs/work/m1-spike/plan.md` (modified) — preamble: spec reference v3.3, scope = requests 1–3,
  order 6 → 7 → 9, M2/M3 description updated; MOVED banner on the Task 8 block (retained for
  `T8-AC-*`/XC-02 traceability, not startable on this branch); XC-02 annotated as completing in
  the M3 scope.

### Files Read (Context Only)

- `docs/spec.md` (full read — first time in this session lineage; previously off-limits per task
  isolation) and `docs/work/m1-spike/plan.md` Task 8 + Task 9 blocks + Cross-Cutting section
  (re-plan context, user-approved).

### Key Decisions

— session 2026-09-09

- **Cut items go to §8b, not to a milestone.** They leave the binding milestone chain entirely —
  that is the point of the slimming; a "later milestone" would keep them as implied obligations.
  Order in §8b is the recommended sequel order, `mfe-filter` first (function-only federation —
  the sharpest argument, per the spec's own "Kür" framing).
- **Milestones compressed to three.** M2 now cuts *both* fragments to remotes (the degradation
  live-moment needs `mfe-maps` as a remote); M3 absorbs the old M4 (hosting/replay now mandatory,
  BYOK optional) plus reserve (ex-Task 8) and the MapLibre upgrade inside `mfe-maps`.
- **Dual-map idea (Codex) rejected; map stays remote-only.** The graceful-degradation moment
  ("keine Karte verfügbar" → remote + reload → map) shows a *behavioral* delta driven by the
  context entry; a shell fallback map would reduce it to a cosmetic one, cost a second
  implementation, and collide with `mergeFragments`' first-wins dedupe. Runtime catalog swap
  discarded with it — "Toggle = Reload" stays (user decision).
- **Task 9 and Task 8 needed no content changes.** Task 9 was already scoped to requests 1–3 with
  the reserve-button contract scored inside request 3, and depends only on Task 7; `groupBy`
  appears in no eval criterion. Task 8's block is retained verbatim under a MOVED banner so
  `T8-AC-*` and XC-02 stay resolvable.
- **"ohne Netzwerkrequest" → "ohne Agentenrequest bei lokaler Interaktion"** — future-proofs the
  invariant for M3 map tiles while keeping today's stronger fetch-spy tests valid.

### Review Focus

- **Behavior claims:** the spec's binding surface is now exactly two remotes, requests 1–4,
  three milestones, replay-first publication; every cut item is preserved with its full argument
  in §8b; the m1-spike plan executes 6 → 7 → 9 with unchanged task blocks.
- **Plan deviations:** No plan (fix lane).
- **Assumptions / choices:** MapLibre GL over Leaflet noted as preference, final call deferred to
  the M3 map task; `Map.filter?`/`mode?` props travel with §8b item 3; request-3 markup keeps the
  `reserve` button although its handler lands in M3 (contract vs. handler split).
- **Scope notes:** `docs/spec.md` is a copy — the canonical
  `a2ui/docs/spec/spec-federated-capabilities.md` in `~/projects/a2ui` must be synced manually
  (user); `package.json` (local port 4300) and `playground-preview.png` remain uncommitted, as
  documented in the task-5 log.
- **Read next:**
  1. `docs/spec.md` §8 + §8b — the milestone compression and the cut list carry the whole
     decision.
  2. `docs/spec.md` §2 request 3 + §0 flagship sentence — verify demo claims match two remotes.
  3. `docs/work/m1-spike/plan.md` preamble + Task 8 banner — the only plan surface that changed.

### Test Evidence

— session 2026-09-09

Docs-only; no build/test run. Consistency probe (kept as evidence, no tree changes):
`rg 'WebFrame|submitAnswer|BarChart|ChartGrid|mfe-embed|mfe-filter|M4|M3\+' docs/spec.md` — after
the edits, every remaining hit sits in §8b, the E4/E8 decision rows, or the reworded prompt rule;
two stale `M4` references (data-mount rationale, test table) were found by this probe and fixed
to M3.

### Open Issues

- Canonical spec copy in `~/projects/a2ui` not yet synced to v3.3 — manual user step, outside
  this repo. (user)

### Context for Next Task

- Task 6 and Task 7 are textually unchanged by the re-scoping; `/start-task 6` proceeds as
  planned. The m1-spike scope now ends after Task 9 (M1 gate, requests 1–3).
- M2 and M3 get their own branch scopes and `/plan` runs; §8b is deliberately *not* read by those
  plans unless the user opens a task from it.
- When the M3 map task starts: MapLibre-vs-Leaflet decision, tiles allowed, `SHELL_ORIGIN`
  port question from the task-5 log resurfaces there.

### Git State

```
$ git diff --stat
 docs/spec.md               | 113 ++++++++++++++++++++++++++-------------------
 docs/work/m1-spike/plan.md |  10 ++--
 package.json               |   2 +-
 3 files changed, 73 insertions(+), 52 deletions(-)

$ git status --short        # repo files only; sandbox dotfiles omitted
 M docs/spec.md
 M docs/work/m1-spike/plan.md
 M package.json              ← user-local port change, stays uncommitted
?? playground-preview.png    ← throwaway, stays uncommitted
```

### Sessions

- claude-code 1eb9060f-b9ab-49df-b65e-31b47ee0e814 (2026-09-09) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/1eb9060f-b9ab-49df-b65e-31b47ee0e814.jsonl
