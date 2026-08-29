import { describe, expect, it } from 'vitest';

import type { MachineHealthSample } from '@/app/lib/machine-health-store';
import { buildActivityBins } from './machine-health-activity';

const now = Date.parse('2026-08-29T06:30:00.000Z');

function sample(
  checkedAt: string,
  overrides: Partial<MachineHealthSample> = {}
): MachineHealthSample {
  return {
    checkedAt,
    cpuUsedPercent: 20,
    rootUsedPercent: 10,
    memoryUsedPercent: 30,
    loadPerCpu: 0.1,
    peakSensorTemperatureC: 50,
    graphicsClockMhz: 400,
    networkRxMibS: 0.5,
    networkTxMibS: 0.25,
    browserRoots: 1,
    codexWorkers: 2,
    failedUnits: 0,
    unexpectedDevListeners: 0,
    ...overrides,
  };
}

describe('machine health activity bins', () => {
  it('builds 24 fixed hourly bins and averages samples in the same hour', () => {
    const bins = buildActivityBins(
      [
        sample('2026-08-29T06:05:00.000Z', { cpuUsedPercent: 10 }),
        sample('2026-08-29T06:25:00.000Z', { cpuUsedPercent: 30 }),
      ],
      '24h',
      now
    );

    expect(bins).toHaveLength(24);
    expect(bins.at(-1)).toMatchObject({
      sampleCount: 2,
      cpuUsedPercent: 20,
      networkMibS: 0.75,
    });
  });

  it('preserves empty bins rather than connecting observations across gaps', () => {
    const bins = buildActivityBins(
      [sample('2026-08-29T06:05:00.000Z')],
      '7d',
      now
    );

    expect(bins).toHaveLength(7);
    expect(bins.filter(bin => bin.sampleCount === 0)).toHaveLength(6);
    expect(bins.at(-1)?.sampleCount).toBe(1);
  });
});
