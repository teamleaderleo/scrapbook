import type { PeerUsageSampleRow } from '@/app/lib/agent-usage-store';
import { summarizePeerUsage } from '@/app/lib/peer-usage-summary';

const compact = (value: number) =>
  new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

export function PeerUsagePanel({ samples }: { samples: PeerUsageSampleRow[] }) {
  const groups = summarizePeerUsage(samples);
  return (
    <section
      aria-label="Delegated peer usage"
      className="dark:bg-black/15 mt-6 rounded-2xl border border-black/10 bg-white/70 p-5 dark:border-white/10"
    >
      <h2 className="text-xl font-bold">Delegated peer usage</h2>
      <p className="mt-1 text-xs opacity-60">
        Subscription peers Codex delegates to — kept separate from Codex usage
        and from each other.
      </p>
      {groups.length === 0 ? (
        <p className="mt-3 text-sm opacity-70" role="status">
          Peer usage unavailable — no delegated-run receipts received in this
          window.
        </p>
      ) : (
        <>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs tabular-nums">
              <thead className="border-b border-black/10 text-right dark:border-white/10">
                <tr>
                  <th scope="col" className="py-2 text-left font-normal opacity-60">
                    Lane
                  </th>
                  <th scope="col" className="pl-3 font-normal opacity-60">
                    Runs
                  </th>
                  <th scope="col" className="pl-3 font-normal opacity-60">
                    Succeeded
                  </th>
                  <th scope="col" className="pl-3 font-normal opacity-60">
                    Input
                  </th>
                  <th scope="col" className="pl-3 font-normal opacity-60">
                    Cached
                  </th>
                  <th scope="col" className="pl-3 font-normal opacity-60">
                    Output / reasoning
                  </th>
                  <th scope="col" className="pl-3 font-normal opacity-60">
                    Total
                  </th>
                  <th scope="col" className="pl-3 font-normal opacity-60">
                    API-equiv. estimate
                  </th>
                </tr>
              </thead>
              <tbody>
                {groups.map(group => {
                  const cacheShare =
                    group.inputTokens && group.cachedInputTokens !== null
                      ? `${((100 * group.cachedInputTokens) / group.inputTokens).toFixed(1)}%`
                      : '—';
                  return (
                    <tr
                      key={`${group.provider}/${group.harness}/${group.model}/${group.effort ?? ''}`}
                      className="border-b border-black/5 dark:border-white/5"
                    >
                      <th scope="row" className="max-w-56 py-3 text-left font-medium">
                        <span className="block">{group.lane}</span>
                        <span className="mt-0.5 block font-normal opacity-60">
                          {group.model}
                          {group.effort ? ` · ${group.effort}` : ''}
                        </span>
                      </th>
                      <td
                        className="pl-3 text-right"
                        title={group.runsUnknown ? 'run coverage unknown' : group.runs.toLocaleString()}
                      >
                        {group.runsUnknown ? '—' : compact(group.runs)}
                      </td>
                      <td
                        className="pl-3 text-right"
                        title={
                          group.successfulRuns === null
                            ? 'success coverage unknown'
                            : group.successfulRuns.toLocaleString()
                        }
                      >
                        {group.successfulRuns === null ? '—' : compact(group.successfulRuns)}
                      </td>
                      <td
                        className="pl-3 text-right"
                        title={group.inputTokens === null ? 'input coverage unknown' : group.inputTokens.toLocaleString()}
                      >
                        {group.inputTokens === null ? '—' : compact(group.inputTokens)}
                      </td>
                      <td className="pl-3 text-right">{cacheShare}</td>
                      <td className="pl-3 text-right">
                        {group.outputTokens === null ? '—' : compact(group.outputTokens)}
                        {' / '}
                        {group.reasoningTokens === null ? '—' : compact(group.reasoningTokens)}
                      </td>
                      <td
                        className="pl-3 text-right"
                        title={group.totalTokens === null ? 'total coverage unknown' : group.totalTokens.toLocaleString()}
                      >
                        {group.totalTokens === null ? '—' : compact(group.totalTokens)}
                      </td>
                      <td
                        className="pl-3 text-right"
                        title={
                          group.apiEquivalentEstimateUsd === null
                            ? 'no API-equivalent estimate reported'
                            : `$${group.apiEquivalentEstimateUsd.toFixed(2)} API-equivalent estimate`
                        }
                      >
                        {group.apiEquivalentEstimateUsd === null
                          ? '—'
                          : `$${group.apiEquivalentEstimateUsd.toFixed(2)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ul className="mt-3 max-w-prose list-disc space-y-1 pl-4 text-xs leading-relaxed opacity-60">
            <li>
              Cached share is cached input divided by logical input; cached
              input is never added a second time.
            </li>
            <li>
              Succeeded means the delegated run exited 0. It is helper success,
              not accepted engineering work.
            </li>
            <li>
              The dollar figure is Claude&apos;s client-side API-equivalent
              estimate, never the subscription bill. Subscription runs have no
              marginal cost.
            </li>
          </ul>
        </>
      )}
    </section>
  );
}
