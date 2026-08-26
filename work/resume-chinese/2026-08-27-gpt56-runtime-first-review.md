# Mainland game-tech Chinese résumé — runtime-first review

**Status:** independent review artifact; not canonical résumé wording.  
**Baseline:** English V13, 2026-08-26.  
**Lens:** mainland game client / runtime / performance / tooling hiring, with miHoYo, Tencent Games, NetEase and adjacent teams in mind.

## The profile has changed categories

The older Chinese résumé had to make a broad early-career profile legible: React/Next.js open-source attempts, AI/cloud projects, full-stack implementation, serverless cost/performance work, IBM internship experience, and a collection of promising but still-forming technical directions.

V13 no longer needs that framing.

The strongest current evidence clusters around a much more specific engineering identity:

- performance investigation against a game/runtime stack that is not owned by the project;
- JVM/runtime instrumentation, bytecode rewriting, caching, data layout, resource loading and high-frequency runtime work;
- debugging failures at lifecycle and ownership boundaries;
- VM/device/storage correctness in Rust;
- build/tooling lifecycle and cache behavior;
- repeated upstream acceptance in mature repositories;
- taking the performance work all the way into a cross-platform desktop product with packaging, update and rollback machinery.

That is a different candidate from the older "full-stack engineer with AI projects and open-source contributions" presentation.

My default mainland game-tech positioning would therefore be:

> **求职方向：游戏客户端基础技术 / 运行时与性能优化 / 调试与稳定性 / 工具链与研发效能**

For a specific application, replace the slash-list with the job title or the two most relevant axes. `客户端基础技术` reads more naturally to me than `客户端基础设施`: the latter sounds imported from English infrastructure language and can imply a platform scope the résumé does not need to claim.

I would not present Leo as an "引擎工程师" by default. The work is highly relevant to engine/client teams, but the résumé should not imply years of UE/Unity/C++ production experience that are not there.

## Preflight should lead for game companies

Yes. More strongly than in the current seed.

Preflight is the rare owned project here that gives a game-company reader an immediate answer to several questions at once: can this person profile a difficult runtime, locate work on the critical path, reason about data/resource behavior, make changes against third-party code, validate compatibility, and turn the result into something another player can actually run?

The headline is unusually legible:

> **83 个第三方 Mod 的游戏运行时，启动 112.17s → 13.69s（8.19×）**

That should be the first technical fact a miHoYo/Tencent/NetEase reader sees.

I would, however, compress the seed's seven Preflight bullets. The current seed preserves too much of the English evidence inventory. A Chinese game-tech résumé benefits from scan anchors and fewer, more differentiated receipts.

A useful five-bullet family would be:

- **整体性能：** 对混淆 JVM 游戏运行时和 83 个第三方 Mod 进行 JFR、字节码与运行时分析，通过结果缓存、预计算和运行时字节码重写，将启动 **112.17s → 13.69s（8.19×）**。
- **数据加载：** 将 5 套加载器中重复的 JSON/CSV 读取与合并收敛到共享缓存层，覆盖 **39,017 次 JSON 调用 / 8,378 条路径**，使 `SpecStore` **19.8s → 9.8s**、合并读取开销 **2.172s → 0.300s**。
- **资源与存储：** 将纹理缓存判断移到曾阻塞启动约 **27s** 的单线程预取队列之前，移除约 **1.22 GiB** 无效显存填充；随后重做可重建中间产物与 pack 发布，使准备 **200.77s → 16.21s**、存储 **4.76 GB → ~1.1 GB**。
- **运行时 / I/O：** 根据实际启动访问顺序重排相同逻辑纹理数据的物理布局，使启动 **33.53s → 14.174s**；或在客户端系统向岗位中改用 mutation-tracked index / 1.179 亿次重复计算这一条。两者不要同时塞进默认版。
- **产品与兼容性：** 将 Java 性能核心做成 Windows/macOS/Linux 桌面应用，使用 Rust/Tauri host、内置 Java runtime、签名更新与回滚；加速产物只在输入身份匹配时复用，不匹配时回退原始路径。

Janino 的 `228` 次编译、`36,332 → 280` 类去重和 `145.96 MiB → 1.13 MiB` 很强，但它更像一张可替换牌：对运行时/编译器方向保留；对一般客户端或性能岗，物理布局、资源加载、兼容性/回退往往更快被读懂。

## V13 哪些内容可以直接带进大陆招聘

### 很强，保留核心机制

**Preflight** 几乎全部能转，但要减少英文内部名词。中文读者不需要先理解 `memoization`、`read layer`、`generated-class occurrence`、`merged-read overhead` 才知道结果是什么。先写启动、加载、显存、存储、重复扫描/计算、动态编译，再补机制。

