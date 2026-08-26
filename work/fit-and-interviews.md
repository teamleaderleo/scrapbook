# Fit and interviews

This is a living career-synthesis record for the slippery word **fit**: what kind of engineering work, team, interview process, and operating environment is likely to make Leo's demonstrated strengths useful rather than merely unusual.

It is a hypothesis log, not a personality test and not a claim that any particular company or team has already been proven compatible.

## Why fit deserves its own record

A resume answers, imperfectly, "what evidence do we have?" Fit asks a different question:

> **In what environment does this evidence predict useful performance?**

That question matters especially for a nonstandard chronology. A company can believe the work is technically strong and still have a process, role definition, or team need that does not map cleanly to it. Conversely, a role with a nominal experience requirement can still be an excellent match when the actual work resembles what has already been demonstrated.

Treat fit as several separable hypotheses rather than one vague vibe.

## Current fit hypotheses

### 1. Problem fit

Strong current evidence points toward work where the problem is not fully decomposed in advance and the engineer has to identify the real owner of the failure, bottleneck, or lifecycle boundary.

Examples in the durable work record include:

- Preflight critical-path investigation, runtime instrumentation, compatibility gates, and repeated performance reversals;
- Cloud Hypervisor lifecycle/error-boundary work;
- AI SDK shared-state and Web Streams lifecycle work;
- Cloudflare credential-state repair;
- SWC language-semantics work;
- Stensibly authority/idempotency/coordination boundaries;
- Linux Fieldwork investigations where the useful result is sometimes a repaired hypothesis rather than a merge.

Current hypothesis: roles involving runtimes, developer tooling, performance, infrastructure, reliability, compilers/build systems, or technically deep product engineering are more likely to expose the kind of problem Leo already solves well than tightly scripted implementation-only work.

This is not a claim that ordinary product work is beneath the profile. It is a claim about where the evidence is currently most discriminating.

### 2. Operating fit

The recent work suggests unusually high comfort with:

- entering unfamiliar repositories without a long onboarding runway;
- running several investigations in parallel and killing weak candidates quickly;
- using AI/agents aggressively for search, implementation, review, and experimentation while retaining human control over selection and verification;
- building custom probes or harnesses when existing observability cannot answer the question;
- following a problem across abstraction layers instead of respecting the first apparent ownership boundary;
- revising the approach when measurements or maintainers disagree;
- working independently for long stretches, then reconvening around evidence rather than continuous supervision.

A likely good environment gives engineers room to investigate and expects them to justify decisions with artifacts, tests, measurements, code, or operational evidence.

A likely poor environment would make independent investigation mostly irrelevant: extremely narrow ticket execution, rigid ownership boundaries that forbid tracing across the real problem, or evaluation systems where chronology/title matters far more than demonstrated output.

These are hypotheses to test in interviews, not reasons to dismiss a company in advance.

### 3. Review fit

Leo's strongest recent work is not "I had the first correct idea." Much of it is "I could expose my idea to a discriminator, review, or contrary history and move the repair boundary when needed."

Useful examples:

- Vite close-hook work narrowed after maintainer feedback to match Rollup/Rolldown lifecycle semantics;
- runc work identified a real symptom but was closed after the maintainer showed the historical semantic boundary should be repaired elsewhere;
- Cloud Hypervisor ACPI work was narrowed rather than introducing a local mutex-poison policy the wider VMM did not share;
- Preflight repeatedly discarded attractive optimizations after measurement.

Current hypothesis: a team with strong technical review can be a positive fit rather than a threat to autonomy, provided review is about models/evidence and not merely conformance or status.

### 4. Product/ownership fit

Preflight changes the profile because it demonstrates sustained ownership beyond patch production: problem selection, instrumentation, design, implementation, benchmarking, compatibility, packaging, diagnostics, and a path to users.

Glossless and Stensibly add different forms of whole-product ownership. Glaeda adds control-plane/security/recovery design, even though the full product lifecycle is not yet complete.

