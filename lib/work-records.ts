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
    kind: 'Owned performance system',
    status: 'Active · controlled 83-mod campaign recorded',
    summary:
      'A performance launcher for heavily modded Starsector. It prepares deterministic work before launch and intercepts only runtime seams whose source, class-loader, and bytecode contracts are known.',
    accomplishments: [
      'A current controlled candidate campaign measured 89.00s baseline → 15.53s accelerated on the same 83-mod profile, with five interleaved accepted runs per condition and no exclusions.',
      'The accelerated runs retained exact source/bytecode compatibility gates, prepared texture/data work, runtime adapter health, and original-path fallback for changed or unsupported inputs.',
      'Built fail-open runtime adapters, launch instrumentation, persistent prepared artifacts, desktop packaging, and rollback-aware update work around a game and mod ecosystem we do not control.',
    ],
    reversal:
      'A valid prepared-pixel cache barely moved launch time until measurement found it sitting behind a roughly 27-second prefetch wait. Moving the intervention to the actual owner turned the same prepared work into a major improvement.',
    evidence: [
      {
        label: 'Repository',
        href: 'https://github.com/teamleaderleo/preflight',
        kind: 'repository',
      },
      {
        label: 'Controlled 83-mod campaign',
        href: 'https://github.com/teamleaderleo/preflight/pull/440',
        kind: 'pull-request',
      },
      {
        label: 'Full Scrapbook record',
        href: 'https://github.com/teamleaderleo/scrapbook/blob/main/work/records/preflight.md',
        kind: 'record',
      },
    ],
  },
  {
    id: 'open-source',
    title: 'Open-source repairs',
    kind: 'Upstream engineering',
    status: 'Selected merged and maintainer-accepted work',
    summary:
      'Repairs in unfamiliar systems, selected for the ownership boundary they clarify and the quality of external review or adoption rather than for repository-name accumulation.',
    accomplishments: [
      'In Vercel AI SDK, directly merged and published a deterministic URL-regex fix; two independently developed Web Streams fixes were adopted by AI SDK Factory into merged upstream commits that credit teamleaderleo as co-author, with one also merged to the v5 and v6 release branches.',
      'Landed two Cloud Hypervisor fixes: exact shutdown-event gating before VM/disk reuse and typed ACPI table-construction failures instead of VMM panics.',
      'Merged a Vite optimizer lifecycle fix; a second Vite teardown repair has two maintainer approvals, while a Cloudflare Access credential-cache repair is human-approved with Wrangler CODEOWNERS satisfied.',
    ],
    reversal:
      'A real runc off-by-one was patched on the allocation side. Repository history showed the better repair belonged in MaxCPU semantics instead, so the proposed patch was closed rather than defended for its merge statistic.',
    evidence: [
      {
        label: 'AI SDK · deterministic URL matching',
        href: 'https://github.com/vercel/ai/pull/18570',
        kind: 'pull-request',
      },
      {
        label: 'AI SDK Factory · async stream cleanup',
        href: 'https://github.com/vercel/ai/pull/18400',
        kind: 'pull-request',
      },
      {
        label: 'AI SDK Factory · size-limit cleanup',
        href: 'https://github.com/vercel/ai/pull/18695',
        kind: 'pull-request',
      },
      {
        label: 'Cloud Hypervisor · shutdown event',
        href: 'https://github.com/cloud-hypervisor/cloud-hypervisor/pull/8699',
        kind: 'pull-request',
      },
      {
        label: 'Cloud Hypervisor · typed ACPI failures',
        href: 'https://github.com/cloud-hypervisor/cloud-hypervisor/pull/8709',
        kind: 'pull-request',
      },
      {
        label: 'Vite · optimizer bundle lifecycle',
        href: 'https://github.com/vitejs/vite/pull/23207',
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
    kind: 'Agent coordination system',
    status: 'Active',
    summary:
      'A hosted coordination layer where the board shows the work and a separate ledger governs who may do it. The durable state belongs to the collaboration, not to any one agent runtime.',
    accomplishments: [
      'Models workspaces, projects, actors, items, events, artifacts, claims, renewable leases, handoffs, and completion as shared coordination facts.',
      'Supports browser sessions, scoped bearer clients, REST, and Streamable HTTP MCP without giving every caller the same authority.',
      'Guards GitHub publication with exact branch and file preconditions plus durable reconciliation receipts.',
    ],
    evidence: [
      {
        label: 'Repository',
        href: 'https://github.com/teamleaderleo/stensibly',
        kind: 'repository',
      },
      {
        label: 'Current synthesis record',
        href: 'https://github.com/teamleaderleo/scrapbook/blob/main/work/archive/2026-08-11-signal-audit.md#stensibly',
        kind: 'record',
      },
    ],
  },
  {
    id: 'smolrunner',
    title: 'SmolRunner',
    kind: 'Disposable-runner infrastructure',
    status: 'Pre-alpha',
    summary:
      'A narrow system for admitting, identifying, recovering, and safely cleaning up disposable GitHub Actions workers while leaving scheduling and logs with GitHub.',
    accomplishments: [
      'Defines durable attempt and catalog state, capacity admission, exact worker and template identities, and sealed command plans.',
      'Checkpoints before external mutation and treats incomplete or ambiguous clones as explicit recovery states.',
      'Fails closed on ownership, adoption, and deletion instead of treating cleanup authority as an implementation detail.',
    ],
    evidence: [
      {
        label: 'Repository',
        href: 'https://github.com/teamleaderleo/smolrunner',
        kind: 'repository',
      },
      {
        label: 'Current synthesis record',
        href: 'https://github.com/teamleaderleo/scrapbook/blob/main/work/archive/2026-08-11-signal-audit.md#smolrunner',
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
      'A working method for entering real codebases, locating behavioral owners, building discriminating tests, and keeping only the findings that survive the target path.',
    accomplishments: [
      'Carries investigations across runtimes, compilers, build tools, terminal software, HTTP libraries, VMMs, containers, and Linux userland.',
      'Keeps negative and superseded results when they explain why an attractive repair was wrong, too broad, already owned, or not worth its compatibility cost.',
      'Feeds selected studies into Space while preserving the originating repository evidence.',
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

export const workRecordUpdatedAt = '2026-08-15';

export function getWorkRecord(id: string): WorkRecord | undefined {
  return workRecords.find(record => record.id === id);
}
