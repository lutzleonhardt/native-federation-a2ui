# Plan: ConferenceFinder — Publication

Spec: the README brainstorm of 2026-09-19 (chat), inlined into the tasks below; `docs/spec.md` §0 is the anchor for README, post and talk.
Predecessor: `docs/work/m2-nf-split/plan.md` — M2 ends with its Task 9 (the demo in English, eval figures on the English strings). Predecessor: the `visual-language` scope (`docs/specs/visual-language.md`) — the design pass.
Scope: make the repository ready to be public under the name `native-federation-a2ui` — the README, then a history without book notes and private context. Out of scope: the article (after M3), hosting and replay (M3).

Decisions taken while planning; do not re-derive:

- **This scope starts after both predecessors are merged.** The hero GIF and the screenshot show the final design and the English prompts, and one FAQ answer (design consistency across teams) only becomes true with the design pass.
- **This scope runs after M3 (user, 2026-09-25).** The README's facts — the hosted replay demo, the MapLibre map, request 4 — come from M3, and Task 2 must be last anyway; both tasks run in one pass once M3 is merged. `docs/spec.md` §8 names the publication as its own step after M3.
- **Who writes what.** Prose that carries the user's voice — README, FAQ — is written by the user; the agent supplies verified facts and checks the result against the code. The FAQ doubles as the user's talk script.
- **SRI is named, never built.** The README describes it as a trade-off under "what a real deployment needs".
- **A new GitHub repository instead of a rename.** After a force-push the old commits stay fetchable by hash; a fresh repository never had them. The app keeps the name ConferenceFinder.

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

## Task 1: Rewrite the README for publication

### Instructions

The README becomes the front door of a public repository named `native-federation-a2ui`; the app
keeps the name ConferenceFinder. The user writes the prose. The agent supplies, per section, the
verified facts with `file:line`, the figures from the task logs and the anchor to link to, and checks
the finished text against the code. Every invariant is written once: a FAQ answer is three to five
sentences plus a link into `docs/architecture.md` or `docs/how-it-works.md`, and a fact without a
home there is added there first. The FAQ doubles as the user's talk script.

Section order:

1. Title **Federated Agentic UI**. The tagline introduces "capabilities" as the first term — what the
   assistant can say, and what the browser can draw. The existing sentence ending in "Native
   Federation decides who delivers vocabulary" stays, extended by "demonstrated with
   ConferenceFinder". One line up here credits the book.
2. The hero GIF (~15 s: ask for a map → the gap is named → switch maps on → the map) and a
   screenshot (demo left, extension graph right). Both show the final design and the English
   prompts; the user records the GIF, and both files land in the repository with the README.
3. The two halves in 30 seconds: `vocabulary` goes to the model, `components` to the renderer,
   coupled by one name union.
4. The existing quickstart, with the M2 status.
5. "Nobody needs an AI-composed conference finder. The domain is deliberately small so the mechanism
   stays visible."
6. The FAQ, grouped by reader, skeptic first.
7. "Where this pays off" — and where it does not.
8. "Not production-ready: what a real deployment needs".
9. Background and credits.
10. "Adding a remote" and the eval section stay. One sentence says `docs/work/` holds the plans and
    task logs on purpose, as a showcase of the workflow.

FAQ — question and the kernel of the answer:

- *Skeptic.* Is a conference finder a realistic use case? — "No, and that's the point." · Would this
  work without Native Federation? — the monorepo paragraph, condensed from `docs/how-it-works.md`
  and not repeated: everything here could be built without it; the module boundaries keep each
  remote repo-portable. · What changes when a new team delivers a
  capability, and what does not? — a manifest entry yes, shell code and agent server no; in a real
  setup the manifest is a discovery service. · Why a reload instead of hot-add? · How do you know the
  model does this reliably? — the eval gate, 4 of 5, the "names the gap" scenario.
