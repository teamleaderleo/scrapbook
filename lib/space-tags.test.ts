import { describe, expect, it } from 'vitest';
import { displaySpaceTags } from './space-tags';

describe('displaySpaceTags', () => {
  it('keeps reader-facing facets and hides storage workflow tags', () => {
    expect(
      displaySpaceTags([
        'source:linux-fieldwork',
        'collection:fieldwork-studies-01',
        'mode:explain',
        'domain:reliability',
        'time:5-min',
        'device:phone',
        'state:fresh',
        'visibility:public',
      ])
    ).toEqual(['linux-fieldwork', 'reliability', '5-min', 'phone']);
  });

  it('preserves an unnamespaced tag', () => {
    expect(displaySpaceTags(['systems'])).toEqual(['systems']);
  });
});
