import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import { healthyMachineReport } from '@/tests/fixtures/machine-health';
import { MachineHealthDashboard } from './machine-health-dashboard';

const checkedAt = healthyMachineReport.checked_at;
const report = {
  host: 'big-red' as const,
  payload: healthyMachineReport,
  checkedAt,
  updatedAt: checkedAt,
};
const samples = Array.from({ length: 4 }, (_, index) => ({
  checkedAt: new Date(
    Date.parse(checkedAt) - (3 - index) * 86_400_000
  ).toISOString(),
  rootUsedPercent: 11 + index,
  memoryUsedPercent: 20 + index,
  loadPerCpu: 0.08 + index / 100,
  peakSensorTemperatureC: 50 + index,
  failedUnits: 0,
  unexpectedDevListeners: 0,
}));

describe('machine health dashboard', () => {
  it('renders a summary-first healthy snapshot without sensitive detail fields', () => {
    const html = renderToStaticMarkup(
      createElement(MachineHealthDashboard, {
        report,
        samples,
        now: Date.parse(checkedAt) + 20 * 60_000,
      })
    );

    expect(html).toContain('Looks good');
    expect(html).toContain('No configured guardrail is currently tripped.');
    expect(html).toContain('4 snapshots · 30d view');
    expect(html).toContain(
      'No IP addresses, URLs, tab titles, command lines, ports'
    );
    expect(html).not.toContain('private_ip');
    expect(html).not.toContain('process_arguments');
  });

  it('turns an otherwise healthy but stale report into a visible watch state', () => {
    const html = renderToStaticMarkup(
      createElement(MachineHealthDashboard, {
        report,
        samples,
        now: Date.parse(checkedAt) + 40 * 60 * 60_000,
      })
    );

    expect(html).toContain('Worth a look');
    expect(html).toContain('Snapshot is 40 hours old.');
  });
});
