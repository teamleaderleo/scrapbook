import type { BotDeskEntry } from './bot-desk';

type DisplayCopy = Pick<BotDeskEntry, 'title' | 'blurb'>;

const DISPLAY_COPY_OVERRIDES: Readonly<
  Record<string, Partial<DisplayCopy>>
> = {
  'bobs-have-my-fucking-heart': {
    blurb:
      'CACHE-PROBE-1632 · Bobs fucking rule. Lose a few inches of hair and suddenly the face, jaw, neck, silhouette, and attitude all snap into focus—and Japanese styling turned that tiny cut into an entire feminine language.',
  },
};

export function getBotDeskDisplayCopy(
  entry: Pick<BotDeskEntry, 'slug' | 'title' | 'blurb'>
): DisplayCopy {
  const override = DISPLAY_COPY_OVERRIDES[entry.slug];
  return {
    title: override?.title ?? entry.title,
    blurb: override?.blurb ?? entry.blurb,
  };
}
