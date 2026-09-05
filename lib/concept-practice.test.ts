import { describe, expect, it } from 'vitest';
import { conceptExerciseFromMarkdown } from './concept-practice';
import { getConceptExercises } from './concept-practice-data';

describe('concept practice', () => {
  it('derives questions and reference from their owned sections', () => {
    const result = conceptExerciseFromMarkdown(
      { slug: 'test', title: 'Test' },
      '## Invariant\n\nKeep [ownership](owner.md) explicit.\n\n## Pressure questions\n\n- Who owns it?\n- When does it end?\n\n## Other\n- Not a question.'
    );
    expect(result?.questions).toEqual(['Who owns it?', 'When does it end?']);
    expect(result?.reference).toBe('Keep ownership explicit.');
    expect(
      conceptExerciseFromMarkdown({ slug: 'x', title: 'X' }, 'No questions')
    ).toBeNull();
  });
  it('builds practice from the existing Knowledge corpus', async () => {
    const concepts = await getConceptExercises();
    const profiling = concepts.find(
      concept => concept.slug === 'performance/profiling-critical-path'
    );
    expect(profiling?.questions).toContain('Which event gates that outcome?');
    expect(profiling?.reference).toContain('critical path');
    expect(
      concepts.every(
        concept =>
          concept.questions.length &&
          concept.reference &&
          !concept.slug.startsWith('log/')
      )
    ).toBe(true);
  });
});
