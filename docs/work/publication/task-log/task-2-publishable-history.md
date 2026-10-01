# Task 2: Make the history publishable

### Task

Remove the book notes and three pieces of private context from the tree in a normal commit, and
prepare and prove the `git filter-repo` rewrite that removes them from every commit before the
repository is published as `native-federation-a2ui`.

### Status

DONE for the agent's part: the tree is fixed, the rewrite script and its two rule files exist
outside the repository, and the whole script is proven on a scratch clone. Still to do, by the
user, as the plan assigns it: merge into `main`, run the real rewrite, create the new GitHub
repository, push, and check a fresh clone (see Open Issues). No independent review was performed.

### Files Modified

- `docs/book-learnings.md` (deleted) — the notes derived from the book leave the repository.
- `docs/spec.md` (modified) — two sentences of private context trimmed (the status line and the
  publication section); the pointer to the removed file dropped from the header.
- `docs/architecture.md` (modified) — new invariant *Distances are great-circle distances* under
  "Federation and boundaries": the author's own note on earth-surface distances, translated,
  condensed and re-measured.
- `docs/work/m1-spike/plan.md` (modified) — the "Background" pointer to the removed file dropped.
- `docs/work/m1-spike/task-log/task-1-workspace-scaffold.md` (modified) — one "Files Read" line
  removed (on the removal list); the entry for the removed file marked as removed.
- `docs/work/m1-spike/task-log/task-3-conference-domain.md` (modified) — three record lines
  marked "removed before publication"; the pointer to the distance reasoning re-pointed to
  `docs/architecture.md`. The verbatim `git diff --stat` block is unchanged.
- `docs/work/m2-nf-split/task-log/docs-publication-replan.md`,
  `docs/work/m3-reserve-maps-hosting/task-log/docs-m3-plan.md` (modified) — one "Files Read"
  entry each marked "removed before publication".
- `docs/improvements.md` (modified) — one entry promoted from the Task 1 log (the stale
  production-note sentence in `docs/spec.md`).
- `docs/work/publication/task-log/task-2-publishable-history.md` (new) — this log.

Outside the repository, in `~/projects/native-federation-a2ui-rewrite/`:

- `rewrite.sh` — clones `main` fresh, runs `git filter-repo`, verifies the result, prints the
  manual steps for the push. It never pushes and never touches the working repository.
- `replacements.txt` — the three `--replace-text` rules (the removed wording).
- `removed-wording.txt` — three fixed strings the script searches for, before and after.

### Files Read (Context Only)

- `docs/work/publication/plan.md` (preamble and Task 2 block),
  `docs/work/publication/task-log/task-1-readme-for-publication.md`.
- `docs/architecture.md` (reading map, "Invariants worth knowing"), `docs/improvements.md` (tail).
- `src/app/domain/geo.ts`, `src/app/domain/cities.ts`, `src/app/domain/conferences.json`,
  `projects/mfe-maps/src/maps/` (listing) — for the distance note and its figures.
- `docs/assets/readme/remotes-charts-and-maps.png` — looked at for private context.
- `git_filter_repo.py`, `get_replace_text` — how a rule line is parsed.

### Key Decisions

- **The removal list (user approved).** Four entries: `docs/book-learnings.md` as a whole, two
  sentences in `docs/spec.md`, one line of the M1 task-1 log. The wording itself is only in the
  two rule files outside the repository. The scan covered the tree and all 54 commits for the
  book, people's names, chat channels, e-mail addresses, home-directory paths and keys.
- **Found and left as they are (user approved).** Session transcript paths in the logs'
  "Sessions" sections (about 35 with `~/`, four absolute); the names of other local repositories
  (`~/projects/a2ui`, `FrankensteinMeetingRoom`, `flights42`, `nf`); the book cited as a source
  with a chapter number in `docs/spec.md`; the subject of the commit that added the spec and the
  notes ("… and book learnings"); the commit identity `kontakt@lutzleonhardt.de`. None of them
  says more than the LICENSE and the README already do. No key, no e-mail address in a file and
  no chat channel was found; the only env file ever tracked is `.env.example`.
