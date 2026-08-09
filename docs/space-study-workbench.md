# Space: study workbench direction

Status: implementation-ready product brief  
Updated: 2026-08-10

## Decision

Space should be a public, phone-friendly learning garden and private editorial
workbench built around current curiosity and real code. Other people can wander
through the published lessons, questions, explanations, code studies, and
connections. Drafts, review schedules, raw conversation, and every mutation
remain private. FSRS remains available in a secondary review drawer, but due
counts, streaks, and LeetCode should no longer organize the home surface.

The first question is not “what is overdue?” It is “what would be useful or
interesting enough to open right now?”

## Product shape

Space has three layers:

1. **Desk map** — a dense overview of open threads, recent discoveries,
   Fieldwork material, short scales, and the archive.
2. **Reading sheet** — a normal reflowing page with one bounded question, why
   it matters now, source provenance, the explanation, and a useful next action.
3. **Practice bench** — small exercises attached to the material: explain,
   trace, predict, review, debug, type, or alter.

The public experience should feel less like a course catalog and more like a
small personal Wikipedia crossed with a curiosity feed: every page is useful on
its own, but it also provides several inviting ways to continue sideways.

The desk map should offer a few human entry points:

- Continue something unfinished
- Something short
- Open a real codebase
- Review a diff
- Read an explanation
- Practice scales
- Surprise me from the archive
- Open the optional review drawer

## Living lessons and visible conversation

A lesson is not a finished article. It is a living page with a legible history:

- the current explanation or lesson plan;
- what changed and why;
- open questions and uncertainties;
- selected questions and answers worth publishing;
- a short FAQ once questions begin repeating;
- examples, counterexamples, experiments, and source evidence;
- related ideas with a sentence explaining each relationship.

Asking a question should create a private working exchange first. A useful
exchange can later be distilled into a public Q&A block, revision, example, or
new page. Do not publish raw chat transcripts by default: the public artifact is
the edited thought that survived the conversation.

Lesson plans should be iterative rather than linear. They can branch, mark a
prerequisite as unexpectedly necessary, replace a weak explanation, or turn an
answer into a new investigation. Readers see the useful current path and a
compact revision trail, not the maintenance machinery behind it.

## Web of relations

Relations need meaning, not merely backlinks. Begin with a small typed set:

- **builds on** / **prerequisite for**;
- **similar mechanism** / **useful contrast**;
- **example of** / **counterexample to**;
- **caused this question** / **answered by**;
- **used in this fieldwork**;
- **supersedes** / **older framing**.

Every edge should include one short human sentence: “these are related because
…” That sentence is more valuable than an automatic graph line. Pages should
show local neighborhoods first; a global map is an optional overview, not the
only way to navigate.

## Learning doomscroll, without the sludge

The feed can be effectively endless while remaining intentional. After a page
or card, offer a small mixture of:

- one direct continuation;
- one useful sideways relation;
- one resurfaced older thought;
- one five-minute practice;
- one deliberately surprising item.

The feed must retain stable URLs, clear source provenance, “why am I seeing
this?”, a visible stopping point, and a way to resume. It should optimize for
interesting trails and comprehension—not raw session length, outrage, novelty,
or an unread-count treadmill.

### Trail ranking, first implementation

`/space/trail` is the first bounded version of this idea. It ranks the published
archive on the device and presents one study per vertical snap point. The
ranking combines:

- explicit **more**, **less**, and **learned** feedback;
- similarity through existing category and topic/source/mode tags;
- recency, Fieldwork provenance, and short-session fit;
- a deterministic exploration term so unfamiliar material can enter the mix;
- sequence penalties that avoid adjacent items with the same category or a
  heavily overlapping feature set.

