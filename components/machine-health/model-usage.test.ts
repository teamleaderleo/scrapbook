import { expect, it } from 'vitest';
import { summarizeModels } from './model-usage';
import type { CodexTokenSample } from '@/app/lib/machine-health-store';

const sample: CodexTokenSample = {
  source: 'big-red',
  accountingState: 'counted',
  windowStartedAt: '2026-09-05T01:00:00Z',
  windowEndedAt: '2026-09-05T02:00:00Z',
  inputTokens: 100,
  cachedInputTokens: 60,
  cacheWriteInputTokens: 0,
  outputTokens: 20,
  reasoningOutputTokens: 10,
  totalTokens: 120,
  modelCalls: 2,
  activeRoutes: 1,
};
const from = Date.parse(sample.windowStartedAt),
  to = Date.parse(sample.windowEndedAt);
it('keeps legacy usage unattributed and excludes overlap and out-of-range rows', () => {
  const rows = summarizeModels(
    [
      sample,
      { ...sample, accountingState: 'overlap-skipped' },
      { ...sample, windowStartedAt: '2026-09-04T01:00:00Z' },
    ],
    from,
    to
  );
  expect(rows).toEqual([
    { model: 'unknown', calls: 2, input: 100, cached: 60, output: 20 },
  ]);
});
it('combines the same model across hosts without re-adding window totals', () => {
  const detailed = {
    ...sample,
    modelUsage: [
      {
        model: 'test-model',
        input_tokens: 100,
        cached_input_tokens: 60,
        cache_write_input_tokens: 0,
        output_tokens: 20,
        reasoning_output_tokens: 10,
        total_tokens: 120,
        model_calls: 2,
      },
    ],
  };
  expect(
    summarizeModels(
      [detailed, { ...detailed, source: 'macbook-air' }],
      from,
      to
    )
  ).toEqual([
    { model: 'test-model', calls: 4, input: 200, cached: 120, output: 40 },
  ]);
});
