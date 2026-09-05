import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import type { WorkerOutcomeSnapshot } from '@/app/lib/worker-outcome-source';
import { projectWorkerOutcomeAttention } from '@/app/lib/worker-outcome-attention';
import { WorkerOutcomeAttentionPanel } from './worker-outcome-attention-panel';

function readySnapshot(): WorkerOutcomeSnapshot {
  const attention = projectWorkerOutcomeAttention({
    schema: 'worker-outcome-report/v1',
    observed_at: '2026-09-05T07:00:00.000Z',
    assignments: [
      {
        assignment_id: 'pr-817',
        title: 'Add provider-labelled usage lane',
        kind: 'pull-request',
        state: 'open',
        draft: false,
        review_decision: 'changes-requested',
        checks: 'passing',
        updated_at: '2026-09-05T06:00:00.000Z',
        artifact_url: 'https://github.com/teamleaderleo/scrapbook/pull/817',
      },
      {
        assignment_id: 'pr-800',
        title: 'Add accepted-work economics',
        kind: 'pull-request',
        state: 'open',
        draft: false,
        review_decision: 'review-required',
        checks: 'passing',
        updated_at: '2026-09-05T05:00:00.000Z',
        artifact_url: 'https://github.com/teamleaderleo/scrapbook/pull/800',
      },
      {
        assignment_id: 'pr-blind',
        title: 'Assignment without review evidence',
        kind: 'pull-request',
        state: 'open',
        draft: null,
        review_decision: null,
        checks: null,
        updated_at: '2026-09-05T04:00:00.000Z',
        artifact_url: 'https://github.com/teamleaderleo/scrapbook/pull/799',
      },
    ],
  });
  return { status: 'ready', attention };
}

describe('WorkerOutcomeAttentionPanel', () => {
  it('renders every populated bucket with exact artifact links', () => {
    const html = renderToStaticMarkup(
      createElement(WorkerOutcomeAttentionPanel, {
        snapshot: readySnapshot(),
      })
    );
    expect(html).toContain('Needs a decision (1)');
    expect(html).toContain('Returned, unreviewed (1)');
    expect(html).toContain('Unknown state (1)');
    expect(html).toContain(
      'href="https://github.com/teamleaderleo/scrapbook/pull/817"'
    );
    expect(html).toContain(
      'href="https://github.com/teamleaderleo/scrapbook/pull/800"'
    );
    expect(html).toContain('changes requested');
    expect(html).toContain('review and check state unavailable');
  });

  it('renders the unavailable snapshot without inventing assignments', () => {
    const html = renderToStaticMarkup(
      createElement(WorkerOutcomeAttentionPanel, {
        snapshot: {
          status: 'unavailable',
          observed_at: '2026-09-05T07:00:00.000Z',
          reason: 'assignment transport unreachable',
        },
      })
    );
    expect(html).toContain('Assignment state unknown');
    expect(html).toContain('assignment transport unreachable');
    expect(html).not.toContain('<a href=');
  });
});
