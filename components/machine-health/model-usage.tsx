'use client';

import {
  estimateTaskEquivalents,
  TASK_EQUIVALENT_BENCHMARK_REVISION,
  type TaskEquivalentEstimate,
} from '@/app/lib/agent-task-equivalents';
import type { CodexTokenSample } from '@/app/lib/machine-health-store';
import { useState, type ReactNode } from 'react';

export function summarizeModels(
  samples: CodexTokenSample[],
  from: number,
  to: number
) {
  const models = new Map<
    string,
    {
      model: string;
      calls: number;
      input: number;
      cached: number;
      output: number;
    }
  >();
  for (const sample of samples) {
    const time = Date.parse(sample.windowStartedAt);
    if (sample.accountingState !== 'counted' || time < from || time >= to)
      continue;
    const rows = sample.modelUsage ?? [
      {
        model: 'unknown',
        model_calls: sample.modelCalls,
        input_tokens: sample.inputTokens,
        cached_input_tokens: sample.cachedInputTokens,
        output_tokens: sample.outputTokens,
      },
    ];
    for (const row of rows) {
      const total = models.get(row.model) ?? {
        model: row.model,
        calls: 0,
        input: 0,
        cached: 0,
        output: 0,
      };
      total.calls += row.model_calls;
      total.input += row.input_tokens;
      total.cached += row.cached_input_tokens;
      total.output += row.output_tokens;
      models.set(row.model, total);
    }
  }
  return [...models.values()].filter(
    row => row.calls > 0 || row.input > 0 || row.output > 0
  );
}

const compact = (value: number) =>
  new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

function formatTaskEstimate(estimate: TaskEquivalentEstimate): string {
  const min = compact(estimate.min);
  const max = compact(estimate.max);
  return estimate.min === estimate.max ? `~${min}` : `~${min}–${max}`;
}

function formatTokensPerTask(estimate: TaskEquivalentEstimate): string {
  const min = compact(estimate.tokensPerTaskMin);
  const max = compact(estimate.tokensPerTaskMax);
  return estimate.tokensPerTaskMin === estimate.tokensPerTaskMax
    ? `${min} tokens/task`
    : `${min}–${max} tokens/task`;
}

function taskEstimateTitle(estimate: TaskEquivalentEstimate): string {
  return `${estimate.label} · ${formatTokensPerTask(estimate)} · benchmark revision ${TASK_EQUIVALENT_BENCHMARK_REVISION}`;
}

