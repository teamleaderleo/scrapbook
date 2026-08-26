# Mainland game-tech V13 Chinese résumé seed

**Status:** review seed only; not canonical résumé wording.  
**Baseline:** English V13, 2026-08-26.  
**Primary target:** mainland game/runtime/performance/client/tooling roles.

This version deliberately leads with Preflight. The hypothesis is simple: for a technically serious game company, an 83-mod JVM game/runtime performance project is a clearer first signal than opening with a list of upstream repository names.

Contact/header fields are omitted here. Use the canonical résumé for identity and contact data.

## Suggested positioning line

**方向：游戏运行时 / 性能优化 / 客户端基础设施 / 研发效能 / 跨平台工具**

This line is optional and should disappear when a role-specific version has a clearer title.

---

# Leo Li

## 独立工程项目

### Preflight — 跨平台 JVM 性能启动器与 Mod 分析工具

`github.com/teamleaderleo/preflight` | 2026.07–至今

- 对包含 **83 个第三方 Mod** 的混淆 JVM 游戏运行时进行逆向分析与性能优化，通过 memoization、预计算产物与运行时字节码重写，将启动时间从 **112.17 秒降至 13.69 秒（8.19×）**。
- 将 5 套 loader cache 下重复的 JSON / CSV 读取与合并逻辑收敛到共享 memoized read layer；覆盖 **39,017 次 JSON 调用 / 8,378 条路径 / 约 99 万个值**，使 `SpecStore` 从 **19.8s 降至 9.8s**，merged-read overhead 从 **2.172s 降至 0.300s**。
- 将纹理缓存命中判断提前到曾阻塞启动约 **27 秒** 的单线程 prefetch queue 之前，并移除历史纹理上传中约 **1.22 GiB** 的无效显存 padding。
- 用 mutation-tracked index 替代 sector-wide O(n) entity scan，将 **227,805 次全量校验**与 **7,910 万次 entity-reference 检查**降为 0，并跳过 **1.179 亿次**无变化的 commodity recomputation。
- 重做可重建纹理中间产物的持久化与 pack 发布流程，将准备时间从 **200.77s 降至 16.21s**、存储从 **4.76 GB 降至约 1.1 GB**；在逻辑内容相同的情况下按真实启动访问顺序重新排列物理存储，使启动从 **33.53s 降至 14.174s**。
- 对 **228 次 Janino 动态编译请求**进行 memoization，并将 **36,332 个 generated-class occurrence 去重为 280 个唯一 class**，使 class map 从 **145.96 MiB 降至 1.13 MiB**，replay 从 **1.501s 降至 29ms**。
- 将 Java 性能核心产品化为 Windows / macOS / Linux 桌面应用：React UI + Rust/Tauri host，内置 Java runtime，并实现持久化启动/游玩记录、签名更新与 rollback。

## 开源工程

### Vercel AI SDK

**2026.08**

- 修复相同 URL 检查因 global / sticky 正则内部状态而在重复调用中产生不同结果的问题。
- 修复 Web Stream 源读取报错后的 reader 生命周期处理，使失败读取不会遗留 locked stream，并保留原始错误语义。
- 修复下载大小超限后 `reader.cancel()` 清理失败覆盖真正 `DownloadError` 的问题。

当前英文 résumé 对这一组工作做了压缩。使用更长版本时，需继续以 [`../records/open-source.md`](../records/open-source.md) 核对 direct merge、adopted repair、co-author credit 与 release 状态。

### Cloud Hypervisor

**2026.08 — 4 项 merged Rust/VMM fixes**

- 修复 VM 关闭生命周期竞态：测试在虚拟机与磁盘清理完成前复用资源；改为等待 VMM 的真实 `shutdown` 事件。
- 将 ACPI 表构建中的地址溢出、缺失 `fw_cfg`、guest-memory write 等失败转换为可传播的 VM 启动错误，而不是 VMM panic。
- 修复 VFIO sparse BAR 映射边界检查，拒绝跨越未映射区间的 DMA 请求。
- 修复 QCOW L2 metadata 所有权与失败顺序，避免仍被镜像引用的元数据在 reopen 后被错误视为空闲空间并再次分配。

### Vite

**2026.08**

- 修复 `buildEnd` 失败后插件清理生命周期被跳过的问题，并保留错误向 `closeBundle(error)` 的传播。
- 修复依赖分析过程中临时 Rolldown build 未关闭导致的资源泄漏。
- 另有一项关于重复 config resolution、optimizer state duplication 与 warm cache 的修复仍为 open；最终 résumé 使用前继续核对 upstream 状态。

### Cloudflare Workers SDK

**2026.08 — 2 项 merged**

- 修复 Miniflare 关闭流程，使辅助清理卡住或失败时仍能及时请求 `workerd` 退出，并继续完成剩余 teardown。
- 修复 Cloudflare Access service-token 缓存语义，避免环境变量中的凭据被删除或变得不完整后继续使用旧认证信息。

### React

**2026.08 — merged**

- 修复 Fragment event-listener identity，使省略 `capture` 与显式 `capture: false` 的监听器能够正确对应并移除。

## 工作经历

### IBM — Software Developer Intern

Toronto, Canada | 2021.05–2022.08

- 负责 IBM Cloud AI/ML 与数据工作流的 Java 端到端测试与重构，覆盖 Kafka、Spark、Snowflake、hybrid cloud 与 on-premises 环境；期间发现一项关键 **RBAC 权限缺陷**，推动三个团队联合 hotfix。
- 整理并替换过时的 SDK / runtime 配置流程，将开发者 onboarding 时间从约 **3 小时缩短至 15 分钟**。

## 教育背景

### University of Toronto / 多伦多大学

**BSc — Mathematics, Statistics & Computer Science**  
**数学、统计与计算机科学** | 2024.06

## 技术栈

**编程语言：** TypeScript、JavaScript、Rust、Java、Python、Go、SQL、C  
**技术与平台：** Linux、React、Vite、Next.js、Node.js、Cloudflare Workers、Convex、PostgreSQL、AWS、Docker、Git

---

## Review questions

This seed is intentionally arguable. Reviewers should answer concrete questions instead of merely polishing sentences:

- For miHoYo/Tencent/NetEase game-tech roles, should Preflight stay first?
- Does `研发效能` read naturally for the build/test/release/tooling lane, or does a more specific phrase fit the target company better?
- Which English terms should remain English in mainland engineering usage, and which currently look like lazy code-switching?
- Is the OSS section too name-heavy for a Chinese recruiter pass? If so, which mechanisms survive the cut?
- Should IBM move above OSS for conventional large-company applications while Preflight remains first for game-tech?
- Which Preflight numbers are instantly legible, and which should move into interview material?
- Does the résumé currently read as game/runtime/performance engineering, or does it accidentally drift back into broad full-stack?

Add an independent variant or a review file in this directory. Disagreement is useful; later comparison should decide what survives.
