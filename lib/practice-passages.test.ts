import { describe, expect, it } from 'vitest';
import { transpileModule, ScriptTarget } from 'typescript';
import { originalPassages } from './practice-passages';

// Execute the displayed examples to check the behavior their questions discuss.
function example(slug: string, name: string) {
  const text = originalPassages.find(passage => passage.slug === slug)!.text;
  const { outputText } = transpileModule(text, {
    compilerOptions: { target: ScriptTarget.ES2022 },
  });
  return new Function(`${outputText}; return ${name};`)();
}

describe('practice examples', () => {
  it('expires at the boundary and rejects a clock behind the sample', () => {
    const read = example('cache-expiry', 'readFresh');
    const entry = { value: 0, savedAt: 1000 };
    expect(read(entry, 1499, 500)).toBe(0);
    expect(read(entry, 1500, 500)).toBeUndefined();
    expect(read(entry, 999, 500)).toBeUndefined();
    expect(read(undefined, 1000, 500)).toBeUndefined();
  });
  it('distinguishes a quiet interval from a reset or missing time', () => {
    const rate = example('counter-rate', 'bytesPerSecond');
    expect(rate(12000, 15000, 1500)).toBe(2000);
    expect(rate(15000, 15000, 1000)).toBe(0);
    expect(rate(15000, 200, 1000)).toBeNull();
    expect(rate(15000, 16000, 0)).toBeNull();
  });
  it('keeps the newest samples without mutating the old window', () => {
    const append = example('rolling-window', 'appendSample');
    const samples = Object.freeze([1, 2, 3]);
    expect(append(samples, 4, 1)).toEqual([4]);
    expect(append(samples, 4, 3)).toEqual([2, 3, 4]);
    expect(append([], 4, 3)).toEqual([4]);
    expect(append(samples, 4, 0)).toEqual([]);
    expect(append(samples, 4, 1.5)).toEqual([]);
  });
  it('handles repeated actions and resumes a paused attempt', () => {
    const transition = example('state-transition', 'transition');
    let state = 'idle';
    const trace = ['start', 'pause', 'pause', 'start', 'reset'].map(action => {
      state = transition(state, action);
      return state;
    });
    expect(trace).toEqual(['running', 'paused', 'paused', 'running', 'idle']);
    expect(transition('idle', 'pause')).toBe('idle');
  });
});
