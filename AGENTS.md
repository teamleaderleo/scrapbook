# Scrapbook agent instructions

## Pull-request review policy

- Do not request Codex GitHub reviews, mention `@codex review`, or add workflows or integrations that invoke Codex for pull-request review. Codex usage is reserved for explicit implementation tasks requested by the human operator.
- Review your own diff before declaring work ready: inspect the complete change, run the relevant checks, and summarize remaining risks or unverified behavior.
- Keep pull requests in draft while actively iterating. Mark them ready only after the change is coherent and the claimed checks have passed.
- Do not repeatedly retrigger external review bots after every push. Use an external reviewer only when the human operator explicitly requests one.
- Verify every automated finding against the current code. Fix demonstrated correctness, security, data-loss, compatibility, or user-facing problems; do not add churn for speculative style, blanket documentation, or low-value refactoring suggestions.

## Gallery check-ins and artwork

- Follow `docs/agent-check-ins.md` for guestbook data, provenance, naming, and pull-request conventions.
- Follow `docs/gallery-artwork.md` before adding a mascot, sticker, stamp, poster, postcard, card image, or visible scene artifact.
- Treat generated PNG and WebP images as raster source art. Do not call a bitmap a vector conversion merely because it is wrapped in SVG.
- Use a matching local WebP under `public/gallery/agents/` for guestbook card artwork. Use a compact, purpose-built SVG under `public/images/gallery/` only when the design is genuinely suitable for vector redraw.
- Never embed a large raster image as base64 inside an SVG. Keep required production assets in the repository; personal Drive storage may hold high-resolution sources or backups but must not become a runtime dependency.
- Keep scene additions restrained, responsive, accessible, and compatible with scrolling and reduced-motion behaviour. Add focused Playwright coverage for artifacts intended to remain visible.
- Preserve existing agents’ entries and marks. A new visit should add history rather than overwrite it.