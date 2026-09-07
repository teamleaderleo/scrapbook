import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { ActivityMonitorView, formatPower } from './machine-activity-monitor';
import { publicActivitySnapshot } from '@/app/lib/machine-activity';
import { activitySnapshot } from '@/tests/fixtures/machine-activity';
const now = Date.parse(activitySnapshot.checked_at);
const macSnapshot = {
  ...activitySnapshot,
  host: 'macbook-air' as const,
  panel: null,
  power: {
    primary: {
      watts: 8.65,
      scope: 'whole-system' as const,
      source: 'apple-power-telemetry' as const,
      quality: 'measured' as const,
    },
    platform: null,
    package: null,
    system_load: {
      watts: 8.65,
      scope: 'whole-system' as const,
      source: 'apple-power-telemetry' as const,
      quality: 'measured' as const,
    },
    adapter_input: null,
    battery_flow: null,
  },
};
function render(privateAccess: boolean, time = now) {
  return renderSnapshots([activitySnapshot, macSnapshot], privateAccess, time);
}
function renderSnapshots(
  latest: Array<typeof activitySnapshot>,
  privateAccess: boolean,
  time = now
) {
  return renderToStaticMarkup(
    createElement(ActivityMonitorView, {
      now: time,
      error: false,
      refresh: vi.fn(),
      data: {
        observedAt: activitySnapshot.checked_at,
        privateAccess,
        latest,
        history: latest.map(publicActivitySnapshot),
      },
    })
  );
}
it('shows grouped cores, concrete resources, live panel state and private ranking', () => {
  const html = render(true);
  expect(html).toContain('Low-power efficiency');
  expect(html).toContain('Performance core 0: 80.0%');
  expect(html).toContain('15.0 / 30.0 GiB');
  expect(html).toContain('Physical panel');
  expect(html).toContain('Off · 0.0%');
  expect(html).toContain('28.4 W · measured platform');
  expect(html).toContain('Intel RAPL psys');
  expect(html).toContain('16.2 W · measured');
  expect(html).toContain('Combined power');
  expect(html).toContain('37.0 W · measured mixed');
  expect(html).toContain('PRIVATE-PROCESS');
});
it('labels package, input, and modeled watts without promoting their scope', () => {
  expect(formatPower({ watts: 2.1, scope: 'cpu-package', source: 'intel-rapl-package', quality: 'measured' })).toBe('2.1 W · CPU package');
  expect(formatPower({ watts: 5.4, scope: 'adapter-input', source: 'linux-power-supply', quality: 'measured' })).toBe('5.4 W · measured input');
  expect(formatPower({ watts: 7, scope: 'whole-system', source: 'modeled-v1', quality: 'modeled' })).toBe('~7.0 W · modeled system');
});
it('does not combine CPU-package power with a whole-system reading', () => {
  const packageOnly = {
    ...activitySnapshot,
    power: {
      ...activitySnapshot.power!,
      primary: activitySnapshot.power!.package,
      platform: null,
    },
  };
  expect(renderSnapshots([packageOnly, macSnapshot], false)).not.toContain(
    'Combined power'
  );
});
it('does not render process names for a public reader even if passed a private snapshot', () => {
  expect(render(false)).not.toContain('PRIVATE-PROCESS');
});
it('marks old observations stale and withholds old process rankings', () => {
  const html = render(true, now + 4 * 60000);
  expect(html).toContain('Stale');
  expect(html).not.toContain('PRIVATE-PROCESS');
});