**Cloud Hypervisor** 对游戏技术岗比英文默认顺序里更值钱。四个 merged Rust/VMM 修复覆盖 VM 生命周期、ACPI 启动错误、VFIO 稀疏映射和 QCOW 元数据所有权/失败顺序。它证明的不是“会 Rust”，而是能进入陌生底层代码，在失败路径和持久化状态上找对 owner。

游戏向版本可以把 OSS 顺序改成：

1. Cloud Hypervisor
2. Vite
3. Vercel AI SDK
4. Cloudflare Workers SDK（有空间再放）

不需要复制英文版 `Vercel AI SDK → Cloud Hypervisor → Vite → Workers SDK → React` 的顺序。

**Vite** 很适合 `工具链 / 研发效能 / 客户端平台` 方向。建议写成“构建失败仍执行插件清理”“依赖分析临时构建及时释放”“服务重启避免误使已预热依赖缓存失效（open）”，而不是从 `buildEnd` / `closeBundle` / `resolveConfig` 名字开始。

**IBM** 仍然值得留。大陆 HR 看一眼可以确认有成熟组织里的开发、测试、安全修复和跨团队协作经验。Preflight-first 的游戏技术版里不必把 IBM 提到第一屏最上方，但也不要把它压成脚注。

### 需要重写，而不是直译

**Vercel AI SDK** 的英文句子非常好，但中文要更具体地说“错误被清理错误覆盖”“失败读取后 stream 仍被锁住”“相同 URL 重复检查结果不一致”。`reader 生命周期`、`caller-owned state` 之类适合面试，不适合第一眼。

**Cloud Hypervisor QCOW** 不要写成泛泛的“ownership semantics”。中文里直接说：新 L2 元数据在 L1 发布前先取得引用所有权，避免失败后 reopen 时仍被镜像引用的块被当成空闲空间再次分配。技术读者会立刻知道这不是普通 crash fix。

**技能栏** 必须为游戏版重排。V13 当前的 Technologies 最后会把读者重新拉回 Web：React、Vite、Next.js、Node.js、Cloudflare Workers、Convex……这些都是真的，但不是游戏-tech 版本最后应该留下的印象。

建议游戏向技能栏更像：

> **语言：** Rust、Java、C、Python、TypeScript/JavaScript、Go、SQL  
> **系统与工具：** Linux、JVM/JFR、字节码分析与插桩、Windows/macOS/Linux 跨平台开发、Git、Docker、CI/CD、React/Tauri

不要加入 C++、UE、Unity 来迎合 JD。那会把一份很强的非传统履历变成一份容易在技术面被拆穿的履历。

## 旧版中文里值得救回来的东西

旧版的职业定位基本可以退休，但它有一个排版/语言习惯我会保留：**短的中文扫描标签**。

旧版的 `性能优化：`、`安全修复：`、`自动化测试架构：`、`流程优化：` 让很密的中文 bullet 比纯长句更容易扫。新 seed 现在是一整排机制密度很高的 bullet，读起来更像技术记录。

我不会原样恢复 `核心修复：`、`技术深度：` 这种评价性标签；它们在替读者下判断。改成内容标签即可：

- `整体性能：`
- `数据加载：`
- `资源与显存：`
- `存储与 I/O：`
- `运行时：`
- `产品化：`
- `故障处理：`
- `构建工具链：`

术语上，当前 seed 的这些选择可以继续用：`性能优化`、`运行时`、`字节码重写`、`生命周期`、`故障处理`、`构建/测试/发布工具链`。

我会改几处：

- `客户端基础设施` → `客户端基础技术`，或目标 JD 明确使用“基础架构”时写 `客户端基础架构与工具链`；
- `memoization` → `结果缓存` / `记忆化`，正文优先结果缓存；
- `warm cache` → `已预热缓存`；
- `rollback` → `回滚`；
- `VRAM padding` → `无效显存填充`；
- `mutation-tracked index` → `基于变更跟踪的增量索引`；
- `reverse-engineering` 不必每次都写成宽泛的 `逆向分析`，Preflight 第一条可以具体写 `JFR、字节码与运行时分析`，既准确又更像性能工程。

`开源工程` 比旧版 `开源社区贡献` 更适合现在的 profile。旧版那个标题带一点“我参与了社区”的味道；当前材料已经是连续的工程结果。

## miHoYo

优先强调：

- Preflight 的游戏语境、跨平台、资源/加载、运行时分析、字节码、兼容性和产品化；
- 物理数据布局 `33.53s → 14.174s`，因为它很像资源管线/加载系统团队会在意的工程事实；
- mod 分析和兼容性 fallback，说明不是为了 benchmark 把生态打烂；
- 如果岗位偏游戏研发工具/AI Agent，再把 Stensibly/Cultist/现有 agent 工作作为单独变体加入，而不是污染核心 runtime 版。

