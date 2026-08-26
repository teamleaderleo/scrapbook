# Preflight automation — résumé evidence addendum

**Status:** Thunderdome input / candidate evidence; not canonical résumé wording.  
**Date:** 2026-08-27.  
**Purpose:** make the newer end-to-end game-automation work visible to résumé reviewers before the next Chinese/English cut. This should compete with existing Preflight bullets; it does not automatically earn another line on the page.

## Why this changes the read

Preflight is no longer only a performance launcher with a desktop product around it.

It has also grown a deterministic test/control surface around a third-party game that does not provide the interface Preflight needs. The project instruments the opaque JVM runtime to publish semantic state, binds automation to the exact game-process lifetime, drives a reviewed set of desktop actions, and seals the resulting screenshots/logs/runtime reports as evidence.

The useful résumé claim is **not** "I wrote a script that clicks through a game." The stronger claim is:

> **I instrumented an opaque third-party runtime until it exposed enough trustworthy semantic state to support deterministic end-to-end automation, then used that automation to probe the performance and compatibility work itself.**

That is unusually legible for game client, runtime, test-platform, tooling, and 研发效能 teams.

The MCP analogy is useful conversational shorthand: Preflight effectively created a narrow attach/observe/act interface for a program that did not expose one. Do **not** call it MCP on the résumé. It is a Preflight-specific protocol and automation boundary, not an MCP implementation.

## What the repository already proves

### Semantic state instead of pixel guessing

The injected game JVM publishes process-bound runtime state such as startup/main-menu readiness, campaign readiness, combat readiness, and stopped state. Unknown game class bytes leave the game untouched and semantic automation unavailable instead of guessing.

Source:

