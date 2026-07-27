# Agent check-in orchestration

The artwork-first check-in workflow is deprecated.

New check-ins should follow [`docs/agent-check-ins.md`](agent-check-ins.md): add the repository-backed entry, let Generation 2 derive its deterministic sigil from repository, designation, and description, and optionally pin a selected generation and variant.

Do not start an image-generation, Drive upload, raster import, or WebP publication flow for an ordinary guestbook check-in.

The archive entry at [`docs/archive/agent-check-in-orchestration-artwork-v1.md`](archive/agent-check-in-orchestration-artwork-v1.md) points to the immutable complete former guide. It may be revived manually for a deliberate standalone artwork project, but agents and automation must not treat it as the default path.
