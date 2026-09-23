#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
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
} from './impact-lib.mjs';

const projectRoot = process.cwd();
const records = await loadImpactRecords({ projectRoot });
const { index, summary } = buildImpactArtifacts(records);
const snapshot = parseJsonLines(
  await readFile(path.join(projectRoot, IMPACT_SNAPSHOT_PATH), 'utf8')
);
const syncState = JSON.parse(
  await readFile(path.join(projectRoot, IMPACT_SYNC_STATE_PATH), 'utf8')
);
const candidates = buildImpactCandidateArtifact(snapshot, syncState);

for (const [relativePath, value] of [
  [IMPACT_INDEX_PATH, index],
  [IMPACT_SUMMARY_PATH, summary],
  [IMPACT_CANDIDATES_PATH, candidates],
]) {
  const target = path.join(projectRoot, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify(value, null, 2) + '\n');
  console.log('wrote ' + relativePath);
}