export function ModelUsage({
  samples,
  from,
  to,
  controls,
}: {
  samples: CodexTokenSample[];
  from: number;
  to: number;
  controls?: ReactNode;
}) {
  const [sort, setSort] = useState<'input' | 'output' | 'calls'>('input');
  const rows = summarizeModels(samples, from, to)
    .map(row => ({
      ...row,
      taskEstimate: estimateTaskEquivalents({
        model: row.model,
        totalTokens: row.input + row.output,
      }),
    }))
    .sort((a, b) => b[sort] - a[sort] || a.model.localeCompare(b.model));
  const sortTotal = rows.reduce((sum, row) => sum + row[sort], 0);
  const taskRows = rows.filter(
    (row): row is typeof row & { taskEstimate: TaskEquivalentEstimate } =>
      row.taskEstimate !== null
  );
  const taskEstimate = taskRows.length
    ? {
        min: taskRows.reduce((sum, row) => sum + row.taskEstimate.min, 0),
        max: taskRows.reduce((sum, row) => sum + row.taskEstimate.max, 0),
      }
    : null;
  const recordedTokens = rows.reduce(
    (sum, row) => sum + row.input + row.output,
    0
  );
  const benchmarkedTokens = taskRows.reduce(
    (sum, row) => sum + row.input + row.output,
    0
  );
  const benchmarkCoverage = recordedTokens
    ? (100 * benchmarkedTokens) / recordedTokens
    : 0;

  if (!rows.length)
    return (
      <section
        aria-label="Model usage"
        className="mt-5 border-t border-black/10 pt-4 dark:border-white/10"
      >
        <h3
          id="model-usage-heading"
          className="scroll-mt-20 text-sm font-medium"
        >
          Models
        </h3>
        <div className="mt-2">{controls}</div>
        <p className="mt-2 text-xs opacity-60">No usage in this period.</p>
      </section>
    );

  return (
    <section
      aria-label="Model usage"
      className="mt-5 border-t border-black/10 pt-4 dark:border-white/10"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3
          id="model-usage-heading"
          className="scroll-mt-20 text-sm font-medium"
        >
          Models
        </h3>
        {controls ?? <span className="text-xs opacity-50">Both machines</span>}
      </div>
      {taskEstimate ? (
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-y border-black/[0.055] py-2 dark:border-white/[0.065]">
          <span className="text-xs opacity-60">Estimated work</span>
          <span
            className="text-sm font-semibold tabular-nums"
            title={`${benchmarkCoverage.toFixed(1)}% of recorded tokens covered by a working task benchmark`}
          >
            {taskEstimate.min === taskEstimate.max
              ? `~${compact(taskEstimate.min)}`
              : `~${compact(taskEstimate.min)}–${compact(taskEstimate.max)}`}{' '}
            <span className="text-xs font-normal opacity-55">task eq.</span>
          </span>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full text-xs tabular-nums">
          <thead className="border-b border-black/10 text-right dark:border-white/10">
            <tr>
              <th scope="col" className="py-2 text-left font-normal opacity-60">
                Model
              </th>
              {(['calls', 'input', 'output'] as const).map(key => (
                <th
                  key={key}
                  scope="col"
                  aria-sort={sort === key ? 'descending' : 'none'}
                  className="pl-3 font-normal"
                >
                  <button
                    type="button"
                    className="min-h-8 capitalize focus-visible:outline-2"
                    onClick={() => setSort(key)}
                  >
                    {key}
                    {sort === key ? ' ↓' : ''}
                  </button>
                </th>
              ))}
              <th scope="col" className="pl-3 font-normal opacity-60">
                Est. tasks
              </th>
              <th scope="col" className="pl-3 font-normal opacity-60">
                Cache hit
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.model}
                className="border-b border-black/5 dark:border-white/5"
              >
                <th scope="row" className="max-w-52 py-3 text-left font-medium">
                  <span className="break-all">
                    {row.model === 'unknown' ? 'Unattributed' : row.model}
                  </span>
                  <span
                    aria-hidden="true"
                    className="mt-1.5 block h-0.5 bg-[#378690] dark:bg-[#66c0c8]"
                    style={{
                      width: `${sortTotal ? (100 * row[sort]) / sortTotal : 0}%`,
                    }}
                  />
                </th>
                <td
                  className="pl-3 text-right"
                  title={row.calls.toLocaleString()}
                >
                  {compact(row.calls)}
                </td>
                <td
                  className="pl-3 text-right"
                  title={row.input.toLocaleString()}
                >
                  {compact(row.input)}
                </td>
                <td
                  className="pl-3 text-right"
                  title={row.output.toLocaleString()}
                >
                  {compact(row.output)}
                </td>
                <td
                  className="pl-3 text-right"
                  title={
                    row.taskEstimate
                      ? taskEstimateTitle(row.taskEstimate)
                      : 'No working task benchmark for this model'
                  }
                >
                  {row.taskEstimate ? formatTaskEstimate(row.taskEstimate) : '—'}
                </td>
                <td className="pl-3 text-right">
                  {row.input
                    ? ((100 * row.cached) / row.input).toFixed(1) + '%'
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {taskEstimate ? (
        <p className="mt-2 max-w-prose text-[0.7rem] leading-relaxed opacity-50">
          Est. tasks are normalized coding-task equivalents derived from recorded
          tokens and model-specific working benchmarks. Coverage:{' '}
          {benchmarkCoverage.toFixed(1)}% of recorded tokens. Accepted worker
          outcomes stay separate.
        </p>
      ) : null}
    </section>
  );
}
