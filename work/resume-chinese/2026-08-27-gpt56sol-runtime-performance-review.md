# GPT-5.6 Sol — mainland game/runtime positioning review

**Status:** independent review artifact; not canonical résumé wording.  
**Baseline:** English V13, 2026-08-26, plus current Preflight and open-source evidence.  
**Lens:** mainland game client / engine / performance / tooling / R&D-efficiency roles.

## First reaction: this is a different profile now

The July profile and the current one would lead a hiring reader to different conclusions.

The older Scrapbook résumé was a broad product/generalist page: Next.js contributions, Glossless, Scrapbook, a Go image-processing backend, Git Inline, and a VS Code extension. It already showed curiosity, product finish, performance work, and the ability to enter unfamiliar systems, but the center of gravity was web/product/AI tooling.

V13 has moved much deeper into **runtime behavior, performance, debugging, failure handling, persistent-state correctness, build/tooling systems, and serious upstream engineering**. Preflight is the biggest reason, but Cloud Hypervisor changes the read too: VM lifecycle, ACPI failure propagation, VFIO range semantics, and QCOW metadata ownership are difficult to dismiss as accidental breadth.

I would therefore stop positioning Leo as a broad full-stack engineer who also happens to do lower-level work. The stronger current reading is:

> **性能 / 运行时 / 工具链工程师，同时具备把技术成果做成完整产品的能力。**

The product breadth still matters. It now works as the second half of the story instead of the headline.

## Chinese positioning I would use

For a broad mainland game-tech résumé, my preferred top line is:

**求职方向：游戏客户端 / 引擎与工具链 / 性能优化 / 研发效能**

I prefer this to the seed's:

`游戏运行时 / 性能优化 / 客户端基础设施 / 研发效能 / 跨平台工具`

because the current line is a little too abstract and a little too translated. In particular:

- **客户端基础设施** is vague. Current game-company language is much more often 客户端开发、客户端性能、工具链、内容生产流水线、引擎、资源管线、稳定性、研发效能.
- **跨平台工具** is true but weaker than **跨平台工具链** when the target is development tooling, or simply letting Preflight's Windows/macOS/Linux work prove the cross-platform point.
- **游戏运行时** is technically accurate, but it is stronger inside a project description than as the only job-family label. For keyword matching, **客户端 / 引擎 / 性能优化 / 工具链** is more legible.
- **研发效能** should stay. It is normal mainland vocabulary and especially relevant to Tencent's game R&D organization and current AI/tooling roles.

For a miHoYo engine/tooling application I would narrow it to:

**游戏引擎 / 资源管线与工具链 / 跨平台性能与稳定性**

For a Tencent game-tech / R&D-efficiency application:

**游戏研发工具链 / 客户端性能 / 研发效能 / AI 辅助工程**

For a NetEase client/system application:

**游戏客户端 / 性能与稳定性 / 工具链 / 多平台兼容**

These are role-facing projections, not permanent identity labels.

## Preflight should lead for game companies

Yes. Strongly.

The English V13 opens with open-source work because that is a good first signal for US devtools/runtime hiring. For miHoYo, Tencent Games, NetEase, and similar teams, opening with Vercel AI SDK risks anchoring the reader on "TypeScript/web/AI tooling" before the page reaches the strongest game-adjacent engineering evidence.

Preflight immediately gives the reader:

- a real game runtime;
- 83 independently maintained third-party mods;
- obfuscated JVM bytecode and runtime instrumentation;
- startup and gameplay hot paths;
- data/resource loading, generated code, textures, storage layout, caching and invalidation;
- compatibility against code Preflight does not own;
- Windows/macOS/Linux productization;
- unusually clear before/after performance results.

That is a much more useful first impression for a game company.

I would also change the heading. The seed uses:

> **Preflight — 跨平台 JVM 性能启动器与 Mod 分析工具**

My preference is:

> **Preflight — 跨平台游戏运行时性能与兼容性工具**

or, if we want the product to sound more concrete:

> **Preflight — 跨平台游戏性能启动器与 Mod 分析工具**

`JVM` is important evidence, but it is an implementation/runtime detail. I would rather make the reader see **game + performance + compatibility** first and meet JVM/JFR/bytecode in the first bullet.

## A Preflight cut I like

This is not a final layout; it is the content hierarchy I would test.

### Preflight — 跨平台游戏运行时性能与兼容性工具

`github.com/teamleaderleo/preflight` | 2026.07–至今

