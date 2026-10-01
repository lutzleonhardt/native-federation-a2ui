# Task 1: Rewrite the README for publication

### Task

Rewrite `README.md` as the front door of the public repository: a first draft in the style of
the user's DevTools README, the hero GIF and two screenshots, and the reference sections moved
into two new documents.

### Status

DONE — first draft, written by the agent on the user's counter-proposal; the user revises the
prose from here. Reviewed by Codex (quick mode): three findings, two fixed, one declined (see
Key Decisions). The demo is deployed at the URL the README links to. Still open before
publication: the book author has not seen the credits, and the owner of the future repository
is assumed (see Open Issues). A second session on 2026-10-01 added the "Source on GitHub" link
to the credit line and made the Details panel close on a press outside it; these two changes
have not been independently reviewed.

### Files Modified

- `README.md` (modified) — rewritten: centered header with tagline, book credit and hero GIF;
  "What you see" (two screenshots, six bullets); "A capability in 30 seconds"; quickstart
  (hosted demo, local run, status); the small-domain sentence; FAQ in four reader groups
  (18 questions); "Where this pays off"; a three-line "Not production-ready" with a link;
  credits; documentation list. Scripts, setup details, "Adding a remote", the eval gate and
  the security section moved out.
- `docs/development.md` (new) — setup details, the scripts table (with the new `build:deploy`
  row), "Adding a remote" and "The model-behavior gate", moved from the README; the gate text
  updated to four requests, about 20 requests per run and the 2026-09-29 figures.
- `docs/production-readiness.md` (new) — "Not production-ready: what a real deployment needs":
  the two threats, SRI as a named trade-off, what is built, what is missing, the hosted demo.
- `docs/assets/readme/hero.gif` (new) — 1000 × 650, 26.3 s, 1.29 MB, cut from a live-mode
  recording.
- `docs/assets/readme/remotes-charts-only.png`, `docs/assets/readme/remotes-charts-and-maps.png`
  (new) — the capability panel next to the Remotes tab of the Native Federation DevTools, in
  both states; supplied by the user.
