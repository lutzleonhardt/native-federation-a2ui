# Plan: ConferenceFinder — Visual language "Departure"

Spec: `docs/specs/visual-language.md` (draft v1, 2026-09-19) — sections 2–9 and 12; the frames in `docs/design/departure/`. Predecessor: `docs/work/m2-nf-split/plan.md` (M2 closed and merged to `main` 2026-09-22: shell as Native Federation host, `charts` and `maps` remotes, English demo, eval gate 5/5).
Scope: one deliberate look for the demo — a station departure board: ink header band, mono numerals for every date, distance and count, blue for the line and the selection, amber for attention only — across shell chrome, chat frame, agent primitives, `Timeline` and `Gauge`, plus the one non-CSS change: prompt examples that let the model group caption/value pairs. Out of scope: the map (its kit goes to M3 MapLibre), new features, a calendar view, dark mode, empty states, keyboard or ARIA work, any change to the capability contract or a prop schema.

Decisions taken while planning; do not re-derive:

- **The frames are orientation, not a pixel spec (user, 2026-09-22).** Approximate them as simply as possible; when something is costly to build, propose an alternative or drop it and record that in the task log. Verification is a look, not a diff: no screenshot comparison against the frames. Each visual task ends with the user checking `/playground` and the app at desktop and phone width; the screenshot ritual of spec section 10a is replaced by this.
- **The theme is custom properties.** The shell declares `--cf-*` on `:root`; a remote reads them with the token value as fallback, declared once per component as private aliases (`:host { --_rail: var(--cf-rail, #2B5FA8); }`), and never imports host CSS. Library zones are reached through their own variables: A2UI's `--a2ui-*` on `:root`, CopilotKit's shadcn set under `[data-copilotkit]`. Plain CSS, no framework, no Sass; component styles stay inline in the `.ts` as today.
- **We take what CopilotKit exposes (checked in `@copilotkit/angular` 0.3.1).** `copilot-chat` forwards only `assistantMessageClass`, `reasoningMessageClass`, `messageViewChildrenClass` and the `*Component` slots. `inputContainerClass`, `featherClass`, `disclaimerClass`/`disclaimerText`, `userMessageClass`, `scrollToBottomButtonClass`, `addFileButtonClass` and `startTranscribeButtonClass` are declared on `copilot-chat-view`, the message view and `copilot-chat-input` and do not reach the top. Task 4 styles those through global CSS under `[data-copilotkit]`; no CopilotKit component is replaced. This settles the open point in spec section 10.
- **Nine tasks, one over the guideline.** The only merge that avoids a two-sitting task (2 + 3) would touch eleven files; kept apart.

M2 conventions stay in force: zoneless, OnPush, signals-first, `inject()`, standalone, `templateUrl` with its own `.html`. Nothing reachable from a `vocabulary.ts` may import `@a2ui/angular` or `@angular/core`. Existing spec hooks (`.cf-selected`, `.cf-label`, `circle`, `svg`, `path[stroke-dasharray]`, `li`, `a`, `header app-capability-panel`) stay or move with the markup. Dev servers and Chromium run outside the sandbox (chrome-devtools with the webmcp profile); a sandboxed `git status` lists device-node dotfiles in the repo root — not files.

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

## Task 1: Tokens, fonts, light-only scheme and the playground bench

### Instructions

Lay the foundation every later task reads from, and extend the bench every later task is checked on.

**Tokens.** Declare on `:root` in `src/styles.css` (today: 19 lines of layout only):

```css
--cf-ink: #10222F;           /* text, band, primary button, selection ring */
--cf-ground: #EDF1F4;        /* app background */
--cf-surface: #FFFFFF;       /* card, component frame, input */
--cf-line: #C8D3DB;          /* card border, divider, rail */
--cf-rail: #2B5FA8;          /* marker, link, SELECTION */
--cf-attention: #E1730B;     /* scarce / unreachable ONLY */
--cf-attention-bg: #FDF0E2;
--cf-attention-ink: #8A4607; /* attention text on light, 4.9:1 */
--cf-muted: #4E5F6B;         /* captions, 4.6:1 on ground */
--cf-on-ink: #9FB3C2;        /* muted text inside the band */
--cf-ink-line: #47606F;      /* chip border inside the band */
--cf-rail-on-ink: #6E9BE0;   /* dot inside the band */
--cf-level-high: #2F8F5B;    /* gauge fill above 65 % — proposal, fix on screen */
--cf-level-mid: #E2B100;     /* gauge fill 30–65 %, fill only, never text */
--cf-sub: #E3E9EE;           /* quiet fill: phone capability strip, open panel header */
--cf-font-ui: 'Archivo Variable', system-ui, sans-serif;
--cf-font-data: 'IBM Plex Mono', ui-monospace, monospace;
--cf-r-sm: 3px; --cf-r-md: 6px; --cf-r-pill: 999px;
--cf-s-1: 4px; --cf-s-2: 8px; --cf-s-3: 12px; --cf-s-4: 16px; --cf-s-5: 24px; --cf-s-6: 32px; --cf-s-7: 48px;
--cf-tap: 44px;              /* minimum hit target */
```

