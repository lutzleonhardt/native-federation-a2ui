# How it works

ConferenceFinder shows how an LLM can generate dynamic UIs with A2UI. Native Federation
delivers the components for them.

What you see is a chat. You ask for conferences, and the assistant does not answer with
a paragraph. It answers with a small piece of UI: a timeline, a map, a gauge for the
tickets that are left.

This page explains the idea behind it. The precise mechanics are in
[architecture.md](./architecture.md); each section here links to the matching part.

## The parts: Mastra, AG-UI, CopilotKit, A2UI

In the backend runs a Mastra agent. It talks to the LLM. Mastra does not speak AG-UI
itself, the `@ag-ui/mastra` adapter translates. AG-UI is the protocol between the agent
and the browser: one request goes in, the events come back over SSE.

The browser reacts to these events. It can, for example, run local tools. When the LLM
decides to call such a tool, the mapping happens on the client side, in CopilotKit: it
looks up the tool name and finds our handler. For every tool we can also register a UI
element, and CopilotKit shows it in the chat at the place of the tool call.

One of these tools is `renderSurface`. CopilotKit connects its tool call with a
component of ours. That component uses the A2UI renderer, and so it can show the dynamic
UI the LLM wants to draw. A2UI is a format that describes a UI, plus a renderer for
Angular.

So the actual communication is only Mastra and AG-UI. The message inside the tool call
is an A2UI message. It describes the dynamic surface, that is the DOM which the A2UI
renderer then builds in Angular.

```text
LLM <-> Mastra agent <-> AG-UI (request in, events back over SSE) <-> browser

in the browser:
  CopilotKit       maps a tool call by name to our handler and our UI element
  renderSurface    the tool whose arguments are an A2UI message
  A2UI renderer    turns that message into Angular components
```

Which components and functions are available is decided in A2UI as well, in its
catalog. Two places have to know it. The system prompt, so that the LLM knows how to
write the A2UI messages. And the renderer, so that it knows which component to render
in the end. What is made available there is called a capability, and Native Federation
delivers it. The rest of this page is about that.

## What the LLM answers

The LLM gets a list of names it may use: components such as `Timeline`, `Gauge` and
`Map`, basics such as `Text` and `Button`, and functions such as `daysUntil`.

From the user's question and the context the LLM then tries to compose a UI that
answers the question. If the user wants to know where the Angular conferences take
place, a `Map` fits. If they ask when, a `Timeline` fits.

> [!NOTE]
> The prompt is simplified. It is written for the demo's questions and nothing else. I did
> not harden it against misuse: it names a refusal as one possible answer, but nothing says
> what to refuse. An off-topic request ("write me a Python function") or an adversarial one
> meets nothing but the shell's checks on the answer's shape — unknown names and forbidden
> paths are rejected, the intent is not. A real deployment needs that layer: rules for what
> the assistant does not do, and a check of what goes in, not only of what comes out.

The answer describes a screen built from these names. The description is plain JSON, an
A2UI message:

<!-- prettier-ignore -->
```jsonc
// the LLM's answer to "show them on a map" — shortened
[
  { "createSurface": { "surfaceId": "confs-on-a-map" } },
  { "updateComponents": { "surfaceId": "confs-on-a-map", "components": [
    { "id": "root", "component": "Map",
      // where the data is — not the data itself
      "points": { "path": "/filteredConfs" },
      // where a click should be written
      "selected": { "path": "/selectedConf" } }
  ] } }
]
```