- `docs/architecture.md` (modified) — two invariants that the FAQ needed a home for (*The chrome
  is English, a surface speaks the user's language*; *One zod line crosses the boundary*); the
  eval section points at `development.md` for the commands.
- `docs/how-it-works.md` (modified) — one link in "Where to go next": "Adding a remote" now
  lives in `development.md`. Nothing else in the tour was touched.
- `docs/improvements.md` (modified) — three README entries ticked (monorepo paragraph, agent
  modes and deploy command, model dependence); one new entry from the review: no timeout around
  the `remoteEntry.json` fetch.
- `sheriff.config.ts` (modified) — comment only: the pointer to "Adding a remote".
- `src/app/chat/chat.page.html`, `src/app/chat/chat.page.css` (modified) — a credit line under
  the chat: "Built by Lutz Leonhardt", linking `https://lutzleonhardt.de`, and "Source on
  GitHub", linking `https://github.com/lutzleonhardt/native-federation-a2ui`.
- `src/app/chat/capability-panel.component.ts`, `src/app/chat/capability-panel.component.spec.ts`,
  `src/app/replay/replay-agent.ts` (modified) — the repository link now names the future public
  repository, `https://github.com/lutzleonhardt/native-federation-a2ui#readme`. The panel also
  closes on a press outside it (`closeOnOutside`, a `document:pointerdown` host listener), with
  one new test in the spec.
- `docs/work/publication/task-log/task-1-readme-for-publication.md` (new) — this log.

### Files Read (Context Only)

- `docs/work/publication/plan.md` (preamble and Task 1 block), `docs/how-it-works.md`,
  `docs/architecture.md`, `docs/improvements.md`.
- `agent/src/prompt.ts`, `agent/src/config.ts`, `agent/src/server.ts`, `agent/src/agent.ts`,
  `.env.example`, `package.json`, `agent/package.json`.
- `eval/scenarios.ts`, `eval/run-eval.ts`, `src/app/chat/example-prompts.ts`.
- `federation.config.mjs`, `projects/mfe-charts/federation.config.mjs`,
  `projects/mfe-maps/federation.config.mjs`, `public/federation.manifest.json`.
- `src/app/federation/select-capabilities.ts`, `src/app/federation/load-capabilities.ts`,
  `src/app/agent/render-failure-correction.ts`, `src/app/agent/create-frontend-tool.ts`,
  `src/app/agent/tools/find-conferences.tool.ts`, `src/app/agent/tools/render-surface.tool.ts`,
  `src/app/chat/capability-panel.component.ts`, `projects/mfe-charts/src/app/app.ts`,
  `projects/mfe-maps/src/app/app.ts`, `shared/capabilities/*.ts` (zod imports).
- `docs/work/m3-reserve-maps-hosting/task-log/task-4-badges-form-rules-eval.md` (eval cost),
  `task-6-docs-reserve-replay-map.md` (context for this scope),
  `docs/work/m2-nf-split/task-log/docs-publication-replan.md` (headings).
- `https://raw.githubusercontent.com/native-federation/devtools/main/README.md` — the style
  reference.

### Key Decisions

- **The agent writes the first draft (user).** The plan had the user write the prose and the
  agent supply facts. The user proposed the reverse, with his DevTools README as the style
  reference: centered header, bold tagline, a reader question as a blockquote with a short
  answer, emoji bullets, image plus caption. That README is also the English text in his voice
  the plan said did not exist, so `/voice-curate` was not needed.
- **The tagline says what happens (user).** "Capabilities: what the assistant can say, and
  what the browser can draw" was too poetic and assumed the term. It became "An LLM composes
  the UI. Micro frontends deliver the building blocks, at runtime." — one sentence for the
  agentic part, one for the federated part. "Capability" is introduced two paragraphs later,
  where it is explained.
- **The description does not undersell (user).** "A small piece of UI" was replaced: the answer
  is a tree of components wired by data bindings, and it filters, selects and updates in the
  browser without the LLM or the server. The model-dependence caveat stays in the FAQ and in
  the gate section rather than in the header.
- **Hero GIF: the app alone, recorded live.** The DevTools next to the app would halve the
  legible width at GitHub's roughly 880 px. A replay take was cut first; the user then recorded
  live, and that take won: no "REPLAY MODE" line under "An LLM composes the UI", and the
  answer without maps names the missing map component outright. It ends on the slider at
  278 km, where three markers are left, held for 2.5 s — the frame a looping GIF shows longest.
- **Two screenshots instead of one (user).** The user supplied the capability panel next to
  the DevTools' Remotes tab, once with charts only and once with both remotes. They replace
  the planned "demo left, extension graph right": the same fact from two sides, as a
  before/after pair, and tightly cropped so it stays legible.
- **Reference sections left the README (user).** The README was too long. Setup details,
  scripts, "Adding a remote" and the eval gate went into one `docs/development.md` (the shape
  of `docs/DEVELOPMENT.md` in the DevTools repository), the security section into
  `docs/production-readiness.md`. The texts moved verbatim. Three lines of "Not
  production-ready" stay in the README so the honest label is on the first page.
- **The book credit moved into the header (user).** The user wants to promote the book. One
  line under the description, above the badges and the GIF: "The book lays the foundation.
  This repository adds the federation." The credits section at the end stays as the longer
  form; the line in the running text was removed.
- **Facts follow the code as it is, not the plan's wording.** The plan predates M3. The status
  describes the finished demo; the hosted version answers free text with "not recorded" (no
  BYOK was built); the eval section describes four requests and about 20 requests per run; the
  figures are those of 2026-09-29.
- **The cost answer gives call counts only.** No measured token or currency figure exists in
  any log; a real one would need a paid measuring run.
- **Section heading "A capability in 30 seconds".** "The two halves" assumed the reader knew
  what the halves belong to. The user asked about "Federated" or "Remote capability"; the
  recommendation was to keep the bare term, because code, tour and architecture doc all say
  "capability", and "remote" already names the project that delivers one. The user has not
  decided.
- **Review fix: the timeout claim is narrowed.** Codex: the README said a remote that stalls is
  left out after 15 s, but the timeout guards only the import of `./capability`;
  `initFederation` (`src/main.ts:46`) fetches `remoteEntry.json` before it, without one. The
  FAQ answer now ties the timeout to the module import. The code is unchanged; the gap is in the
  improvements register.
- **Review fix: `patch-package` in the manual install steps.** Codex: with
  `npm ci --ignore-scripts` the documented manual steps left out the patch that `postinstall`
  applies (`package.json:11`), so a bound `0` would vanish again. `docs/development.md` now
  names `npx patch-package`. The gap came over from the old README.
- Declined finding: Codex — the "Adding a remote" checklist does not name `REMOTES` in
  `scripts/build-deploy.mjs:11`, so a third remote would be missing from the deploy build — it
  only bites someone who adds a third remote and deploys it; the user judged it not important.
- **A credit line under the input (user).** The hosted page needed a link to the author. Three
  places were weighed: the header's eyebrow (always visible, but hidden at phone width and part
  of the specified header), the Details panel (one click away), and below the input. The user
  chose the last. It is a `footer` in the chat page on the input band's surface: in a running
  chat it reads as that band's last line, on the empty page as a thin strip at the bottom.
