const MILLION = 1_000_000;

export type TaskEquivalentBenchmark = {
  label: string;
  tokensPerTaskMin: number;
  tokensPerTaskMax: number;
};

export type TaskEquivalentEstimate = TaskEquivalentBenchmark & {
  min: number;
  max: number;
};

export const TASK_EQUIVALENT_BENCHMARK_REVISION = '2026-09-10';

// Working task units for dashboard normalization. Sol High and Muse Spark XHigh
// use Artificial Analysis Coding Agent token/task measurements; Astra Low/Medium
// uses the working token/task estimates derived from its coding cost/task and the
// measured Codex token mix discussed alongside this dashboard.
function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');
}

function unspecifiedEffort(effort: string): boolean {
  return effort === '' || effort === 'default' || effort === 'provider-default';
}

export function taskEquivalentBenchmark(
  model: string,
  effort?: string | null
): TaskEquivalentBenchmark | null {
  const normalizedModel = normalize(model);
  const normalizedEffort = normalize(effort);

  if (
    normalizedModel.includes('gpt-5.6-sol') ||
    normalizedModel === 'sol'
  ) {
    if (!unspecifiedEffort(normalizedEffort) && normalizedEffort !== 'high')
      return null;
    return {
      label: 'Sol High working benchmark',
      tokensPerTaskMin: 8 * MILLION,
      tokensPerTaskMax: 8 * MILLION,
    };
  }

  if (normalizedModel.includes('astra')) {
    if (normalizedEffort === 'low')
      return {
        label: 'Astra Low working estimate',
        tokensPerTaskMin: 1.1 * MILLION,
        tokensPerTaskMax: 1.1 * MILLION,
      };
    if (normalizedEffort === 'medium')
      return {
        label: 'Astra Medium working estimate',
        tokensPerTaskMin: 1.71 * MILLION,
        tokensPerTaskMax: 1.71 * MILLION,
      };
    if (unspecifiedEffort(normalizedEffort))
      return {
        label: 'Astra Low–Medium working range',
        tokensPerTaskMin: 1.1 * MILLION,
        tokensPerTaskMax: 1.71 * MILLION,
      };
    return null;
  }

  if (
    normalizedModel.includes('muse-spark') ||
    normalizedModel === 'muse'
  ) {
    if (
      !unspecifiedEffort(normalizedEffort) &&
      normalizedEffort !== 'xhigh' &&
      normalizedEffort !== 'extra-high'
    )
      return null;
    return {
      label: 'Muse Spark XHigh working range',
      tokensPerTaskMin: 14.8 * MILLION,
      tokensPerTaskMax: 16.2 * MILLION,
    };
  }

  return null;
}

export function estimateTaskEquivalents({
  model,
  effort,
  totalTokens,
}: {
  model: string;
  effort?: string | null;
  totalTokens: number | null;
}): TaskEquivalentEstimate | null {
  if (totalTokens === null || !Number.isFinite(totalTokens) || totalTokens < 0)
    return null;
  const benchmark = taskEquivalentBenchmark(model, effort);
  if (!benchmark) return null;
  return {
    ...benchmark,
    min: totalTokens / benchmark.tokensPerTaskMax,
    max: totalTokens / benchmark.tokensPerTaskMin,
  };
}
