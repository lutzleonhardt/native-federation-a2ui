# Spec: Visual language "Departure"

Status: implemented, 2026-09-25 (draft v1, 2026-09-19). Relation to `docs/spec.md`: its own milestone between M2 (NF split) and
M3 (reserve, MapLibre, publication). It has to land before M3 captures replay recordings and the
Post-2 screenshots, because section 7 changes prompt examples and therefore model output.

Design source: `docs/design/departure/*.png` — four frames from Claude Design (desktop 1280, phone
390, desktop with the capability panel open, tokens and kit), rendered 1:1 in CSS pixels. They show
the target; section 4 and section 12 carry the values. The frames are drawings, not a responsive
layout — 1280 and 390 are two pictures of one design — and they come from a PDF export with known
text-fitting glitches (a clipped second line in user bubbles, the wrapped phone title) that are not
part of the design. The frames were produced with Claude Design from two screenshots of the unstyled
app and a brief carrying the zone constraints of section 2. Its HTML export was not kept: plain
markup with inline styles and no classes, whose exact values this spec snaps to a scale anyway.

## 1. Goal and non-goals

Give the demo one deliberate look — a station departure board: an ink header band carries identity
and app state, mono numerals carry every date, distance and count, blue carries the line and the
selection, amber carries nothing but attention.

Non-goals: new features, a calendar view, dark mode, empty states, restyling the SVG map (M3 replaces
it), any change to the capability contract or to a component's prop schema, and keyboard or ARIA
work beyond what native elements bring (D10).

## 2. Styling zones

What a change may touch depends on who owns the DOM. This table is the constraint every task
inherits.

| Zone | Owner | What can change |
|---|---|---|
| Shell chrome: header band, prompt row, capability panel, location picker | shell components | everything |
| `Timeline`, `Gauge` | `mfe-charts` components | everything inside the component; props and vocabulary stay |
| Chat-side renderers: `app-message-widget`, `app-surface-tool-renderer` | shell components | everything (section 7.1) |
| Chat frame: bubbles, message input, "Thought for…" line | `@copilotkit/angular` | theme variables and per-slot class inputs (section 5); structure is fixed |
| Agent primitives: `Column`, `Row`, `Card`, `Divider`, `Text`, `Button` | `@a2ui/angular` | `--a2ui-*` variables; the *arrangement* is chosen by the model per answer |
| `Map` | `mfe-maps` | nothing here — section 8.3 hands the map kit to M3 |

Consequence of the agent-primitives row: a layout drawn for an answer is an illustration, not a
contract. Only primitives are styled; no bespoke card exists.

Outside the table: the two `/playground` pages and the page chrome of the remotes' standalone apps
get no design of their own. They inherit the global tokens, and each remote's `styles.css` sets the
colour scheme and the ground (D7).

## 3. Decisions

- **D1 — No CSS framework, no Sass.** Plain CSS with custom properties, component-scoped styles as
  today. Two of the five zones are library-owned and reachable through custom properties only, so a
  utility framework could not style them; in the remotes it would add a second build-time dependency
  and break the rule that a remote depends on the contract folder and published packages alone.
- **D2 — The theme crosses the federation boundary as custom properties.** The shell defines
  `--cf-*` on `:root`; a remote reads `var(--cf-rail, #2B5FA8)` — always with the token's value as
  fallback. A remote never imports host CSS. Its standalone page therefore renders the same look
  from fallbacks alone, which keeps it repo-portable. Fallbacks are declared once per component as
  private aliases (`:host { --_rail: var(--cf-rail, #2B5FA8); }`), not repeated at every use.
- **D3 — Fonts are self-hosted.** `@fontsource-variable/archivo` and `@fontsource/ibm-plex-mono`
  (both OFL-1.1), loaded by the shell only; font families reach remote components by inheritance.
  No request to a third-party font host at runtime. Standalone remote pages use the fallback stack.
- **D4 — Naming.** App title "Conference Finder" (two words), also as `<title>` (today "Shell"). A
  mono eyebrow "FEDERATED AGENTIC UI · DEMO" next to it on desktop — the term follows Manfred
  Steyer's book on agentic UI. No eyebrow at phone width.
