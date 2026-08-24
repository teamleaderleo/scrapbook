# Knowledge

This directory is the canonical store for Scrapbook's linked technical knowledge.

The website is a reader over these files. Git is the history. Markdown stays useful on its own.

## Layout

- Each top-level subject directory is a broad trunk.
- `README.md` inside a trunk explains the territory and points at useful starting nodes.
- Ordinary concept files are small enough to revise often. They can begin incomplete.
- `log/YYYY-MM-DD.md` records material learning activity for the day.
- Relative Markdown links are the graph. Prefer a sentence that explains the relationship over a naked backlink.

The initial trunks are:

- [Computation and concurrency](computation/README.md)
- [Storage and data](storage/README.md)
- [Distributed systems](distributed-systems/README.md)
- [Machines and performance](performance/README.md)
- [Languages, runtimes, and toolchains](toolchains/README.md)
- [Security and authority](security/README.md)
- [Product and application systems](product/README.md)
- [ML and AI systems](ai-systems/README.md)
- [Engineering judgment](engineering-judgment/README.md)

These directories are navigation, not ownership boundaries. A concept should link sideways whenever that relationship teaches something.

## Concept format

Every ordinary node begins with small frontmatter:

```yaml
---
title: Idempotency
kind: concept
trunk: distributed-systems
summary: Repeating the same intended operation does not create additional effect.
created: 2026-08-25
updated: 2026-08-25
---
```

Then write the useful model. Common sections include `Invariant`, `Why it exists`, `Failure modes`, `Concrete trace`, `Connections`, and `Pressure questions`, but none is mandatory. Add a section because it helps understanding, not because a template demands it.

Do not turn every concept into a mini textbook. A compact explanation with one good example and three strong links is often more valuable than a comprehensive survey.

## Understanding and revision

Understanding lives in the prose, examples, questions, links, and Git history. Avoid global percentages or fake mastery scores.

A node has become more useful when, for example:

- the central mechanism is easier to explain;
- an invariant becomes explicit;
- a concrete trace replaces vague familiarity;
- a failure case exposes the boundary of the idea;
- a real project or bug gets attached;
- a sideways link explains why two concepts belong near each other;
- a conversation reveals a question the node could not yet answer.

When a conversation produces durable understanding, edit the relevant node directly and add links where the relationship is useful.

## Daily log

A material day gets `log/YYYY-MM-DD.md` with numeric frontmatter:

```yaml
---
title: 2026-08-25
kind: log
date: 2026-08-25
new: 4
strengthened: 7
linked: 9
---
```

`new` counts concept nodes first created that day. `strengthened` counts existing nodes materially improved. `linked` counts meaningful new cross-concept relationships, not every Markdown link character.

The body records what changed and any frontier that became interesting. The log is a memory aid, not a productivity scoreboard.

## Link convention

Use repository-relative Markdown links, including the `.md` suffix:

```markdown
[MVCC](../storage/mvcc.md)
```

That keeps links useful on GitHub. Scrapbook rewrites them to clean `/knowledge/...` routes when rendering the site.

## Editing rule

Prefer local edits. Keep an explanation that already works and add the missing trace, counterexample, or connection. The forest should grow by accumulated understanding instead of periodic rewrites of everything.