- **Only `main` is published (user approved).** The merged feature branches and the tag
  `m1-gate` (referenced nowhere) stay behind. Their tips still contain the notes, so the rewrite
  necessarily changes their trees; the "tip for tip" criterion cannot hold for them.
- **The script refuses a `main` without the tree fix.** The rewrite leaves the tip unchanged
  only because this task's commit removes the wording by hand first; the rules then match old
  commits only. Run before the merge, the script stops with "merge the tree fix first".
- **The script always starts from a fresh clone.** It can be run again after any later commit
  on `main` (the README revision, for instance). `--no-local` makes git pack the objects, which
  is what `filter-repo` accepts as a fresh clone; a hard-linked local clone is refused.
- **Checks inside the script, beyond the tree comparison.** No commit touches the removed path;
  the path's old blobs are gone from the object store (this also covers a copy under another
  path); no file version and no commit message contains a string of `removed-wording.txt`; the
  only ref is `refs/heads/main`. The script takes source and target as optional arguments
  because the scratch proof needs both.
- **Two rules replace a fragment with nothing, one removes a whole line.** The two sentences in
  the spec are identical in every version, so two literals cover all of history and the
  sentences around them still read cleanly. The log line is removed with a `regex:` rule that
  includes the line break; a literal would leave an empty list item.
- **The distance note is a prose invariant, in English, with current figures.** The original
  section was German and justified itself with the screencast; `docs/architecture.md` is English
  and describes the code. The figures were measured again on today's data: 11 fallback cities
  instead of 10, so 4785 pairwise orderings; plain Pythagoras on degrees is off by up to 64 %,
  inverts 375 orderings and changes 22 memberships of a 300 km radius. The note's "about 71 km
  per degree of longitude at 52° N" was corrected to about 68 km (71 km belongs to about 50° N).
  The M1 task-3 log keeps its own figures of 2026-09-03 as a record.
- **Mentions of the removed file in old logs.** Pointers a reader would follow are dropped or
  re-pointed. Record lines ("file modified", "files read") keep the name with the suffix
  "removed before publication" — in German in the German task-1 log. Verbatim `git diff --stat`
  output is not touched. Three lines of the M2 replan log are unchanged because they describe
  the file as the one that leaves the repository.
- **The removal list lives in `~/projects/native-federation-a2ui-rewrite/`.** The plan requires
  it outside the repository; a sibling folder survives the session, the job's temp folder does
  not.
- **Commit hashes cited in old logs will dangle (accepted, no objection from the user).** The
  rewrite gives every commit after the first a new hash; `filter-repo` rewrites hashes in commit
  messages, not in file contents. The hashes in the logs are records, not links a reader has to
  follow.
- **The plan's sentence about the same trim in the spec's source copy was not acted on.** Since
  2026-09-30 `docs/spec.md` in this repository is the authoritative version and the copy in the
  user's other repository is no longer mirrored (user decision, recorded in the improvements
  register).

### Review Focus

- **Behavior claims:**
  - After `rewrite.sh`, no commit, blob or commit message of the clone carries
    `docs/book-learnings.md` or a string of the removal list, and the tip tree equals the one
    before the rewrite.
  - Run against a `main` that lacks the tree fix, `rewrite.sh` stops before it clones.
  - No document in the tree sends a reader to the removed file or one of its sections.
- **Plan deviations:**
  - "All branches" are rewritten → only `main` is cloned, rewritten and published → the other
    branches are merged ancestors whose tips cannot keep their trees; user approved.
  - The earth-surface section is "moved" → translated, condensed to one invariant, figures
    re-measured, one figure corrected → the target document is English and describes the
    current data.
  - "The same trim is due" in the spec's source copy → not done → that copy is no longer
    mirrored.
  - Key Locations name `docs/work/m1-spike/task-log/task-3-conference-domain.md` and the task-1
    log → two more logs carried a mention (`docs-publication-replan.md`, `docs-m3-plan.md`).
