# Task 9: Switch the running demo to English

### Task

Replaced every German string the demo shows or sends — prompts, data, model-facing descriptions,
labels and fixtures — with English, no i18n layer, and re-ran the model-behavior gate on the final
strings.

### Status

DONE — all five suites green, lint clean, gate reached on the third paid run (5/5 · 5/5 · 5/5 with
both capabilities, 5/5 · 5/5 with charts only). Independent review performed (Codex quick review,
2026-09-22): two LOW findings — a stale test name fixed, the one-time reset of a stored city id
accepted (see Key Decisions); two blind spots noted, neither needs work. Not committed
(`/commit 9` pending). One user decision during the task: request 3 was reworded after two runs at
A3 3/5 (see Key Decisions). `/cs` applies to `eval/scenarios.ts` and `eval/scenarios.spec.ts` only
— every other change is a string or data swap.

### Files Modified

- `src/app/chat/example-prompts.ts` (modified) — the four demo requests in English; the doc comment
  now says the eval replays 1–3 from this list.
- `eval/scenarios.ts` (modified) — imports `EXAMPLE_PROMPTS` and destructures requests 1–3 from it;
  the harness no longer spells its own copy.
- `eval/scenarios.spec.ts` (modified) — new test: both scenarios play the shell's prompts in the
  shell's order (`EXAMPLE_PROMPTS.slice(0, 3)` / `slice(0, 2)`).
- `eval/score.ts` (modified) — `MAP_WORD` is `/map/i`; the German alternative is gone.
- `eval/score.spec.ts` (modified) — fixtures: `Reserve`, `Next conference on …`, the refusal text
  `A map view is not available in this session.`, `Here is the timeline.` (must not match), `new`.
- `src/app/chat/chat.page.spec.ts` (modified) — English `PROMPTS` literals (still pinned as
  literals, not the constant), `setCity('vienna')` / `city: 'Vienna'`, the `messageWidget` fixture
  `There is no **timeline** here.` and its `<strong>` expectation.
- `src/app/domain/conferences.json` (modified) — 15 entries: `name`, `city`, `id` and `url` slug
  for Munich, Vienna (×2), Prague, Zurich (×2), Warsaw, Nuremberg, Cologne, Antwerp, Kraków,
  Copenhagen, Brussels, Luxembourg, Hanover. Poznań unchanged.
- `src/app/domain/cities.ts` (modified) — picker list: `munich`, `vienna`, `zurich`, `cologne`,
  `prague`, `warsaw` with English names.
- `src/app/domain/{geo,location.store}.spec.ts` (modified) — `Munich`, `MUNICH`/`NEAR_MUNICH`.
- `projects/mfe-charts/src/charts/gauge.schema.ts` (modified) — model-facing description quotes
  `"Tickets left"` instead of `"Restkarten"`.
- `projects/mfe-charts/src/charts/gauge.component.spec.ts`,
  `src/app/a2ui/{catalog-context,renderer-integration}.spec.ts`, `src/app/playground/playground.ts`
  (modified) — the `Tickets left` label and its assertions.
- `projects/mfe-maps/src/maps/{geo.ts,distance.fn.spec.ts,map.component.spec.ts}` (modified) —
  `Berlin–Munich` comment, `MUNICH` fixture, `Munich` / `Munich Days` labels.
- `src/app/playground/tool-playground.{html,ts}` (modified) — the dev sandbox's intro, headings,
  buttons, scenario labels, `Conferences near you` title and the Markdown demo text in English;
  `setCity('munich')`.
- `src/app/agent/tools/{render-surface.tool,message-widget.component,surface-tool-renderer.component}.spec.ts`
  (modified) — `Munich`, `Conferences`, `Hello **conference**`, `Hello`, `Hello surface`.