Current hypothesis: the best roles probably combine deep technical work with an ability to own a meaningful outcome, rather than permanently separating investigation, implementation, testing, and product consequences into different people.

## What fit is not

Do not reduce fit to:

- prestige;
- repository logos;
- "smart people" as a generic compliment;
- liking the product;
- matching every keyword in a job description;
- a manager saying the candidate feels culturally similar;
- whether the role uses the exact languages already on the resume;
- whether the title sounds senior enough.

The useful question is whether the recurring work and operating model reward the demonstrated strengths while exposing missing skills worth developing.

## The chronology mismatch

For internal career synthesis, it can be useful to describe roughly three years of substantive software-engineering work: about sixteen months of conventional industry employment plus roughly two years of independent/open-source/product engineering.

That sentence is **not** a claim of three years of conventional professional employment, and it should not be silently converted into one on an application form.

Answer the field the employer actually asks:

- if it explicitly asks for full-time, post-graduate, paid, or professional employment, use the conventional employment chronology that satisfies that wording;
- if it explicitly includes self-directed, open-source, freelance, self-employed, research, or equivalent engineering work, include the applicable work and make the composition clear;
- if the field is ambiguous and gives no place to explain, do not assume the employer means the broadest possible definition. Prefer the conservative interpretation rather than turning independent work into employment by implication;
- when there is room for context, let the resume or a short explanation distinguish conventional employment from independent/open-source/product engineering.

The fit question is partly organizational: does the hiring process have enough technical resolution to evaluate unusual evidence, or does it rely almost entirely on title/tenure as a proxy?

Neither choice is morally wrong. It simply changes expected conversion.

## Interview fit

Interviews should be treated as another measurement surface rather than a ceremony to pass.

### What Leo's evidence predicts well

Processes that allow some combination of:

- debugging a real or realistic system;
- code review and repair;
- decomposition of an underspecified problem;
- system-design reasoning grounded in actual tradeoffs;
- performance investigation;
- working in an unfamiliar codebase;
- explaining why a test distinguishes competing models;
- discussing a project deeply enough to expose false understanding;
- tool/AI-assisted work where judgment, verification, and ownership remain visible.

### What may need explicit preparation

A strong fit with the eventual work does not guarantee a strong fit with every interview instrument.

Prepare the instrument the company actually uses. That may include:

- timed algorithmic coding when the process uses it;
- concise verbal communication under interview pressure;
- conventional system-design vocabulary and scope control;
- behavioral examples involving collaboration, disagreement, mistakes, and long-lived ownership;
- explaining agent-assisted workflows without either hiding the tooling or making the tooling sound like the engineer.

The correct response to a narrow interview instrument is preparation, not arguing that the instrument should have inferred capability from GitHub. Do not manufacture a generic interview packet before the process is known; `interview-calibration.md` owns that rule.

## Talking about AI-assisted engineering

The useful claim is not "I can make agents generate lots of code."

A stronger formulation is:

> I use agents heavily to widen the amount of code and evidence I can inspect, but I control candidate selection, the causal model, the tests that can falsify it, review of the resulting diff, and the decision to ship, revise, or discard the work.

Interview evidence should emphasize moments where judgment mattered:

- rejecting a plausible patch after a better discriminator;
- noticing the harness exercised the wrong owner;
- narrowing a repair after maintainer history changed the boundary;
- preserving compatibility or authority semantics the generated candidate missed;
- distinguishing component speedup from critical-path impact.

Do not make AI usage a defensive confession. Do not make it a magic productivity claim either. Make the ownership boundary legible.

## Company-specific application hypotheses

These are application theses to verify against current role descriptions and interviews, not assertions about company culture.

### Vercel / adjacent devtools

Current thesis:

> The cold application is unusually grounded because Leo has already entered Vercel-owned AI SDK code, produced a merged/published repair, developed additional lifecycle work, and has adjacent Vite/SWC/Cloudflare evidence plus independent runtime/product systems.

