import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';

export const IMPACT_VERSION = 1;
export const IMPACT_RECORDS_DIR = path.join('work', 'impact', 'records');
export const IMPACT_SNAPSHOT_PATH = path.join('work', 'impact', 'sources', 'github-prs.jsonl');
export const IMPACT_SYNC_STATE_PATH = path.join('work', 'impact', 'sources', 'sync-state.json');
export const IMPACT_INDEX_PATH = path.join('public', 'data', 'impact-index-v1.json');
export const IMPACT_SUMMARY_PATH = path.join('public', 'data', 'impact-summary-v1.json');
export const IMPACT_CANDIDATES_PATH = path.join('public', 'data', 'impact-pr-candidates-v1.json');

const CONFIDENCE = new Set(['measured', 'derived', 'projected', 'observed']);
const DIRECTIONS = new Set(['baseline', 'reduction', 'shift', 'reliability', 'throughput']);
const RECURRENCE = new Set(['daily', 'per-run', 'per-event', 'one-time', 'none']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function asNonEmptyString(value, label) {
  assert(typeof value === 'string' && value.trim(), label + ' must be a non-empty string');
  return value.trim();
}

function asStringArray(value, label) {
  assert(Array.isArray(value), label + ' must be an array');
  return value.map((entry, index) =>
    asNonEmptyString(entry, label + '[' + index + ']')
  );
}

export function normalizeEvidenceUrl(value) {
  if (typeof value !== 'string') return value;
  if (!value.startsWith('https://github.com/')) return value;
  if (value.startsWith('https://github.com/teamleaderleo/')) return value;
  return value.replace('https://github.com/', 'https://redirect.github.com/');
}

export function extractMetricHints(body, { limit = 16 } = {}) {
  if (!body) return [];
  const metricPattern =
    /(?:\b(?:before|after|saved?|savings?|latency|runtime|runner|paid|free|cache hit|cache miss|minutes?|hours?|seconds?|job-minutes?)\b|\d+(?:\.\d+)?\s*(?:%|ms|s|sec(?:onds?)?|min(?:utes?)?|hours?|GB|MB|GiB|MiB|\/day))/i;

  const hints = [];
  const seen = new Set();

  for (const rawLine of String(body).split(/\r?\n/)) {
    const line = rawLine
      .replace(/<!--.*?-->/g, '')
      .replace(/<[^>]+>/g, '')
      .trim();
    if (!line || line.startsWith('![') || !metricPattern.test(line)) continue;
    const compact = line.length > 360 ? line.slice(0, 357) + '...' : line;
    if (seen.has(compact)) continue;
    seen.add(compact);
    hints.push(compact);
    if (hints.length >= limit) break;
  }

  return hints;
}

function validateEvidence(evidence, id) {
  assert(isObject(evidence), id + '.evidence must be an object');
  const url = asNonEmptyString(evidence.url, id + '.evidence.url');
  assert(
    !url.startsWith('https://github.com/') ||
      url.startsWith('https://github.com/teamleaderleo/'),
    id + '.evidence.url must use redirect.github.com for third-party GitHub evidence'
  );
  return {
    label: asNonEmptyString(evidence.label, id + '.evidence.label'),
    url,
    basis: asNonEmptyString(evidence.basis, id + '.evidence.basis'),
  };
}

function validateClaim(claim, recordId, index) {
  const prefix = recordId + '.claims[' + index + ']';
  assert(isObject(claim), prefix + ' must be an object');
  const confidence = asNonEmptyString(claim.confidence, prefix + '.confidence');
  const direction = asNonEmptyString(claim.direction, prefix + '.direction');
  const recurrence = asNonEmptyString(claim.recurrence, prefix + '.recurrence');
  assert(CONFIDENCE.has(confidence), prefix + '.confidence is unsupported');
  assert(DIRECTIONS.has(direction), prefix + '.direction is unsupported');
  assert(RECURRENCE.has(recurrence), prefix + '.recurrence is unsupported');
  assert(
    typeof claim.value === 'number' && Number.isFinite(claim.value),
    prefix + '.value must be finite'
  );

  return {
    id: asNonEmptyString(claim.id, prefix + '.id'),
    dimension: asNonEmptyString(claim.dimension, prefix + '.dimension'),
    metric: asNonEmptyString(claim.metric, prefix + '.metric'),
    direction,
    value: claim.value,
    unit: asNonEmptyString(claim.unit, prefix + '.unit'),
    recurrence,
    confidence,
    measurementWindow:
      claim.measurementWindow == null
        ? null
        : asNonEmptyString(claim.measurementWindow, prefix + '.measurementWindow'),
    population:
      claim.population == null
        ? null
        : asNonEmptyString(claim.population, prefix + '.population'),
    note:
      claim.note == null
        ? null
        : asNonEmptyString(claim.note, prefix + '.note'),
    headline: claim.headline === true,
    additive: claim.additive === true,
    overlapGroup:
      claim.overlapGroup == null
        ? null
        : asNonEmptyString(claim.overlapGroup, prefix + '.overlapGroup'),
  };
}

export function parseImpactRecord(sourcePath, raw) {
  const parsed = matter(raw);
  const data = parsed.data;
  assert(isObject(data), sourcePath + ' front matter must be an object');

  const id = asNonEmptyString(data.id, sourcePath + '.id');
  const claims = data.claims == null ? [] : data.claims;
  assert(Array.isArray(claims), id + '.claims must be an array');

  let number = null;
  if (data.number != null) {
    assert(Number.isInteger(data.number) && data.number > 0, id + '.number must be a positive integer');
    number = data.number;
  }

  return {
    id,
    repository: asNonEmptyString(data.repository, id + '.repository'),
    kind: asNonEmptyString(data.kind, id + '.kind'),
    number,
    title: asNonEmptyString(data.title, id + '.title'),
    status: asNonEmptyString(data.status, id + '.status'),
    happenedAt: asNonEmptyString(data.happenedAt, id + '.happenedAt'),
    recordedAt: asNonEmptyString(data.recordedAt, id + '.recordedAt'),
    areas: asStringArray(data.areas ?? [], id + '.areas'),
    summary: asNonEmptyString(data.summary, id + '.summary'),
    evidence: validateEvidence(data.evidence, id),
    claims: claims.map((claim, index) => validateClaim(claim, id, index)),
    body: parsed.content.trim(),
    sourcePath: sourcePath.replaceAll('\\', '/'),
  };
}

export async function loadImpactRecords({ projectRoot = process.cwd() } = {}) {
  const recordsDirectory = path.join(projectRoot, IMPACT_RECORDS_DIR);
  const entries = (await readdir(recordsDirectory))
    .filter(name => name.endsWith('.md'))
    .sort();

  const records = [];
  const ids = new Set();
  for (const name of entries) {
    const sourcePath = path.join(IMPACT_RECORDS_DIR, name);
    const raw = await readFile(path.join(projectRoot, sourcePath), 'utf8');
    const record = parseImpactRecord(sourcePath, raw);
    assert(!ids.has(record.id), 'duplicate impact record id: ' + record.id);
    ids.add(record.id);
    records.push(record);
  }

  return records.sort(
    (a, b) =>
      b.happenedAt.localeCompare(a.happenedAt) || a.id.localeCompare(b.id)
  );
}

function publicRecord(record) {
  const result = { ...record };
  delete result.body;
  return result;
}

function maxRecordedAt(records) {
  return records.reduce(
    (current, record) => (record.recordedAt > current ? record.recordedAt : current),
    '1970-01-01'
  );
}

export function buildImpactArtifacts(records) {
  const index = {
    version: IMPACT_VERSION,
    source: 'repository',
    generatedFrom: IMPACT_RECORDS_DIR.replaceAll('\\', '/'),
    updatedAt: maxRecordedAt(records),
    recordCount: records.length,
    records: records.map(publicRecord),
  };

  const headlineClaims = records.flatMap(record =>
    record.claims
      .filter(claim => claim.headline)
      .map(claim => ({
        recordId: record.id,
        repository: record.repository,
        title: record.title,
        evidence: record.evidence.url,
        ...claim,
      }))
  );

  const countsByConfidence = {};
  const countsByDimension = {};
  for (const record of records) {
    for (const claim of record.claims) {
      countsByConfidence[claim.confidence] =
        (countsByConfidence[claim.confidence] ?? 0) + 1;
      countsByDimension[claim.dimension] =
        (countsByDimension[claim.dimension] ?? 0) + 1;
    }
  }

  const additiveTotals = {};
  for (const claim of headlineClaims) {
    if (!claim.additive) continue;
    const key = claim.metric + '::' + claim.unit + '::' + claim.recurrence;
    const bucket = additiveTotals[key] ?? {
      metric: claim.metric,
      unit: claim.unit,
      recurrence: claim.recurrence,
      value: 0,
      claimCount: 0,
      recordIds: [],
    };
    bucket.value += claim.value;
    bucket.claimCount += 1;
    bucket.recordIds.push(claim.recordId);
    additiveTotals[key] = bucket;
  }

  const summary = {
    version: IMPACT_VERSION,
    source: 'repository',
    updatedAt: index.updatedAt,
    recordCount: records.length,
    claimCount: records.reduce((count, record) => count + record.claims.length, 0),
    repositories: [...new Set(records.map(record => record.repository))].sort(),
    countsByConfidence,
    countsByDimension,
    headlineClaims,
    additiveTotals: Object.values(additiveTotals),
    accountingRule:
      'Only claims explicitly marked additive are summed. Baselines, capacity shifts, overlapping savings, and projections stay separate.',
  };

  return { index, summary };
}

export function buildImpactCandidateArtifact(snapshotRecords, syncState = {}) {
  return {
    version: IMPACT_VERSION,
    source: 'repository-snapshot',
    updatedAt: syncState.updatedAt ?? null,
    recordCount: snapshotRecords.length,
    records: snapshotRecords.map(record => ({
      id: record.id,
      repository: record.repository,
      number: record.number,
      title: record.title,
      url: record.url,
      mergedAt: record.mergedAt ?? null,
      updatedAt: record.updatedAt ?? null,
      labels: record.labels ?? [],
      metricHints: record.metricHints ?? [],
    })),
  };
}

export function queryImpactCandidates(snapshot, filters = {}) {
  const q = String(filters.q ?? '').trim().toLowerCase();
  const repo = String(filters.repo ?? '').trim();
  const limit = Number.isInteger(filters.limit) && filters.limit > 0
    ? Math.min(filters.limit, 100)
    : 30;

  return snapshot.records
    .filter(record => !repo || record.repository === repo)
    .filter(record => {
      if (!q) return true;
      return [record.title, ...record.labels, ...record.metricHints]
        .join('\n')
        .toLowerCase()
        .includes(q);
    })
    .sort(
      (a, b) =>
        b.metricHints.length - a.metricHints.length ||
        String(b.mergedAt ?? '').localeCompare(String(a.mergedAt ?? ''))
    )
    .slice(0, limit);
}

export function queryImpactIndex(index, filters = {}) {
  const q = String(filters.q ?? '').trim().toLowerCase();
  const repo = String(filters.repo ?? '').trim();
  const area = String(filters.area ?? '').trim();
  const dimension = String(filters.dimension ?? '').trim();
  const id = String(filters.id ?? '').trim();

  return index.records.filter(record => {
    if (id && record.id !== id) return false;
    if (repo && record.repository !== repo) return false;
    if (area && !record.areas.includes(area)) return false;
    if (dimension && !record.claims.some(claim => claim.dimension === dimension)) {
      return false;
    }
    if (!q) return true;

    const haystack = [
      record.id,
      record.repository,
      record.title,
      record.summary,
      ...record.areas,
      ...record.claims.flatMap(claim => [
        claim.dimension,
        claim.metric,
        claim.note ?? '',
        claim.population ?? '',
      ]),
    ]
      .join('\n')
      .toLowerCase();

    return haystack.includes(q);
  });
}

export function parseJsonLines(raw) {
  return raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(
          'invalid JSONL at line ' +
            (index + 1) +
            ': ' +
            (error instanceof Error ? error.message : String(error))
        );
      }
    });
}

export function stringifyImpactCandidateArtifact(artifact) {
  return [
    '{',
    '  "version": ' + JSON.stringify(artifact.version) + ',',
    '  "source": ' + JSON.stringify(artifact.source) + ',',
    '  "updatedAt": ' + JSON.stringify(artifact.updatedAt) + ',',
    '  "recordCount": ' + JSON.stringify(artifact.recordCount) + ',',
    '  "records": [',
    artifact.records
      .map((record, index) =>
        '    ' +
        JSON.stringify(record) +
        (index + 1 === artifact.records.length ? '' : ',')
      )
      .join('\n'),
    '  ]',
    '}',
    '',
  ].join('\n');
}

export function stringifyJsonLines(records) {
  return records.map(record => JSON.stringify(record)).join('\n') + '\n';
}
