import { z } from 'zod';

const compactIdentitySchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_.:/@#+=\-]*$/);

const artifactUrlSchema = z.string().url().max(512);

export const workerOutcomeAssignmentSchema = z
  .object({
    assignment_id: compactIdentitySchema,
    title: z.string().trim().min(1).max(256),
    kind: z.enum(['pull-request', 'issue']),
    state: z.enum(['open', 'closed', 'merged']),
    draft: z.boolean().nullable(),
    review_decision: z
      .enum(['approved', 'changes-requested', 'review-required'])
      .nullable(),
    checks: z.enum(['passing', 'failing', 'pending']).nullable(),
    updated_at: z.string().datetime({ offset: true }),
    artifact_url: artifactUrlSchema,
  })
  .strict();

export const workerOutcomeReportSchema = z
  .object({
    schema: z.literal('worker-outcome-report/v1'),
    observed_at: z.string().datetime({ offset: true }),
    assignments: z.array(workerOutcomeAssignmentSchema).max(200),
  })
  .strict();

export type WorkerOutcomeAssignment = z.infer<
  typeof workerOutcomeAssignmentSchema
>;
export type WorkerOutcomeReport = z.infer<typeof workerOutcomeReportSchema>;

export const workerOutcomeBuckets = [
  'running',
  'returned-unreviewed',
  'failed',
  'needs-decision',
  'done',
  'unknown',
] as const;

export type WorkerOutcomeBucket = (typeof workerOutcomeBuckets)[number];

export type WorkerOutcomeItem = {
  assignment_id: string;
  title: string;
  kind: WorkerOutcomeAssignment['kind'];
  bucket: WorkerOutcomeBucket;
  reasons: string[];
  artifact_url: string;
  updated_at: string;
};

export type WorkerOutcomeAttention = {
  schema: 'worker-outcome-attention/v1';
  observed_at: string;
  counts: Record<WorkerOutcomeBucket, number>;
  items: WorkerOutcomeItem[];
};

function closedBucket(
  assignment: WorkerOutcomeAssignment
): Pick<WorkerOutcomeItem, 'bucket' | 'reasons'> {
  if (assignment.state === 'merged')
    return { bucket: 'done', reasons: ['merged'] };
  return { bucket: 'failed', reasons: ['closed without merge'] };
}

function openPullRequestBucket(
  assignment: WorkerOutcomeAssignment
): Pick<WorkerOutcomeItem, 'bucket' | 'reasons'> {
  if (assignment.review_decision === 'changes-requested')
    return { bucket: 'needs-decision', reasons: ['changes requested'] };
  if (assignment.checks === 'failing')
    return { bucket: 'needs-decision', reasons: ['checks failing'] };
  if (assignment.review_decision === 'approved')
    return { bucket: 'needs-decision', reasons: ['approved but unmerged'] };
  if (assignment.draft === true)
    return { bucket: 'running', reasons: ['draft work in progress'] };
  if (assignment.checks === 'pending')
    return { bucket: 'running', reasons: ['checks pending'] };
  if (assignment.review_decision === null && assignment.checks === null)
    return {
      bucket: 'unknown',
      reasons: ['review and check state unavailable'],
    };
  return { bucket: 'returned-unreviewed', reasons: ['awaiting review'] };
}

function openIssueBucket(): Pick<WorkerOutcomeItem, 'bucket' | 'reasons'> {
  return { bucket: 'running', reasons: ['open assignment'] };
}

export function projectWorkerOutcomeAttention(
  rawReport: WorkerOutcomeReport
): WorkerOutcomeAttention {
  const report = workerOutcomeReportSchema.parse(rawReport);
  const items: WorkerOutcomeItem[] = report.assignments.map(assignment => {
    const outcome =
      assignment.state === 'open'
        ? assignment.kind === 'pull-request'
          ? openPullRequestBucket(assignment)
          : openIssueBucket()
        : closedBucket(assignment);
    return {
      assignment_id: assignment.assignment_id,
      title: assignment.title,
      kind: assignment.kind,
      bucket: outcome.bucket,
      reasons: outcome.reasons,
      artifact_url: assignment.artifact_url,
      updated_at: assignment.updated_at,
    };
  });
  items.sort((left, right) =>
    right.updated_at.localeCompare(left.updated_at)
  );
  const counts: Record<WorkerOutcomeBucket, number> = {
    running: 0,
    'returned-unreviewed': 0,
    failed: 0,
    'needs-decision': 0,
    done: 0,
    unknown: 0,
  };
  for (const item of items) counts[item.bucket] += 1;
  return {
    schema: 'worker-outcome-attention/v1',
    observed_at: report.observed_at,
    counts,
    items,
  };
}
