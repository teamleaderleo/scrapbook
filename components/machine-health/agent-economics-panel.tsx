'use client';

import { analyzeAgentEconomics } from '@/app/lib/agent-economics-analysis';
import type { AgentEconomicsSample } from '@/app/lib/agent-economics-store';
import { useMemo } from 'react';

function metric(value: number | null, suffix = '') {
  if (value === null) return 'unknown';
  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 3,
  }).format(value)}${suffix}`;
}

function tokens(value: number | null) {
  if (value === null) return 'unknown';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

function dollars(value: number | null) {
  if (value === null) return 'unknown';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export function AgentEconomicsPanel({
  samples,
}: {
  samples: AgentEconomicsSample[];
}) {
  const summaries = useMemo(() => analyzeAgentEconomics(samples), [samples]);
  if (summaries.length === 0) return null;

  return (
    <section className="mt-4 border-t border-black/15 pt-4 dark:border-white/15">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-semibold tracking-tight">
          Agent task economics
        </h2>
        <p className="text-xs text-black/55 dark:text-white/55">
          accepted work per measured subscription quota · last 30 days
        </p>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-[920px] table-fixed text-left text-xs">
          <caption className="sr-only">
            Accepted task and subscription-quota economics by worker model
          </caption>
          <thead className="text-black/55 dark:text-white/55">
            <tr>
              <th scope="col" className="w-56 pb-2 pr-4 font-medium">Worker</th>
              <th scope="col" className="w-24 pb-2 pr-4 font-medium">Accepted</th>
              <th scope="col" className="w-24 pb-2 pr-4 font-medium">Tokens/task</th>
              <th scope="col" className="w-28 pb-2 pr-4 font-medium">Tasks/1% 5h</th>
              <th scope="col" className="w-28 pb-2 pr-4 font-medium">Tasks/1% week</th>
              <th scope="col" className="w-28 pb-2 pr-4 font-medium">Tasks/plan $</th>
              <th scope="col" className="w-36 pb-2 pr-4 font-medium">Tasks/hour/1%</th>
              <th scope="col" className="w-32 pb-2 font-medium">Operator min/task</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map(summary => (
              <tr
                key={summary.key}
                className="border-t border-black/10 align-top dark:border-white/10"
              >
                <td className="py-2.5 pr-4">
                  <div className="font-medium">{summary.model}</div>
                  <div className="mt-0.5 text-[11px] text-black/50 dark:text-white/50">
                    {summary.provider} · {summary.reasoningEffort} ·{' '}
                    {summary.harness}
                  </div>
                </td>
                <td className="py-2.5 pr-4">
                  <div>
                    {summary.acceptedTasks}/{summary.attempts}
                  </div>
                  <div className="mt-0.5 text-[11px] text-black/50 dark:text-white/50">
                    {summary.verifiedTasks} verified
                  </div>
                </td>
                <td className="py-2.5 pr-4">{tokens(summary.tokensPerAcceptedTask)}</td>
                <td className="py-2.5 pr-4">
                  {metric(summary.acceptedTasksPerFiveHourQuotaPercent)}
                  <div className="mt-0.5 text-[11px] text-black/50 dark:text-white/50">
                    {metric(summary.fiveHourQuotaPercent, '%')} measured
                  </div>
                </td>
                <td className="py-2.5 pr-4">
                  {metric(summary.acceptedTasksPerWeeklyQuotaPercent)}
                  <div className="mt-0.5 text-[11px] text-black/50 dark:text-white/50">
                    {metric(summary.weeklyQuotaPercent, '%')} measured
                  </div>
                </td>
                <td className="py-2.5 pr-4">
                  {metric(summary.acceptedTasksPerSubscriptionDollar)}
                  <div className="mt-0.5 text-[11px] text-black/50 dark:text-white/50">
                    {dollars(summary.subscriptionMonthlyDollars)}/mo
                  </div>
                </td>
                <td className="py-2.5 pr-4">
                  {metric(summary.acceptedTasksPerWallClockHourPerQuotaPercent)}
                </td>
                <td className="py-2.5">
                  {metric(summary.operatorMinutesPerAcceptedTask)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] leading-4 text-black/50 dark:text-white/50">
        Unknown means the harness or provider did not expose that dimension. A
        worker result counts only after external acceptance and verification.
        Plan-dollar yield is withheld unless every grouped attempt reports the
        same monthly subscription price.
      </p>
    </section>
  );
}
