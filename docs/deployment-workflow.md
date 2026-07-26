# Deployment workflow

Scrapbook treats GitHub CI and Vercel deployment as separate signals.

GitHub CI is the required merge signal. It runs lint, typecheck, unit tests, the production build, and Chromium/WebKit regressions. A skipped Vercel preview is an intentional deployment decision, not a code failure.

## Deployment policy

| Source | Vercel behaviour |
| --- | --- |
| `main` | Deploy automatically to production. |
| Ordinary feature, fix, docs, chore, internal, audit, or agent branches | Skip automatic Vercel deployment. |
| Commit message containing `[preview]` | Promote that commit to `preview/opt-in/<source-branch>` and deploy it. |
| Branch prefixed `preview/` | Deploy every push as a persistent preview branch. |
| Manual or non-Git deployment with no Git ref | Continue the deployment. |

Use `[preview]` as the conventional spelling. Marker matching is case-insensitive.

## How the repository enforces the policy

There are three small controls.

### 1. Git branch gate

The root `vercel.json` uses `git.deploymentEnabled` with a deny-by-default rule:

- `main` is enabled;
- `preview/**` is enabled;
- every other Git branch is disabled.

This gate runs at the Git integration layer, before Vercel creates a routine feature-branch deployment. It is the quota-saving control.

### 2. Commit-marker promotion

`.github/workflows/vercel-preview-opt-in.yml` watches non-production pushes. When the latest commit message contains `[preview]`, it force-updates a stable branch named:

```text
preview/opt-in/<source-branch>
```

Vercel sees that explicit preview branch and deploys the marked commit. Later ordinary commits on the source branch stay CI-only until another commit carries `[preview]`.

A contributor who wants every push deployed can work directly on a `preview/…` branch instead.

### 3. Vercel ignored-build safeguard

`scripts/vercel-preview-policy.mjs` is the repository-owned final decision for any deployment that reaches Vercel's Ignored Build Step. It continues for:

- `main`;
- `preview/…` branches;
- a commit containing `[preview]`;
- a deployment with no Git ref.

It exits `0` for a routine branch so Vercel ignores the build, and exits `1` when the build should continue. The command prints one concise reason in the deployment log.

The decision function is pure and covered by unit tests. The ignored-build command is defence in depth; the branch gate does the quota-saving work for ordinary Git pushes.

## When a preview is warranted

Request a preview when a shareable deployed URL will change the review decision, especially for:

- visual or responsive inspection;
- serverless or runtime-environment behaviour;
- authentication, cookies, headers, redirects, middleware, or edge behaviour;
- Vercel routing, caching, image optimisation, or deployment configuration;
- stakeholder review outside the local and CI environments.

Routine prose, tests, repository maintenance, and changes already covered by deterministic browser CI should stay on ordinary branches without a marker.

## Practical cadence

1. Run local checks before pushing when local access is available.
2. Accumulate related changes instead of pushing tiny deployment probes.
3. Let GitHub CI answer lint, type, unit, build, and browser questions.
4. Add `[preview]` to one commit when a deployed review URL adds useful evidence, or use a `preview/…` branch for a longer preview session.
5. Merge accepted work to `main` for the automatic production deployment.

## Quota accounting

Vercel Hobby accounts have rolling build and deployment limits. Vercel's Ignored Build Step executes after a deployment has already been created, and Vercel documents ignored or cancelled builds as counting toward deployment quotas and concurrent build slots.

For that reason, this repository does not rely on the ignored-build command alone. `git.deploymentEnabled` blocks routine branches before deployment creation. The ignored-build script remains a readable safeguard for manual deployments and any deployment that reaches the build stage through another route.

## Retrying a blocked production deployment

When a `main` deployment hits a rolling limit, wait until enough earlier activity leaves the quota window, then trigger one deliberate retry. Repeated rapid retries create more deployment attempts and extend the problem.

## Project boundary

This policy applies to the existing Vercel project `setzen`. It changes repository-controlled Git deployment behaviour only. Production domains, project environment variables, and runtime settings stay unchanged.

## Sources

- [Vercel limits](https://vercel.com/docs/limits)
- [Deploying Git repositories with Vercel](https://vercel.com/docs/git)
- [Git configuration](https://vercel.com/docs/project-configuration/git-configuration)
- [Project settings and Ignored Build Step accounting](https://vercel.com/docs/project-configuration/project-settings)
- [System environment variables](https://vercel.com/docs/environment-variables/system-environment-variables)
