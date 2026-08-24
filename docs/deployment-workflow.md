# Deployment workflow

Scrapbook treats GitHub CI, browser review, and Vercel deployment as separate signals.

Routine hosted CI answers the cheap repository questions: ESLint and Vitest run in the quality lane, while a separate lane performs the production Next.js build. Browser checks are author-side tools for changes whose result depends on a browser. A skipped Vercel preview is an intentional deployment decision, not a code failure.

## Deployment policy

| Source | Vercel behaviour |
| --- | --- |
| `main` | A tiny GitHub Actions OIDC signal requests production through the central deploy governor; Vercel Git auto-deploy is disabled. |
| Ordinary feature, fix, docs, chore, internal, audit, or agent branches | Skip automatic Vercel deployment. |
| Commit message containing `[preview]` | Promote that commit to `preview/opt-in/<source-branch>` and deploy it. |
| Branch prefixed `preview/` | Deploy every push as a persistent preview branch. |
| Manual or non-Git deployment with no Git ref | Continue the deployment. |

Use `[preview]` as the conventional spelling. Marker matching is case-insensitive.

## Production governor

`teamleaderleo/deploy-governor` owns production admission across the operator's governed Vercel projects. Scrapbook does not store its Vercel credential and does not perform the Vercel deployment itself.

The normal path is event-driven:

```text
Scrapbook main changes
  -> the Production deploy signal job requests a short-lived GitHub OIDC token
  -> the job posts that token directly to Stensibly
  -> Stensibly verifies GitHub's signature and the signed repository / ref / SHA / workflow claims
  -> Stensibly sends the exact repo / branch / SHA to deploy-governor
  -> governor checks Vercel's rolling team-wide deployment history
  -> below the soft threshold: create one exact-SHA production deployment
  -> at or above the threshold: retain the candidate without creating a Vercel deployment
  -> one global half-hour batch slot drains at most one queued project
```

`.github/workflows/deploy-signal.yml` is deliberately tiny. It runs on every `main` push, requests GitHub's short-lived OIDC credential with `id-token: write`, and sends that credential to the fixed Stensibly audience. It has no stored deployment secret, performs no repository checkout, installs no dependencies, and does not call Vercel.

Stensibly accepts only GitHub's RS256 OIDC issuer for the exact deploy-governor audience. It requires a branch push and an exact `.github/workflows/deploy-signal.yml` workflow ref, then takes repository, ref, and SHA from the signed token rather than a request body. The existing source allowlist is checked before any outbound deploy-governor authority is minted.

Normal quality/build CI remains separate and can run in parallel, as it did when Vercel Git deployment was automatic.

Vercel supplies the governor with Scrapbook's existing project identity and production branch through the project's Git integration. The governor checks exact-SHA Vercel history before creating a deployment, so repeated requests do not duplicate an already-attempted revision.

There is no production-head polling loop.

## How the repository enforces the policy

Three controls handle different points in the path.

### 1. Git branch gate

The root `vercel.json` uses `git.deploymentEnabled` with a deny-by-default rule:

- `main` is disabled because the governor creates production deployments explicitly;
- `preview/**` is enabled;
- every other Git branch is disabled.

This prevents Vercel's Git integration from creating a production deployment before the cross-project governor has made its quota decision.

### 2. Commit-marker promotion

`.github/workflows/vercel-preview-opt-in.yml` watches non-production pushes. When the latest commit message contains `[preview]`, it force-updates a stable branch named:

```text
preview/opt-in/<source-branch>
```

Vercel sees that explicit preview branch and deploys the marked commit. Later ordinary commits on the source branch stay CI-only until another commit carries `[preview]`.

A contributor who wants every push deployed can work directly on a `preview/…` branch instead.

### 3. Vercel ignored-build safeguard

`scripts/vercel-preview-policy.mjs` is the repository-owned final decision for any deployment that reaches Vercel's Ignored Build Step. It continues for:

- `main` when an explicit governor or manual deployment reaches Vercel;
- `preview/…` branches;
- a commit containing `[preview]`;
- a deployment with no Git ref.

It exits `0` for a routine branch so Vercel ignores the build, and exits `1` when the build should continue. The command prints one concise reason in the deployment log.

The ignored-build command is defence in depth. It is not the production quota governor because Vercel has already created a deployment record by the time this command runs.

## When a preview earns a deployment

Ask for a preview when a shareable deployed URL can change the review decision: responsive layout, browser interaction, serverless/runtime behaviour, authentication and cookies, headers and redirects, Vercel routing or caching, or somebody outside the local environment who needs to review the exact deployment.

A browser question can still be answered locally. Use the smallest Playwright scope or direct browser inspection that exercises the behaviour. A Vercel preview earns its slot when the deployment environment or shareable URL adds evidence beyond that local check.

Routine prose, tests, repository maintenance, and source-level changes stay on ordinary branches.

## Practical cadence

Run local checks before pushing when local access is available. Let routine GitHub CI answer lint, unit-test, and production-build questions. Use an explicit browser check when the change needs one. Add `[preview]` to a commit when a deployed URL adds useful evidence, or use a `preview/…` branch for a longer preview session. Merge accepted work to `main`; the OIDC signal immediately asks the governor to handle production admission.

## Quota accounting

The governor counts Vercel deployments across the complete Vercel team, including preview deployments and projects that are not governed. The first 50 deployments in the rolling 24-hour window leave fresh governed production candidates in immediate mode. At or above that soft threshold, routine production candidates wait and the global half-hour scheduler deploys at most one queued project per slot.

This preserves headroom below Vercel Hobby's 100-deployment rolling limit for previews, manual deployments, non-governed projects, and races around the threshold.

Vercel's Ignored Build Step executes after a deployment has already been created, so ignored or cancelled builds cannot provide the same quota protection.

## Recovery

If Stensibly or the governor is unavailable, the signal job fails visibly instead of silently falling back to a timer. The current production deployment stays live. Re-running the failed signal is safe because the governor checks exact-SHA Vercel history before creating anything.

The repository-level rollback for the delivery path is to set `git.deploymentEnabled.main` back to `true`, restoring Vercel's normal Git production trigger.

A specific failed or canceled exact SHA is treated as already attempted by the governor rather than retried forever. Push a repaired revision or perform one deliberate recovery deployment when needed.

## Project boundary

This policy applies to the existing Vercel project `setzen`. Production domains, project environment variables, previews, and runtime settings stay unchanged.

## Sources

- [Vercel limits](https://vercel.com/docs/limits)
- [Deploying Git repositories with Vercel](https://vercel.com/docs/git)
- [Git configuration](https://vercel.com/docs/project-configuration/git-configuration)
- [Project settings and Ignored Build Step accounting](https://vercel.com/docs/project-configuration/project-settings)
- [System environment variables](https://vercel.com/docs/environment-variables/system-environment-variables)
- [GitHub OpenID Connect reference](https://docs.github.com/en/actions/reference/security/oidc)
