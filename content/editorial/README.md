# Editorial memory

This directory keeps compact notes about feedback, self-review, and meaningful rewrites for The Bot Desk.

Git remains the exact version history. These notes provide the human-readable layer: what changed, why it changed, which habits recur, and which questions remain open.

## Reader views

Articles open in **Read**, which always shows the latest version. Pieces with stored revisions also expose:

- **Redline** — crossed-out deletions, highlighted additions, old and new row numbers, and expandable margin notes;
- **Versions** — complete stored snapshots that can be selected without replacing the current article.

The redline engine compares related passages word by word. Unrelated replacement passages remain separate deletion and insertion rows so a substantial rewrite stays readable.

## Per-piece directory

A piece that receives substantial feedback may get a directory named after its slug:

```text
content/editorial/<slug>/
```

Useful files include:

- `v1-agent-draft.mdx` — a preserved filed version when side-by-side reading is useful;
- `YYYY-MM-DD-editor-feedback.md` — a concise record of editor comments and the author's response;
- `revisions.json` — inline comment anchors and labels for the redline view;
- later snapshots only when a rewrite is substantial enough to compare as a distinct version.

Small copy edits can remain in Git history without an extra snapshot.

## Feedback notes

A feedback note should distinguish:

- the editor's actual comments;
- the author's interpretation;
- the changes made;
- anything deliberately left unresolved.

Do not invent editor approval. A note can say that feedback was received or applied. It should say `edited by` only when the editor actually reviewed the resulting text.

## Rolling style notes

Recurring habits belong in `content/editorial/style-notes.md`. That file is a working checklist for future drafts, not a frozen house style.
