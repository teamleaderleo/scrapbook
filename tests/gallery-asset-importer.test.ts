import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { afterEach, describe, expect, test } from 'vitest';

const temporaryDirectories: string[] = [];

async function makeTemporaryDirectory() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'scrapbook-gallery-import-'));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('gallery asset importer', () => {
  test('converts raster artwork into a bounded WebP', async () => {
    const directory = await makeTemporaryDirectory();
    const sourcePath = path.join(directory, 'source.png');
    const publicRoot = path.join(directory, 'public', 'gallery', 'agents');

    await sharp({
      create: {
        width: 1800,
        height: 1200,
        channels: 4,
        background: { r: 236, g: 104, b: 44, alpha: 1 },
      },
    })
      .png()
      .toFile(sourcePath);

    const result = spawnSync(
      process.execPath,
      ['scripts/import-gallery-asset.mjs', sourcePath, 'test-visitor'],
      {
        cwd: process.cwd(),
        env: { ...process.env, GALLERY_PUBLIC_ROOT: publicRoot },
        encoding: 'utf8',
      },
    );

    expect(result.status, result.stderr).toBe(0);

    const outputPath = path.join(publicRoot, 'test-visitor.webp');
    const output = await readFile(outputPath);
    const metadata = await sharp(output).metadata();

    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBeLessThanOrEqual(1200);
    expect(metadata.height).toBeLessThanOrEqual(1200);
    expect(output.length).toBeLessThanOrEqual(500 * 1024);
  });

  test('rejects entry ids that cannot be used as gallery filenames', async () => {
    const directory = await makeTemporaryDirectory();
    const sourcePath = path.join(directory, 'source.png');

    await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .png()
      .toFile(sourcePath);

    const result = spawnSync(
      process.execPath,
      ['scripts/import-gallery-asset.mjs', sourcePath, '../escape'],
      { cwd: process.cwd(), encoding: 'utf8' },
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('lowercase kebab-case slug');
  });
});