- **The repository link names the future repository (user).** The panel and the "not recorded"
  text linked `lutzleonhardt/conference-finder`, which is private and will not be the public
  repository. Both now link `lutzleonhardt/native-federation-a2ui`. The owner is an assumption:
  the plan names only the repository, and the current remote is under `lutzleonhardt`. Until
  that repository exists the link leads to a 404.
- **GIF recipe**, for a re-cut. Source: `~/2026-10-01 18-19-30.mp4` (1800 × 1212, 126 s, OBS
  window capture, outside the repository). ffmpeg `filter_complex`: nine `trim` segments
  (3.0–6.3 at 1.25×, 6.3–7.3, 54.2–56.5, 79.0–82.2, 82.2–93.2 at 2.5×, 94.4–101.8 at 2.25×,
  101.8–102.5, 109.8–114.3 at 1.5×, 114.3–118.4 at 1.25×), `concat`,
  `tpad=stop_mode=clone:stop_duration=2.5`, `crop=1800:1170:0:42` (the window title bar),
  `fps=12`, `scale=1000:-1:flags=lanczos`, `palettegen=max_colors=128:stats_mode=diff`,
  `paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`.

— session 2026-10-01 (second session)

- **"Source on GitHub" links the repository root (user asked for the link).** The credit line
  reads "Built by Lutz Leonhardt · Source on GitHub". The URL is a literal in the template, next
  to the author link, rather than the panel's `REPOSITORY_URL`: that constant ends in `#readme`,
  which suits "clone the repository" but not "source".
- **The Details panel closes on a press outside it (user).** The user reported that a click
  outside did not close the panel and suspected a swallowed event. Nothing was swallowed: the
  panel is a native `<details>`, which has no light dismiss, and no handler existed. The
  component now listens for `document:pointerdown` and closes unless the target is inside its
  host (summary strip or panel).
- **`pointerdown`, not `click`.** The replay notice's "How it works →" button sits outside the
  panel and opens it on `click` (`ChatHeaderComponent.explainAgent`). A `click` listener on the
  document would run after that handler and close the panel in the same gesture. `pointerdown`
  comes before the click, so the press closes (a no-op) and the click opens. Rejected: a capture
  listener (manual `addEventListener` and cleanup) and `stopPropagation` in the header (couples
  two components). A keyboard activation fires no `pointerdown` and just opens.

### Review Focus

- **Behavior claims:**
  - Every local link and image in `README.md`, `docs/development.md`, `docs/architecture.md`
    and `docs/how-it-works.md` resolves, anchors included.
  - Every FAQ answer ends in a link to the section that carries its rule.
  - What is listed as built in `docs/production-readiness.md` exists in the code; SRI,
    authentication, rate limits and topic binding appear only as missing.
  - A press anywhere outside the capability panel closes it; a press inside leaves it open, the
    summary still toggles it, and "How it works →" opens it.