- [desktop smoke automation contract](https://github.com/teamleaderleo/preflight/blob/main/docs/desktop-smoke-automation.md)
- [semantic-state implementation history](https://github.com/teamleaderleo/preflight/commit/9566e4fb0a50d45a05dd7c565a18d8bfe4d86622)

### Exact process attachment

Automation does not attach by application/display name. It uses the runtime record's PID plus process start instant and revalidates that lifetime before attachment/input. This was earned by a real macOS failure mode: the visible game window belongs to a Java process while Launch Services can separately know about the dormant `Starsector.app`; display-name attachment could activate the wrong thing or create a second instance.

Sources:

- [runtime identity + current automation contract](https://github.com/teamleaderleo/preflight/blob/main/docs/desktop-smoke-automation.md)
- [safe runtime identity commit](https://github.com/teamleaderleo/preflight/commit/6751db70879bfcda06697e93c7fc259fd3364893)
- [PID-addressed macOS driver](https://github.com/teamleaderleo/preflight/commit/959fb7b0a2c7f653c4a2946b9b310badd22ed917)

### Restricted control protocol

The packaged macOS path creates a short-lived loopback bridge with a per-process capability and a closed operation set. It permits the reviewed actions needed for the scenario; it does not expose arbitrary AppleScript, arbitrary coordinates, arbitrary keys, hosts, or output paths. The hidden Java desktop bridge also exposes versioned machine-readable scenario/process/evidence/smoke/benchmark commands rather than making the desktop parse human CLI output.

Sources:

- [desktop smoke automation contract](https://github.com/teamleaderleo/preflight/blob/main/docs/desktop-smoke-automation.md)
- [`DesktopBridgeCommand`](https://github.com/teamleaderleo/preflight/blob/main/preflight-cli/src/main/java/dev/starsector/preflight/cli/DesktopBridgeCommand.java)

### End-to-end scenario

The checked-in `campaign-roam` scenario expresses the behavior semantically:

1. launch the selected game/profile condition;
2. wait for the interactive main menu;
3. activate Continue;
4. wait for campaign readiness;
5. hold movement input for three seconds;
6. capture screenshot, log tail, adapter health, and frame report;
7. quit.

The scenario contains no PID, application title, accessibility index, OCR phrase, or absolute screen coordinate. Platform drivers resolve those implementation details against the process they actually launched.

Sources:

- [`campaign-roam.json`](https://github.com/teamleaderleo/preflight/blob/main/scripts/scenarios/campaign-roam.json)
- [platform-neutral scenario commit](https://github.com/teamleaderleo/preflight/commit/a3279839a112aa8893e294db866010d2cb942db6)
- [unattended launch ownership](https://github.com/teamleaderleo/preflight/commit/d5e487e10575d61adb2490124542643bf294513c)

### Evidence and failure handling

Drivers do not get to declare arbitrary success evidence. The engine validates scenario order, timestamps, terminal status, artifact containment, byte limits, stable file identity, and hashes before publishing the accepted evidence document. A failed action stops the sequence; capability/permission loss becomes skipped instead of a false game regression; cancellation and shutdown are tied back to the exact process lifetime.

Sources:

- [evidence contract and collector](https://github.com/teamleaderleo/preflight/blob/main/docs/desktop-smoke-automation.md)
- [seal smoke evidence in engine](https://github.com/teamleaderleo/preflight/commit/eec4e1a91ee90169aae6bcdecd2f76d8dbe2669a)
- [deadline-bound runner](https://github.com/teamleaderleo/preflight/commit/c250011dfbb57c598569752232d78500e593a341)
- [fail-closed cancellation](https://github.com/teamleaderleo/preflight/commit/f7a34d1ba871f88d1023589498c62b39c08224e4)

### Cross-platform implementation

Windows has an exact-PID window adapter using PowerShell/User32; Linux has an exact-PID X11 adapter using `xdotool`/ImageMagick, with unavailable states for unsupported/missing environments. The desktop application can invoke checked smoke tests through the product path.

Sources:

- [Windows/Linux smoke drivers](https://github.com/teamleaderleo/preflight/commit/4228fd7459e89fd63766e0b234fa192e931cb485)
- [run checked smoke tests from the app](https://github.com/teamleaderleo/preflight/commit/7a1384e4f44427a28e1871e52b8bc25d9f14adc1)

## Live maintainer update: repository prose is behind the current exercise

The maintainer's 2026-08-27 update is stronger than the older status paragraph currently retained in `docs/desktop-smoke-automation.md`: the deterministic end-to-end path is **actively running repeatedly against the real game now** and is being used as the investigation loop for current Preflight work.

Treat that as current editorial input, but keep the evidence boundary clean:

- reviewers may reason from the fact that the automation is now being used repeatedly;
- before promoting a platform-specific "live validated" claim into a public résumé, refresh the newest run receipts/PR/evidence note and link it here;
- do not preserve a stale "one live action still required" sentence merely because an older doc still contains it if newer operator evidence has superseded it;
- do not claim live Windows/Linux game validation unless the corresponding native evidence actually exists.

This distinction is temporary bookkeeping, not doubt about the implemented capability. The capability is already on `main`; the moving question is the freshest live-acceptance scope.

## Career signal

This one body of work touches several things the current résumé otherwise has to prove separately:

- instrumentation and bytecode/runtime analysis of code Preflight does not own;
- process identity and lifecycle reasoning;
- deterministic state observation rather than timing/pixel heuristics;
- cross-platform native automation;
- restricted capability design rather than arbitrary remote control;
- failure, cancellation, and cleanup semantics;
- machine-readable evidence and artifact sealing;
- using the resulting harness to repeatedly test real performance/compatibility changes.

For game-company readers, that is especially strong because it looks like an independently discovered version of problems that appear in client test platforms, engine/tooling teams, gameplay automation, performance labs, and build/release acceptance.

## Candidate English bullets

### Systems/runtime version

> **Automation / runtime instrumentation:** Built a deterministic end-to-end test interface for an opaque third-party game runtime by injecting process-bound semantic state and using exact PID/start-time attachment; automated launch → main menu → save load → campaign movement → evidence capture → verified shutdown without relying on OCR or UI timing guesses.

### Tooling/test-platform version

> **Game automation:** Turned an otherwise non-automatable game into a repeatable test target with semantic runtime telemetry, restricted platform drivers, exact-process input, and sealed screenshot/log/frame evidence; used the loop to exercise performance and compatibility changes end to end.

### Short version

> Instrumented an opaque game runtime to support deterministic end-to-end gameplay tests, combining semantic state, exact-process automation, and sealed runtime/visual evidence.

I prefer the tooling/test-platform version for a normal résumé. The first version is excellent interview material but probably too mechanism-dense for one page.

## Candidate Chinese bullets

### Game client / tooling

> **自动化测试：** 针对没有公开自动化接口的第三方游戏运行时，注入进程绑定的语义状态，并结合 PID/启动时间身份校验与受限桌面驱动，实现启动 → 主菜单 → 读档 → 战役移动 → 截图/日志/帧数据采集 → 退出的确定性端到端测试；用该回路反复验证性能与兼容性改动。

### Shorter Chinese version

> **运行时自动化：** 为不提供测试接口的游戏运行时构建语义化自动测试层，以精确进程身份驱动真实游戏流程并采集可校验的运行时与视觉证据，用于持续验证性能和兼容性改动。

The shorter version is probably easier to keep beside the existing performance bullets.

## What it should displace

Do not add a seventh Preflight bullet merely because this is good.

For a **Tencent/miHoYo/NetEase tooling, test-platform, client-base-tech, or 研发效能** application, this should compete very seriously with the current Janino bullet or one of the dense middle performance receipts. The 112.17s → 13.69s headline stays. Resource/storage and physical-order evidence also stay strong. The automation bullet adds a different dimension instead of another timing number.

For a **pure performance/runtime/compiler** role, Janino may remain more directly relevant. In that version, fold automation into `产品化` or keep it for the interview story.

For a **general software** résumé, the automation line may be more memorable than one additional cache micro-result because it compresses reverse engineering, runtime instrumentation, OS process control, test design, and evidence handling into one story.

## Questions for the next Thunderdome

Reviewers should challenge these concrete choices instead of merely saying "cool":

- Does the automation bullet earn one of the scarce Preflight slots on a one-page mainland game résumé?
- Which existing Preflight bullet loses if it wins?
- Is `运行时自动化` / `自动化测试` the cleanest Chinese label, or does a target team use a better term?
- Does `opaque third-party game runtime` help, or is the game context already obvious enough that it wastes words?
- Should the bullet emphasize **semantic instrumentation**, **deterministic gameplay**, or **evidence/reproducibility** first?
- Once the current repeated live runs produce a durable receipt, is there a concise numerical/use-frequency fact worth adding, or would that turn a strong mechanism into another wall of counters?

The default bias should be subtraction: this is valuable because it is different from the existing performance evidence, not because Preflight needs to occupy more of the page.
