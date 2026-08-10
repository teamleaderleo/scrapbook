import { describe, expect, it } from 'vitest';
import {
  createSpaceBrowseHref,
  createSpaceBrowseParams,
  createSpaceBrowseViewKey,
} from './space-browse-state';

describe('Space browse state', () => {
  it('uses one stable lane, tags, item ordering with URL encoding', () => {
    const params = createSpaceBrowseParams({
      item: 'item / 7',
      tags: 'topic:dp source:fieldwork',
      lane: 'archive',
    });

    expect(params.toString()).toBe(
      'lane=archive&tags=topic%3Adp+source%3Afieldwork&item=item+%2F+7'
    );
    expect(
      createSpaceBrowseHref('/space/review', {
        item: 'item / 7',
        tags: 'topic:dp source:fieldwork',
        lane: 'archive',
      })
    ).toBe(
      '/space/review?lane=archive&tags=topic%3Adp+source%3Afieldwork&item=item+%2F+7'
    );
  });

  it('drops empty values instead of creating semantically empty URLs', () => {
    expect(
      createSpaceBrowseHref('/space', {
        lane: ' ',
        tags: '',
        item: null,
      })
    ).toBe('/space');
  });

  it('generates history view keys from the same canonical serialization', () => {
    const state = { tags: 'topic:systems', lane: 'open' };
    expect(createSpaceBrowseViewKey('list', state)).toBe(
      'list:lane=open&tags=topic%3Asystems'
    );
    expect(createSpaceBrowseViewKey('reader', state)).toBe(
      'reader:lane=open&tags=topic%3Asystems'
    );
  });
});
