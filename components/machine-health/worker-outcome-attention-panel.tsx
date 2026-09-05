import type { WorkerOutcomeSnapshot } from '@/app/lib/worker-outcome-source';
import type {
  WorkerOutcomeBucket,
  WorkerOutcomeItem,
} from '@/app/lib/worker-outcome-attention';

const BUCKET_ORDER: WorkerOutcomeBucket[] = [
  'needs-decision',
  'failed',
  'returned-unreviewed',
  'running',
  'unknown',
  'done',
];

const BUCKET_HEADINGS: Record<WorkerOutcomeBucket, string> = {
  'needs-decision': 'Needs a decision',
  failed: 'Failed or abandoned',
  'returned-unreviewed': 'Returned, unreviewed',
  running: 'Running',
  unknown: 'Unknown state',
  done: 'Done',
};

function updatedLabel(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return 'updated time unknown';
  return `updated ${new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(parsed))}`;
}

function OutcomeRow({ item }: { item: WorkerOutcomeItem }) {
  return (
    <li className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <div className="min-w-0">
        <a
          href={item.artifact_url}
          className="underline decoration-black/20 underline-offset-2 hover:decoration-black/60 dark:decoration-white/20 dark:hover:decoration-white/60"
        >
          <span className="font-mono text-xs opacity-55">
            {item.assignment_id}
          </span>{' '}
          <span className="font-medium">{item.title}</span>
        </a>
        <p className="mt-0.5 text-xs opacity-55">
          {item.reasons.join(' · ')} · {updatedLabel(item.updated_at)}
        </p>
      </div>
    </li>
  );
}

export function WorkerOutcomeAttentionPanel({
  snapshot,
}: {
  snapshot: WorkerOutcomeSnapshot;
}) {
  if (snapshot.status === 'unavailable')
    return (
      <section
        aria-label="Worker outcomes"
        className="mt-4 border-t border-black/15 pt-4 dark:border-white/15"
      >
        <h2 className="text-sm font-semibold tracking-tight">
          Worker outcomes
        </h2>
        <p className="mt-2 text-sm opacity-60">
          Assignment state unknown: {snapshot.reason}. No ledger was written;
          retry the page once the assignment transport recovers.
        </p>
      </section>
    );
  const { attention } = snapshot;
  const visible = BUCKET_ORDER.filter(
    bucket => attention.counts[bucket] > 0
  );
  return (
    <section
      aria-label="Worker outcomes"
      className="mt-4 border-t border-black/15 pt-4 dark:border-white/15"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-semibold tracking-tight">
          Worker outcomes
        </h2>
        <p className="text-[0.68rem] tabular-nums opacity-45">
          {attention.items.length} assignment
          {attention.items.length === 1 ? '' : 's'} · observed{' '}
          {updatedLabel(attention.observed_at)}
        </p>
      </div>
      {visible.length === 0 ? (
        <p className="mt-2 text-sm opacity-60">
          No open assignments on the canonical tracker.
        </p>
      ) : (
        <div className="mt-2 grid gap-x-8 gap-y-3 md:grid-cols-2">
          {visible.map(bucket => (
            <div key={bucket}>
              <h3 className="text-xs font-medium opacity-60">
                {BUCKET_HEADINGS[bucket]} ({attention.counts[bucket]})
              </h3>
              <ul className="divide-y divide-black/10 dark:divide-white/10">
                {attention.items
                  .filter(item => item.bucket === bucket)
                  .map(item => (
                    <OutcomeRow key={item.assignment_id} item={item} />
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
