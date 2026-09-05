import { describe, expect, it } from 'vitest';
import { ScriptTarget, transpileModule } from 'typescript';
import { practiceInsights } from './practice-insights';
import { practicePassages } from './practice-passages';
import { SPACE_PRACTICE_MODES } from './space-practice';

function compile(text: string) {
  const name = text.match(/function (\w+)/)![1];
  const { outputText } = transpileModule(text.replace(/^export /gm, ''), {
    compilerOptions: { target: ScriptTarget.ES2022 },
  });
  return new Function('SPACE_PRACTICE_MODES', `${outputText}; return ${name};`)(SPACE_PRACTICE_MODES);
}

function display(value: unknown): string {
  if (typeof value === 'number' && !Number.isFinite(value)) return String(value);
  return JSON.stringify(value) ?? 'undefined';
}

describe('precomputed line examples', () => {
  for (const [slug, insights] of Object.entries(practiceInsights)) {
    const passage = practicePassages.find(item => item.slug === slug)!;
    for (const insight of insights) {
      for (const change of insight.changes) {
        it(`${slug}: ${change.label}`, () => {
          // A shifted or duplicated anchor must not silently annotate another line.
          expect(passage.text.split('\n').filter(line => line === insight.match)).toHaveLength(1);
          const original = compile(passage.text);
          const changed = compile(passage.text.replace(insight.match, change.replacement));
          for (const example of change.cases) {
            expect(display(original(...structuredClone(example.args))), example.input).toBe(example.original);
            expect(display(changed(...structuredClone(example.args))), example.input).toBe(example.changed);
          }
        });
      }
    }
  }
});
