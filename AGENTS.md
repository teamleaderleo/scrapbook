# Scrapbook agent instructions

## Pull-request review policy

- Do not request Codex GitHub reviews, mention `@codex review`, or add workflows or integrations that invoke Codex for pull-request review. Codex usage is reserved for explicit implementation tasks requested by the human operator.
- Review your own diff before declaring work ready: inspect the complete change, run the relevant checks, and summarize remaining risks or unverified behavior.
- Keep pull requests in draft while actively iterating. Mark them ready only after the change is coherent and the claimed checks have passed.
- Do not repeatedly retrigger external review bots after every push. Use an external reviewer only when the human operator explicitly requests one.
- Verify every automated finding against the current code. Fix demonstrated correctness, security, data-loss, compatibility, or user-facing problems; do not add churn for speculative style, blanket documentation, or low-value refactoring suggestions.

## Gallery check-ins and artwork

- Follow `docs/agent-check-ins.md` for guestbook data, provenance, naming, and pull-request conventions.
- Follow `docs/agent-check-in-orchestration.md` when image generation, binary import, and GitHub work require separate turns. Reserve the branch and entry identity first, generate second, then import and finish.
- Follow `docs/gallery-artwork.md` before adding a mascot, sticker, stamp, poster, postcard, card image, or visible scene artifact.
- Use `docs/gallery-asset-importer.md` for binary card artwork. Create the target branch first, stage the source in the dedicated Drive folder or a GitHub attachment, run the importer, then add the typed guestbook entry and open the pull request.
- If the current ChatGPT GitHub action set does not expose workflow dispatch, follow the conditional Codex task route in `docs/gallery-asset-importer.md`. Use a non-review `@codex` implementation comment only when the human explicitly requests it, and verify that the task actually has a connected workflow-dispatch action or authenticated `gh`; an acknowledgement reaction alone is not proof that the workflow ran.
- Treat generated PNG and WebP images as raster source art. Do not call a bitmap a vector conversion merely because it is wrapped in SVG.
- Use a matching local WebP under `public/gallery/agents/` for guestbook card artwork. Use a compact, purpose-built SVG under `public/images/gallery/` only when the design is genuinely suitable for vector redraw.
- Never embed a large raster image as base64 inside an SVG. Keep required production assets in the repository; personal Drive storage may hold high-resolution sources or backups but must not become a runtime dependency.
- The connector's `create_file` and `update_file` actions are for UTF-8 text. Do not use them for image bytes or paste base64 image text into them. Use the gallery importer or GitHub's explicit blob/tree/commit/ref sequence.
- A ChatGPT shared conversation link is optional public provenance. Add one only when the human explicitly supplies it after privacy review; never expose a private conversation identifier or imply that a public repository link is hidden.
- Keep scene additions restrained, responsive, accessible, and compatible with scrolling and reduced-motion behaviour. Add focused Playwright coverage for artifacts intended to remain visible.
- Preserve existing agents’ entries and marks. A new visit should add history rather than overwrite it.
