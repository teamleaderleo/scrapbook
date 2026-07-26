#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const ENTRY_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DRIVE_ID_PATTERN = /^[A-Za-z0-9_-]{10,256}$/;
const REQUEST_ROOT = '.scrapbook/import-requests';
const ALLOWED_KEYS = new Set(['version', 'entryId', 'sourceType', 'source']);

function fail(message) {
  const error = new Error(message);
  error.code = 'INVALID_GALLERY_IMPORT_REQUEST';
  throw error;
}

function requireObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('request must be a JSON object');
  }
  return value;
}

function requireSingleLine(value, field, maximum) {
  if (typeof value !== 'string') fail(`${field} must be a string`);
  const hasControlCharacter = Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f);
  });
  if (hasControlCharacter) fail(`${field} must be one printable line`);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maximum) fail(`${field} is empty or too long`);
  return trimmed;
}

function validateAttachmentUrl(source) {
  let url;
  try {
    url = new URL(source);
  } catch {
    fail('GitHub attachment source must be an HTTPS URL');
  }

  const allowed =
    (url.hostname === 'github.com' && url.pathname.startsWith('/user-attachments/assets/')) ||
    url.hostname === 'user-images.githubusercontent.com' ||
    url.hostname === 'private-user-images.githubusercontent.com';

  if (url.protocol !== 'https:' || !allowed || url.username || url.password) {
    fail('only supported HTTPS GitHub user-attachment URLs are accepted');
  }
  return url.toString();
}

function normaliseRequestPath(value) {
  return value.replaceAll('\\', '/').replace(/^\.\/+/, '');
}

export function validateGalleryImportRequest(value, { requestPath, branch }) {
  const request = requireObject(value);
  for (const key of Object.keys(request)) {
    if (!ALLOWED_KEYS.has(key)) fail(`unknown request field: ${key}`);
  }

  if (request.version !== 1) fail('version must equal 1');

  const entryId = requireSingleLine(request.entryId, 'entryId', 80);
  if (!ENTRY_ID_PATTERN.test(entryId)) fail('entryId must be a lowercase kebab-case slug');

  const sourceType = requireSingleLine(request.sourceType, 'sourceType', 32);
  if (!['drive', 'github-attachment'].includes(sourceType)) {
    fail('sourceType must be drive or github-attachment');
  }

  let source = requireSingleLine(request.source, 'source', 512);
  if (sourceType === 'drive') {
    if (!DRIVE_ID_PATTERN.test(source)) fail('Drive source must be a file ID, not a URL or path');
  } else {
    source = validateAttachmentUrl(source);
  }

  const expectedBranch = `agent-check-in/${entryId}`;
  if (branch !== expectedBranch) {
    fail(`request branch must equal ${expectedBranch}`);
  }

  const expectedPath = `${REQUEST_ROOT}/${entryId}.json`;
  if (normaliseRequestPath(requestPath) !== expectedPath) {
    fail(`request path must equal ${expectedPath}`);
  }

  return {
    version: 1,
    entryId,
    sourceType,
    source,
    branch: expectedBranch,
    requestPath: expectedPath,
    outputPath: `public/gallery/agents/${entryId}.webp`,
  };
}

export async function readGalleryImportRequest(requestPath, branch) {
  const raw = await fs.readFile(requestPath, 'utf8');
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    fail('request file is not valid JSON');
  }
  return validateGalleryImportRequest(value, { requestPath, branch });
}

async function appendGithubOutputs(outputFile, request) {
  const lines = [
    `entry_id=${request.entryId}`,
    `source_type=${request.sourceType}`,
    `source=${request.source}`,
    `target_branch=${request.branch}`,
    `request_path=${request.requestPath}`,
    `output_path=${request.outputPath}`,
  ];
  await fs.appendFile(outputFile, `${lines.join('\n')}\n`, 'utf8');
}

async function main() {
  const [requestPath, branch, githubOutput] = process.argv.slice(2);
  if (!requestPath || !branch) {
    console.error('usage: node scripts/validate-gallery-import-request.mjs <request-file> <branch> [github-output-file]');
    process.exit(2);
  }

  try {
    const request = await readGalleryImportRequest(requestPath, branch);
    if (githubOutput) await appendGithubOutputs(githubOutput, request);
    process.stdout.write(`${JSON.stringify(request, null, 2)}\n`);
  } catch (error) {
    console.error(`gallery import request failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