- **Assumptions / choices:**
  - T2-AC-02 is read as "no pointer a reader would follow": marked record lines and the verbatim
    stat block still name the removed file.
  - The commit identity on all commits is taken to be the author's public address; the user
    saw it in the list and left it.
  - The printed push commands assume the owner `lutzleonhardt`, as the app's links already do.
- **Scope notes:**
  - `docs/improvements.md` gained one line by the promotion rule, not by this task's content.
  - `package.json` is modified in the working tree and is not part of this task (see Open
    Issues).
  - Of the binary assets only one README screenshot was looked at; the second screenshot, the
    hero GIF and the design PNGs under `docs/design/departure/` were not.
- **Read next:**
  - `~/projects/native-federation-a2ui-rewrite/rewrite.sh` — the guards before the clone and the
    five checks after the rewrite; this is what the user runs on the real history.
  - `docs/architecture.md`, *Distances are great-circle distances* — new wording and new
    figures in a reference document.
  - `docs/spec.md`, line 3 and section 13 — the two trimmed sentences in context.

### Test Evidence

- **Scan of tree and history** (`git grep` over `git rev-list --all`, 54 commits): names — the
  two sentences in `docs/spec.md` in 53 versions with one wording each, a credit in
  `docs/specs/visual-language.md` and in the README; e-mail addresses in files — none; absolute
  home paths — transcript paths only; key patterns — none (the `sk-` pattern matched "task-…"
  file names only); env files ever added — `.env.example`; deleted paths in history — four
  source files, nothing sensitive; commit identities — one. The removed log line is identical
  in all 52 versions that carry it.
- **Scratch proof of the whole script.** A throwaway clone under `$TMPDIR` got this task's tree
  fix as a scratch commit on `main` (`git diff HEAD -- docs | git apply --index`); nothing was
  committed in the working repository. `rewrite.sh <staging> <target>` exited 0 and printed:
  tip tree unchanged (`9f6e14c9660459b0d1f637ffb83edd74c20e896e`), 55 commits before and after,
  no commit, blob or message with the removed file or wording, only `refs/heads/main`. The 55
  include the scratch commit.
- **Independent check on a fresh clone of the result** (`git clone --no-local`): commits that
  touch the removed path — 3 in the staging clone, 0 in the fresh clone; file versions that
  contain a string of `removed-wording.txt` — 105 before, 0 after; tip tree identical; the only
  branch is `main`. The oldest version of `docs/spec.md` and of the M1 task-1 log were read
  after the rewrite: the sentences around the removed fragments are intact.
- **Earlier run, path removal only** (`git filter-repo --invert-paths`, by hand, before the rule
  files existed): tip tree identical, 55 commits, both old blobs gone, `origin` removed by the
  tool. Superseded by the full run above.
- **Guard:** `bash rewrite.sh` against the working repository, whose `main` lacks the tree fix —
  "FAILED: main of … still contains docs/book-learnings.md; merge the tree fix first", exit 1,
  nothing cloned. `bash -n rewrite.sh` — syntax ok.
- **Pointers** (`git grep book-learnings`): the remaining mentions are the marked record lines
  (task-1 log line 59; task-3 log lines 57, 70, 185; replan log line 37; M3 plan log line 37),
  the stat block of the task-3 log, three lines of the replan log that describe the removal,
  and the publication plan. `git grep` for the three strings of the removal list over the tree —
  no hit.
- **Distance figures:** a one-off inline node script (never a file) over `cities.ts` and
  `conferences.json`: Pythagoras on degrees — max error 64.1 %, 375 of 4785 orderings inverted,
  22 differing 300 km memberships; with `Δlon · cos(lat)` — 0.2 %, 0, 0; Berlin–Munich 504 km,
  Berlin–Warsaw 517 km, ratio on degrees 1.60; 68.5 km per degree of longitude at 52° N.
- `git diff --check` — clean. `npx prettier --check docs/architecture.md` warns, and warns on
  the committed version as well (emphasis style, 168 lines); the new paragraph follows the
  file's existing style.
