import { describe, expect, it } from 'vitest';
import { duplicateItemHref, reviewItemHref } from './space-routes';

describe('duplicateItemHref', () => {
  it('places the database item id in the duplicate query parameter', () => {
    expect(duplicateItemHref('0f8fad5b-d9cb-469f-a165-70867728950e')).toBe(
      '/space/add?duplicate=0f8fad5b-d9cb-469f-a165-70867728950e'
    );
  });

  it('encodes the identifier and rejects an empty source', () => {
    expect(duplicateItemHref(' item/id ')).toBe(
      '/space/add?duplicate=item%2Fid'
    );
    expect(() => duplicateItemHref('   ')).toThrow(
      'source item id is required'
    );
  });
});

describe('reviewItemHref', () => {
  it('uses the database item id expected by the review gallery', () => {
    expect(reviewItemHref('0f8fad5b-d9cb-469f-a165-70867728950e')).toBe(
      '/space/review?item=0f8fad5b-d9cb-469f-a165-70867728950e'
    );
  });

  it('preserves a real tag query without serializing an absent value', () => {
    expect(reviewItemHref('item/id', ' topic:security ', ' fieldwork ')).toBe(
      '/space/review?item=item%2Fid&tags=topic%3Asecurity&lane=fieldwork'
    );
    expect(() => reviewItemHref('   ')).toThrow('Review item id is required');
  });
});
