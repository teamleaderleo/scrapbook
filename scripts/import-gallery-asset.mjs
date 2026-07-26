#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';

const MAX_INPUT_BYTES = 12 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 500 * 1024;
const MAX_DIMENSION = 1200;
const QUALITY_STEPS = [84, 78, 72, 66, 60];
const ALLOWED_MIME_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function fail(message) {
  console.error(`gallery asset import failed: ${message}`);
  process.exit(1);
}

const [sourcePath, entryId] = process.argv.slice(2);

if (!sourcePath || !entryId) {
  fail('usage: node scripts/import-gallery-asset.mjs <source-file> <entry-id>');
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entryId)) {
  fail('entry id must be a lowercase kebab-case slug');
}

const input = await fs.readFile(sourcePath).catch((error) => {
  fail(`cannot read source file: ${error.message}`);
});

if (!input || input.length === 0) fail('source file is empty');
if (input.length > MAX_INPUT_BYTES) fail('source file exceeds the 12 MB import limit');

const detected = await fileTypeFromBuffer(input);
if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
  fail(`unsupported source type${detected?.mime ? `: ${detected.mime}` : ''}`);
}

const image = sharp(input, {
  animated: false,
  failOn: 'error',
  limitInputPixels: 40_000_000,
}).rotate();

const metadata = await image.metadata();
if (!metadata.width || !metadata.height) fail('source image has no readable dimensions');

const resized = image.resize({
  width: MAX_DIMENSION,
  height: MAX_DIMENSION,
  fit: 'inside',
  withoutEnlargement: true,
});

let output;
let outputQuality;
for (const quality of QUALITY_STEPS) {
  const candidate = await resized
    .clone()
    .webp({ quality, alphaQuality: 90, effort: 6 })
    .toBuffer();

  output = candidate;
  outputQuality = quality;
  if (candidate.length <= MAX_OUTPUT_BYTES) break;
}

if (!output || output.length > MAX_OUTPUT_BYTES) {
  fail('optimised WebP still exceeds 500 KB; simplify or crop the source image');
}

const publicRoot =
  process.env.GALLERY_PUBLIC_ROOT ?? path.join(process.cwd(), 'public', 'gallery', 'agents');
const outputPath = path.join(publicRoot, `${entryId}.webp`);

await fs.mkdir(publicRoot, { recursive: true });
await fs.writeFile(outputPath, output);

const relativePath = path.relative(process.cwd(), outputPath) || outputPath;
console.log(
  JSON.stringify(
    {
      sourceMime: detected.mime,
      sourceBytes: input.length,
      sourceWidth: metadata.width,
      sourceHeight: metadata.height,
      outputPath: relativePath,
      outputBytes: output.length,
      outputQuality,
    },
    null,
    2,
  ),
);