A surface also has a data model, and the props point into it:
`{ "path": "/filteredConfs" }`. The conferences themselves never pass through the LLM.
How they get there, and what happens on a click, is explained in
[Data stays in the browser](#data-stays-in-the-browser).

The browser receives the A2UI message and draws it. That means two parties have to know
the word `Map`. They need different things:

- The **LLM** has to know that `Map` exists, what it is for and what its props mean.
- The **browser** has to know how to draw one.

These are exactly the two halves of a capability.

## A capability has two halves

A _capability_ is what one team contributes to the assistant, for example "maps". The
team builds and serves it as a _remote_: a separate frontend project on its own server.
The _shell_ is the host application with the chat. It imports the remotes at runtime.
Native Federation is the technique that makes this import work.

A capability is one object with exactly these two halves:

```ts
// what the maps team ships — simplified
export const capability = {
  name: 'maps',

  // Half 1: the vocabulary. The "Custom Catalog" part of the LLM's system prompt is
  // built from it: which components and functions exist for A2UI, and what their
  // props mean.
  vocabulary: {
    components: {
      Map: {
        description: 'Shows items that have lat/lon as labelled markers. A click writes …',
        // the props as a zod schema: points, center, selected, action
        schema: mapProps,
      },
    },
    // "kilometres between two points": the description is for the LLM,
    // the implementation runs in the renderer
    functions: [distance],
  },

  // Half 2: the implementation. It is registered in the catalog of the A2UI renderer:
  // an ordinary Angular component for every component name above.
  components: { Map: MapComponent },
};
```

Both halves use the same names as keys. Inside a remote, a word without a component
does not compile. A component without a word does not compile either.

## Half 1 travels to the LLM

At startup the shell loads the remotes. This is the federated part: every remote
provides its capability, and the shell has no vocabulary of its own. The shell takes the
vocabulary half of every capability it loaded and turns it into JSON. It sends this JSON
with every chat request. The AG-UI protocol between browser and agent server has a
`context` field for this.

I kept the agent server thin. It owns only the fixed part of the system prompt: what
A2UI messages look like and how to bind data. The JSON from the browser is pasted below
it:

```text
You are the ConferenceFinder assistant …
(fixed text: the message format, how to bind data, two examples built from basic components only)

# Custom Catalog
{ "components": { "Map":      { "description": "Shows items that have lat/lon …", "schema": { … } },
                  "Timeline": { … }, "Gauge": { … } },
  "functions":  { "distance": { … }, "daysUntil": { … } } }
```

This is how the LLM learns which components exist and what their props mean. It never
sees an Angular class. The server does not know a single component of a remote by name.
It is told per request.

The tools take a third way. `renderSurface`, `findConferences` and `messageWidget` are
registered in CopilotKit, each with a name, a description and a schema for its
parameters. AG-UI carries them in a field of its own, `tools`, with every request, and
the adapter hands them to the LLM as tool definitions. So the LLM is told three things,
from three sources:

| What the LLM is told                                        | Who provides it                     | How it travels                                                       |
| ----------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| How A2UI works: message format, binding rules, two examples | the agent server (the Mastra agent) | fixed part of the system prompt, Mastra's `instructions`             |
| Which A2UI components and functions exist                   | the remotes, through the shell      | AG-UI `context`, pasted into the system prompt as `# Custom Catalog` |
| Which client tools it can call, with their parameters       | the shell                           | AG-UI `tools`, registered in CopilotKit                              |

→ [One AG-UI run](./architecture.md#one-ag-ui-run)

## Half 2 travels to the renderer

The implementation half goes the other way. The shell registers it in the catalog of
the A2UI renderer. That catalog is little more than a lookup from name to component.
The LLM's answer says `"component": "Map"`, the renderer looks the name up, creates a
`MapComponent` and hands it the props.

```text
what the catalog of the renderer holds, with charts and maps loaded

Text, Button, …      components that come with A2UI
Gauge                GaugeComponent       from the charts remote
Timeline             TimelineComponent    from the charts remote
Map                  MapComponent         from the maps remote
daysUntil            function             from the charts remote
distance             function             from the maps remote
```

Compare it with the `# Custom Catalog` block above: the same names. The split is not
perfectly clean, though. The LLM gets only the vocabulary half. The renderer gets the
components and takes three things from the vocabulary half as well: the names, the
schemas, to validate the props the LLM wrote, and the functions. Only the descriptions
are of no use to it.

What the renderer hands to a component are four inputs:

```ts
// the maps remote, shortened
export class MapComponent {
  // one entry per prop from the A2UI message: points, center, selected, action.
  // Each one is live: value() reads it, onUpdate() writes back to the bound path.
  readonly props = input.required<MapProps>();
  // the surface the component sits in, and its own id in the A2UI message
  readonly surfaceId = input.required<string>();
  readonly componentId = input.required<string>();
  // base path for relative bindings, '/' outside a list template
  readonly dataContextPath = input<string>('/');
}
```

## One remote, both halves

Both halves ship in the same remote. A new remote therefore extends two things in one
step: the components and functions the LLM may use, and the ones the renderer can
render. The shell is not rebuilt. The agent server is not redeployed. Neither of them is
even told.

In the shell this is two calls, once at startup:

```ts
// pseudocode
// Native Federation: import './capability' from every selected remote, at runtime
const capabilities = await loadSelectedRemotes(); // [charts, maps]

// half 1 → the LLM: which components and functions it may use
announceToLlm(capabilities.map((c) => c.vocabulary));
// half 2 → the renderer: the components, joined with the names, schemas and
// functions from half 1
registerInRenderer(capabilities);
```

You can watch the first step in the browser. The
[Native Federation DevTools](https://native-federation.com/docs/v4/devtools/) extension
shows the loaded remotes, what each one exposes (here `./capability`) and which shared
packages were negotiated.

The demo shows the effect of a new remote in two steps:

1. Open the app with charts only (`/?capabilities=charts`) and ask for the conferences
   on a map. The LLM has never heard of `Map`. It answers in text that it has no map
   component and offers a timeline instead.
2. Switch maps on. A link in the app's header reloads the app with both remotes. Ask
   again. Now the answer is a map.

Between the two steps nothing changed except what was loaded.

There is also no second source that could drift. The words the LLM reads are produced
at startup from the same objects that render. So the vocabulary itself needs no version
number and no registry. If a remote is missing, its words are missing. Nothing else
breaks.

> [!NOTE]
> Two things still need matching versions.
>
> With this renderer a remote has to expose plain Angular components: the A2UI renderer
> for Angular creates them inside the shell's component tree. So shell and remotes must
> run compatible Angular versions, see
> [The monorepo is a simplification](#the-monorepo-is-a-simplification). Closed islands
> with their own Angular inside would need a different renderer.
>
> A surface that is stored and loaded again later needs a version next to it, or a hash
> of the catalog: the remote may have changed in between. This demo does not store
> surfaces yet.

**The LLM can still invent a `Map`.** The system prompt does what it can to prevent it:
it tells the LLM to use only what is listed, and to say so when something is missing. It
can happen anyway, and how often depends on the LLM. Then the check in the shell takes
over. The shell compares every answer with its catalog before it draws anything. An
unknown name is rejected, the LLM gets the reason back and has three attempts to fix it.

→ [The renderSurface round trip](./architecture.md#the-rendersurface-round-trip)

To see how the LLM really behaves, there is an eval script. It plays the demo requests
against the real LLM, once with both remotes and once with charts only, and checks every
answer.

→ [The eval harness](./architecture.md#the-eval-harness)

## How the shell finds its remotes

A manifest lists the remotes that exist. It is a JSON file next to the shell. The URL
can narrow this list. Then Native Federation makes the selected remotes importable at
runtime, each from its own origin:

```ts
// shell startup — pseudocode
// { charts: 'http://localhost:4201/…', maps: 'http://localhost:4202/…' }
const manifest = await fetchJson('federation.manifest.json');

// the URL can only remove, never add
const selected = narrowBy(manifest, '?capabilities=charts');

// Native Federation: make these remotes importable
await initFederation(selected);

// a remote that fails is skipped — the app still starts
const capabilities = await loadEach(selected, './capability');

startAngular(capabilities);
```

Three things follow from this:

- **The URL is a whitelist.** It can switch off what the manifest lists. It can never
  add a remote the deployment does not know, so a link cannot bring in foreign code. I
  decided against localStorage: the selection lives only in the URL, so it is always
  visible and you can share it.
- **A remote is down.** The app still starts, with the remaining vocabulary. The panel
  in the header shows every remote of the manifest as _loaded_ (with the origin it came
  from), _unreachable_ or _not selected_. A failed remote must not look like one that
  was switched off.
- **`./capability` is the only thing a remote exposes.** One module with one export, in
  the shape shown in [A capability has two halves](#a-capability-has-two-halves). I
  defined this contract myself. It is not part of A2UI or AG-UI. Everything else inside
  a remote is its own business. Each remote is also a small standalone page that renders
  its components without the shell.

> [!NOTE]
> Two things are simplified here.
>
> The manifest is a static file, because shell and remotes live in one repository. It
> could just as well come from a backend endpoint. Then the list of remotes is fully
> dynamic.
>
> Native Federation and import maps can also check the integrity of what a remote
> delivers, through SRI hashes. This demo does not switch that on.

→ [Big picture](./architecture.md#big-picture)

## Data stays in the browser

Every surface has its own data model. The data in it is produced in the browser and
stays there. It never passes through the LLM. Two things work on this data, and they are
easy to mix up: local tools and functions.

**Local tools fill the data model.** They are a concept of AG-UI and CopilotKit, which
call them client tools or frontend tools. The conference search is such a tool. It runs
in the browser, and its result is put into the data model of the surface, under a path
such as `/filteredConfs`. The LLM does not get to see the list. It is told how many hits
there are, where they sit and what the first one is. So a long result does not weigh on
the LLM.

**Functions compute a value inside the surface.** They are a concept of A2UI. A prop can
be three things: a literal (`"label": "Tickets left"`), a binding
(`{ "path": "/selectedConf/remaining" }`) or a function call. A function call stands
where the value would stand, and its arguments can be bindings again:

<!-- prettier-ignore -->
```jsonc
// a Text that shows the days until the selected conference starts
{ "id": "days", "component": "Text",
  "text": { "call": "daysUntil",
            "args": { "date": { "path": "/selectedConf/date" } },
            "returnType": "number" } }
```

The browser computes the result, and computes it again when the data changes.

Through bindings the LLM can wire components to each other: one component writes to a
path, another one reads it. In Angular this is mapped onto signals that live in the
shared data context of the surface, so the UI updates by itself.

What a click does is implemented in the component, so the team that owns the remote
decides it. A click can do two things. It can change data locally, through the binding:
nothing leaves the browser. And when it is necessary, it can send an event that the
shell can pass on to the LLM.

### What happens on a click

A click on a map marker does up to two independent things:

1. **It writes.** The clicked conference lands on the path bound to `selected`, here
   `/selectedConf`. Everything bound below that path re-renders: a `Gauge` on
   `/selectedConf/remaining`, a `Text` on `/selectedConf/name`. No LLM call, no
   server. That is why the detail view reacts at once. The `Map` and the `Gauge` come
   from different remotes and know nothing of each other. They meet only in the data.
2. **It may notify.** If the LLM gave the component an `action`, the click also sends
   an event to the shell, for example `reserve` with the conference's id. The shell
   decides what an event means: it can handle it locally, or turn it into a new request
   to the LLM. An action can also be a local function call instead of an event. That one
   runs in the browser and is never sent anywhere.

→ [Invariants worth knowing](./architecture.md#invariants-worth-knowing) has the exact
rules for who may write which data.

## The monorepo is a simplification

Shell and remotes share one repository and one `node_modules` here. I did that to keep
the demo small. It is not the point of the demo: everything in this workspace could be
built without Native Federation. Native Federation pays off when remotes do _not_ share
a repository: other teams, other release cycles, other servers. Micro frontends are the
UI counterpart of independent microservices.

What already holds here: the remotes are loaded at runtime across origins, the shell on
port 4200, the remotes on 4201 and 4202. The agent server with Mastra is a fourth
process, on port 3001. Sheriff checks the imports with every `npm run lint`: a remote may
depend on the contract and on published packages, on nothing else. So each remote could
move into its own repository tomorrow.

What changes in a real setup:

- The contract, the shape of a capability, becomes a published, versioned package
  instead of a shared folder.
- One `node_modules` no longer guarantees that shared libraries such as Angular match.
  They are negotiated at load time: every remote declares what it needs (`singleton`,
  `strictVersion`, `requiredVersion`). A mismatch shows when the remote is loaded, not
  when it is built. The
  [Native Federation DevTools](https://native-federation.com/docs/v4/devtools/) help to
  debug this: they show which version of a shared package won and who provides it.
  Remote components render inside the shell's component tree, so a single Angular
  instance is mandatory. The price: all teams upgrade Angular in step.

## The idea in one sentence

The request decides what is composed, the vocabulary decides what is possible, and
Native Federation decides who delivers the vocabulary.

- **The request decides what is composed.** For every question the LLM picks the
  components that fit and wires them.
- **The vocabulary decides what is possible.** The LLM can only use what the loaded
  capabilities announce.
- **Native Federation decides who delivers the vocabulary.** Every capability comes from
  a remote that a team builds and serves on its own.

## Where to go next

- [architecture.md](./architecture.md) — diagrams, who owns which layer, and the
  invariants.
- [README, "Adding a remote"](../README.md#adding-a-remote) — the checklist for a third
  capability.
