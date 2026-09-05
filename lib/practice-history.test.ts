import { describe, expect, it } from 'vitest';
import { insertedMistakes, parsePracticeHistory } from './practice-history';

describe('practice history', () => {
  const result = {
    id: 'a',
    slug: 'a',
    title: 'A',
    date: '2026-09-05T00:00:00Z',
    mode: 'copy',
    elapsed: 2000,
    wpm: 30,
    mistakes: 1,
    assisted: false,
  };
  it('bounds history and rejects malformed or impossible data', () => {
    expect(
      parsePracticeHistory(JSON.stringify(Array(60).fill(result)))
    ).toHaveLength(50);
    expect(
      parsePracticeHistory(
        JSON.stringify([
          result,
          { ...result, elapsed: -1 },
          { ...result, mode: 'admin' },
          null,
        ])
      )
    ).toEqual([result]);
    expect(parsePracticeHistory('broken')).toEqual([]);
    expect(parsePracticeHistory('x'.repeat(60001))).toEqual([]);
  });
  it('counts inserted errors without charging deletion or a correct repair', () => {
    expect(insertedMistakes('abc', 'a', 'ax')).toBe(1);
    expect(insertedMistakes('abc', 'ax', 'a')).toBe(0);
    expect(insertedMistakes('abc', 'axc', 'abc')).toBe(0);
    expect(insertedMistakes('🦋x', '🦋', '🦋z')).toBe(1);
    expect(insertedMistakes('abc', '', 'abc')).toBe(0);
  });
});
