import { describe, expect, it } from 'vitest';
import {
  applySpaceItemPracticeChoice,
  isInterviewSpaceItem,
  readSpaceItemPracticeChoice,
  setSpaceItemInterviewPrep,
} from './space-item-intake';

describe('Space item intake classification', () => {
  it('toggles interview prep without disturbing unrelated tags', () => {
    expect(
      setSpaceItemInterviewPrep(
        ['state:fresh', 'device:phone', 'prep:interview'],
        false
      )
    ).toEqual(['state:fresh', 'device:phone']);
    expect(
      setSpaceItemInterviewPrep(['state:fresh', 'device:phone'], true)
    ).toEqual(['state:fresh', 'device:phone', 'prep:interview']);
    expect(isInterviewSpaceItem(['PREP:INTERVIEW'])).toBe(true);
  });

  it('switches one practice mode while preserving content-shaped fields', () => {
    const model = {
      title: 'Cache repair',
      category: 'explain' as string | null,
      tags: ['state:fresh', 'mode:read', 'tool:no-ai'],
      versions: [{ label: 'Study', content: 'Keep me.', code: 'return value;' }],
    };

    expect(applySpaceItemPracticeChoice(model, 'review')).toEqual({
      title: 'Cache repair',
      category: 'review',
      tags: ['state:fresh', 'tool:no-ai', 'mode:review'],
      versions: [{ label: 'Study', content: 'Keep me.', code: 'return value;' }],
    });
  });

  it('maps practice choices to useful categories', () => {
    expect(
      applySpaceItemPracticeChoice({ tags: [], category: null }, 'implement')
    ).toMatchObject({ category: 'practical', tags: ['mode:implement'] });
    expect(
      applySpaceItemPracticeChoice({ tags: [], category: null }, 'debug')
    ).toMatchObject({ category: 'debug', tags: ['mode:debug'] });
    expect(
      applySpaceItemPracticeChoice({ tags: [], category: null }, 'design')
    ).toMatchObject({ category: 'design', tags: ['mode:design'] });
    expect(
      applySpaceItemPracticeChoice({ tags: [], category: null }, 'typing')
    ).toMatchObject({ category: 'typing', tags: ['mode:typing'] });
  });

  it('reads the supported mode and falls back to read for old or unknown modes', () => {
    expect(readSpaceItemPracticeChoice(['mode:deep-dive'])).toBe('deep-dive');
    expect(readSpaceItemPracticeChoice(['mode:typing'])).toBe('typing');
    expect(readSpaceItemPracticeChoice(['mode:drill'])).toBe('read');
    expect(readSpaceItemPracticeChoice([])).toBe('read');
  });
});