- `agent/src/prompt.ts` (modified) — the fixed prompt's example surface: `Ticket price`, `Reserve`
  (model-facing, not in the plan's Key Locations).
- `agent/src/agent.spec.ts` (modified) — `Vienna` in the location-context fixture.
- `agent/requests.http` (modified) — the manual request's user message in English.
- `docs/architecture.md` (modified) — "Status and history": gate figures of 2026-09-22 with the
  request-3 note; the 0/5 history keeps its date.
- `docs/how-it-works.md` (modified) — `> [!NOTE]` in "What the LLM answers": the prompt is not
  hardened against misuse (user request, docs otherwise out of scope).
- `docs/improvements.md` (modified) — A3 line extended with the task-9 measurements; two new lines
  (prompt hardening + off-topic scenario; the `T9-AC-02` tag collision).

### Files Read (Context Only)

- `docs/work/m2-nf-split/plan.md` — preamble and the Task 9 block (the EOF read also showed the
  Cross-Cutting section; only XC-01 was used).
- Task logs: `task-8-architecture-doc-and-tour.md` (predecessor: where the figures live, the
  path-check one-liner), targeted lines of `task-7-eval-capability-sets.md` (gate figures, how
  the eval runs, sandbox gotchas, the printed `messageWidget` texts).
- `eval/run-eval.ts` (imports, `EVAL_RUNS`, no `EVAL_CAPABILITIES` any more), `eval/score.ts`
  (`mapFailures`/`detailFailures` — what "no Map in the surface" means), `agent/src/prompt.ts`
  (output rules; "a refusal" is named, no rule says what to refuse), `sheriff.config.ts`,
  `package.json` (scripts, `postinstall`), `src/app/chat/{chat.page.html,capability-panel.component.html}`
  (selectors for the live check), `projects/mfe-maps/src/app/{app.ts,app.html}` (Warnemünde),
  `README.md` (eval section — cites no figure).

### Key Decisions

— session 2026-09-22

- **Every German exonym goes, not only the five the plan names (agreed at task start).** Wien,
  Prag, Warschau, Antwerpen, Krakau, Kopenhagen, Hannover and Luxemburg have English forms and
  T9-AC-01 says "no German word"; Warnemünde (a lighthouse in the maps remote's standalone page)
  and Poznań keep their spelling as proper names without an English form. `public/conf-sites/`
  does not exist, so the slug changes are pure data.
- **The eval imports the shell's prompt list instead of copying it (agreed at task start).**
  `eval/run-eval.ts` and `scenarios.spec.ts` already import from `src/app/`, so
  `eval/scenarios.ts` doing the same crosses no boundary. T9-AC-02 then holds by construction;
  `chat.page.spec.ts` keeps pinning the literals (the constant is not its own oracle) and one new
  test in `scenarios.spec.ts` pins that the scenarios replay requests 1–3 and 1–2 in order.
- **No off-topic eval scenario (agreed at task start); the tour carries a note instead (user
  decision).** A scored refusal would need a new `Requirement` and a scorer branch inside a
  string-swap task. The user chose a `> [!NOTE]` in "What the LLM answers" saying the repository is
  simplified and a real deployment needs hardening against misuse — the register line records the
  scenario for later.
- **Request 3 reads "Where and when is the next one near me? …" (user decision after two runs).**
  The first translation, "When is the next one near me? When I click one, I want details.", scored
  A3 3/5 twice, both times "no Map in the surface" — 4 of 10 runs built a timeline instead of the
  map A3 requires (points/center/selected bound, details wired). Before the switch the same request
  failed once in five (task 7, M1). Two identical results made it a measured effect of the wording,
  not noise; the plan's rule was "run again before touching the prompt", and the prompt was not
  touched. Alternatives offered: a prompt rule for proximity questions (another paid run, risk to
  the charts set), or recording 3/5 as BLOCKED. "Where" carries the location cue the German "in
  meiner Nähe" evidently carried; "when" stays so `daysUntil` keeps its reason. Third run: 5/5.
- **`agent/src/prompt.ts` is touched although the block lists only the Gauge description as
  model-facing.** Its example surface carried `Ticketpreis` and `Reservieren`; AC-01 covers them,
  and they are read by the model, so they belong to the set the gate had to run on. XC-01's
  "nothing in `agent/` changes between the two sets" is about the two capability sets of one run,
  which still holds.
- **Scorer keyword `/map/i`, unanchored.** Same permissiveness as before minus the German
  alternative; all fifteen recorded charts-only texts contain "map component" or "map view".
- **`format: 'dd.MM.yyyy'` in `score.spec.ts` stays** — a date pattern, not a word.
- **The four prettier warnings were left alone.** `chat.page.spec.ts`, `playground.ts`,
  `tool-playground.{html,ts}` were already unformatted at HEAD, and prettier's diff touches only
  lines this task did not change; reformatting them would be unrelated churn.

— session 2026-09-22 (Codex quick review absorbed)

- **A stored city id from before the switch is reset once, not migrated (Codex finding, accepted).**
  `LocationStore` keeps the picked city id in `localStorage`; `restore()` resolves an unknown id
  (`muenchen`, `wien`, …) to `undefined` without throwing, so a returning browser with denied
  geolocation asks for the city once more. That storage exists only on developer machines — a
  migration of six ids would be code for no user. Nothing in the tree changed for this finding.
- **Test name "send exactly the German texts" → "the demo texts" (Codex finding, fixed).** The
  German sweep looked for German words, not for the English word "German"; `rg -i german` over
  the code now finds only the maps remote's prose about German lighthouses, which is English.

### Review Focus

- **Behavior claims:** (1) No German word outside `docs/` in any prompt, data value, description,
  label or fixture — the final sweep (`rg` for umlauts, ß and ~90 German marker words over the
  tree minus `docs/`, `node_modules`, `.claude`) returns only `Warnemünde` and the "Tickets left"
  hits. (2) Shell and harness send the same requests: `eval/scenarios.ts` destructures
  `EXAMPLE_PROMPTS`, and `scenarios.spec.ts` pins the order. (3) On the English strings the gate
  is reached for both sets, and the charts-only run names the map in English in every recorded
  `messageWidget` text.
- **Plan deviations:** "English city names (Munich, Cologne, Zurich, Brussels, Nuremberg)" → 13
  exonyms across 15 entries → AC-01 wording, agreed · "Vocabulary the model reads: the Gauge
  description" → also two labels in `agent/src/prompt.ts` → model-facing, AC-01 · request 3
  reworded from the first approved translation → two runs at 3/5, user decision · "`docs/` is out
  of scope" → a note added to `docs/how-it-works.md` → user request in place of the off-topic
  scenario · "run the model-behavior gate once" → three full runs (two at 3/5 on the first wording,
  one at gate on the final) · Key Locations named `README.md (eval section)` → it cites no figure,
  unchanged · not in the block: the `scenarios.spec.ts` test, the `NEAR_MUNICH`/`MUNICH`
  identifier renames, `docs/improvements.md`.
- **Assumptions / choices:** the demo's fourth request loses the German "Karte" pun ("Reserve a
  ticket for me"); `Kraków` keeps its diacritic as the English form; `Hanover` over `Hannover`;
  `Warnemünde` and `Poznań` are treated as proper names without an English form; the eval-side
  fixture texts (`A map view is not available in this session.`, `Here is the timeline.`) are
  invented, chosen so exactly one of them matches `/map/i`.
- **Scope notes:** `docs/architecture.md` (figures only, the section the plan assigns),
  `docs/how-it-works.md` (one note, user request), `docs/improvements.md` (register). No
  production logic changed: the only non-string edit is the import in `eval/scenarios.ts`.
- **Read next:**
  1. `eval/scenarios.ts` (the destructuring import) with `eval/scenarios.spec.ts` (`T9-AC-02`) —
     the one structural change; check the eval still loads under Node (`npm run test:eval` does).
  2. `src/app/domain/conferences.json` — 60 changed lines; the `node -e` consistency check in Test
     Evidence is the evidence that id, url and name/city still agree.
  3. `docs/how-it-works.md`, "What the LLM answers" — the new note makes a claim about the shell's
     checks; compare with `agent/src/prompt.ts` rule 3 and `src/app/a2ui/surface-host-rules.ts`.

### Test Evidence

— session 2026-09-22

All checks below ran on the final strings (after the request-3 rewording) unless marked earlier.

- `npm run test:eval` — `tsc -p eval/tsconfig.json` clean; 3 files, 29 passed (28 + the new
  `T9-AC-02`). Re-run after the rewording: 29 passed.
- `npm run test:shell` — 19 files, 115 passed (unchanged count; fixtures only). Re-run after the
  rewording: 115 passed.
- `npm run test:charts` — 4 files, 18 passed. `npm run test:maps` — 3 files, 10 passed.
  `npm run test:agent` — 4 files, 30 passed. (Run before the request-3 rewording; none of their
  files changed afterwards.)
- `npm run lint` — `ng lint` no issues in all projects, `sheriff verify` "All projects validated
  successfully".
- `npx prettier --check` over the 26 changed code files — clean except the four files that were
  already unformatted at HEAD (verified with `git show HEAD:<file> | prettier --check`); left as
  is. `docs/how-it-works.md` clean.
- **Data consistency** (`node -e` over `conferences.json`): 30 entries, 30 unique ids, every `url`
  equals `/conf-sites/<id>.html`, every `name` ends with its `city`; `git diff` touches only
  `id`/`name`/`city`/`url` lines (60 = 15 entries × 4).
- **German sweep** (`rg` over the tree minus `docs/`, `node_modules`, `dist`, `.claude`,
  `package-lock.json` for `ä|ö|ü|ß|Ä|Ö|Ü` and ~90 marker words): hits are `Warnemünde`
  (`projects/mfe-maps/src/app/app.ts:15`, kept) and the seven "Tickets left" lines the pattern
  `Tickets` catches. The first sweeps also found `Wien` in `agent/src/agent.spec.ts`, `Hallo` in
  `message-widget.component.spec.ts` and `Hallo Surface` in `surface-tool-renderer.component.spec.ts`
  beyond the plan's list — all fixed.
- **Docs paths** (task-8 one-liner over `docs/architecture.md` and `docs/how-it-works.md`): every
  backticked repo path exists (`checked`, no `MISSING`).
- **Playwright browsers:** `ng test` first failed with `browserType.launch: Executable doesn't
  exist at ~/.cache/ms-playwright/chromium_headless_shell-1234/…` — the cache directory did not
  exist on the machine (checked outside the sandbox). `npx playwright install chromium` (the
  repository's `postinstall` step, run outside the sandbox because it writes to `~/.cache`)
  downloaded Chrome Headless Shell 151.0.7922.34; the suites ran afterwards. Not a code change.
- **Eval, three full runs against the real model** (`npm run eval`, Anthropic provider, `EVAL_RUNS`
  default 5, agent started outside the sandbox with `npm run start:agent`, port 3001 checked free
  with `ss` beforehand; logs `eval-run-{1,2,3}.log` in the session scratchpad):

  | Run | Request 3 wording | `charts,maps` | `charts` | Gate |
  |---|---|---|---|---|
  | 1 | "When is the next one near me? …" | A1 5/5 · A2 5/5 · A3 **3/5** (runs 1, 5: `no Map in the surface`) | A1 5/5 · A2-without-maps 5/5 | NOT reached |
  | 2 | same | A1 5/5 · A2 5/5 · A3 **3/5** (runs 2, 4: `no Map in the surface`) | A1 5/5 · A2-without-maps 5/5 | NOT reached |
  | 3 | **"Where and when is the next one near me? …"** (final) | A1 5/5 · A2 5/5 · A3 5/5 | A1 5/5 · A2-without-maps 5/5 | **reached**, exit 0 |

  The charts-only `messageWidget` texts of run 3 (T9-AC-03 asks for them), verbatim:
  1. "I don't have a map component available in this catalog, so I can't plot the conferences
     geographically. I can show them on the timeline (as before) or list them with city and
     distance from Berlin — let me know if you'd like that instead."
  2. "I don't have a map component available — only a timeline view for conference dates. Here's
     the same list of upcoming Angular conferences plotted on a timeline instead, where you can
     still click through to see each one's details."
  3. "I don't have a map component available in my current toolkit — I can only show conferences
     as a list or on a Timeline (with details like city, date, and tickets left). Would you like
     me to show the timeline view instead, sorted by distance from Berlin?"
  4. "I don't have a map component available in this interface — the only visual/spatial component
     I can use is a **Timeline** (which plots conferences by date, not by location). \n\nI can show
     you the Angular conferences on a timeline with their city names and distances from Berlin
     instead, if that helps. Just let me know!"
  5. "I don't have a map component available in this interface — I can't plot conferences on a
     geographic map. What I *can* show is the list of upcoming Angular conferences on a timeline
     (as in the previous view), with city and distance details for each. Let me know if you'd like
     that instead, e.g. sorted by distance from Berlin."

  Runs 1 and 2 produced ten more texts of the same shape (all name the map; two mention "Tickets
  left"/"ticket counts", i.e. the new Gauge description reached the model).
- **Quick functional check — run, headless** (Playwright script `live-check.cjs` in the session
  scratchpad against `npm run start:shell|charts|maps` plus the agent, all started and stopped by
  the agent session; run on the first request-3 wording, which the check does not send): opened
  `/`, clicked the panel's maps link → URL `?capabilities=charts`, panel `charts=loaded`,
  `maps=unselected`; prompt 1 → 1 `app-timeline`, no widget; prompt 2 → one `app-message-widget`:
  "I can't show a map here — the current catalog doesn't include a map component, only a Timeline
  view, a Gauge, and detail cards for conferences. I've already displayed the upcoming Angular
  conferences on a timeline above. …"; `app-map` count 0; no console errors. Screenshot
  `live-check.png` (scratchpad) shows the English prompt buttons and a Gauge captioned "Tickets
  left". Probe and screenshot live outside the tree; servers stopped afterwards (`ss`: 3001, 4200–4202
  free).

— session 2026-09-22 (after the Codex review)

- Codex verified independently on the pre-fix tree: 115 shell, 30 agent and 29 eval tests passed,
  the data consistency check and `git diff --check` clean; it changed no files. It reproduced the
  stored-id reset for all six old ids.
- Both findings re-checked in code before acting: `restore()` in `src/app/domain/location.store.ts`
  returns `undefined` for an unknown id (no throw); `chat.page.spec.ts:355` still said "German".
- `npm run test:shell` after the rename — 19 files, 115 passed. No other file changed since the
  gate run; the eval figures above stand.

### Acceptance Coverage

- **T9-AC-01** — partial — no automated test can prove absence of a language; evidence is the
  final `rg` sweep (Test Evidence) with the two deliberate exceptions (`Warnemünde`, `Poznań`),
  plus the green suites whose fixtures changed. `docs/` excluded as the block says.
- **T9-AC-02** — passed — `eval/scenarios.spec.ts` "T9-AC-02: every scored request is one of the
  shell's demo prompts, in the shell's order"; structurally, `eval/scenarios.ts` imports the list.
- **T9-AC-03** — passed — run 3 of `npm run eval`: 5/5 · 5/5 · 5/5 and 5/5 · 5/5, exit 0; the
  five charts-only `messageWidget` texts are above; figures in `docs/architecture.md`. Contributes
  to XC-01 (the live moment with and without maps, `agent/` identical between the two sets — the
  harness plays both sets against one running server).

### Open Issues

- Promoted: the prompt is not hardened against misuse; an off-topic eval scenario would measure it
  (→ improvements register, source: user).
- Promoted: `T9-AC-02` tags in `eval/score.spec.ts` belong to M1's task 9, next to this task's
  `T9-AC-02` in `scenarios.spec.ts` (→ improvements register).
- Extended in the register: A3 without slack — the English wording needed "Where" to reach 5/5;
  the `Map` description still does not claim "near me" requests.
- Not addressed: four files unformatted at HEAD (`chat.page.spec.ts`, `playground.ts`,
  `tool-playground.{html,ts}`); a `prettier --write` pass is cheap but unrelated to this task.

### Context for Next Task

- **M2 is functionally complete with this task;** the next scopes are `visual-language` and then
  `publication` (`docs/work/publication/plan.md`). The README rewrite there can quote the figures
  from `docs/architecture.md`, "Status and history" (2026-09-22: 5/5 · 5/5 · 5/5 and 5/5 · 5/5)
  and the four English prompts from `src/app/chat/example-prompts.ts` — that file is now the single
  source; the eval destructures it, `chat.page.spec.ts` pins the literals.
- **If a prompt string changes again, the gate has to run again** (three paid runs this task, about
  five minutes each). `EVAL_CAPABILITIES` no longer exists: every run plays both sets.
- **Gotchas:** Playwright's browser cache can be missing on this machine (`npx playwright install
  chromium` outside the sandbox fixes it); `ng test` reports it as an "Unhandled Error" with all
  suites apparently passing 0 tests, so check the file count. Start the agent outside the sandbox
  and check `ss -ltnp` for 3001/4200–4202 first (task 7's rule; all four were free this session).
  The panel's toggle is a link — a full navigation to `?capabilities=…`, not an in-page switch.

### Git State

```
$ git diff --stat
 agent/requests.http                                |   2 +-
 agent/src/agent.spec.ts                            |   4 +-
 agent/src/prompt.ts                                |   4 +-
 docs/architecture.md                               |  10 +-
 docs/how-it-works.md                               |   8 ++
 docs/improvements.md                               |   4 +-
 eval/scenarios.spec.ts                             |   8 ++
 eval/scenarios.ts                                  |   7 +-
 eval/score.spec.ts                                 |  10 +-
 eval/score.ts                                      |   2 +-
 .../mfe-charts/src/charts/gauge.component.spec.ts  |   4 +-
 projects/mfe-charts/src/charts/gauge.schema.ts     |   2 +-
 projects/mfe-maps/src/maps/distance.fn.spec.ts     |   8 +-
 projects/mfe-maps/src/maps/geo.ts                  |   2 +-
 projects/mfe-maps/src/maps/map.component.spec.ts   |  10 +-
 src/app/a2ui/catalog-context.spec.ts               |   2 +-
 src/app/a2ui/renderer-integration.spec.ts          |   4 +-
 .../agent/tools/message-widget.component.spec.ts   |   8 +-
 src/app/agent/tools/render-surface.tool.spec.ts    |   8 +-
 .../tools/surface-tool-renderer.component.spec.ts  |   4 +-
 src/app/chat/chat.page.spec.ts                     |  20 ++--
 src/app/chat/example-prompts.ts                    |  10 +-
 src/app/domain/cities.ts                           |  12 +--
 src/app/domain/conferences.json                    | 120 ++++++++++-----------
 src/app/domain/geo.spec.ts                         |  10 +-
 src/app/domain/location.store.spec.ts              |   8 +-
 src/app/playground/playground.ts                   |   2 +-
 src/app/playground/tool-playground.html            |  22 ++--
 src/app/playground/tool-playground.ts              |  12 +--
 29 files changed, 173 insertions(+), 154 deletions(-)

$ git status --short     # sandbox dotfiles omitted
 M agent/requests.http
 M agent/src/agent.spec.ts
 M agent/src/prompt.ts
 M docs/architecture.md
 M docs/how-it-works.md
 M docs/improvements.md
 M eval/scenarios.spec.ts
 M eval/scenarios.ts
 M eval/score.spec.ts
 M eval/score.ts
 M projects/mfe-charts/src/charts/gauge.component.spec.ts
 M projects/mfe-charts/src/charts/gauge.schema.ts
 M projects/mfe-maps/src/maps/distance.fn.spec.ts
 M projects/mfe-maps/src/maps/geo.ts
 M projects/mfe-maps/src/maps/map.component.spec.ts
 M src/app/a2ui/catalog-context.spec.ts
 M src/app/a2ui/renderer-integration.spec.ts
 M src/app/agent/tools/message-widget.component.spec.ts
 M src/app/agent/tools/render-surface.tool.spec.ts
 M src/app/agent/tools/surface-tool-renderer.component.spec.ts
 M src/app/chat/chat.page.spec.ts
 M src/app/chat/example-prompts.ts
 M src/app/domain/cities.ts
 M src/app/domain/conferences.json
 M src/app/domain/geo.spec.ts
 M src/app/domain/location.store.spec.ts
 M src/app/playground/playground.ts
 M src/app/playground/tool-playground.html
 M src/app/playground/tool-playground.ts
?? docs/work/m2-nf-split/task-log/task-9-english-demo.md
```

### Sessions

- claude-code bd4bae8d-53ca-4611-bfac-801a33e6e2cd (2026-09-22) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/bd4bae8d-53ca-4611-bfac-801a33e6e2cd.jsonl
- codex 01a0c7cd-e03c-7a62-ba5f-32a5d22a9407 (2026-09-22) — transcript: ~/.codex/sessions/2026/09/22/rollout-2026-09-22T08-29-13-01a0c7cd-e03c-7a62-ba5f-32a5d22a9407.jsonl
