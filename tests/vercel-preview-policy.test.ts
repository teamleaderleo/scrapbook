import { describe, expect, it, vi } from 'vitest';

import {
  VERCEL_CONTINUE_BUILD_EXIT_CODE,
  VERCEL_IGNORE_BUILD_EXIT_CODE,
  decideVercelDeployment,
  ignoredBuildExitCode,
  runVercelPreviewPolicy,
} from '../scripts/vercel-preview-policy.mjs';

describe('Vercel preview deployment policy', () => {
  it('continues production deployment from main', () => {
    const decision = decideVercelDeployment({
      gitRef: 'main',
      commitMessage: 'Merge pull request #401',
    });

    expect(decision).toEqual({
      deploy: true,
      reason: 'main is the production branch',
    });
    expect(ignoredBuildExitCode(decision)).toBe(VERCEL_CONTINUE_BUILD_EXIT_CODE);
  });

  it('skips an ordinary feature branch', () => {
    const decision = decideVercelDeployment({
      gitRef: 'feature/navigation-copy',
      commitMessage: 'Tighten navigation copy',
    });

    expect(decision.deploy).toBe(false);
    expect(decision.reason).toContain('add [preview] or push under preview/');
    expect(ignoredBuildExitCode(decision)).toBe(VERCEL_IGNORE_BUILD_EXIT_CODE);
  });

  it('continues when the commit message contains the preview marker', () => {
    const decision = decideVercelDeployment({
      gitRef: 'feature/navigation-copy',
      commitMessage: 'Tighten navigation copy [preview]',
    });
    const upperCaseDecision = decideVercelDeployment({
      gitRef: 'feature/navigation-copy',
      commitMessage: 'Tighten navigation copy [PREVIEW]',
    });

    expect(decision).toEqual({
      deploy: true,
      reason: 'commit message contains [preview]',
    });
    expect(upperCaseDecision).toEqual(decision);
  });

  it('continues for a persistent preview branch', () => {
    const decision = decideVercelDeployment({
      gitRef: 'preview/navigation-copy',
      commitMessage: 'Tighten navigation copy',
    });

    expect(decision.deploy).toBe(true);
    expect(decision.reason).toContain('explicit preview branch');
  });

  it('continues manual or non-Git deployments when the Git ref is missing', () => {
    const decision = decideVercelDeployment({
      gitRef: undefined,
      commitMessage: undefined,
    });

    expect(decision).toEqual({
      deploy: true,
      reason: 'manual or non-Git deployment has no Git ref',
    });
  });

  it('prints a concise skip explanation for Vercel logs', () => {
    const log = vi.fn();
    const exitCode = runVercelPreviewPolicy(
      {
        VERCEL_GIT_COMMIT_REF: 'fix/copy',
        VERCEL_GIT_COMMIT_MESSAGE: 'Fix copy',
      },
      log,
    );

    expect(exitCode).toBe(VERCEL_IGNORE_BUILD_EXIT_CODE);
    expect(log).toHaveBeenCalledWith(
      '[vercel-preview-policy] skip: fix/copy is a routine branch; add [preview] or push under preview/ to opt in',
    );
  });
});
