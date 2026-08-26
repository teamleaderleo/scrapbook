# Chinese résumé cross-review continuation — after three independent passes

**Status:** continuation/review artifact; not canonical résumé wording.  
**Inputs:** the mainland V13 seed, the current independent Chinese reviews, the August 25 résumé review playbook, and the current FEX/Linux Fieldwork evidence.  
**Purpose:** record what has already converged, preserve the remaining useful disagreements, and avoid running a fake-precision Thunderdome before the next ten days of engineering can change the evidence.

## The reviewers mostly agree already

The current Chinese reviews were produced independently, but they have converged on the same large decisions:

- **Preflight leads** for mainland game/client/runtime applications.
- The profile should read as **performance / runtime / debugging / failure-handling / tooling engineering**, not as a broad full-stack candidate with a game side project.
- **Cloud Hypervisor** is unusually valuable for game-tech readers because it proves low-level lifecycle, memory-mapping, boot-failure, and persistent-storage reasoning in a mature external codebase.
- The Chinese page should carry **fewer Preflight counters than English V13** and preserve distinct engineering categories instead of every strong measurement.
- The generic skills list should stop leading the eye toward ordinary web/full-stack work.
- The current **C++ / UE / Unity production-experience gap should remain explicit**. Do not wordsmith around it.
- IBM remains useful because it answers the conventional-company question that independent/OSS work cannot: work inside a large organization, cross-team repair, Java/E2E systems, and a real RBAC incident.

That is enough convergence that I would not spend another day asking models whether Preflight should be first or whether the profile has become runtime/performance-heavy. Those questions are settled unless new evidence changes them.

## One older Chinese technique is worth bringing back

`2026-08-27-gpt56-runtime-first-review.md` remembers a useful feature from the older Chinese résumé: short scan labels such as:

- `性能优化：`
- `安全修复：`
- `自动化测试架构：`
- `流程优化：`

I like the technique more than I remembered liking the old résumé itself.

Dense Chinese bullets can become walls of nouns. A neutral content label gives the eye somewhere to land without telling the reader how impressive the work is.

For the current profile, good labels would be things like:

- `整体性能：`
- `资源加载：`
- `存储与 I/O：`
- `运行时：`
- `产品化：`
- `故障处理：`
- `工具链：`

Avoid evaluative labels such as `核心修复：` or `技术深度：`. The evidence can make that judgment.

This is probably the most useful old-language idea recovered in the current review round.

## The remaining disagreements are target choices, not truth disputes

### Whether `引擎` belongs in the top line

Some current variants are comfortable with:

> 游戏客户端 / 引擎与工具链 / 性能优化 / 研发效能

I remain more conservative for the generic version.

The work is highly relevant to engine teams, and FEX may make that relationship stronger. The current résumé still does not establish years of conventional UE/Unity engine production. I would therefore keep the generic line nearer:

> **性能优化 / 游戏运行时与客户端基础技术 / 跨平台工具链**

Then use `引擎` when the exact role is engine/base-tech and the rest of the page makes the transfer argument honestly.

### How much `研发效能` to use

The other reviews are more willing to retain `研发效能` as a generic headline term. I still prefer it as a role-specific projection.

For a Tencent-style R&D platform/tooling role, `研发效能` is excellent. For a client performance or runtime team, `客户端工具链 / 构建与发布 / 性能与故障诊断` is more concrete.

This is not a contradiction. It is a reason to have two nearby Chinese variants instead of one keyword bouquet.

### Which Preflight bullets survive

The current reviews agree on the flagship result and mostly agree on storage/resource work. The live swap space is:

- shared JSON/data loading;
- gameplay-runtime indexing/recomputation;
- Janino/generated-code work;
- physical texture ordering;
- product/compatibility/fallback detail.

That choice should be made against the actual role. A runtime/compiler-ish team gets Janino. A client systems role gets mutation-tracked indexing. A loading/resource-pipeline team gets physical layout. A tooling/product role gets more packaging, diagnostics, compatibility and rollback.

No vote is needed until there is an actual target or page-layout constraint.

### IBM placement

Technical-referral version:

> Preflight → selected OSS → IBM

Conventional HR-heavy version:

> Preflight → IBM → selected OSS

Again, this is a reader question, not a factual disagreement.

## What the old résumé Thunderdome actually did

The August 25 English round was substantially more formal:

- four independent reviewers produced written reviews;
- each produced an alternate TeX variant;
- a later forced-choice arbitration compared concrete decisions;
- V10 became the checkpoint after the useful disagreements were resolved.

`work/resume-review-playbook.md` is explicit that this was **historical machinery, not a required ritual**.

That distinction is important here. The Chinese variants already agree on most of the large editorial moves. A forced vote now would create numbers around small preferences while the underlying evidence is still capable of changing in the next week.

