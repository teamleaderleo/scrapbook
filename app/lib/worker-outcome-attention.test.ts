import { describe, expect, it } from 'vitest';

import {
  projectWorkerOutcomeAttention,
  workerOutcomeReportSchema,
  type WorkerOutcomeAssignment,
  type WorkerOutcomeReport,
} from './worker-outcome-attention';

function assignment(
  overrides: Partial<WorkerOutcomeAssignment> = {}
): WorkerOutcomeAssignment {
  return {
    assignment_id: 'pr-1',
    title: 'Example assignment',
    kind: 'pull-request',
    state: 'open',
    draft: false,
    review_decision: 'review-required',
    checks: 'passing',
    updated_at: '2026-09-05T06:00:00.000Z',
    artifact_url: 'https://github.com/teamleaderleo/scrapbook/pull/1',
    ...overrides,
  };
}

function report(
  assignments: WorkerOutcomeAssignment[]
): WorkerOutcomeReport {
  return {
    schema: 'worker-outcome-report/v1',
    observed_at: '2026-09-05T07:00:00.000Z',
    assignments,
  };
}

describe('worker-outcome-report/v1 contract', () => {
  it('rejects raw prompts, transcripts, and unknown fields', () => {
    expect(() =>
      workerOutcomeReportSchema.parse(
        report([
          assignment({
            assignment_id: 'pr-1',
            // @ts-expect-error probe: foreign payload field
            transcript: 'do not store raw logs',
          }),
        ])
      )
    ).toThrow();
  });

  it('rejects more than 200 assignments', () => {
    expect(() =>
      workerOutcomeReportSchema.parse(
        report(
          Array.from({ length: 201 }, (_, index) =>
            assignment({
              assignment_id: `pr-${index}`,
              artifact_url: `https://github.com/teamleaderleo/scrapbook/pull/${index}`,
            })
          )
        )
      )
    ).toThrow();
  });
});

describe('projectWorkerOutcomeAttention', () => {
  it('routes open pull requests into running, unreviewed, failed-safe, and decision buckets', () => {
    const attention = projectWorkerOutcomeAttention(
      report([
        assignment({
          assignment_id: 'pr-draft',
          draft: true,
          review_decision: null,
          checks: 'pending',
          updated_at: '2026-09-05T01:00:00.000Z',
        }),
        assignment({
          assignment_id: 'pr-waiting',
          updated_at: '2026-09-05T02:00:00.000Z',
        }),
        assignment({
          assignment_id: 'pr-changes',
          review_decision: 'changes-requested',
          updated_at: '2026-09-05T03:00:00.000Z',
        }),
        assignment({
          assignment_id: 'pr-failing',
          review_decision: 'review-required',
          checks: 'failing',
          updated_at: '2026-09-05T04:00:00.000Z',
        }),
        assignment({
          assignment_id: 'pr-approved',
          review_decision: 'approved',
          updated_at: '2026-09-05T05:00:00.000Z',
        }),
        assignment({
          assignment_id: 'pr-blind',
          review_decision: null,
          checks: null,
          updated_at: '2026-09-05T06:00:00.000Z',
        }),
      ])
    );
    const buckets = new Map(
      attention.items.map(item => [item.assignment_id, item.bucket])
    );
    expect(buckets.get('pr-draft')).toBe('running');
    expect(buckets.get('pr-waiting')).toBe('returned-unreviewed');
    expect(buckets.get('pr-changes')).toBe('needs-decision');
    expect(buckets.get('pr-failing')).toBe('needs-decision');
    expect(buckets.get('pr-approved')).toBe('needs-decision');
    expect(buckets.get('pr-blind')).toBe('unknown');
    expect(attention.counts).toMatchObject({
      running: 1,
      'returned-unreviewed': 1,
      'needs-decision': 3,
      unknown: 1,
    });
  });

  it('prefers changes-requested and failing checks over draft/pending', () => {
    const attention = projectWorkerOutcomeAttention(
      report([
        assignment({
          assignment_id: 'pr-a',
          draft: true,
          checks: 'pending',
          review_decision: 'changes-requested',
        }),
        assignment({
          assignment_id: 'pr-b',
          draft: true,
          checks: 'failing',
          review_decision: null,
        }),
      ])
    );
    expect(
      attention.items.find(item => item.assignment_id === 'pr-a')?.bucket
    ).toBe('needs-decision');
    expect(
      attention.items.find(item => item.assignment_id === 'pr-b')?.bucket
    ).toBe('needs-decision');
  });

  it('routes closed assignments into done or failed', () => {
    const attention = projectWorkerOutcomeAttention(
      report([
        assignment({ assignment_id: 'pr-merged', state: 'merged' }),
        assignment({ assignment_id: 'pr-abandoned', state: 'closed' }),
      ])
    );
    const buckets = new Map(
      attention.items.map(item => [item.assignment_id, item.bucket])
    );
    expect(buckets.get('pr-merged')).toBe('done');
    expect(buckets.get('pr-abandoned')).toBe('failed');
  });

  it('keeps open issues running and sorts newest first', () => {
    const attention = projectWorkerOutcomeAttention(
      report([
        assignment({
          assignment_id: 'issue-old',
          kind: 'issue',
          draft: null,
          review_decision: null,
          checks: null,
          title: 'Older issue',
          updated_at: '2026-09-04T06:00:00.000Z',
          artifact_url: 'https://github.com/teamleaderleo/scrapbook/issues/1',
        }),
        assignment({
          assignment_id: 'issue-new',
          kind: 'issue',
          draft: null,
          review_decision: null,
          checks: null,
          title: 'Newer issue',
          updated_at: '2026-09-05T06:00:00.000Z',
          artifact_url: 'https://github.com/teamleaderleo/scrapbook/issues/2',
        }),
      ])
    );
    expect(attention.items.map(item => item.assignment_id)).toEqual([
      'issue-new',
      'issue-old',
    ]);
    expect(attention.counts.running).toBe(2);
  });
});
