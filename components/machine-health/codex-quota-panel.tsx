import type { CodexQuotaSample } from '@/app/lib/codex-quota-store';

function bucketLabel(minutes: number) {
  if (minutes === 300) return '5-hour';
  if (minutes === 10_080) return 'Weekly';
  if (minutes % 1_440 === 0) return `${minutes / 1_440}-day`;
  if (minutes % 60 === 0) return `${minutes / 60}-hour`;
  return `${minutes}-minute`;
}

function resetLabel(value: string | null) {
  if (!value) return 'reset time unavailable';
  return `resets ${new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))}`;
}

export function CodexQuotaPanel({ samples }: { samples: CodexQuotaSample[] }) {
  if (samples.length === 0) return null;

  const latest = new Map<string, CodexQuotaSample>();
  for (const sample of samples) {
    latest.set(`${sample.limitId}\u0000${sample.windowMinutes}`, sample);
  }
  const buckets = [...latest.values()].sort(
    (left, right) => right.windowMinutes - left.windowMinutes
  );

  return (
    <section className="mt-4 border-t border-black/15 pt-4 dark:border-white/15">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-semibold tracking-tight">Codex allowance</h2>
        <p className="text-[0.68rem] opacity-45">
          Private · session rate-limit receipts
        </p>
      </div>
      <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {buckets.map(bucket => {
          const remaining = Math.max(0, 100 - bucket.usedPercent);
          return (
            <div
              key={`${bucket.limitId}-${bucket.windowMinutes}`}
              className="border-black/10 border-l pl-3 dark:border-white/10"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-xs font-medium opacity-60">
                  {bucketLabel(bucket.windowMinutes)}
                </span>
                <span className="font-mono text-lg tabular-nums">
                  {remaining.toFixed(remaining % 1 === 0 ? 0 : 1)}% left
                </span>
              </div>
              <div className="mt-1 flex flex-wrap justify-between gap-x-4 text-[0.68rem] tabular-nums opacity-45">
                <span>{bucket.usedPercent.toFixed(1)}% used</span>
                <span>{resetLabel(bucket.resetsAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