- **D5 — Native Federation mark.** In the header it is attribution, not the app's logo: the hexagon
  at 18 px directly before the capability chips, collapsed and expanded; the text "loaded via Native
  Federation" only in the expanded panel header. It is also the favicon (today the Angular default):
  the demo will be published on the official Native Federation site. Ship it downscaled — the
  source PNG is 121 KB for an 18 px mark. Open: an SVG (section 10).
- **D6 — One meaning per colour.** Selection = blue marker with an ink ring, never a second hue.
  Amber = needs attention: scarce stock, unreachable capability — nothing else. "Soon" and
  "thinking" are neutral: mono caption, grey dot.
  The gauge adds two level colours of its own (section 8.2); nothing else uses them.
- **D7 — Light only, enforced.** `:root { color-scheme: only light; }` in the shell's `styles.css`
  and in each remote's. It is not optional: A2UI's default theme declares
  `:where(:root) { color-scheme: light dark; }` and defines its colours with `light-dark()`, so an
  operating system in dark mode turns surface text to `#eee` on our white ground — the root cause of
  the text-contrast entry in `docs/improvements.md`. `:root` beats the zero-specificity
  `:where(:root)`. CopilotKit is harmless here: it goes dark only under a `.dark` class, which the
  app never sets.
- **D8 — Widgets respond to their container, not the viewport.** `Timeline` switches layout with a
  container query: the chat column is narrower than the window, and the standalone page has yet
  another width.
- **D9 — English throughout.** Chrome and every text a component generates itself are English with a
  fixed `en` locale — "in 3 days", "SEP OCT NOV", "2.4 %" — never the browser's; the German strings
  in the frames ("Schließen", "in 3 Tagen", "MÄR") are illustrations. Answers follow the language of
  the request, so they turn English once the demo content does (section 10, later).
- **D10 — No keyboard or ARIA work.** A simple demo: native elements keep their default behaviour,
  nothing is added, and no acceptance criterion asks for it.

**Rejected directions.** Claude Design drew three; two were dropped, and the reasons are what keeps
the choice from being reopened.

- *B "Höhenlinien"* (sage ground, borderless rounded surfaces, green and raspberry): its signature,
  the contour lines, lives in the map — the one part that is inspiration only and would need a
  terrain source in MapLibre. What remains is white on pale sage without borders, which washes out
  on a projector, and a soft consumer look around a developer readout full of localhost URLs.
- *C "Ticket Stub"* (lilac paper, 2 px rules, offset block shadows, violet and orange): striking on
  a stage, but neo-brutalism with Space Grotesk is a template look of its own, heavy borders make
  a dense data UI restless, and its timeline gives up the time scale in the main view.
- *A* won on fit and cost, not on beauty: the content is dates, distances, counts, URLs and
  function names, which mono type suits; hairlines and circle markers are the cheapest to build;
  plain map labels with a halo are what MapLibre symbol layers do natively. Its weakness — the
  most conservative of the three, close to the old indigo and orange — is accepted.

## 4. Tokens

```css
:root {
  --cf-ink:           #10222F;  /* text, band, primary button, selection ring */
  --cf-ground:        #EDF1F4;  /* app background */
  --cf-surface:       #FFFFFF;  /* card, component frame, input */
  --cf-line:          #C8D3DB;  /* card border, divider, rail */
  --cf-rail:          #2B5FA8;  /* marker, link, SELECTION */
  --cf-attention:     #E1730B;  /* scarce / unreachable ONLY */
  --cf-attention-bg:  #FDF0E2;
  --cf-attention-ink: #8A4607;  /* attention text on light, 4.9:1 */
  --cf-muted:         #4E5F6B;  /* captions, 4.6:1 on ground */
  --cf-on-ink:        #9FB3C2;  /* muted text inside the band */
  --cf-ink-line:      #47606F;  /* chip border inside the band */
  --cf-rail-on-ink:   #6E9BE0;  /* dot inside the band */
  --cf-level-high:    #2F8F5B;  /* gauge fill above 65 % — proposal, fix on screen */
  --cf-level-mid:     #E2B100;  /* gauge fill 30–65 %, fill only, never text */

  --cf-font-ui:   'Archivo Variable', system-ui, sans-serif;
  --cf-font-data: 'IBM Plex Mono', ui-monospace, monospace;

  --cf-r-sm: 3px;  --cf-r-md: 6px;  --cf-r-pill: 999px;
  --cf-s-1: 4px;  --cf-s-2: 8px;  --cf-s-3: 12px;  --cf-s-4: 16px;
  --cf-s-5: 24px; --cf-s-6: 32px; --cf-s-7: 48px;

  --cf-tap: 44px;               /* minimum hit target */
}
```

