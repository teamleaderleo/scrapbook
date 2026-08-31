import { describe, expect, it } from 'vitest';

import { projectPiLunaReceiptUsage } from './pi-luna-telemetry';

const observedAt = '2026-08-31T18:30:00Z';

function receipt(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 'pi-luna-worker-receipt/1',
    run: {
      id: 'task-01-attempt-1',
      assignedRole: 'implementation-worker',
    },
    repository: '/home/leo/Projects/private-worktree',
    brief: '/home/leo/private-brief.md',
    outputDir: '/home/leo/private-evidence',
    pi: {
      provider: 'openai-codex',
      model: 'gpt-5.6-luna',
      reasoningEffort: 'max',
      session: {
        observedId: 'private-session-id',
      },
    },
    usage: {
      input: 100,
      cacheRead: 80,
      output: 20,
      reasoning: 10,
      totalTokens: 210,
      cost: { total: 0.01 },
    },
    secret: 'COLD PRIVATE RECEIPT DATA',
    ...overrides,
  };
}

describe('Pi Luna telemetry projection', () => {
  it('projects the merged Pi receipt usage into the shared provider-neutral contract', () => {
    const sample = projectPiLunaReceiptUsage(receipt(), {
      sampleId: 'task-01-attempt-1',
      observedAt,
      runRef: 'stensibly:run_abc123',
    });

    expect(sample).toMatchObject({
      provider: 'openai',
      harness: 'pi',
      model: 'gpt-5.6-luna',
      effort: 'max',
      accounting_contract: 'pi-luna-provider-usage/v1',
      input_tokens: 100,
      cached_input_tokens: 80,
      cache_write_input_tokens: null,
      reasoning_tokens: 10,
      output_tokens: 20,
      total_tokens: 210,
      request_count: null,
      turn_count: null,
      agent_step_count: null,
    });

    const serialized = JSON.stringify(sample);
    expect(serialized).not.toContain('/home/leo/');
    expect(serialized).not.toContain('private-session-id');
    expect(serialized).not.toContain('COLD PRIVATE RECEIPT DATA');
    expect(serialized).not.toContain('cost');
  });

  it('preserves partial provider usage as unknown fields instead of zeros', () => {
    const sample = projectPiLunaReceiptUsage(
      receipt({ usage: { input: 12, output: 4 } }),
      {
        sampleId: 'partial-usage',
        observedAt,
        runRef: null,
      }
    );

    expect(sample).toMatchObject({
      input_tokens: 12,
      cached_input_tokens: null,
      reasoning_tokens: null,
      output_tokens: 4,
      total_tokens: null,
    });
  });

  it('returns null when the attempt has no provider usage evidence', () => {
    expect(
      projectPiLunaReceiptUsage(receipt({ usage: null }), {
        sampleId: 'no-usage',
        observedAt,
        runRef: null,
      })
    ).toBeNull();
  });

  it('refuses unknown provider/model generations instead of relabeling them', () => {
    expect(() =>
      projectPiLunaReceiptUsage(
        receipt({
          pi: {
            provider: 'other-provider',
            model: 'gpt-5.6-luna',
            reasoningEffort: 'max',
          },
        }),
        {
          sampleId: 'wrong-provider',
          observedAt,
          runRef: null,
        }
      )
    ).toThrow();
  });

  it('refuses a usage object containing no recognized counters', () => {
    expect(() =>
      projectPiLunaReceiptUsage(receipt({ usage: { cost: { total: 0.01 } } }), {
        sampleId: 'cost-only',
        observedAt,
        runRef: null,
      })
    ).toThrow('Pi usage must contain at least one recognized counter');
  });
});
