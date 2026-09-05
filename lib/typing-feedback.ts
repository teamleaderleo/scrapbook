export function typingFeedback(target: string, input: string) {
  const expected = Array.from(target);
  const entered = Array.from(input);
  const errors = { whitespace: 0, identifiers: 0, punctuation: 0, extra: 0 };
  let first = -1;
  let correct = 0;
  entered.forEach((character, index) => {
    if (character === expected[index]) {
      correct++;
      return;
    }
    if (first < 0) first = index;
    const wanted = expected[index];
    if (wanted === undefined) errors.extra++;
    else if (/\s/u.test(wanted)) errors.whitespace++;
    else if (/[\p{L}\p{N}_]/u.test(wanted)) errors.identifiers++;
    else errors.punctuation++;
  });
  const prefix = expected.slice(0, first < 0 ? entered.length : first).join('');
  return {
    errors,
    correct,
    first,
    line: prefix.split('\n').length,
    column: Array.from(prefix.split('\n').at(-1) ?? '').length + 1,
    complete: target.length > 0 && target === input,
    total: expected.length,
    entered: entered.length,
    match: entered.length ? Math.round((correct / entered.length) * 100) : 100,
  };
}
