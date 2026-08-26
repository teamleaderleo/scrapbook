# Knowledge lane instructions

`knowledge/` is repository-backed working memory for technical understanding.

## Starting a session

- Read `knowledge/HANDOFF.md` first when the user has not already selected a topic. Its job is to remove cold-start friction.
- Read `knowledge/LEARNING.md` when choosing or changing the teaching method; use its evidence as guidance rather than enforcing one study ritual.
- Read the target node and the nearby trunk `README.md`.
- Follow links that are directly relevant to the new understanding before adding a duplicate node.
- Prefer reading for initial bandwidth, then use retrieval, explanation, changed conditions, or comparison to test the model. Voice can carry those steps without requiring written answers.
- For Leo-directed prose, respect the repository `STYLE_GUIDE.md`; technical clarity wins over imitating an essay voice.

If the session starts with no topic, use the current handoff's default walk or choose a nearby frontier that connects to recent work or conversation. Do not generate a fresh syllabus merely to create activity.

## Writing

- Markdown in this directory is canonical. Do not mirror knowledge into a database merely to edit it.
- Prefer strengthening an existing node over creating a synonym.
- Create a new concept when it has an independently useful mechanism, invariant, or recurring question.
- Use relative `.md` links and explain why the relationship is useful.
- Preserve uncertainty. If the understanding is provisional, say what remains unresolved.
- Keep source claims attributable when a claim depends on an external paper, specification, implementation, or current product behavior.
- Real Scrapbook work can be linked as evidence or an example; do not copy whole work records into knowledge nodes.
- Do not preserve every conversational turn. Write the model, correction, example, discriminator, or connection that should survive the conversation.

## Ending a material session

When the work materially changes the forest:

1. strengthen the concept nodes that actually changed;
2. add meaningful cross-links exposed by the conversation or work;
3. update or create `knowledge/log/YYYY-MM-DD.md` for the user's local date;
4. rewrite `knowledge/HANDOFF.md` if the next useful starting point changed.

The handoff is current context, so replacing it is expected. Git history preserves prior handoffs.

## Daily memory

- Increment `new` for newly created concept nodes.
- Increment `strengthened` for existing concepts materially improved.
- Increment `linked` for newly added relationships that carry explanatory value.
- Summarize what got clearer, relevant work or conversations, and any frontier worth returning to.

Do not log typo fixes, formatting-only edits, mechanical link repairs, or ordinary reading as learning. The counts are navigational memory, not a score.

## Publication path

Knowledge changes use an ordinary branch and pull request. They are not Workbench publications and do not need a `lib/*` registry entry.

The site renderer should derive its concept index from the files themselves. `HANDOFF.md` and `LEARNING.md` are operating files, not concept nodes. Keep storage simple enough that another agent can read and edit it through the GitHub connector without running Scrapbook locally.