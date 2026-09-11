import { describe, expect, it } from 'vitest';
import {
  estimateTaskEquivalents,
  taskEquivalentBenchmark,
} from './agent-task-equivalents';

describe('taskEquivalentBenchmark', () => {
  it('uses Sol High when Codex telemetry has no effort attribution', () => {
    expect(taskEquivalentBenchmark('gpt-5.6-sol')).toEqual({
      label: 'Sol High working benchmark',
      tokensPerTaskMin: 8_000_000,
      tokensPerTaskMax: 8_000_000,
    });
    expect(taskEquivalentBenchmark('gpt-5.6-sol', 'medium')).toBeNull();
  });

  it('uses an Astra Low–Medium range when effort is unknown', () => {
    expect(taskEquivalentBenchmark('gpt-6-astra')).toEqual({
      label: 'Astra Low–Medium working range',
      tokensPerTaskMin: 1_100_000,
      tokensPerTaskMax: 1_710_000,
    });
    expect(taskEquivalentBenchmark('gpt-6-astra', 'low')).toMatchObject({
      tokensPerTaskMin: 1_100_000,
      tokensPerTaskMax: 1_100_000,
    });
    expect(taskEquivalentBenchmark('gpt-6-astra', 'medium')).toMatchObject({
      tokensPerTaskMin: 1_710_000,
      tokensPerTaskMax: 1_710_000,
    });
  });

  it('maps provider-default Muse telemetry to the XHigh working range', () => {
    expect(taskEquivalentBenchmark('muse-spark', 'provider-default')).toEqual({
      label: 'Muse Spark XHigh working range',
      tokensPerTaskMin: 14_800_000,
      tokensPerTaskMax: 16_200_000,
    });
  });
});

describe('estimateTaskEquivalents', () => {
  it('converts recorded tokens into exact and ranged task equivalents', () => {
    expect(
      estimateTaskEquivalents({
        model: 'gpt-5.6-sol',
        totalTokens: 16_000_000,
      })
    ).toMatchObject({ min: 2, max: 2 });

    const astra = estimateTaskEquivalents({
      model: 'gpt-6-astra',
      totalTokens: 3_420_000,
    });
    expect(astra?.min).toBeCloseTo(2, 8);
    expect(astra?.max).toBeCloseTo(3.1090909, 7);

    const muse = estimateTaskEquivalents({
      model: 'muse-spark',
      effort: 'provider-default',
      totalTokens: 16_200_000,
    });
    expect(muse?.min).toBeCloseTo(1, 8);
    expect(muse?.max).toBeCloseTo(1.0945946, 7);
  });

  it('leaves unknown models and unavailable totals unestimated', () => {
    expect(
      estimateTaskEquivalents({ model: 'future-model', totalTokens: 1_000_000 })
    ).toBeNull();
    expect(
      estimateTaskEquivalents({ model: 'gpt-5.6-sol', totalTokens: null })
    ).toBeNull();
  });
});
