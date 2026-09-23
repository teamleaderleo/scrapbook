#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  IMPACT_CANDIDATES_PATH,
  IMPACT_INDEX_PATH,
  IMPACT_SNAPSHOT_PATH,
  IMPACT_SUMMARY_PATH,
  IMPACT_SYNC_STATE_PATH,
  buildImpactArtifacts,
  buildImpactCandidateArtifact,
  loadImpactRecords,
  parseJsonLines,
  stringifyImpactCandidateArtifact,
} from './impact-lib.mjs';

const projectRoot = process.cwd();
const records = await loadImpactRecords({ projectRoot });
const artifacts = buildImpactArtifacts(records);
const snapshot = parseJsonLines(
  await readFile(path.join(projectRoot, IMPACT_SNAPSHOT_PATH), 'utf8')
);
const syncState = JSON.parse(
  await readFile(path.join(projectRoot, IMPACT_SYNC_STATE_PATH), 'utf8')
);
const candidates = buildImpactCandidateArtifact(snapshot, syncState);

let failed = false;
for (const [relativePath, value] of [
  [IMPACT_INDEX_PATH, artifacts.index],
  [IMPACT_SUMMARY_PATH, artifacts.summary],
  [IMPACT_CANDIDATES_PATH, candidates],
]) {
  const expected =
    relativePath === IMPACT_CANDIDATES_PATH
      ? stringifyImpactCandidateArtifact(value)
      : JSON.stringify(value, null, 2) + '\n';
  const actual = await readFile(path.join(projectRoot, relativePath), 'utf8');
  if (actual !== expected) {
    failed = true;
    console.error(relativePath + ' is stale. Run: pnpm impact:build');
  }
}

if (failed) process.exitCode = 1;
else console.log('impact ledger audit passed (' + records.length + ' curated records)');
