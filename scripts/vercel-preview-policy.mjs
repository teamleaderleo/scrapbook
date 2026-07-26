import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const VERCEL_IGNORE_BUILD_EXIT_CODE = 0;
export const VERCEL_CONTINUE_BUILD_EXIT_CODE = 1;

/**
 * @typedef {object} VercelDeploymentInput
 * @property {string | undefined} gitRef
 * @property {string | undefined} commitMessage
 */

/**
 * Decide whether a deployment that reaches Vercel's ignored-build step should continue.
 * Git branch gating in vercel.json prevents routine branches from creating deployments;
 * this function is the final repository-owned policy for main, previews, and manual runs.
 *
 * @param {VercelDeploymentInput} input
 */
export function decideVercelDeployment({ gitRef, commitMessage }) {
  const ref = typeof gitRef === 'string' ? gitRef.trim() : '';
  const message = typeof commitMessage === 'string' ? commitMessage : '';
  const hasPreviewMarker = message.toLowerCase().includes('[preview]');

  if (!ref) {
    return {
      deploy: true,
      reason: 'manual or non-Git deployment has no Git ref',
    };
  }

  if (ref === 'main') {
    return {
      deploy: true,
      reason: 'main is the production branch',
    };
  }

  if (ref.startsWith('preview/')) {
    return {
      deploy: true,
      reason: `${ref} is an explicit preview branch`,
    };
  }

  if (hasPreviewMarker) {
    return {
      deploy: true,
      reason: 'commit message contains [preview]',
    };
  }

  return {
    deploy: false,
    reason: `${ref} is a routine branch; add [preview] or push under preview/ to opt in`,
  };
}

/**
 * Vercel continues a build on exit 1 and ignores it on exit 0.
 *
 * @param {{ deploy: boolean }} decision
 */
export function ignoredBuildExitCode(decision) {
  return decision.deploy ? VERCEL_CONTINUE_BUILD_EXIT_CODE : VERCEL_IGNORE_BUILD_EXIT_CODE;
}

/**
 * @param {NodeJS.ProcessEnv} env
 * @param {(message: string) => void} log
 */
export function runVercelPreviewPolicy(env = process.env, log = console.log) {
  const decision = decideVercelDeployment({
    gitRef: env.VERCEL_GIT_COMMIT_REF,
    commitMessage: env.VERCEL_GIT_COMMIT_MESSAGE,
  });
  const action = decision.deploy ? 'build' : 'skip';
  log(`[vercel-preview-policy] ${action}: ${decision.reason}`);
  return ignoredBuildExitCode(decision);
}

const invokedUrl = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (invokedUrl === import.meta.url) {
  process.exitCode = runVercelPreviewPolicy();
}
