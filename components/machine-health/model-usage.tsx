'use client';

import { useState } from 'react';
import type { CodexTokenSample } from '@/app/lib/machine-health-store';

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

export function ModelUsage({
  samples,
  from,
  to,
}: {
  samples: CodexTokenSample[];
  from: number;
  to: number;
}) {
  const [sort, setSort] = useState<'input' | 'output' | 'calls'>('input');
  const rows = summarizeModels(samples, from, to).sort(
    (a, b) => b[sort] - a[sort] || a.model.localeCompare(b.model)
  );
  const total = rows.reduce((sum, row) => sum + row[sort], 0);
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
        <p className="mt-2 text-xs opacity-60">No usage in this period.</p>
      </section>
    );
  return (
    <section
      aria-label="Model usage"
      className="mt-5 border-t border-black/10 pt-4 dark:border-white/10"
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3
          id="model-usage-heading"
          className="scroll-mt-20 text-sm font-medium"
        >
          Models
        </h3>
        <span className="text-xs opacity-50">Both machines</span>
      </div>
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
                      width: `${total ? (100 * row[sort]) / total : 0}%`,
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
      <details className="mt-2 text-xs opacity-60">
        <summary className="cursor-pointer py-2">Usage accounting</summary>
        <p className="max-w-prose leading-relaxed">
          Complete hours from local Codex logs. Input includes cached tokens;
          output includes reasoning. Models come from recorded turn context.
          Unattributed usage has no model breakdown. Overlapping machine reports
          are excluded from these totals.
        </p>
      </details>
    </section>
  );
}
