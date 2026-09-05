import { describe, expect, it } from 'vitest';
import { typingFeedback } from './typing-feedback';

describe('typing feedback', () => {
  it('locates a mismatch after a newline and classifies expected characters', () => {
    const result = typingFeedback('a\n  x;', 'a\n!!?z+');
    expect(result.line).toBe(2);
    expect(result.column).toBe(1);
    expect(result.errors).toEqual({
      whitespace: 2,
      identifiers: 1,
      punctuation: 1,
      extra: 1,
    });
  });
  it('counts Unicode characters consistently with the reference rendering', () => {
    expect(typingFeedback('🦋x', '🦋x')).toMatchObject({
      complete: true,
      correct: 2,
      total: 2,
      match: 100,
    });
    expect(typingFeedback('🦋x', '🦋z')).toMatchObject({ first: 1, column: 2 });
  });
  it('does not equate a correct prefix with completion', () => {
    expect(typingFeedback('const x = 1;', 'const')).toMatchObject({
      complete: false,
      match: 100,
    });
    expect(typingFeedback('', '')).toMatchObject({ complete: false });
  });
});