- 分析一套包含 **83 个第三方 Mod**、混淆字节码与多套独立加载路径的 JVM 游戏栈，结合 **JFR、运行时插桩、字节码重写与预计算产物**移除启动关键路径上的重复工作，将启动时间从 **112.17 秒降至 13.69 秒（8.19×）**。
- 将 5 套数据加载缓存收敛到共享 JSON/CSV 解析与读取缓存层，吸收 **39,017 次 JSON 调用 / 8,378 条路径**上的重复 I/O 与解析，使核心数据加载阶段从 **19.8s 降至 9.8s**，合并读取耗时从 **2.172s 降至 0.300s**。
- 重做纹理准备与存储路径：把缓存命中判断移到曾阻塞启动约 **27 秒**的单线程预取队列之前，将准备时间从 **200.77s 降至 16.21s**、存储从 **4.76 GB 降至约 1.1 GB**；在逻辑内容不变时，按真实启动访问顺序重排物理存储，使启动从 **33.53s 降至 14.174s**。
- 以基于变更跟踪的索引替代全局 O(n) 实体扫描，消除 **227,805 次全量校验 / 7,910 万次引用检查**，并短路 **1.179 亿次**未变化的重复计算；另移除历史纹理上传中的约 **1.22 GiB** 无效显存 padding。
- 缓存 **228 次 Janino 动态编译请求**，再将 **36,332 个 generated-class occurrence** 去重为 **280 个唯一 class**，使生成类映射从 **145.96 MiB 降至 1.13 MiB**、replay 从 **1.501s 降至 29ms**。
- 将性能核心做成 Windows / macOS / Linux 桌面产品：React UI + Rust/Tauri host，内置 Java runtime，并实现 profile、启动/游玩记录、诊断、更新与回滚。

I like this better than a literal English translation because it makes the game-company signals visible: critical path, loading, resource/storage layout, runtime generated code, memory, cross-platform delivery.

A recruiter-facing one-page version can cut one or two of these bullets. The important part is that the cuts should preserve **different classes of engineering evidence**, not merely the largest numbers.

## What from English V13 translates well

### Cloud Hypervisor translates extremely well

For a game/runtime reader, this may be the best OSS row and I would put it first inside 开源工程.

The four merged fixes cover:

- exact shutdown/reuse lifecycle;
- VM boot error propagation instead of panic;
- VFIO sparse mapping boundaries;
- QCOW persistent metadata ownership and allocator reuse after failure/reopen.

That is excellent evidence for debugging complex stateful systems. It also complements Preflight instead of repeating it.

### Vite and Workers SDK translate well for tooling / 研发效能

Vite's temporary-build leak and cleanup/error propagation are clean developer-tooling stories. Workers SDK's teardown and stale credential-cache repairs show lifecycle and state correctness. I would use one or both when applying to build, content-pipeline, tooling, test-platform, or R&D-efficiency teams.

### IBM is more valuable in mainland screening than its page position suggests

IBM supplies conventional employment credibility, Java, enterprise systems, RBAC incident response, cross-team work, and a **3h → 15min** developer-efficiency result.

For a technical referral or hiring-manager version, I am happy with:

**Preflight → 开源工程 → IBM**

For a conventional HR/ATS-heavy application, I would seriously test:

**Preflight → IBM → 精选开源工程**

The point is not that IBM became more technically impressive. It answers a different hiring question: "Has this person worked inside a real organization and shipped under other people's constraints?"

### Vercel AI SDK should stay, but no longer lead the game version

The actual repairs are strong runtime/failure-handling work: stateful regex behavior, stream reader cleanup, and preserving the useful error when cleanup itself fails. Keep that mechanism. Compress the repository-status bookkeeping.

### React is the easiest current V13 row to cut for game-tech

It is a legitimate merged core-library contribution, but it pulls the reader back toward frontend identity while adding less new evidence than Cloud Hypervisor, Vite, Workers, or Preflight. Restore it for UI/editor/client-tool roles if it helps.

## Chinese terms I would change

| Current seed | My preference | Why |
| --- | --- | --- |
| 客户端基础设施 | 客户端性能 / 引擎与工具链 / 研发工具链 | More native to current game-role language and more specific |
| 跨平台工具 | 跨平台工具链, or prove platforms in the project | Less generic |
| 逆向分析 | 运行时分析 / 分析混淆 JVM 字节码; use 逆向 only when it adds signal | Avoids sounding like the project is about cracking a game rather than performance engineering |
| shared memoized read layer | 共享解析与读取缓存层 | Chinese first; mechanism stays clear |
| loader cache | 加载器缓存 / 数据加载缓存 | Easier first pass |
| mutation-tracked index | 基于变更跟踪的索引 | Natural and accurate |
| prefetch queue | 单线程预取队列 | Natural Chinese technical wording |
| merged-read overhead | 合并读取耗时 | Avoid résumé-internal jargon |
| rollback | 回滚 | No reason to leave this English |
| class map | 生成类映射 | Clearer than a bare English noun |

I would keep `JVM`, `JFR`, `Janino`, `Rust`, `Tauri`, `React`, `Vite`, `VFIO`, `QCOW`, `Mod`, `AI Agent`, `CI/CD` in English where they are established engineering names. Mainland technical readers do not benefit from forcing every proper technical term into Chinese.

