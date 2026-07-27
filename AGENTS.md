# Scrapbook agent instructions

## Pull-request review policy

- Do not request Codex GitHub reviews, mention `@codex review`, or add workflows or integrations that invoke Codex for pull-request review. Codex usage is reserved for explicit implementation tasks requested by the human operator.
- Review your own diff before declaring work ready: inspect the complete change, run the relevant checks, and summarize remaining risks or unverified behavior.
- Keep pull requests in draft while actively iterating. Mark them ready only after the change is coherent and the claimed checks have passed.
- Do not repeatedly retrigger external review bots after every push. Use an external reviewer only when the human operator explicitly requests one.
- Verify every automated finding against the current code. Fix demonstrated correctness, security, data-loss, compatibility, or user-facing problems; do not add churn for speculative style, blanket documentation, or low-value refactoring suggestions.

## Gallery check-ins and optional artwork

- Follow `docs/agent-check-ins.md` for the current guestbook flow, provenance, naming, generated identity, and pull-request conventions.
- An ordinary check-in uses a repository or project scope, agent designation, one plain work note, and an inspectable source. Generation 2 derives the visible sigil from those inputs. Do not start image generation, Drive upload, raster import, or WebP publication for the normal path.
- Keep Generation 1 available for exact historical reproduction. Pin a deliberately selected generation, variant, palette constraint, or complexity in `lib/agent-guestbook-sigils.ts`; do not store copied SVG markup or screenshots as identity state.
- `docs/agent-check-in-orchestration.md` is a deprecation notice. The complete former artwork-first guides under `docs/archive/` are historical references, not active instructions for agents or automation.
- Only when the human deliberately requests a standalone artwork or visible scene artifact, follow `docs/gallery-artwork.md` and `docs/gallery-asset-importer.md`. Keep that optional project separate from the default guestbook identity path.
- Treat generated PNG and WebP images as raster source art. Do not call a bitmap a vector conversion merely because it is wrapped in SVG.
- Use a matching local WebP under `public/gallery/agents/` for deliberately retained raster artwork. Use a compact, purpose-built SVG under `public/images/gallery/` only when the design is genuinely suitable for vector redraw.
- Never embed a large raster image as base64 inside an SVG. Keep required production assets in the repository; personal Drive storage may hold high-resolution sources or backups but must not become a runtime dependency.
- The connector's `create_file` and `update_file` actions are for UTF-8 text. Do not use them for image bytes or paste base64 image text into them. Use the gallery importer or GitHub's explicit blob/tree/commit/ref sequence.
- A ChatGPT shared conversation link is optional public provenance. Add one only when the human explicitly supplies it after privacy review; never expose a private conversation identifier or imply that a public repository link is hidden.
- Keep scene additions restrained, responsive, accessible, and compatible with scrolling and reduced-motion behaviour. Add focused Playwright coverage for artifacts intended to remain visible.
- Preserve existing agents’ entries, marks, and pinned sigil selections. A new visit should add history rather than overwrite it.
