import { mkdir, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  acquireNextDevLock,
  NextBuildPreparationError,
  prepareNextBuild,
  runNextBuild,
} from '../scripts/prepare-next-build.mjs';

const temporaryRoots: string[] = [];

async function temporaryProject() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scrapbook-next-build-'));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  const { rm } = await import('node:fs/promises');
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map(root => rm(root, { recursive: true, force: true }))
  );
});

describe('prepareNextBuild', () => {
  it('does nothing when generated dev route types are absent', async () => {
    const root = await temporaryProject();
    const acquireLock = vi.fn();

    await expect(
      prepareNextBuild({ projectRoot: root, acquireLock })
    ).resolves.toEqual({
      removed: false,
    });
    expect(acquireLock).not.toHaveBeenCalled();
  });

  it('removes only generated dev route types while holding the dev lock', async () => {
    const root = await temporaryProject();
    const devTypes = path.join(root, '.next', 'dev', 'types');
    const productionTypes = path.join(root, '.next', 'types');
    const devCache = path.join(root, '.next', 'dev', 'cache');
    await mkdir(devTypes, { recursive: true });
    await mkdir(productionTypes, { recursive: true });
    await mkdir(devCache, { recursive: true });
    await writeFile(path.join(devTypes, 'validator.ts'), 'stale route');
    await writeFile(
      path.join(productionTypes, 'validator.ts'),
      'production route'
    );
    await writeFile(path.join(devCache, 'entry'), 'keep');

    let released = false;
    const acquireLock = vi.fn(async () => ({
      async release() {
        released = true;
      },
    }));

    await expect(
      prepareNextBuild({ projectRoot: root, acquireLock })
    ).resolves.toEqual({
      removed: true,
    });
    await expect(
      readFile(path.join(devTypes, 'validator.ts'))
    ).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(
      readFile(path.join(productionTypes, 'validator.ts'), 'utf8')
    ).resolves.toBe('production route');
    await expect(readFile(path.join(devCache, 'entry'), 'utf8')).resolves.toBe(
      'keep'
    );
    expect(released).toBe(true);
  });

  it('refuses cleanup when the dev output is locked', async () => {
    const root = await temporaryProject();
    const staleType = path.join(root, '.next', 'dev', 'types', 'validator.ts');
    await mkdir(path.dirname(staleType), { recursive: true });
    await writeFile(staleType, 'stale route');

    await expect(
      prepareNextBuild({
        projectRoot: root,
        acquireLock: async () => undefined,
      })
    ).rejects.toThrow("Next's dev output is active");
    await expect(readFile(staleType, 'utf8')).resolves.toBe('stale route');
  });

  it("respects Next's native dev-output lock", async () => {
    const root = await temporaryProject();
    const devDirectory = path.join(root, '.next', 'dev');
    const staleType = path.join(devDirectory, 'types', 'validator.ts');
    const lockPath = path.join(devDirectory, 'lock');
    await mkdir(path.dirname(staleType), { recursive: true });
    await writeFile(staleType, 'stale route');

    const lock = await acquireNextDevLock(lockPath);
    expect(lock).toBeDefined();

    try {
      await expect(prepareNextBuild({ projectRoot: root })).rejects.toThrow(
        "Next's dev output is active"
      );
      await expect(readFile(staleType, 'utf8')).resolves.toBe('stale route');
    } finally {
      await lock?.release();
    }
  });

  it('releases the lock when the generated directory changes under it', async () => {
    const root = await temporaryProject();
    const devTypes = path.join(root, '.next', 'dev', 'types');
    await mkdir(devTypes, { recursive: true });

    let released = false;
    const acquireLock = async () => {
      await import('node:fs/promises').then(({ rm }) =>
        rm(devTypes, { recursive: true })
      );
      return {
        async release() {
          released = true;
        },
      };
    };

    await expect(
      prepareNextBuild({ projectRoot: root, acquireLock })
    ).resolves.toEqual({
      removed: false,
    });
    expect(released).toBe(true);
  });

  it('rejects symlinked generated directories without acquiring a lock', async () => {
    const root = await temporaryProject();
    const outside = await temporaryProject();
    const devDirectory = path.join(root, '.next', 'dev');
    await mkdir(devDirectory, { recursive: true });
    await mkdir(path.join(outside, 'types'));
    await symlink(
      path.join(outside, 'types'),
      path.join(devDirectory, 'types')
    );
    const acquireLock = vi.fn();

    await expect(
      prepareNextBuild({ projectRoot: root, acquireLock })
    ).rejects.toThrow(NextBuildPreparationError);
    expect(acquireLock).not.toHaveBeenCalled();
  });
});

describe('runNextBuild', () => {
  it('holds the dev lock through the production build', async () => {
    const root = await temporaryProject();
    const devTypes = path.join(root, '.next', 'dev', 'types');
    const devCache = path.join(root, '.next', 'dev', 'cache');
    await mkdir(devTypes, { recursive: true });
    await mkdir(devCache);
    await writeFile(path.join(devTypes, 'validator.ts'), 'stale route');
    await writeFile(path.join(devCache, 'entry'), 'keep');

    const events: string[] = [];
    const acquireLock = vi.fn(async () => {
      events.push('acquire');
      return {
        async release() {
          events.push('release');
        },
      };
    });
    const runBuild = vi.fn(async () => {
      events.push('build');
      await expect(
        readFile(path.join(devTypes, 'validator.ts'))
      ).rejects.toMatchObject({
        code: 'ENOENT',
      });
      await expect(
        readFile(path.join(devCache, 'entry'), 'utf8')
      ).resolves.toBe('keep');
      expect(events).toEqual(['acquire', 'build']);
      return { status: 0, signal: null };
    });

    await expect(
      runNextBuild({ projectRoot: root, acquireLock, runBuild })
    ).resolves.toEqual({ status: 0, signal: null, removed: true });
    expect(events).toEqual(['acquire', 'build', 'release']);
  });

  it("excludes another owner of Next's native dev lock", async () => {
    const root = await temporaryProject();
    const lockPath = path.join(root, '.next', 'dev', 'lock');

    await expect(
      runNextBuild({
        projectRoot: root,
        runBuild: async () => {
          await expect(acquireNextDevLock(lockPath)).resolves.toBeUndefined();
          return { status: 0, signal: null };
        },
      })
    ).resolves.toMatchObject({ status: 0 });

    const nextOwner = await acquireNextDevLock(lockPath);
    expect(nextOwner).toBeDefined();
    await nextOwner?.release();
  });

  it('releases the native dev lock after a failed production build', async () => {
    const root = await temporaryProject();
    const lockPath = path.join(root, '.next', 'dev', 'lock');

    await expect(
      runNextBuild({
        projectRoot: root,
        runBuild: async () => {
          throw new Error('build failed');
        },
      })
    ).rejects.toThrow('build failed');

    const nextOwner = await acquireNextDevLock(lockPath);
    expect(nextOwner).toBeDefined();
    await nextOwner?.release();
  });

  it('does not start a production build while next dev owns the output', async () => {
    const root = await temporaryProject();
    const runBuild = vi.fn();

    await expect(
      runNextBuild({
        projectRoot: root,
        acquireLock: async () => undefined,
        runBuild,
      })
    ).rejects.toThrow("Next's dev output is active");
    expect(runBuild).not.toHaveBeenCalled();
  });
});
