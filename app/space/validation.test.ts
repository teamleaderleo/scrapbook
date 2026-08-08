import { describe, expect, it } from 'vitest';
import {
  addItemSchema,
  itemIdSchema,
  reviewRatingSchema,
  updateItemSchema,
} from './validation';

const validItem = {
  slug: 'bounded-space-note',
  title: 'Bounded Space note',
  url: 'https://example.com/note',
  tags: ['topic:space'],
  category: 'note',
  defaultIndex: 0,
  versions: [{ label: 'v1', content: '# Note', code: null }],
};

describe('Space mutation validation', () => {
  it('accepts a bounded item payload', () => {
    expect(addItemSchema.parse(validItem)).toMatchObject(validItem);
    expect(addItemSchema.parse({ ...validItem, url: '' }).url).toBeNull();
  });

  it('rejects invalid slugs, URLs, and out-of-range default versions', () => {
    expect(() =>
      addItemSchema.parse({
        ...validItem,
        slug: 'Not a route',
        url: 'not a URL',
        defaultIndex: 1,
      })
    ).toThrow();
  });

  it('rejects empty and structurally invalid updates', () => {
    expect(() => updateItemSchema.parse({})).toThrow(
      'At least one field must be updated'
    );
    expect(() => updateItemSchema.parse({ unexpected: true })).toThrow();
    expect(() => updateItemSchema.parse({ defaultIndex: 0 })).toThrow(
      'Versions and their default selection must be updated together'
    );
    expect(() =>
      updateItemSchema.parse({ versions: validItem.versions })
    ).toThrow('Versions and their default selection must be updated together');
  });

  it('accepts only UUID item IDs and FSRS answer ratings', () => {
    expect(
      itemIdSchema.parse('24bb5d50-6dd6-414d-b890-1e2692ca9c8a')
    ).toBeTruthy();
    expect(() => itemIdSchema.parse('item-1')).toThrow();
    expect(reviewRatingSchema.parse(4)).toBe(4);
    expect(() => reviewRatingSchema.parse(0)).toThrow();
    expect(() => reviewRatingSchema.parse(5)).toThrow();
  });
});
