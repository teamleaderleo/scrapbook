import type {
  PeerUsageSampleRow,
  ProviderQuotaSampleRow,
} from '@/app/lib/agent-usage-store';
import { summarizePeerUsage } from '@/app/lib/peer-usage-summary';

const compact = (value: number) =>
  new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

export function formatDuration(milliseconds: number) {
  const minutes = Math.max(0, Math.round(milliseconds / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} hr ${minutes % 60} min`;
  return `${Math.floor(hours / 24)} days`;
}

const limitLabels: Record<string, string> = {
  five_hour: 'Session',
  seven_day: 'Weekly',
};

export function DirectUsagePanel({
  samples,
  quota = [],
  now,
}: {
  samples: PeerUsageSampleRow[];
  quota?: ProviderQuotaSampleRow[];
  now: number;
}) {
  const groups = summarizePeerUsage(samples).sort(
    (left, right) =>
      (right.totalTokens ?? 0) - (left.totalTokens ?? 0) ||
      left.lane.localeCompare(right.lane)
  );
  const largest = groups[0]?.totalTokens ?? 0;
  return (
    <section
      aria-label="Direct agent usage"
      className="dark:bg-black/15 mt-6 rounded-2xl border border-black/10 bg-white/70 p-5 dark:border-white/10"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold">Other agents</h2>
        <span className="text-xs opacity-50">Air Blue · last 30 days</span>
      </div>
      <p className="mt-1 text-xs opacity-60">
        Claude Code, opencode, and t3code sessions run directly on Air Blue.
        Codex is counted above.
      </p>
      {quota.length ? (
        <ul aria-label="Claude subscription limits" className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs tabular-nums">
          {quota.map(limit => (
            <li key={`${limit.source}/${limit.limitId}`}>
              <span className="opacity-60">
                Claude {limitLabels[limit.limitId] ?? limit.limitId}
              </span>{' '}
              <span className="font-medium">
                {limit.percentValue === null
                  ? '—'
                  : `${Math.round(limit.percentValue)}% ${limit.percentOrientation ?? ''}`}
              </span>
              {limit.resetsAt && Date.parse(limit.resetsAt) > now ? (
                <span className="opacity-60">
                  {' '}
                  · resets in {formatDuration(Date.parse(limit.resetsAt) - now)}
                </span>
              ) : null}
              <span className="opacity-45">
                {' '}
                · checked {formatDuration(now - Date.parse(limit.observedAt))} ago
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {groups.length === 0 ? (
        <p className="mt-3 text-sm opacity-70" role="status">
          No direct agent usage received in this window.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs tabular-nums">
            <thead className="border-b border-black/10 text-right dark:border-white/10">
              <tr>
                <th scope="col" className="py-2 text-left font-normal opacity-60">
                  Lane
                </th>
                <th scope="col" className="pl-3 font-normal opacity-60">
                  Requests
                </th>
                <th scope="col" className="pl-3 font-normal opacity-60">
                  Input
                </th>
                <th scope="col" className="pl-3 font-normal opacity-60">
                  Cache hit
                </th>
                <th scope="col" className="pl-3 font-normal opacity-60">
                  Output
                </th>
                <th scope="col" className="pl-3 font-normal opacity-60">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map(group => (
                <tr
                  key={`${group.provider}/${group.harness}/${group.model}`}
                  className="border-b border-black/5 dark:border-white/5"
                >
                  <th scope="row" className="py-3 text-left font-medium">
                    <span className="block">{group.lane}</span>
                    <span className="mt-0.5 block whitespace-nowrap font-normal opacity-60">
                      {group.model}
                    </span>
                    <span
                      aria-hidden="true"
                      className="mt-1.5 block h-0.5 bg-[#378690] dark:bg-[#66c0c8]"
                      style={{
                        width: `${largest ? (100 * (group.totalTokens ?? 0)) / largest : 0}%`,
                      }}
                    />
                  </th>
                  <td className="pl-3 text-right" title={group.runs.toLocaleString()}>
                    {group.runsUnknown ? '—' : compact(group.runs)}
                  </td>
                  <td
                    className="pl-3 text-right"
                    title={group.inputTokens?.toLocaleString() ?? 'input coverage unknown'}
                  >
                    {group.inputTokens === null ? '—' : compact(group.inputTokens)}
                  </td>
                  <td className="pl-3 text-right">
                    {group.inputTokens && group.cachedInputTokens !== null
                      ? `${((100 * group.cachedInputTokens) / group.inputTokens).toFixed(1)}%`
                      : '—'}
                  </td>
                  <td
                    className="pl-3 text-right"
                    title={group.outputTokens?.toLocaleString() ?? 'output coverage unknown'}
                  >
                    {group.outputTokens === null ? '—' : compact(group.outputTokens)}
                  </td>
                  <td
                    className="pl-3 text-right"
                    title={group.totalTokens?.toLocaleString() ?? 'total coverage unknown'}
                  >
                    {group.totalTokens === null ? '—' : compact(group.totalTokens)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
