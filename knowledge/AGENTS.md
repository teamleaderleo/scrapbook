# Knowledge lane instructions

`knowledge/` is repository-backed working memory for technical understanding. Read the root [`AGENTS.md`](../AGENTS.md) and [`KNOWLEDGE.md`](../KNOWLEDGE.md) before editing.

## Starting a session

- Read `HANDOFF.md` first when the user has no selected topic; use its current default walk or a nearby frontier connected to recent work or conversation.
- Read `LEARNING.md` when choosing or changing the teaching method; use its evidence as guidance instead of enforcing one study ritual.
- Read the target node and its nearby trunk `README.md`, then follow directly relevant links before creating another node.
- Prefer reading for initial bandwidth, then use retrieval, explanation, changed conditions, or comparison to test the model. Voice can carry those steps without requiring written answers.
- For Leo-directed prose, follow the repository `STYLE_GUIDE.md`; technical clarity leads.

Skip a fresh syllabus created merely to generate activity.

## Writing

- Strengthen an existing node when it already owns the concept. Create a new concept when it has an independently useful mechanism, invariant, or recurring question.
- Use relative `.md` links and explain why each relationship is useful.
- Preserve uncertainty and keep externally dependent claims attributable to their paper, specification, implementation, or current product evidence.
- Link real Scrapbook work as evidence or an example while keeping work-record detail in its own lane.
- Preserve the model, correction, example, discriminator, or connection that should survive the conversation instead of the transcript.
- The site derives its concept index directly from these Markdown files. `HANDOFF.md` and `LEARNING.md` are operating files rather than concept nodes.

## Ending a material session

When understanding materially changes the forest:

1. strengthen the concept nodes that changed;
2. add meaningful cross-links exposed by the conversation or work;
3. update or create `log/YYYY-MM-DD.md` for the user's local date;
4. rewrite `HANDOFF.md` when the next useful starting point changes.

`HANDOFF.md` represents current context; Git history preserves earlier handoffs.

## Daily memory

Increment `new` for newly created concept nodes, `strengthened` for materially improved existing concepts, and `linked` for newly added relationships with explanatory value. Summarize what became clearer, relevant work or conversations, and any frontier worth returning to.

Typo fixes, formatting-only edits, mechanical link repairs, and ordinary reading stay outside learning counts; the counts are navigational memory rather than a score.

## Publication boundary

Knowledge changes use the ordinary Scrapbook branch/pull-request and Markdown verification path routed by the root instructions. They remain separate from Workbench publication and need no `lib/*` registry entry. Repository Markdown is the lane corpus so another repository-capable agent can read and edit it directly.
