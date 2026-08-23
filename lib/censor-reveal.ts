export type CensorRule = {
  id: string;
  pattern: RegExp;
};

export type CensorSegment = {
  text: string;
  censored: boolean;
  ruleIds: readonly string[];
};

type CensorRange = {
  start: number;
  end: number;
  ruleIds: Set<string>;
};

function globalPattern(pattern: RegExp) {
  const flags = new Set(pattern.flags.split(''));
  flags.add('g');
  return new RegExp(pattern.source, [...flags].join(''));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function censorRuleFromWords(
  id: string,
  words: readonly string[],
  { caseSensitive = false }: { caseSensitive?: boolean } = {}
): CensorRule {
  const alternatives = [...new Set(words.map(word => word.trim()).filter(Boolean))]
    .sort((left, right) => right.length - left.length)
    .map(escapeRegExp);

  if (alternatives.length === 0) {
    throw new Error('A censor rule needs at least one non-empty word.');
  }

  return {
    id,
    pattern: new RegExp(
      `\\b(?:${alternatives.join('|')})\\b`,
      caseSensitive ? 'gu' : 'giu'
    ),
  };
}

export const STRONG_PROFANITY_CENSOR_RULES: readonly CensorRule[] = [
  {
    id: 'fuck',
    pattern: /\b(?:mother)?fuck(?:ing|ed|er|ers|s)?\b/giu,
  },
  {
    id: 'shit',
    pattern: /\b(?:bull)?shit(?:ting|ted|ter|ters|s|ty)?\b/giu,
  },
  {
    id: 'bitch',
    pattern: /\bbitch(?:es|ing|ed|y)?\b/giu,
  },
  {
    id: 'asshole',
    pattern: /\bassholes?\b/giu,
  },
  {
    id: 'cunt',
    pattern: /\bcunts?\b/giu,
  },
] as const;

function collectRanges(text: string, rules: readonly CensorRule[]) {
  const ranges: CensorRange[] = [];

  for (const rule of rules) {
    const pattern = globalPattern(rule.pattern);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = match[0];
      if (!value) {
        pattern.lastIndex += 1;
        continue;
      }

      ranges.push({
        start: match.index,
        end: match.index + value.length,
        ruleIds: new Set([rule.id]),
      });
    }
  }

  ranges.sort((left, right) => left.start - right.start || right.end - left.end);
  return ranges;
}

function mergeRanges(ranges: readonly CensorRange[]) {
  const merged: CensorRange[] = [];

  for (const range of ranges) {
    const previous = merged.at(-1);
    if (!previous || range.start >= previous.end) {
      merged.push({
        start: range.start,
        end: range.end,
        ruleIds: new Set(range.ruleIds),
      });
      continue;
    }

    previous.end = Math.max(previous.end, range.end);
    for (const ruleId of range.ruleIds) previous.ruleIds.add(ruleId);
  }

  return merged;
}

export function segmentCensoredText(
  text: string,
  rules: readonly CensorRule[] = STRONG_PROFANITY_CENSOR_RULES
): CensorSegment[] {
  if (!text || rules.length === 0) {
    return [{ text, censored: false, ruleIds: [] }];
  }

  const ranges = mergeRanges(collectRanges(text, rules));
  if (ranges.length === 0) {
    return [{ text, censored: false, ruleIds: [] }];
  }

  const segments: CensorSegment[] = [];
  let cursor = 0;

  for (const range of ranges) {
    if (range.start > cursor) {
      segments.push({
        text: text.slice(cursor, range.start),
        censored: false,
        ruleIds: [],
      });
    }

    segments.push({
      text: text.slice(range.start, range.end),
      censored: true,
      ruleIds: [...range.ruleIds],
    });
    cursor = range.end;
  }

  if (cursor < text.length) {
    segments.push({
      text: text.slice(cursor),
      censored: false,
      ruleIds: [],
    });
  }

  return segments;
}