Two gaps the export leaves open, to close in the token task:

- **Type scale.** The frames use 14 font sizes (9–38 px) and define no size token. Snap to seven
  steps — 10, 11, 12, 13, 15, 17, 21 px; the gauge numerals (32/38 px) stay local to the component.
- **Stray colours.** Twelve hex values in the frames are not tokens. The map colours belong to
  section 8.3. `#1D4478` (link hover) and `#2E4657` (separator inside the band) each earn a token or
  snap to a neighbour; tick marks, the gauge track and disabled fills snap to `--cf-line`,
  `--cf-muted` or a single added `--cf-sub: #E3E9EE` (the quiet fill of the phone capability strip
  and the open panel's header row). No further colour tokens beyond that and the two gauge levels.

## 5. Mapping onto the libraries

**A2UI** — these variables exist in `@a2ui/angular` 0.10 (checked in `node_modules`, re-check on
upgrade): `--a2ui-color-primary`, `--a2ui-color-on-primary`, `--a2ui-color-surface`,
`--a2ui-color-border`, `--a2ui-color-on-background`, `--a2ui-text-color-text`,
`--a2ui-text-caption-color`, `--a2ui-border-radius`, `--a2ui-font-size-s`,
`--a2ui-card-{background,border,border-radius,box-shadow,margin,padding}`,
`--a2ui-divider-{border,spacing}`, `--a2ui-row-gap`, `--a2ui-column-gap`,
`--a2ui-button-{background,border,border-radius,box-shadow,font-weight,margin,padding}`.
`Column` and `Row` expose a gap and nothing else. `Button` has the classes `primary` and
`borderless` besides its default.

The authoritative list of base variables is A2UI's default theme,
`node_modules/@a2ui/web_core/src/v0_9/basic_catalog/styles/default.js`: colours (`background`,
`surface`, `primary`, `secondary` — the default button — `border`, `input`, each with its `on-`
partner), `--a2ui-font-size-{xs,s,m,l,xl,2xl}` (derived from `--a2ui-font-size: 1rem` and a scale
of 1.2 — set the six sizes directly from the type scale instead), `--a2ui-font-family-{title,
monospace}`, `--a2ui-line-height-{headings,body}`, `--a2ui-spacing-*`. It is declared with zero
specificity on `:root`, so plain `:root` overrides always win. `Text` maps variants to elements
and sizes: `h1`–`h3` use `2xl`, `xl`, `l`; body and `h4` use `m`; `h5` uses `s`; the caption is
`.a2ui-text.caption` with size `xs`. The components use emulated encapsulation and that class is
global, so the uppercase mono caption is reachable from `src/styles.css`.

**CopilotKit** — a shadcn-style set (`--background`, `--foreground`, `--card`, `--primary`,
`--muted`, `--border`, `--input`, `--ring`, `--radius`, each with its `-foreground`) declared on
`[data-copilotkit]`, not on `:root`. Overrides must match that scope. `angular.json` loads
CopilotKit's stylesheet *after* `src/styles.css`, so at equal specificity CopilotKit wins — raise the
specificity or reorder. Beyond variables, the chat takes a class per slot: `userMessageClass`,
`assistantMessageClass`, `reasoningMessageClass`, `inputClass`, `inputContainerClass`,
`featherClass`, `disclaimerClass` and `disclaimerText`, `scrollToBottomButtonClass`,
`addFileButtonClass`, `startTranscribeButtonClass`. The chat column is `max-w-3xl`, that is
`--cpk-container-3xl: 48rem`; set it to 55rem for the 880 px column the frames and the timeline
measures assume. The input container is positioned absolutely over the scroll view, which pads its
end by the measured input height; a gradient ("feather") sits above the input.

## 6. Shell chrome

**Header, desktop** — two bands. Band 1 (ink, 76 px): title and eyebrow left; location, Change, a
separator, the NF mark, the capability chips and the Details toggle right. Band 2 (surface): the
suggested prompts. Space rule: title, eyebrow and "Your location" never wrap; when the row gets tight
(a third capability, the wider unreachable chip) the eyebrow is the only element that shrinks and
disappears — everything else keeps its width.

**Header, phone** — title and location in the band, no eyebrow; prompts as one horizontally
scrolling row; capabilities in their own light strip. Chrome stays near 150 px so that the first
chat message is visible without scrolling on an 844 px tall screen.

**Location picker** — two states, and the frames draw only one. With a location: label, city in
mono, Change. Without one — the first visit, and after Change — a native `<select>` ("Choose a city
…") inside the ink band: band colours, 1 px `--cf-ink-line` border, 32 px high like Change; the
option list stays native.

**Suggested prompts** — two states: default, and disabled while the agent answers. The focus state
in the kit frame is not built (D10).

**Capability panel** — collapsed by default at every width. A chip per manifest entry carries name
and state, so a failure is visible without expanding: `loaded` (blue dot), `unreachable` (amber
fill), `off` (dashed, muted). The state is always also text, never colour alone. Expanded, the panel
lists origin, components, functions and the switch link per capability. On desktop it opens as an
overlay hanging from the header stack, as wide as the content column and right-aligned under the
chips; the prompt row stays visible and clickable. On the phone it expands in place. The toggle is a
native disclosure; the switch link stays outside the toggle. Switching reloads the page
(URL is the source of truth), so the panel is collapsed again afterwards — accepted.

**Message input** — CopilotKit lays it over the end of the scroll view and pads the content by its
height; that mechanism stays. The look is a solid surface bar with a top line (`inputContainerClass`)
instead of the gradient, which is hidden (`featherClass`), so content never shows through. The
add-file and microphone buttons are hidden (`addFileButtonClass`, `startTranscribeButtonClass`):
the demo has neither feature. The disclaimer stays.

**Known and not addressed** — "Thought for…" appears twice per answer because a run has two model
steps (tool call, then render). The line is styled (`reasoningMessageClass`), not deduplicated.

## 7. Agent primitives and the prompt

`Column` and `Row` own nothing but gap. A panel border exists only where the model wraps content in
a `Card`. `Divider` replaces every hairline. A fact value never wraps inside itself ("359 km",
"2026-09-22"); when a row of facts does not fit, whole caption/value pairs move to the next line —
which requires the model to group each pair.

The prompt examples in `agent/src/prompt.ts` therefore change: they show `Card`, `Divider` and
grouped caption/value pairs, still using basic-catalog components only. This is the one part of the
work outside CSS. The eval gate is unchanged — A1, A2, A3 and the missing-vocabulary case each pass
in at least 4 of 5 runs after the change. Risk: A3 sits on that gate without slack (4 of 5, see
`docs/improvements.md`). The prompt change therefore stays its own, revertible task, and the CSS
must look right without it — ungrouped captions and values in a plain `Row` included.

The first defect of this zone is already on record (`docs/improvements.md`, the text-contrast
entry): fact values and the city/date line render near-white on the white chat ground. D7 names
the cause and the fix; beyond that, every `Text` variant takes its colour from a token.

Not implementable as drawn, by decision: the sentence under the gauge (it appears only if the model
composes it; nothing depends on it).

### 7.1 Chat-side renderers

Two shell components render inside the chat, and the frames know neither by name.

- **`app-message-widget`** shows the text of a `messageWidget` call — a greeting, a refusal, and
  above all the answer that names a missing capability, the before-half of the live moment. The
  text is markdown: body size and line height like an answer's `Text`, links in `--cf-rail`, lists
  and inline code styled, at most 40rem wide as today. It gets no frame and no badge: the panel
  open frame draws a "maps unreachable" badge inside such an answer, but the widget receives text
  only.
- **`app-surface-tool-renderer`** has two states besides the surface itself. Pending ("Building
  surface …") reads like the "Thought for…" line: mono, `--cf-muted`, neutral dot, no italics.
  Failed ("Could not build the surface (code).") is attention: `--cf-attention-ink` on
  `--cf-attention-bg`. Today both are hard-coded (`#666`, `#b3261e`).

## 8. Widgets

### 8.1 Timeline

Own frame, two layouts.

- **Rail** — horizontal, true to scale: labels alternating above and below with mono dates, a month
  axis underneath that makes the spacing readable ("SEP 26 · OCT · … · MAR 27"), the selected stop
  with an ink ring and a relative-time caption ("in 3 days", neutral).
- **Board** — a vertical departure board: mono date left, rail, label right, one row per item. The
  selected row shows label, date and relative time only; the frame also draws "359 km · 12
  Restkarten" there, which a domain-neutral timeline cannot know.

**When the board replaces the rail.** Whenever the rail cannot show every label readably. The
design was drawn with seven items; "show me all conferences" delivers about thirty, and no styling
makes thirty labels fit on one rail. Two conditions, each sufficient:

| Condition | Depends on | Mechanism |
|---|---|---|
| Text too small | container width only | CSS container query, no script |
| Labels overlap | the items only | a pure function in viewBox units |

They are independent because the rail stays **one uniformly scaled SVG with a fixed `viewBox`** —
the invariant the whole rule rests on: scaling changes how large the text is, never whether two
labels overlap. If labels ever become fixed-size HTML over a fluid rail, overlap depends on width
again and this rule no longer holds.

- *Text too small:* rendered font size = font size in viewBox units × container width ÷ viewBox
  width. The container query sits where the label size drops below about 11 px.
- *Labels overlap:* a label block is the label with its date underneath, as wide as the wider of
  the two. Width is estimated, not measured: a conservative 0.6 em per character for the UI face
  (covers the bold selected label), the exact 0.6 em advance for the mono date. Per side of the
  rail, blocks sorted by position must not touch, with a small minimum gap. The check runs on the
  same marker positions the rail draws, so a `range` that squeezes the items is covered. No item
  count threshold exists: seven spread-out items fit, four within one week do not.

The estimate is deliberately conservative, so the board may appear slightly more often than
strictly necessary. Measuring the DOM instead was rejected: render, measure, re-render flickers,
the result changes when the web font arrives, and it cannot be tested without a layout engine.

This is behaviour, not styling, and it is the Timeline half of the collision entry in
`docs/improvements.md`; the Map half is solved by MapLibre's label collision handling in M3. The
board has no inner scrolling — thirty rows make a long answer, which is accepted.

### 8.2 Gauge

Own frame with the arc, the value over the maximum, the `label` prop as a badge and the percentage.
The percentage stands alone ("2.4 %") — the frame's "des Kontingents" is domain wording and is
dropped.
The fill takes one of three level colours by `value / max`: above 65 % `--cf-level-high` (green),
from 30 to 65 % `--cf-level-mid` (yellow), below 30 % `--cf-attention` (amber). The badge takes the
attention style only below 30 %, so amber keeps its single meaning — scarce — across chips and
gauge. The thresholds are internal to the component; the vocabulary text does not change, so the
model sees nothing new. Accepted for a demo: the gauge assumes that more is better, which a
domain-neutral primitive cannot know. If yellow and amber read too alike on screen, lighten the
yellow rather than introduce red.

### 8.3 Map — handed to M3

The MapLibre upgrade inside `mfe-maps` consumes this kit; nothing is built here. Markers: default
(blue dot), selected (blue with ink ring), user location (ringed dot, mono label). Labels as plain
text with a light halo — symbol layers keep MapLibre's collision detection, boxed labels would not.
Popup: surface, 1 px ink border, title, mono facts, stock line in attention ink. Basemap mood: land
`#E4EAEF`, water `#CBDCE8`, borders `#B7C5D0`, labels `#64798A`, roads `#D9E3EA` — recolour an
existing muted vector style, do not redraw cartography. Basemap colours live inside the WebGL canvas,
so they are passed as values, not inherited as custom properties.

Status (2026-09-30): implemented in M3 on OpenFreeMap's `positron` style, with one deviation — the
popup was dropped. A DOM popup is invisible to MapLibre's collision index and covered neighbouring
labels, so the selection is the ink ring plus a bold label that is placed first.

## 9. Acceptance

1. Shell chrome, `Timeline` and `Gauge` take every colour, radius, space and font family from
   `--cf-*`; a hard-coded value appears only as a `var()` fallback.
2. With the shell not running, `localhost:4201` shows `Timeline` and `Gauge` in the Departure look.
3. At 1280 px title, eyebrow and "Your location" never wrap; with an unreachable capability the
   eyebrow is the first element to disappear.
4. At 390 × 844 the first chat message is visible without scrolling.
5. The panel starts collapsed; collapsed, every capability shows its name and its state as text.
6. The open panel on desktop covers content, not the prompt row. The NF mark is visible collapsed
   and expanded, its text only expanded.
7. `Column` and `Row` draw no border or background; `Card` draws the panel border; `Divider` draws
   the hairline; no fact value wraps inside itself at either width.
8. The eval gate holds after the prompt change (section 7).
9. `Timeline` marks selection with a ring and no second hue, shows the month axis on the rail, and
   switches to the board by the width of its container.
10. Given thirty items, `Timeline` shows every label readable and no two labels overlap; given
    four items within one week, likewise; given the seven items of request 1 at desktop width it
    still draws the rail.
11. `Gauge` fills green above 65 %, yellow from 30 to 65 % and amber below 30 % of its maximum;
    its badge takes the attention style only below 30 %.
12. The app makes no request to a third-party font host.
13. With the operating system in dark mode the app looks exactly as in light mode — the shell and
    both remotes' standalone pages.
14. Every `Text` variant inside an answer reaches at least 4.5:1 against the chat ground.
15. A `messageWidget` answer, the pending line and the failure line of a surface follow section
    7.1; none of them keeps a hard-coded colour.
16. Without a stored location the header shows the city select in band colours, at both widths.
17. The message input shows no add-file and no microphone button, and no content shows through
    above it.
18. The chat column is 880 px wide on a 1280 px window.
19. The tab shows "Conference Finder" and the Native Federation mark as its icon.
20. Every text a component generates is English, whatever the browser language: relative time,
    month labels, number formats.

## 10. Open and later

- **Open — NF mark.** Ask for an SVG; the use itself is settled, the demo goes onto the official
  Native Federation site. Until then the PNG from `native-federation.com` serves (transparent
  centre, fine as a pure mark at 18 px).
- **Settled — the model groups caption/value pairs** once the prompt's detail example shows it:
  both live samples on the final strings carried the `Card` and the grouped pairs, with the eval
  gate at 5/5 (2026-09-24). Nothing enforces it — the improvements register holds the structural
  option.
- **Settled — CopilotKit's slot class inputs** (`@copilotkit/angular` 0.3.1): `copilot-chat`
  forwards only `assistantMessageClass`, `reasoningMessageClass`, `messageViewChildrenClass` and the
  `*Component` slots; `inputContainerClass`, `featherClass`, `disclaimerClass`/`disclaimerText`,
  `userMessageClass`, `scrollToBottomButtonClass`, `addFileButtonClass` and
  `startTranscribeButtonClass` stay on the inner components, and `assistantMessageClass`, though
  forwarded, never reaches the DOM. The chat frame is therefore styled through global CSS under
  `[data-copilotkit]` (`src/theme/copilotkit.css`); no CopilotKit component is replaced.
- **Done — English demo content** (2026-09-22, before this milestone): prompts, eval scenarios, the
  labels in the prompt examples, the playground samples and the schema description are English, and
  the eval gate was re-run on the English strings.
- **Later — calendar view** as an alternative to `Timeline` for the same data; postponed, and a
  vocabulary change with prompt and eval impact when it comes. Findings so far: FullCalendar has
  the multi-month view the sparse data needs (seven conferences across seven months leave a single
  month grid empty); v6 themes through `--fc-*` custom properties and supports Angular 12–22, v7
  replaced those variables with class-name props; `mat-calendar` would bring Material's theme
  system for one widget and is a date picker, not an overview.

## 10a. Verification

`/playground` renders a surface from component names without a model call — the bench for every
visual task; its sample was extended with what this work styles (`Card`, `Divider`, caption and
body pairs grouped and ungrouped, both button variants, a `messageWidget` text, dense timelines).
Verification is a look, not a diff (decided 2026-09-22): each visual task ended with the user
checking `/playground` and the app at desktop and phone width; there is no screenshot comparison
against the frames, which are orientation, not a pixel spec. Existing specs hook
into `.cf-selected`, `.cf-label`, `circle` and `svg` (timeline), `path[stroke-dasharray]` (gauge),
and `li` and `a` (capability panel); keep those hooks or move the specs with the markup.

## 11. Follow-ups in `docs/spec.md` (mirrored in the a2ui repo — change both)

- §8: name this milestone between M2 and M3; the M3 MapLibre sentence points at section 8.3.
- §9 E1: display name "Conference Finder" with a space; the project name stays.
- Decided since, outside this spec (publication scope, 2026-09-22): the public repository is a new
  one named `native-federation-a2ui`, not a rename, with "Federated Agentic UI" as the README
  tagline; the app keeps its name. The publication runs after M3 (`docs/spec.md` §8).

## 12. Key measures

Read off the Claude Design export; the frames show where they apply. Font sizes are given as drawn —
snap them to the scale in section 4.

| Part | Desktop 1280 | Phone 390 |
|---|---|---|
| Ink band | 76 px high, padding 0 32, gap 24 | 54 px high, padding 0 16 |
| Title | 22 px / 700 / −0.02em | 17 px / 700 |
| Eyebrow | mono 10 px, letter-spacing 0.14em, `--cf-on-ink` | — |
| Location | label 12 px `--cf-on-ink`; value mono 14 px / 500; Change 32 px high | value and Change only |
| Band separator, NF mark | 1 × 26 px; mark 18 px | mark 18 px in the strip |
| Capability chip | 28 px high, padding 0 10, radius 6, dot 7 px, mono 11 px | same, in a 36 px strip on `#E3E9EE` |
| Prompt row | padding 12 32, gap 10; button 44 px high, 13 px / 500, padding 0 16 | one scrolling row, gap 8, padding 8 0 10 |
| Chat column | 880 px via `--cpk-container-3xl: 55rem` (48rem today), gap 22 between turns | padding 0 16 |
| User bubble | max 560 px, padding 12 16, 15 px / 1.45, radius 6, 1 px line | same |
| "Thought for…" | mono 12 px `--cf-muted`, grey dot | same |
| Answer root `Column` | gap 20; heading 21 px / 600 / −0.01em | same |
| Facts `Column` / `Card` | gap 14; `Text.h3` 17 px / 600; card padding 20 24 | same |
| Timeline frame | padding 24 24 18; rail area 832 × 220; label 13 px / 700 selected; axis 1 px, ticks 9 px | board: padding 14 14 6, row gap 12 |
| Gauge frame | hugs content, padding 20 26, gap 28; arc 190 × 110 | full width |
| Message input | bar padding 18 200 14, top line; field 52 px high, radius 6 | bar padding 0 16 |
| Open panel | overlay 880 px wide, right 32, under the header stack; header row 46 px on `#E3E9EE`; shadow `0 10px 28px rgb(16 34 47 / 0.18)`; radius 0 0 6 6 | expands in place |