- **Living documents**, by grep for the removed file, the distance terms and "publication":
  `docs/architecture.md:958` ("Next. Publication …") still holds until the push;
  `docs/improvements.md:61` (the spec's header line) still holds; `docs/spec.md:189` matches
  what was done. Nothing was stale from this task.
- Temporary artefacts: the staging clone, both rewritten clones, the fresh clone and the patch
  file under `$TMPDIR` are deleted. No test suite was run: the change is documentation only.

### Acceptance Coverage

- **T2-AC-01** — partial. Proven on the scratch clone and on a fresh clone of its result (see
  Test Evidence); the published repository does not exist yet. The script repeats the checks on
  the real history, and step 3 of its printed instructions is the check on the published clone.
- **T2-AC-02** — partial, checked by grep and by hand: every remaining mention is a marked
  record, verbatim tool output, or a sentence about the removal itself. No durable automated
  check exists.
- **T2-AC-03** — partial. Proven on the scratch clone for `main`, the only branch that is
  rewritten; the script fails if the real run changes the tip tree.

### Open Issues

- The user's steps of this task, in order (→ Task 2, user): commit; merge `feature/publication`
  into `main`; `bash ~/projects/native-federation-a2ui-rewrite/rewrite.sh`; create the empty
  repository; push `main` from the `publish/` folder; check a fresh clone; point `origin` of the
  working folder at the new repository and keep the old private one until that check is done.
  After the switch the old local branches still hold the old history — never `git push --all`.
- Before the real run, from Task 1 (→ Task 2, user): the README revision, the credits shown to
  the book's author, the owner of the new repository (assumed `lutzleonhardt` in four literals
  of the app and in the script's printed commands), and `package.json`, which is modified in the
  working tree by neither task (`build:deploy` with `--base-href /conference-finder/`; if it is
  committed, `docs/development.md:41` and `docs/architecture.md` name the old form).
- Promoted: `docs/spec.md` line 114 names the README as the place of the production note
  (→ improvements register).

### Context for Next Task

- This is the last task of the scope. What follows is the user's publication run; the script's
  output lists every command.
- The rule files contain the removed wording. They stay outside every repository; this log and
  the plan name files only.
- After the rewrite every commit hash differs from the ones in the old private repository and in
  the logs. In home mode no link depends on a hash.
- The working folder keeps its name; renaming it would orphan the agent's memory directory.
- `git status` inside the sandbox lists dot files (`.bashrc`, `.gitconfig`, …) as untracked;
  they are sandbox mounts, not files of the repository.

### Git State

`git diff --stat`:

```
 docs/architecture.md                               |  18 ++
 docs/book-learnings.md                             | 273 ---------------------
 docs/improvements.md                               |   1 +
 docs/spec.md                                       |   6 +-
 docs/work/m1-spike/plan.md                         |   2 +-
 .../m1-spike/task-log/task-1-workspace-scaffold.md |   4 +-
 .../m1-spike/task-log/task-3-conference-domain.md  |  15 +-
 .../task-log/docs-publication-replan.md            |   3 +-
 .../task-log/docs-m3-plan.md                       |   2 +-
 package.json                                       |   2 +-
 10 files changed, 37 insertions(+), 289 deletions(-)
```

`git status --short` (repository files only; sandbox mounts omitted):

```
 M docs/architecture.md
 D docs/book-learnings.md
 M docs/improvements.md
 M docs/spec.md
 M docs/work/m1-spike/plan.md
 M docs/work/m1-spike/task-log/task-1-workspace-scaffold.md
 M docs/work/m1-spike/task-log/task-3-conference-domain.md
 M docs/work/m2-nf-split/task-log/docs-publication-replan.md
 M docs/work/m3-reserve-maps-hosting/task-log/docs-m3-plan.md
 M package.json
?? docs/work/publication/task-log/task-2-publishable-history.md
```

Branch `feature/publication`, one commit ahead of `main` (`1bdeeab`).

### Sessions

- claude-code b5a79bca-4040-428a-979b-4edcfebcd473 (2026-10-01) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/b5a79bca-4040-428a-979b-4edcfebcd473.jsonl