Add a seven-step type scale as tokens (10, 11, 12, 13, 15, 17, 21 px; names are the task's call); the gauge numerals (32/38 px) stay local to that component. Two stray colours from the frames — `#1D4478` (link hover) and `#2E4657` (separator inside the band) — each earn a token or snap to a neighbour; tick marks, the gauge track and disabled fills snap to `--cf-line`, `--cf-muted` or `--cf-sub`. No further colour tokens.

**Fonts.** Add `@fontsource-variable/archivo` and `@fontsource/ibm-plex-mono` (both OFL-1.1) to `dependencies` and import their CSS from `src/styles.css` only. Font families reach remote components by inheritance; the remotes' standalone pages use the fallback stacks. No request to a third-party font host at runtime.

**Light only, enforced.** `:root { color-scheme: only light; }` in the shell's `src/styles.css` and in both remotes' `styles.css`; the shell's body takes `--cf-ground` and `--cf-font-ui`, each remote's body the same values as literals. This is the fix for the text-contrast defect (see Key Discoveries).

**A2UI mapping** on `:root`, plain `:root` beats A2UI's `:where(:root)`: colours (`primary` = ink with `on-primary` = surface, `surface`, `border` = line, `on-background` and text = ink, caption colour = muted, the secondary/default button on surface with a line border), the six `--a2ui-font-size-*` set directly from the type scale (`Text` maps h1–h3 → 2xl/xl/l, body and h4 → m, h5 → s, caption → xs; the answer heading lands on 21 px, a facts `h3` on 17, body on 15), `--a2ui-font-family-*`, `--a2ui-border-radius`, card (surface, 1 px line, radius md, padding 20 24, no shadow), divider (1 px line), row and column gap, the three button variants (default, `primary` = ink on surface text, `borderless`). The caption is the global class `.a2ui-text.caption` (emulated encapsulation): uppercase mono, letter-spaced, muted. `Column` and `Row` own nothing but gap. A fact value must never wrap inside itself ("359 km", "2026-09-22"); when a row of facts does not fit, whole caption/value pairs move to the next line when they are grouped — and ungrouped captions and values in a plain `Row` must still read cleanly (Task 5 is revertible).

**Bench.** Extend `/playground` (`src/app/playground/playground.ts`, `playgroundMessages()`) with a second section below the Berlin sample: a `Card` with a `Divider`, caption/value pairs grouped (a `Column` per pair inside a `Row`) and ungrouped (captions and values flat in one `Row`), the three button variants, a `messageWidget` text (render `app-message-widget` with a hand-built completed tool call), a `Timeline` with thirty items spread over a year and one with four items within one week (generated items: `id`, `label`, `date`). The Berlin sample and its `Map` stay as they are.

### Acceptance

- **T1-AC-01** — With the operating system (or DevTools emulation) in dark mode, the shell and both remotes' standalone pages look exactly as in light mode.
- **T1-AC-02** — Every `Text` variant inside an answer reads at ≥ 4.5:1 against the chat ground; the city/date line and the value next to a caption are no longer near-white.
- **T1-AC-03** — The app makes no request to a third-party font host; Archivo and IBM Plex Mono are served from the app's own origin.
- **T1-AC-04** — On the bench, `Column` and `Row` draw no border or background, `Card` draws the panel border, `Divider` draws the hairline, and a caption is uppercase mono in the muted colour.
- **T1-AC-05** — On the bench at desktop and phone width no fact value wraps inside itself; a grouped pair moves as a whole; ungrouped captions and values in a plain `Row` still read cleanly.
- **T1-AC-06** — `/playground` shows the card with divider, both pair variants, the three button variants, a `messageWidget` text, a thirty-item timeline and a four-items-in-a-week timeline.
- Contributes to XC-01, XC-02.

### Quick functional check

Open `/playground` and the chat: dark text on the light ground, captions in uppercase mono, the fonts loaded from `localhost`. Switch DevTools to dark mode: nothing changes, on `localhost:4200` and `localhost:4201` alike.

### Key Locations

- `src/styles.css` — tokens, scheme, fonts, A2UI and caption rules (replaces the `app-root > h1` layout; Task 2 removes that heading).
- `projects/mfe-charts/src/styles.css`, `projects/mfe-maps/src/styles.css` — `color-scheme`, ground, font fallback (5 lines each today).
- `package.json` — `dependencies` (neither fontsource package is installed yet).
- `src/app/playground/playground.ts` (`playgroundMessages()`, `Playground`), `src/app/playground/playground.html` — the bench.
- `src/app/agent/tools/message-widget.component.ts` (`MessageWidgetComponent.toolCall`) — rendered on the bench, not changed.
- `docs/improvements.md:28` — the text-contrast entry, ticked once T1-AC-02 holds.

### Key Discoveries

- Root cause of the contrast defect: A2UI's default theme (`node_modules/@a2ui/web_core/src/v0_9/basic_catalog/styles/default.js:31`) declares `:where(:root) { color-scheme: light dark; }` and defines its colours with `light-dark()`, so an OS in dark mode turns surface text to `#eee` on our white ground. CopilotKit goes dark only under a `.dark` class the app never sets.
- A2UI variables present in `@a2ui/angular` 0.10 (re-check on upgrade): `--a2ui-color-{primary,on-primary,surface,border,on-background}`, `--a2ui-text-color-text`, `--a2ui-text-caption-color`, `--a2ui-border-radius`, `--a2ui-font-size-{xs,s,m,l,xl,2xl}` (derived from `--a2ui-font-size: 1rem` × 1.2 unless set directly), `--a2ui-font-family-{title,monospace}`, `--a2ui-line-height-{headings,body}`, `--a2ui-spacing-*`, `--a2ui-card-{background,border,border-radius,box-shadow,margin,padding}`, `--a2ui-divider-{border,spacing}`, `--a2ui-row-gap`, `--a2ui-column-gap`, `--a2ui-button-{background,border,border-radius,box-shadow,font-weight,margin,padding}`. `Button` has the classes `primary` and `borderless` besides its default.
- `angular.json:77` loads CopilotKit's stylesheet after `src/styles.css`; its variables are scoped to `[data-copilotkit]`, not `:root`. Task 1 sets only root tokens and the scheme; the chat frame is Task 4.
- One meaning per colour (D6): selection = blue with an ink ring; amber = scarce or unreachable only; "soon" and "thinking" are neutral. The gauge adds the two level colours; nothing else uses them.
- Angular's application builder resolves a bare `@import '@fontsource-variable/archivo';` from `node_modules` — verify on the first build.
- Timeline items need only `id`, `label` (or `name`) and an ISO `date` (`labelOf()` in `timeline.component.ts`); the Berlin sample comes from `loadConferences()` + `findConferences()`.

## Task 2: Header band, location picker, title and favicon

### Instructions

Replace the app-root `<h1>` plus the flat chat header with the two-band header, inside `ChatPage`.

**Desktop (1280).** Band 1, ink: 76 px high, padding 0 32, gap 24. Left: the title "Conference Finder" (22 px / 700 / −0.02em, `--cf-font-ui`) and the mono eyebrow "FEDERATED AGENTIC UI · DEMO" (10 px, letter-spacing 0.14em, `--cf-on-ink`). Right: the location (label "Your location" 12 px `--cf-on-ink`; the city mono 14 px / 500; "Change" 32 px high, band colours, 1 px `--cf-ink-line` border), a 1 × 26 px separator (`--cf-ink-line` or the snapped token from Task 1), then the slot for the Native Federation mark and the capability chips — Task 3 fills it; until then the existing `app-capability-panel` sits there unstyled. Band 2, surface with a bottom line: the suggested prompts, padding 12 32, gap 10; buttons 44 px high, 13 px / 500, padding 0 16, radius md, line border; a visibly disabled state while the agent answers (the `running()` signal exists).

**Space rule.** Title, eyebrow and "Your location" never wrap. When the row gets tight (a third capability, the wider unreachable chip), the eyebrow is the only element that shrinks and disappears (`min-width: 0; overflow: hidden` and `flex-shrink: 1` on the eyebrow, `flex-shrink: 0` on everything else, or equivalent); everything else keeps its width.

**Phone (390).** Band 54 px, padding 0 16: title 17 px / 700 and the location value with "Change" — no eyebrow, no label. The prompts as one horizontally scrolling row (gap 8, padding 8 0 10, no wrapping). Below, a 36 px strip on `--cf-sub` for the capability chips (Task 3 fills it). The chrome ends near 150 px so the first chat message is visible on an 844 px screen (XC-04).

**Location picker.** Two states, both in band colours. With a location: label, city in mono, Change. Without one (first visit, and after Change): a native `<select>` ("Choose a city …" first option) inside the band with band colours, 1 px `--cf-ink-line` border, 32 px high like Change; the option list stays native. Behaviour is unchanged.

**Title and favicon.** `<title>Conference Finder</title>` in `src/index.html`; the `title` signal in `App` and the `<h1>` in `app.html` go (the band carries the name). Favicon: downscale `docs/design/departure/nf-logo.png` (121 KB source, transparent centre) with ImageMagick (`magick`, installed) to one small PNG in `public/` (64 px serves the tab and the 18 px band mark at 2×); link it as the icon instead of the Angular `favicon.ico`. Keyboard and ARIA beyond native elements: none (D10).

### Acceptance

- **T2-AC-01** — The browser tab shows "Conference Finder" and the Native Federation mark as its icon.
- **T2-AC-02** — Without a stored location the header shows the city select in band colours at both widths; with one, the city in mono and a Change control; choosing a city returns to the first state.
- **T2-AC-03** — At 1280 px the header is an ink band (title and eyebrow left, location and the capability area right) over a surface band with the prompts; title, eyebrow and "Your location" never wrap.
- **T2-AC-04** — At 390 px the band shows title and location only, the prompts scroll horizontally in one row, and the chrome ends within about 150 px.
- **T2-AC-05** — While the agent answers, the prompt buttons look disabled and do not send.
- Contributes to XC-01, XC-03, XC-04.

### Quick functional check

Open the app with site data cleared: the select sits in the ink band; pick Berlin, the city turns mono with Change beside it. Resize to 390 px: the eyebrow is gone, the prompts scroll sideways.

### Key Locations

- `src/app/chat/chat.page.ts` (`styles`, `running`, `prompts`), `src/app/chat/chat.page.html` (`<header>`, `.cf-prompts`, `<app-location-picker />`, `<app-capability-panel />`).
- `src/app/chat/location-picker.component.ts` (`picking`, `pick()`, `change()`), `src/app/chat/location-picker.component.html` (`<select>`, "Change").
- `src/app/app.ts` (`title` signal), `src/app/app.html` (`<h1>`), `src/app/app.css` (empty), `src/styles.css` (`app-root > h1` rule).
- `src/index.html` (`<title>Shell</title>`, `<link rel="icon">`), `public/favicon.ico` → new PNG, `docs/design/departure/nf-logo.png` (source).
- `src/app/chat/chat.page.spec.ts` (hook `header app-capability-panel`; may assert the title).

### Key Discoveries

- The Native Federation mark is attribution, not the app's logo: 18 px directly before the capability chips, collapsed and expanded; the text "loaded via Native Federation" appears only in the expanded panel header (Task 3). It is also the favicon because the demo goes onto the official Native Federation site. Ship it downscaled; an SVG is asked for but not available (spec section 10).
- "Conference Finder" with a space is the display name; the project name stays ConferenceFinder (spec section 11 records the follow-up in `docs/spec.md`, Task 9).
- Suggested prompts have two states only: default and disabled while the agent answers; no focus styling (D10).
- The location store persists the chosen city; `me()` undefined puts the picker into its select state — clearing site data shows the first-visit state.
- Every measure above is read off the frames and is orientation; snap font sizes to the Task 1 scale.

## Task 3: Capability chips and the panel

### Instructions

Restyle `CapabilityPanelComponent` into chips plus a native disclosure, in the slot Task 2 left at the right end of the ink band (desktop) and in the `--cf-sub` strip (phone). Data and behaviour stay: one entry per manifest remote, the switch link reloads with `?capabilities=` flipped, the URL is the only source of truth, so the panel is collapsed again after a switch — accepted.

**Collapsed (default at every width).** A chip per entry: 28 px high, padding 0 10, radius 6, mono 11 px; name plus the state as text — `loaded` with a 7 px blue dot (`--cf-rail-on-ink` inside the band), `unreachable` with the amber fill (`--cf-attention-bg` / `--cf-attention-ink`, the widest chip), `off` (the code's `unselected`) with a dashed `--cf-ink-line` border and muted text. Colour never carries the state alone. The 18 px Native Federation mark (asset from Task 2) sits directly before the chips. A native `<details>`/`<summary>` "Details" toggle opens the panel; the switch links stay outside the summary.

**Expanded, desktop.** An overlay hanging from the header stack: 880 px wide, right-aligned under the chips (right 32), radius 0 0 6 6, shadow `0 10px 28px rgb(16 34 47 / 0.18)`; a 46 px header row on `--cf-sub` with the mark and "loaded via Native Federation"; then per capability: origin, components, functions and the switch link. The prompt row stays visible and clickable — the overlay covers chat content only. **Expanded, phone.** The panel expands in place below the strip.

Keep the spec hooks: one `li` per capability with `data-state`, the switch `a` inside it, and `header app-capability-panel` from the chat page spec.

### Acceptance

- **T3-AC-01** — The panel starts collapsed at every width; collapsed, every manifest capability shows its name and its state as text (loaded, unreachable, off), so a failed remote is visible without expanding.
- **T3-AC-02** — Expanded on desktop the panel covers chat content but not the prompt row, which stays clickable; on the phone it expands in place.
- **T3-AC-03** — The Native Federation mark is visible collapsed and expanded; its text "loaded via Native Federation" only expanded.
- **T3-AC-04** — Each expanded entry lists origin, components and functions, and its switch link reloads the app with that capability flipped.
- **T3-AC-05** — Amber appears on the unreachable chip only; loaded and off chips carry no amber.
- Contributes to XC-01, XC-03, XC-04, XC-05.

### Quick functional check

Open `?capabilities=charts`: the maps chip reads "off" with a dashed border. Stop the maps server and open with both: the maps chip is amber and reads "unreachable"; click Details, the prompts above stay clickable.

### Key Locations

- `src/app/chat/capability-panel.component.ts` (`PanelEntry`, `toPanelEntries()`, `toggled()`, `styles`), `src/app/chat/capability-panel.component.html` (`li[data-state]`, `@switch`, the `a`).
- `src/app/chat/capability-panel.component.spec.ts` (`querySelectorAll('li')`, `querySelector('a')`).
- `src/app/chat/chat.page.ts`, `src/app/chat/chat.page.html` — the band slot and the overlay anchor; `src/app/chat/chat.page.spec.ts:403` (`panel?.querySelector('a')` href).
- `src/app/federation/capability-status.ts` (`CapabilityStatus`: `loaded | unreachable | unselected`) — read only.

### Key Discoveries

- Three states exist in code: `loaded` (with `origin` and the capability), `unreachable` (selected but the remote did not load), `unselected` (in the manifest, not in the URL). The chip text says "off" for the last.
- `toggleHref` is built by `toCapabilitiesQuery()`; switching is a full reload by design (no in-app selection state).
- The space rule of Task 2 is proven here (XC-03): a third capability or the wider unreachable chip makes the eyebrow disappear first, nothing else shrinks.
- Amber has one meaning across the app (D6, XC-05): here the unreachable chip; in Task 8 the scarce gauge. The switch link is a link, not a button; no keyboard work beyond native elements (D10).

## Task 4: Chat frame and the two chat-side renderers

### Instructions

Give the CopilotKit chat the Departure look through its variables and the few class inputs it forwards, and restyle the two shell components that render inside it.

**Chat frame** (global CSS in `src/styles.css`). CopilotKit's stylesheet loads after ours (`angular.json:77`) and scopes its shadcn variables to `[data-copilotkit]` — override at that scope with higher specificity or reorder the two stylesheets. Set `--background` (ground), `--card` and `--input` (surface), `--foreground` (ink), `--muted`/`--muted-foreground`, `--border` (line), `--primary` (ink), `--ring` (rail), `--radius` (md); `--cpk-container-3xl: 55rem` for the 880 px column (48 rem today); gap 22 between turns. User bubble: max 560 px, padding 12 16, 15 px / 1.45, radius 6, 1 px line on surface. "Thought for…" line via `reasoningMessageClass` on `copilot-chat`: mono 12 px, `--cf-muted`, grey dot, no italics; the answer container via `assistantMessageClass`. Message input: CopilotKit lays it over the end of the scroll view and pads the content by its measured height — keep that; the look is a solid surface bar with a top line (padding 18 200 14 desktop, 0 16 phone; field 52 px high, radius 6), the gradient "feather" hidden so no content shows through, the add-file and microphone buttons hidden (the demo has neither feature), the disclaimer kept. Those parts take no class input at the top — target CopilotKit's rendered structure (`copilot-chat-view`, `copilot-chat-input`, the buttons' own attributes) from global CSS; if that proves brittle, the `inputComponent` slot is the fallback, not a fork.

**Chat-side renderers.** `app-message-widget` (a greeting, a refusal, and the answer that names a missing capability): markdown at body size and line height like an answer's `Text`, links in `--cf-rail`, lists and inline code styled, max 40 rem as today; no frame, no badge. `app-surface-tool-renderer`: the pending line ("Building surface …") reads like the "Thought for…" line — mono, `--cf-muted`, neutral dot, no italics; the failure line ("Could not build the surface (code).") is attention — `--cf-attention-ink` on `--cf-attention-bg`. Both are hard-coded today (`#666` italic, `#b3261e`). Add the pending and the failed renderer state to the bench so they can be looked at without provoking them.

### Acceptance

- **T4-AC-01** — On a 1280 px window the chat column is 880 px wide.
- **T4-AC-02** — The message input shows no add-file and no microphone button; while scrolling, no content shows through above the input bar; the disclaimer stays.
- **T4-AC-03** — A `messageWidget` answer reads like an answer's body text with blue links and no frame; the pending line of a surface is mono and muted with a neutral dot; the failure line uses attention ink on the attention ground; none of the three keeps a hard-coded colour.
- **T4-AC-04** — User bubbles sit on a surface with a 1 px line, and the "Thought for…" line is mono, muted, with a grey dot.
- Contributes to XC-01, XC-04.

### Quick functional check

Send request 1: the bubble, the thinking line, the surface on the ground; ask for the map with charts only: the `messageWidget` text without a frame. On the bench, the pending and failed lines of the surface renderer.

### Key Locations

- `src/styles.css` — the `[data-copilotkit]` block; `angular.json:77` (`styles` order).
- `src/app/chat/chat.page.ts`, `src/app/chat/chat.page.html` (`<copilot-chat [agentId]="agentId" />` gains `assistantMessageClass` and `reasoningMessageClass`).
- `src/app/agent/tools/message-widget.component.ts` (`.cf-message-widget`), `.html`; `src/app/agent/tools/surface-tool-renderer.component.ts` (`.cf-placeholder`, `.cf-error`, `errorText()`), `.html`.
- `src/app/agent/tools/message-widget.component.spec.ts`, `src/app/agent/tools/surface-tool-renderer.component.spec.ts`, `src/app/chat/chat.page.spec.ts` (`copilot-chat app-message-widget strong`).
- `src/app/playground/playground.ts` — the two renderer states on the bench.

### Key Discoveries

- Forwarding, checked in `node_modules/@copilotkit/angular/dist/fesm2022/copilotkit-angular.mjs`: `CopilotChat` (selector `copilot-chat`, host attribute `data-copilotkit`) declares `assistantMessageClass`, `reasoningMessageClass`, `messageViewChildrenClass` and the `*Component`/`*Template` slots. `CopilotChatView` owns `messageViewClass`, `scrollViewClass`, `scrollToBottomButtonClass`, `inputContainerClass`, `featherClass`, `disclaimerClass`, `disclaimerText`; the message view owns `userMessageClass`; `CopilotChatInput` owns `addFileButtonClass`, `startTranscribeButtonClass`, `textAreaClass`, `sendButtonClass`, `toolbarClass`. None of those is forwarded.
- `--cpk-container-3xl: 48rem` lives in CopilotKit's `dist/styles.css` (the chat column is `max-w-3xl`); 93 rules are scoped to `[data-copilotkit]`; dark styling only under `.dark`.
- "Thought for…" appears twice per answer because a run has two model steps (tool call, then render); it is styled, not deduplicated (known, not addressed).
- The `messageWidget` answer that names a missing capability is the before-half of the live moment; it gets text only — the frames' "maps unreachable" badge inside it is not built.

## Task 5: Prompt examples with grouped facts and the eval run

### Instructions

The one change outside CSS, kept revertible. In `agent/src/prompt.ts` the two examples (lines 36–70) show the format with basic components only; change them so that a detail view wraps its facts in a `Card`, separates groups with `Divider`, and groups every caption with its value (a `Column` per pair inside a `Row`) — the CSS from Task 1 then moves whole pairs to the next line when the row wraps. Keep the rule text consistent (line 97: a unit or caption in its own `Text` next to the value). Still basic-catalog components only; the rules the surface contract depends on stay. Take the German leftover with it: the `daysUntil` description in `projects/mfe-charts/src/charts/days-until.fn.ts:32` still tells the model "in N Tagen" — make it "in N days". Adjust `prompt.spec.ts` where it pins example content.

Then run the model-behaviour gate once on the final strings: agent server running, `npm run eval` plays both capability sets (charts+maps: A1, A2, A3; charts only: A1, A2-without-maps) with 5 runs per request; the gate is 4 of 5 per request. Record the figures in the task log. If A3 lands below the gate, run once more before touching anything — 3/5 after a change is as likely noise as a regression (A3 has sat at the gate without slack since Task 7 of M2). If it stays below, revert the grouping and keep the rest; the task must not leave the gate broken.

### Acceptance

- **T5-AC-01** — In at least one recorded eval run the detail view groups each caption with its value and wraps the facts in a `Card` with `Divider`s, using basic components only.
- **T5-AC-02** — The eval gate holds on the final strings: A1, A2, A3 with both capabilities and A1, A2-without-maps with charts only each pass at least 4 of 5 runs.
- **T5-AC-03** — Every description the model reads is English; "in N Tagen" is gone.

### Quick functional check

`npm run eval` with the agent server up; the summary shows every request at 4/5 or better, exit 0. Send request 3 in the app: the facts sit in a card and wrap pairwise at phone width.

### Key Locations

- `agent/src/prompt.ts` (examples at 36–70, the caption rule at 97), `agent/src/prompt.spec.ts` (`buildInstructions` tests).
- `projects/mfe-charts/src/charts/days-until.fn.ts:29-33` (`daysUntilFn` description).
- `eval/run-eval.ts` (`EVAL_RUNS`, `EVAL_AGENT_URL`, `RUNS_PER_REQUEST`, `PASS_RATIO`), `eval/scenarios.ts` (`SCENARIOS`, requirements `A1`, `A2`, `A3`, `A2-without-maps`).
- `docs/improvements.md` — the A3-slack entry (task 7, scope m2-nf-split); extend it with this run's figures if A3 moves.

### Key Discoveries

- The eval harness runs under Node and reads `vocabulary.ts` files directly; `days-until.fn.ts` is reachable from one and must stay free of Angular imports (it is).
- Whether the model groups pairs was an open point (spec section 10) — this task settles it against real output. The CSS must look right without the change (Task 1 proves ungrouped pairs on the bench), which is what makes the revert safe.
- The eval is paid and non-deterministic; `EVAL_RUNS=1` gives a smoke run judged by the same ratio. Recorded verdicts and surfaces land under the eval's recording path.
- Request 3 reads "Where and when is the next one near me? …" since M2 Task 9; the wording carries the location cue A3 depends on — do not touch the prompts here.

## Task 6: Timeline — Departure look with rail and board layouts

### Instructions

Restyle `TimelineComponent` in `mfe-charts` and give it its second layout. Everything inside the component may change; props, schema and vocabulary text stay.

**Tokens with fallbacks.** Private aliases on `:host` (`--_ink: var(--cf-ink, #10222F)`, `--_line`, `--_rail`, `--_muted`, `--_surface`, `--_font-ui`, `--_font-data`, …); a bare colour appears only as a fallback (today: `#999`, `#ccc`, `#3f51b5`, `#ff9800`, `#666`). Font families are inherited from the shell; the standalone page on 4201 renders the look from fallbacks alone.

**Frame.** Surface, 1 px line, radius md, padding 24 24 18 on desktop, 14 14 6 as board. The rail stays **one uniformly scaled SVG with a fixed `viewBox`** (today `0 0 400 92`; the numbers may change, the fixedness may not — Task 7 rests on it).

**Rail.** Horizontal and true to scale (the existing x computation, `range` included). Labels alternate above and below with mono dates. The selected stop: blue dot with an ink ring and a bold label (13 px / 700 in rendered terms) — no second hue (the amber selected dot goes). A relative-time caption for the selected item ("in 3 days", "today", "5 days ago"), mono, neutral, computed in the component with a fixed `en` locale. A month axis underneath that makes the spacing readable ("SEP 26 · OCT · … · MAR 27"): month ticks from the first to the last marker, uppercase English abbreviations from a fixed `en` locale, the two-digit year at the first tick and at every January; axis 1 px, ticks 9 px.

**Board.** A vertical departure board: one row per item — mono date left, a vertical rail with the dot, the label right; the selected row shows label, date and relative time only (the frames' "359 km · 12 Restkarten" is domain knowledge a neutral timeline cannot have). Row gap 12, no inner scrolling — thirty rows make a long answer, accepted.

**Switch by container width.** `container-type: inline-size` on the host frame. The board replaces the rail where the rendered label size would drop below about 11 px (rendered = label size in viewBox units × container width ÷ viewBox width) — derive the breakpoint from the viewBox numbers and note the arithmetic in one comment. Both layouts may live in the template with CSS choosing one; additionally expose a host attribute or class through which the component can force the board regardless of width — Task 7 sets it. Never the viewport (D8).

Keep the hooks: `g.cf-selected`, `.cf-label`, `circle` on the rail; give the board rows the same classes.

### Acceptance

- **T6-AC-01** — The rail marks the selected item with a ring and no second hue, shows mono dates, and draws a month axis whose labels are uppercase English months whatever the browser language.
- **T6-AC-02** — The selected item carries an English relative-time caption whatever the browser language.
- **T6-AC-03** — In a narrow container the timeline shows the board (date, rail, label per row); in a wide one the rail; the switch follows the container's width, not the window's.
- **T6-AC-04** — With the shell not running, the charts standalone page shows the timeline in the Departure look.
- Contributes to XC-01, XC-02, XC-05, XC-06.

### Quick functional check

`/playground`: the Berlin sample draws the rail with its month axis; narrow the window until the label size would fall under 11 px and the board takes over. `localhost:4201` without the shell: the same look.

### Key Locations

- `projects/mfe-charts/src/charts/timeline.component.ts` (`AXIS_Y`, `X_MIN`, `X_MAX`, `markers` computed, `labelOf()`, `pick()`, `styles`), `projects/mfe-charts/src/charts/timeline.component.html` (`viewBox="0 0 400 92"`, `g.cf-marker`, `.cf-selected`, `.cf-label`, `.cf-date`).
- `projects/mfe-charts/src/charts/timeline.component.spec.ts` (labels via `.cf-label`, `circle` cx, `g.cf-selected`, `svg` rect).
- `projects/mfe-charts/src/charts/timeline.schema.ts` (`TimelineItem`, `range`) — read only, unchanged.
- `projects/mfe-charts/src/app/app.ts` — the standalone sample.

### Key Discoveries

- The fixed-`viewBox` invariant: scaling changes how large the text is, never whether two labels overlap. That is what lets Task 7 decide overlap as a pure function in viewBox units. If labels ever became fixed-size HTML over a fluid rail, overlap would depend on width again and the rule would break.
- `range` is an optional prop (`{ from, to }`) that squeezes the items; the rail already honours it. `labelOf()` falls back label → name → id.
- D9: every generated text is English with a fixed `en` locale — never the browser's; the German strings in the frames ("in 3 Tagen", "MÄR") are illustrations.
- The frames' rail area is 832 × 220 at desktop, the label 13 px / 700 when selected, the axis 1 px with 9 px ticks — orientation, not a pixel spec.
- Hit targets on the phone should reach `--cf-tap` (44 px) where cheap; no keyboard or ARIA work (D10).

## Task 7: Timeline — the label-overlap rule

### Instructions

The Timeline half of the label-collision entry in `docs/improvements.md` — behaviour, not styling. Add a pure function in viewBox units (own module next to the component, its own spec) that answers "do all label blocks fit on the rail?" for the markers the rail draws. A label block is the label with its date underneath, as wide as the wider of the two; width is estimated, not measured: a conservative 0.6 em per character for the UI face (covers the bold selected label) and the exact 0.6 em advance for the mono date, at the font sizes the rail uses in viewBox units. Per side of the rail (labels alternate), blocks sorted by position must not touch, with a small minimum gap. No item-count threshold exists: seven spread-out items fit, four within one week do not. The check runs on the same marker positions the rail draws, so a `range` that squeezes the items is covered.

The component forces the board through the hook Task 6 exposed when the function says the rail does not fit; the width condition from Task 6 stays independent (either condition is sufficient). The estimate is deliberately conservative — the board may appear slightly more often than strictly necessary. Measuring the DOM was rejected (render, measure, re-render flickers; the result changes when the web font arrives; untestable without a layout engine). Tick the Timeline half of the collision entry; the Map half belongs to MapLibre in M3.

### Acceptance

- **T7-AC-01** — Given thirty items, the timeline shows every label readable and no two labels overlap.
- **T7-AC-02** — Given four items within one week, likewise.
- **T7-AC-03** — Given the seven items of request 1 at desktop width, the timeline still draws the rail.
- **T7-AC-04** — Given items squeezed by a `range` narrower than their span, the decision sees the squeezed positions: the board appears although the same items would fit without the range.
- **T7-AC-05** — The overlap decision depends on the items and the range only; resizing the window never changes it.

### Quick functional check

`/playground`: the thirty-item and the four-in-a-week samples show the board, the Berlin sample the rail. `ng test mfe-charts` green.

### Key Locations

- New module and spec beside `projects/mfe-charts/src/charts/timeline.component.ts` (names are the task's call).
- `projects/mfe-charts/src/charts/timeline.component.ts` (`markers` computed feeds the function; the force-board hook from Task 6), `projects/mfe-charts/src/charts/timeline.component.spec.ts`.
- `src/app/playground/playground.ts` — the dense samples from Task 1.
- `docs/improvements.md:7` — the collision entry.

### Key Discoveries

- The rule rests on the fixed-`viewBox` invariant from Task 6: overlap is a property of the items, size a property of the container. Keep them in two mechanisms.
- The design was drawn with seven items; "show me all conferences" delivers about thirty, and no styling makes thirty labels fit on one rail.
- The board's selected row shows label, date and relative time only — a domain-neutral timeline knows no distance or stock.

## Task 8: Gauge — frame, badge, percentage and level colours

### Instructions

Restyle `GaugeComponent` in `mfe-charts`; props, schema and vocabulary text stay, so the model sees nothing new. Own frame: surface, 1 px line, radius md, hugs its content on desktop (padding 20 26, gap 28; arc about 190 × 110), full width on the phone. The arc: track in `--cf-line` (today `#e5e5e5`), the fill in one of three level colours by `value / max` — above 65 % `--cf-level-high` (green), from 30 to 65 % `--cf-level-mid` (yellow, fill only, never text), below 30 % `--cf-attention` (amber). The value over the maximum in mono numerals (the 32/38 px sizes stay local to the component). The `label` prop as a badge (pill, mono 11 px, `--cf-sub` by default); the badge takes the attention style (`--cf-attention-bg` / `--cf-attention-ink`) only below 30 %, so amber keeps its single meaning — scarce — across chips and gauge. The percentage stands alone ("2.4 %"), formatted with a fixed `en` locale, one decimal at most; the frames' "des Kontingents" is domain wording and is dropped. The thresholds are internal. If yellow and amber read too alike on screen, lighten the yellow rather than introduce red. Tokens via private aliases with fallbacks; a bare colour only as a fallback. Keep the `path[stroke-dasharray]` hook and a non-zero rendered size.

### Acceptance

- **T8-AC-01** — The fill is green above 65 % of the maximum, yellow from 30 to 65 %, amber below 30 %.
- **T8-AC-02** — The badge takes the attention style only below 30 %; above, it is neutral.
- **T8-AC-03** — The percentage reads in English number format whatever the browser language, with no domain wording.
- **T8-AC-04** — With the shell not running, the charts standalone page shows the gauge in the Departure look.
- Contributes to XC-01, XC-02, XC-05, XC-06.

### Quick functional check

`/playground`: the Berlin sample's gauge in its frame with the "Tickets left" badge; pick different conferences and watch the fill change level. `ng test mfe-charts` green.

### Key Locations

- `projects/mfe-charts/src/charts/gauge.component.ts` (`styles`, `dashArray()`, `value()`, `max()`, `label()`, `ariaLabel()`), `projects/mfe-charts/src/charts/gauge.component.html` (`viewBox="0 0 100 70"`, the two `path`s with `stroke="#e5e5e5"` and `stroke="#3f51b5"`, `.cf-gauge-value`, `.cf-gauge-max`, `.cf-gauge-label`).
- `projects/mfe-charts/src/charts/gauge.component.spec.ts` (`path[stroke-dasharray]`, `svg` rect).
- `projects/mfe-charts/src/charts/gauge.schema.ts` — read only; its description text stays.

### Key Discoveries

- One meaning per colour (D6): amber = scarce or unreachable only; the two level colours are the gauge's alone.
- Accepted for a demo: the gauge assumes that more is better, which a domain-neutral primitive cannot know. The sentence under the gauge in the frames is not built — it appears only if the model composes it.
- `label` is optional (`@if (label(); as caption)`); the arc is a 180° path in a 100 × 70 viewBox, drawn with `stroke-dasharray`.

## Task 9: Docs — theme across the federation boundary, spec follow-ups, register

### Instructions

Documentation only, no production file changes. In `docs/architecture.md`: under "Layers and ownership" name the styling zones and their owners (shell chrome; chat frame reachable through CopilotKit variables and the few forwarded class inputs; agent primitives through `--a2ui-*`; widgets inside their remote; the map untouched until M3). Under "Federation and boundaries" add the theme invariant: the shell declares `--cf-*` on `:root`, a remote reads them with the token value as fallback and imports no host CSS, so its standalone page renders the same look from fallbacks alone — the styling form of "a remote stays repo-portable". Under "Invariants worth knowing" record the Timeline rule: one uniformly scaled SVG with a fixed `viewBox`, size decided by the container, overlap by a pure function — and `color-scheme: only light` per app with its reason. Keep the "how to read" map consistent. Body text carries no task numbers, AC IDs or plan references; "Status and history" gets one line for this scope.

`docs/how-it-works.md`: adjust only sentences that became wrong (panel wording, chrome). `docs/spec.md` (German; a copy of the a2ui repo's spec — change both sides identically): §8 names this milestone between M2 and M3 and lets the M3 MapLibre sentence point at the visual-language spec, section 8.3; §9 E1 adds the display name "Conference Finder" (project name unchanged). `docs/specs/visual-language.md`: status line to implemented with the date; section 10 records the CopilotKit finding as settled; section 10a records the user decision (a look, not screenshots). `docs/improvements.md`: confirm the text-contrast entry and the Timeline half of the collision entry are ticked; add nothing speculative. `README.md` stays — the `publication` scope rewrites it.

### Acceptance

- **T9-AC-01** — A reader of the architecture doc can tell for each styling zone who owns it and how the theme reaches a remote without importing host CSS, without opening the visual-language spec.
- **T9-AC-02** — The project spec names the design milestone between M2 and M3 and the display name, identically in this repo and the a2ui repo.
- **T9-AC-03** — The bodies of the architecture doc and the tour carry no task numbers, AC IDs or plan references; only "Status and history" does.

### Quick functional check

A grep for `Task [0-9]`, `T[0-9]-AC` and `plan.md` over `docs/architecture.md` and `docs/how-it-works.md` hits only the closing status section.

### Key Locations

- `docs/architecture.md` — "How to read this document" (line 20), "Layers and ownership" (279), "Invariants worth knowing" (347), "Federation and boundaries" (408), "Status and history" (489).
- `docs/how-it-works.md`; `docs/spec.md` — §8 "Meilensteine" (line 174, M3 at 180), §9 E1 (line 215); the a2ui repo's copy (ask the user for its path).
- `docs/specs/visual-language.md` — status line 3, sections 10 and 10a; `docs/improvements.md:7,28`.

### Key Discoveries

- Docs conventions of this repo: reference docs need a reading thread (a "how to read" map, lead sentences, grouped rules) and stay independent of the workflow — milestones, task numbers and plan references only in the closing status section.
- `docs/spec.md` is mirrored in the a2ui repo; a one-sided edit is a defect.

## Cross-Cutting Acceptance

- **XC-01** — Shell chrome, `Timeline` and `Gauge` take every colour, radius, space and font family from `--cf-*`; a hard-coded value appears only as a `var()` fallback. **Touches:** T1, T2, T3, T4, T6, T7, T8.
- **XC-02** — With the shell not running, the charts standalone page shows `Timeline` and `Gauge` in the Departure look, from fallbacks alone. **Touches:** T1, T6, T8.
- **XC-03** — At 1280 px title, eyebrow and "Your location" never wrap; with an unreachable capability the eyebrow is the first and only element to disappear. **Touches:** T2, T3.
- **XC-04** — At 390 × 844 the first chat message is visible without scrolling. **Touches:** T2, T3, T4.
- **XC-05** — Amber has one meaning: the unreachable chip, the gauge below 30 % and its badge — nothing else is amber; selection is blue with an ink ring, never a second hue. **Touches:** T3, T6, T8.
- **XC-06** — Every text a component generates is English whatever the browser language: relative time, month labels, number formats. **Touches:** T6, T8.
