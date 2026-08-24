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
    status: 'Release candidate · ~101s → 13.69s development arc',
    summary:
      'A cross-platform performance launcher and mod-analysis toolkit for heavily modded Starsector. The work combines reverse-engineering an obfuscated JVM runtime, moving deterministic work to reusable boundaries, exact fallback when those proofs stop holding, and a desktop product around the same Java engine.',
    accomplishments: [
      'The 83-mod development arc moved from an observed early high around 101 seconds to a 13.69-second best run. Five loader-specific data caches exposed a lower shared boundary, where repeated JSON/CSV work moved into one memoized read layer and typed-tree representation.',
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
        label: 'Controlled same-session campaign',
        href: 'https://github.com/teamleaderleo/preflight/pull/440',
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
    id: 'stensibly',
    title: 'Stensibly',
    kind: 'Durable human-agent coordination',
    status: 'Live hosted system · ongoing dogfood',
    summary:
      'Work should survive the worker doing it. Stensibly keeps tasks, evidence, next actions, blockers, and handoffs in a server-owned ledger so a fresh human or agent can continue without reconstructing the project from one vanished chat or process.',
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
    id: 'smolrunner',
    title: 'SmolRunner',
    kind: 'Hot Linux execution for coding agents',
    status: 'Pre-alpha · live Apple-silicon acceptance',
    summary:
      'Fresh Linux when the work is untrusted; hot project state when it is trusted. SmolRunner runs coding agents and GitHub Actions on Apple-silicon Macs, keeping repositories, dependencies, compiler state, indexes, and services warm only where the trust and validity rules permit it.',
    accomplishments: [
      'The strict lane gives unknown work a prepared Lima/VZ worker, one bounded job, durable assignment/no-replay handling, official GitHub Runner Scale Set integration, exact teardown, and evidence that the worker is gone.',
      'Trusted projects can keep the expensive substrate hot: persistent project disks, crash-safe leases, OverlayFS task views, immutable Git object-pool generations, and copy-on-write task materialization are already landed as M6 primitives.',
      'The north-star metric is agent wall-clock latency: queue-to-first-useful-command, edit-to-first-test-result, final relevant verification, throughput under concurrent agents, and the CPU/RAM/disk cost of keeping useful state resident.',
    ],
    reversal:
      'The original instinct was to make every worker disposable. SmolRunner treats disposal as one capability instead: unknown work gets a fresh worker, while trusted projects can keep expensive Linux state hot without making that surviving state the source of execution truth.',
    evidence: [
      {
        label: 'Repository',
        href: 'https://github.com/teamleaderleo/smolrunner',
        kind: 'repository',
      },
      {
        label: 'Blazingly hot execution',
        href: 'https://github.com/teamleaderleo/smolrunner/blob/main/docs/BLAZINGLY_HOT.md',
        kind: 'record',
      },
      {
        label: 'Current cross-repository state',
        href: 'https://github.com/teamleaderleo/scrapbook/blob/main/work/current-state.md#smolrunner--landed-m6-hot-state-substrate',
        kind: 'record',
      },
    ],
  },
  {
    id: 'cultist',
    title: 'Cultist',
    kind: 'Repository-evidence research',
    status: 'Active prototype · sustained dogfood',
    summary:
      'A repository-aware evidence tool that asks what a worker should know before changing code, keeps provenance and counterexamples visible, and measures whether selected evidence actually changes the next justified action.',
    accomplishments: [
      'The public cargo-cultist analyzers cover repository conventions, change-time evidence, concurrent-change preflight, historical companions, and CI selector analysis with deterministic local read-only behavior.',
      'Research lanes add bounded evidence packets, compact representation, decision memory, promotion-receipt reuse, and retained behavioral episodes for both action-changing and quiet cases.',
      'Current active-work dogfood binds provider-backed evidence to explicit provider snapshot identity, revalidates the frontier at consumption, preserves UNKNOWN for incomplete provider state, and only claims bounded file coverage when one response proves it.',
    ],
    evidence: [
      {
        label: 'Repository',
        href: 'https://github.com/teamleaderleo/cultist',
        kind: 'repository',
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
    kind: 'Codebase research practice',
    status: 'Ongoing',
    summary:
      'A code-first method for entering real systems, finding the operation that owns a behavior, building a discriminator that can make the hypothesis lose, and retaining the evidence another reader needs to judge the result.',
    accomplishments: [
      'Carries investigations across runtimes, compilers, build tools, terminal software, HTTP libraries, VMMs, containers, and Linux userland while keeping third-party upstream mutation human-owned.',
      'Keeps negative and superseded results when they explain why an attractive repair was wrong, too broad, already owned, or too expensive for its compatibility payoff.',
      'The writing rules now explicitly favor concrete questions, diagrams/traces when they beat prose, human cadence, caveats beside claims, and concise endings over ritual templates and polished-sounding filler.',
    ],
    evidence: [
      {
        label: 'Fieldwork repository',
        href: 'https://github.com/teamleaderleo/fieldwork',
        kind: 'repository',
      },
      {
        label: 'Linux Fieldwork repository',
        href: 'https://github.com/teamleaderleo/linux-fieldwork',
        kind: 'repository',
      },
    ],
  },
];

export const workRecordUpdatedAt = '2026-08-25';

export function getWorkRecord(id: string): WorkRecord | undefined {
  return workRecords.find(record => record.id === id);
}
