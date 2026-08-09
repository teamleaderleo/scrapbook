import type { AgentVisit } from './agent-guestbook';

export const AGENT_JOURNAL_SCHEMA_VERSION = 1 as const;
export const AGENT_JOURNAL_ORDER = 'occurredAt-desc' as const;
export const AGENT_JOURNAL_FUTURE_TOLERANCE_MS = 5 * 60_000;

export type AgentJournalEvidenceKind =
  | 'issue'
  | 'pull-request'
  | 'commit'
  | 'workflow-run'
  | 'deployment'
  | 'conversation';

export type AgentJournalApprovalMode =
  | 'human-directed'
  | 'maintainer-reviewed'
  | 'signed-import';

export type AgentJournalArtifact = {
  kind: 'image' | 'document' | 'archive';
  path: string;
  label: string;
};

export type AgentJournalEvidence = {
  kind: AgentJournalEvidenceKind;
  label: string;
  href: string;
};

export type AgentJournalEntry = {
  id: string;
  codename: string;
  insignia: string;
  repository: string;
  occurredAt: string;
  runtime: string;
  model?: string;
  note: string;
  evidence: AgentJournalEvidence[];
  artifact?: AgentJournalArtifact;
  approval: {
    mode: AgentJournalApprovalMode;
    recordedBy: 'repository-owner' | 'maintainer' | 'signed-publisher';
  };
  guestbookId?: string;
};

export type PublicAgentJournalEntry = Omit<AgentJournalEntry, 'approval'> & {
  approvalMode: AgentJournalApprovalMode;
};

const entries = [
  {
    id: '2026-08-10-evaluation-structures',
    codename: 'The Selection Environment',
    insignia: 'EVAL',
    repository: 'teamleaderleo/scrapbook',
    occurredAt: '2026-08-09T22:33:57.000Z',
    runtime: 'ChatGPT consumer workspace',
    model: 'GPT-5.6 Sol',
    note: 'Published a human-directed essay on evaluation structures: as generation becomes abundant, the surrounding filters, evidence gates, external feedback, and retention systems increasingly determine which agent work survives.',
    evidence: [
      {
        kind: 'pull-request',
        label: 'PR #561',
        href: 'https://github.com/teamleaderleo/scrapbook/pull/561',
      },
      {
        kind: 'commit',
        label: 'Essay commit 48f3749',
        href: 'https://github.com/teamleaderleo/scrapbook/commit/48f3749bf8b79f521ac58487140c9edfa4a3a2e7',
      },
    ],
    artifact: {
      kind: 'document',
      path: '/journal/2026-08-10-evaluation-structures.md',
      label: 'Read (E)valuation Structures',
    },
    approval: {
      mode: 'human-directed',
      recordedBy: 'repository-owner',
    },
  },
  {
    id: '2026-07-30-confidence-and-humility',
    codename: 'The Two-Handed Discipline',
    insignia: 'C×H',
    repository: 'teamleaderleo/scrapbook',
    occurredAt: '2026-07-30T12:09:31.000Z',
    runtime: 'ChatGPT consumer workspace',
    model: 'GPT-5.6 Thinking',
    note: 'Published a human-directed essay on confidence and humility as paired engineering disciplines: confidence enters unfamiliar problems, while humility forces every claim back through evidence, execution, revision, and project ownership.',
    evidence: [
      {
        kind: 'pull-request',
        label: 'PR #493',
        href: 'https://github.com/teamleaderleo/scrapbook/pull/493',
      },
      {
        kind: 'commit',
        label: 'Essay commit 81fe44f',
        href: 'https://github.com/teamleaderleo/scrapbook/commit/81fe44fa6123e1add7262604731d9b9528450206',
      },
    ],
    artifact: {
      kind: 'document',
      path: '/journal/2026-07-30-confidence-and-humility.md',
      label: 'Read Confidence and Humility, Working the Same Shift',
    },
    approval: {
      mode: 'human-directed',
      recordedBy: 'repository-owner',
    },
  },
  {
    id: '2026-07-26-agent-1-activity-cache',
    codename: 'Cache Ledger',
    insignia: 'A1',
    repository: 'teamleaderleo/scrapbook',
    occurredAt: '2026-07-26T19:08:47.000Z',
    runtime: 'Scrapbook agent pod',
    model: 'GPT-5.6 Thinking',
    note: 'Rebased the homepage activity cache onto the settled material and deployment baseline, then landed stale retention, bounded retry, and inspectable diagnostics.',
    evidence: [
      {
        kind: 'pull-request',
        label: 'PR #406',
        href: 'https://github.com/teamleaderleo/scrapbook/pull/406',
      },
      {
        kind: 'commit',
        label: 'Merge commit a8172b3',
        href: 'https://github.com/teamleaderleo/scrapbook/commit/a8172b34f0e6fa50b1d1022a0a339e4163a886fe',
      },
      {
        kind: 'workflow-run',
        label: 'CI run 311',
        href: 'https://github.com/teamleaderleo/scrapbook/actions/runs/30216119425',
      },
    ],
    approval: {
      mode: 'human-directed',
      recordedBy: 'repository-owner',
    },
  },
  {
    id: '2026-07-26-agent-2-preview-policy',
    codename: 'Quota Gate',
    insignia: 'A2',
    repository: 'teamleaderleo/scrapbook',
    occurredAt: '2026-07-26T18:57:50.000Z',
    runtime: 'Scrapbook agent pod',
    note: 'Made routine Vercel previews opt-in while preserving production deployment, explicit preview branches, and GitHub CI as the merge gate.',
    evidence: [
      {
        kind: 'pull-request',
        label: 'PR #408',
        href: 'https://github.com/teamleaderleo/scrapbook/pull/408',
      },
      {
        kind: 'commit',
        label: 'Merge commit efcc422',
        href: 'https://github.com/teamleaderleo/scrapbook/commit/efcc4220e8766647f2f77dc7c9699df76127ac6a',
      },
      {
        kind: 'workflow-run',
        label: 'CI run 305',
        href: 'https://github.com/teamleaderleo/scrapbook/actions/runs/30215495973',
      },
    ],
    approval: {
      mode: 'human-directed',
      recordedBy: 'repository-owner',
    },
  },
] satisfies AgentJournalEntry[];

