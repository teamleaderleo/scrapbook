export type ResumeItem = {
  bullet: string;
  note?: string;
};

export type ResumeSection = {
  title: string;
  meta: string;
  items: ResumeItem[];
};

export type ResumeColumns = [ResumeSection[], ResumeSection[], ResumeSection[]];

export const resumeColumns: ResumeColumns = [
  [
    {
      title: "Next.js | Open Source Contributor",
      meta: "Remote | 2025",
      items: [
        {
          bullet:
            "Fixed dark-mode styling in Next.js developer tooling, merged in #80025.",
          note:
            "The work required tracing an unfamiliar design system, reproducing the contrast failure, and matching the maintainers' existing conventions rather than introducing a one-off style.",
        },
        {
          bullet:
            "Refactored an unhandled redirect pathway to use direct dispatch methods, merged in #80075.",
          note:
            "This was a focused architecture exercise in following a redirect through the App Router and replacing an old indirection without changing observable behavior.",
        },
        {
          bullet:
            "Traced static-export scaling limits and added a proactive warning for very large route counts, merged in #80037.",
          note:
            "The change turned a difficult late-build failure mode into an earlier, actionable diagnostic for large static sites.",
        },
      ],
    },
    {
      title: "Git Inline | React Visualization Library",
      meta: "Open source | 2025",
      items: [
        {
          bullet:
            "Published a React component library for rendering compact Git history directly inside product interfaces.",
          note:
            "The experiment focused on making repository history legible without sending users to a separate developer tool.",
        },
        {
          bullet:
            "Added configuration discovery with lilconfig to resolve bundler and consumer setup problems.",
        },
      ],
    },
  ],
  [
    {
      title: "Glossless | AI Pose-Reference Tool",
      meta: "glossless.app | 2024–present",
      items: [
        {
          bullet:
            "Built a browser-based workflow that turns an uploaded image into a lit, posed, editable 3D mannequin.",
          note:
            "The product is designed around reducing the setup cost of traditional 3D pose-reference workflows for artists.",
        },
        {
          bullet:
            "Productionized legacy pose-estimation research models as a containerized, autoscaling GPU service on Modal.",
          note:
            "The work included removing command-line assumptions and resolving older PyTorch and NumPy dependency constraints.",
        },
        {
          bullet:
            "Reduced reported P95 cold-start latency from 45 seconds to 10 seconds through staged loading, cached model binaries, and memory snapshots.",
        },
        {
          bullet:
            "Built a React, Three.js, and Supabase editor with bidirectional joint manipulation and model routing for photos and illustrations.",
        },
      ],
    },
    {
      title: "Scrapbook | Personal Software Lab",
      meta: "teamleaderleo.com | 2024–present",
      items: [
        {
          bullet:
            "Built and maintains a Next.js 16 personal site combining public utilities, interactive experiments, a private Supabase-backed workspace, and a repository-backed agent journal.",
          note:
            "Scrapbook is intentionally a living system: useful public surfaces stay polished while experiments are isolated, measured, or retired when they stop earning their complexity.",
        },
        {
          bullet:
            "Designed typed note, reference, code, review, and artifact workflows with explicit public/private boundaries and FSRS-based scheduling.",
        },
        {
          bullet:
            "Hardened GitHub activity ingestion with bounded parsing, stale-data fallback, retry backoff, and privacy-safe public diagnostics.",
        },
        {
          bullet:
            "Published a journal-only RSS feed and a centralized Site Atlas for discoverable public navigation without reviving retired content systems.",
        },
        {
          bullet:
            "Established CI gates covering ESLint, TypeScript, unit tests, production builds, and Chromium/WebKit browser regressions.",
        },
        {
          bullet:
            "Continuously removes unused routes, APIs, and legacy data layers through evidence-backed dependency audits while preserving recovery through Git history.",
        },
      ],
    },
  ],
  [
    {
      title: "Potato Image Compressor | Go Backend",
      meta: "Open source | 2025",
      items: [
        {
          bullet:
            "Built a Dockerized image-processing pipeline in Go using goroutines, worker pools, semaphores, and mutexes.",
          note:
            "The project was a practical exercise in bounded concurrency, resource ownership, and separating processing logic from transport concerns.",
        },
        {
          bullet:
            "Measured a 6.3× throughput improvement against a sequential baseline using repeatable load tests.",
        },
        {
          bullet:
            "Exposed processing through HTTP and gRPC adapters and instrumented the service with Prometheus, Grafana, and shell tooling.",
        },
        {
          bullet:
            "Designed swappable compression strategies so processing implementations can change without rewriting transport code.",
        },
      ],
    },
    {
      title: "Fold Single-Line Comments | VS Code Extension",
      meta: "Open source | 2025",
      items: [
        {
          bullet:
            "Published a VS Code extension for folding contiguous single-line comments, addressing a long-standing community request.",
          note:
            "The project is deliberately small: one specific editor friction point, a bounded implementation, and a public release that other developers can use.",
        },
      ],
    },
  ],
];
