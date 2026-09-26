# Plan: ConferenceFinder — M3: Reserve, map upgrade, hosting

Spec: `docs/spec.md` (Entwurf v3.4, 2026-09-25) — §8 "M3 — Reserve, Karten-Upgrade, Hosting", with request 4 (§2, line 42), store and handler (§5, line 145), the client event rule (§6, line 154), the test matrix (§7, lines 166–167), the freshness risk (§10, line 236) and acceptance 3 and 6 (§12); the map kit in `docs/specs/visual-language.md` §8.3. Predecessor: `docs/work/visual-language/plan.md` (the design pass, merged to `main` 2026-09-25: the Departure look across shell chrome, chat frame, primitives, `Timeline` and `Gauge`; eval gate 5/5 on the final strings; the map left for this scope).
Scope: the `reserve` handler (request 4's click path), MapLibre inside `mfe-maps`, and hosting as a static site in a replay mode that needs no server and no key. Out of scope: a browser-side BYOK agent, a prompt/eval extension for request 4 beyond two self-contained prompt texts and the `A4` scorer the capture needs, the facts component (register entry 46), the gauge caption duplicate (47), the `label` mount and venue coordinates (10, 41), the `T9-AC-02` tag rename (36), a Playwright smoke test of the deploy output (the user checks it by hand), the README (publication scope, after M3).

Decisions taken while planning; do not re-derive:

- **A button is a recording (user, 2026-09-26).** Each example prompt is recorded as the first message of a fresh conversation, per capability set. Replay looks at two things only: the loaded capability set and the clicked prompt; the transcript's history is ignored. A recording is self-contained because a model without history has to fetch its data. Free text is answered with "not recorded". The chain-with-fallback variant was considered and dropped as not worth its complexity.
- **All reachable capability sets are recorded.** Two remotes make four sets — none, `charts`, `maps`, `charts,maps` — and the panel lets a visitor reach every one of them. Sixteen recordings today; the set list is derived from the manifest.
- **Your own key means the local agent server (user, 2026-09-26).** The key belongs on a server, never in the browser; `.env.example`, `agent/src/config.ts` and `npm start` already give anyone with a key the live demo. The spec's optional `BrowserAgent` is not built; the spec is corrected in Task 6. The agent mode is therefore `local | replay`, chosen at boot like the capabilities (`?agent=`), with a build-time default: `local` in development, `replay` in the deploy build.
- **Prompts 2 and 4 become self-contained (user, 2026-09-26).** "Show them on a map" and "Reserve a ticket for me" refer to earlier answers that a recording does not have; both get wording that stands alone. The eval plays the same texts, so the gate is run once on the new strings before the capture.
- **The replay mode is labelled where it matters, not everywhere.** One line above the chat in replay mode, an "Agent" section in the existing Details panel in every mode (what replay is, the live alternative, the Native Federation DevTools link), and CopilotKit's "AI can make mistakes" line hidden while no model runs.
- **MapLibre draws on OpenFreeMap vector tiles, no key, no account.** An existing muted style (`positron`) is recoloured with the kit's values; nothing is redrawn. The popup shows the label only: a neutral primitive cannot know ticket counts, the detail view beside the map shows them.
- **Register entries taken in:** 8 (map label collision → MapLibre), 21 (replay — superseded by set × button, ticked with that note), 25 (deploy manifest with relative URLs), 30 (extract the eval's drive loop). Left open: 24 (no automated boot check; the manual check is noted), 46, 47, 10, 41, 36, 33.

Conventions of the earlier scopes stay in force: zoneless, OnPush, signals-first, `inject()`, standalone, `templateUrl`/`styleUrl` with their own files; a remote reads `--cf-*` through private aliases with the token value as fallback and imports no host CSS; nothing reachable from a `vocabulary.ts` imports Angular; the static prompt names no custom component; dev servers, model calls and Chromium run outside the sandbox; task logs are English. Order: Task 1 and Task 3 before Task 4 (the chat spec clicks reserve and replays the format), Task 3 before Task 5 (the deploy build configuration), Task 2 independent of the recordings (the vocabulary does not change), Task 6 last.

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

## Task 1: Reserve handler and ConferenceStore

### Instructions

Request 4's click path, without the model. A surface's reserve `Button` carries
`action: { event: { name: 'reserve', context: { id: { path: '<selection>/id' } } } }`; the renderer
resolves the context and hands the action to the shell's `A2uiActionBus`. Build the two pieces the
spec asks for:

**`ConferenceStore`** (`src/app/domain/conference.store.ts`, `providedIn: 'root'`, signals): the
reservations of this page, in memory — a count per conference id. `reserve(id)` adds one;
`applyReservations(confs)` returns the conferences with `remaining` reduced by their count, never
below zero. Nothing is persisted; a reload starts fresh. `SurfaceDataStore.confs` applies the
reservations, so every surface rendered later — the client mounts `/filteredConfs` and pre-sets
`/selectedConf` from it — carries the reduced number without the tool or the model knowing.

**Reserve handler** (`src/app/a2ui/reserve-handler.ts`): subscribes to the bus for the app's
lifetime (an environment initializer in `createAppConfig`, so the chat and the playground both have
it). On an action named `reserve` whose resolved context carries a string `id`: record the
reservation, then update the surface the action came from (`action.surfaceId`) through the renderer,
never by writing the data model directly: one `updateDataModel` message per place the conference
sits in that surface's data model — every top-level entry that is an object with that `id`
(`<key>/remaining`) and every element of a top-level array with that `id` (`<key>/<i>/remaining`),
the value being the store's current remaining count. Searching by id keeps the handler independent of
the selection path the model chose. Any other action name is ignored; an unknown id is logged and
ignored; at zero nothing changes. The playground's logger stays subscribed beside it.

Tests: a unit spec for the store (count, clamp, `applyReservations`), a browser-mode spec for the
handler through the real renderer (the pattern of `renderer-integration.spec.ts`): a surface with a
`Gauge` on `/selectedConf/remaining`, a `Text` on `/filteredConfs/1/remaining` and the reserve
`Button`, the conference mounted under both paths; a click lowers both, a second click again, at zero
it stays; `fetch` is never called. Extend `render-surface.tool.spec.ts` with one case: after a
reservation, a new surface mounts the reduced `remaining`.

### Acceptance

- **T1-AC-01** — Given a surface whose data model holds the selected conference and the result list, when the reserve Button is clicked, the value bound to the selection's `remaining` and the same conference's entry in the list drop by one, and no request leaves the browser.
- **T1-AC-02** — Given a conference with no tickets left, clicking reserve leaves it at zero.
- **T1-AC-03** — After a reservation, every surface rendered later shows the reduced `remaining` for that conference; the store keeps the reservation for the page's lifetime.
- **T1-AC-04** — The handler finds the conference wherever the model put the selection: a surface whose selection path is not `/selectedConf` updates the same way.
- Contributes to XC-01.

### Quick functional check

With the agent running, send request 3 and click Reserve: the gauge drops by one and the network tab shows no request. Send request 3 again: the new gauge starts at the reduced value.

### Key Locations

- `src/app/a2ui/action-bus.ts` (`A2uiActionBus.subscribe`), `src/app/playground/playground.ts:242` (the subscribe-with-`DestroyRef` pattern), `src/app/a2ui/provide-a2ui-catalog.ts` (`actionHandler` → bus).
- `src/app/agent/surface-data.store.ts` (`SurfaceDataStore.confs`), `src/app/agent/tools/render-surface.tool.ts` (`createClientDataMessages` — mounts `/filteredConfs`, pre-sets `/selectedConf` to `confs[0]`), `src/app/agent/tools/render-surface.tool.spec.ts`.
- `src/app/domain/conference.ts` (`Conference`: `remaining`, `capacity`), `src/app/domain/find-conferences.ts` (`ConferenceResult`).
- `src/app/app.config.ts` (`createAppConfig` — install the handler here).
- `src/app/a2ui/renderer-integration.spec.ts` (`SurfaceHost`, gauge surface — the browser-mode pattern), `src/app/chat/chat.page.spec.ts` (`requestThreeSurface` carries a reserve Button — a ready fixture).
- New: `src/app/domain/conference.store.ts` + spec, `src/app/a2ui/reserve-handler.ts` + spec.

### Key Discoveries

- `A2uiClientAction` (`@a2ui/web_core/v0_9`) carries `name`, `surfaceId`, the resolved `context` (`{ id: 'ng-forge-berlin' }`, path bindings already looked up) and the source component id; `map.component.spec.ts` T5-AC-04 shows the shape.
- `renderer.surfaceGroup.getSurface(id).dataModel` has `get(path)` and `set(path, value)`; `'/'` is the root. Writes go through `renderer.processMessages([{ version: 'v0.9', updateDataModel: { surfaceId, path, value } }])` — the book's `increaseMiles` pattern and the channel the client mount already uses.
- The model may choose a selection path other than `/selectedConf` (the eval scorer derives it from `selected`), hence the id search instead of a fixed path.
- The remotes know nothing of this: `Gauge` re-renders its binding; the basic `Button` dispatches through the same `actionHandler` as `Map` and `Timeline`.
- The spec's §12 acceptance 3: reserving lowers the gauge without a model call and the store holds the reservation.

## Task 2: MapLibre inside mfe-maps

### Instructions

Replace the SVG scatter in `MapComponent` with a MapLibre map. The contract stays byte-identical:
`map.schema.ts`, `MAP_META`, `vocabulary.ts`, `distance` untouched; `MapProps` (`points`, `center`,
`selected`, `action`) and the four host inputs stay; a click still writes the whole point to
`selected` and dispatches `action`; `label` still falls back to `name`, then `id`.

**Basemap.** `maplibre-gl` goes into the root `package.json` (`dependencies`; one workspace, only
this remote imports it). The style is OpenFreeMap's `positron`
(`https://tiles.openfreemap.org/styles/positron`), fetched at map creation and recoloured before use:
land `#E4EAEF`, water `#CBDCE8`, borders `#B7C5D0`, labels `#64798A`, roads `#D9E3EA` — override
the paint of the matching layers by their type and source layer, keep the cartography, add only our
own layers. The colours are literal values in one constant (`map-style.ts`): they live inside the
WebGL canvas, custom properties do not reach them. Attribution stays visible (OpenFreeMap,
OpenMapTiles, OpenStreetMap contributors).

**Markers.** Dots as HTML markers (`maplibregl.Marker` with a custom element: class `cf-marker`,
`cf-selected` for the selection, `cf-center` for the user location, `data-id`), so a DOM click reaches
`pick()` and specs can click without WebGL. Default: blue dot (`--cf-rail`); selected: blue with an ink
ring (`--cf-ink`); user location: a ringed dot with the city in mono type. Marker colours through the
component stylesheet via private `--cf-*` aliases with fallbacks. Labels as a GeoJSON source plus
symbol layer — text with a light halo (surface colour) in the basemap's font stack — so MapLibre's
collision detection hides what would overlap. Two conferences in one city share coordinates; keep a
small deterministic pixel offset (the spirit of today's `declutter`) so both dots stay clickable.
Popup on selection: the label only, surface ground, 1 px ink border; drop it if it fights the ring and
record that.

**Viewport and DOM.** Fit the bounds of points plus center with padding whenever they change; a fixed
height (about 300 px) and `min-width: 20rem` on the host, `map.resize()` when the host gets its size
(a `ResizeObserver` — inside the renderer's flex rows a height-less container collapses exactly like
the viewBox svg did). MapLibre builds its own DOM, which emulated encapsulation cannot style: use
`ViewEncapsulation.ShadowDom` with `maplibre-gl.css` imported into the component stylesheet
(custom properties inherit through the shadow boundary), or `None` with prefixed selectors — the
task decides on the first render. Move the remaining inline `styles` into `map.component.css`.

**Tests.** No spec may load tiles: give the component a seam (an injectable style source or map
factory) that specs replace with an empty style. Check at task start whether `new maplibregl.Map`
initialises in Vitest's headless Chromium (WebGL via SwiftShader); if not, the factory seam returns a
fake map in specs. Update `map.component.spec.ts` (markers are `.cf-marker` elements now) and every
spec that clicks `g.cf-marker` of a map: `src/app/chat/chat.page.spec.ts` (`markersOf`),
`src/app/agent/tools/render-surface.tool.spec.ts:118`, `projects/mfe-maps/src/app/app.spec.ts:23`.
The standalone page (`app.ts`, the lighthouses) stays and becomes the visual check.

### Acceptance

- **T2-AC-01** — Given points with `lat`/`lon`, the map shows real basemap tiles in the muted mood with one marker per point and, when `center` is bound, a distinct user marker labelled with the city.
- **T2-AC-02** — Clicking a marker writes the whole clicked point to the path bound to `selected` and dispatches the bound `action`; the selected marker shows the ink ring; no request goes to the agent.
- **T2-AC-03** — Given two conferences in one city, both dots stay individually clickable and no two labels overlap at any zoom.
- **T2-AC-04** — The serialized catalog context of the maps capability (names, descriptions, schemas) is identical before and after the upgrade.
- **T2-AC-05** — The standalone page on `localhost:4202` renders the map without the shell; the remote imports no host CSS and takes its colours from `--cf-*` with fallbacks.
- **T2-AC-06** — Every existing spec that clicks a map marker still passes, and no spec fetches tiles.
- Contributes to XC-02, XC-03.

### Quick functional check

`npm run start:maps`, open `localhost:4202`: tiles in the muted mood, six lighthouse markers, Hamburg as the user marker; click one, the distance next to its name changes. In the app, request 3 at desktop and phone width.

### Key Locations

- `projects/mfe-maps/src/maps/map.component.ts` (`MapComponent`, `MapProps`, `MapPoint`, `pick`, `labelOf`; `createProjection`, `declutter`, `gridLines` go), `map.component.html`, `map.component.spec.ts` (`markersOf`, `g.cf-marker`, `configureMapsHost`), `map.schema.ts` (`MAP_META` — unchanged), `vocabulary.ts` (unchanged).
- `projects/mfe-maps/src/app/app.ts` (`LIGHTHOUSES`, `HOME`, `lighthouseSurface`), `projects/mfe-maps/src/app/app.spec.ts:23`, `projects/mfe-maps/src/styles.css`, `projects/mfe-maps/federation.config.mjs` (`shareAll`, `skip`).
- `package.json` (`dependencies` — `maplibre-gl` is not installed yet).
- `src/app/chat/chat.page.spec.ts:76` (`markersOf`), `src/app/agent/tools/render-surface.tool.spec.ts:118`.
- `docs/specs/visual-language.md:311-320` (§8.3, the kit), `docs/improvements.md:8` (the collision entry — tick).
- New: `projects/mfe-maps/src/maps/map.component.css`, `map-style.ts`.

### Key Discoveries

- The kit (spec §8.3): markers default/selected/user; labels as plain text with a light halo in symbol layers, never boxed; popup with surface ground and a 1 px ink border; basemap colours passed as values, not inherited; recolour an existing muted style, do not redraw cartography.
- One meaning per colour (design pass): selection is blue with an ink ring and never a second hue; amber never appears on the map.
- OpenFreeMap serves vector tiles and styles without a key; inspect the fetched style's layers before mapping colours (`type` and `source-layer`, not hand-picked ids). No network inside the sandbox — fetch it outside.
- Label glyphs come from the style's `glyphs` endpoint in the style's font stack; IBM Plex Mono is not available there — the user-location label may be an HTML element instead if mono type matters.
- `maplibre-gl` is shared by `shareAll` (singleton, strict) — harmless, only maps uses it; the standalone remote build and the federated build both need a look.
- Path-bound points bypass schema validation, so `label` may be missing (`name` on conferences); the fallback chain stays.
- Register entry 8: the measured label collision the SVG map could not do is MapLibre's job here.

## Task 3: ReplayAgent, recording format, agent mode and the replay notice

### Instructions

**Recording format**, `public/recordings.json`, fetched at boot like the manifest:

```json
{
  "format": 1,
  "a2ui": "v0.9",
  "capturedAt": "2026-09-26",
  "recordings": {
    "charts,maps": {
      "Which Angular conferences are coming up in the next few months?": [
        [ { "name": "findConferences", "args": { "topic": "angular" } } ],
        [ { "name": "renderSurface", "args": { "messages": [ "…" ] } } ]
      ]
    },
    "charts": {}, "maps": {}, "": {}
  }
}
```

The first key is the capability set as the URL spells it: the loaded remotes in manifest order joined
by `,`, the empty string for none. The second key is the prompt text verbatim. The value is the runs of
that answer, each run the tool calls the model made in it (name and parsed arguments) — structure
only: no data, no dates, no AG-UI ids. `format` and `a2ui` are pins; a file with other values is
refused with a console message, and replay then answers every prompt as not recorded. Types, the key
helper and the parser live in `src/app/replay/recordings.ts`.

**`ReplayAgent`** (`src/app/replay/replay-agent.ts`, `extends AbstractAgent`, the shape of the test
seam `MockAgent`): `run(input)` takes the set key from the loaded capabilities, the prompt from the
last user message, and the run index as the number of assistant messages after that user message.
Recording found and index in range: the events for that run's calls. Index beyond the runs: an empty
run. No recording: a `messageWidget` call saying the question was not recorded and how to run the
live version. Every `surfaceId` inside a replayed `renderSurface` gets a per-playback suffix (the
run id), because the shell rejects an existing id and a second click replays the same recording.
Tool-call and message ids derive from `input.runId`. The event synthesis (`toolCallsRun`,
`toolCallRun`, `emptyRun`, `runStarted`, `runFinished`) moves from `src/app/testing/mock-agent.ts`
into production code (`src/app/replay/scripted-run.ts`); `MockAgent` imports it from there.

**Agent mode** (`src/app/agent/agent-mode.ts`): `local | replay`; `?agent=` wins, else the build
default from `src/environments/environment.ts` (`local`) replaced by `environment.deploy.ts`
(`replay`) through a `deploy` configuration on the shell's `esbuild` and `build` targets
(`fileReplacements`; Task 5 adds the base href to the same configuration). The bootstrap resolves the
mode and fetches the recordings in phase one (`main.ts`, no Angular import) and hands both to
`createAppConfig` beside the remotes; the `ASSISTANT_AGENT` factory picks `HttpAgent` or
`ReplayAgent`.

**The notice.** In replay mode only, one slim row between the prompt row and the chat, on the
`--cf-sub` ground of the phone chip strip: "Replay mode · Recorded answers play back in your
browser — no model, no server. Each prompt answers on its own. How it works →"; the link opens the
capability panel's `<details>`. In every mode, the panel gets a section "Agent" below the capability
list: the mode as a row (`replay — recorded answers` or `local — agent server on localhost:3001`),
two sentences on replay (why history is ignored, that free text is not recorded), the live line
("Live: clone the repository, add one provider key to `.env`, `npm start`" — link the repository's
README), and "Inspect remotes, import map and shared packages with the Native Federation DevTools"
linking `https://native-federation.com/docs/v4/devtools/`. In replay mode hide CopilotKit's
"AI can make mistakes" line through `src/theme/copilotkit.css` under a `data-agent-mode` attribute
on the chat page, if the element is reachable from there; otherwise leave it and note it.

Tests: `replay-agent.spec.ts` with a fixture recording (set and prompt matching, run index, fresh
surface ids per playback, not recorded → `messageWidget`, refused file); `agent-mode.spec.ts`; the
chat page in replay mode: prompt 1 renders a Timeline without `fetch`, a second click renders it
again, free text yields the not-recorded text, the strip is present in replay mode and absent in
local mode, the DevTools link is present in both.

### Acceptance

- **T3-AC-01** — In replay mode, a click on an example prompt renders the recorded surface for the loaded capability set with the client's real data, and no request leaves the browser.
- **T3-AC-02** — Clicking the same prompt twice, or the prompts in any order, renders every time; the visible transcript grows and nothing breaks.
- **T3-AC-03** — Free text in replay mode answers with a text saying the question was not recorded and how to run the live version; nothing else happens.
- **T3-AC-04** — The mode is decided at boot: `?agent=` overrides the build default; a development build defaults to the local agent server, the deploy build to replay.
- **T3-AC-05** — In replay mode the page says so in one line above the chat and the panel explains replay, the live alternative and links the Native Federation DevTools; in local mode the line is absent and the DevTools link is still there.
- **T3-AC-06** — A recordings file of another format or A2UI version is refused with a console message, and every prompt then gets the not-recorded answer.
- Contributes to XC-01, XC-04, XC-05.

### Quick functional check

`ng serve shell`, open `/?agent=replay` with a hand-written one-prompt `public/recordings.json`: the strip shows, the prompt renders, the network tab shows no agent call, free text gets the note. Without the parameter: no strip, the local agent answers.

### Key Locations

- `src/app/testing/mock-agent.ts` (`MockAgent`, `toolCallsRun`, `toolCallRun`, `emptyRun`, `runStarted`, `runFinished` — synthesis moves out).
- `src/app/agent/assistant-agent.token.ts` (`ASSISTANT_AGENT` factory, `provideAssistantAgent`), `src/app/agent/render-failure-correction.ts` (`MAX_CORRECTIONS_PER_TURN` — why a rejected replayed surface would loop).
- `src/main.ts` (phase one: `fetchManifest`, `selectCapabilities`, `initFederation`), `src/bootstrap.ts` (`bootstrap(remotes)`), `src/app/app.config.ts` (`createAppConfig`), `src/app/federation/select-capabilities.ts` (`toCapabilitiesQuery` — the set key spelling), `src/app/federation/capability-status.ts` (`loadedCapabilities`), `src/app/a2ui/agent-capabilities.token.ts` (`AGENT_CAPABILITIES`).
- `src/app/chat/chat.page.ts`, `chat.page.html`, `chat-header.component.html`, `chat-header.component.css` (`.cf-prompts` — the strip goes below it), `capability-panel.component.ts`, `capability-panel.component.html` (`<details>`, `.cf-panel-head` "loaded via Native Federation"), `capability-panel.component.css`, `src/theme/copilotkit.css`, `src/app/chat/chat.page.spec.ts` (`renderChat`, `MockAgent` usage).
- `src/app/agent/tools/render-surface.tool.ts:111` (the fresh-id rejection), `src/app/a2ui/surface-host-rules.ts` (`createdSurface`, `surfaceIdOf`).
- `angular.json` (shell `esbuild` configurations, `build` targets delegating per configuration).
- `docs/improvements.md:21` (the replay entry — tick with the set × button note).
- New: `src/app/replay/recordings.ts`, `replay-agent.ts`, `scripted-run.ts` + specs, `src/app/agent/agent-mode.ts` + spec, `src/environments/environment.ts`, `environment.deploy.ts`, `public/recordings.json` (a small valid fixture until Task 4 captures).

### Key Discoveries

- `AbstractAgent.run(input: RunAgentInput): Observable<BaseEvent>`; `input.messages` is the whole transcript (user, assistant with `toolCalls`, tool results). CopilotKit runs the agent again after a `followUp: true` tool, so the run index within a turn is the count of assistant messages after the last user message.
- `RUN_STARTED`/`RUN_FINISHED` must carry the input's `threadId` and `runId`; tool-call ids must be unique across the transcript.
- The shell refuses a `createSurface` whose id already exists and starts correction runs (budget 3) — a replay must re-id its surfaces or a re-click ends in console errors.
- Recorded `renderSurface` and `messageWidget` arguments are exactly what the eval scorer accepted; the client mounts `/filteredConfs`, `/me` and `/selectedConf` after the messages as always — that is why recordings hold no data and stay fresh with the `dayOffset` data set (spec §3.5, §10).
- An unreachable remote is not loaded, so its set key is the smaller set, which has recordings too.
- Header space is tight at tablet widths (register entries 43, 44): the notice is a new row below the prompts, never a chip in the ink band. The panel's disclosure is a native `<details>`; `open = true` opens it.
- The NF `build` target delegates to the `esbuild` target per configuration name (`shell:esbuild:production`), so a `deploy` configuration needs an entry on both targets.
- Capability contract versioning (memory): the vocabulary is deliberately unversioned; the recordings file is one of the two places where a version pin matters.

## Task 4: Self-contained prompts, capture script, the sixteen recordings

Depends on Task 3 (the recording format and the `ReplayAgent`). Assumes Task 1's reserve handler for
the last check.

### Instructions

**Prompts.** In `src/app/chat/example-prompts.ts` give prompts 2 and 4 wording that stands alone,
e.g. "Show the upcoming Angular conferences on a map" and "Reserve a ticket for the next conference
near me"; prompts 1 and 3 stay (3 carries the "Where and when" cue the detail requirement depends on).
Adjust the literal `PROMPTS` in `chat.page.spec.ts`.

**Scorer.** `eval/score.ts` gets two requirements: `A4` — one surface with a `Button` dispatching
`reserve` whose `id` context is bound to `<selection>/id`, the selection path derived from that
Button, a `Text` bound to `<selection>/name`, and, when a `Gauge` is announced, a `Gauge` bound to
`<selection>/remaining`; and `host-rules` — the host rules alone (structure, no client-owned writes,
no date literal, names within the announced vocabulary) plus at least one `renderSurface` or
`messageWidget` call. Add request 4 as `A4` to the default eval scenario. Run the gate once on the new
strings (agent up, `npm run eval`) and record the figures; it must hold before anything is captured.

**Capture.** Extract the drive loop of `run-eval.ts` (`driveRequest`, `execute`, `recordSurface`,
`recordRejectedSurface`, `pendingToolCalls`, `toAgUiTool`, the session) into `eval/drive.ts` shared by
eval and capture (the file runs `main()` on import today — register entry 30); the record keeps the
calls per run, not flat per request. `eval/capture.ts`, `npm run capture`: for every capability set
of the manifest's power set (`""`, `charts`, `maps`, `charts,maps`, vocabularies as in
`scenarios.ts`) and every `EXAMPLE_PROMPTS` entry: a fresh `HttpAgent` and session, the fixed
Berlin `ME`, one request; accept when no call was rejected and the requirement below passes; retry up
to three times, then abort without writing. Write `public/recordings.json` in Task 3's format. The
file header comment says when to re-run: after any change to a prompt text, a component or function
description, the agent prompt or the manifest's remotes.

| Set | Prompt 1 | Prompt 2 | Prompt 3 | Prompt 4 |
| --- | --- | --- | --- | --- |
| `charts,maps` | A1 | A2 | A3 | A4 |
| `charts` | A1 | A2-without-maps | host-rules | A4 |
| `maps` | host-rules | A2 | host-rules | host-rules |
| none | host-rules | A2-without-maps | host-rules | host-rules |

**Proof.** A chat-page spec over the captured file (import the JSON), replay mode: with
`charts,maps` prompt 1 shows a Timeline, prompt 2 a Map with markers, prompt 3 Map plus Gauge plus
the name, prompt 4 a reserve Button whose click lowers the Gauge by one; with `charts`, prompt 2
names the missing map; `fetch` is never called. This is the spec's "agent loop without a model" row.

### Acceptance

- **T4-AC-01** — Prompts 2 and 4 read as complete questions on their own, and the eval gate holds on the new strings: A1–A4 with both capabilities and A1, A2-without-maps with charts only, each at least 4 of 5.
- **T4-AC-02** — `npm run capture` writes one recording per reachable set × example prompt (sixteen today), each with at least one tool call, no rejected call and no date literal; a set × prompt that fails its check three times aborts the run without writing.
- **T4-AC-03** — Every recording is self-contained: played as the first message of a fresh conversation it renders, because it fetches its own data.
- **T4-AC-04** — With the captured file, replay mode plays requests 1–4 with both remotes — timeline, map, detail view with map and gauge, reserve Button whose click lowers the gauge — and names the missing map with charts only; no network request in any of these.
- **T4-AC-05** — Eval and capture drive the agent through one shared module; `npm run test:eval` and `npm run eval` keep working.
- Contributes to XC-01, XC-04, XC-05.

### Quick functional check

`npm run capture` with the agent up prints sixteen `ok` lines and writes the file; `ng serve shell` with `/?agent=replay`: click the four prompts, then switch maps off and click the map prompt.

### Key Locations

- `src/app/chat/example-prompts.ts` (`EXAMPLE_PROMPTS`), `src/app/chat/chat.page.spec.ts` (`PROMPTS`), `eval/scenarios.spec.ts` (`T9-AC-02` slices — passes as is).
- `eval/run-eval.ts` (`driveRequest`, `execute`, `recordSurface`, `recordRejectedSurface`, `pendingToolCalls`, `toAgUiTool`, `RunRecord`, `ME`, `TOOL_SPECS`, `MAX_RUNS_PER_REQUEST`), `eval/scenarios.ts` (`SCENARIOS`, `announcedNames`, the two vocabularies), `eval/score.ts` (`Requirement`, `score`, `detailFailures`, `hasReserveButton`, `hostRuleFailures`, `vocabularyFailures`, `DATE_LITERAL`), `eval/score.spec.ts`.
- `package.json` (`eval` script; `capture` to add), `eval/tsconfig.json`, `eval/vitest.config.ts`.
- `public/federation.manifest.json` (the set names), `public/recordings.json` (written).
- `src/app/replay/recordings.ts`, `src/app/replay/replay-agent.ts` (Task 3).
- `docs/improvements.md:30` (recorder extraction — tick).

### Key Discoveries

- The eval harness runs under Node and imports `vocabulary.ts` files only; `tsx` fails inside the sandbox (`listen EPERM`) — run eval and capture outside it. The agent reads the repository-root `.env`; `tsx watch` has stopped reloading `prompt.ts` after a checkout before — check the agent log before a paid run. A run of `got 0` on every request means the key was refused, not a prompt regression.
- `score()` judges exactly one surface for A1–A3 and reads the announced names for `A2-without-maps`; `hasReserveButton(parts, selection)` exists; `detailFailures` derives the selection from `Map.selected` — `A4` derives it from the Button's context instead.
- `ME` fixed to Berlin keeps runs comparable; recordings never contain `me`, the client mounts the visitor's own city.
- Recorded surfaces carry the ids the model chose; Task 3 re-ids them per playback.
- Spec §10: recordings stay fresh only without dates in model output; `DATE_LITERAL` in `hostRuleFailures` is the guard, `host-rules` must include it.
- The register's line 21 spoke of ≈ 8 recordings keyed by conversation path; this task replaces that with set × button.
- Cost: sixteen requests, each one or two model calls, about the size of one `npm run eval`.

## Task 5: Static deployment

Depends on Task 3 (the `deploy` build configuration with the replay default).

### Instructions

`scripts/build-deploy.mjs`, run as `npm run build:deploy -- --base-href /path/` (default `/`): builds
`mfe-charts` and `mfe-maps` (production) and the shell with the `deploy` configuration and the given
base href; assembles `dist/deploy/`: the shell's `dist/shell/browser` at the root,
`dist/mfe-charts/browser` under `charts/`, `dist/mfe-maps/browser` under `maps/`; overwrites the
copied dev manifest with `{ "charts": "./charts/remoteEntry.json", "maps": "./maps/remoteEntry.json" }`
— the `./` prefix is load-bearing, es-module-shims treats a bare string as a bare specifier. The dev
manifest in `public/` keeps its localhost URLs; nothing in the code learns a port or a path. Print the
smoke recipe at the end, as the reference script does (rename `dist/deploy` to the base path's name
and serve `dist`).

Verify the one technical unknown and record it in the log: the NF v4 `initFederation` wrapper and the
orchestrator resolve a relative `remoteEntry.json` URL against the document (register entry 25) —
read the orchestrator's remote-URL handling, then serve `dist/deploy` from a plain static server
under the base path and confirm in the console that both remotes loaded from the relative URLs. The
visual check of the deployed page is the user's; no Playwright test here (decision 2026-09-26).
The remotes' standalone pages must be reachable under `charts/` and `maps/` of the same tree.

### Acceptance

- **T5-AC-01** — `npm run build:deploy -- --base-href /x/` produces a self-contained `dist/deploy` whose manifest points at `./charts/remoteEntry.json` and `./maps/remoteEntry.json` and whose shell defaults to replay mode.
- **T5-AC-02** — Served from a plain static file server under that base path, the shell loads both remotes from the relative URLs (both chips loaded), shows the replay line, and the four prompts play; no request goes to localhost or an agent.
- **T5-AC-03** — The remotes' standalone pages open under `charts/` and `maps/` of the same deployment.
- **T5-AC-04** — The development setup is untouched: the manifest in `public/` still names localhost, `ng serve`, `npm start` and `npm run build` behave as before.

### Quick functional check

`npm run build:deploy -- --base-href /cf/`, `mv dist/deploy dist/cf`, `npx serve dist -l 8088`, open `http://localhost:8088/cf/`: two loaded chips, the replay line, prompt 1 renders a timeline.

### Key Locations

- `package.json` (`build`, `clean`; `build:deploy` to add), `angular.json` (shell `esbuild` `production` configuration with budgets and `outputHashing`; the `deploy` configuration from Task 3; output paths default to `dist/shell`, `dist/mfe-charts`, `dist/mfe-maps`), `public/federation.manifest.json`, `src/main.ts` (`MANIFEST_URL`, `initFederation(selected)`).
- `node_modules/@angular-architects/native-federation-v4/src/index.d.ts:44` (`initFederation(remotesOrManifestUrl?, options?)`), `node_modules/@softarc/native-federation-orchestrator` (remote URL resolution — to read).
- `~/projects/FrankensteinMeetingRoom/scripts/build-deploy.mjs` (reference: assemble step, `./` manifest, smoke recipe; its SRI passes are out of scope).
- `docs/improvements.md:25` (deploy manifest — tick), `:24` (boot check — stays open, note the manual check).
- New: `scripts/build-deploy.mjs`.

### Key Discoveries

- `ng build shell` runs the NF builder, which caches external artifacts; `npm run clean` when switching between `ng build` and `ng serve` (README). `dist/` is git-ignored.
- The NF builder emits `remoteEntry.json` and the import map per app; the shell's `index.html` carries es-module-shims as a polyfill. `--base-href` rewrites `<base href>` and the asset URLs; fonts, `nf-mark.png` and `recordings.json` are shell assets and follow it.
- Spec §3.4 "Manifest = Deployment": the deploy manifest is the only place that knows the layout; the shell fetches `federation.manifest.json` relative to its base.
- Spec §12 acceptance 6: the hosted demo runs statically in a clearly labelled replay mode without an API key. SRI is named in the README later, never built (publication plan).

## Task 6: Docs — reserve, replay, map zone, spec on both sides

### Instructions

Documentation only. `docs/architecture.md`: in the click section the `reserve` path (bus → handler
→ store → `updateDataModel`, no model); the agent modes (`local`, `replay`: the recordings file, key
set × prompt, self-contained answers, re-id per playback, the not-recorded answer; your own key means
the local server); a recordings invariant under "Invariants worth knowing" (structure only, no dates,
format and A2UI pins, re-capture after any change to a prompt text, a description, the agent prompt or
the remote set); the `Map` row of "Styling zones" (private `--cf-*` aliases in the component, basemap
colours as literals inside the canvas) and `maplibre-gl`/OpenFreeMap under "Layers and ownership";
the deploy layout next to "Manifest = Deployment"; the "how to read" rows; "Status and history" gets
the M3 bullet with dates and Task 4's eval figures. Body text carries no task numbers, AC IDs or plan
references.

`docs/how-it-works.md`: request 4 in the walk-through (reserving without the model), a replay
paragraph (what a visitor sees, why history is ignored, the live alternative), MapLibre where the map
is described; the DevTools mention exists already.

`docs/spec.md` (German; change both sides identically — the copy is
`~/projects/a2ui/docs/spec/spec-federated-capabilities.md`, byte-identical afterwards): status line
v3.5 with the date; §3.8 "Keine Chart-/Karten-Bibliothek: alles SVG" → MapLibre inside maps; §4 the
`Map` row; §8 M3: `BrowserAgent` BYOK replaced by "eigener Key = lokaler Agent-Server", replay keyed
by set × prompt with self-contained prompts; §12 acceptance 6 accordingly; §9 a new row E10 for both
decisions (2026-09-26). `docs/specs/visual-language.md` §8.3: one status sentence (implemented, popup
label only). `docs/improvements.md`: tick 8, 21, 25, 30 with their notes; 24 stays open with "manual
check only"; nothing speculative added. `README.md` stays — the `publication` scope rewrites it.

### Acceptance

- **T6-AC-01** — From the architecture doc alone a reader can explain how a reserve click reaches the gauge without the model, what a recording contains and when it must be re-captured, and how the deploy build differs from the development setup.
- **T6-AC-02** — The project spec and the a2ui copy are byte-identical, and both say that your own key means the local agent server and that the map is MapLibre.
- **T6-AC-03** — The bodies of the architecture doc and the tour carry no task numbers, AC IDs or plan references; only "Status and history" does.

### Quick functional check

A grep for `Task [0-9]`, `T[0-9]-AC` and `plan.md` over `docs/architecture.md` and `docs/how-it-works.md` hits only the closing status section; `diff docs/spec.md ~/projects/a2ui/docs/spec/spec-federated-capabilities.md` is empty.

### Key Locations

- `docs/architecture.md` — "How to read" (20), "Boot" (123), "One chat turn" (154), "Layers and ownership" (280), "Styling zones" (348), "Invariants worth knowing" (372), "Federation and boundaries" (433), "The eval harness" (528), "Status and history" (542).
- `docs/how-it-works.md` — "How the shell finds its remotes" (283), "Data stays in the browser" (335), "What happens on a click" (373), the DevTools links (237, 413).
- `docs/spec.md` — status (3), §3.8 (122), §4 `Map` row (133), §8 M3 (182), §9 (227, after E9), §12 (249); the a2ui copy.
- `docs/specs/visual-language.md:311` (§8.3), `docs/improvements.md` (8, 21, 24, 25, 30).

### Key Discoveries

- Docs conventions: reference docs need a reading thread; bodies stay independent of the workflow; the CopilotKit load-order invariant stays canonical in `src/theme/copilotkit.css`; each invariant in one place.
- The spec mirror is uncommitted on the a2ui side (repository without a first commit); a one-sided edit is a defect.
- The memory on contract versioning: the vocabulary is unversioned by design; the recordings file and the M2 envelope are the two places a version pin belongs — state that once, in the recordings invariant.

## Cross-Cutting Acceptance

- **XC-01** — Request 4 end to end without a model: in replay mode with both remotes, the fourth prompt renders a reserve Button and its click lowers the gauge; a later surface shows the reduced count. **Touches:** T1, T3, T4.
- **XC-02** — The `Map` vocabulary and the agent prompt are byte-identical before and after the MapLibre upgrade; recordings made before it still play. **Touches:** T2, T4.
- **XC-03** — A remote imports no host CSS and the shell imports nothing from a remote; `npm run lint:boundaries` stays green with `maplibre-gl` and the replay code in place. **Touches:** T2, T3.
- **XC-04** — The deploy build answers every example prompt in every reachable capability set without a request beyond the site's own files and the map tiles. **Touches:** T3, T4, T5.
- **XC-05** — Nothing in `agent/` changes: the same server records the answers and serves the local mode with a key. **Touches:** T3, T4, T5.
