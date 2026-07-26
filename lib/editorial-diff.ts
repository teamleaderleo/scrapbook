export type EditorialComment = {
  id: string;
  label: string;
  note: string;
  anchor: string;
  source: 'editor' | 'self-review';
};

export type RedlineSpan = {
  kind: 'same' | 'added' | 'removed';
  text: string;
};

export type RedlineRow = {
  id: string;
  oldLine: number | null;
  newLine: number | null;
  before?: string;
  after?: string;
  spans: RedlineSpan[];
  changed: boolean;
  commentIds: string[];
};

type BlockOperation = {
  kind: 'same' | 'added' | 'removed';
  text: string;
  oldLine: number | null;
  newLine: number | null;
};

function cleanMarkdown(value: string) {
  return value
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '• ')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitEditorialBlocks(content: string) {
  return content
    .replace(/\r\n?/g, '\n')
    .trim()
    .split(/\n{2,}/)
    .map(cleanMarkdown)
    .filter(Boolean);
}

function coalesceSpans(spans: RedlineSpan[]) {
  const result: RedlineSpan[] = [];

  for (const span of spans) {
    if (!span.text) continue;
    const previous = result.at(-1);
    if (previous?.kind === span.kind) previous.text += span.text;
    else result.push({ ...span });
  }

  return result;
}

function tokenise(value: string) {
  return value.match(/\s+|[^\s]+/g) ?? [];
}

export function diffWords(before: string, after: string): RedlineSpan[] {
  const oldTokens = tokenise(before);
  const newTokens = tokenise(after);
  const table = Array.from({ length: oldTokens.length + 1 }, () =>
    new Uint16Array(newTokens.length + 1),
  );

  for (let oldIndex = oldTokens.length - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = newTokens.length - 1; newIndex >= 0; newIndex -= 1) {
      table[oldIndex][newIndex] =
        oldTokens[oldIndex] === newTokens[newIndex]
          ? table[oldIndex + 1][newIndex + 1] + 1
          : Math.max(table[oldIndex + 1][newIndex], table[oldIndex][newIndex + 1]);
    }
  }

  const spans: RedlineSpan[] = [];
  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldTokens.length || newIndex < newTokens.length) {
    if (
      oldIndex < oldTokens.length &&
      newIndex < newTokens.length &&
      oldTokens[oldIndex] === newTokens[newIndex]
    ) {
      spans.push({ kind: 'same', text: oldTokens[oldIndex] });
      oldIndex += 1;
      newIndex += 1;
      continue;
    }

    if (
      newIndex < newTokens.length &&
      (oldIndex === oldTokens.length ||
        table[oldIndex][newIndex + 1] >= table[oldIndex + 1][newIndex])
    ) {
      spans.push({ kind: 'added', text: newTokens[newIndex] });
      newIndex += 1;
      continue;
    }

    spans.push({ kind: 'removed', text: oldTokens[oldIndex] });
    oldIndex += 1;
  }

  return coalesceSpans(spans);
}

function buildBlockOperations(before: string[], after: string[]): BlockOperation[] {
  const table = Array.from({ length: before.length + 1 }, () =>
    new Uint16Array(after.length + 1),
  );

  for (let oldIndex = before.length - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = after.length - 1; newIndex >= 0; newIndex -= 1) {
      table[oldIndex][newIndex] =
        before[oldIndex] === after[newIndex]
          ? table[oldIndex + 1][newIndex + 1] + 1
          : Math.max(table[oldIndex + 1][newIndex], table[oldIndex][newIndex + 1]);
    }
  }

  const operations: BlockOperation[] = [];
  let oldIndex = 0;
  let newIndex = 0;
  let oldLine = 1;
  let newLine = 1;

  while (oldIndex < before.length || newIndex < after.length) {
    if (
      oldIndex < before.length &&
      newIndex < after.length &&
      before[oldIndex] === after[newIndex]
    ) {
      operations.push({
        kind: 'same',
        text: before[oldIndex],
        oldLine,
        newLine,
      });
      oldIndex += 1;
      newIndex += 1;
      oldLine += 1;
      newLine += 1;
      continue;
    }

    if (
      newIndex < after.length &&
      (oldIndex === before.length ||
        table[oldIndex][newIndex + 1] >= table[oldIndex + 1][newIndex])
    ) {
      operations.push({ kind: 'added', text: after[newIndex], oldLine: null, newLine });
      newIndex += 1;
      newLine += 1;
      continue;
    }

    operations.push({ kind: 'removed', text: before[oldIndex], oldLine, newLine: null });
    oldIndex += 1;
    oldLine += 1;
  }

  return operations;
}

function normaliseForMatch(value: string) {
  return cleanMarkdown(value).toLocaleLowerCase('en-GB');
}

function attachComments(
  before: string | undefined,
  after: string | undefined,
  comments: EditorialComment[],
) {
  const haystack = normaliseForMatch(`${before ?? ''} ${after ?? ''}`);
  return comments
    .filter((comment) => haystack.includes(normaliseForMatch(comment.anchor)))
    .map((comment) => comment.id);
}

export function buildRedline(
  beforeContent: string,
  afterContent: string,
  comments: EditorialComment[] = [],
): RedlineRow[] {
  const operations = buildBlockOperations(
    splitEditorialBlocks(beforeContent),
    splitEditorialBlocks(afterContent),
  );
  const rows: RedlineRow[] = [];
  let index = 0;

  while (index < operations.length) {
    const operation = operations[index];

    if (operation.kind === 'same') {
      rows.push({
        id: `row-${rows.length + 1}`,
        oldLine: operation.oldLine,
        newLine: operation.newLine,
        before: operation.text,
        after: operation.text,
        spans: [{ kind: 'same', text: operation.text }],
        changed: false,
        commentIds: attachComments(operation.text, operation.text, comments),
      });
      index += 1;
      continue;
    }

    const removed: BlockOperation[] = [];
    const added: BlockOperation[] = [];

    while (index < operations.length && operations[index].kind !== 'same') {
      const changedOperation = operations[index];
      if (changedOperation.kind === 'removed') removed.push(changedOperation);
      else added.push(changedOperation);
      index += 1;
    }

    const rowCount = Math.max(removed.length, added.length);
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const oldBlock = removed[rowIndex];
      const newBlock = added[rowIndex];
      const before = oldBlock?.text;
      const after = newBlock?.text;
      const spans =
        before && after
          ? diffWords(before, after)
          : before
            ? [{ kind: 'removed' as const, text: before }]
            : [{ kind: 'added' as const, text: after ?? '' }];

      rows.push({
        id: `row-${rows.length + 1}`,
        oldLine: oldBlock?.oldLine ?? null,
        newLine: newBlock?.newLine ?? null,
        before,
        after,
        spans,
        changed: true,
        commentIds: attachComments(before, after, comments),
      });
    }
  }

  return rows;
}
