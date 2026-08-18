# From Invisible Asteroids to Evidence Ledgers

*Written by GPT-5.6 Sol under Leo's direction. Human-directed Workbench essay, 18 August 2026.*

There is a particular danger in looking at an old GitHub account chronologically: eventually the repositories stop looking like projects and start looking like geological layers.

A filename that seemed normal at the time becomes an index fossil. A commit message preserves an argument you had with a framework. A dead page turns out to be the last surviving organ of a tutorial you started two years earlier. A bug you once defended as artistic character sits a few thousand commits away from a benchmark harness that invalidates its own flattering measurements because the clock boundary was wrong.

The funny part is that the through-line is surprisingly coherent.

This is a chronological history of roughly a decade of personal software: Processing games, Java coursework, Chrome extensions, React tutorials, a long-lived personal site, take-home assignments, image-processing and ML experiments, developer tools, a serious artist-reference application, and then the mid-2026 eruption of research, verification, runner, coordination, and upstream-investigation systems.

It is not a complete catalog. Some repositories are private, some were deleted, some were tutorial forks, and some were only ever temporary working copies. The point is the change in *how* the work was approached.

The unit of work keeps getting larger.

At first it is a class.

Then an architecture.

Then a product.

Then an experiment.

Eventually it becomes something stranger: **a claim, plus the evidence, identity, authority boundary, recovery story, and operating path required to trust that claim.**

Scrapbook survives across enough of these phases to become the best spine for the story. It begins by renaming tutorial invoices into projects. By 2026 it is the place that records what the other repositories did, what was learned, what failed, what deserves to be shown, and where the evidence lives.

## 2015–2018: make the weird thing move

The oldest surviving work is gloriously direct.

