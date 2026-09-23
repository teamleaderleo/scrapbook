import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  IMPACT_INDEX_PATH,
  IMPACT_SUMMARY_PATH,
  buildImpactArtifacts,
  extractMetricHints,
  loadImpactRecords,
  normalizeEvidenceUrl,
} from '../scripts/impact-lib.mjs';

describe('impact ledger', () => {
  it('keeps generated artifacts in sync with the canonical records', async () => {
    const records = await loadImpactRecords({ projectRoot: process.cwd() });
    const artifacts = buildImpactArtifacts(records);
    const index = JSON.parse(
      await readFile(path.join(process.cwd(), IMPACT_INDEX_PATH), 'utf8')
    );
    const summary = JSON.parse(
      await readFile(path.join(process.cwd(), IMPACT_SUMMARY_PATH), 'utf8')
    );

    expect(index).toEqual(artifacts.index);
    expect(summary).toEqual(artifacts.summary);
  });

  it('preserves the third-party evidence host rule', () => {
    expect(
      normalizeEvidenceUrl('https://github.com/manaflow-ai/cmux/pull/13658')
    ).toBe('https://redirect.github.com/manaflow-ai/cmux/pull/13658');
    expect(
      normalizeEvidenceUrl('https://github.com/teamleaderleo/scrapbook')
    ).toBe('https://github.com/teamleaderleo/scrapbook');
  });

  it('extracts bounded metric hints for offline candidate mining', () => {
    const hints = extractMetricHints(
      'ordinary prose\nSaved 590 runner minutes/day after the change.\nAnother line.'
    );

    expect(hints).toEqual([
      'Saved 590 runner minutes/day after the change.',
    ]);
  });
});