- **Plan deviations:**
  - The user writes the prose → the agent wrote the first draft, the user revises → user's
    counter-proposal.
  - The tagline introduces "capabilities" as the first term → it states the two mechanisms;
    the term follows in the hook paragraph → user found the original unclear.
  - Hero GIF of about 15 s → 26 s, live mode, with the slider as the closing frame → the live
    answer is longer and needs reading time.
  - One screenshot, demo left and extension graph right → two screenshots, capability panel
    left and the Remotes tab right → supplied by the user.
  - "Adding a remote" and the eval section stay in the README; security is README section 8 →
    moved to `docs/development.md` and `docs/production-readiness.md`, linked from the README →
    user: the README was too long.
  - Quickstart "with the M2 status" → the finished state after M3.
  - Hosted version "takes free text only with BYOK" → "Free text gets the answer 'not
    recorded'" → BYOK was deliberately not built.
  - Eval figures from M2 Task 9 → the 2026-09-29 gate.
  - One register entry ticked → three, all README entries.
  - A "What you see" section with emoji bullets was added → taken from the style reference.
- **Assumptions / choices:**
  - The reasons given in two FAQ answers are derived, not quoted: "Why a reload instead of
    hot-add?" (from *The manifest is the ceiling, the URL a whitelist* and the boot section)
    and "Why not CopilotKit's built-in A2UI path?" (from *Layers and ownership* and the tour's
    note on plain Angular components). The user was told and has not yet confirmed them.
  - "Where this pays off" is the plan's bullet list turned into prose; nothing in the code
    backs it, by nature.
  - The book URL `https://knowhow.angulararchitects.io/` comes from a web search; the user
    confirmed it.
  - The credits line on the agentic workflow follows the "About" of the DevTools README.
- **Scope notes:**
  - `docs/architecture.md` gained two invariants (i18n, zod) because the plan requires a home
    for every fact before the README links to it.
  - `docs/how-it-works.md`: one link changed. The tour is the user's text; the diff is two lines.
  - `sheriff.config.ts`: a comment, no rule changed.
  - Three changes to the app itself ride along (five files under `src/app`): the credit line
    under the chat with its two links, the repository URL, and the panel's close on an outside
    press. The first two are links a public visitor follows; the third is a behavior fix the
    user asked for while looking at the page. All are outside the plan's Task 1, which names the
    README only.
- **Read next:**
  - `src/app/chat/capability-panel.component.ts`, `closeOnOutside` — the only behavior change in
    this task; the listener is on `document` for the component's lifetime.
  - `README.md`, the FAQ — 18 answers, each a condensed rule; check the two derived reasons.
  - `docs/production-readiness.md` — the "What is built" list against the code.
  - `docs/architecture.md`, *One zod line crosses the boundary* — new wording of a fact that so
    far lived only in the federation configs' comments.

### Test Evidence