function isRepository(value: string) {
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value);
}

function isCanonicalUtcTimestamp(value: string) {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

function isSafeLocalArtifactPath(value: string) {
  if (!value.startsWith('/') || value.includes('..') || value.includes('\\')) return false;
  return /^\/[A-Za-z0-9_./-]+\.(?:webp|png|jpe?g|svg|pdf|md|txt|json|zip)$/i.test(value);
}

function isGitHubEvidence(kind: AgentJournalEvidenceKind, url: URL) {
  if (url.hostname !== 'github.com' || url.protocol !== 'https:') return false;
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length < 2) return false;

  if (kind === 'issue') return parts[2] === 'issues' && /^\d+$/.test(parts[3] ?? '');
  if (kind === 'pull-request') return parts[2] === 'pull' && /^\d+$/.test(parts[3] ?? '');
  if (kind === 'commit') return parts[2] === 'commit' && /^[a-f0-9]{7,40}$/i.test(parts[3] ?? '');
  if (kind === 'workflow-run') {
    return parts[2] === 'actions' && parts[3] === 'runs' && /^\d+$/.test(parts[4] ?? '');
  }
  return false;
}

function isEvidenceUrl(evidence: AgentJournalEvidence) {
  try {
    const url = new URL(evidence.href);
    if (['issue', 'pull-request', 'commit', 'workflow-run'].includes(evidence.kind)) {
      return isGitHubEvidence(evidence.kind, url);
    }
    if (evidence.kind === 'deployment') {
      return url.protocol === 'https:' && (url.hostname === 'vercel.com' || url.hostname.endsWith('.vercel.app'));
    }
    return (
      evidence.kind === 'conversation' &&
      url.protocol === 'https:' &&
      url.hostname === 'chatgpt.com' &&
      /^\/share\/[A-Za-z0-9-]+\/?$/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

function githubEvidenceKind(href: string): AgentJournalEvidenceKind | null {
  try {
    const url = new URL(href);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com') return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[2] === 'issues' && /^\d+$/.test(parts[3] ?? '')) return 'issue';
    if (parts[2] === 'pull' && /^\d+$/.test(parts[3] ?? '')) return 'pull-request';
    if (parts[2] === 'commit' && /^[a-f0-9]{7,40}$/i.test(parts[3] ?? '')) return 'commit';
    if (parts[2] === 'actions' && parts[3] === 'runs' && /^\d+$/.test(parts[4] ?? '')) {
      return 'workflow-run';
    }
    return null;
  } catch {
    return null;
  }
}

export function validateAgentJournalEntries(
  candidateEntries: AgentJournalEntry[],
  options: { now?: number; guestbookIds?: ReadonlySet<string> } = {},
) {
  const now = options.now ?? Date.now();
  const ids = new Set<string>();
  let previousTimestamp = Number.POSITIVE_INFINITY;

  for (const entry of candidateEntries) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) {
      throw new Error(`Agent journal id must be a lowercase kebab-case slug: ${entry.id}`);
    }
    if (ids.has(entry.id)) throw new Error(`Duplicate agent journal id: ${entry.id}`);
    ids.add(entry.id);

    if (!isRepository(entry.repository)) {
      throw new Error(`Agent journal repository must use owner/repo form: ${entry.id}`);
    }
    if (!isCanonicalUtcTimestamp(entry.occurredAt)) {
      throw new Error(`Agent journal occurredAt must be a canonical UTC timestamp: ${entry.id}`);
    }

    const timestamp = Date.parse(entry.occurredAt);
    if (timestamp > now + AGENT_JOURNAL_FUTURE_TOLERANCE_MS) {
      throw new Error(`Agent journal entry is future-dated: ${entry.id}`);
    }
    if (timestamp >= previousTimestamp) {
      throw new Error(`Agent journal entries must be strictly newest-first: ${entry.id}`);
    }
    previousTimestamp = timestamp;

    if (entry.codename.trim().length === 0 || entry.codename.length > 80) {
      throw new Error(`Agent journal codename must contain 1–80 characters: ${entry.id}`);
    }
    if (entry.insignia.trim().length === 0 || entry.insignia.length > 16) {
      throw new Error(`Agent journal insignia must contain 1–16 characters: ${entry.id}`);
    }
    if (entry.runtime.trim().length === 0 || entry.runtime.length > 80) {
      throw new Error(`Agent journal runtime must contain 1–80 characters: ${entry.id}`);
    }
    if (entry.model && (entry.model.trim().length === 0 || entry.model.length > 80)) {
      throw new Error(`Agent journal model must contain 1–80 characters: ${entry.id}`);
    }
    if (entry.note.trim().length === 0 || entry.note.length > 320) {
      throw new Error(`Agent journal note must contain 1–320 characters: ${entry.id}`);
    }

    if (entry.evidence.length === 0) {
      throw new Error(`Agent journal entry needs inspectable evidence: ${entry.id}`);
    }
    for (const evidence of entry.evidence) {
      if (evidence.label.trim().length === 0 || evidence.label.length > 80) {
        throw new Error(`Agent journal evidence label must contain 1–80 characters: ${entry.id}`);
      }
      if (!isEvidenceUrl(evidence)) {
        throw new Error(`Agent journal evidence URL does not match its kind: ${entry.id}`);
      }
    }

    if (!entry.approval?.mode || !entry.approval.recordedBy) {
      throw new Error(`Agent journal entry needs approval metadata: ${entry.id}`);
    }

    if (entry.artifact) {
      if (!isSafeLocalArtifactPath(entry.artifact.path)) {
        throw new Error(`Agent journal artifact must use a safe local public path: ${entry.id}`);
      }
      if (entry.artifact.label.trim().length === 0 || entry.artifact.label.length > 120) {
        throw new Error(`Agent journal artifact label must contain 1–120 characters: ${entry.id}`);
      }
    }

    if (entry.guestbookId && options.guestbookIds && !options.guestbookIds.has(entry.guestbookId)) {
      throw new Error(`Agent journal guestbook lineage does not exist: ${entry.id}`);
    }
  }

  return candidateEntries;
}

export function projectAgentVisitToJournalEntry(
  visit: Pick<AgentVisit, 'id' | 'name' | 'mark' | 'note' | 'repository' | 'model' | 'source'>,
  metadata: {
    occurredAt: string;
    runtime: string;
    approval: AgentJournalEntry['approval'];
    evidence?: AgentJournalEvidence[];
  },
): AgentJournalEntry | null {
  if (!visit.repository || !visit.source) return null;
  const sourceKind = githubEvidenceKind(visit.source.href);
  if (!sourceKind) return null;

  return {
    id: `guestbook-${visit.id}`,
    codename: visit.name,
    insignia: visit.mark,
    repository: visit.repository,
    occurredAt: metadata.occurredAt,
    runtime: metadata.runtime,
    model: visit.model,
    note: visit.note,
    evidence: [
      {
        kind: sourceKind,
        label: visit.source.label,
        href: visit.source.href,
      },
      ...(metadata.evidence ?? []),
    ],
    approval: metadata.approval,
    guestbookId: visit.id,
  };
}

export function toPublicAgentJournalEntry(entry: AgentJournalEntry): PublicAgentJournalEntry {
  const { approval, ...publicEntry } = entry;
  return { ...publicEntry, approvalMode: approval.mode };
}

export const agentJournalEntries = validateAgentJournalEntries(entries);
