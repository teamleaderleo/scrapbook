import type { CodexTokenSample } from '@/app/lib/machine-health-store';

const HOUR_MS = 60 * 60_000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

export type WeeklyCodexUsageSnapshot = {
  start: number;
  end: number;
  current: boolean;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  totalTokens: number;
  modelCalls: number;
  sourceHours: number;
};

function startOfUtcWeek(timestamp: number) {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  return date.getTime() - mondayOffset * DAY_MS;
}

export function buildWeeklyCodexUsageSnapshots(
  samples: CodexTokenSample[],
  now: number,
  limit = 8
): WeeklyCodexUsageSnapshot[] {
  const completeHourEnd = Math.floor(now / HOUR_MS) * HOUR_MS;
  const currentWeekStart = startOfUtcWeek(completeHourEnd);

  return Array.from({ length: limit }, (_, index) => {
    const start = currentWeekStart - index * WEEK_MS;
    const end = start + WEEK_MS;
    const effectiveEnd = Math.min(end, completeHourEnd);
    const counted = samples.filter(sample => {
      if (sample.accountingState !== 'counted') return false;
      const hour = Date.parse(sample.windowStartedAt);
      return hour >= start && hour < effectiveEnd;
    });

    return {
      start,
      end,
      current: start === currentWeekStart,
      inputTokens: counted.reduce((sum, sample) => sum + sample.inputTokens, 0),
      cachedInputTokens: counted.reduce(
        (sum, sample) => sum + sample.cachedInputTokens,
        0
      ),
      outputTokens: counted.reduce((sum, sample) => sum + sample.outputTokens, 0),
      totalTokens: counted.reduce((sum, sample) => sum + sample.totalTokens, 0),
      modelCalls: counted.reduce((sum, sample) => sum + sample.modelCalls, 0),
      sourceHours: counted.length,
    };
  }).filter(snapshot => snapshot.sourceHours > 0);
}

function compact(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

function weekLabel(start: number, end: number) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  return `${formatter.format(start)}–${formatter.format(end - DAY_MS)}`;
}

function ratio(numerator: number, denominator: number, digits = 2) {
  return denominator > 0
    ? `${((100 * numerator) / denominator).toFixed(digits)}%`
    : '—';
}

export function WeeklyCodexUsage({
  samples,
  now,
}: {
  samples: CodexTokenSample[];
  now: number;
}) {
  const snapshots = buildWeeklyCodexUsageSnapshots(samples, now);
  if (snapshots.length === 0) return null;

  return (
    <section className="mt-6" aria-labelledby="weekly-codex-usage-heading">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2 px-1">
        <div>
          <h2
            id="weekly-codex-usage-heading"
            className="text-xl font-semibold tracking-tight"
          >
            Weekly usage
          </h2>
          <p className="mt-0.5 text-xs opacity-50">
            UTC calendar weeks · complete hourly Codex ledger
          </p>
        </div>
        <p className="text-xs tabular-nums opacity-45">
          {snapshots.length} week{snapshots.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-white/45 shadow-[0_1px_1px_rgba(0,0,0,0.035)] dark:border-white/[0.07] dark:bg-white/[0.045] dark:shadow-none">
        <table className="w-full min-w-[46rem] text-sm tabular-nums">
          <thead className="border-b border-black/[0.065] text-xs opacity-55 dark:border-white/[0.075]">
            <tr>
              <th className="px-5 py-3 text-left font-medium" scope="col">
                Week
              </th>
              <th className="px-3 py-3 text-right font-medium" scope="col">
                Total
              </th>
              <th className="px-3 py-3 text-right font-medium" scope="col">
                Input
              </th>
              <th className="px-3 py-3 text-right font-medium" scope="col">
                Cache hit
              </th>
              <th className="px-3 py-3 text-right font-medium" scope="col">
                Output
              </th>
              <th className="px-3 py-3 text-right font-medium" scope="col">
                Output share
              </th>
              <th className="px-5 py-3 text-right font-medium" scope="col">
                Calls
              </th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map(snapshot => (
              <tr
                key={snapshot.start}
                className="border-b border-black/[0.055] last:border-b-0 dark:border-white/[0.065]"
              >
                <th className="px-5 py-3 text-left font-medium" scope="row">
                  {weekLabel(snapshot.start, snapshot.end)}
                  {snapshot.current ? (
                    <span className="ml-2 text-xs font-normal opacity-45">
                      so far
                    </span>
                  ) : null}
                </th>
                <td className="px-3 py-3 text-right font-semibold">
                  {compact(snapshot.totalTokens)}
                </td>
                <td className="px-3 py-3 text-right">
                  {compact(snapshot.inputTokens)}
                </td>
                <td className="px-3 py-3 text-right">
                  {ratio(snapshot.cachedInputTokens, snapshot.inputTokens)}
                </td>
                <td className="px-3 py-3 text-right">
                  {compact(snapshot.outputTokens)}
                </td>
                <td className="px-3 py-3 text-right">
                  {ratio(snapshot.outputTokens, snapshot.totalTokens, 3)}
                </td>
                <td className="px-5 py-3 text-right">
                  {snapshot.modelCalls.toLocaleString('en-US')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