The useful TikTok mechanics are feedback density, weighted signals, controlled
exploration, and deliberate feed diversity—not its objective function. TikTok's
public explanation says strong intentional behavior is weighted above weak
context, and that the feed intentionally intersperses diverse material and
supports explicit “not interested” feedback. A contextual bandit is the likely
later model once there is enough meaningful outcome data: it can trade off
known relevance and exploration instead of pretending a fixed score is
omniscient. Sources: [TikTok's recommendation overview](https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you),
[TikTok on sequence diversity](https://newsroom.tiktok.com/an-update-on-our-work-to-safeguard-and-diversify-recommendations),
and the [Yahoo contextual-bandit paper](https://arxiv.org/abs/1003.0146).

For Space, the reward must be different. Opening a study, producing an answer,
returning successfully, or marking the material useful is stronger evidence
than dwell time. The feed should eventually calibrate difficulty as well as
interest, similar in spirit to Duolingo's published description of Birdbrain,
which estimates learner ability and exercise difficulty before assembling a
session. Passive cards should regularly lead into explain, trace, answer, or
compare actions, following the ICAP prediction that constructive and
interactive engagement are stronger than passive exposure. Sources:
[Duolingo on Birdbrain](https://blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain/)
and the [ICAP framework](https://doi.org/10.1080/00461520.2014.965823).

The current memory is versioned, bounded, and stored only in the browser. It is
not uploaded and does not infer a preference merely because a card stayed on
screen. A reset control clears the profile. Before any server-side learner
model, define the event lifecycle, retention, export/delete behavior, and a
learning-oriented success measure.

## Publishing boundary

Current Space items are public unless tagged `visibility:private`. The public
reader never receives review rows or owner identity fields. Adding, editing,
deleting, scheduling, and publishing remain administrator-only operations.

Later structured Q&A and relation records should use an explicit lifecycle:
`draft` → `reviewed` → `public` → `revised` or `retired`. Public pages may show
selected revision notes; private prompts, discarded answers, and review state
stay in the editorial layer.

## Content taxonomy

Organize material by the action it invites:

| Mode     | Typical artifact                                                  |
| -------- | ----------------------------------------------------------------- |
| Read     | ELI5 explanation, annotated source, architecture tour             |
| Trace    | Request path, state update, syscall, packet, or lifecycle         |
| Diagnose | Failing test, bug report, trace, profile, or incident             |
| Review   | PR, diff, AI-produced patch, or design note                       |
| Build    | Small product slice or difficult implementation seam              |
| Design   | Frontend, full-stack, platform, or AI-system prompt               |
| Explain  | Project story, tradeoff ladder, teach-back, or postmortem         |
| Drill    | Typing, syntax, API, shell, SQL, browser, or occasional algorithm |

Tags remain independent dimensions:

- domain: `frontend`, `full-stack`, `platform`, `AI systems`, `Linux`,
  `real codebase`
- time: `5 min`, `20 min`, `60 min`, `deep dive`
- device: `phone`, `desktop`, `paper`
- tool policy: `AI required`, `AI optional`, `no AI`
- state: `fresh`, `open`, `resting`, `worth revisiting`, `finished`, `shelved`
- evidence: source URL, revision, path, license, and evidence class

## Why this matches current interviews

Current public interview guidance still includes fundamentals, but the stronger
senior signal is realistic work:

- OpenAI describes pair coding, take-homes, and expertise-focused interviews
  that assess design, production-quality code, tests, performance,
  communication, and collaboration.
- Anthropic has published a long-horizon performance exercise using an
  unfamiliar simulated accelerator and real profiling tools; it values depth,
  representative work, and explicit ownership even when AI is allowed.
- Canva's AI-assisted round assesses requirement decomposition, delegation,
  review and debugging of generated code, and production readiness.
- Databricks' frontend loop covers browser product work, frontend systems,
  product-design translation, infrastructure, migrations, testing, builds, and
  performance.
- Stripe's published “Bug Squash” model uses a real historical bug in an
  open-source project.
- GreatFrontEnd's public curriculum is useful as a coverage map—UI coding,
  JavaScript, system design, accessibility, async behavior, forms, performance,
  security, and state—but Space should use personally relevant code and
  evidence rather than clone a generic question bank.

Sources: [OpenAI interview guide](https://openai.com/interview-guide/),
[Anthropic careers](https://www.anthropic.com/careers),
[Anthropic technical evaluations](https://www.anthropic.com/engineering/AI-resistant-technical-evaluations),
[Canva AI-assisted interviews](https://www.canva.dev/blog/engineering/yes-you-can-use-ai-in-our-interviews/),
[Databricks engineering interview guide](https://www.databricks.com/sites/default/files/2025-04/engineering-careers-site-interview-prep-april-2025-002.pdf),
[Stripe engineering guide](https://stripe.com/guides/atlas/scaling-eng), and
[GreatFrontEnd's public interview map](https://www.greatfrontend.com/interviews/get-started).

Every exercise must state its tool policy. “AI required,” “AI optional,” and
“no AI” test different skills; silently changing the rule makes results
meaningless.

## Learning model

The supported mechanisms are modest and useful:

- Retrieval is better for delayed retention than repeated reading.
- Spreading encounters over time is useful, without requiring a pressure-heavy
  scheduler UI.
- Generating, explaining, predicting, comparing, and deriving are stronger
  learning actions than passive rereading.
- Worked examples, code tracing, partial solutions, and subgoal labels can
  scaffold unfamiliar material, while advanced work should remove unnecessary
  guidance.
- Personal relevance and autonomy support engagement.

Sources: [retrieval-practice meta-analysis](https://pubmed.ncbi.nlm.nih.gov/25150680/),
[distributed-practice review](https://digitalcommons.usf.edu/psy_facpub/1771/),
[ICAP framework](https://doi.org/10.1080/00461520.2014.965823), and
[programming worked-example review](https://eric.ed.gov/?id=EJ1381113).

Product claims that still need observation rather than academic decoration:

- whether the desk map causes more returns;
- whether “why now?” beats a due date for this user;
- whether semantic zoom feels better than a card feed;
- whether code copywork improves anything beyond symbol and syntax fluency.

## Typing workbench

Treat code copywork as scales, not comprehension theater.

One session:

1. **Glance** — see the complete function and its purpose.
2. **Type** — reproduce code, comments, punctuation, and indentation.
3. **Compare** — show a structural diff and classify error types.
4. **Explain** — answer one question about a decision or invariant.
5. **Alter** — change one edge case, API, condition, or data structure.
6. **Recall later** — optionally reconstruct a small fragment from a cue.

Useful variants:

- exact function or test transcription;
- comments and code together;
- missing tokens or missing lines;
- Parsons-style line ordering;
- predict state/output before running;
- find the defect in a diff;
- write the test that separates two hypotheses;
- type from a prose contract;
- translate between language idioms.

Show completion, exactness, punctuation/identifier error classes, and the
conceptual prompt. WPM can be present but should not be the primary score.
Offer raw mode and editor mode, with autocomplete and auto-pairing toggleable.

Every snippet needs repository, revision, path, and license provenance. Prefer
user-owned repository material; keep third-party excerpts bounded.

## Mobile interaction

The old-Reddit-like overview should be a contained desk mat, not a permanently
unresponsive page:

- far zoom: title, mode, state, and visual shape;
- medium zoom: hook, source, estimated time, and opening lines;
- close zoom: open a dedicated reading sheet whose prose reflows;
- one tap focuses, a second tap or explicit control opens;
- back restores the exact scale and position;
- visible zoom in, zoom out, reset, search, and “show current” controls;
- a stable minimap/location indicator;
- semantic DOM and keyboard order; no text rasterized into canvas;
- browser zoom and pinch zoom remain enabled;
- primary controls target roughly 44 CSS pixels;
- prose reflows while real code and diagrams may scroll within a contained
  region.

This is a deliberate experiment: zoomable interfaces can help overview and
context but can also create orientation costs. WCAG still requires ordinary
reading text to reflow at a 320 CSS-pixel viewport. Sources:
[zoomable-interface overview](https://doi.org/10.1080/0144929X.2011.586724),
[WCAG reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), and
[WCAG target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum).

## Fieldwork supply line

[Fieldwork](https://github.com/teamleaderleo/fieldwork) and
[Linux Fieldwork](https://github.com/teamleaderleo/linux-fieldwork) already
contain stronger raw material than a generic algorithm feed: bounded questions,
exact revisions, state-machine notes, negative results, evidence limits, review
lenses, experiments, and postmortems.

Do not mirror the repositories. Import small study seeds:

- title;
- bounded question;
- plain-language opening;
- exact source link and revision;
- one surprising observation;
- one code pointer;
- suggested practice modes.

Good initial seeds include:

- Workers SDK access-cache authority review;
- Gemini CLI approval-call affinity review;
- libarchive hardlink identity review;
- Cloud Hypervisor shutdown lifecycle trace;
- BuildKit rootless/rootful reproducibility diagnosis;
- coreutils install state-machine explanation;
- research discriminators and stop rules;
- TanStack async-throttle acknowledgement experiment.

The useful Fieldwork interaction model is also a good Space model: show one
small human decision, keep technical servicing elsewhere, and never make the
reader reconstruct a project from raw event history.

## Data strategy

Do not begin with another scheduling schema migration. The current item,
version, category, and tag model can support the first release:

- category stores the primary mode;
- normalized tags store domain, time, device, tool policy, and state;
- the default version is the reading sheet;
- additional versions can hold a compact explanation, deeper mechanism, or
  practice variant;
- source provenance lives in a consistent front-matter block until real usage
  justifies structured columns;
- FSRS review records remain attached but do not control default ranking.

Initial ranking should be understandable:

1. manually pinned or unfinished;
2. recently added and relevant to active Fieldwork;
3. device/time-compatible choices;
4. a small amount of archive serendipity;
5. optional scheduled review only when explicitly opened.

## Delivery slices

### Slice 1 — change the front door

- Replace the clipping drawer's default hierarchy with `Open`, `From
fieldwork`, `Scales`, and `Archive`.
- Add the action-oriented modes and understandable ranking.
- Keep the existing reader/editor and review mechanics behind the new entry
  points.
- Seed 12–20 selected study units, not hundreds.

Acceptance: on a phone, reaching one useful item takes at most two intentional
actions; nothing announces overdue work by default.

### Slice 2 — reading sheet and three practices

- Add a reflowing dedicated reading sheet.
- Support `Explain`, `Trace`, and `Type` first.
- Preserve source/evidence information and exact return position.

Acceptance: the same unit is readable at 320 CSS pixels, keyboard accessible on
desktop, and its practice state can be abandoned without penalty.

### Slice 3 — desk map experiment

- Add semantic zoom, overview controls, minimap, search, and position restore.
- Keep a conventional list fallback and reduced-motion behavior.

Acceptance: the desk map never becomes the only way to navigate or operate
Space.

### Slice 4 — Fieldwork seed importer

- Read only explicitly selected public Fieldwork documents.
- Produce drafts, never auto-publish.
- Retain revision/path/license and mark observation versus inference.

Acceptance: imports are small, attributable, deduplicated, editable, and safe to
ignore.

## What to measure

Keep measurement personal and lightweight:

- opened;
- finished;
- returned to;
- ignored;
- practice started/finished;
- which entry point led there;
- device class and approximate available-time choice.

The success test is whether Space becomes a room worth opening. It is not the
number of scheduled reviews completed.

## Non-goals

- recreating GreatFrontEnd or LeetCode;
- public profiles, leaderboards, streaks, or social pressure;
- an open comment system or automatically published chat transcript;
- importing whole repositories;
- treating AI use as cheating or as mandatory everywhere;
- claiming transcription alone teaches programming;
- making a two-dimensional canvas the only accessible interface;
- deleting FSRS before the replacement earns real use.
