export type PracticeCase = {
  input: string;
  args: unknown[];
  original: string;
  changed: string;
};

export type PracticeChange = {
  label: string;
  replacement: string;
  consequence: string;
  cases: PracticeCase[];
};

export type PracticeInsight = {
  title: string;
  match: string;
  note: string;
  changes: PracticeChange[];
};

// Displayed results are fixed examples, checked against the exact passages in
// tests. The browser never compiles or executes the code or its edits.
export const practiceInsights: Record<string, PracticeInsight[]> = {
  'typing-speed': [{
    title: 'Wait for a useful interval',
    match: '  if (correctCharacters <= 0 || elapsedMs < 1_000) return 0;',
    note: 'A tiny interval makes the rate jump. This guard also avoids dividing by zero.',
    changes: [{
      label: 'Remove the guard', replacement: '',
      consequence: 'The first few characters can produce a huge rate. At zero elapsed time, the result is Infinity.',
      cases: [
        { input: '5 characters · 100 ms', args: [5, 100], original: '0', changed: '600' },
        { input: '5 characters · 0 ms', args: [5, 0], original: '0', changed: 'Infinity' },
      ],
    }],
  }],
  'practice-mode': [{
    title: 'Check membership',
    match: '  return SPACE_PRACTICE_MODES.find(mode => mode.id === value)?.id;',
    note: 'Finding a known mode checks the value at runtime. A type assertion alone does not.',
    changes: [{
      label: 'Trust the string', replacement: '  return value as SpacePracticeMode;',
      consequence: 'An unknown string passes through. The assertion changes what TypeScript accepts, not the value.',
      cases: [
        { input: '"type"', args: ['type'], original: '"type"', changed: '"type"' },
        { input: '"banana"', args: ['banana'], original: 'undefined', changed: '"banana"' },
      ],
    }],
  }],
  'next-stage': [{
    title: 'Match the whole value',
    match: "  return value === 'familiar' || value === 'learned' ? value : undefined;",
    note: 'Both accepted values are checked exactly. Similar-looking input stays invalid.',
    changes: [{
      label: 'Accept a prefix', replacement: "  return value?.startsWith('learned') ? 'learned' : undefined;",
      consequence: 'The prefix admits extra text and the replacement loses the familiar stage.',
      cases: [
        { input: '"learned-later"', args: ['learned-later'], original: 'undefined', changed: '"learned"' },
        { input: '"familiar"', args: ['familiar'], original: '"familiar"', changed: 'undefined' },
      ],
    }],
  }],
  'cache-expiry': [{
    title: 'The expiry boundary',
    match: '  if (age < 0 || age >= ttl) return undefined;',
    note: 'Age must be below the TTL. A timestamp ahead of the clock is rejected too.',
    changes: [{
      label: 'Use > instead of >=', replacement: '  if (age < 0 || age > ttl) return undefined;',
      consequence: 'The cached value survives at the exact expiry time.',
      cases: [
        { input: 'saved 1000 · now 1499 · TTL 500', args: [{ value: 'cached', savedAt: 1000 }, 1499, 500], original: '"cached"', changed: '"cached"' },
        { input: 'saved 1000 · now 1500 · TTL 500', args: [{ value: 'cached', savedAt: 1000 }, 1500, 500], original: 'undefined', changed: '"cached"' },
      ],
    }, {
      label: 'Remove expiry check', replacement: '',
      consequence: 'The entry is returned even after its TTL has passed.',
      cases: [
        { input: 'saved 1000 · now 9000 · TTL 500', args: [{ value: 'cached', savedAt: 1000 }, 9000, 500], original: 'undefined', changed: '"cached"' },
      ],
    }],
  }],
  'counter-rate': [{
    title: 'A reset is missing data',
    match: '  if (elapsedMs <= 0 || current < previous) return null;',
    note: 'A counter falling usually means a reset or wrap. This interval cannot give a reliable rate.',
    changes: [{
      label: 'Allow a falling counter', replacement: '  if (elapsedMs <= 0) return null;',
      consequence: 'Subtracting across a reset produces a negative transfer rate.',
      cases: [
        { input: '15000 → 200 bytes · 1000 ms', args: [15000, 200, 1000], original: 'null', changed: '-14800' },
        { input: '15000 → 15000 bytes · 1000 ms', args: [15000, 15000, 1000], original: '0', changed: '0' },
      ],
    }, {
      label: 'Return zero for resets', replacement: '  if (elapsedMs <= 0 || current < previous) return 0;',
      consequence: 'A graph now shows a quiet interval where the rate was actually unknown.',
      cases: [{ input: '15000 → 200 bytes · 1000 ms', args: [15000, 200, 1000], original: 'null', changed: '0' }],
    }],
  }, {
    title: 'Milliseconds to seconds',
    match: '  return transferred * 1_000 / elapsedMs;',
    note: 'The timer reports milliseconds. Multiplying by 1000 expresses the rate per second.',
    changes: [{
      label: 'Drop the conversion', replacement: '  return transferred / elapsedMs;',
      consequence: 'The number is bytes per millisecond: 1000 times smaller than bytes per second.',
      cases: [{ input: '12000 → 15000 bytes · 1500 ms', args: [12000, 15000, 1500], original: '2000', changed: '2' }],
    }],
  }],
  'rolling-window': [{
    title: 'The negative-zero trap',
    match: '  const tail = keep === 0 ? [] : samples.slice(-keep);',
    note: 'slice(-0) is slice(0): it copies everything. A one-slot window needs an empty tail.',
    changes: [{
      label: 'Always slice', replacement: '  const tail = samples.slice(-keep);',
      consequence: 'Capacity 1 keeps the old samples and appends another. Capacity 3 still works, so an ordinary case misses the bug.',
      cases: [
        { input: '[1, 2, 3] + 4 · capacity 1', args: [[1, 2, 3], 4, 1], original: '[4]', changed: '[1,2,3,4]' },
        { input: '[1, 2, 3] + 4 · capacity 3', args: [[1, 2, 3], 4, 3], original: '[2,3,4]', changed: '[2,3,4]' },
      ],
    }],
  }, {
    title: 'Leave room for the new sample',
    match: '  const keep = Math.max(0, capacity - 1);',
    note: 'The next sample takes one slot. Only capacity minus one old samples can remain.',
    changes: [{
      label: 'Keep the full capacity', replacement: '  const keep = capacity;',
      consequence: 'The returned window can exceed its capacity by one.',
      cases: [{ input: '[1, 2, 3] + 4 · capacity 3', args: [[1, 2, 3], 4, 3], original: '[2,3,4]', changed: '[1,2,3,4]' }],
    }],
  }],
  'state-transition': [{
    title: 'Pause only a running attempt',
    match: "  if (action === 'pause' && state === 'running') return 'paused';",
    note: 'The current state matters. An idle attempt has nothing to pause.',
    changes: [{
      label: 'Ignore the current state', replacement: "  if (action === 'pause') return 'paused';",
      consequence: 'An idle attempt becomes paused even though it never started.',
      cases: [
        { input: 'idle + pause', args: ['idle', 'pause'], original: '"idle"', changed: '"paused"' },
        { input: 'running + pause', args: ['running', 'pause'], original: '"paused"', changed: '"paused"' },
      ],
    }],
  }],
};
