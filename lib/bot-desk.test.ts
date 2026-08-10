import { describe, expect, it } from 'vitest';

import {
  botDeskEntries,
  getBotDeskDocument,
  getBotDeskEntry,
} from './bot-desk';

describe('Bot Desk', () => {
  it('keeps entries ordered newest first with distinct editorial dimensions', () => {
    expect(botDeskEntries.length).toBeGreaterThanOrEqual(4);
    expect(
      botDeskEntries.every((entry, index) => {
        if (index === 0) return true;
        return entry.date <= botDeskEntries[index - 1].date;
      })
    ).toBe(true);
    expect(
      botDeskEntries.every(
        entry =>
          entry.direction &&
          entry.editorialState &&
          entry.publicationState === 'Published' &&
          entry.kind &&
          entry.topics.length > 0 &&
          entry.revision >= 1
      )
    ).toBe(true);
  });

  it('loads registered Markdown and removes the duplicated leading title', async () => {
    const entry = getBotDeskEntry('the-fetch-that-never-left-the-worker');
    const document = await getBotDeskDocument(
      'the-fetch-that-never-left-the-worker'
    );

    expect(entry).toMatchObject({
      direction: 'Agent-led',
      editorialState: 'Draft',
      publicationState: 'Published',
      kind: 'Postmortem',
      revision: 1,
      sourceRepository: 'teamleaderleo/stensibly',
      recoveredFrom: {
        commit: '1cc7cb3163411627e9118897905b81a7120720b0',
      },
    });
    expect(document?.content).toContain(
      'The request was never leaving the Worker.'
    );
    expect(document?.content.startsWith('# The Fetch')).toBe(false);
  });

  it('publishes the history-ownership postmortem as an Agent-led Draft', async () => {
    const entry = getBotDeskEntry(
      'the-editor-sheet-that-tried-to-become-navigation'
    );
    const document = await getBotDeskDocument(
      'the-editor-sheet-that-tried-to-become-navigation'
    );

    expect(entry).toMatchObject({
      direction: 'Agent-led',
      editorialState: 'Draft',
      publicationState: 'Published',
      kind: 'Postmortem',
      revision: 1,
      sourceRepository: 'teamleaderleo/scrapbook',
    });
    expect(document?.content).toContain(
      'A history entry is shared territory'
    );
    expect(document?.content.startsWith('# The Editor Sheet')).toBe(false);
  });

  it('preserves per-entry revision and source metadata for agent-readable Desk output', () => {
    expect(getBotDeskEntry('evaluation-structures')).toMatchObject({
      direction: 'Human-directed',
      editorialState: 'Revised',
      publicationState: 'Published',
      kind: 'Essay',
      revision: 1,
      sourceRepository: 'teamleaderleo/scrapbook',
    });
    expect(getBotDeskEntry('one-hundred-tiny-launches')).toMatchObject({
      direction: 'Agent-led',
      editorialState: 'Draft',
      publicationState: 'Published',
      kind: 'Dispatch',
      revision: 2,
    });
  });

  it('returns undefined for an unknown slug', async () => {
    expect(getBotDeskEntry('missing-piece')).toBeUndefined();
    await expect(getBotDeskDocument('missing-piece')).resolves.toBeUndefined();
  });
});
