# Deployment workflow

Vercel Hobby accounts have two rolling limits relevant to this repository:

- 32 builds per 3,600 seconds;
- 100 deployments per 86,400 seconds.

Using Next.js is classed as a build. The Git integration creates a preview deployment for each push to an ordinary non-production branch and a production deployment for pushes to `main`.

The current failing GitHub checks point to Vercel's `build-rate-limit`, so the immediate lockout is the 32-build hourly limit. The daily deployment limit remains a second ceiling.

The counters begin before a deployment succeeds. A deployment can consume quota when its build is cancelled or later errors.

## Branches that receive previews

Use a normal feature branch when browser inspection provides useful evidence:

- `feature/*` for visible product work;
- `fix/*` for behaviour that needs a live reproduction;
- `preview/*` for an explicit visual review pass.

These branches continue to deploy automatically.

## Branches that use GitHub CI only

The root `vercel.json` disables automatic deployments for:

- `docs/**`;
- `chore/**`;
- `internal/**`;
- `audit/**`.

Use these prefixes for prose, repository maintenance, investigations, and planning that can be judged through diffs and GitHub Actions.

## Practical cadence

1. Run local checks before pushing when local access is available.
2. Accumulate related changes on one branch.
3. Let GitHub CI answer lint, type, unit, and build questions.
4. Push a visual branch when a live browser review will change the decision.
5. Merge accepted work to `main` for the production deployment.

Vercel's Ignored Build Step runs after a deployment has already been created. Cancelled builds from that mechanism still count toward deployment quotas and concurrent build slots, so branch-level `git.deploymentEnabled` rules are the useful control for this repository.

## Sources

- [Vercel limits](https://vercel.com/docs/limits)
- [Deploying Git repositories with Vercel](https://vercel.com/docs/git)
- [Git configuration](https://vercel.com/docs/project-configuration/git-configuration)
- [Project settings and Ignored Build Step accounting](https://vercel.com/docs/project-configuration/project-settings)