My preferred lightweight sequence is:

1. **Accumulate independent variants now.** Done.
2. **Let the FEX sprint settle or time out.** Do not freeze the C++/Vulkan/runtime positioning before that.
3. **Build two or three actual one-page Chinese candidates**, not five essays: a game client/runtime version, a tooling/R&D-efficiency version, and only if useful a more conventional large-company version.
4. **Cold-review the rendered pages** for first impression, scan order, terminology and interview questions.
5. Arbitrate only the decisions reviewers genuinely disagree about.

The page should not inherit a voting bureaucracy merely because the English review round once benefited from one.

## FEX is the useful ten-day bet

The current FEX work is unusually well placed for this specific career problem.

The owned fork is predominantly C++, and the existing research already changes real FEX Vulkan C++ in `ThunkLibs/libvulkan/Guest.cpp`, `Host.cpp`, generator code and adjacent thunk/runtime paths. The callback-routing candidate has hosted ARM64/Lavapipe evidence; Linux Fieldwork #669 records a deeper lifetime investigation with real generated Vulkan tests.

The strongest demonstrated line now includes:

- dynamic Vulkan PFNs remaining callable after the ordinary wrapper physically unmaps;
- host→guest X11 callbacks remaining valid after wrapper unload;
- a forced moved wrapper reload where retained old host function values continue to work;
- generated resident bridge signatures rather than hand-invented fake APIs;
- investigation of per-library resident bridge ownership versus whole-wrapper `NODELETE` containment;
- real negative evidence showing that a simpler base-namespace-only NODELETE idea does not solve the general callback-lifetime problem.

That is already much more valuable than “learn some C++ before applying to game companies.” It is C++/Vulkan/cross-ISA runtime work attached to an actual failure and an architecture decision.

The remaining engineering described in Linux Fieldwork #669 is also concrete:

- generate all per-library indirect signature thunks into the resident bridge automatically;
- expose stable generated identities/addresses without a hand-maintained Vulkan list;
- redirect generated callback unpackers into resident bridge code;
- keep custom escaping callback helpers resident where needed;
- pressure-test the mechanism outside the selected Vulkan signatures, including GL/CUDA/Wayland where useful.

### Exit condition for the sprint

I would not define success as “do as much FEX as possible for ten days.”

One of these would be enough to materially change the résumé/interview story:

1. **Generator integration:** the per-library resident-bridge mechanism becomes generated rather than a selected Vulkan proof.
2. **Cross-family discriminator:** the same escaped-executable-lifetime mechanism survives one genuinely different thunk/callback family.
3. **Product-like integration:** one coherent candidate branch plus repeatable runtime matrix demonstrates unload/reload, retained PFN/callback behavior, and clean failure controls without hand-maintained test-only plumbing owning the result.

If one of those lands convincingly, stop and record it. Do not keep expanding merely because GL, CUDA, Wayland and every other thunk library still exist.

If none of them becomes coherent by the end of the ten-day window, freeze the research with the current receipts and move on. The existing V13 is already strong enough to apply with.

## FEX should not become an application gate

The strategic value is high because it may change the current C++/graphics/runtime read. It should not become “I am not allowed to apply until FEX is finished.”

The current profile already supports mainland game-tech outreach. FEX is an upgrade path, not permission.

The upstream-policy boundary also stays literal: this is owned-fork/runtime research unless a future upstream contribution is independently prepared under FEX's then-current contribution policy. The résumé can still say what was built and proven in the owned fork. It should not turn AI-assisted fork work into an invented upstream contribution.

## What I would do between now and the application push

Given the flight and ordinary life overhead, ten calendar days does not mean ten heroic engineering days.

The useful sequence is roughly:

- travel/preparation days are travel/preparation days;
- give the FEX generator/lifetime line the focused technical sessions that remain;
- keep one short research ledger of what changed the conclusion instead of polishing career prose every night;
- near the end of the window, refresh the factual résumé sources once;
- if FEX earned a new career claim, write it once and let the Chinese variants consume it;
- render the smallest useful mainland variants and start sending them.

Do not spend the week repeatedly rewriting `客户端基础技术` versus `研发效能` while the engineering result is still moving.

## Current editorial checkpoint

If nothing else changes, my preferred base remains:

**方向：性能优化 / 游戏运行时与客户端基础技术 / 跨平台工具链**

with:

1. Preflight first;
2. Cloud Hypervisor as the low-level OSS anchor;
3. Vite / Cloudflare / AI SDK compressed by mechanism;
4. IBM intact;
5. skills reordered around Rust / Java / C / Linux / JVM / performance and tooling;
6. C++/engine experience described only to the extent the actual FEX work earns it.

The next useful editorial event is new evidence or an actual target role, not another generic opinion round.