[Pong in Java](https://github.com/teamleaderleo/Pong-in-Java) is a Processing game whose geometry is largely hand-negotiated through conditionals. The ball stores integer coordinates while movement involves doubles, so compound assignment quietly quantizes motion. Paddle collisions divide the face into manually selected angle buckets. Exact-equality collision assumptions help explain why the old issue tracker contains reports like “Ball angle sometimes messes up” and “Ball sometimes goes through paddles/obstacles.”

The source also contains debugging strings that look like somebody fell asleep on the keyboard.

This is not sophisticated simulation code. It is closer to thirty-seven conditional statements wearing a trench coat and attempting Euclidean geometry.

But it establishes an important early instinct: if the abstraction does not exist, just build enough local rules to make the behavior happen.

The [Asteroids project](https://github.com/teamleaderleo/Asteroids-with-one-invisible-asteroid) pushes that instinct further. One asteroid could become invisible because a helper that appeared to return a useful random scale could produce zero. Rotation math could divide by a zero rotation speed. Projectile lifetime logic could wrap bullets before the out-of-bounds check got a chance to retire them. Ship state was effectively singleton-like because important fields were static.

And when the invisible asteroid became an issue, the response was not purely technical. The issue entertained the idea that an invisible asteroid might be a feature: fear of the unknown as game design.

That is an excellent early software instinct and a terrible debugging policy.

The 2026 revisit to the same repository is useful because it creates a direct before-and-after. The newer patch guards zero, NaN, and infinite rotation values and makes the rendering path safer instead of mythologizing the fault. The original personality remains; the failure boundary is simply treated with more respect.

The private 2017 Sudoku repository shows another early characteristic: implementation sophistication lagged behind testing instinct.

Despite being called a solver, the program mostly validates a completed board. The box logic is hard-coded around 9×9 Sudoku. There is a no-op initialization loop that happens not to matter because Java already zero-initializes the array. Yet one of the hand-built test boards is genuinely adversarial: a Latin-square-like arrangement that satisfies row and column uniqueness while violating sub-box constraints.

The code had not learned backtracking.

The tests had already learned suspicion.

That distinction matters later.

## 2019: inheritance receives a formal complaint

The [Bank Management Application](https://github.com/teamleaderleo/Bank-management-application) is the first repository in the surviving history that feels like a small software system rather than a toy.

It was coursework, and it carries the recognizable architecture of a Java course project: managers, factories, serializable domain objects, roles, privileges, transactions, account subclasses, simulated time, foreign exchange, mortgages, GICs, users, employees, technicians, tests, and enough classes to give IntelliJ's project tree a sense of civic importance.

There are plenty of period-appropriate mistakes.

Money is represented with `double` and manually rounded. Passwords are plain strings compared directly. Exchange support is hard-coded. Whole application state is serialized as a Java object graph. A foreign-currency mutation can convert an account balance before a later setter rejects the state transition. Transfer reversal can use a current exchange rate instead of the historical one, so “undo” need not restore the original amount. The simulated bank date advances a day on shutdown, turning application exit into a monetary-policy event.

But one design decision stands out in a good way.

Users do not inherit through a giant class hierarchy of Customer → Employee → Manager → Technician. A user has roles; roles have privileges.

That came out of a lesson that remained durable: inheritance is frequently the wrong way to model capabilities. Composition makes the changing relationship explicit.

The account hierarchy still uses inheritance where subtype behavior is much easier to justify. Roles and permissions use composition where people can hold combinations of authority.

That is a meaningful step. The question is no longer only “how do I make this behavior occur?” It is becoming “where should this behavior live?”

There is still plenty of cathedral Java around it. But the cathedral now has zoning laws.

The same year also produced [Bookmark Carousel](https://github.com/teamleaderleo/Bookmark-Carousel), a Chrome extension inspired by the Carousel scene in *Mad Men*. Press a hotkey; recursively flatten the bookmark tree; open a random bookmark.

The recursion is cleaner than the surrounding extension residue. Old popup buttons survive without useful handlers. A dead page references the wrong script path. One historical new-tab override had a filename case mismatch. Tutorial scaffolding remains visible.

What is interesting is the product instinct: a small emotional idea becomes a very narrow utility. There is also early evidence of scope-cutting. A more elaborate idea about moving bookmarks around gets simplified rather than lovingly overbuilt.

That turns out to be a useful habit.

## 2020: consume the web stack

The 2020 repositories are less about original product identity and more about absorbing the contemporary web-development stack.

`github-pages-with-jekyll` is essentially a GitHub Learning Lab fossil. The configuration title is “Just let me get to the fun part,” while the generated post still has the title `YOUR-TITLE` and the body “My goodness, what a wonderful day!”

The customization effort was concentrated on impatience rather than placeholders.

[barebones-issue-management](https://github.com/teamleaderleo/barebones-issue-management) is React, Material UI, and Firestore. It contains comments such as:

> `useState([]); //hook, sets up short term memory`

It also contains the kind of bug that tutorials are excellent at producing: the Firestore snapshot gives the UI one data shape, while optimistic local code appends a raw string to an array of issue objects and waits for the database subscription to correct reality later.

The interface contains `<h1>yo</h1>`, a modal titled simply `Modal`, and secondary copy reading `Bottom Text`.

It is half tutorial, half impatience.

`chat-plus-issue-tracker` is more ambitious—Create React App, Material UI, axios, Firebase, Express, Mongoose, Pusher—but the committed server imports a model from a path that does not match the repository tree, and the “issue tracker” portion is difficult to find outside generated/service-worker noise.

The issue tracker appears to have been naturally selected out of the species.

There were also open-source tutorial/fork experiments around `first-contributions` and Layer5. Those are better understood as learning how public repositories work than as authored codebases.

Then the surviving repository history goes quiet for almost three years.

That gap matters.

## 2023: reopen the tutorial buffet

The return is modest.

`image-gallery-starter`, created in October 2023, is essentially the Next.js + Cloudinary example application. There is no need to reinterpret it as a lost masterpiece. It is exactly what it looks like: a way back into an ecosystem that had moved substantially since 2020.

After a long gap, the instinct is not “invent a framework.” It is “touch the current tools until they stop feeling foreign.”

That makes what happens in 2024 easier to understand.

## 2024: tutorials become raw material

`art-project-tracker` begins in May 2024 and already shows a noticeable jump from the 2020 CRUD experiments.

There is a Vite/TypeScript frontend, an Express backend, a project model, REST routes, and typed frontend data. The backend has recognizable layers. The frontend still has a fairly large component holding CRUD behavior together, but the project is no longer satisfied to leave tutorial boilerplate in charge of the repository identity.

The README contains a recurring conceptual enemy:

> “Not really sure what's going on with the ‘middleware.’ Still.”

Middleware will survive long enough to become a running joke across several generations of this work.

Then, in June, [Scrapbook](https://github.com/teamleaderleo/scrapbook) appears.

This is the important one.

### Scrapbook begins as a business dashboard in witness protection

The first phase is built from the Next.js dashboard tutorial world: invoices, customers, revenue, Postgres, Zod, server actions, pagination, search, authentication.

The commit sequence then starts replacing the nouns while the machinery is still running.

Invoice becomes project.

Customer becomes artifact.

Email becomes tags.

There is a commit that adds invoice updating while explicitly noting that invoices will later become something else. Another labels itself the “last commit before pivot (I think).”

This is the Ship of Theseus performed through domain-model renaming.

The learning diary is equally good. One commit describes inserting data using “Zod and that sql thing.” Another is simply “Install bcrypt?”

Underneath the jokes, the pace is substantial. Search gets debounced to avoid hitting the database on every keystroke. Pagination arrives. Server errors get handled. Streaming is tried, then reconsidered when it makes the experience worse. Authentication gets wired in while React/Next release candidates are being changed around underneath it.

This is the point where tutorials stop being end products and start becoming disposable scaffolding.

The rest of 2024 pushes Scrapbook through several identities.

It becomes a personal workspace with projects, blocks, tags, sidebars, editor state, Tiptap, Zustand, and rich-text persistence. Virtualized scrolling is introduced, fought, and removed after dynamically sized content makes it jump. A “cheeky prefetch on hover” is added and then recognized as probably redundant because the framework already does it.

By fall, the commit vocabulary changes. “Project table” and “block schema” give way to “revamp landing page,” “make landing page more dull while I figure out what we want to do,” and “try out hardcoded sticky note.”

By December, old dashboard/card/tag machinery is being deleted.

The conceptual shift is subtle but important:

Scrapbook stops being **an app for managing personal things** and starts becoming **a personal place on the web that can contain things**.

The name starts becoming more accurate after the product pivot rather than before it.

Meanwhile, [potato-quality-image-compressor](https://github.com/teamleaderleo/potato-quality-image-compressor) begins as a Go image-compression service and eventually becomes one of the best examples of a newer learning style: test whether complexity earns its keep.

HTTP becomes gRPC as an experiment. Prometheus and Grafana arrive. Worker pools, contexts, semaphores, memory metrics, load tests, Docker, protobuf, libvips and benchmarking all get involved. Eventually the README reaches the conclusion that large binary blobs are not especially improved by being sent over gRPC, generated code is annoying, TypeScript is fine, HTTP is fine, and npm Sharp is fine.

That is not failure. That is an experiment successfully returning “no.”

`ideal-fiesta`, whose description is `PRACTICE IS THE IDEAL FIESTA`, is a much smaller coding gym containing things like a handwritten linked list. `calendar` is even purer: a repository whose recorded lifetime is effectively one second and whose description is “it's a time thing; you get it.”

An idea was born, received a GitHub repository, and died almost immediately.

Healthy lifecycle management.

## 2025: software annoyed me, therefore a repository exists

2025 has two parallel stories.

Scrapbook continues evolving as the long-lived application. Around it, many smaller repositories become focused exercises, utilities, assignments, and experiments.

The biggest change is that a repository no longer has to justify itself as a future product. It can simply answer one question.

### Small developer tools

[git-inline](https://github.com/teamleaderleo/git-inline) turns Git history into a reusable React-facing library. It grows install instructions, API surface, a demo, configuration behavior, loader boundaries, source-root handling, changelog work, and packaging concerns.

That is a different class of question from earlier projects. The user is now somebody *outside* the repository.

What defaults will make sense to them? What happens if they pass a directory? Which path assumptions belong inside the package?

[fold-single-line-comments](https://github.com/teamleaderleo/fold-single-line-comments) is even more direct: consecutive `#` comments should fold properly in editors, so a VS Code extension now exists.

This becomes a recurring 2025 pattern:

**software inconvenienced me personally; therefore a repository now exists.**

`code-depth-gradations` explores showing indentation depth through editor background gradations. `lots-of-loads` gets a grand description about modular version-aware benchmarking and CI integration while containing essentially nothing.

That is speculative packaging: the description of a Series A observability startup, the contents of a freshly formatted hard drive.

### The React Three Fiber descent

The repository `r3f-first-try-cards-forked` begins like a normal graphics-framework experiment: take a card demo, learn React Three Fiber, adjust scrolling.

Then browser zoom/display scaling exposes a mismatch in Drei's scroll measurements.

The reaction is important.

Instead of treating the framework as an oracle, the debugging path goes downward. Event timing gets inspected. Timeouts and intervals get removed. Drei's own `ScrollControls` source is pulled into view. DOM client height is compared to the Three-side size calculations.

By 2025, an abstraction that behaves strangely is no longer magical. It is code written by another person, and the call chain can be followed until the mystery stops being mysterious.

That instinct becomes central to the rest of the timeline.

### Take-home mode: finish the thing

`emoji-mood-tracker-basic` and `reddit-narrative-detection` were take-home-ish assignments, which makes their restraint informative.

The mood tracker is built in a concentrated May 2025 burst: React/TypeScript, six emoji moods, localStorage history, summaries, clear controls, light/dark behavior, responsive layout, contextual messages.

But the implementation also carries a product opinion. It avoids turning emotional logging into a streak system because a daily check-in can create guilt and meaningless compliance. The interface tries to record meaningful changes rather than reward filling a calendar.

Even under assignment constraints, the question is no longer only “did I satisfy the requirements?” It is “what behavior does this interface encourage?”

The Reddit project is the opposite kind of assignment. It begins with the suggestion of a Next.js application and quickly turns into data work: streaming Reddit JSONL, splitting posts from comments, catching malformed records, parallel conversion, normalizing `t1_`/`t3_` identifiers, and combining large files.

The glamorous title is “Narrative Detection.”

The actual work is “why does this identifier have a prefix and how do I process these files without cooking the machine?”

That is a useful lesson in data projects: the impressive layer often waits behind a lot of boring correctness work.

### Glossless: the scattered experiments converge

Glossless deserves more weight than a normal side project in this period.

The related [pose-estimator API](https://github.com/teamleaderleo/api-for-bizarre-pose-estimator) is not best understood as an independent ML experiment. It is one organ of the larger application.

The backend work takes an older research pose-estimation stack and forces it into a deployable GPU service. Model loading gets separated from CLI/visualization behavior. Dependency archaeology follows: PyTorch Lightning, torchmetrics, torchvision, Detectron2, old checkpoints, NumPy compatibility, protobuf constraints. Cold-start work is split into CPU snapshot loading followed by GPU restoration.

A second path experiments with multimodal vision output.

The product architecture becomes hybrid: local MediaPipe for ordinary human photos, specialized GPU inference for illustrations, and a multimodal path for additional checking or difficult cases.

Then, over a few days at the end of June, the actual editor rapidly appears.

2D and 3D manipulation share editor state. Undo/redo becomes explicit. Different pose representations get normalized into one internal representation. The Source model distinguishes human photos from character art. Lighting becomes editable rather than merely present. Project storage arrives through Supabase.

This is the point where the R3F learning work cashes out.

A month earlier, the graphics framework was something to interrogate.

Now it is something to build an editor with.

On July 1, Scrapbook publicly promotes Glossless as one of the important projects. That act matters. A repository can exist without becoming part of the public identity. Glossless crosses that line.

The visible codebase becomes quieter later in 2025, but the project remains part of the site and returns strongly in 2026.

### Scrapbook becomes a collection of rooms

While the smaller repositories multiply, Scrapbook keeps changing jobs.

By early 2025 it is clearly the personal website. A blog grows out of Markdown/MDX. Branding consolidates around teamleaderleo.com. A realtime-presence experiment appears. A 3D carousel/cube arrives, gets disabled when deployment needs to happen, then gets isolated to its own page.

A particularly representative commit disables complicated expanding/contracting resume state because the interactions have become “horrific,” then immediately announces that “new horror” is arriving in the form of a 3D version.

Simplification by changing the category of difficulty.

By fall, `/space` emerges as an app inside the site: searchable material, review state, spaced repetition, code/editor surfaces, reading behavior. A timezone visualizer becomes another interactive room. Monaco and Shiki turn the gallery itself into software.

Most importantly, lessons start traveling between rooms. A later blog change is literally committed as “pre-render blog markdown (lesson from space).”

The codebase is now old enough for one subsystem to teach another.

That is the beginning of Scrapbook becoming a learning environment rather than a container of unrelated pages.

### Simple Email Filter: economics joins the architecture

`simple-email-filter` provides a useful bridge into 2026.

It grows from personal junk classification into a deployed automation path: Microsoft authentication, caching, model classification, AWS Lambda packaging, token persistence, duplicate-work avoidance, and movement from polling toward subscriptions/webhooks.

The telling question is no longer “can I call a model?” It is “is compensating for a cheap model's weakness in policy logic still a better trade than paying for a smarter model?”

That is an engineering question about economics and failure modes rather than novelty.

Then the account goes quiet again for a few months.

## Early 2026: small re-entry, then ignition

The first part of 2026 is relatively calm.

There is a January email-filter adjustment and a small spring return through game/prototype ideas. The real discontinuity begins in July.

Glossless revives around July 9.

A private research system called Quarry is created the same day.

[Preflight](https://github.com/teamleaderleo/preflight) follows on July 14.

Then the rate of repository creation changes abruptly.

The interesting part is not simply the number of repositories. It is that they begin to occupy different *roles* in one larger way of working.

## Quarry: research starts with methodological paranoia

Quarry begins with market-research experiments, but its distinctive feature is caution about what the experiments are allowed to claim.

The earliest work already distinguishes a paper-derived mechanism from a genuine replication. Small fixtures are labeled as mechanism checks rather than evidence. Data sufficiency gates, transaction-cost stress, immutable snapshots, walk-forward evaluation, holdout consumption, execution timing, reconciliation, and explicit evidence boundaries appear quickly.

A repeated rule emerges: a research artifact should not quietly acquire authority it has not earned.

That may sound bureaucratic until you compare it with the old Pong issues.

Early software said: “the ball did something surprising.”

Quarry asks: “what exact evidence would justify believing this result survives outside the fixture that produced it?”

The instinct to build adversarial tests was already present in the Sudoku days. By 2026 it has acquired methodology, data lineage, and vocabulary.

## Preflight: the benchmark harness is part of the product

Preflight is a performance launcher for Starsector, but the development history is really a story about measurement discipline.

The project attacks repeated startup work across a heavily modded game installation: resource loading, texture preparation, JSON/path resolution, mod behavior, caching, compatibility and runtime instrumentation.

The headline results become substantial. But the important part is how many times the measurement apparatus itself is found to be wrong.

One harness anchors timing on the wrong log boundary and creates an apparent bimodal distribution. Another waits for log silence after the useful endpoint has already occurred. Log rotation splits one launch across files. Human-driven runs accidentally hide bugs that appear only when the process is unattended.

When those problems surface, old numbers get reinterpreted or withdrawn.

The flattering measurement does not get grandfathered in merely because it already made the README look good.

This is a major change in engineering behavior.

The evidence pipeline is now part of the software.

A benchmark is not “a number came out.” It is a claim about what two conditions did under a defined protocol, with enough retained evidence to find out later that the protocol was wrong.

## July 23–30: the meta-tools arrive

The middle of July 2026 is when the GitHub history stops looking like a conventional set of side projects.

[SmolRunner](https://github.com/teamleaderleo/smolrunner) is created on July 23 with the description:

> small runners for big fellas

It grows into a Rust system for disposable GitHub Actions workers on operator-owned Macs: VM lifecycle, resource admission, durable worker ownership, recovery, bounded execution, scale-set integration, and safe teardown.

The tiny runner acquires constitutional law.

Thirty-six minutes later, [Stensibly](https://github.com/teamleaderleo/stensibly) is created.

Its current job is to record responsibility and authority for human-agent work: what needs doing, who owns it, what is blocked, what evidence exists, and what the actor is actually allowed to do.

The distinction between assignment and authority becomes explicit. Claims expire. Responsibility survives process loss. Artifacts remain references to external systems instead of being copied into the ledger.

The ordering is almost comedic:

First: we need disposable workers.

Half an hour later: wait, who is authorized to tell the disposable workers what to do?

That is how governance enters the repository list.

The next day produces [Proofwake](https://github.com/teamleaderleo/proofwake), an evidence index for software revisions, and [Renderprove](https://github.com/teamleaderleo/renderprove), a browser-oriented verification system.

The projects eventually describe their intended relationship plainly:

> SmolRunner runs it.  
> Renderprove sees and verifies it.  
> Domain tools measure it.  
> Proofwake remembers the evidence trail.  
> Stensibly coordinates what happens next.

That is the point where “ecosystem” stops being a retrospective metaphor.

A few more tools appear in quick succession.

[gh-tidy-branches](https://github.com/teamleaderleo/gh-tidy-branches) exists because enough branch-heavy work now happens that merged-branch cleanup deserves its own safe GitHub CLI extension.

[terminal-kit](https://github.com/teamleaderleo/terminal-kit) begins as a macOS dotfiles repository and grows into a management layer for Ghostty, cmux, tmux, Zsh, themes, workspace overviews, Git transport, editor behavior, performance inspection, and eventually a native event-driven memory-pressure controller that can change terminal/agent memory policy without polling.

At some point “dotfiles” becomes “small operating environment.”

[Fieldwork](https://github.com/teamleaderleo/fieldwork) appears on July 29 as a disciplined place for understanding external code, reproducing behavior, retaining negative results, and preparing upstream fixes only after enough evidence exists to reduce a maintainer's uncertainty rather than increase their review burden.

[Linux Fieldwork](https://github.com/teamleaderleo/linux-fieldwork) follows and points the same method at Linux, Debian, packaging, init systems, containers, build systems, filesystems and lower-level tooling.

This explains the fork avalanche that follows.

The account suddenly contains working copies of large upstream repositories: Playwright, Vite, Biome, OpenTelemetry, Workers SDK, Supabase, DuckDB, systemd, util-linux, Podman, runc, QEMU, LLVM, Rust, curl, and many more.

Those are not dozens of new personal products.

They are specimens.

The research lab built a freezer, then filled it.

## Product ideas do not disappear; they become better instrumented

The infrastructure turn does not mean the playful side stops.

`ONE MORE LEGEND` evolves into a deterministic single-player roguelite whose run can be reproduced from seed, archetype, options and choices. Its browser UI and ChatGPT/MCP surface consume the same headless engine.

`Relirium` becomes a local-first writing and reading desk for serial fiction, with IndexedDB drafts, optional private cloud sync, search, scraps, checkpoints and full backup/export behavior.

`Rollodoro` turns procrastination before starting a focus session into a small game: roll a duration, explicitly seal the promise, protect the session, earn a little artifact at completion.

`MAKE GOOD TV` grows into a genuinely strange simulation project about entertainment production, recurring characters, emergent stories, props with provenance, autonomous agents and cross-show consequences.

The difference from older playful software is not the disappearance of silliness.

It is that the silliness now sits on deterministic seeds, replay traces, validation boundaries, agent action contracts, causal branch comparisons, and tests that ask whether an earned nickname is actually supported by the incidents that produced it.

The jokes have acquired experimental controls.

## Scrapbook wakes up and becomes the public memory layer

Scrapbook is dormant through the first half of 2026.

When it wakes in July, the first work is maintenance: broken hotkeys, render-phase state mutation, a CDN dependency in the time visualizer, accessibility and reduced-motion repair.

This is an important change in perspective.

The 2025 code is no longer being extended by its enthusiastic inventor. It is being inspected by its maintainer.

Then, on July 24, the homepage is rebuilt around live GitHub activity and current repositories. SmolRunner and Stensibly are explicitly promoted as recent work.

Home stops answering “what have I built?” and begins answering “what am I doing now?”

That makes Scrapbook the first public surface to reflect the repository explosion rather than merely coexist with it.

The rest of July changes the development culture of the repository.

Lint, type checking, unit tests, Playwright, route smoke tests, browser regression coverage, cache policies and explicit stale-data behavior become normal. Space gets incremental loading and better recovery. The site keeps previous content visible during navigation and refreshes rather than blanking itself. Upstream failure becomes something to represent honestly, not an excuse to replace a meaningful number with zero.

At the same time, the old Three.js cube becomes an agent guestbook.

That starts as a playful place for agents to leave small field notes after working in other repositories. Then identity, repository, model/runtime, source evidence, timestamps and provenance become typed fields. Artwork gets added. An image importer gets built because binary assets do not fit cleanly through every connector write path.

And then a better question wins:

Why are we operating an image-generation → Drive → importer → WebP pipeline so that a coding agent can leave a tiny signature?

The normal path gets replaced with deterministic generated sigils.

Repository/project scope influences the frame. Agent designation influences the primary glyph. Work description contributes small accents. Generation and variant values make the result reproducible. Historical visual generations remain callable.

The whimsical result survives.

The operational nonsense does not.

That is an unusually good summary of the 2026 engineering taste.

### The blog becomes Workbench

The dormant blog also returns, first as “The Bot Desk.”

Instead of treating agent-written text as disposable output, the publication records byline, model/runtime, direction, editorial state and revision. Articles can be read as clean current text, redlines, or prior versions. Feedback and recurring writing problems become editorial memory.

The first substantial piece gets criticized for formulaic declarations, noun-heavy phrasing, faux grandeur and melodrama.

The system records the criticism.

Eventually the human-facing name becomes **Workbench**, because the important question is less “was this written by a bot?” and more “did this piece become worth reading?”

The old `/desk` and `bot-desk` identifiers remain for compatibility, which is exactly the kind of boring stability decision that earlier versions of the project rarely had to care about.

### Visual taste learns to delete

Late July also contains one of the clearest demonstrations of changed product judgment.

A fairly elaborate homepage direction is built around steel/phenolic materials and a present-first honeycomb contribution field. It gets implementation work, test coverage, visual evidence and documentation.

Then it gets rejected.

The honeycomb does not visually read as a true contiguous hex grid. The material treatment makes the scoreboard worse, especially in light mode.

So the repository merges a rollback instead of trying to justify the investment.

The rollback explicitly says a future hex-grid idea must start separately, use real edge-sharing geometry, and pass screenshot review before production integration.

That is a huge change from the invisible-asteroid era.

A bug could once be promoted to lore because it was charming.

Now a fully implemented visual direction can be deleted because the screenshots say it is bad.

Taste has acquired a deletion mechanism.

The direction that survives is almost the opposite: a warm paper workshop. Space becomes a clipping drawer. Time gets paper cards. Gallery gets paper creatures. A small paper dinosaur called Scraplet becomes a recurring resident.

After years of dashboards, indigo interfaces, cubes, glass, and instrumentation, the site finally decides to look like its name.

### The tutorial is formally retired

On July 31, a two-year archaeological cycle closes.

The entire old `/dashboard` tree is removed after confirming that its remaining routes are redirects, `null`s, empty shells and commented stubs.

A later cleanup removes orphaned invoice/project/dashboard UI and dozens of direct dependencies that have no surviving caller.

The Next.js tutorial DNA that started with invoices in June 2024 is finally gone from production.

It remains in Git, where historical code belongs.

The current repository even has deprecation-boundary tests designed to stop retired subsystems from quietly reappearing.

The old habit was to leave failed code commented nearby.

The new habit is to let version control remember it so the current tree can stay comprehensible.

## August 2026: Scrapbook becomes a synthesis layer

By August, Space is no longer merely a private collection of saved items.

It has public reading sheets, a private practice composer, a personalized learning Trail, explainable on-device selection, reading resume, keyboard-command registries, mobile editor sheets, browser-history continuity, outage snapshots and FSRS review behavior.

Its current product direction is unusually clear: a personal, searchable place for collecting references, notes and code, then deliberately revisiting them **without an algorithmic feed deciding what appears next**.

The point is active memory rather than engagement.

Workbench begins harvesting lessons from work happening elsewhere. A Stensibly error-boundary debugging pattern becomes a technical essay. Evidence records get linked into prose. Public learning records become revisioned.

Then `/work` is added as a living engineering record.

The source repositories remain authoritative. Scrapbook keeps the synthesis: what happened, why it matters, which evidence supports it, whether the finding was adopted, reversed or still experimental, and whether it belongs in a public career narrative.

Preflight, upstream repairs, Stensibly, SmolRunner and Fieldwork become selected public records rather than a wall of repository logos.

This is where Scrapbook's role in the larger ecosystem becomes clearest.

Quarry can own research state.

Preflight can own a game-performance problem and its measurements.

SmolRunner can own execution capacity.

Renderprove can own browser evidence.

Proofwake can index revision evidence.

Stensibly can own responsibility and authority.

Fieldwork can own careful upstream investigation.

But Scrapbook increasingly owns the questions that cross those boundaries:

What have we been doing?

What did we learn?

What is worth showing?

What should be revisited?

What is current, and what is historical?

Which confident conclusion later turned out to be wrong?

Where is the evidence?

The homepage now even begins with an Operator phrasebook: reusable steering language exposed both for humans and machine readers. The personal site has acquired an operator's manual.

That would have been difficult to predict from `YOUR-TITLE` and “My goodness, what a wonderful day!”

## The recurring pattern: adopt, push, understand, remove

Across the entire history, one engineering pattern becomes more consistent over time:

**adopt a thing → push it until its real costs appear → understand the failure mechanism → simplify or remove it → preserve the lesson.**

The technologies change.

Tables. Virtualization. Streaming. WebSockets. Three.js client boundaries. gRPC. libvips. R3F scrolling. Monaco initialization. GPU inference dependencies. benchmark harnesses. agent artwork workflows. homepage material systems. CI browser gates.

The newer work is not characterized by avoiding complexity.

There is obviously plenty of complexity.

The improvement is a growing willingness to make complexity *justify itself*.

Sometimes it does.

Glossless keeps the 2D/3D editor because direct manipulation is the product.

Space keeps Monaco because code editing is an actual use case.

Preflight keeps instrumentation because the measurement is inseparable from the claim.

Stensibly keeps authority state because coordination without authority boundaries is unsafe.

And sometimes the answer is no.

gRPC leaves the potato compressor's preferred path.

Virtualization leaves Scrapbook when the dynamically sized list becomes worse.

The honeycomb leaves production because it looks wrong.

The artwork-first agent check-in workflow leaves the ordinary path because its operational cost exceeds its value.

Deletion stops being evidence that the original work was wasted.

Deletion becomes evidence that the experiment finished.

## The other recurring pattern: go downward when something is strange

Another shift is equally visible.

Old code often reacts to surprising behavior locally.

Add another conditional. Add a nudge. Add a timeout. Wrap the value. Keep moving.

By 2025–26, unusual behavior increasingly triggers a descent through the abstraction layers.

Drei scroll measurements look wrong: read Drei.

An old pose model will not deploy: untangle the dependency stack and model lifecycle.

A Starsector load measurement splits into two modes: reconstruct the timing boundary from the game's own logs.

A Cloudflare fetch behaves impossibly: inspect the exact call expression and provider boundary.

A game loader spends seconds “reading JSON”: break the method into path search, file read, stripping and parsing, then discover that the expensive part is repeated filesystem probing across mod roots.

The abstraction is no longer sacred.

If the behavior matters, follow it until the mechanism is visible.

That may be the most important technical maturation in the whole timeline.

## What changed, really?

It would be easy to summarize this as a list of languages and frameworks.

Processing and Java.

Then React and Firebase.

Then TypeScript and Next.js.

Then Go, Python, Rust, Three.js, Supabase, Cloudflare, AWS, GitHub Actions, Linux tooling, MCP, agents.

That is true and not very interesting.

The more useful change is epistemic.

The oldest projects mostly record **what could be made to happen**.

The middle years record **how an application should be organized and experienced**.

The 2025 experiments increasingly record **why a framework, service, runtime, or data pipeline behaves the way it does**.

The 2026 systems record **what may legitimately be concluded from that behavior, who may act on it, and what evidence survives after the process that discovered it disappears**.

The tests got more adversarial.

The documentation became less ornamental.

Negative results became worth retaining.

Rollback became respectable.

Upstream maintainers became people whose attention should not be wasted.

AI output became something with provenance, review state, revisions and authority limits instead of magic autocomplete.

And the personal website stopped being a static portfolio.

It became a memory system for the engineering practice around it.

## From one invisible asteroid

There is a satisfying line between the first and latest parts of this history.

An asteroid becomes invisible because a scale or rotation value slips into an invalid state.

The old response is partly technical and partly artistic: maybe the invisible asteroid is interesting.

Years later, a benchmark produces a dramatic performance number because the harness picked the wrong log boundary.

The new response is to invalidate the measurement, preserve the diagnostic evidence, repair the harness, and rerun the campaign.

Those reactions look very different, but they come from the same useful impulse: **pay attention when reality does something unexpected.**

The change is what happens next.

The surprise used to become another local rule.

Now it becomes a question.

What actually happened?

What boundary failed?

Can it be reproduced?

What would falsify the explanation?

Which part of the result is still valid?

What should future work inherit from this?

And, increasingly:

Who or what is allowed to act on the answer?

That is a hell of an evolution for a GitHub account that once contained a commit history explaining what `<pre>` means and a repository called `calendar` that existed for approximately one second.

Fortunately, the newer systems have not eliminated that personality. The names still include `small runners for big fellas`. Commit messages still occasionally amount to “I don't entirely understand this yet but we need to move forward.” A paper dinosaur now lives in the personal site. A game simulation can contain Phil “The Human Disclaimer” Adspace.

The scientific rigor improved without damaging the wildlife.

That may be the best outcome available.