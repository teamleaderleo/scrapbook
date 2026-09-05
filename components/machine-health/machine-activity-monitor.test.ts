import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { ActivityMonitorView } from './machine-activity-monitor';
import { publicActivitySnapshot } from '@/app/lib/machine-activity';
import { activitySnapshot } from '@/tests/fixtures/machine-activity';
const now = Date.parse(activitySnapshot.checked_at);
function render(privateAccess: boolean, time = now) {
  return renderToStaticMarkup(
    createElement(ActivityMonitorView, {
      now: time,
      error: false,
      refresh: vi.fn(),
      data: {
        observedAt: activitySnapshot.checked_at,
        privateAccess,
        latest: [activitySnapshot],
        history: [publicActivitySnapshot(activitySnapshot)],
      },
    })
  );
}
it('shows grouped cores, concrete resources and private ranking', () => {
  const html = render(true);
  expect(html).toContain('Low-power efficiency');
  expect(html).toContain('Performance core 0: 80.0%');
  expect(html).toContain('15.0 / 30.0 GiB');
  expect(html).toContain('PRIVATE-PROCESS');
});
it('does not render process names for a public reader even if passed a private snapshot', () => {
  expect(render(false)).not.toContain('PRIVATE-PROCESS');
});
it('marks old observations stale and withholds old process rankings', () => {
  const html = render(true, now + 4 * 60000);
  expect(html).toContain('Stale');
  expect(html).not.toContain('PRIVATE-PROCESS');
});
