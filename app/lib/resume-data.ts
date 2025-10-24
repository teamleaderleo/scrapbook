export type ResumeItem = {
  bullet: string;
  note?: string;
};

export type ResumeSection = {
  title: string;
  meta: string; // e.g. "Remote | June 2025 - Present"
  items: ResumeItem[];
};

export type ResumeColumns = [ResumeSection[], ResumeSection[], ResumeSection[]];

export const resumeColumns: ResumeColumns = [
  // Column 1
  [
    {
      title:
        "Next.js (By Vercel) | Open Source Contributor (We are not affiliated with Vercel, we just think this is a nice way to learn!)",
      meta: "Remote | June 2025 - Present",
      items: [
        {
          bullet:
            "Fixed dark mode styling in Next.js development tools, improving accessibility for 4.9M+ developers, merged in #80025.",
          note:
            "The Process: While a simple CSS fix, the real work was navigating a massive, unfamiliar codebase, understanding its design system, and successfully justifying the change to the maintainers. It was a perfect first exercise in contributing to a major open-source project.",
        },
        {
          bullet:
            "Identified and resolved critical UX issue causing unreadable white-on-white text in dropdowns.",
          note: "As above.",
        },
        {
          bullet:
            "Contributed production code using existing design system variables consistent with framework standards.",
          note: "...As above.",
        },
        {
          bullet:
            "Improved Next.js App Router internals by refactoring an unhandled redirect handler to use direct dispatch methods, aligning with architectural best practices and addressing an existing TODO in #80075.",
          note:
            "Exploration: This PR was an exploration into core framework architecture. By addressing a long-standing TODO in the codebase, I practiced refactoring critical pathways to improve performance and adhere to internal best practices, learning a ton about the framework's internals along the way.",
        },
        {
          bullet:
            "Analyzed Next.js internal architecture to diagnose call stack limitations in static export functionality for sites with 100k+ pages, then proposed and implemented a proactive warning system that prevents build scalability failures in #80037.",
          note:
            "Proactive Problem-Solving: This PR addresses a fundamental scalability issue for large SSG sites. The goal was to trace the export pipeline and implement a proactive warning system to prevent silent, hard-to-debug build failures for developers working at enterprise scale.",
        },
        {
          bullet:
            "Engaged with and guided developers to scalable patterns and best practices.",
          note:
            "I tried my hand a bit at engaging in some discussions/commenting on issues, but... wow, it's a lot to keep up with.",
        },
      ],
    },
    {
      title: "Git Inline (Front-End Visualization)",
      meta: "npmjs.com/package/git-inline | Jan 2025 - Present",
      items: [
        {
          bullet:
            "Published open-source NPM React component library to visualize Git history, adding lilconfig to resolve JavaScript bundler issues.",
          note:
            "I think it's quite a nice idea, and I want to continue working on it, but we got derailed due to wondering how we'd get user configs nice and ergonomic when they're setting up their GitHub urls and whatnot, and I just got kinda bored and didn't want to implement the API caching... which, IMO, is absolutely necessary. So it's at version 0.0.1 right now, because I also found other things that were more interesting. But this is still interesting! There're just a lot of competiting priorities.",
        },
      ],
    },
  ],

  // Column 2
  [
    {
      title: "Glossless (AI Pose-Inference Tool)",
      meta: "glossless.app | June 2024 - Present",
      items: [
        {
          bullet:
            "Engineered a pipeline allowing users to go from image upload to a lit, posed 3D mannequin in seconds vs workflows that take minutes in traditional software..",
          note:
            "Artists needing pose references shouldn't have to fight complex 3D software. This entire project is architected around collapsing the time it takes to get a useful, well-lit reference, making it an ergonomic, lightweight alternative to the status quo.",
        },
        {
          bullet:
            "Productionized ML research models (Bizarre Pose Estimator, VideoPose3D) to GPU-powered, auto-scaling API on Modal, refactoring 2021 command-line research code and resolving legacy PyTorch/NumPy dependency conflicts.",
          note:
            "The Challenge: The original research code was powerful but production-hostile. It was a tangle of CLI dependencies and version conflicts. The main work was refactoring this into a containerized, reliable, and scalable web service that could form the backbone of a real product.",
        },
        {
          bullet:
            "Optimized serverless performance, slashing P95 cold-start latency by 78% (from 45s to 10s) by implementing memory snapshots and caching model binaries.",
          note:
            "Insight: A 45-second cold start is a dealbreaker for an interactive tool. The key to this 78% reduction was a two-stage loading process and implementing Modal's memory snapshots, proving that thoughtful serverless architecture can deliver a near-native user experience.",
        },
        {
          bullet:
            "Architected a cost-effective alternative inference pipeline using a multimodal LLM (Llama 3.2) on Cloudflare Workers AI, reducing per-inference costs by 94.7%(∼19x).",
          note:
            "The Trade-off: Instead of relying solely on the expensive GPU model, this pipeline uses a cost-effective multimodal LLM as a \"sanity check\" and validation layer. It's a novel approach that improves robustness while dramatically reducing cost—a critical consideration for any real-world AI product.",
        },
        {
          bullet:
            "Developed lightweight and stable 60fps+ real-time 3D editor and AI system using React, Three.js, and Supabase, featuring a bidirectionally synchronized canvas, interactive joint manipulation, and a routing gateway that sends photos to MediaPipe and illustrations to the custom COCO API..",
          note:
            "Architectural Goal: Performance and stability were non-negotiable. Many web-based 3D tools lag or crash browsers under load. This editor was architected from the ground up to be lightweight, delivering a stable 60fps+ experience by creating a hybrid system that intelligently routes different image types to the optimal model (client-side MediaPipe vs. custom backend).",
        },
      ],
    },
    {
      title: "Scrapbook (Full-Stack Blog)",
      meta:
        "github.com/teamleaderleo/scrapbook | teamleaderleo.com | May 2024 - Present",
      items: [
        {
          bullet:
            "Built CMS with Next.js and TypeScript for optimized CRUD operations and responsive design.",
          note:
            "The blog part is it. We're still working on trying out different designs/libraries, but I personally just prefer dense information and non-functional art. So... everything and nothing.",
        },
        {
          bullet:
            "Cut hosting costs by 85% via database migration from Vercel to Supabase (with 100% data integrity via pg dump).",
          note:
            "Vercel's database pricing was getting expensive as the project grew. Migrated everything to Supabase using pg_dump to ensure 100% data integrity. The migration went smoothly and now I get way more database features for a fraction of the cost.",
        },
        {
          bullet:
            "Reduced request latency from 300ms to 50ms through optimized queries, indexing, and TanStack Query caching.",
          note:
            "The original setup was doing way too many database round trips. I added proper indexing on frequently queried columns, restructured some of the more complex queries, and implemented aggressive caching with TanStack Query. The 50ms response time made the whole app feel snappy.",
        },
        {
          bullet:
            "Built novel bidirectional looping infinite scrolling system with Three.js and React Three Fiber, preserving native browser functionality while solving edge-case behaviours with accessibility-focused DOM overrides",
          note:
            "The Challenge: The goal was to build an infinite scroll system that didn't break the web. Most libraries hijack the scrollbar and disable native browser functionality. This implementation was a deep dive into custom DOM manipulation to preserve features like browser history and scroll restoration, making it feel seamless and native.",
        },
        {
          bullet:
            "Built rich text editor with TipTap and Zustand with persistent drafts, keyboard shortcuts, and stateful editing.",
          note:
            "This is in the App portion. It was really, really hard to achieve even half of the Discord-level usability, because there is just so much state management.",
        },
        {
          bullet:
            "Offloaded image processing to Go microservice (Docker, Lambda, REST API Gateway) for distributed backend.",
          note:
            "Architectural Decision: This was an exercise in building a decoupled, distributed system. Offloading image processing to a dedicated Go microservice (detailed in the Potato Image Compressor project) improved the main app's scalability and maintainability, separating concerns for a more robust backend.",
        },
        {
          bullet:
            "Ensured type-safe client-server JSON data with Zod schema validation and Next.js Server Actions.",
          note:
            "This is pretty basic. I used Drizzle, too. Like, it's just adding more types and stuff..",
        },
        {
          bullet:
            "Used Claude LLM API to auto-suggest tags and categorize content, improving metadata search UX.",
          note:
            "I turned this off for now, but it was nice when I tried it a while ago. Rather than making users manually tag everything, I integrated Claude's API to analyze content and suggest relevant tags. It's surprisingly good at understanding context and suggesting useful categorization that actually improves search and organization.",
        },
        {
          bullet:
            "Integrated OAuth 2.0 with GitHub/Google/email for secure user login and personalized content access.",
          note:
            "This was just to prove that I could. I want to disable it, but... idk.",
        },
        {
          bullet:
            "Added real-time WebSocket telemetry with error handling for system monitoring and analytics.",
          note:
            "This was also just to prove that I could. It isn't on, because I don't really have anything that necessitates it.",
        },
        {
          bullet:
            "Developed full-stack features from DB schema to Tailwind CSS UI, iterating on Figma designs and peer feedback.",
          note:
            "I asked my mom to look at my previous versions. I also tried really hard to match up to Discord's design system earlier on, but I realized that I have my own tastes, and I want to try out a bunch of new animation and 3D libraries.",
        },
        {
          bullet:
            "Built Playwright/Vitest testing pipeline to troubleshoot and debug async state issues for CI stability.",
          note:
            "We don't really have a use for this, but we did it to prove that we could.",
        },
      ],
    },
  ],

  // Column 3
  [
    {
      title: "Potato Image Compressor (Back-End).",
      meta:
        "github.com/teamleaderleo/potato-quality-image-compressor | April 2025",
      items: [
        {
          bullet:
            "Built a Dockerized image processing pipeline in Go using goroutines and sync primitives.",
          note:
            "This was a fun project. I wanted to learn Go, and I thought it would be a good idea to build an image processing pipeline. It was simpler when I initially added it a few months into the Scrapbook project, and it was a couple months later that I really thought to dig deep and make this bigger and better and faster and flashier. I used goroutines with worker pools and sync primitives (both semaphores and mutexes) to make it concurrent and efficient. Oh, and I wanted to try out gRPC too. It's not the most complex thing, but it was a good exercise in Go.",
        },
        {
          bullet:
            "Boosted throughput by 6.3x over baseline, validated via k6 load testing.",
          note:
            "I wanted to use k6 because it seemed like some sort of industry standard, but I ended up doing the bulk of the testing with shell scripts... which seems like what k6 kinda does anyway, at least for my case here. Anyway, the baseline was also this supremely naive, sequential little thing. Which I don't think I even had? Like, I'm pretty sure it was already async/await (in go terms) from the start..",
        },
        {
          bullet:
            "Designed modular algorithm architecture with swappable compression strategies (e.g., libvips).",
          note:
            "This was a fun challenge. I wanted to make the image processing pipeline more flexible and extensible, so I designed it with a modular architecture in mind. This way, I could easily swap out different compression strategies (like libvips) without having to rewrite a lot of code. It was a good exercise in software design principles.",
        },
        {
          bullet:
            "Used Adapter Pattern to expose logic via HTTP/gRPC, tracking metrics via Prometheus/Grafana + shell tooling.",
          note:
            "This was another interesting challenge. I wanted to make the image processing pipeline accessible over the network, so I used the Adapter Pattern to expose its functionality via HTTP and gRPC. I also set up monitoring and metrics tracking using Prometheus and Grafana, along with some shell tooling to make it easier to work with. It was a good way to learn about distributed systems and observability.",
        },
      ],
    },
    {
      title: "Fold Single-Line Comments.",
      meta: "fold-single-line-comments | Feb 2025",
      items: [
        {
          bullet:
            "Published VS Code extension solving 1000-day-old StackOverflow issue now used by 70+ developers.",
          note:
            "This was a fun little project. I saw a StackOverflow question that had been open for 1000 days about how to fold single-line comments in VS Code. I thought it was a neat idea, so I built an extension that does just that. It's simple but effective, and it's nice to see other developers finding it useful.",
        },
      ],
    },
  ],
];