One thing I cannot responsibly compare word-for-word: the verbatim old Chinese résumé is not preserved in the current Scrapbook lane, so I am not going to invent exact old phrasing and claim I remember it. I can compare the **old profile** concretely from the July résumé. Conceptually, any old headline built around 全栈、前端、AI 产品 or web breadth should now be retired. Terms like **性能优化、跨平台、工具链、客户端、工程化** still fit; the new seed's **研发效能** is better and more company-native than a generic "开发效率" label.

## Company-specific emphasis

### miHoYo

The current technical vocabulary around miHoYo's client/engine/tool roles lines up unusually well with parts of Preflight: **资源管线、工具链、跨平台、稳定性、性能优化、内容生产工具**, plus open-source/GitHub and AI-assisted engineering as bonuses.

I would emphasize:

1. Preflight resource loading, storage order, generated code, compatibility and cross-platform productization;
2. Cloud Hypervisor as proof that the low-level/failure-ordering side is real;
3. mathematics + CS education, because engine roles explicitly care about foundations;
4. the ability to learn a complex existing runtime quickly and prove behavior against it.

The honest gap is also obvious: many engine/client roles ask directly for **C++ and Unity/Unreal/self-engine experience**. Do not camouflage that with a giant language list. Let Preflight and OSS prove transferability. The best initial targets are likely toolchain, client performance/stability, testing/performance platform, resource/content pipeline, or unusually language-flexible engine/runtime teams before senior gameplay/rendering roles that assume years of shipped C++ engine work.

### Tencent Games

Tencent is where I would most confidently keep **研发效能** as a headline term. Tencent Games literally uses that vocabulary for game R&D technology spanning engines, base architecture, art/content tools, client performance testing/monitoring, automation and DevOps.

There are two plausible Tencent versions:

**Performance/tooling version:** Preflight → Cloud Hypervisor → Vite/Workers → IBM.

**AI-assisted R&D-efficiency version:** Preflight → one concise Stensibly/Fieldwork/agent-engineering row → Vite/Workers or Cloud Hypervisor → IBM.

Current Tencent roles also make the AI-agent work more career-relevant than it would have looked in the old résumé: they explicitly discuss agent integration into game production workflows, Bug analysis, automated testing, evaluation, and tooling. I would still keep the résumé grounded in shipped engineering evidence instead of turning it into an "AI native" slogan page.

### NetEase Games

NetEase client/system roles are a particularly clean conceptual match for the new profile: **核心客户端系统、深度性能优化、线上疑难问题、工具链/内容生产流水线、AI 辅助研发**.

I would emphasize:

- Preflight's profiling/debugging loop and loading/runtime wins;
- the gameplay-runtime indexing work, because it proves the project is not only a startup benchmark;
- Cloud Hypervisor failure handling and persistent-state work;
- cross-platform packaging and the fact that Preflight became a usable product.

Again, many social-hire roles explicitly ask for 1–3+ years of client work and C/C++. That is a screening gap, not a reason to write a weaker résumé. Apply where the role values complex-system problem solving and tooling/performance enough to consider adjacent experience; avoid wording that pretends the gap does not exist.

## Skills section: the current English version undersells the new story

The current generic technology list spends too much scarce signal on ordinary web framework names. For a game-tech Chinese variant I would test something closer to:

**编程语言：** Rust、Java、Python、TypeScript / JavaScript、Go、C、SQL  
**运行时与性能：** JVM、JFR、Java 字节码插桩/重写、性能分析、缓存与存储布局、并发与生命周期调试  
**平台与工具：** Linux、Tauri、React/Vite、Docker、Git、CI/CD

Only use the second line if the final one-page layout has room. The résumé itself already proves most of it.

Do **not** add C++/C#/Unity/Unreal to satisfy keyword matching unless the underlying experience changes. The absence is strategically important because it tells us which roles need a stronger portfolio/referral argument instead of a cosmetic résumé edit.

## Recommended section order

For a technically screened game-client/engine/tooling application:

1. **独立研发 / 核心项目 — Preflight**
2. **开源工程 — Cloud Hypervisor first, then role-specific Vite/Workers/AI SDK**
3. **工作经历 — IBM**
4. **教育背景**
5. **技术栈**

For a more conventional recruiter/ATS funnel, I would also test:

1. Preflight
2. IBM
3. selected OSS
4. education
5. skills

I would not copy the English V13 section order automatically.

## Bottom line

The old profile said, roughly: **I can build a lot of different software and learn unfamiliar systems.**

The current profile can say something stronger:

> **I enter complex existing systems, find the behavior that actually owns the problem, measure it, repair or optimize it under failure and compatibility constraints, and keep going until the result is usable as a product or acceptable upstream.**

For mainland game companies, Preflight is the bridge that makes that claim instantly legible. Cloud Hypervisor and the rest of the OSS record then prove that the method survives outside one game project.

That is the Chinese résumé I would build now.