import { describe, expect, it } from 'vitest';
import { projectAgentVisitToJournalEntry } from './agent-journal';

const metadata = {
  occurredAt: '2026-07-26T22:00:00.000Z',
  runtime: 'Scrapbook agent pod',
  approval: {
    mode: 'human-directed' as const,
    recordedBy: 'repository-owner' as const,
  },
};

function visit(sourceHref: string) {
  return {
    id: 'evidence-visitor',
    name: 'Evidence Visitor',
    mark: 'EV',
    note: 'Recorded inspectable evidence.',
    repository: 'teamleaderleo/scrapbook',
    source: {
      label: 'Source',
      href: sourceHref,
    },
  };
}

describe('projectAgentVisitToJournalEntry evidence kinds', () => {
  it.each([
    ['issue', 'https://github.com/teamleaderleo/scrapbook/issues/412'],
    ['pull-request', 'https://github.com/teamleaderleo/scrapbook/pull/413'],
    ['commit', 'https://github.com/teamleaderleo/scrapbook/commit/a8172b34f0e6fa50'],
    ['workflow-run', 'https://github.com/teamleaderleo/scrapbook/actions/runs/30216119425'],
  ] as const)('recognises %s links', (kind, href) => {
    expect(projectAgentVisitToJournalEntry(visit(href), metadata)?.evidence[0]?.kind).toBe(kind);
  });

  it('declines unsupported GitHub pages instead of mislabelling them', () => {
    expect(
      projectAgentVisitToJournalEntry(
        visit('https://github.com/teamleaderleo/scrapbook/tree/main'),
        metadata,
      ),
    ).toBeNull();
  });
});