- **Link check** (one-off node script in the session's temp folder, not in the tree): for each
  file, every `](…)`, `src="…"` target that is not `http(s)` — file exists, and the anchor is a
  heading of the target. Final run: `README.md` 38 checked, 0 broken; `docs/development.md` 4/0;
  `docs/production-readiness.md` 0/0; `docs/architecture.md` 23/0; `docs/how-it-works.md` 15/0.
- `npx sheriff verify` — "No issues found", "All projects validated successfully" (after the
  comment change).
- `npx prettier --check sheriff.config.ts` — passes.
- **Hero GIF**: `ffprobe` 1000 × 650, 26.25 s, 1 286 216 bytes. Checked on a contact sheet of
  stills and on single frames (the answer without maps, the closing frame at 278 km): chips,
  answer text and map labels legible. The agent saw no motion; the user watched it: "Sieht
  sehr gut aus".
- After the two review fixes: link check again, `README.md` 38/0 and `docs/development.md` 4/0;
  `git diff --check` clean.
- **Deploy build**, `--base-href /conference-finder/`: served under that path by a one-off node
  server and driven with headless Chromium (script in the session's temp folder, not in the
  tree) — both remotes loaded, the replay line, four example prompts, prompt 1 answered with a
  surface, prompt 2 with a map canvas, both standalone pages, no console error, no failed local
  request. The first run failed with "Worker failed to load": the probe server sent
  `maplibre-gl-worker.mjs` as `application/octet-stream`; a host has to serve `.mjs` as
  JavaScript.
- **Deployed site** (`curl -I`): `/conference-finder/` 200; without the trailing slash 301 to it;
  `maps/maplibre/maplibre-gl-worker.mjs` 200 `application/javascript`; manifest, recordings and
  both standalone pages 200. The user confirmed the page in the browser (timeline answer, both
  remotes in the DevTools).
- **After the two app changes**: `npm run test:shell` — 29 files, 210 tests passed; `eslint` on
  the touched files clean; `prettier --check` clean. Deploy build rebuilt and probed as above,
  plus: the credit line is present and its link is `https://lutzleonhardt.de`; no file in
  `dist/deploy` contains the old repository URL. The credit line was looked at in replay mode
  only (empty page and running chat); in local mode CopilotKit's disclaimer sits above it, not
  looked at. The site at `lutzleonhardt.de/conference-finder/` still serves the build before
  these two changes until the user copies the new one.
- The other four suites were not run: the change outside `src/app` is documentation, images and
  one comment.
- Not verified: the README as GitHub renders it (centered header, reference-style links inside
  the `<div>`, emoji bullets).

— session 2026-10-01 (second session), on the code with the GitHub link and the outside press

- `npm run test:shell` — 29 files, 211 tests passed (one new:
  `closes on a press outside the panel and stays open on one inside`). `npx eslint src/app/chat`
  clean; `prettier --check` on the three touched files clean.
- **Browser probe** against the deploy build of 22:39 (base href `/`, replay mode, built outside
  this session; its bundle contains both changes), served by a one-off node server and driven
  with headless Chromium at 1280 and 390 px, same result at both widths: Details opens the panel;
  a press on a panel heading leaves it open; a press in the chat, on the credit strip and in the
  prompt row each close it; two presses on the summary open and close it; "How it works →" opens
  it and it stays open; no page error. The credit line reads "Built by Lutz Leonhardt · Source
  on GitHub" with the links `https://lutzleonhardt.de/` and
  `https://github.com/lutzleonhardt/native-federation-a2ui`; looked at on a 1280 px screenshot.
  The probe script and its screenshots are deleted; nothing of it is in the tree.
- The probe could not use the dev server: `localhost:4200` failed to boot with
  `ngDevMode is not defined`, because `npm run build:deploy` (which starts with `npm run clean`)
  had run beside the live `npm start`. Local mode was therefore not probed.
- Living documents, by grep for the panel and the credit line: `docs/architecture.md` (lines 16,
  63, 166, 387, 580, 648) and `docs/improvements.md:35` name the capability panel but say
  nothing about how it closes or about the credit line; nothing was stale from these changes.
- The other four suites were not run; the change is confined to `src/app/chat`.

Facts behind the README's figures and behavioral claims (T1-AC-02):

| Claim | Evidence |
| --- | --- |
| Thirty conferences | `src/app/domain/conferences.json` — 30 `dayOffset` entries |
| Three custom components, three functions | `docs/architecture.md:118-119`; the remotes' `vocabulary.ts` |
| Four example prompts, prompt 2 asks for the slider map | `src/app/chat/example-prompts.ts:2-7` |
| Sixteen recordings | `public/recordings.json` — 16 `renderSurface` answers; `docs/architecture.md:409` |
| Three corrections per user turn | `src/app/agent/render-failure-correction.ts:7` |
| 15 s timeout on the import of `./capability`, failed remote left out | `src/app/federation/load-capabilities.ts:8`; `docs/architecture.md:157`; not covered: the `remoteEntry.json` fetch in `initFederation`, `src/main.ts:46` |
| Runtime check of what a remote delivers | `src/app/federation/load-capabilities.ts:41,63` (`isAgentCapability`) |
| The URL can only narrow the manifest | `src/app/federation/select-capabilities.ts:10-20` |
| The agent mode rides along on _Switch on_ | `src/app/federation/select-capabilities.ts:26-31` |
| Schema validation at the tool boundary | `src/app/agent/create-frontend-tool.ts:83` |
| Rollback of a failed surface | `src/app/agent/tools/render-surface.tool.ts:49,203-205` |
| The agent server has no tools | `agent/src/agent.ts:21-27` (no `tools` key); `docs/architecture.md:76` |
| The agent binds to loopback; CORS is not access control | `agent/src/server.ts:19,91` |
| The model is told count and first hit, never the list | `src/app/agent/tools/find-conferences.tool.ts:38-49` |
| Name and city of the first hit reach the model | same, `toNext` |
| Labels in the user's language, no translation files | `agent/src/prompt.ts:21`; no `i18n`/`$localize` in `src` or `projects` |
| The server holds no vocabulary; a spec guards it | `agent/src/prompt.ts` (`catalogSection`); `agent/src/prompt.spec.ts` |
| Three Sheriff rules | `sheriff.config.ts:19-24` |
| Angular shared as `singleton` with `strictVersion` | `federation.config.mjs:8`, `projects/*/federation.config.mjs:16` |
| Only `zod/v3` crosses the boundary | `federation.config.mjs:26-30`, `projects/*/federation.config.mjs:45`; `shared/capabilities/*.ts` import `zod/v3` |
| SRI not switched on | `features` in all three federation configs carries no `integrityHashes`; `docs/architecture.md:176` |
| Standalone pages show releases and lighthouses | `projects/mfe-charts/src/app/app.ts:10-13`, `projects/mfe-maps/src/app/app.ts:11-16` |
| The maps remote went from SVG to MapLibre unnoticed | `docs/how-it-works.md:330` |
| CopilotKit's built-in `render_a2ui` on a Lit renderer | `docs/architecture.md:539` |
| One run = one POST = one SSE response | `docs/architecture.md:236` |
| About 14 000 characters for three custom schemas | `docs/architecture.md:610` |
| Gate: 4 of 5, five runs | `eval/run-eval.ts:34,36` |
| Gate: four requests in two capability sets | `eval/scenarios.ts:28-45` |
| Last gate: 5/5 and 4/5, 5/5 and 4/5 | `docs/architecture.md`, *Status and history*, "Eval gate, 2026-09-29" |
| About 20 requests per eval run, one or two model calls each | `docs/work/m3-reserve-maps-hosting/task-log/task-4-badges-form-rules-eval.md:285` |
| Node.js >= 24 | `package.json:7-8` |
| Angular 21, Native Federation v4, A2UI v0.9 (badges) | `package.json:32,40,55`; `agent/src/prompt.ts:25` |
| Providers and default models | `agent/src/config.ts:23-25`; `.env.example` |
| Hosted demo: no model, no key, no server; free text "not recorded" | `docs/architecture.md`, *Agent modes: local and replay* |
| The answer without maps names the missing map component | the live recording behind `hero.gif` (one run) |

### Acceptance Coverage

- **T1-AC-01** — partial. Every FAQ link resolves (link check above), and each target was read
  against its answer. One answer leans on a second section: "What does a run cost" links to the
  gate, while the 14 000-character figure lives in *Prompt and vocabulary*. No rule is explained
  in full twice: the README condenses, `development.md` and `production-readiness.md` hold moved
  text, not copies. No durable automated check exists.
- **T1-AC-02** — partial. The table above backs each figure and behavioral claim with a
  `file:line` or a log entry; checked by hand. "Where this pays off" is positioning, not a
  claim about the code.
- **T1-AC-03** — partial, checked by hand. "What is built" in `docs/production-readiness.md`
  lists five mechanisms, each in the table above. SRI, authentication, rate limits and topic
  binding appear only under what a real deployment needs; the README's three lines name
  authentication, cost and topic limits as missing.

### Open Issues

- The demo is live at `https://lutzleonhardt.de/conference-finder/`, the URL the README links to
  (built with `npm run build:deploy -- --base-href /conference-finder/`, copied by the user). The
  build in `dist/deploy` (22:51, base href `/conference-finder/`, made outside this session) is newer
  than all app changes of this task; the user copies it.
- `package.json` is modified in the working tree, not by this session: `build:deploy` now
  carries `--base-href /conference-finder/`. It is not in Files Modified because it is undecided
  whether it is committed. If it is, `docs/development.md:41` and `docs/architecture.md:839`
  (`npm run build:deploy -- --base-href /path/`, default `/`) are stale, and a second
  `--base-href` passed through npm ends in the script's usage error (it accepts one flag).
- The repository link assumes the owner `lutzleonhardt`. If the public repository lands under
  another owner, four literals change (`capability-panel.component.ts:27`, its spec,
  `replay-agent.ts:14`, `chat.page.html:5`) and the site is built once more (→ Task 2, which
  creates the repository).
- The credits go to the book's author before publication (→ Task 2).
- The user's revision of the draft is pending, including the heading question ("capability" or
  "federated capability") and the two derived FAQ reasons; a second `/wrap-up 1` absorbs it.
