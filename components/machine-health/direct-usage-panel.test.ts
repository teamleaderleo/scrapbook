import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import type {
  PeerUsageSampleRow,
  ProviderQuotaSampleRow,
} from '@/app/lib/agent-usage-store';
import { DirectUsagePanel, formatDuration } from './direct-usage-panel';

const NOW = Date.parse('2026-09-11T07:30:00.000Z');

function row(overrides: Partial<PeerUsageSampleRow> = {}): PeerUsageSampleRow {
  return {
    source: 'macbook-air',
    observedAt: '2026-09-11T06:00:00.000Z',
    provider: 'anthropic',
    harness: 'claude-code',
    model: 'claude-opus-5',
    effort: null,
    accountingContract: 'claude-code-transcript-usage/v1',
    inputTokens: 1_000_000,
    cachedInputTokens: 950_000,
    cacheWriteInputTokens: 40_000,
    reasoningTokens: null,
    outputTokens: 5_000,
    totalTokens: 1_005_000,
    requestCount: 12,
    successfulRequestCount: null,
    apiEquivalentEstimateUsd: 3.5,
    turnCount: null,
    agentStepCount: null,
    ...overrides,
  };
}

const quota: ProviderQuotaSampleRow = {
  source: 'macbook-air',
  observedAt: '2026-09-11T07:11:00.000Z',
  provider: 'anthropic',
  harness: 'claude-code',
  limitId: 'five_hour',
  windowMinutes: 300,
  percentOrientation: 'used',
  percentValue: 57,
  resetsAt: '2026-09-11T08:40:00.000Z',
};

function render(props: Parameters<typeof DirectUsagePanel>[0]) {
  return renderToStaticMarkup(createElement(DirectUsagePanel, props));
}

describe('DirectUsagePanel', () => {
  it('orders lanes by total tokens and labels each harness', () => {
    const html = render({
      samples: [
        row({
          provider: 'opencode-zen',
          harness: 't3code',
          model: 'muse-spark-1.3-contributor-free',
          accountingContract: 'opencode-message-usage/v1',
          totalTokens: 3_000_000,
          inputTokens: 2_990_000,
          cachedInputTokens: 1_900_000,
          outputTokens: 10_000,
          reasoningTokens: 4_000,
          requestCount: 30,
        }),
        row(),
        row({ observedAt: '2026-09-11T05:00:00.000Z' }),
      ],
      now: NOW,
    });
    const body = html.slice(html.indexOf('<tbody>'));
    expect(body.indexOf('t3code')).toBeLessThan(body.indexOf('Claude Code'));
    expect(body).toContain('muse-spark-1.3-contributor-free');
    expect(body).toContain('>24<');
    expect(body).toContain('95.0%');
  });

  it('keeps the API-equivalent estimate out of the public table', () => {
    const html = render({ samples: [row()], now: NOW });
    expect(html).not.toContain('$');
    expect(html).not.toContain('3.5');
  });

  it('shows Claude limits only when quota rows are supplied', () => {
    expect(render({ samples: [row()], now: NOW })).not.toContain('Claude Session');
    const html = render({ samples: [row()], quota: [quota], now: NOW });
    expect(html).toContain('Claude Session');
    expect(html).toContain('57% used');
    expect(html).toContain('resets in 1 hr 10 min');
    expect(html).toContain('checked 19 min ago');
  });

  it('reports an empty window instead of zeros', () => {
    const html = render({ samples: [], now: NOW });
    expect(html).toContain('No direct agent usage received in this window.');
    expect(html).not.toContain('<table');
  });
});

describe('formatDuration', () => {
  it('rounds to minutes, hours, then days', () => {
    expect(formatDuration(-5_000)).toBe('0 min');
    expect(formatDuration(59 * 60_000)).toBe('59 min');
    expect(formatDuration(90 * 60_000)).toBe('1 hr 30 min');
    expect(formatDuration(6 * 24 * 60 * 60_000)).toBe('6 days');
  });
});
