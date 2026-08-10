import { describe, expect, it } from 'vitest';
import {
  duplicateItemHref,
  readItemHref,
  reviewItemHref,
} from './space-routes';

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

  it('uses canonical lane, tags, item ordering and encoding', () => {
    expect(reviewItemHref(' item/id ', ' topic:security ', ' fieldwork ')).toBe(
      '/space/review?lane=fieldwork&tags=topic%3Asecurity&item=item%2Fid'
    );
    expect(() => reviewItemHref('   ')).toThrow('Review item id is required');
  });
});

describe('readItemHref', () => {
  it('uses the public slug and canonical originating Space context', () => {
    expect(
      readItemHref(
        'cache-files-are-published-atomically',
        ' domain:reliability ',
        ' fieldwork '
      )
    ).toBe(
      '/space/read/cache-files-are-published-atomically?lane=fieldwork&tags=domain%3Areliability'
    );
  });

  it('encodes slugs and does not add an empty query string', () => {
    expect(readItemHref(' concept / one ')).toBe(
      '/space/read/concept%20%2F%20one'
    );
    expect(readItemHref('a-living-lesson')).toBe('/space/read/a-living-lesson');
    expect(() => readItemHref('   ')).toThrow('Reading sheet slug is required');
  });
});
