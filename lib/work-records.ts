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
    status: 'Active · release evidence still being tightened',
    summary:
      'A performance launcher for heavily modded Starsector. It prepares deterministic work before launch and intercepts only runtime seams whose source, class-loader, and bytecode contracts are known.',
    accomplishments: [
      'Recorded a 15.88s fresh-warm launch on the reviewed 83-mod profile; a fresh same-cohort release benchmark remains the public-delta gate.',
      'Kept 42/42 transformed-class cache hits and 15,469 prepared texture and pixel-conversion hits active on that run.',
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
        label: 'Current evidence packet',
        href: 'https://github.com/teamleaderleo/preflight/pull/322',
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
    status: 'Selected merged work',
    summary:
      'Small repairs in unfamiliar systems, selected for the ownership boundary they clarify rather than for repository-name accumulation.',
    accomplishments: [
      'Made repeated global and sticky URL-regex checks deterministic in the Vercel AI SDK while restoring caller-owned lastIndex; merged and published.',
      'Replaced SSH loss with Cloud Hypervisor’s exact shutdown event before VM and disk reuse; merged.',
      'Propagated ACPI table-construction failures through typed Cloud Hypervisor boot errors instead of panicking; merged.',
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

export const workRecordUpdatedAt = '2026-08-11';

export function getWorkRecord(id: string): WorkRecord | undefined {
  return workRecords.find(record => record.id === id);
}