- *Agentic-UI reader.* How does Mastra talk to Angular? — AG-UI, one POST and one SSE stream per run.
  · Does the agent server know the components? — no: "the server holds no vocabulary". · What stops
  the model from inventing components? — guard order, correction run, a budget of 3. · Who supplies
  the data? — "Structure from the model, data from code." · Why not CopilotKit's built-in A2UI path?
  · What about i18n? — the shell is English, the model answers in the user's language, no
  translation files.
- *NF reader.* How are the module boundaries enforced? — Sheriff, three rules. · What if a remote is
  unreachable? — timeout, panel status, the rest keeps running. · How does it stay one zod and one
  Angular across the boundary? · Can a remote run alone? — yes, the standalone pages with
  non-conference data. · How does the design stay consistent across teams? — the shell sets CSS
  custom properties, the remotes consume them. · A team swaps its implementation: does the model
  notice? — no, same vocabulary, same eval verdicts.
- *Architect.* A remote writes text into the system prompt: a risk? — the security block. · How do
  you steer capabilities per role or user? — a filtered manifest; described, not built. · What does a
  run cost, and the eval?

"Where this pays off":

- The criterion is unpredictable questions against structured data with many forms of presentation —
  not "lots of data".
- The natural home is BI, dashboards and internal cockpits: cross-filtering is the selection
  mechanism, several teams own visualizations, and the model does not read the data set.
- Where it does not fit: fixed processes and form flows — the hand-built screen wins there.
- The staging: first natural language as a command layer over the existing UI (tool calls, no A2UI),
  then generative composition only where the presentation is really open.
- The rule: several teams, requests that cut across them, UIs nobody built in advance. If one
  condition is missing, a widget tool is enough.
- Tone: "where it pays off", never "overhyped".

Security and production readiness:

- Two threats, kept apart: the integrity of the code and the content of the vocabulary.
- A remote is fully trusted code anyway and the trust boundary is the manifest. New is only the path
  through the prompt; the damage is bounded because the server has no tools.
- SRI is named as an honest trade-off and **not implemented**: it protects only if the hash comes
  from the host side, which collides with independent deployability; the way out is a registry with
  signed hashes.
- Built: the manifest whitelist, `isAgentCapability`, schema validation at the tool boundary,
  rollback, the correction budget.
- Missing for production: authentication in front of the agent endpoint (CORS is not access
  control); per-user budget and rate limit plus provider-side cost caps; limits on input length,
  `max_tokens` and step count; topic binding with off-topic eval scenarios; a length limit and schema
  for remote descriptions, with delimiters in the prompt; vocabulary review as part of accepting a
  remote; injection through data content; logging of what the model saw.
- The hosted version (M3) runs no live model in replay mode and takes free text only with BYOK, so it
  needs no rate limiting.

Background and credits: one short section — the base architecture follows the book "Agentic UI with
Angular" (with a link); this repository adds Native Federation as the delivery mechanism, the
two-halved capability contract, enforced boundaries and the eval gate. No cover banner, no call to
buy. The user shows the section to the book's author before publication.

### Acceptance

- **T1-AC-01** — Every FAQ answer links to a section that exists and carries the linked invariant;
  no invariant is explained in full in two places.
- **T1-AC-02** — Every figure and every behavioral claim in the README is backed by a task log entry
  or by a `file:line` recorded in this task's log.
- **T1-AC-03** — "What is built" lists only mechanisms present in the code; SRI, authentication,
  rate limits and topic binding appear only under what a real deployment needs.

### Quick functional check

Open the rendered README and follow every FAQ link: each lands on the section that carries the
answer's invariant.

### Key Locations

- `README.md`; link targets `docs/architecture.md` (*Invariants worth knowing*) and
  `docs/how-it-works.md`.
- `docs/improvements.md:19` — the register entry for the monorepo paragraph, ticked here.

### Key Discoveries

- `findConferences` returns to the model only `{ ok, count, mountedAt, next? }`, where `next` is the
  first hit's `id`, `name`, `city`, `date` and `distanceKm`
  (`src/app/agent/tools/find-conferences.tool.ts:38-44`). "The model never sees the data" is
  therefore wrong as stated: it sees a count and one row, never the list — and `next.name` and
  `next.city` are the concrete channel for injection through data content.
