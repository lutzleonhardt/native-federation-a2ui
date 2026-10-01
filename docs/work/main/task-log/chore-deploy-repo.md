# chore: publish the repository as native-federation-a2ui

### Task

Carry out the publication run that publication Task 2 prepared: bring the work onto `main`,
rewrite the history, create the GitHub repository `lutzleonhardt/native-federation-a2ui`, push,
check a fresh clone, make it public, and point the working folder at it.

### Status

DONE. The repository is public and holds `main` only. No independent review was performed. Not
looked at: the README as GitHub renders it.

### Root Cause

Not a bug. These are the steps the publication plan assigned to the user. The user ran the
rewrite script and handed the rest to the agent step by step: the fast-forward, the repository
with its metadata, the push, the switch to public and the change of `origin`.

### Files Modified

- `docs/architecture.md` (modified) — "Status and history": the entry "Next. Publication …"
  became "Publication, 2026-10-01", with the repository link and one sentence on the hashes
  cited in older task logs.
- `docs/work/main/task-log/chore-deploy-repo.md` (new) — this log.

Outside the tree:

- GitHub: `lutzleonhardt/native-federation-a2ui` created, filled and made public.
- The working folder's remotes: `origin` is the new repository, the former `origin` is
  `old-private`; the local `main` follows `origin/main`.
- `~/projects/native-federation-a2ui-rewrite/publish/` — the rewritten clone the push came from.
- `package.json` — the local `--base-href` change in `build:deploy` was discarded.

### Files Read (Context Only)

- `README.md` (header, link definitions), `LICENSE`, `package.json`.
- `docs/work/publication/task-log/task-2-publishable-history.md`, `docs-readme-data-set.md`
  (written earlier in this session).
- The metadata of `native-federation/devtools` (`gh repo view`), as the model for this
  repository's "About" box.

### Key Decisions

- **Merge first, then rewrite.** The script clones `main` and refuses a `main` without the tree
  fix. The reverse order does not work: after the rewrite every commit has a new hash, and
  merging an old branch into the new `main` would bring the old commits back, removed file
  included.
- **A fast-forward, not a rebase.** `main` was a direct ancestor of `feature/publication`, so
  only the branch pointer moved; no commit changed and no merge commit exists.
- **The local `package.json` change was discarded (user).** It hard-wired the base href of the
  user's own host into `build:deploy` and was temporary; the site is deployed. The documented
  form `npm run build:deploy -- --base-href /path/` stays the only one.
- **Private first, public after the check.** The user asked for the repository without naming a
  visibility. It was created private so that the push and the fresh-clone check came before
  anything was public; it went public on the user's explicit yes.
- **Created empty.** No README and no licence from GitHub: an initial commit there would have
  made the first push a non-fast-forward.
- **Metadata after `native-federation/devtools` (user).** A one-sentence description built from
  the README's title and tagline; the homepage is the hosted demo, as theirs is the project
  site; four topics taken over (`angular`, `native-federation`, `micro-frontends`,
  `module-federation`) and five added (`a2ui`, `ag-ui`, `agentic-ui`, `generative-ui`, `llm`);
  issues and projects left at their defaults, as there.
- **Only `main` is pushed, no tag.** As decided in Task 2.
- **The working folder keeps its name and its untracked files.** `origin` was re-pointed and
  `main` reset with `git checkout -B main origin/main`; both tips have the same tree, so no file
  changed. A fresh clone into a new folder would have meant a new `node_modules` and `.env`.
- **The status entry names the rewrite.** A reader who follows a hash from an older task log
  finds nothing in the public repository; one sentence in `docs/architecture.md` says why.

### Review Focus

- **Behavior claims:**
  - A fresh clone of the public repository has 56 commits on `main`, no other branch and no
    tag, and no commit, file version or commit message carries `docs/book-learnings.md` or the
    wording of the removal list.
  - The tip of the public `main` has the tree the working folder had before the rewrite.
  - In the working folder `git push` on `main` goes to the new repository.
- **Plan deviations:** No plan (fix lane). Against publication Task 2: the plan has the user run
  every push → the user delegated the push and the switch to public to the agent in this
  session.
