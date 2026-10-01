# docs: collapse the FAQ groups in the README

### Task

Make the four FAQ groups of the README collapsed by default and move "Where this pays off" in
front of the FAQ, so the front page is not overloaded.

### Status

DONE. No independent review was performed. The page as GitHub renders it was not looked at.

### Root Cause

Not a bug. The FAQ is twenty answers in four reader groups, about 170 lines in the middle of the
front page. Open, it pushed "Where this pays off" and everything after it far down, and the user
found the README overloaded.

### Files Modified

- `README.md` (modified) — each FAQ group is a `<details>` block with the group title in its
  `<summary>`; the section "Where this pays off" moved from behind the FAQ to in front of it.
  No sentence changed.
- `docs/work/main/task-log/docs-collapse-sections-in-readme.md` (new) — this log.

### Files Read (Context Only)

- `README.md` (headings, the top, and the range from "Status" to "Background and credits").
- By grep only: `docs/architecture.md`, `docs/improvements.md`, `docs/how-it-works.md`,
  `docs/development.md`, `docs/production-readiness.md`, `docs/spec.md`,
  `docs/work/publication/plan.md`, `docs/work/publication/task-log/task-1-readme-for-publication.md`.
- `docs/work/publication/task-log/docs-readme-data-set.md` — as the form of a docs-lane log.

### Key Decisions

- **One block per reader group, not per question (agent's reading of "FAQ sections").** Four
  closed lines replace the four `###` headings; a click opens all questions of one reader group.
  A `<details>` per question (twenty blocks) was not built; it was named to the user as the
  alternative.
- **The group title is bold text in the `<summary>`, no longer a heading.** A heading inside a
  `<summary>` renders well on GitHub but breaks onto its own line in other Markdown viewers. The
  price: the four titles leave GitHub's outline and lose their anchors (`#for-the-skeptic` and
  the like). Nothing in the repository linked to them (grep). A later link to a group has no
  target.
- **The FAQ intro stays outside the blocks.** "Every answer is short on purpose …" is what tells
  a reader that the closed lines are worth opening.
- **"Where this pays off" sits between "A deliberately small domain" and the FAQ (user's
  instruction).** This reverses the order of the publication plan (FAQ sixth, "Where this pays
  off" seventh). The first FAQ answer links to that section; the link now points upward and
  still resolves.

### Review Focus

- **Behavior claims:**
  - On GitHub the FAQ shows its intro and four closed lines, one per reader group; a click
    opens the group.
  - "Where this pays off" comes before the FAQ.
  - The text of every question, answer and link is unchanged.
- **Plan deviations:** No plan (fix lane).
- **Assumptions / choices:**
  - "FAQ sections" was read as the four reader groups, not the single questions.
  - Bold in the `<summary>` instead of a heading; the anchors of the four groups are gone.
- **Scope notes:** None.
- **Read next:**
  - `README.md`, from "## Where this pays off" to the first `<details>` — the new order and the
    form of a block. The blank line after `<summary>` is what makes GitHub render the Markdown
    inside.

### Test Evidence

- Pure move plus wrappers, by a one-off inline Python comparison of `git show HEAD:README.md`
  with the working file as multisets of lines: removed are exactly the four `### For the …`
  headings; added are four `<details>`, four `</details>`, four `<summary><b>…</b></summary>`
  and four blank lines. Every other line exists in both.
- Questions (lines of the form `**…?**`): 21 before, 21 after — twenty in the FAQ and "What data
  is behind it?".
- `<details>` and `</details>`: four each.
- `git diff --check` — clean.
- Anchors: `grep -rn 'for-the-\|#faq\|where-this-pays-off'` over all Markdown files finds only
  `README.md`, the link `#where-this-pays-off` in the first FAQ answer; the heading
  `## Where this pays off` still exists.
- Living documents, by grep for "FAQ", "pays off" and the four group titles:
  `docs/improvements.md:22` and `:56` name two FAQ questions by their text, both unchanged;
  `docs/spec.md:189` names the FAQ as part of the README, still true; `docs/how-it-works.md:427`
  uses "pays off" in another sentence; `docs/architecture.md` has no hit. Nothing became stale.
  `docs/work/publication/plan.md` lists the old section order; it is the record of a closed
  scope and was not edited.
- Not verified: the README as GitHub renders it.

### Open Issues

None.

### Git State

`git diff --stat`:

```
 README.md | 56 ++++++++++++++++++++++++++++++++++----------------------
 1 file changed, 34 insertions(+), 22 deletions(-)
```

`git status --short` (repository files only; sandbox mounts omitted):

```
 M README.md
?? docs/work/main/task-log/docs-collapse-sections-in-readme.md
```

Branch `main`, at `7df28f9`.

### Sessions

- claude-code 11437220-0ea1-4284-bccb-e3c407cb82f8 (2026-10-02) — transcript: ~/.claude/projects/-home-lutz-projects-conference-finder/11437220-0ea1-4284-bccb-e3c407cb82f8.jsonl
