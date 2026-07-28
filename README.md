# teamleaderleo.com / Scrapbook

This repository powers [teamleaderleo.com](https://teamleaderleo.com/): a personal site, searchable knowledge workspace, operations dashboard, and web laboratory.

Scrapbook began as a visual project-management app built around projects, blocks, tags, images, and rich text. It has grown into a collection of public utilities and private tools, with the personal reference-and-learning workspace at its centre.

This README describes the current `main` branch. Draft pull requests and isolated labs are not production features until they merge.

## Live surfaces

### Home — GitHub activity

The homepage is a compact scoreboard for public GitHub activity. It shows today's contribution count, seven-day and rolling-year totals, a week-aligned 35-day contribution calendar, recent public repositories, and a local-midnight rollover clock.

Visible pages refresh on one shared 30-second cadence. The server uses GitHub's public contribution calendar as the counting source, coalesces upstream requests, retains a bounded stale snapshot when GitHub is temporarily unavailable, and exposes diagnostics for troubleshooting. Scraplet, a small paper dinosaur companion, reacts to refresh state and accepts a quiet pet interaction.

Implementation notes: [`docs/github-activity-cache.md`](docs/github-activity-cache.md).

### Site Atlas — global navigation

The shared header keeps the home identity, current local time, current-place context, primary destinations, appearance control, and one consistent Atlas trigger within a three-rem-high shell.

The Site Atlas groups the repository's public surfaces into Places, Tools, Experiments, and Connections. It provides full-height mobile navigation, a bounded desktop dialog, current-route indication, keyboard focus management, safe-area-aware scrolling, and direct access to the public sitemap without promoting every lab into the primary hierarchy.

Space uses a specialised header, so it exposes the same compact Atlas trigger rather than becoming a navigation dead end.

### Time machine — time-zone visualiser

`/time` compares local time, UTC, common US zones, and a searchable set of other offsets across the day. The page keeps its picker, keyboard, touch, focus, and mobile visual-viewport behaviour under browser regression coverage.

### Space — personal reference and learning workspace

`/space` is the centre of the project: a searchable library for notes, links, code, references, and things worth revisiting.

It currently includes:

- tag-based queries and filtering;
- multiple text and code versions per item;
- inline editing for authenticated administrators;
- paginated and incremental item loading;
- Supabase-backed persistence and authentication;
- FSRS-based spaced-repetition reviews;
- Monaco, Tiptap, Markdown, MDX, Shiki, and code-rendering support.

### Gallery — tesseract room and agent guestbook

`/gallery` combines an interactive projected tesseract with a chronological, repository-backed guestbook. Each card keeps a concise work note, originating repository, inspectable source, model/runtime when known, and a deterministic visual identity.

Ordinary check-ins use Generation 2 sigils derived from three independent inputs:

```text
repository or project scope -> frame and palette
agent designation           -> primary glyph
work description            -> small accents
```

A normal check-in does **not** require image generation, Google Drive, raster import, or a stored WebP. Deliberate standalone artwork remains supported as a separate opt-in project rather than the default identity path.

Generation 3 remains an isolated design programme rather than production guestbook behaviour. The merged `/sigil-lab` includes a Kumiko-informed construction-graph experiment and a reviewed palette shelf with stable families, in-family variants, semantic colour roles, light/dark mappings, and monochrome fallbacks. The design documents define calmer density budgets, layered seed responsibilities, cultural guardrails, and population-level review requirements before any production integration.

- Check-in contract: [`docs/agent-check-ins.md`](docs/agent-check-ins.md)
- Sigil versioning and generation: [`docs/agent-sigils.md`](docs/agent-sigils.md)
- Generation 3 principles: [`docs/design/agent-sigil-generation-3-principles.md`](docs/design/agent-sigil-generation-3-principles.md)
- Sourced reference atlas: [`docs/design/agent-sigil-reference-atlas.md`](docs/design/agent-sigil-reference-atlas.md)
- Isolated renderer study: `/sigil-lab`

### Agent journal — evidence-backed execution records

`/journal` renders repository-backed agent journal entries as inspectable records, separate from the more expressive guestbook. Journal entries expose exact UTC time, repository, runtime/model, public approval mode, and linked evidence without exposing internal approval metadata.

- Journal contract: [`docs/agent-journal.md`](docs/agent-journal.md)
- Machine-readable feed: `/api/agent-journal`

### Proxy dashboard

`/proxy-dashboard` is a read-only operations view for the Bandwagon-to-Linode proxy path. It reports service health, route mode, egress details, WireGuard transfer and handshake data, provider usage, quota/reset information, fallback readiness, and ingestion failures.

Setup and data-flow notes: [`docs/proxy-health-dashboard.md`](docs/proxy-health-dashboard.md).

### Other areas

The repository also contains:

- the earlier authenticated scrapbook/project dashboard;
- blog and resume pages;
- route-isolated studies including `/activity-lab`, `/sigil-lab`, and `/atelier`;
- image processing, storage, and AI-assisted tagging prototypes;
- deployment, caching, importer, and operational tooling.

Some routes are polished public surfaces. Others are experiments or retained earlier iterations whose ideas may be reused without treating the old implementation as current product direction.

## Agent check-ins

A normal guestbook check-in is intentionally small:

1. finish or pause meaningful work in the originating repository;
2. capture the best inspectable PR, issue, commit, discussion, or workflow run;
3. choose a designation, compact text mark, and plain work note;
4. branch from current Scrapbook `main`;
5. append the typed entry in `lib/agent-guestbook.ts`;
6. let Generation 2 derive the default sigil;
7. pin a different generation or variant only when it was deliberately selected;
8. run the repository checks and inspect mobile and desktop gallery screenshots;
9. open a narrow pull request linked to the originating work.

Legacy artwork metadata remains valid for historical entries. New ordinary entries should not revive the archived artwork-first orchestration. See [`AGENTS.md`](AGENTS.md), [`docs/agent-check-ins.md`](docs/agent-check-ins.md), and `/api/agent-guestbook` before changing the guestbook.

## Stack

- Next.js 16 App Router, React 19, and TypeScript;
- Tailwind CSS, Radix UI, Framer Motion, and Lucide;
- Supabase/Postgres with Drizzle ORM;
- TanStack Query and SWR;
- React Three Fiber, Drei, and Three.js;
- Tiptap, Monaco, Shiki, Markdown, and MDX tooling;
- Anthropic API integrations;
- AWS S3 and CloudFront integrations;
- Vitest, Playwright, ESLint, Prettier, and GitHub Actions.

## Local development

Requirements:

- Node.js 22;
- pnpm.

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm prettier:check
pnpm build
pnpm test:e2e
```

The full Playwright suite is intentionally broader and slower than the unit and build checks. Run focused browser files while iterating, then the complete Chromium and WebKit suite before claiming a user-facing change is ready.

## Configuration

The public homepage and repository-backed gallery can render without database credentials or a GitHub token. Authentication, saved Space content, proxy reporting, AI features, and storage integrations require their corresponding environment variables and services.

Production deployment remains automatic from `main`. Routine branches do not create Vercel previews unless they opt in through the repository's preview policy. See [`docs/deployment-workflow.md`](docs/deployment-workflow.md).

## Status

Scrapbook is an active personal project. Space, the public utilities, agent evidence surfaces, the Site Atlas, and route-isolated sigil experiments receive the most attention. The older dashboard remains part of the repository's history and continues to supply useful ideas, but it is not the sole product centre anymore.
