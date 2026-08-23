import { describe, expect, it } from 'vitest';
import { getBotDeskEntry } from './bot-desk';
import { getBotDeskDisplayCopy } from './bot-desk-display';

describe('Workbench display copy', () => {
  it('lets the bob piece come out swinging in public summaries', () => {
    const entry = getBotDeskEntry('bobs-have-my-fucking-heart');
    expect(entry).toBeDefined();

    const display = getBotDeskDisplayCopy(entry!);

    expect(display.title).toBe('Bobs Have My Fucking Heart');
    expect(display.blurb).toMatch(/^Bobs fucking rule\./);
    expect(display.blurb).toContain('face, jaw, neck, silhouette, and attitude');
  });

  it('passes through entries without an override', () => {
    const entry = getBotDeskEntry('the-thunderdome-is-in-the-mind');
    expect(entry).toBeDefined();

    expect(getBotDeskDisplayCopy(entry!)).toEqual({
      title: entry!.title,
      blurb: entry!.blurb,
    });
  });
});