- **Assumptions / choices:**
  - The description and the five added topics are the agent's wording; the user saw them and
    has not changed them.
- **Scope notes:**
  - `docs/architecture.md` changed by the living-documents check, not by the publication
    itself: its "Next" entry had become stale.
  - This log sits in scope `main` because the session was on `main` when it was written; the
    logs it continues are in scope `publication`.
- **Read next:**
  - The repository page on GitHub — the rendered README (centered header, GIF, emoji bullets)
    and the "About" box.
  - `docs/architecture.md`, "Status and history", the publication entry.

### Test Evidence

- **Fast-forward:** `git merge-base --is-ancestor main feature/publication` held;
  `git merge --ff-only feature/publication` moved `main` by three commits; the working tree was
  clean.
- **The real rewrite** (`bash ~/projects/native-federation-a2ui-rewrite/rewrite.sh`, run by the
  user): tip tree unchanged (`52a6cbf57d3e3b21b06fa8f860f6e4a5a8e91c29`), 56 commits before and
  after, no commit, blob or message with the removed file or wording, only `refs/heads/main`.
- **Independent check of the rewritten clone:** commits that touch the removed path — 3 on the
  working folder's old `main`, 0 in the clone; file versions with a string of the removal list —
  105 and 0; one commit identity on all 56 commits.
- **Before the push:** the GitHub repository was empty and private; the clone had no remote.
- **Push:** `git push -u origin main` — `* [new branch] main -> main`; `git ls-remote origin`
  lists `HEAD` and `refs/heads/main` at `e40be3b`.
- **Fresh clone of the private repository** (in a temp folder, removed afterwards): no commit
  touches `docs/book-learnings.md`; 0 file versions and 0 commit messages with a string of the
  removal list; 56 commits; tip `e40be3b` with tree `52a6cbf…`; no tag on the remote.
- **After the switch to public:** `gh repo view` — `PUBLIC`, MIT, default branch `main`.
  Requests without a login: the repository page 200, `README.md` on `main` 200, the hero GIF
  200, `docs/book-learnings.md` 404; the old repository 404, so it is still private.
- **Working folder:** `git remote -v` — `origin` is the new repository, `old-private` the old
  one; `main` at `e40be3b`, following `origin/main`; status clean.
- **Living documents**, by grep for "publication" and "public repo": `docs/architecture.md`
  carried the stale "Next" entry (fixed); `docs/improvements.md`, `docs/how-it-works.md`,
  `docs/development.md` and the README say nothing that the publication made untrue.
  `docs/spec.md` describes the publication as a step after M3 and was not changed.
- Not verified: the README as GitHub renders it. No test suite was run; nothing in the code
  changed.

### Open Issues

None.

### Context for Next Task

- Acceptance of publication Task 2: its log records T2-AC-01 and T2-AC-03 as partial because
  the published repository did not exist yet. The evidence on the published repository is in
  this log.
- The working folder still holds the old history: the branches `feature/publication`,
  `feature/m3-reserve-maps-hosting`, `feature/visual-language` and `feature/m2-nf-split`, the
  tag `m1-gate` and the remote `old-private`. Never `git push --all`, `git push --tags`, or
  merge one of them into the new `main`. Deleting them, and the old private repository, is the
  user's decision.
- New work branches from the new `main`. The old tip `7015acd` and the new tip `e40be3b` have
  the same content; hashes in task logs written before the rewrite are old-history hashes.
- `~/projects/native-federation-a2ui-rewrite/` still holds `publish/` (no longer needed) and
  the two rule files with the removed wording; they belong in no repository.
- On this machine `gh` and git over ssh need the sandbox off: the login is in the keyring.

### Git State

`git diff --stat`:

```
 docs/architecture.md | 7 +++++--
 1 file changed, 5 insertions(+), 2 deletions(-)
```

`git status --short` (repository files only; sandbox mounts omitted):

```
 M docs/architecture.md
?? docs/work/main/
```

Branch `main` at `e40be3b`, following `origin/main`.

### Sessions

- claude-code b5a79bca-4040-428a-979b-4edcfebcd473 (2026-10-01) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/b5a79bca-4040-428a-979b-4edcfebcd473.jsonl