A useful interview question is whether the role rewards cross-package debugging and lifecycle/state correctness or is primarily feature delivery in a narrower product surface.

### Valve / game, runtime, performance

Current thesis:

> Preflight is unusually direct evidence for runtime/performance work around a real game and mod ecosystem: instrumentation of code Leo does not own, compatibility under source drift, critical-path measurement, graphics/audio/resource-loader investigation, generated bytecode, packaging, and gameplay-oriented pilots.

Cloud Hypervisor and the wider systems bench matter because they make the runtime instinct look transferable rather than game-specific.

A useful interview question is what proportion of the target work is deep engine/tool/performance investigation versus content/product implementation, and how engineers find and own optimization opportunities.

### Systems / infrastructure

Current thesis:

> Cloud Hypervisor is the cleanest external proof; Preflight demonstrates runtime depth; Glaeda demonstrates security/reconciliation/control-plane taste; Linux Fieldwork shows the systems bench is much broader than two fortunate upstream patches.

A useful interview question is how much production operations/on-call/long-lived service ownership the role expects. That is an area where conventional tenure may contain experiences the current portfolio does not fully substitute for.

## Questions to ask in interviews

These are not a script. Pick the ones that discriminate the actual fit hypothesis.

### Problem ownership

- How does a problem usually arrive to an engineer here: a scoped ticket, a product outcome, an incident, a performance target, or something else?
- When the apparent owner turns out not to own the root cause, how easy is it to follow the problem across components or teams?
- Can you give an example of an engineer discovering that the requested solution was aimed at the wrong boundary?

### Technical review

- What does a strong code/design review look like on this team?
- Are engineers expected to build reproductions, benchmarks, or targeted observability when the existing signals are ambiguous?
- How often does review materially change the repair/design boundary rather than only the implementation details?

### Autonomy and collaboration

- How independently do engineers choose the next investigation or implementation step?
- What decisions require alignment before experimentation, and what can an engineer simply try and measure?
- How is work handed off when an investigation crosses specialties?

### Performance/runtime work

- How do you decide when a performance problem deserves custom instrumentation rather than another profiler pass?
- Do performance improvements usually come from isolated hot functions, architecture changes, or removing work from the critical path?
- How are regressions and workload representativeness handled in benchmarks?

### AI/tooling

- How are engineers here using coding agents or AI tooling today?
- What evidence or review expectations change when a large part of an implementation was agent-assisted?
- Are there constraints around using agents to inspect unfamiliar parts of the codebase or run parallel investigations?

### Growth / missing experience

- What does someone need to learn in the first year here that is difficult to learn through independent projects or open source?
- Which parts of the role depend most on organizational memory, production ownership, or long-lived team context?
- What would make you hesitate about someone with strong independent technical evidence but relatively short conventional full-time tenure?

The last question is especially useful when the conversation is candid enough for it. The answer reveals the actual gap rather than forcing Leo to guess.

## Signals to record after interviews

After a meaningful process, preserve only the observations that could change future preparation, targeting, or fit hypotheses. Do not fill a checklist for completeness.

Useful things to retain when they matter include what the interview actually tested, which work examples generated follow-up interest, claims that required too much explanation, technical areas exposed as weak, whether chronology/title proxies dominated, and anything the team said that materially changed the current fit model.

Do not turn every rejection into a theory about the company. Multiple observations are needed before treating a pattern as real.

## Revision triggers

Revisit this record when any of the following happens:

- Preflight reaches outside users and produces field diagnostics/support experience;
- a substantial compiler/systems candidate such as SWC/BuildKit/runc lands upstream;
- several application funnels show a repeatable conversion pattern by role type;
- interviews reveal a missing conventional skill that the portfolio has been obscuring;
- a team responds unusually strongly to a story we currently rank as secondary;
- hands-on production/on-call/team ownership becomes part of the chronology;
- the current heavy agent-assisted workflow changes materially.

Fit should become more specific as evidence accumulates. It should not calcify into an identity story that explains every outcome after the fact.
