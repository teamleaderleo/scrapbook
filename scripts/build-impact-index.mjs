#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
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
const { index, summary } = buildImpactArtifacts(records);

for (const [relativePath, value] of [
  [IMPACT_INDEX_PATH, index],
  [IMPACT_SUMMARY_PATH, summary],
]) {
  const target = path.join(projectRoot, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify(value, null, 2) + '\n');
  console.log('wrote ' + relativePath);
}
