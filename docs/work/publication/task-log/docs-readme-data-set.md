# docs: say what data is behind the demo

### Task

Add one short paragraph to the README that says what the conference data is and links the file,
so a reader of the public repository knows the data is invented and what a free question can
find.

### Status

DONE. The text is a draft by the agent that the user asked to be inserted; no independent review
was performed.

### Root Cause

Not a bug. Neither the README nor the app said that the conferences are invented, although the
demo shows prices and a reserve button, and nothing told a reader of the local setup which
topics and countries exist — a free question outside them returns nothing and reads as a broken
demo. The hosted demo needs no such knowledge: it only plays the four example prompts.

### Files Modified

- `README.md` (modified) — "What data is behind it?" under "Run it locally": thirty invented
  conferences, five topics, nine European countries, the fields, dates as offsets from today,
  and a link to `src/app/domain/conferences.json`.
- `docs/improvements.md` (modified) — one entry: the `url` field of every conference points to
  a page that does not exist.
- `docs/work/publication/task-log/docs-readme-data-set.md` (new) — this log.

### Files Read (Context Only)

- `README.md` (quickstart and the first FAQ group), `src/app/domain/conferences.json`,
  `src/app/domain/conference.ts`, `src/app/chat/example-prompts.ts`, `public/recordings.json`
  (grep), `docs/spec.md` (section 8b, grep).

### Key Decisions

- **One sentence and a link, no listing (user asked which of the three).** Thirty rows on the
  front page would be ballast; the README stays short and links out. The link target is the JSON
  file itself, which is the complete list.
- **The README, not the app.** A line in the Details panel would reach the hosted visitor too,
  but needs a new build and deploy, and that visitor can only click the four example prompts.
  Not built.
- **Placed under "Run it locally".** That is where a reader starts to ask freely; the sentence
  before it names what the search offers.
- **"Invented" is stated outright.** The names are made up, but prices and a reserve button
  invite the question.
- **The `url` field is left out of the sentence.** It points to `/conf-sites/<id>.html`, pages
  of an idea that was never built. No recording uses it, so the hosted demo shows no dead link;
  the gap is in the improvements register.
- **"Nine European countries"**, not "in central Europe" as first drafted: Denmark, the
  Netherlands, Belgium and Luxembourg are among them.
- **Open points of the Task 2 log, settled by the user in this session.** The README revision is
  done and the credits are in. The new repository is created under `lutzleonhardt`, so the four
  links in the app and the rewrite script's printed commands stand. `package.json` is not
  committed: the `--base-href` of the user's own host stays a local change, and the documented
  form `npm run build:deploy -- --base-href /path/` stays valid.

### Review Focus

- **Behavior claims:**
  - The README names the size, the topics, the countries and the fields of the data set, says
    it is invented, and links the file.
- **Plan deviations:** No plan (fix lane).
- **Assumptions / choices:**
  - The bold-question form is the FAQ's; under "Run it locally" it stands alone. The user
    approved the draft in that form; the README's prose is the user's to revise.
- **Scope notes:**
  - `docs/improvements.md` gained one line by the promotion rule.
  - `package.json` is modified in the working tree and deliberately not part of any commit.
- **Read next:**
  - `README.md`, "Run it locally" — the new paragraph next to the sentence about asking freely.

### Test Evidence

- Figures, by a one-off inline node call over `src/app/domain/conferences.json`: 30 entries;
  topics angular 9, dotnet 7, web 6, ai 4, cloud 4; countries DE, NL, AT, CZ, CH, PL, BE, DK,
  LU; `dayOffset` 3 to 296, so every conference lies ahead of today.
- Link: `src/app/domain/conferences.json` exists at the path the README links.
- `url` field: `git ls-files` lists no `conf-sites` path; `grep -c conf-sites
  public/recordings.json` — 0.
- `git diff --check` — clean.
- Living documents, by grep for "invented", "five topics", "nine countries" and `conf-sites`:
  no other document states these facts, so nothing became stale; `docs/spec.md:213` names the
  pages as part of a later extension.
- Not verified: the paragraph as GitHub renders it.

### Open Issues

- Promoted: the `url` field of the conference records points to pages that do not exist
  (→ improvements register).

### Git State

`git diff --stat`:

```
 README.md            | 7 +++++++
 docs/improvements.md | 1 +
 package.json         | 2 +-
 3 files changed, 9 insertions(+), 1 deletion(-)
```

`git status --short` (repository files only; sandbox mounts omitted):

```
 M README.md
 M docs/improvements.md
 M package.json
?? docs/work/publication/task-log/docs-readme-data-set.md
```

Branch `feature/publication`, two commits ahead of `main` (`73fdad4`).

### Sessions

- claude-code b5a79bca-4040-428a-979b-4edcfebcd473 (2026-10-01) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/b5a79bca-4040-428a-979b-4edcfebcd473.jsonl
