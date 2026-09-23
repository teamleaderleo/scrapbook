#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  IMPACT_SNAPSHOT_PATH,
  IMPACT_SYNC_STATE_PATH,
  extractMetricHints,
  normalizeEvidenceUrl,
  parseJsonLines,
  stringifyJsonLines,
} from './impact-lib.mjs';

const DEFAULT_SOURCE = {
  repository: 'manaflow-ai/cmux',
  author: 'teamleaderleo',
};

function parseArguments(argv) {
  return {
    full: argv.includes('--full'),
    dryRun: argv.includes('--dry-run'),
  };
}

async function readJson(relativePath, fallback) {
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), relativePath), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function readSnapshot() {
  try {
    return parseJsonLines(
      await readFile(path.join(process.cwd(), IMPACT_SNAPSHOT_PATH), 'utf8')
    );
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

function githubToken() {
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;

  const result = spawnSync('gh', ['auth', 'token'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status === 0 && result.stdout.trim()) return result.stdout.trim();
  throw new Error(
    'GitHub auth required: set GH_TOKEN/GITHUB_TOKEN or authenticate gh.'
  );
}

async function graphql(token, query, variables) {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      'User-Agent': 'scrapbook-impact-sync',
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors) {
    throw new Error(
      'GitHub GraphQL failed: ' + JSON.stringify(payload.errors ?? payload)
    );
  }
  return payload.data;
}

const SEARCH_QUERY = [
  'query ImpactPullRequests($query: String!, $cursor: String) {',
  '  search(query: $query, type: ISSUE, first: 100, after: $cursor) {',
  '    issueCount',
  '    pageInfo { hasNextPage endCursor }',
  '    nodes {',
  '      ... on PullRequest {',
  '        number',
  '        title',
  '        url',
  '        body',
  '        createdAt',
  '        updatedAt',
  '        mergedAt',
  '        additions',
  '        deletions',
  '        changedFiles',
  '        labels(first: 20) { nodes { name } }',
  '      }',
  '    }',
  '  }',
  '}',
].join('\n');

function overlapStart(lastSyncedAt) {
  if (!lastSyncedAt) return null;
  const value = new Date(lastSyncedAt);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

async function fetchSource(token, source, { full }) {
  const updatedSince = full ? null : overlapStart(source.lastSyncedAt);
  const qualifier = updatedSince ? ' updated:>=' + updatedSince : '';
  const search =
    'repo:' +
    source.repository +
    ' author:' +
    source.author +
    ' is:pr is:merged' +
    qualifier;

  const nodes = [];
  let cursor = null;
  let requests = 0;
  let issueCount = 0;
  do {
    const data = await graphql(token, SEARCH_QUERY, {
      query: search,
      cursor,
    });
    requests += 1;
    issueCount = data.search.issueCount;
    nodes.push(...data.search.nodes.filter(Boolean));
    cursor = data.search.pageInfo.hasNextPage
      ? data.search.pageInfo.endCursor
      : null;
  } while (cursor);

  return { nodes, requests, issueCount, search };
}

function snapshotRecord(repository, node) {
  const body = node.body ?? '';
  return {
    id: repository + '#' + node.number,
    repository,
    number: node.number,
    title: node.title,
    url: normalizeEvidenceUrl(node.url),
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    mergedAt: node.mergedAt,
    additions: node.additions,
    deletions: node.deletions,
    changedFiles: node.changedFiles,
    labels: (node.labels?.nodes ?? []).map(label => label.name).sort(),
    metricHints: extractMetricHints(body),
    bodySha256: createHash('sha256').update(body).digest('hex'),
  };
}

const options = parseArguments(process.argv.slice(2));
const state = await readJson(IMPACT_SYNC_STATE_PATH, {
  version: 1,
  sources: [DEFAULT_SOURCE],
});
if (!Array.isArray(state.sources) || state.sources.length === 0) {
  state.sources = [DEFAULT_SOURCE];
}

const existing = await readSnapshot();
const records = new Map(existing.map(record => [record.id, record]));
const token = githubToken();
const now = new Date().toISOString();
let requestCount = 0;

for (const source of state.sources) {
  const fullSourceSync = options.full || existing.length === 0;
  if (fullSourceSync) {
    for (const [id, record] of records) {
      if (record.repository === source.repository) records.delete(id);
    }
  }

  const result = await fetchSource(token, source, {
    full: fullSourceSync,
  });
  requestCount += result.requests;

  for (const node of result.nodes) {
    const record = snapshotRecord(source.repository, node);
    records.set(record.id, record);
  }

  source.lastSyncedAt = now;
  source.lastQuery = result.search;
  source.lastMatchedCount = result.issueCount;
  source.totalMergedInSnapshot = [...records.values()].filter(
    record => record.repository === source.repository
  ).length;
}

const sorted = [...records.values()].sort(
  (a, b) =>
    String(b.mergedAt ?? '').localeCompare(String(a.mergedAt ?? '')) ||
    b.number - a.number
);

state.updatedAt = now;
state.requestCountLastSync = requestCount;
state.recordCount = sorted.length;

console.log(
  'impact sync: ' +
    sorted.length +
    ' merged PRs in snapshot, ' +
    requestCount +
    ' GraphQL request(s)'
);

if (!options.dryRun) {
  for (const relativePath of [IMPACT_SNAPSHOT_PATH, IMPACT_SYNC_STATE_PATH]) {
    await mkdir(path.dirname(path.join(process.cwd(), relativePath)), {
      recursive: true,
    });
  }
  await writeFile(
    path.join(process.cwd(), IMPACT_SNAPSHOT_PATH),
    stringifyJsonLines(sorted)
  );
  await writeFile(
    path.join(process.cwd(), IMPACT_SYNC_STATE_PATH),
    JSON.stringify(state, null, 2) + '\n'
  );
}
