import { describe, expect, it } from 'vitest';
import {
  projectAgentVisitToJournalEntry,
  toPublicAgentJournalEntry,
  validateAgentJournalEntries,
  type AgentJournalEntry,
} from './agent-journal';

const NOW = Date.parse('2026-07-27T00:00:00.000Z');

function entry(overrides: Partial<AgentJournalEntry> = {}): AgentJournalEntry {
  return {
    id: 'agent-one-entry',
    codename: 'Agent One',
    insignia: 'A1',
    repository: 'teamleaderleo/scrapbook',
    occurredAt: '2026-07-26T23:00:00.000Z',
    runtime: 'Scrapbook agent pod',
    model: 'GPT-5.6 Thinking',
    note: 'Recorded a tested repository change with inspectable evidence.',
    evidence: [
      {
        kind: 'pull-request',
        label: 'PR #406',
        href: 'https://github.com/teamleaderleo/scrapbook/pull/406',
      },
    ],
    approval: {
      mode: 'human-directed',
      recordedBy: 'repository-owner',
    },
    ...overrides,
  };
}

describe('validateAgentJournalEntries', () => {
  it('accepts strict newest-first evidence entries', () => {
    const entries = [
      entry(),
      entry({ id: 'agent-two-entry', occurredAt: '2026-07-26T22:00:00.000Z' }),
    ];

    expect(validateAgentJournalEntries(entries, { now: NOW })).toBe(entries);
  });

  it('rejects duplicate ids and incorrect ordering', () => {
    expect(() =>
      validateAgentJournalEntries([entry(), entry()], { now: NOW }),
    ).toThrow('Duplicate agent journal id');

    expect(() =>
      validateAgentJournalEntries(
        [entry(), entry({ id: 'later-entry', occurredAt: '2026-07-26T23:30:00.000Z' })],
        { now: NOW },
      ),
    ).toThrow('strictly newest-first');
  });

  it('rejects invalid, non-canonical, and future timestamps', () => {
    expect(() =>
      validateAgentJournalEntries([entry({ occurredAt: '2026-07-26T23:00:00Z' })], {
        now: NOW,
      }),
    ).toThrow('canonical UTC timestamp');

    expect(() =>
      validateAgentJournalEntries([entry({ occurredAt: '2026-07-27T00:06:00.000Z' })], {
        now: NOW,
      }),
    ).toThrow('future-dated');
  });

  it('rejects malformed repositories and mismatched evidence kinds', () => {
    expect(() =>
      validateAgentJournalEntries([entry({ repository: 'scrapbook' })], { now: NOW }),
    ).toThrow('owner/repo');

    expect(() =>
      validateAgentJournalEntries(
        [
          entry({
            evidence: [
              {
                kind: 'workflow-run',
                label: 'Not a run',
                href: 'https://github.com/teamleaderleo/scrapbook/pull/406',
              },
            ],
          }),
        ],
        { now: NOW },
      ),
    ).toThrow('does not match its kind');
  });

  it('rejects missing approval data and unsafe artifact paths', () => {
    expect(() =>
      validateAgentJournalEntries(
        [entry({ approval: undefined as unknown as AgentJournalEntry['approval'] })],
        { now: NOW },
      ),
    ).toThrow('approval metadata');

    expect(() =>
      validateAgentJournalEntries(
        [
          entry({
            artifact: {
              kind: 'document',
              path: '/../private/report.pdf',
              label: 'Private report',
            },
          }),
        ],
        { now: NOW },
      ),
    ).toThrow('safe local public path');
  });

  it('validates optional guestbook lineage when ids are supplied', () => {
    expect(() =>
      validateAgentJournalEntries([entry({ guestbookId: 'missing-card' })], {
        now: NOW,
        guestbookIds: new Set(['known-card']),
      }),
    ).toThrow('lineage does not exist');
  });
});

describe('guestbook projection', () => {
  it('projects evidence-backed visits when timestamp and approval are explicit', () => {
    const projected = projectAgentVisitToJournalEntry(
      {
        id: 'thread-compass',
        name: 'Thread Compass',
        mark: 'TC-26',
        note: 'Coordinated an inspectable change.',
        repository: 'teamleaderleo/scrapbook',
        model: 'GPT-5.6 Thinking',
        source: {
          label: 'PR #408',
          href: 'https://github.com/teamleaderleo/scrapbook/pull/408',
        },
      },
      {
        occurredAt: '2026-07-26T22:00:00.000Z',
        runtime: 'Scrapbook agent pod',
        approval: { mode: 'human-directed', recordedBy: 'repository-owner' },
      },
    );

    expect(projected).toMatchObject({
      id: 'guestbook-thread-compass',
      guestbookId: 'thread-compass',
      evidence: [{ kind: 'pull-request' }],
    });
  });

  it('does not invent journal evidence for incomplete legacy visits', () => {
    expect(
      projectAgentVisitToJournalEntry(
        {
          id: 'legacy-card',
          name: 'Legacy Card',
          mark: 'LC',
          note: 'No inspectable source was recorded.',
        },
        {
          occurredAt: '2026-07-26T22:00:00.000Z',
          runtime: 'Scrapbook agent pod',
          approval: { mode: 'human-directed', recordedBy: 'repository-owner' },
        },
      ),
    ).toBeNull();
  });
});

describe('public projection', () => {
  it('keeps approval mode while omitting the internal recorder', () => {
    const publicEntry = toPublicAgentJournalEntry(entry());

    expect(publicEntry.approvalMode).toBe('human-directed');
    expect(publicEntry).not.toHaveProperty('approval');
    expect(JSON.stringify(publicEntry)).not.toContain('recordedBy');
  });
});
