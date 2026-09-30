# Task 5: Static deployment

### Task

A deploy script (`npm run build:deploy -- --base-href /path/`) that builds both remotes and the
shell in its `deploy` configuration and assembles one static tree, `dist/deploy`, whose manifest
points at the remotes with relative URLs; plus, on the user's request at task start, a link per
loaded remote in the Details panel that opens the remote's standalone page.

### Status

DONE — implementation and task-local verification complete. The deploy build was run and probed
by the assistant in an isolated copy of the workspace (`tmp/deploy-check/`, git-ignored) under
`/cf/`, because the user's `npm start` was running and the script begins with `npm run clean`.
The user then ran `npm run build:deploy` in the real tree (base `/`), served `dist/deploy` with
`npx serve` and did the visual check: it works, including the standalone link in a new tab.
Independent review not performed yet.

The static server on port 8088 is stopped. The copy `tmp/deploy-check/` (about 1 GB, git-ignored)
is still on disk: its removal was denied to the assistant, the user removes it
(`rm -rf tmp/deploy-check`).

### Files Modified

- `scripts/build-deploy.mjs` (new) — `baseHrefFrom(args)` (no argument → `/`; one `--base-href` with a leading and trailing `/`; anything else prints `USAGE` and exits 1 before any work), `npm run clean`, `ng build <remote> --base-href <base><folder>/` per entry of `REMOTES`, `ng build shell --configuration deploy --base-href <base>`, assembles `dist/deploy` (shell at the root, remotes under `charts/` and `maps/`), overwrites the copied dev manifest with the `./`-prefixed relative one, prints the smoke recipe and the reminder to `clean` before the next `npm start`.
- `package.json` (modified) — `build:deploy` script.
- `tsconfig.app.json` (modified) — excludes `src/**/testing/**`: the chat-page test harness sat in the production program and failed the shell's production build (see Key Decisions).
- `src/app/chat/capability-panel.component.ts` (modified) — `PanelEntry.standaloneHref` (a loaded remote's origin, else undefined).
- `src/app/chat/capability-panel.component.html` (modified) — an icon link after the `origin` value, new tab, `title` and `aria-label` "Open the remote on its own".
- `src/app/chat/capability-panel.component.css` (modified) — `.cf-standalone` (inline-flex, a small left margin).
- `src/app/chat/capability-panel.component.spec.ts` (modified) — two cases: a loaded remote links to its own page in a new tab and an unloaded one has no link; a relative origin stays relative in the `href`.
- `docs/improvements.md` (modified) — the deploy-manifest entry ticked with what was verified; the boot-check entry extended by the manual check of the deploy build and the instance it found; the README entry extended by the `build:deploy` command and its two `clean` rules.

### Files Read (Context Only)

- `docs/work/m3-reserve-maps-hosting/plan.md` (preamble, Task 5), `task-log/task-4.5-*.md`, `task-log/task-3-*.md` (the `deploy` configuration decision, Context for Next Task).
- `angular.json`, `package.json`, `public/federation.manifest.json`, `src/main.ts`, `src/index.html`, `src/environments/environment.ts` and `environment.deploy.ts`, `tsconfig.app.json`, `tsconfig.spec.json`, `.gitignore`, `.prettierrc`, `README.md` (grep: `clean`).
- `src/app/federation/select-capabilities.ts`, `capability-status.ts`, `src/app/chat/testing/chat-page-harness.ts`, `src/app/chat/chat-header.component.html` (grep: the replay line), `projects/mfe-charts/src/{main.ts,index.html,app/app.html}`, `projects/mfe-maps/src/main.ts`, `projects/mfe-maps/src/maps/map.component.css` (grep: the MapLibre import).
- `node_modules/@angular-architects/native-federation-v4/src/index.js` and `index.d.ts` (`initFederation`), `src/builders/build/schema.json` and `builder.js` (`baseHref` is passed through to the Angular builder).
- `node_modules/@softarc/native-federation-orchestrator/fesm2022/node.mjs` (`getScope`, `join`, `addRemoteInfoToStorage`).
- `~/projects/FrankensteinMeetingRoom/scripts/build-deploy.mjs` (assemble step, manifest, recipe) and `packages/shell/src/app/panel-header.{html,css}` (the standalone link and its icon).

### Key Decisions

- **The script starts with `npm run clean`; `npm start` does not (user).** `ng serve` writes its
  federation artifacts into the same `dist/<project>/browser` folders the build uses (found:
  `-dev.js` files in `dist/shell/browser`), so a deploy tree copied from an uncleaned `dist`
  would carry them. The price: the script must not run beside `npm start`, and the next
  `npm start` needs a `clean` first — which the script prints. A `clean` inside `npm start` was
  asked about and declined by the user: it would run on every start and is needed only after a
  build.
- **No guard against a running `npm start` (user, after the build broke the running dev shell —
  see Test Evidence).** Proposed: abort before `clean` when something listens on 4200–4202.
  Declined: the rule stays one to remember, a broken dev setup is cured by stop, `clean`,
  start, and the script learns no dev port.
- **Each remote is built with its own base href (`<base><folder>/`).** A remote's standalone
  page lives below the shell, and its `index.html` resolves `./remoteEntry.json` and its chunks
  against `<base href>`. The NF builder passes `--base-href` through, so `angular.json` did not
  change (Task 3's log had expected the base href in the `deploy` configuration).
- **One `REMOTES` table in the script** (manifest name, Angular project, folder) drives the
  builds, the copies and the manifest, so the three cannot drift.
- **The script accepts exactly its one argument and prints a usage line for anything else
  (user question after the first wrap-up).** `--base-href` needs a leading and trailing `/`,
  because the remotes' base is built by appending the folder. The first version ignored unknown
  arguments, so a typo such as `--base-hrf /cf/` built silently with `/`. The user asked for a
  `--help` or a description of the arguments; decided: no separate help flag — any argument
  list the script does not understand, `--help` included, prints the usage and exits 1 before
  `clean`. The README row stays a register entry.
- **The relative remote URL works as read.** The orchestrator fetches the manifest's URL as
  given (`fetch` resolves it against the document base) and derives the remote's scope URL by
  string work (`getScope('./charts/remoteEntry.json')` → `./charts/`); the import-map entries
  are then `./charts/<file>`. The host's own `./remoteEntry.json` already went that way. Read in
  the orchestrator's `node.mjs` bundle (same path utilities), confirmed in the browser.
- **The standalone link is the origin the panel already shows (user request, reference:
  FrankensteinMeetingRoom's panel header).** Only a loaded remote has one — the scope URL comes
  from the orchestrator. In development it is `http://localhost:4201/`, in the deployment
  `./charts/`, which the browser resolves against the base href; no URL is composed in the
  shell. Icon, `target="_blank"` and `rel` follow the reference; the text is English like the
  rest of the panel.
- **The panel's `origin` reads `./charts/` in the deployment and stays that way** (briefed, user
  accepted): it is what the orchestrator reports, and the link beside it now shows where it
  leads.
- **`src/**/testing/**` leaves the production program.** `ng build shell` failed in both the
  `deploy` and the `production` configuration: `tsconfig.app.json` included every non-spec file
  under `src`, so Task 4.5's `chat-page-harness.ts` was compiled, its import of
  `projects/mfe-maps/src/testing/offline-map` pulled in the Map component, and that component's
  stylesheet (MapLibre's CSS, 84.64 kB) broke the shell's `anyComponentStyle` budget (8 kB).
  Nothing in production imports from a `testing` folder; the specs that do keep type-checking
  the helpers through `tsconfig.spec.json`. Rejected: raising the shell's budget (hides test
  code in the production compile) and moving the harness (the folder convention is right, the
  include was too wide).
- **Verified in an isolated copy, not by stopping the user's servers.** `rsync` of the workspace
  without `dist`, `.angular`, `.git`, `agent`, `eval`, `docs` and dotfiles into
  `tmp/deploy-check/`, with a real copy of `node_modules`, so the script's `clean` and the NF
  artifact cache touched the copy only.
- **No Playwright test in the tree** (plan decision 2026-09-26); the probes ran from the session
  scratchpad.

### Review Focus

- **Behavior claims:** (1) `npm run build:deploy -- --base-href /cf/` leaves a `dist/deploy`
  whose `federation.manifest.json` is `{ "charts": "./charts/remoteEntry.json", "maps":
  "./maps/remoteEntry.json" }`, whose `index.html` files carry `/cf/`, `/cf/charts/` and
  `/cf/maps/` as base href, and whose shell bundle defaults to replay. (2) Served from a plain
  static server under `/cf/`, the shell loads both remotes from the relative URLs, shows the
  replay line, plays the four prompts and sends no request to localhost:3001 or 4200–4202. (3)
  In the Details panel every loaded remote has an icon link that opens its standalone page in a
  new tab — `http://localhost:4201/` in development, `/cf/charts/` in the deployment; an
  unreachable or switched-off remote has none.
- **Plan deviations:** the plan named no panel change → a standalone link per loaded remote →
  user request at task start. The plan expected `npm run build` to behave as before → it failed
  at HEAD since Task 4.5 and builds again → `tsconfig.app.json` excludes `src/**/testing/**`.
  The plan wanted the deployment served and checked → done in an isolated copy with
  `python3 -m http.server` instead of the real tree and `npx serve` → the user's dev servers
  were running. The script adds a `clean` at its start and a reminder line at its end → the
  plan's instructions named neither; user confirmed the `clean`.
- **Assumptions / choices:** `--base-href` needs a leading and trailing `/`; the recipe's
  `mv dist/deploy dist/<name>` assumes a single path segment; the link's label is the same
  static text for every remote.
- **Scope notes:** `tsconfig.app.json` (build fix, above); the four panel files (user request);
  `docs/improvements.md` also extends the README entry. `angular.json` and
  `public/federation.manifest.json` are untouched.
- **Read next:** `scripts/build-deploy.mjs` — the whole mechanism in sixty lines, the `REMOTES`
  table and the per-remote base href; `tsconfig.app.json` — the one-line exclude and whether
  anything in production could still need a `testing` file;
  `src/app/chat/capability-panel.component.html` — the link sits inside the `origin` `dd`, after
  the toggle link in DOM order, which the existing specs' `querySelector('a')` relies on.

### Test Evidence

- Final code, sandboxed: `npm run test:shell` — 29 files, 210 tests (before: 29 / 208; new: the
  two panel cases). `npx tsc -p tsconfig.app.json --noEmit` and `-p tsconfig.spec.json`: clean
  after the exclude. `npx eslint src/app/chat`: clean. `npx sheriff verify`: all projects
  validated. `npx prettier --check` on the script, `package.json` and the four panel files:
  clean; `tsconfig.app.json` warns as it did at HEAD (`git show HEAD:… | prettier --check`).
- Argument handling (final code, changed after the deploy build below ran; the build steps are
  unchanged): `baseHrefFrom` extracted and called with ten argument lists by a node one-liner
  (gone) — `[]` → `/`; `--base-href` with `/`, `/cf/`, `/a/b/` → the value; `--help`,
  `--base-hrf /cf/`, a missing value, `cf`, `/cf` and a trailing extra argument → undefined.
  `node scripts/build-deploy.mjs --help` and `npm run build:deploy -- --base-hrf /cf/` print the
  usage and exit 1 with `dist` untouched. Prettier clean.
- Deploy build in the copy (`tmp/deploy-check/`), sandboxed:
  `npm run build:deploy -- --base-href /cf/` — first run exit 1, the shell build failed on
  `maplibre-gl.css exceeded maximum budget. Budget 8.00 kB was not met by 76.64 kB`; after the
  `src/**/testing/**` exclude exit 0, no budget warning. Result: the manifest as specified;
  base hrefs `/cf/`, `/cf/charts/`, `/cf/maps/`; `agentMode:"replay"` in `main-*.js`; no
  `-dev.js` file; `recordings.json`, `nf-mark.png` and `media/` at the root; `maps/maplibre/`
  present; 13 MB.
- The build break is older than this task: in the copy, `npx ng build shell` (production) with
  `git show HEAD:tsconfig.app.json` exits 1 with the same budget error, with the exclude exit 0.
  The harness came with commit `c758c6b` (Task 4.5).
- Served check (outside the sandbox): `mv dist/deploy dist/cf`,
  `python3 -m http.server 8088 --directory …/tmp/deploy-check/dist`, Playwright probe
  `probe-deploy.mjs` from the session scratchpad against `http://localhost:8088/cf/`: chips
  `charts loaded`, `maps loaded`; the replay line present; `remoteEntry.json` requested from
  `/cf/charts/`, `/cf/maps/` and `/cf/`; panel rows with origin `./charts/` and `./maps/`, link
  `href` the same, resolved to `http://localhost:8088/cf/charts/` and `…/maps/`; both links
  opened a page with `h1` `mfe-charts` / `mfe-maps`, one surface and the remote's base href;
  each prompt after a reload: 1 → Timeline, 2 → Map, 3 → three Gauges, 4 → Map, Timeline, Gauge
  and one Button; 879 requests, none to localhost:3001 or 4200–4202; hosts seen: the static
  server, `tiles.openfreemap.org`, and `blob:`/`data:` URLs; no console error.
- Development check (outside the sandbox, the user's `npm start` on 4200–4202): the same probe
  against `http://localhost:4200/` before and after the `tsconfig.app.json` change — both chips
  loaded, no replay line, the links open `http://localhost:4201/` and `:4202/`, no console
  error. The first run hit a `vite-error-overlay` on the dev shell that was gone on the re-run
  a minute later (the dev server was rebuilding after the edits and the test run); not
  diagnosed further. Panel screenshot: `tmp/panel-standalone-link.png` (git-ignored).
- Probes: `probe-deploy.mjs`, `overlay.mjs`, `shot.mjs`, `hosts.mjs` live in the session
  scratchpad, none in the tree. The server on 8088 is stopped; `tmp/deploy-check/` awaits the
  user's `rm` (see Status).
- The user's run in the real tree (after the wrap-up, final script): `npm run build:deploy`
  without an argument at 14:46–14:47 — `dist/deploy` with the relative manifest, base hrefs `/`
  and `/charts/`, no `-dev.js` file; `npx serve deploy -l 8088` from `dist` (the recipe's form
  for base `/`; `serve` moved to port 43113 because the assistant's check server still held
  8088). The user's screenshot: the replay line, "Recorded in Dresden", badge 1 as a Timeline,
  badge 2 as a Map with the Slider, and the `mfe-charts` standalone page in a second tab.
  Not run by anyone: the recipe with a base path and `npx serve` (`mv dist/deploy dist/<name>`);
  the base-path layout itself is covered by the probe above.
- The rule "never beside `npm start`" shown by accident: the user's build ran while `npm start`
  (started 13:51) was up. Afterwards the dev shell on 4200 rendered no chips; console:
  `504 (Outdated Optimize Dep)` — the script's `clean` had removed `.angular/cache` under the
  running dev server. The deployed page was unaffected. Cure: stop `npm start`,
  `npm run clean`, `npm start`.

### Acceptance Coverage

- `T5-AC-01` — partial — manual by plan decision (no deploy test in the tree): the command's
  output in the isolated copy under `/cf/` (manifest, base hrefs, `agentMode:"replay"`) and the
  user's run in the real tree with base `/`.
- `T5-AC-02` — partial — Playwright probe against a plain static server under `/cf/` (both
  chips, replay line, four prompts, no request to localhost:3001/4200–4202); the user's visual
  check on `npx serve` with base `/` (replay line, badges 1 and 2).
- `T5-AC-03` — partial — probe: both standalone pages open under `/cf/charts/` and `/cf/maps/`
  through the panel link; the link itself is pinned by the two `capability-panel.component.spec.ts`
  cases ("a loaded remote links to its own page…", "keeps a relative origin relative…").
- `T5-AC-04` — partial — `public/federation.manifest.json` and `angular.json` unchanged; the
  running dev servers kept serving both remotes from localhost after every edit; `npm run
  test:shell` green. `npm run build` does not behave as before: it failed at HEAD and builds
  again (checked in the copy).

### Open Issues

- `docs/architecture.md` and `docs/how-it-works.md` do not know the deploy build, the layout of
  the deployed tree (remotes under `charts/` and `maps/`, the relative manifest), or the panel's
  standalone link; `architecture.md:113` says each remote is a standalone page "on its own
  port", which holds for development only. (→ Task 6)
- Promoted: the README's deploy command and the two `clean` rules (→ improvements register,
  the existing README entry extended).

### Context for Next Task

- Task 6 (docs): `npm run build:deploy -- --base-href /path/` (default `/`) → `dist/deploy`:
  the shell at the root, `charts/` and `maps/` below it, each with its own `index.html`,
  `remoteEntry.json` and base href; the manifest there is
  `{ "charts": "./charts/remoteEntry.json", "maps": "./maps/remoteEntry.json" }` and is the only
  place that knows the layout; the `./` prefix is required by es-module-shims. The orchestrator
  keeps the relative scope URL, so the panel's `origin` reads `./charts/` in the deployment and
  `http://localhost:4201/` in development; the icon beside it opens the remote on its own.
- Rules around the script: it starts with `npm run clean`, so never beside `npm start`; after
  it, `npm run clean` before the next `npm start` (which also removes `dist/deploy`). To smoke
  it: rename `dist/deploy` to the base path's name and serve `dist` from any static server.
- `src/**/testing/**` is outside the production program (`tsconfig.app.json`); test helpers go
  there and are type-checked through the specs that import them. A helper that production code
  imports must live elsewhere.
- Gotchas: `ng serve` writes `-dev.js` federation artifacts into `dist/<project>/browser`; the
  NF builder accepts `--base-href`; a shell build can fail on a remote's stylesheet budget when
  a file in the shell's program imports a remote component.

### Git State

```
$ git diff --stat
 docs/improvements.md                            |  6 ++---
 package.json                                    |  1 +
 src/app/chat/capability-panel.component.css     |  5 ++++
 src/app/chat/capability-panel.component.html    | 31 ++++++++++++++++++++++++-
 src/app/chat/capability-panel.component.spec.ts | 21 +++++++++++++++++
 src/app/chat/capability-panel.component.ts      |  3 +++
 tsconfig.app.json                               |  3 ++-
 7 files changed, 65 insertions(+), 5 deletions(-)

$ git status --short   (sandbox mask entries such as .bashrc, .claude/ omitted)
 M docs/improvements.md
 M package.json
 M src/app/chat/capability-panel.component.css
 M src/app/chat/capability-panel.component.html
 M src/app/chat/capability-panel.component.spec.ts
 M src/app/chat/capability-panel.component.ts
 M tsconfig.app.json
?? docs/work/m3-reserve-maps-hosting/task-log/task-5-static-deployment.md
?? scripts/
```

### Sessions

- claude-code aff55c15-88f5-4b10-b428-27da2e117aec (2026-09-30) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/aff55c15-88f5-4b10-b428-27da2e117aec.jsonl