- SRI in the installed packages (read 2026-09-19): the builder `@softarc/native-federation` 4.6.0
  writes a per-file sha384 map into `remoteEntry.json` with `features.integrityHashes` (default
  `false`, unset in all three federation configs); the orchestrator 4.6.1 copies that map into
  `importMap.integrity` and accepts `{ url, integrity }` manifest entries and `manifestIntegrity`.
  Only the hash of `remoteEntry.json` comes from the host side, and it changes with every deploy of
  the remote — that is the collision with independent deployability.
- The eval figures and the English prompts come from the log of Task 9 in the predecessor scope
  (`docs/work/m2-nf-split/task-log/`).
- The FAQ answer on design consistency — the shell sets CSS custom properties, the remotes consume
  them — was not true on 2026-09-21: no `var(--…)` existed anywhere in shell or remotes. It depends on
  the design pass; verify it in the code before it is written down.
- `/voice-curate` takes the voice from curated text in the target file, and no English text by the
  user exists yet: the first section is written by hand and serves as the reference for the rest.
- The article is outside this plan (after M3): a narrated short version linking to the repository,
  opening with the BI framing, the conference finder as the illustration.

## Task 2: Make the history publishable

### Instructions

Before the repository becomes public, content that must not be public leaves the tree *and* every
commit on every branch. Two kinds: notes derived from the book beyond a plain credit, and private
context. This task runs last, after every other scope is merged, so that one pass covers everything.

1. Build the removal list and agree it with the user before anything is rewritten. It lives outside
   the repository — this plan and the task log name files, never the removed wording. Known entries:
   `docs/book-learnings.md` as a whole, two sentences of private context in `docs/spec.md`, one line
   of the M1 task-1 log. Scan for more: the book, people's names, chat channels, e-mail addresses,
   home-directory paths, keys. Plain mentions of the book as a source ("deviation from the book",
   "as in the book repo") stay — the README credits it openly.
2. Fix the tree in a normal commit: delete and trim, reword the pointers that would dangle, and move
   the one section of `docs/book-learnings.md` that is the author's own note (earth-surface
   distances) next to the haversine invariant in `docs/architecture.md`. `docs/spec.md` is a copy
   from another repository of the user; the same trim is due there.
3. Rewrite the history with `git filter-repo`: drop the path, replace the agreed wording, all
   branches. The agent prepares the commands and proves them on a scratch clone; the user runs the
   real rewrite and every push.
4. Publish into a **new** GitHub repository `native-federation-a2ui` instead of renaming the old
   one: after a force-push the old commits stay fetchable by hash on GitHub, a fresh repository
   never had them. Point `origin` at it and keep the old private repository until the new one is
   verified.

### Acceptance

- **T2-AC-01** — In a fresh clone of the published repository no commit on any branch contains
  `docs/book-learnings.md` or any wording of the agreed removal list.
- **T2-AC-02** — No document in the tree points at a removed file or section.
- **T2-AC-03** — Tip for tip, every rewritten branch has the tree it had before the rewrite.

### Quick functional check

Clone the new repository fresh and search its whole history for the removed file name: no commit
turns up.

### Key Locations

- `docs/book-learnings.md`, `docs/spec.md`, `docs/work/m1-spike/plan.md:3`,
  `docs/work/m1-spike/task-log/task-1-workspace-scaffold.md`,
  `docs/work/m1-spike/task-log/task-3-conference-domain.md`, `docs/architecture.md`.

### Key Discoveries

- The repository was private on 2026-09-19 (unauthenticated requests got 404), so nothing has been
  public. `docs/book-learnings.md` is touched by two commits and is on `origin/main`.
- The task logs hold no longer quotations from the book, only short references (checked 2026-09-19).
- Branches at planning time: `main` and `feature/m2-nf-split` on origin, `feature/visual-language`
  local only. `git filter-repo` is installed; it expects a fresh clone.
- Home mode: task logs are committed files, not git notes, so rewritten hashes break no log link.
- The local folder name keys the agent's memory directory; renaming the folder is optional and would
  orphan it.