- `docs/spec.md:114` still says the production note is "in der README"; it now lives in
  `docs/production-readiness.md`, linked from the README. Not changed.

### Context for Next Task

- The README's facts are final for the code as of `e2da26c`; the prose is a draft in the user's
  hands.
- Link targets the README depends on: `docs/development.md#adding-a-remote`,
  `docs/development.md#the-model-behavior-gate`, `docs/production-readiness.md`, eight headings of
  `docs/architecture.md` and five of `docs/how-it-works.md`. Renaming one of them breaks a FAQ
  link; nothing checks that automatically.
- Media live in `docs/assets/readme/`. The GIF's source video is outside the repository; the
  recipe is under Key Decisions.
- For Task 2: the app already links `lutzleonhardt/native-federation-a2ui` (owner assumed, see
  Open Issues); `docs/work/` stays in the public repository on purpose, as the README's credits
  say.
- `npm run build:deploy` ran last, so the next `npm start` needs `npm run clean` first — which
  also removes `dist/deploy`. A `npm start` that was running during the build serves a broken
  shell (`ngDevMode is not defined`) until it is restarted.
- The capability panel closes on any `pointerdown` outside its host. A new control outside the
  panel that opens it must do so on `click` (as "How it works →" does), not on `pointerdown`.

### Git State

