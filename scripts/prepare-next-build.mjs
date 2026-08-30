#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { lstat, mkdir, realpath, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

export class NextBuildPreparationError extends Error {}

async function optionalLstat(target) {
  try {
    return await lstat(target);
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined;
    throw error;
  }
}

function assertInsideProject(projectRoot, target) {
  const relative = path.relative(projectRoot, target);
  if (
    relative === '' ||
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new NextBuildPreparationError(
      'Generated Next path escaped the project root.'
    );
  }
}

async function requirePlainDirectory(target, label) {
  const details = await optionalLstat(target);
  if (!details) {
    throw new NextBuildPreparationError(`${label} disappeared during cleanup.`);
  }
  if (details.isSymbolicLink() || !details.isDirectory()) {
    throw new NextBuildPreparationError(
      `${label} must be a non-symlink directory.`
    );
  }
}

function getNextPaths(projectRoot) {
  const nextDirectory = path.join(projectRoot, '.next');
  const devDirectory = path.join(nextDirectory, 'dev');
  const devTypesDirectory = path.join(devDirectory, 'types');
  const lockPath = path.join(devDirectory, 'lock');

  assertInsideProject(projectRoot, nextDirectory);
  assertInsideProject(projectRoot, devDirectory);
  assertInsideProject(projectRoot, devTypesDirectory);
  assertInsideProject(projectRoot, lockPath);

  return { nextDirectory, devDirectory, devTypesDirectory, lockPath };
}

async function requireSafeLockPath(lockPath) {
  const existingLock = await optionalLstat(lockPath);
  if (
    existingLock &&
    (existingLock.isSymbolicLink() || !existingLock.isFile())
  ) {
    throw new NextBuildPreparationError(
      '.next/dev/lock must be a non-symlink file when present.'
    );
  }
}

async function ensureDevDirectory({ nextDirectory, devDirectory }) {
  const nextDetails = await optionalLstat(nextDirectory);
  if (!nextDetails) await mkdir(nextDirectory);
  await requirePlainDirectory(nextDirectory, '.next');

  const devDetails = await optionalLstat(devDirectory);
  if (!devDetails) await mkdir(devDirectory);
  await requirePlainDirectory(devDirectory, '.next/dev');
}

async function removeDevTypes({
  nextDirectory,
  devDirectory,
  devTypesDirectory,
}) {
  const currentTypes = await optionalLstat(devTypesDirectory);
  if (!currentTypes) return false;

  await requirePlainDirectory(nextDirectory, '.next');
  await requirePlainDirectory(devDirectory, '.next/dev');
  await requirePlainDirectory(devTypesDirectory, '.next/dev/types');
  await rm(devTypesDirectory, { recursive: true, force: false });
  return true;
}

export async function acquireNextDevLock(lockPath) {
  let Lockfile;
  let loadBindings;
  try {
    ({ Lockfile } = require('next/dist/build/lockfile'));
    ({ loadBindings } = require('next/dist/build/swc'));
  } catch (error) {
    throw new NextBuildPreparationError(
      `Could not load Next's dev-output lock: ${error.message}`
    );
  }

  const bindings = await loadBindings();
  if (bindings.isWasm) {
    throw new NextBuildPreparationError(
      'Next did not provide a native advisory lock; refusing generated-type cleanup.'
    );
  }

  const lock = Lockfile.tryAcquire(lockPath, false);
  if (!lock) return undefined;

  return {
    async release() {
      await lock.unlock();
    },
  };
}

export async function prepareNextBuild({
  projectRoot = process.cwd(),
  acquireLock = acquireNextDevLock,
} = {}) {
  const resolvedRoot = await realpath(projectRoot);
  const nextPaths = getNextPaths(resolvedRoot);
  const { nextDirectory, devDirectory, devTypesDirectory, lockPath } =
    nextPaths;

  const initialTypes = await optionalLstat(devTypesDirectory);
  if (!initialTypes) return { removed: false };

  await requirePlainDirectory(nextDirectory, '.next');
  await requirePlainDirectory(devDirectory, '.next/dev');
  await requirePlainDirectory(devTypesDirectory, '.next/dev/types');
  await requireSafeLockPath(lockPath);

  const lock = await acquireLock(lockPath);
  if (!lock) {
    throw new NextBuildPreparationError(
      "Next's dev output is active; refusing to remove .next/dev/types. Stop next dev before running a production build."
    );
  }

  let removed;
  try {
    removed = await removeDevTypes(nextPaths);
  } finally {
    await lock.release();
  }

  return { removed };
}

async function runNextBuildProcess({ projectRoot, buildArguments }) {
  const nextCli = require.resolve('next/dist/bin/next');
  const result = spawnSync(
    process.execPath,
    [nextCli, 'build', ...buildArguments],
    {
      cwd: projectRoot,
      env: process.env,
      stdio: 'inherit',
    }
  );

  if (result.error) throw result.error;
  return { status: result.status ?? 1, signal: result.signal };
}

export async function runNextBuild({
  projectRoot = process.cwd(),
  buildArguments = [],
  acquireLock = acquireNextDevLock,
  runBuild = runNextBuildProcess,
} = {}) {
  const resolvedRoot = await realpath(projectRoot);
  const nextPaths = getNextPaths(resolvedRoot);
  await ensureDevDirectory(nextPaths);
  await requireSafeLockPath(nextPaths.lockPath);

  const lock = await acquireLock(nextPaths.lockPath);
  if (!lock) {
    throw new NextBuildPreparationError(
      "Next's dev output is active; refusing the production build. Stop next dev before running a production build."
    );
  }

  try {
    const removed = await removeDevTypes(nextPaths);
    if (removed) {
      console.log('Removed stale generated Next dev route types.');
    }
    const result = await runBuild({
      projectRoot: resolvedRoot,
      buildArguments,
    });
    return { ...result, removed };
  } finally {
    await lock.release();
  }
}

const isDirectInvocation =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectInvocation) {
  try {
    const result = await runNextBuild({
      buildArguments: process.argv.slice(2),
    });
    process.exitCode = result.status;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