米哈游当前岗位语言经常把 `资源管线 / 工具链 / 跨平台 / 稳定性 / 性能` 放在同一个引擎或客户端问题里；另一些研发工具岗位直接把 AI Agent、自动化测试、代码审查和工业化管线列为工作内容。这里其实有两条不同申请线：**runtime/client** 和 **研发工具/Agent**。不要做一份混合版试图同时命中两者。

## Tencent Games

腾讯当前的客户端平台/通用技术岗位语言与这份履历很接近：复杂问题定位、操作系统交互、文件系统/内存、性能优化、版本发布、工具链和工作流；性能专项岗位还会强调 CPU/GPU、内存/显存、Crash、性能监控体系。

因此腾讯版应把这些东西推到前面：

- Preflight：加载、资源、内存/显存、运行时、跨平台发布；
- Cloud Hypervisor：生命周期 + VFIO + QCOW；
- Vite/Workers：故障路径下的清理、进程退出、缓存状态；
- IBM：RBAC hotfix 和端到端测试。

最大的硬缺口不是措辞，是 **C++/UE 与 GPU/渲染经验**。纯 UE5 性能/渲染岗位会因此有明显门槛。更合理的优先级是 `客户端平台 / 通用技术 / 工具链 / 研发效能 / 稳定性与性能`，然后让 Preflight 争取技术负责人愿意跨语言看能力。

## NetEase

网易的客户端系统、性能和效能工具岗位现在很值得单独看。有些系统向岗位明确接受“游戏/非游戏复杂系统核心开发”，同时要求 CPU/GPU/内存/加载性能、疑难问题定位、工具链和 AI 辅助研发。这个语言几乎就是当前 profile 的桥。

网易版我会强调：

- Preflight 的 **加载 + 运行时 + 存储/I/O + 兼容性**；
- mutation-tracked index / 1.179 亿次重复计算这一条，比 Janino 更贴客户端系统；
- Vite 作为工具链；
- Cloud Hypervisor 证明底层故障与状态所有权推理；
- 如果投 `游戏效能工具 / AI方向`，再用 Stensibly/Cultist 替换一部分 OSS 名额。

同样，C++ 是很多客户端岗位的硬要求。不要在中文简历里绕开这件事；靠岗位选择和内推争取人工判断。

## 我会怎么排一版游戏-tech 中文简历

不是完整文案，只是我更偏好的信息顺序：

1. 姓名 / 联系方式 / **求职方向：游戏客户端基础技术 · 运行时与性能优化 · 工具链**
2. **独立工程 — Preflight**：4–5 条，约占全页 35–40%
3. **开源工程精选**：Cloud Hypervisor、Vite、Vercel AI SDK；每个 repo 一条结果密集句
4. **工作经历 — IBM**：2 条
5. **教育背景**
6. **技术能力**：重新按 systems/game-tech 读法排序

React 在游戏-tech 版里没有足够的边际价值。Cloudflare Workers SDK 也可以根据版面牺牲。一个读者记住 `Preflight + Cloud Hypervisor + Vite + IBM`，已经得到非常完整的图像。

## 还需要单独做第二条中文线

我不会让一份简历同时承担所有大陆游戏岗位。

除了上面的 runtime/client 版，我会留一个 **游戏研发效能 / AI Agent / 工具链** 变体。当前 miHoYo/NetEase/Tencent 的岗位语言已经把 Agent、AI coding、自动化测试、代码审查、研发流程工具化写进正式职责。那条线里，Stensibly/Cultist 可能重新变得比 React/Cloudflare 更有边际价值。

这不是回到旧版的“AI 项目候选人”。区别在于现在可以把 Agent 经验放在一个已经由 Preflight、OSS 和系统工作证明过工程判断的底座上。

## 一个需要在 Thunderdome 前核对的状态点

当前文件之间对 React `#37251` 的 disposition 有冲突：V13 / 当前 seed 写成 merged，而 `resume-candidates.md` 的 disposition note 仍写 open。React 本来就不是游戏-tech 版的优先项，我会先从这个变体删掉；如果以后要用于通用软件版，再按 live upstream 状态统一记录。

## Bottom line

旧版需要证明“这个人不只是做网页/AI demo”。

现在已经不需要证明那件事了。

大陆游戏-tech 版本应该让读者在十几秒内得到一个更窄、更强的印象：**这个人会进入陌生运行时和大型代码库，找到真正的性能/故障 owner，用测量和实验把问题压下去，并把结果做成能持续运行的工具。**

这才是 V13 相比旧中文履历最值得保住的变化。
