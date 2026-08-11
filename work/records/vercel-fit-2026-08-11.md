# Vercel fit calibration — 2026-08-11

This record captures a point-in-time career interpretation. Vercel job descriptions change; refresh the official careers site before using this as application fact.

## Why Vercel is interesting

The fit is not "Leo is already a Vercel domain expert."

The stronger thesis is that Vercel's current engineering environment makes several parts of Leo's working style unusually legible:

- modern TypeScript/JavaScript SDK and runtime work;
- open-source development as a first-class product surface;
- AI agents and AI-assisted developer workflows;
- durable workflows, state, retries, cancellation, sandboxing, and lifecycle semantics;
- developer tooling and APIs rather than only internal enterprise applications;
- performance/caching/observability work where exact behavior matters;
- fast iteration across codebases and product boundaries.

Leo is explicitly domain-agnostic. Targeting Vercel is about the shape of the work and existing concrete evidence in Vercel-owned repositories, not a desire to remain permanently in one named product area.

## Current role ladder

### CDN Content — especially interesting structural fit

Official posting: https://vercel.com/careers/software-engineer-cdn-content-6105394004

As retrieved 2026-08-11, the role asks for 2+ years of experience building/operating backend services in production. It describes well-scoped projects with real production impact and growth into larger system ownership, with Go/Lua/TypeScript, multi-tier caching, HTTP fundamentals, observability, progressive rollout, and curiosity about unfamiliar code/production data.

Why it matters:

- the YOE band is materially closer to Leo's defensible ~3 years of substantive engineering experience than the 5+/6+/7+ postings elsewhere at Vercel;
- caching/performance are directly supported by Preflight;
- TypeScript/Node and web/runtime fundamentals are established;
- Cloudflare/Vite/AI SDK work gives modern web-tooling evidence;
- Cloud Hypervisor/Fieldwork show that unfamiliar-system entry is not limited to frontend code;
- the largest remaining gap is conventional operation of backend services at planet-scale, not ability to reason about caching or unfamiliar systems.

Do not contort the resume into "CDN engineer" to fit this role. Tailor the specimens toward caching, HTTP/runtime correctness, instrumentation, safe fallback, production-minded testing, and operating what is shipped.

### AI SDK / Workflows / eve

These remain strong capability matches but current postings ask for more formal tenure than Leo has.

The application thesis should be evidence-based rather than title-based:

> Already producing accepted work in Vercel-owned code and independently building systems around many of the same state/lifecycle/runtime/tooling problems; chronology is shorter than the technical evidence.

Apply anyway where the work is compelling, while recognizing that stated YOE may stop the application before technical evaluation.

### Compute / Deployment Infrastructure / other senior infrastructure roles

The systems thinking overlaps, but current roles often ask for 5–6+ years plus direct operation of distributed production infrastructure, on-call ownership, schedulers/orchestrators, and large-scale fleet experience.

Those are real evidence gaps. Do not substitute Cloud Hypervisor/SmolRunner design work for years of operating a production compute fleet.

## General implication

Vercel is useful evidence for a larger market observation: **modern tooling roles now exist whose engineering shape maps to Leo's current slope even when the nominal domain changes.**

The long-term identity should therefore stay broad:

> Software engineer who gets useful quickly in unfamiliar systems, with current strengths in runtimes, developer tooling, performance, state/lifecycle correctness, and AI-assisted engineering.

The company/role-specific resume should change which specimens lead, not invent a narrower permanent identity.