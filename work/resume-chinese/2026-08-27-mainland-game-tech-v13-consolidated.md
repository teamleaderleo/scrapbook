# Leo Li

+1 778-779-2889 | cheerleaderleo@outlook.com | linkedin.com/in/leoooli | github.com/teamleaderleo | teamleaderleo.com

**求职方向：性能优化 / 游戏运行时与客户端基础技术 / 跨平台工具链**

## 核心项目

### Preflight — 游戏运行时性能优化与跨平台启动工具（个人开源项目）

`github.com/teamleaderleo/preflight` | 2026.07–至今

- **整体性能：** 分析经过混淆的 JVM 游戏运行时及 **83 个第三方 Mod** 的启动、资源加载与运行时链路，结合 JFR、运行时插桩、结果缓存、预计算与字节码改写，将启动时间从 **112.17s 降至 13.69s（8.19×）**。
- **数据加载：** 将 5 套加载器中重复的 JSON/CSV 读取与合并收敛到共享解析与读取缓存层，覆盖 **39,017 次 JSON 调用 / 8,378 条路径**，使 `SpecStore` 从 **19.8s 降至 9.8s**、合并读取耗时从 **2.172s 降至 0.300s**。
- **资源与存储：** 将纹理缓存命中判断移到曾阻塞启动约 **27s** 的单线程预取队列之前，并移除历史纹理上传中的约 **1.22 GiB 无效显存填充**；重做可重建中间产物的持久化与单包写入路径，将准备时间从 **200.77s 降至 16.21s**、稳态存储从 **4.76 GB 降至约 1.1 GB**。
- **存储与 I/O：** 在逻辑纹理内容不变的情况下，按真实启动访问顺序重排物理存储，使同一纹理集的启动时间从 **33.53s 降至 14.174s**；另以基于变更跟踪的增量索引替代高频全局 O(n) 扫描，消除 **7,910 万次实体引用检查**并短路 **1.179 亿次**未变化的重复计算。
- **运行时：** 缓存 **228 次 Janino 动态编译请求**，再将 **36,332 个生成类条目收敛为 280 个唯一类**，使生成类映射从 **145.96 MiB 降至 1.13 MiB**、重放从 **1.501s 降至 29ms**。
- **产品化：** 将 Java 性能核心做成 Windows / macOS / Linux 桌面应用，采用 React UI + Rust/Tauri host，内置 Java 运行时，并实现启动/游玩记录、诊断、签名更新与回滚。

## 开源工程

### Cloud Hypervisor — Rust / VMM / 虚拟化与存储

**2026.08 — 4 项 merged**

- **生命周期与故障处理：** 修复 VM 关闭竞态，改为等待 VMM 的真实 `shutdown` 事件后再复用 VM/磁盘；将 ACPI 表构建中的地址溢出、缺失 `fw_cfg`、guest-memory write 等失败转换为可传播的 VM 启动错误，避免 VMM panic。
- **设备与存储正确性：** 修复 VFIO sparse BAR 映射边界检查，拒绝跨越未映射区间的 DMA 请求；修复 QCOW L2 元数据所有权与失败顺序，避免仍被镜像引用的元数据在 reopen 后被误判为空闲空间并再次分配。

### Vercel AI SDK — TypeScript / Web Runtime

**2026.08 — 1 项直接 merged，2 项修复方案被上游采用**

- **运行时正确性：** 修复 global / sticky 正则导致相同 URL 重复检查返回不同结果的问题；修复 Web Stream 读取失败后的 reader 清理，使失败读取不会遗留 locked stream；并确保下载超限错误不会被后续 `reader.cancel()` 清理失败覆盖。

### Vite / Cloudflare Workers SDK — 构建工具链与运行时生命周期

**2026.08 — 4 项 merged；另有 1 项 Vite 修复 open**

- **构建与清理：** 修复 Vite 构建失败后跳过插件清理、依赖分析中的临时 Rolldown build 未释放，以及重复配置解析导致已预热依赖缓存被误重建的问题（最后一项 open）。
- **进程与状态：** 修复 Miniflare 辅助清理卡住或失败时 `workerd` 退出被延迟的问题，并避免 Cloudflare Access 凭据被删除或变得不完整后继续使用陈旧认证信息。

## 实习经历

### IBM — Software Developer Intern

Toronto, Canada | 2021.05–2022.08

- **故障处理：** 参与 IBM Cloud AI/ML 与数据工作流的 Java 端到端测试与重构，覆盖 Kafka、Spark、Snowflake、混合云与本地部署环境；发现关键 **RBAC 权限缺陷**并推动三个团队协同完成紧急修复。
- **开发效率：** 整理并替换过时的 SDK / runtime 配置流程，将开发环境搭建时间从约 **3 小时缩短至 15 分钟**。

## 教育背景

### 多伦多大学（University of Toronto）

**理学学士｜数学、统计学与计算机科学** | 2024.06

## 技能

**编程语言：** Rust、Java、C、Python、TypeScript / JavaScript、Go、SQL  
**运行时与性能：** Linux、JVM / JFR、Java 字节码插桩与改写、性能分析、缓存与存储布局、生命周期与故障调试  
**平台与工具：** Windows / macOS / Linux 跨平台开发、Tauri、React / Vite、Docker、Git、CI/CD
