#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  IMPACT_INDEX_PATH,
  IMPACT_SNAPSHOT_PATH,
  parseJsonLines,
  queryImpactIndex,
} from './impact-lib.mjs';

function parseArguments(argv) {
  const options = {
    q: '',
    repo: '',
    area: '',
    dimension: '',
    id: '',
    candidates: false,
    json: false,
    limit: 30,
  };
  const free = [];

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--candidates') options.candidates = true;
    else if (argument === '--json') options.json = true;
    else if (argument === '--repo') options.repo = argv[++index] ?? '';
    else if (argument === '--area') options.area = argv[++index] ?? '';
    else if (argument === '--dimension') options.dimension = argv[++index] ?? '';
    else if (argument === '--id') options.id = argv[++index] ?? '';
    else if (argument === '--limit') options.limit = Number.parseInt(argv[++index] ?? '', 10);
    else free.push(argument);
  }

  options.q = free.join(' ').trim();
  if (!Number.isInteger(options.limit) || options.limit < 1) options.limit = 30;
  return options;
}

const options = parseArguments(process.argv.slice(2));
const projectRoot = process.cwd();

if (options.candidates) {
  const raw = await readFile(path.join(projectRoot, IMPACT_SNAPSHOT_PATH), 'utf8');
  const q = options.q.toLowerCase();
  const matches = parseJsonLines(raw)
    .filter(record => !options.repo || record.repository === options.repo)
    .filter(record => {
      if (!q) return true;
      return [record.title, ...(record.metricHints ?? [])]
        .join('\n')
        .toLowerCase()
        .includes(q);
    })
    .sort(
      (a, b) =>
        (b.metricHints?.length ?? 0) - (a.metricHints?.length ?? 0) ||
        String(b.mergedAt ?? '').localeCompare(String(a.mergedAt ?? ''))
    )
    .slice(0, options.limit);

  if (options.json) console.log(JSON.stringify(matches, null, 2));
  else {
    for (const record of matches) {
      console.log(
        record.repository +
          '#' +
          record.number +
          '  ' +
          record.title +
          '  [' +
          (record.metricHints?.length ?? 0) +
          ' hints]'
      );
      for (const hint of (record.metricHints ?? []).slice(0, 4)) {
        console.log('  · ' + hint);
      }
    }
  }
} else {
  const index = JSON.parse(
    await readFile(path.join(projectRoot, IMPACT_INDEX_PATH), 'utf8')
  );
  const matches = queryImpactIndex(index, options).slice(0, options.limit);

  if (options.json) console.log(JSON.stringify(matches, null, 2));
  else {
    for (const record of matches) {
      console.log(record.id + '  ' + record.title);
      console.log('  ' + record.summary);
      for (const claim of record.claims.filter(claim => claim.headline)) {
        console.log(
          '  · ' +
            claim.value +
            ' ' +
            claim.unit +
            ' · ' +
            claim.confidence +
            ' · ' +
            claim.direction
        );
      }
    }
  }
}
