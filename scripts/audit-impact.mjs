#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  IMPACT_INDEX_PATH,
  IMPACT_SUMMARY_PATH,
  buildImpactArtifacts,
  loadImpactRecords,
} from './impact-lib.mjs';

const projectRoot = process.cwd();
const records = await loadImpactRecords({ projectRoot });
const artifacts = buildImpactArtifacts(records);

let failed = false;
for (const [relativePath, value] of [
  [IMPACT_INDEX_PATH, artifacts.index],
  [IMPACT_SUMMARY_PATH, artifacts.summary],
]) {
  const expected = JSON.stringify(value, null, 2) + '\n';
  const actual = await readFile(path.join(projectRoot, relativePath), 'utf8');
  if (actual !== expected) {
    failed = true;
    console.error(relativePath + ' is stale. Run: pnpm impact:build');
  }
}

if (failed) process.exitCode = 1;
else console.log('impact ledger audit passed (' + records.length + ' curated records)');
