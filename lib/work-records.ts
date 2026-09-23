export type WorkEvidence = {
  label: string;
  href: string;
  kind: 'repository' | 'pull-request' | 'record';
};

export type WorkRecord = {
  id: string;
  title: string;
  kind: string;
  status: string;
  summary: string;
  accomplishments: readonly string[];
  reversal?: string;
  evidence: readonly WorkEvidence[];
};

export const workRecords: readonly WorkRecord[] = [
  {
    id: 'preflight',
    title: 'Preflight',
    kind: 'Performance launcher and companion app',
    status: 'Release candidate · 112.17s → 13.69s development arc',
    summary:
      'A cross-platform performance launcher and mod-analysis toolkit for heavily modded Starsector. The work combines reverse-engineering an obfuscated JVM runtime, moving deterministic work to reusable boundaries, exact fallback when those proofs stop holding, and a desktop product around the same Java engine.',
    accomplishments: [
      'The 83-mod development arc moved from a recent ordinary 112.17-second launch to 13.69 seconds. Five loader-specific data caches exposed a lower shared boundary, where repeated JSON/CSV work moved into one memoized read layer and typed-tree representation.',
      'The storage/runtime work spans a ~27-second serialized texture-prefetch bottleneck, 1.22 GiB of removed VRAM padding, texture preparation from 200.77s to 16.21s with storage from 4.76 GB to ~1.1 GB, and the same texture corpus launching 33.53s alphabetically versus 14.174s in observed access order.',
      'Generated-code work memoized 228 Janino compilation requests and then collapsed 36,332 generated-class occurrences to 280 unique classes. Campaign work replaced sector-wide scans with mutation-tracked indexes and short-circuited 117.9M unchanged commodity recomputations.',
      'The same engine now powers a Windows/macOS/Linux desktop app with React over a Rust/Tauri host, a bundled Java runtime, durable launch/playtime history, storage and recovery tooling, diagnostics, and signed updates with rollback.',
    ],
    reversal:
      'A valid prepared-texture cache barely moved launch time until measurement found it sitting behind a roughly 27-second prefetch wait. Moving the intervention to the actual critical-path boundary turned the same prepared work into a major improvement.',
    evidence: [
      {
        label: 'Site deep dive',
        href: '/work/preflight',
        kind: 'record',
      },
      {
        label: 'Repository',
        href: 'https://github.com/teamleaderleo/preflight',
        kind: 'repository',
      },
      {
        label: 'Engineering overview',
        href: 'https://github.com/teamleaderleo/preflight/blob/main/docs/engineering-overview.md',
        kind: 'record',
      },
      {
        label: 'Current performance record',
        href: 'https://github.com/teamleaderleo/scrapbook/blob/main/work/records/preflight-live-performance.md',
        kind: 'record',
      },
      {
        label: 'Historical 83-mod A/B campaign',
        href: 'https://github.com/teamleaderleo/preflight/pull/440',
        kind: 'pull-request',
      },
    ],
  },
  {
    id: 'cmux',
    title: 'CMUX',
    kind: 'Build systems and developer productivity',
    status: '437 merged PRs indexed · Sep 13–23, 2026',
    summary:
      'A concentrated systems campaign across Swift/Xcode compilation, cache identity and lifecycle, reusable test products, artifact transport, macOS runner scheduling, CI observability, and release-workflow economics. The recurring goal is a shorter, more truthful feedback loop rather than a smaller CI bill in isolation.',
    accomplishments: [
      'The compilation-cache thread moved from 37.5 GB of rapidly churning PR-scoped cache entries and cold macOS builds to shared main-owned seeds, then repaired runner-path identity drift and a seed-growth loop that crossed the 5 GiB save bound; the clean seed is about 3.5 GiB, roughly 1.5 GiB less for every PR to restore.',
      'Local and CI feedback loops moved materially: same-commit tagged builds measured 953 s with fresh DerivedData versus 35.7 s on the shared warm tree; Linux guard critical path measured 385.5 s to 124.3 s while intentionally spending about 1.06 extra cheap Linux runner-minutes; focused E2E queue p90 measured 83.3 min on macOS 15 versus 1.0 min on macOS 26.',
      'Capacity work measured and rerouted demand instead of treating runner scarcity as a provider problem: about 5,900 paid macOS overflow minutes/day moved to sponsored capacity in one sampled window, superseded-PR admission replay estimated about 590 macOS minutes/day avoidable, and a router trigger was reduced from roughly 6,864 invocations/day to about 1,253.',
      'A GitHub Actions 90-day usage export records 1,966,401 self-hosted macOS runner-minutes, averaging 21,848.9 min/day. Valuing every minute at only WarpBuild’s cheapest macOS rate gives a $52,437 per 30-day month / $638k annualized replacement-cost floor; attributed savings and actual provider billing remain separate.',
      'Reliability work made red CI more truthful: one incomplete-xcresult path had suppressed 148 already-recorded test failures, while a 1,060-test Swift package suite took over 12 minutes with about 161 issues in parallel but completed in 65 seconds with 17 real failures when run serially.',
    ],
    reversal:
      'A tempting janitor class could reclaim 1,316 macOS runner-minutes behind already-decided Linux-guard failures. It was dropped because every reclaimable minute was an in-flight compile that cross-run reuse could make valuable to another run; the shipped cancellation rule stays narrower.',
    evidence: [
      {
        label: 'CMUX synthesis',
        href: 'https://github.com/teamleaderleo/scrapbook/blob/main/work/records/cmux.md',
        kind: 'record',
      },
      {
        label: 'Measured impact ledger',
        href: '/work/impact',
        kind: 'record',
      },
      {
        label: 'Economics model',
        href: 'https://github.com/teamleaderleo/scrapbook/blob/main/work/records/cmux-economics.md',
        kind: 'record',
      },
      {
        label: 'CMUX repository',
        href: 'https://redirect.github.com/manaflow-ai/cmux',
        kind: 'repository',
      },
      {
        label: 'Compilation-cache runner identity',
        href: 'https://redirect.github.com/manaflow-ai/cmux/pull/13754',
        kind: 'pull-request',
      },
      {
        label: 'CI health observability',
        href: 'https://redirect.github.com/manaflow-ai/cmux/pull/13810',
        kind: 'pull-request',
      },
    ],
  },
  {
    id: 'open-source',
    title: 'Open-source repairs',
    kind: 'Upstream engineering',
    status: 'Selected merged and reviewed work',
    summary:
      'Repairs in unfamiliar systems, selected for the failure or ownership boundary they clarify rather than repository-name accumulation.',
    accomplishments: [
      'Vercel AI SDK fixes cover deterministic URL matching, Web Stream reader release after source errors, and preserving useful download-size failures instead of replacing them with cancellation errors.',
      'Cloud Hypervisor now includes four merged repairs across VM shutdown lifecycle, ACPI boot-error propagation, sparse VFIO DMA validation, and QCOW metadata ownership so referenced L2 tables cannot become reusable free space.',
      'Vite has merged build-cleanup and temporary-bundle lifecycle fixes plus an open repeated-config-resolution idempotence repair; Cloudflare Workers SDK has merged fixes across Miniflare teardown and stale Access credential caching.',
      'A React Fragment listener repair remains open with positive review, covering listener ownership during child traversal and DOM capture-option identity.',
    ],
    reversal:
      'A real runc off-by-one was patched on the allocation side. Repository history showed the cleaner repair belonged in MaxCPU semantics instead, so the competing patch was closed rather than defended for its merge statistic.',
    evidence: [
      {
        label: 'AI SDK · deterministic URL matching',
        href: 'https://redirect.github.com/vercel/ai/pull/18570',
        kind: 'pull-request',
      },
      {
        label: 'Cloud Hypervisor · QCOW ownership',
        href: 'https://redirect.github.com/cloud-hypervisor/cloud-hypervisor/pull/8721',
        kind: 'pull-request',
      },
      {
        label: 'Cloud Hypervisor · sparse BAR mapping',
        href: 'https://redirect.github.com/cloud-hypervisor/cloud-hypervisor/pull/8734',
        kind: 'pull-request',
      },
      {
        label: 'Vite · optimizer bundle lifecycle',
        href: 'https://redirect.github.com/vitejs/vite/pull/23207',
        kind: 'pull-request',
      },
      {
        label: 'Cloudflare · Access credential freshness',
        href: 'https://redirect.github.com/cloudflare/workers-sdk/pull/15080',
        kind: 'pull-request',
      },
      {
        label: 'React · Fragment listener identity',
        href: 'https://redirect.github.com/react/react/pull/37251',
        kind: 'pull-request',
      },
      {
        label: 'Full Scrapbook record',
        href: 'https://github.com/teamleaderleo/scrapbook/blob/main/work/records/open-source.md',
        kind: 'record',
      },
    ],
  },
  {
    id: 'agent-systems',
    title: 'Agent systems',
    kind: 'Durable work across replaceable workers',
    status: 'Current cross-project thread · Aug 2026',
    summary:
      'A family of experiments built around one increasingly stubborn rule: the current model, chat, process, browser, or VM can disappear; the facts required to continue should not disappear with it. Durable external state owns work and evidence, consequential effects require current authority, and recovery starts by reconciling fresh observations instead of trusting a remembered story.',
    accomplishments: [
      'Stensibly keeps task state, handoffs, authority grants, leases, and effect receipts outside disposable agent sessions; Glaeda applies the same separation to Linux execution, where isolated workers and hot project state can be replaced without becoming the durable execution truth.',
      'Cultist treats repository context as evidence with provenance, counterexamples, partial coverage, and explicit UNKNOWN; Elatura keeps the genuine authenticated application authoritative while browser projections and working sets can be discarded and reacquired.',
      'Alàlana keeps provider bridges deterministic and model-free at the effect boundary: a model may inspect and author an explicit request while allowlists, idempotency, provider calls, and receipts stay in ordinary code.',
      'Fieldwork and Linux Fieldwork carry the method into unfamiliar external systems: exact source identity, reproducible probes, negative controls, limits, and durable decisions survive the chat, while mature upstream fixes in AI SDK, Cloud Hypervisor, Vite, and Workers SDK test the same ownership/lifecycle instincts outside owned projects.',
    ],
    reversal:
      'The agent stopped being the durable object. Continuity got easier once fresh sessions were allowed to be fresh and repositories, ledgers, provider state, and explicit receipts were made responsible for remembering what actually matters.',
    evidence: [
      {
        label: 'Current synthesis',
        href: 'https://github.com/teamleaderleo/scrapbook/blob/main/work/agent-systems-snapshot-2026-08-27.md',
        kind: 'record',
      },
      {
        label: 'Stensibly',
        href: 'https://github.com/teamleaderleo/stensibly',
        kind: 'repository',
      },
      {
        label: 'Glaeda',
        href: 'https://github.com/teamleaderleo/glaeda',
        kind: 'repository',
      },
      {
        label: 'Cultist',
        href: 'https://github.com/teamleaderleo/cultist',
        kind: 'repository',
      },
      {
        label: 'Elatura',
        href: 'https://github.com/teamleaderleo/elatura',
        kind: 'repository',
      },
      {
        label: 'Alàlana',
        href: 'https://github.com/teamleaderleo/alalana',
        kind: 'repository',
      },
    ],
  },
  {
    id: 'stensibly',
    title: 'Stensibly',
    kind: 'Durable human-agent coordination',
    status: 'Live hosted system · ongoing dogfood',
    summary:
      'Work should survive the worker doing it. Stensibly keeps tasks, evidence, next actions, blockers, handoffs, authority, and effect receipts in server-owned state so a fresh human or agent can continue without reconstructing the project from one vanished chat or process.',
    accomplishments: [
      'The hosted Convex/Cloudflare system gives browser, REST, and MCP clients one durable project state with claims, runs, dependencies, reservations, artifacts, scoped tokens, idempotent writes, and guarded exact-CAS GitHub changes.',
      'A worker can leave a summary, evidence, and an explicit next action, disappear, and hand the responsibility to a fresh session while current server-owned claims and leases decide who may still act.',
      'Production dogfood now turns material GitHub repository attention into durable mail continuation for Quarry. Signed webhooks and a bounded public GitHub Events fallback feed the same thread and Gmail publisher path, with continuation state surviving Worker replacement.',
    ],
    reversal:
      'Assignment is not authority. A card can say who owns the work while a current server-owned grant decides whether that actor may still claim, complete, or cause a consequential external effect.',
    evidence: [
      {
        label: 'Repository',
        href: 'https://github.com/teamleaderleo/stensibly',
        kind: 'repository',
      },
      {
        label: 'Product model',
        href: 'https://github.com/teamleaderleo/stensibly/blob/main/docs/product-model.md',
        kind: 'record',
      },
      {
        label: 'Current cross-repository state',
        href: 'https://github.com/teamleaderleo/scrapbook/blob/main/work/current-state.md#stensibly--live-coordination-plus-repository-to-mail-continuation',
        kind: 'record',
      },
    ],
  },
  {
    // Keep this public v1 id stable: it also keys local interview-rehearsal drafts.
    id: 'smolrunner',
    title: 'Glaeda',
    kind: 'Hot Linux execution for coding agents',
    status: 'Pre-alpha · live Apple-silicon acceptance',
    summary:
      'Fresh Linux when the work is untrusted; hot project state when it is trusted. Glaeda runs coding agents and GitHub Actions on Apple-silicon Macs, keeping repositories, dependencies, compiler state, indexes, and services warm only where the trust and validity rules permit it.',
    accomplishments: [
      'The strict lane gives unknown work a prepared Lima/VZ worker, one bounded job, durable assignment/no-replay handling, official GitHub Runner Scale Set integration, exact teardown, and evidence that the worker is gone.',
      'Trusted projects can keep the expensive substrate hot: persistent project disks, crash-safe leases, OverlayFS task views, immutable Git object-pool generations, and copy-on-write task materialization are already landed as M6 primitives.',
      'The north-star metric is agent wall-clock latency: queue-to-first-useful-command, edit-to-first-test-result, final relevant verification, throughput under concurrent agents, and the CPU/RAM/disk cost of keeping useful state resident.',
    ],
    reversal:
      'The original instinct was to make every worker disposable. Glaeda treats disposal as one capability instead: unknown work gets a fresh worker, while trusted projects can keep expensive Linux state hot without making that surviving state the source of execution truth.',
    evidence: [
      {
        label: 'Repository',
        href: 'https://github.com/teamleaderleo/glaeda',
        kind: 'repository',
      },
      {
        label: 'Blazingly hot execution',
        href: 'https://github.com/teamleaderleo/glaeda/blob/main/docs/BLAZINGLY_HOT.md',
        kind: 'record',
      },
      {
        label: 'Current cross-repository state',
        href: 'https://github.com/teamleaderleo/scrapbook/blob/main/work/current-state.md#glaeda--landed-m6-hot-state-substrate',
        kind: 'record',
      },
    ],
  },
  {
    id: 'glossless',
    title: 'Glossless',
    kind: 'Artist pose and reference studio',
    status: 'Live public editor · active development',
    summary:
      'An artist-first pose, light, silhouette, and reference-sheet tool. Bring in a photo or figure, establish or detect a pose, repair it directly in 2D or 3D, study useful camera and lighting views, then export a reference artifact. Core editing works locally without an account or hosted AI service.',
    accomplishments: [
      'The React/Vite editor keeps synchronized 2D and 3D study views with MediaPipe pose detection, editable keypoints, direct manipulation, undo/redo, camera presets, lighting controls, silhouette studies, and redline/blueline construction overlays.',
      'Imported GLB/GLTF figures can be recognized across Quaternius, Khronos, MakeHuman, Mixamo, Rigify, VRM-style, and namespaced humanoid rigs, then driven live from the active pose with direct 3D handles on compatible skinned figures.',
      'Local project files can preserve source images, raw PNG and composed 1800×1200 reference-sheet exports are available, and optional Convex/cloud or provider-neutral pose-assist paths remain additive to the local workflow.',
    ],
    reversal:
      'The 3D renderer is not the editor availability boundary. The shell and 2D workflow load first, while WebGL failure or context loss is isolated so the rest of the editor remains usable.',
    evidence: [
      {
        label: 'Public site',
        href: 'https://glossless.app/',
        kind: 'record',
      },
      {
        label: 'Editor',
        href: 'https://glossless.app/app',
        kind: 'record',
      },
      {
        label: 'Product docs',
        href: 'https://glossless.app/docs',
        kind: 'record',
      },
    ],
  },
  {
    id: 'cultist',
    title: 'Cultist',
    kind: 'Repository evidence before code changes',
    status: 'Active prototype · sustained dogfood',
    summary:
      'Find out why before you copy it. Cultist recovers repository evidence, counterexamples, and concurrent-change context before a worker edits code, then measures whether that evidence actually changes the next justified action.',
    accomplishments: [
      'The public cargo-cultist commands inspect repository conventions, changed code, concurrent work, historical companions, and CI selectors with deterministic local analysis and provenance-bearing human/JSON output.',
      'The research loop now retains behavioral episodes for the real product question: whether selected evidence changed what a worker inspected, validated, coordinated, or preserved, including quiet cases where the right result was no interruption.',
      'Active-work preflight can compare local refs or a bounded provider inventory, report direct path collisions, preserve UNKNOWN when coordination evidence is incomplete, and refuse to turn paginated or partial provider observations into fake complete coverage.',
    ],
    reversal:
      'Precedent is evidence, not policy. Cultist keeps counterexamples and UNKNOWN visible instead of turning majority spelling, historical co-change, or partial provider data into repository rules.',
    evidence: [
      {
        label: 'Repository',
        href: 'https://github.com/teamleaderleo/cultist',
        kind: 'repository',
      },
      {
        label: 'Research roadmap',
        href: 'https://github.com/teamleaderleo/cultist/blob/main/ROADMAP.md',
        kind: 'record',
      },
      {
        label: 'Current cross-repository state',
        href: 'https://github.com/teamleaderleo/scrapbook/blob/main/work/current-state.md#cultist--provider-bound-repository-evidence',
        kind: 'record',
      },
    ],
  },
  {
    id: 'fieldwork',
    title: 'Fieldwork',
    kind: 'Code-first upstream research',
    status: 'Ongoing',
    summary:
      'Understand the system deeply enough to make the hypothesis lose before asking its maintainers to spend time on a change. Fieldwork keeps reproductions, experiments, integration trials, negative results, decisions, and upstream packets around that standard.',
    accomplishments: [
      'Programmes and target hubs cover SDKs, CLIs, web runtimes, data systems, VMMs, containers, compilers, terminal software, and Linux userland, with code/test reconnaissance preceding narrow hypotheses.',
      'Owned testbeds and bounded experiments connect isolated behavior to real workflows before a result is promoted into an upstream campaign or contribution.',
      'Negative and superseded results stay in the record when they show that an attractive repair was wrong, too broad, already owned elsewhere, or not worth the compatibility/review cost.',
    ],
    reversal:
      'A correct patch is not automatically an upstream contribution. If the evidence does not reduce maintainer uncertainty or show a concrete payoff, the useful result may be the reproduction, the negative finding, or the decision not to submit it.',
    evidence: [
      {
        label: 'Fieldwork repository',
        href: 'https://github.com/teamleaderleo/fieldwork',
        kind: 'repository',
      },
      {
        label: 'Why Fieldwork',
        href: 'https://github.com/teamleaderleo/fieldwork/blob/main/WHY_FIELDWORK.md',
        kind: 'record',
      },
      {
        label: 'Linux Fieldwork repository',
        href: 'https://github.com/teamleaderleo/linux-fieldwork',
        kind: 'repository',
      },
    ],
  },
];

export const workRecordUpdatedAt = '2026-09-23';

export function getWorkRecord(id: string): WorkRecord | undefined {
  return workRecords.find(record => record.id === id);
}
