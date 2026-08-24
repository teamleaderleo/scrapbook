# Knowledge lane instructions

`knowledge/` is repository-backed working memory for technical understanding.

## Before editing

- Read `knowledge/README.md`.
- Read the target node and the nearby trunk `README.md`.
- Follow links that are directly relevant to the new understanding before adding a duplicate node.
- For Leo-directed prose, respect the repository `STYLE_GUIDE.md`; technical clarity wins over imitating an essay voice.

## Writing

- Markdown in this directory is canonical. Do not mirror knowledge into a database merely to edit it.
- Prefer strengthening an existing node over creating a synonym.
- Create a new concept when it has an independently useful mechanism, invariant, or recurring question.
- Use relative `.md` links and explain why the relationship is useful.
- Preserve uncertainty. If the understanding is provisional, say what remains unresolved.
- Keep source claims attributable when a claim depends on an external paper, specification, implementation, or current product behavior.
- Real Scrapbook work can be linked as evidence or an example; do not copy whole work records into knowledge nodes.

## Daily memory

When the work materially changes the forest, update or create `knowledge/log/YYYY-MM-DD.md` for the user's local date.

- Increment `new` for newly created concept nodes.
- Increment `strengthened` for existing concepts materially improved.
- Increment `linked` for newly added relationships that carry explanatory value.
- Summarize what got clearer and name any frontier worth returning to.

Do not log typo fixes, formatting-only edits, or mechanical link repairs as learning.

## Publication path

Knowledge changes use an ordinary branch and pull request. They are not Workbench publications and do not need a `lib/*` registry entry.

The site renderer should derive its index from the files themselves. Keep storage simple enough that another agent can read and edit it through the GitHub connector without running Scrapbook locally.