`git diff --stat`:

```
 README.md                                       | 454 +++++++++++++++++++-----
 docs/architecture.md                            |  14 +-
 docs/how-it-works.md                            |   4 +-
 docs/improvements.md                            |   7 +-
 package.json                                    |   2 +-
 sheriff.config.ts                               |   2 +-
 src/app/chat/capability-panel.component.spec.ts |  16 +-
 src/app/chat/capability-panel.component.ts      |  13 +-
 src/app/chat/chat.page.css                      |  14 +
 src/app/chat/chat.page.html                     |   6 +
 src/app/replay/replay-agent.ts                  |   2 +-
 11 files changed, 426 insertions(+), 108 deletions(-)
```

`git status --short`:

```
 M README.md
 M docs/architecture.md
 M docs/how-it-works.md
 M docs/improvements.md
 M package.json
 M sheriff.config.ts
 M src/app/chat/capability-panel.component.spec.ts
 M src/app/chat/capability-panel.component.ts
 M src/app/chat/chat.page.css
 M src/app/chat/chat.page.html
 M src/app/replay/replay-agent.ts
?? docs/assets/
?? docs/development.md
?? docs/production-readiness.md
?? docs/work/publication/task-log/
```

Branch `feature/publication`, created from `main` at `e2da26c`.

### Sessions

- claude-code 750ed0f1-bd32-4099-854d-c76d83ed4000 (2026-10-01) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/750ed0f1-bd32-4099-854d-c76d83ed4000.jsonl
- claude-code e6897bfa-a6c4-4b4e-aedd-e262ff31736e (2026-10-01) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/e6897bfa-a6c4-4b4e-aedd-e262ff31736e.jsonl
