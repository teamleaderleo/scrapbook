import { describe, expect, it } from 'vitest';

import {
  parseAntigravityCumulativeUsage,
  projectAntigravityHeadlessUsage,
  projectAntigravityStatusLineQuota,
} from './antigravity-telemetry';

const observedAt = '2026-08-31T18:29:30Z';

function usageContext(
  overrides: Partial<Parameters<typeof projectAntigravityHeadlessUsage>[1]> = {}
) {
  return {
    sampleId: 'agy-task-1',
    observedAt,
    model: 'gemini-3.7-flash-high',
    effort: 'high',
    runRef: 'stensibly:run_abc123',
    sessionMode: 'fresh' as const,
    ...overrides,
  };
}

describe('Antigravity telemetry projection', () => {
  it('projects the documented headless JSON usage without retaining response identity', () => {
    const sample = projectAntigravityHeadlessUsage(
      {
        conversation_id: 'private-conversation-id',
        status: 'SUCCESS',
        response: 'private response text',
        duration_seconds: 7.16,
        num_turns: 1,
        usage: {
          input_tokens: 10_415,
          output_tokens: 657,
          thinking_tokens: 616,
          cache_read_tokens: 8_113,
          total_tokens: 11_072,
        },
      },
      usageContext()
    );

    expect(sample).toMatchObject({
      provider: 'google',
      harness: 'antigravity',
      model: 'gemini-3.7-flash-high',
      accounting_contract: 'antigravity-headless-usage-delta/v1',
      input_tokens: 10_415,
      cached_input_tokens: 8_113,
      cache_write_input_tokens: null,
      reasoning_tokens: 616,
      output_tokens: 657,
      total_tokens: 11_072,
      request_count: null,
      turn_count: 1,
      agent_step_count: null,
    });
    expect(JSON.stringify(sample)).not.toContain('private-conversation-id');
    expect(JSON.stringify(sample)).not.toContain('private response text');
  });

  it('subtracts the documented cumulative counters for a resumed conversation', () => {
    const baseline = parseAntigravityCumulativeUsage({
      status: 'SUCCESS',
      num_turns: 1,
      usage: {
        input_tokens: 30_384,
        output_tokens: 4,
        thinking_tokens: 0,
        cache_read_tokens: 0,
        total_tokens: 30_388,
      },
    });

    const sample = projectAntigravityHeadlessUsage(
      {
        status: 'SUCCESS',
        num_turns: 2,
        usage: {
          input_tokens: 30_662,
          output_tokens: 8,
          thinking_tokens: 0,
          cache_read_tokens: 30_214,
          total_tokens: 30_670,
        },
      },
      usageContext({ sessionMode: 'resumed', baseline })
    );

    expect(sample).toMatchObject({
      input_tokens: 278,
      cached_input_tokens: 30_214,
      reasoning_tokens: 0,
      output_tokens: 4,
      total_tokens: 282,
      turn_count: 1,
    });
  });

  it('refuses resumed usage without an exact cumulative baseline', () => {
    expect(() =>
      projectAntigravityHeadlessUsage(
        {
          status: 'SUCCESS',
          num_turns: 2,
          usage: {
            input_tokens: 30_662,
            output_tokens: 8,
            thinking_tokens: 0,
            cache_read_tokens: 30_214,
            total_tokens: 30_670,
          },
        },
        usageContext({ sessionMode: 'resumed' })
      )
    ).toThrow('require a cumulative baseline');
  });

  it('refuses a cumulative counter regression instead of inventing a delta', () => {
    expect(() =>
      projectAntigravityHeadlessUsage(
        {
          status: 'SUCCESS',
          num_turns: 2,
          usage: {
            input_tokens: 90,
            output_tokens: 20,
            thinking_tokens: 5,
            cache_read_tokens: 10,
            total_tokens: 110,
          },
        },
        usageContext({
          sessionMode: 'resumed',
          baseline: {
            inputTokens: 100,
            cachedInputTokens: 0,
            reasoningTokens: 0,
            outputTokens: 10,
            totalTokens: 110,
            turns: 1,
          },
        })
      )
    ).toThrow('input_tokens regressed');
  });

  it('projects only allowlisted model/plan/quota facts from a private status payload', () => {
    const rows = projectAntigravityStatusLineQuota(
      {
        product: 'antigravity',
        cwd: '/home/leo/private-project',
        session_id: 'private-session-id',
        conversation_id: 'private-conversation-id',
        transcript_path: '/home/leo/private-transcript.jsonl',
        email: 'developer@example.com',
        model: {
          id: 'gemini-3.7-flash-high',
          display_name: 'Gemini 3.7 Flash High',
        },
        plan_tier: 'Pro',
        quota: {
          'gemini-weekly': {
            remaining_fraction: 0.9378,
            reset_time: '2026-09-06T07:50:32Z',
            reset_in_seconds: 560_580,
          },
          'gemini-5h': {
            remaining_fraction: 0.99,
            reset_time: '2026-08-31T23:00:00Z',
            reset_in_seconds: 14_400,
          },
        },
        sandbox: { enabled: false },
      },
      {
        sampleId: 'agy-task-1-after',
        observedAt,
        model: 'gemini-3.7-flash-high',
      }
    );

    expect(rows).toHaveLength(2);
    expect(rows.map(row => row.limit_id)).toEqual([
      'gemini-5h',
      'gemini-weekly',
    ]);
    expect(rows[1]).toMatchObject({
      provider: 'google',
      harness: 'antigravity',
      model: 'gemini-3.7-flash-high',
      plan_class: 'google-ai-pro',
      window_minutes: null,
      percent_orientation: 'remaining',
      percent_value: 93.78,
      resets_at: '2026-09-06T07:50:32Z',
    });

    const serialized = JSON.stringify(rows);
    expect(serialized).not.toContain('developer@example.com');
    expect(serialized).not.toContain('/home/leo/private-project');
    expect(serialized).not.toContain('private-session-id');
    expect(serialized).not.toContain('private-conversation-id');
    expect(serialized).not.toContain('private-transcript.jsonl');
    expect(serialized).not.toContain('sandbox');
  });

  it('uses canonical caller model/plan identity over display payload labels', () => {
    const rows = projectAntigravityStatusLineQuota(
      {
        product: 'antigravity',
        model: { id: 'provider-display-alias' },
        plan_tier: 'Pro',
        quota: {
          'gemini-weekly': {
            remaining_fraction: 0.5,
            reset_time: null,
          },
        },
      },
      {
        sampleId: 'canonical-labels',
        observedAt,
        model: 'gemini-3.7-flash-high',
        planClass: 'google-ai-pro',
      }
    );

    expect(rows[0]).toMatchObject({
      model: 'gemini-3.7-flash-high',
      plan_class: 'google-ai-pro',
    });
  });
});
