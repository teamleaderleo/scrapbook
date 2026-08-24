# Deployment workflow

Scrapbook treats GitHub CI, browser review, and Vercel deployment as separate signals.

Routine hosted CI answers the cheap repository questions: ESLint and Vitest run in the quality lane, while a separate lane performs the production Next.js build. Browser checks are author-side tools for changes whose result depends on a browser. A skipped Vercel preview is an intentional deployment decision, not a code failure.

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

Three controls handle different points in the path.

### 1. Git branch gate

The root `vercel.json` uses `git.deploymentEnabled` with a deny-by-default rule:

- `main` is enabled;
- `preview/**` is enabled;
- every other Git branch is disabled.

This runs at the Git integration layer, before Vercel creates a routine branch deployment. It is the quota-saving control.

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

## When a preview earns a deployment

Ask for a preview when a shareable deployed URL can change the review decision: responsive layout, browser interaction, serverless/runtime behaviour, authentication and cookies, headers and redirects, Vercel routing or caching, or somebody outside the local environment who needs to review the exact deployment.

A browser question can still be answered locally. Use the smallest Playwright scope or direct browser inspection that exercises the behaviour. A Vercel preview earns its slot when the deployment environment or shareable URL adds evidence beyond that local check.

Routine prose, tests, repository maintenance, and source-level changes stay on ordinary branches.

## Practical cadence

Run local checks before pushing when local access is available. Accumulate related edits instead of turning every small correction into a remote deployment attempt. Let routine GitHub CI answer lint, unit-test, and production-build questions. Use an explicit browser check when the change needs one. Add `[preview]` to a commit when a deployed URL adds useful evidence, or use a `preview/…` branch for a longer preview session. Merge accepted work to `main` for the production deployment.

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
