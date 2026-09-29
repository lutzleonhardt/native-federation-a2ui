# Plan: ConferenceFinder — M3: Reserve, map upgrade, hosting

Spec: `docs/spec.md` (Entwurf v3.4, 2026-09-25) — §8 "M3 — Reserve, Karten-Upgrade, Hosting", with request 4 (§2, line 42), store and handler (§5, line 145), the client event rule (§6, line 154), the test matrix (§7, lines 166–167), the freshness risk (§10, line 236) and acceptance 3 and 6 (§12); the map kit in `docs/specs/visual-language.md` §8.3. Predecessor: `docs/work/visual-language/plan.md` (the design pass, merged to `main` 2026-09-25: the Departure look across shell chrome, chat frame, primitives, `Timeline` and `Gauge`; eval gate 5/5 on the final strings; the map left for this scope).
Scope: the `reserve` handler (request 4's click path), MapLibre inside `mfe-maps`, hosting as a static site in a replay mode that needs no server and no key, and (since 2026-09-28) the slider distance filter as a catalog function inside `mfe-maps` (Task 3.5). Out of scope: a browser-side BYOK agent, a prompt/eval extension beyond the four badge texts and the re-pointed eval of the 2026-09-28 amendments (Task 4), the user's own reservations (register entry from Task 1, sharpened in Task 6), the facts component (register entry 46), the gauge caption duplicate (47), the `label` mount and venue coordinates (10, 41), the `T9-AC-02` tag rename (36), a Playwright smoke test of the deploy output (the user checks it by hand), the README (publication scope, after M3).

Decisions taken while planning; do not re-derive:

- **A button is a recording (user, 2026-09-26).** Each example prompt is recorded as the first message of a fresh conversation, per capability set. Replay looks at two things only: the loaded capability set and the clicked prompt; the transcript's history is ignored. A recording is self-contained because a model without history has to fetch its data. Free text is answered with "not recorded". The chain-with-fallback variant was considered and dropped as not worth its complexity.
- **All reachable capability sets are recorded.** Two remotes make four sets — none, `charts`, `maps`, `charts,maps` — and the panel lets a visitor reach every one of them. Sixteen recordings today; the set list is derived from the manifest.
- **Your own key means the local agent server (user, 2026-09-26).** The key belongs on a server, never in the browser; `.env.example`, `agent/src/config.ts` and `npm start` already give anyone with a key the live demo. The spec's optional `BrowserAgent` is not built; the spec is corrected in Task 6. The agent mode is therefore `local | replay`, chosen at boot like the capabilities (`?agent=`), with a build-time default: `local` in development, `replay` in the deploy build.
- **Prompts 2 and 4 become self-contained (user, 2026-09-26).** "Show them on a map" and "Reserve a ticket for me" refer to earlier answers that a recording does not have; both get wording that stands alone. The eval plays the same texts, so the gate is run once on the new strings before the capture. *Superseded 2026-09-28: all four badges are rewritten, see the four-forms decision below.*
- **The replay mode is labelled where it matters, not everywhere.** One line above the chat in replay mode, an "Agent" section in the existing Details panel in every mode (what replay is, the live alternative, the Native Federation DevTools link), and CopilotKit's "AI can make mistakes" line hidden while no model runs.
- **MapLibre draws on OpenFreeMap vector tiles, no key, no account.** An existing muted style (`positron`) is recoloured with the kit's values; nothing is redrawn. The popup shows the label only: a neutral primitive cannot know ticket counts, the detail view beside the map shows them.
- **Register entries taken in:** 8 (map label collision → MapLibre), 21 (replay — superseded by set × button, ticked with that note), 25 (deploy manifest with relative URLs). Left open: 24 (no automated boot check; the manual check is noted), 30 (the drive-loop extraction — dropped from Task 4 on 2026-09-28), 46, 47, 10, 41, 36, 33.
- **Four badges, four forms (user, 2026-09-28; fix-lane log `docs-demo-variation-decisions`).** The four example prompts converged on one answer, Timeline, Map and Gauge in nearly every surface, for three reasons: they queried one data slice (Angular, upcoming); the prompt's wiring and detail rules reward a selection component plus a detail Card for every question; and the scorer forbids nothing extra, so the capture would have accepted the convergent answers. Decided: the badges are a timeline (when), a map with a distance slider (where), a three-Card comparison, and the explore-and-reserve detail view. Reserving is the Button click in badge 4, not a badge of its own; spec §2 already defines request 4 as the click. The form rules live in the system prompt, and the capture requirements carry a negative list per badge, so the hosted demo's variation is fixed at capture time while the badge texts stay natural questions. Supersedes "Prompts 2 and 4 become self-contained". *Amended 2026-09-28 (Task 4's start): the negative lists are the checklist for the eye at capture, not scorer code; the eval keeps its three requirements and judges the badges they still fit.*
- **The distance filter is a catalog function in `mfe-maps`, not a third remote (user, 2026-09-28).** Spec §8b.1 proposed `mfe-filter` for `withinKm`; a third selectable remote would double the recording matrix to eight sets and grow manifest, panel and deploy script. The function sits beside `distance`; the Slider is the basic catalog's. The renderer already re-evaluates a function-call prop when an argument path changes (`DataContext.resolveSignal`), so a Slider drives the Map without a model call. The one contract change: `binding()` must accept the call shape, because the processor validates every custom prop against its schema. Deliberately less than §8b.1 asked for.
- **`reserved` per conference is deferred (user, 2026-09-28).** A `reserved` field in the existing `applyReservations` join plus a second write per fixed home would make "your tickets" bindable. It adds legibility, not a new mechanism (the gauge already carries the cross-surface state), lies beside the federation thesis, and costs prompt budget on the detail Card, the requirement with the least slack. The Text-renders-0-as-empty defect it would have exposed is fixed anyway in Task 3.5. The register entry on the user's reservations is sharpened in Task 6 with both variants (field in the join; `onlyReserved` filter plus a totals mount). Weighed in the same review and dropped: a `BarChart` on `/byTopic`, a `sortBy` tool argument, a `myReservations` tool, a facts component, a Timeline-plus-Map badge, a third remote; each a second instance of a shown point, off the thesis, or a doubled recording matrix.

Conventions of the earlier scopes stay in force: zoneless, OnPush, signals-first, `inject()`, standalone, `templateUrl`/`styleUrl` with their own files; a remote reads `--cf-*` through private aliases with the token value as fallback and imports no host CSS; nothing reachable from a `vocabulary.ts` imports Angular; the static prompt names no custom component; dev servers, model calls and Chromium run outside the sandbox; task logs are English. Order: Task 1 and Task 3 before Task 4.5 (the proof spec clicks reserve and replays the format), Task 3 before Task 5 (the deploy build configuration), Task 2 independent of the recordings (the vocabulary does not change), Task 3.5 before Task 4 (the vocabulary, the announced schemas and the rendering of a bound 0 change before the gate runs) and independent of Task 3, Task 4 before Task 4.5 (badges and prompt must be final before anything is captured; split at task start on 2026-09-28), Task 6 last.

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
- **T1-AC-04** — *(amended 2026-09-26)* The selection has one fixed home, `/selectedConf`: a surface that binds `selected` or the reserve context elsewhere is rejected at the `renderSurface` boundary with a correction naming the path; the handler writes only the list entry and the selection, an object elsewhere with the same id stays untouched.
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
- New: `src/app/replay/recordings.ts`, `replay-agent.ts`, `scripted-run.ts` + specs, `src/app/agent/agent-mode.ts` + spec, `src/environments/environment.ts`, `environment.deploy.ts`, `public/recordings.json` (a small valid fixture until Task 4.5 captures).

### Key Discoveries

- `AbstractAgent.run(input: RunAgentInput): Observable<BaseEvent>`; `input.messages` is the whole transcript (user, assistant with `toolCalls`, tool results). CopilotKit runs the agent again after a `followUp: true` tool, so the run index within a turn is the count of assistant messages after the last user message.
- `RUN_STARTED`/`RUN_FINISHED` must carry the input's `threadId` and `runId`; tool-call ids must be unique across the transcript.
- The shell refuses a `createSurface` whose id already exists and starts correction runs (budget 3) — a replay must re-id its surfaces or a re-click ends in console errors.
- Recorded `renderSurface` and `messageWidget` arguments are exactly what the eval scorer accepted; the client mounts `/filteredConfs`, `/me` and `/selectedConf` after the messages as always — that is why recordings hold no data and stay fresh with the `dayOffset` data set (spec §3.5, §10).
- An unreachable remote is not loaded, so its set key is the smaller set, which has recordings too.
- Header space is tight at tablet widths (register entries 43, 44): the notice is a new row below the prompts, never a chip in the ink band. The panel's disclosure is a native `<details>`; `open = true` opens it.
- The NF `build` target delegates to the `esbuild` target per configuration name (`shell:esbuild:production`), so a `deploy` configuration needs an entry on both targets.
- Capability contract versioning (memory): the vocabulary is deliberately unversioned; the recordings file is one of the two places where a version pin matters.

## Task 3.5: Slider distance filter in mfe-maps, call-shaped bindings, the zero fix

> Added 2026-09-28 by the demo-variation amendment (fix-lane log `docs-demo-variation-decisions`).
> Independent of Task 3; before Task 4, because the vocabulary, the announced schemas and the
> rendering of a bound 0 change, and nothing may be recorded before that.

### Instructions

**`withinKm`** (`projects/mfe-maps/src/maps/within-km.fn.ts`, announced in `vocabulary.ts` beside
`distance`): `withinKm({ points, center, maxKm })` returns the points whose haversine distance to
`center` is at most `maxKm` kilometres, in input order. `points` is an array of objects with
`lat`/`lon` (extra fields pass through, as with `Map.points`), `center` a `lat`/`lon` object, `maxKm`
a non-negative number; `returnType: 'array'`. The description tells the model what it is for: bind it
to a `Map`'s `points` with `points` bound to `/filteredConfs`, `center` to `/me` and `maxKm` to the
path a `Slider` writes, e.g. `/filter/maxKm`, so the map follows the slider without a new request.
Nothing reachable from `vocabulary.ts` imports Angular (the eval reads it under Node).

**Call-shaped bindings.** `shared/capabilities/binding.ts` accepts a third alternative beside the
literal and the path: `{ call: string, args: Record<string, unknown>, returnType?: … }`, the shape of
web_core's `FunctionCallSchema` (`src/v0_9/schema/common-types.js`), defined locally on the root
`zod/v3` line and never imported from web_core's nested zod copy (the register's `k._parse is not a
function`). The processor validates every custom prop with `componentApi.schema.safeParse` before it
mutates state, so without this a `Map` with a call on `points` is refused before the renderer sees it.
The announced JSON schema of every custom prop then shows three alternatives; the catalog-context
spec follows.

**Slider look.** The basic `Slider` exposes `--a2ui-slider-thumb-color` and
`--a2ui-slider-track-color`; map them in `src/theme/a2ui.css` to the kit's rail and line colours,
where the other `--a2ui-*` hooks are mapped. Decide the exact values on the first render.

**The zero fix.** `@a2ui/angular` 0.10.5 computes a basic `Text` as `props.text.value() || ''`
(`fesm2022/a2ui-angular-src-v0_9.mjs:823`), so a bound 0 renders empty: "0 km" for a visitor whose
city hosts a conference, `daysUntil` on the event day. Patch the one line to `?? ''` with
`patch-package` (`patches/`, a devDependency, `postinstall` runs it first); the patch header names the
upstream fix. This closes the "should the demo hide it meanwhile" question of the register's
Distance-0 entry.

**Visual check.** One more static surface in the playground (`src/app/playground/playground.ts`): a
`Slider` on `/filter/maxKm` (0 to 800, initial 300), a `Text` showing the value, and a `Map` whose
`points` is the `withinKm` call over `/filteredConfs`, `/me` and that path, with the Angular
conferences mounted and Berlin as `/me`. Their distances from Berlin span 0 to about 670 km, so the
markers come one at a time. Check whether the map re-fitting its bounds on every step (the
`showMarkers` effect) is acceptable; if it jumps, fit only when the new set leaves the current
bounds, and record the choice.

**Tests.** `within-km.fn.spec.ts` (inside, on the edge, outside, empty, pass-through of extra
fields); a `binding` spec (a call-shaped value passes the `Map` schema, an unknown key in `points`
still fails); the catalog-context spec updated for the third alternative; a renderer spec through the
real renderer (the `renderer-integration.spec.ts` pattern) with Slider, Map and `withinKm`: writing
the slider path through the data model changes the marker count, `fetch` is never called; a Text
bound to 0 renders "0". `npm run test:eval` still imports `vocabulary.ts` under Node.

### Acceptance

- **T3.5-AC-01** — Given a surface with a `Slider` whose `value` binds a path and a `Map` whose `points` is a `withinKm` call over `/filteredConfs`, `/me` and that path, moving the slider adds or removes markers, and no request leaves the browser.
- **T3.5-AC-02** — A call-shaped value is accepted for every custom prop at the `renderSurface` boundary and by the processor; the serialized catalog context shows the call alternative on every custom prop; a malformed prop is still rejected.
- **T3.5-AC-03** — A basic `Text` bound to the number 0 renders "0".
- **T3.5-AC-04** — The maps vocabulary announces `withinKm` with its description under Node; `npm run lint:boundaries`, the maps standalone page and every existing spec stay green.
- Contributes to XC-03, XC-04.

### Quick functional check

`npm run start`, open the playground: the new surface shows the slider at 300 km with Berlin, Leipzig and Hamburg; pull it to 800 and all nine Angular markers are there; the network tab shows tiles only. In the chat with a key, ask badge 2's question once and watch the markers follow the slider.

### Key Locations

- `projects/mfe-maps/src/maps/distance.fn.ts` + `distance.fn.spec.ts` (the function pattern), `geo.ts` (`haversineKm`), `vocabulary.ts` (`functions`), `map.schema.ts` (`points` uses `binding`).
- `shared/capabilities/binding.ts`, `shared/capabilities/catalog-function.ts` (`A2uiReturnType`), `src/app/a2ui/catalog-context.ts` + spec (`toJsonSchema`).
- `src/theme/a2ui.css` (the `--a2ui-*` mapping), `src/app/playground/playground.ts` (static surfaces).
- `package.json` (`postinstall`, devDependencies), `node_modules/@a2ui/angular/fesm2022/a2ui-angular-src-v0_9.mjs:823`.
- `src/app/a2ui/renderer-integration.spec.ts` (browser-mode pattern), `projects/mfe-maps/src/maps/map.component.ts` (the `showMarkers` effect, `fit`).
- `docs/improvements.md` (the Distance-0 entry's open question).

### Key Discoveries

- `Slider` is in the A2UI basic catalog (`SliderApi`: `label`, literal `min`/`max`, `value` as a dynamic number) and implemented in the Angular renderer; `value.onUpdate` writes the bound path. No new input primitive is needed.
- `DataContext.resolveSignal` turns a `{ call }` value into a signal that re-evaluates in an `effect` whenever an argument signal changes (`rendering/data-context.js:146-201`); the Angular binder uses it for every prop, custom components included. A function returning an array is an ordinary value there.
- `processing/message-processor.js:247` runs `componentApi.schema.safeParse(properties)` for every known component before mutating; a `{ call }` on a `binding()` prop fails today with a union error, which the render tool turns into a correction run.
- `FunctionCallSchema` (`schema/common-types.js:22`): `call`, `args` as a record, `returnType` enum defaulting to `boolean`. Define the same shape locally; a union across zod copies breaks parsing.
- `TextComponent` (`a2ui-angular-src-v0_9.mjs:823`) drops falsy values; the register recorded the cause on 2026-09-24 and left the remedy open.
- The eval's `announcedNames` reads `vocabulary.functions`, so `withinKm` reaches the scorer without a change there.
- After a lockfile change, `ng test` rewrites the vite deps cache the running dev server serves (`ngDevMode is not defined`): restart that server, never `pkill -f` an `ng serve` pattern.

## Task 4: Self-contained badges, the form rules and the re-pointed eval

> **Amendment (2026-09-26, from Task 1):** the selection path is fixed to `/selectedConf` and the
> path is client-owned (`CLIENT_OWNED_SEGMENTS`, `findSelectionPathViolations` in
> `surface-host-rules.ts`). Carry it to the model side in this task, on the eval run planned here:
> the prompt's "`<the selection path>/id`" becomes "`/selectedConf/id`" with one sentence that the
> selection always binds `/selectedConf`; the scorer stops deriving the selection path and checks
> the fixed one (`hasReserveButton`, `score.spec.ts` "follows the selection path the model chose").
> On the same run, give the model the conference's fields (user decision, 2026-09-26): one
> sentence in the `findConferences` tool description (`find-conferences.definition.ts`, shared with
> the eval) listing every field of a mounted entry — id, name, topic, city, country, lat, lon, date
> (ISO), capacity, remaining, price, url, and distanceKm when the user's location is known — plus a
> test that every key of `ConferenceRecord` appears in that sentence, so the list cannot drift from
> the type. The prompt examples stay; the list fills the gaps between them. Today the model knows
> the fields only from prompt examples and component schema descriptions.
> *(Superseded 2026-09-28: there is no reserve badge, see the next amendment.)* The self-contained wording of prompt 4 must pin its conference through the filters that exist —
> topic, date window, distance from the user ("the next Angular conference near me") — never a
> name or a city: `findConferences` has no name filter and the selection is client-owned, so a
> named conference reaches the card only when it happens to be the nearest or the next one
> (Task 1's live check: "the conference in Munich for Angular" worked from Munich by distance and
> from Dresden by date, ng-atlas Munich being the next Angular conference; ng-foundry Vienna would
> not; register entry).
>
> **Amendment (2026-09-28, from the demo-variation review, fix-lane log `docs-demo-variation-decisions`):**
> the four badges are rewritten so that each renders a different form; reserving is the Button in
> badge 4's Card, no badge of its own, so `A4` is not added. The prompt gets one paragraph of form
> rules and one control rule, the scorer a negative list per requirement, and the eval plays every
> badge as the first message of a fresh session, as the capture does; the demo never shows a
> history-dependent answer. Depends on Task 3.5 (`withinKm`, call-shaped bindings, the zero fix).
> The four texts, the requirements, the matrix and the amended acceptance criteria are written into
> the sections below. `docs/demo-variation-assessment.md`, the review's working paper, was deleted
> on 2026-09-28 in favour of this amendment and the fix-lane log.
>
> **Amendment (2026-09-28, at task start):** the task is split at the eval gate. Task 4 keeps the
> badge texts, the prompt, the scorer, the matrix as the shared source of requirements and the
> extraction of the drive loop; Task 4.5 takes the capture script, the sixteen recordings and the
> replay proof. The gate is a paid, possibly iterative step with a decision of its own (the badge-2
> fallback), and the recordings are a large generated diff that deserves its own commit and review.
> T4-AC-02 to T4-AC-04 moved to Task 4.5 as T4.5-AC-01 to T4.5-AC-03; T4-AC-05 keeps its eval half
> here and gives its capture half to T4.5-AC-04.
>
> **Amendment (2026-09-28, at task start, second):** the user replaced the mechanical form check
> with the eye. The capture happens in the browser through a dev-only recorder (Task 4.5), and a
> recording only has to be right once, so the scorer does not learn the four forms. Dropped from this
> task: the negative lists, `A-compare`, the call-aware `A2`, the matrix, the drive extraction
> (`eval/drive.ts`; register entry 30 stays open), the record in recording format and the seven-cell
> gate. Kept: the four badge texts, the prompt's form rules and control rule, Task 1's amendment (the
> fixed selection path, the field list), and the eval re-pointed at the badges its three requirements
> still fit — badge 1 → `A1` and badge 4 → `A3` with both capabilities, badge 1 → `A1` and badge 2 →
> `A2-without-maps` with charts only — each badge as the first message of a fresh session. Badge 2
> with maps and badge 3 are not scored; the user's eye judges them against the Badges section, once
> in this task (T4-AC-06) and again at capture.
> T4-AC-01 and T4-AC-05 are reworded below; the Scorer, Drive and Matrix paragraphs give way to Eval.

Depends on Task 3.5 (`filterWithinKm`, call-shaped bindings, the zero fix): the announced context the
gate runs against.

### Instructions

**Badges** *(amended 2026-09-28)*. `src/app/chat/example-prompts.ts` carries these four texts, sent
verbatim, natural questions without steering clauses (the form rules live in the system prompt):

1. "Which Angular conferences are coming up in the next six months?" — a Timeline alone; no Map, Gauge or Slider.
2. "Where are the Angular conferences around me? Let me narrow them down by distance with a slider." — a Map with `/me`, a Slider and a Text with the kilometre value; the markers follow the slider and the slider's path is initialised (markers before the first move); no Gauge, Timeline or Card. Without maps: the text names the missing map or distance filter, no Slider and no Map in any surface (a Timeline may stand in).
3. "Compare the next three Angular conferences: date, city, ticket price and tickets left." — a Row of three Cards bound by index (`/filteredConfs/0` … `/2`, `limit: 3`), each with name, date, city, the price through `formatCurrency` and a Gauge; no reserve Button, no Map, no Timeline.
4. "Where and when is the next Angular conference near me? When I click one, I want details and a way to reserve a seat." — the proven request-3 form: a Map with the selection at `/selectedConf` and a Card with name, `daysUntil`, `distance`, Gauge and the reserve Button; a Timeline bound to the same selection may accompany the Map (the question asks where *and* when; accepted at the T4-AC-06 click, 2026-09-29); no Slider.

Adjust the literal `PROMPTS` in `chat.page.spec.ts`; the two badge-1 keys of Task 3's fixture in
`public/recordings.json` follow the new text, so replay keeps its one recorded button until Task 4.5.
The four forms above, with their "no …" clauses, are the checklist the eye judges the capture against.

**Prompt.** One paragraph in `WIRING_RULES`, "Answer the form asked": an overview question gets only
its overview component, a timeline for when, a map for where; a comparison gets one Card per
conference bound by index and no reserve Button, because the Button belongs to the selected
conference at `/selectedConf` alone; the full detail Card with Gauge, days, distance and the Button
only when the user asks for details or an action on one conference; never add a Map or Timeline the
user did not ask for. One control rule beside it: a control the user asks for must drive something.
Bind a `Slider`'s value to a path and feed that path into a catalog function that computes what a
component shows; if no listed function consumes it, name the gap and draw no control. The
"One conference's details" section is scoped to the selected conference. Task 1's amendment above
(the fixed selection path, the typed field list) rides on the same run. *(2026-09-29, at the
T4-AC-06 click: the model wrote `Slider.step`, a key the strict basic schema lacks, because the basic
catalog reached it by name only. The catalog entry now carries `basic`, every basic component with its
prop names (`catalog-context.ts`, about 1 000 characters); the decision and its alternatives are
in `architecture.md` "Prompt and vocabulary".)*

**Eval** *(amended 2026-09-28, second; replaces Scorer, Drive and Matrix)*. `eval/scenarios.ts`
re-points the two scenarios at the badges the scorer's three requirements still fit: `charts,maps`
plays badge 1 as `A1` and badge 4 as `A3`; `charts` plays badge 1 as `A1` and badge 2 as
`A2-without-maps`. Each request is the first message of a fresh session — `run-eval.ts` creates the
`HttpAgent` per request, not per run — as the capture and the replay do. `eval/score.ts` changes
only where it would otherwise lie: `A3` requires the selection at `/selectedConf` instead of
deriving it from `Map.selected` (Task 1's amendment; `score.spec.ts` "follows the selection path
the model chose" flips), and `A2-without-maps` accepts a text naming the map or the distance filter
and fails a `Slider` in any surface (the ineffective control of spec §7). Badge 2 with maps and
badge 3 are not scored; the user clicks each once in the running shell (T4-AC-06). Run the gate once on the new strings (agent up, `npm run eval`) and record
the figures: four cells, five runs each. Should a cell miss 4 of 5 twice, iterate the prompt once
and record it; the badge-2 fallback (the plain map question) is Task 4.5's, decided by the eye.

### Acceptance

- **T4-AC-01** — *(amended 2026-09-28, second)* The four badge texts read as complete questions on their own, and the eval gate holds on them: A1 and A3 with both capabilities, A1 and A2-without-maps with charts only, each at least 4 of 5, every badge played as the first message of a fresh session.
- **T4-AC-05** — *(amended 2026-09-28, second)* The model side carries Task 1's rule: the prompt names `/selectedConf/id` and the form rules, the `findConferences` description lists every field of a mounted conference but `dayOffset` (the input `date` is derived from), pinned by a test against a real result, and `A3` requires the selection at `/selectedConf`.
- **T4-AC-06** — *(added 2026-09-29)* Badge 2 and badge 3, clicked once each in the running shell with both remotes (local agent mode), render the form of the Badges section — the slider form with markers before the first move, three comparison Cards without a reserve Button; judged by the user's eye and reported in the task log.
- Contributes to XC-01, XC-04, XC-05.

### Quick functional check

`npm run eval` with the agent up prints the summary for `charts,maps` and `charts` with every cell at 4 of 5 or better and ends with `Gate reached.`; the figures go into the task log. Then, in the running shell with both remotes, the user clicks badge 2 and badge 3 once each and compares with the Badges section (T4-AC-06).

### Key Locations

- `src/app/chat/example-prompts.ts` (`EXAMPLE_PROMPTS`), `src/app/chat/chat.page.spec.ts` (`PROMPTS`), `public/recordings.json` (the two badge-1 keys).
- `agent/src/prompt.ts` (`WIRING_RULES`, "One conference's details", "Client events"), `agent/src/prompt.spec.ts` (the custom names stay out of the static text), `src/app/agent/tools/find-conferences.definition.ts` (the field list) plus a drift test against a real `ConferenceResult`.
- `eval/scenarios.ts` (`SCENARIOS`), `eval/scenarios.spec.ts`, `eval/run-eval.ts` (`runScenario`: the agent per request), `eval/score.ts` (`detailFailures`, `withoutMapFailures`, `MAP_WORD`), `eval/score.spec.ts`.
- `src/app/a2ui/surface-host-rules.ts` (`SELECTION_PATH`).

### Key Discoveries

- The eval harness runs under Node and imports `vocabulary.ts` files only; `tsx` fails inside the sandbox (`listen EPERM`) — run eval outside it. The agent reads the repository-root `.env`; `tsx watch` has stopped reloading `prompt.ts` after a checkout before — check the agent log before a paid run. A run of `got 0` on every request means the key was refused, not a prompt regression.
- `score()` judges exactly one surface for A1–A3 and reads the announced names for `A2-without-maps`; `detailFailures` derives the selection from `Map.selected` — this task pins it to `SELECTION_PATH`, as the shell does since Task 1.
- `ME` fixed to Berlin keeps runs comparable.
- Spec §10: recordings stay fresh only without dates in model output; `DATE_LITERAL` in `hostRuleFailures` is the guard.
- Task 3.5's deferred finding — the model may leave the Slider's path uninitialised, and `maxKm` is strict, so the map renders empty — is the eye's: at the T4-AC-06 click and at capture, where an empty map is a re-click, not a recording (→ Task 4.5); the prompt's control rule says to initialise the path.
- Cost: four cells × five runs, about 20 requests of one or two model calls each; a prompt iteration repeats the run.

## Task 4.5: Browser recorder, the sixteen recordings, the replay proof

> **Amendment (2026-09-28, at Task 4's start):** split out of Task 4, see the amendment there. The
> recording format is Task 3's.
>
> **Amendment (2026-09-28, at Task 4's start, second):** the capture moves into the browser (user
> decision): a dev-only recorder in the shell writes down what the live agent answered, the user
> clicks the sixteen cells and judges the form by eye against Task 4's Badges section.
> `eval/capture.ts`, `npm run capture`, `eval/drive.ts` and the matrix are dropped; T4.5-AC-01 and
> T4.5-AC-04 are reworded.
>
> **Amendment (2026-09-29, after the capture):** the location is part of a recording (user
> observation). The search runs again at replay, so 13 of 16 cells give the same result from every
> picker city — but a radius the model chose for Dresden empties `charts` badge 2 from Warsaw, and
> a visitor without a city has no model to say so while the `/me` bindings hit nothing. The file
> therefore names the city of its capture (`city`, a picker id — a pin like `format` and `a2ui`),
> the recorder writes the page's city and refuses a turn without one or in another city than the
> stored file, and replay pins the location to the file's city: no geolocation, the picker names
> it read-only. The sixteen cells were captured in Dresden and got the key by hand. T4.5-AC-05
> added; the Key Discoveries line on the visitor's city reversed.

Depends on Task 4 (the final badge texts and prompt, the gate held) and Task 3 (`ReplayAgent`,
`parseRecordings`). Assumes Task 1's reserve handler for the last check.

### Instructions

**Recorder.** A dev-only recorder in the shell, the counterpart of `ReplayAgent`: it subscribes to
the live agent (`agent.subscribe`, as `correctRenderFailures` does), collects each assistant
message's tool calls as one run (`{ name, args }`, the arguments parsed) and drops a run whose tool
result was not `ok` — a refused `renderSurface` never replays, the shell has no model for its
correction. When the turn ends it stores the cell (`capabilitySetKey` of the loaded remotes × the
prompt verbatim) in `localStorage`, so cells survive the page reload a set switch needs, and logs
the whole file to the console — `format`, `a2ui`, `capturedAt`, `note`, `recordings` — so the last
line is always the file to paste into `public/recordings.json`. It runs only in local agent mode and
only when asked (`?record`); replay mode never records.

**Cells.** Sixteen: the four `?capabilities=` URLs (`charts,maps`, `charts`, `maps`, none) × four
badges, local agent mode, a city picked (the recording carries no `me`, but without a location the
model binds no `/me`). The eye judges every answer against Task 4's Badges section — the form and
its "no …" clauses — and the rules the shell does not enforce: no date literal in a data write, no
`Slider` nothing consumes, the slider's path initialised (markers before the first move). A wrong
form is a re-click, not a recording. Should the slider form not come after three clicks with both
remotes, badge 2 falls back to the plain map question ("Where are the conferences within 300 km of
me?"), `example-prompts.ts` changes, and the decision is recorded; `filterWithinKm` stays announced.

**File.** Task 3's format: `format`, `a2ui`, `capturedAt`, `recordings[<set>][<prompt verbatim>] =
RecordedRun[]`, the runs verbatim as recorded. JSON carries no comments, so a top-level `note` says
when to re-record: after any change to a prompt text, a component or function description, the agent
prompt or the manifest's remotes; `parseRecordings` ignores the key.

**Proof.** A chat-page spec over the captured file (import the JSON, `parseRecordings`), replay mode: with
`charts,maps` badge 1 shows a Timeline and nothing else of the custom vocabulary, badge 2 a Map with
a Slider whose move changes the marker count, badge 3 three Cards with a Gauge each, badge 4 Map
plus Gauge plus the name and a reserve Button whose click lowers the Gauge by one; with `charts`,
badge 2 names the missing map and shows no Slider; `fetch` is never called. This is the spec's
"agent loop without a model" row.
The spec needs the chat spec's TestBed helpers (`renderReplayChat`, `clickPrompt`, the marker, gauge
and button queries); move them into a shared test harness module rather than copying them, and give
`renderReplayChat` the capability set.

### Acceptance

- **T4.5-AC-01** — *(from T4-AC-02, amended 2026-09-28, second)* `public/recordings.json` carries one recording per reachable set × badge (sixteen today), each with at least one tool call, only runs the shell accepted, and no date literal; a spec over the file pins these properties.
- **T4.5-AC-02** — *(from T4-AC-03)* Every recording is self-contained: played as the first message of a fresh conversation it renders, because it fetches its own data.
- **T4.5-AC-03** — *(from T4-AC-04, amended 2026-09-28)* With the captured file, replay mode plays badges 1–4 with both remotes — a timeline alone, a map whose markers follow the slider, three comparison cards, the detail view with map and gauge whose reserve Button's click lowers the gauge — and names the missing map, without a slider, with charts only; no network request in any of these.
- **T4.5-AC-04** — *(amended 2026-09-28, second)* The recorder records only in local agent mode when `?record` is set, drops a run with a refused call, and logs the file in the shape `parseRecordings` accepts; a spec pins the three.
- **T4.5-AC-05** — *(added 2026-09-29)* `public/recordings.json` names the picker city of its capture and a file without one is refused; the recorder writes the page's city and writes nothing without a city or when the stored file was captured elsewhere, saying why; in replay the location is the file's city for the page's lifetime — no geolocation request, the picker names it without a Change button. A spec pins each.
- Contributes to XC-01, XC-04, XC-05.

### Quick functional check

`ng serve` shell with both remotes and the agent, `/?record`: click badge 1, the console shows the file with one recording; after pasting, `/?agent=replay`: click the four prompts, then switch maps off and click the map prompt.

### Key Locations

- `src/app/replay/recorder.ts` (new) and its spec, `src/app/agent/init-agent-store.ts` (where `correctRenderFailures` is bound — the recorder hooks in beside it), `src/app/agent/agent-mode.ts` (`resolveAgentMode`, the `?record` flag), `src/main.ts`.
- `public/federation.manifest.json` (the set names), `public/recordings.json` (pasted from the console).
- `src/app/replay/recordings.ts` (`parseRecordings`, `capturedCity`, `RECORDINGS_FORMAT`, `RECORDINGS_A2UI`, `capabilitySetKey`), `src/app/replay/replay-agent.ts` (Task 3).
- `src/app/domain/location.store.ts` (`PINNED_CITY`, `pinned`, `cityId`), `src/app/chat/location-picker.component.{ts,html}` (read-only when pinned), `src/app/agent/assistant-agent.token.ts` (provides `PINNED_CITY` in replay).
- `src/app/chat/chat.page.spec.ts` (`renderReplayChat`, `clickPrompt`, `markersOf`, `gaugeValues`, `reserveButtons` — to share), a new chat-page spec over the captured file.

### Key Discoveries

- The agent reads the repository-root `.env`; `tsx watch` has stopped reloading `prompt.ts` after a checkout before — check the agent log before the paid clicks.
- Recordings never contain `me`, but they assume one: the radius the model chose and a conference it named hold for the city of the capture, so the file names that city and replay pins the location to it (amendment above).
- Recorded surfaces carry the ids the model chose; Task 3 re-ids them per playback.
- The register's line 21 spoke of ≈ 8 recordings keyed by conversation path; this task replaces that with set × button.
- Cost: sixteen clicks, each one or two model calls, plus re-clicks.

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

> **Amendment (2026-09-26, from Task 1):** be honest about what can be asked. The model's reach
> is the tools' reach: topic, date window, distance from the user's location, grouping by month or
> topic, the map, details with selection, reserving. Say so in the docs and list a handful of
> requests the architecture answers well — "all Angular conferences within 100 km of Dresden"
> (with Dresden as the location), ".NET conferences in the next 60 days", "the next one near me with the tickets left", "reserve a ticket for the next Angular
> conference near me" — and name what it cannot: a conference by name or a city other than the
> user's, the user's own reservations (both register entries from Task 1's live check). If the
> Details panel's Agent section (Task 3) has room, one line of this belongs there too.
>
> **Amendment (2026-09-28, from the demo-variation review):** the docs describe the four badges of
> Task 4's amendment and the slider filter of Task 3.5. Spec (both sides): §2 table rewritten to the
> four badges with what each proves (output vocabulary; function vocabulary driving a basic control
> without a token; composition from basic catalog and charts; the click cascade and the shell-owned
> action, request 4 staying the Button click); §3.1 the badge line; §4 a `withinKm` row under maps;
> §7 the "Fehlendes Vokabular" row gets the slider case (without maps: name the gap, draw no
> control); §8b.1 marked as realised as a function inside maps, deliberately without `mfe-filter`;
> §12 criterion 1 names the four badges; §9 rows for the four-forms and the function-in-maps
> decisions. Tour and architecture walk through the new set. `docs/improvements.md`: the entry on
> the user's reservations is replaced by the sharpened version (a `reserved` field in the
> `applyReservations` join plus a second write per fixed home, or an `onlyReserved` filter with a
> totals mount; deferred, see the plan's decisions); the Distance-0 entry notes the Task 3.5 patch.
> The example "how many per month, as a chart" was struck from the list above: no chart for it
> exists.
>
> **Amendment (2026-09-28, from Task 3.5):** the ownership rule across the federation boundary
> (register entry "Document who owns what"). `docs/architecture.md` "Layers and ownership" gets
> the table: remotes render (components) and compute (functions); reacting (handlers) is
> shell-only today, because the reserve effect lands in data another owner mounted and in the
> shell's store; remotes could ship handlers as a third contract half once a narrow host API for
> writing into surfaces exists, the event and its context are announced in the vocabulary, and
> the effect stays in the team's own backend. `docs/how-it-works.md` answers the reader's question
> after "What happens on a click": what can a team ship, and where does a button's backend call
> go — the slider as interaction without a handler, reserving as the shell-owned effect. Names
> and mechanics from Task 3.5 to carry: the function is `filterWithinKm` (not `withinKm`) inside
> maps; the announced schemas are written without `$ref`; `patches/` with `postinstall` running
> `patch-package` is an install step until an `@a2ui/angular` release carries a2ui#2604.

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

- **XC-01** — *(amended 2026-09-28)* Request 4 end to end without a model: in replay mode with both remotes, badge 4's detail Card carries a reserve Button and its click lowers the gauge; a later surface shows the reduced count. **Touches:** T1, T3, T4.
- **XC-02** — The `Map` vocabulary and the agent prompt are byte-identical before and after the MapLibre upgrade; recordings made before it still play. **Touches:** T2, T4.
- **XC-03** — A remote imports no host CSS and the shell imports nothing from a remote; `npm run lint:boundaries` stays green with `maplibre-gl`, `withinKm` and the replay code in place. **Touches:** T2, T3, T3.5.
- **XC-04** — The deploy build answers every example prompt in every reachable capability set without a request beyond the site's own files and the map tiles. **Touches:** T3, T4, T5.
- **XC-05** — Nothing in `agent/` changes: the same server records the answers and serves the local mode with a key. **Touches:** T3, T4, T5.
