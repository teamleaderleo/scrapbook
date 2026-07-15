# teamleaderleo.com / scrapbook

This repository powers [teamleaderleo.com](https://teamleaderleo.com/): an evolving personal site, web lab, and home for the scrapbook project.

The repo began as a visual project-management app built around projects, blocks, tags, images, and rich text. It has since grown into a collection of useful tools and experiments, with the personal knowledge workspace at its center.

## What is live now

### Home — time-zone visualizer

The homepage is an interactive time converter for comparing UTC, Eastern, Pacific, local time, and a selectable time zone across a full day.

### Space — personal reference and learning workspace

`/space` is the current evolution of the scrapbook idea: a searchable library for notes, links, code, references, and things worth revisiting.

It currently includes:

- tag-based queries and filtering
- multiple text and code versions per item
- inline editing for admin users
- pagination and command-style search
- Supabase-backed persistence and authentication
- FSRS-based spaced-repetition reviews

### Cube — 3D gallery

`/gallery` is a React Three Fiber gallery experiment with a scroll-driven 3D scene.

### Proxy dashboard

`/proxy-dashboard` is a read-only operations dashboard for the Bandwagon-to-Linode proxy path. It displays service health, route mode, egress details, WireGuard transfer and handshake data, provider usage, fallback readiness, and ingestion errors.

Setup details live in [`docs/proxy-health-dashboard.md`](docs/proxy-health-dashboard.md).

### Other areas

The repo also contains:

- the earlier authenticated scrapbook/project dashboard
- blog and resume pages
- lab and atelier experiments
- image processing, storage, AI-assisted tagging, and other ongoing prototypes

Some routes are polished public surfaces. Others are active experiments or older iterations kept because they still contain useful ideas and code.

## Current direction

The main goal is a personal, searchable place for collecting references, writing notes, saving code, and reviewing ideas without an algorithmic feed deciding what appears next.

The original inspiration came from using a private Discord server as an archive: quick capture, channels as categories, rich previews, and easy access from desktop or phone. Scrapbook is the attempt to keep those strengths while adding ownership, offline-friendly possibilities, stronger search, richer editing, and deliberate review.

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
pnpm prettier:check
pnpm build
```

The public homepage can render without database credentials. Authentication, saved content, proxy reporting, AI features, and storage integrations require their corresponding environment variables and services.

## Status

This is an active personal project. The public utilities and `/space` receive the most attention right now, while the older dashboard remains part of the repo's history and may continue to feed ideas into the newer workspace.

The repo name stuck. The project outgrew it.
