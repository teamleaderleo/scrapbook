export type PracticeResult = {
  id: string;
  slug: string;
  title: string;
  date: string;
  mode: 'copy' | 'recall' | 'concept';
  elapsed: number;
  wpm: number | null;
  mistakes: number;
  assisted: boolean;
  rating?: 'revisit' | 'recalled';
};

export const PRACTICE_HISTORY_KEY = 'scrapbook:practice-history:v1';

export function parsePracticeHistory(raw: string | null): PracticeResult[] {
  if (!raw || raw.length > 60000) return [];
  try {
    const entries: unknown = JSON.parse(raw);
    if (!Array.isArray(entries)) return [];
    return entries
      .filter((entry): entry is PracticeResult => {
        if (!entry || typeof entry !== 'object') return false;
        const x = entry as PracticeResult;
        return (
          typeof x.id === 'string' &&
          x.id.length <= 100 &&
          typeof x.slug === 'string' &&
          x.slug.length <= 200 &&
          typeof x.title === 'string' &&
          x.title.length <= 200 &&
          typeof x.date === 'string' &&
          Number.isFinite(Date.parse(x.date)) &&
          ['copy', 'recall', 'concept'].includes(x.mode) &&
          Number.isFinite(x.elapsed) &&
          x.elapsed >= 0 &&
          x.elapsed <= 86400000 &&
          (x.wpm === null ||
            (Number.isFinite(x.wpm) && x.wpm >= 0 && x.wpm <= 100000)) &&
          Number.isSafeInteger(x.mistakes) &&
          x.mistakes >= 0 &&
          typeof x.assisted === 'boolean' &&
          (x.rating === undefined ||
            x.rating === 'revisit' ||
            x.rating === 'recalled')
        );
      })
      .slice(0, 50);
  } catch {
    return [];
  }
}

// Count newly inserted mismatches. Deleting existing text adds none.
export function insertedMistakes(
  target: string,
  previous: string,
  next: string
) {
  const expected = Array.from(target),
    before = Array.from(previous),
    after = Array.from(next);
  let prefix = 0;
  while (
    prefix < before.length &&
    prefix < after.length &&
    before[prefix] === after[prefix]
  )
    prefix++;
  let suffix = 0;
  while (
    suffix < before.length - prefix &&
    suffix < after.length - prefix &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  )
    suffix++;
  return after
    .slice(prefix, after.length - suffix)
    .reduce(
      (count, char, offset) =>
        count + Number(char !== expected[prefix + offset]),
      0
    );
}
