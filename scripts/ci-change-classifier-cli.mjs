import fs from 'node:fs';
import { classifyCiPaths } from './ci-change-classifier.mjs';

const input = fs.readFileSync(0, 'utf8');
const paths = input.split(/\r?\n/).filter(Boolean);
const result = classifyCiPaths(paths);

process.stdout.write(`mode=${result.mode}\n`);
process.stdout.write(`run_verify=${result.runVerify ? 'true' : 'false'}\n`);
process.stdout.write(`run_browser=${result.runBrowser ? 'true' : 'false'}\n`);
process.stdout.write(`reason=${result.reason}\n`);

if (process.env.GITHUB_STEP_SUMMARY) {
  const relevant = result.browserRelevantPaths.length
    ? `\n\nBrowser-relevant paths:\n${result.browserRelevantPaths
        .map(path => `- \`${path}\``)
        .join('\n')}`
    : '';
  const independent = result.browserIndependentPaths.length
    ? `\n\nBrowser-independent paths:\n${result.browserIndependentPaths
        .map(path => `- \`${path}\``)
        .join('\n')}`
    : '';

  fs.appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `### CI classification: ${result.mode}\n\n${result.reason}${relevant}${independent}\n`
  );
}
