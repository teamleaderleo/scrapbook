# teamleaderleo.com / scrapbook

This repository powers [teamleaderleo.com](https://teamleaderleo.com/): a personal site, web lab, and home for the scrapbook project.

The repo began as a visual project-management app built around projects, blocks, tags, images, and rich text. It has since grown into a collection of tools and experiments, with the personal knowledge workspace at its center.

## What is live now

### Home — GitHub activity

The homepage is a scoreboard-style view of today's public GitHub contributions, with a local-midnight rollover clock, a 28-day activity field, seven-day and year totals, and links to the current public projects. It reads GitHub's public contribution graph, falls back to public events when needed, and caches the result for five minutes.

### Time machine — time-zone visualizer

`/time` is an interactive time converter for comparing UTC, Eastern, Pacific, local time, and a selectable time zone across a full day. The range control uses a day-to-night gradient, and the current local time also appears as a link in the site navigation.

### Space — personal reference and learning workspace

`/space` is a searchable library for notes, links, code, references, and things worth revisiting.

It currently includes:

- tag-based queries and filtering
- multiple text and code versions per item
- inline editing for admin users
- paginated and incremental item loading
- Supabase-backed persistence and authentication
- FSRS-based spaced-repetition reviews

### Cube — agent room and guestbook

`/gallery` is a small React Three Fiber room plus a repository-backed guestbook. Agents with repository access can leave a name, mark, note, date, and mode by editing `lib/agent-guestbook.ts`. The 3D scene supports direct dragging while keeping vertical page scrolling available.

### Proxy dashboard

`/proxy-dashboard` is a read-only operations dashboard for the Bandwagon-to-Linode proxy path. It displays service health, route mode, egress details, WireGuard transfer and handshake data, provider usage, fallback readiness, and ingestion errors.

Setup details live in [`docs/proxy-health-dashboard.md`](docs/proxy-health-dashboard.md).

### Other areas

The repo also contains:

- a repository-backed public journal and journal-only RSS feed
- resume pages
- lab and atelier experiments
- image processing, storage, AI-assisted tagging, and other ongoing prototypes

Some routes are polished public surfaces. Others are isolated experiments. Retired implementations are recorded in [`docs/deprecation-ledger.md`](docs/deprecation-ledger.md) and Git history rather than kept as active product code.

## Current direction

The main goal is a personal, searchable place for collecting references, writing notes, saving code, and reviewing ideas without an algorithmic feed deciding what appears next.

The original inspiration came from using a private Discord server as an archive: quick capture, channels as categories, rich previews, and easy access from desktop or phone. Scrapbook keeps those strengths while adding ownership, stronger search, richer editing, and deliberate review.

## Stack

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind CSS, Radix UI, Framer Motion, and Lucide
- Supabase/Postgres with Drizzle ORM
- TanStack Query and SWR
- React Three Fiber, Drei, and Three.js
- Tiptap, Monaco, Shiki, and Markdown/MDX tooling
- Anthropic API integrations
- AWS S3 and CloudFront integrations
- Vitest, Playwright, ESLint, and Prettier

## Local development

Requirements:

- Node.js 22
- pnpm

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
```

The public homepage can render without database credentials or a GitHub token. Authentication, saved content, proxy reporting, AI features, and storage integrations require their corresponding environment variables and services.

## Status

This is an active personal project. The public utilities and `/space` receive the most attention right now. The former project/block dashboard and public blog are retired; their history remains available through Git.

<!-- production deployment retry: 2026-07-25 17:33 UTC -->