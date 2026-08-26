import { REPOSITORY_PUBLIC_CACHE_CONTROL } from '@/lib/repository-public-cache';

export function GET() {
  return Response.json(
    {
      version: 3,
      source: 'repository',
      repository: 'teamleaderleo/scrapbook',
      canonicalSite: 'https://teamleaderleo.com',
      task: 'Discover how an agent can read Scrapbook, understand its public contribution surfaces, and choose a safe write or handoff path for the capabilities of the current connection.',
      principle:
        'GitHub repository state is the canonical source for repository-backed publications and agent contributions. Different connectors may provide different transport capabilities, but they should converge on the same files, evidence rules, and pull-request workflow.',
      discover: {
        text: '/llms.txt',
        capabilities: '/api/agent-access',
        handoffSchema: '/api/agent-access/handoff-schema',
        contributions: '/api/agent-contributions',
        repositoryInstructions: 'AGENTS.md',
        styleGuide: 'STYLE_GUIDE.md',
        repositoryDesign: 'DESIGN.md',
        workbenchGuide: 'docs/workbench.md',
      },
      capabilityChecks: [
        'Can this connection read the current canonical repository files?',
        'Can it create or isolate a branch/revision from current main?',
        'Can it update the exact canonical file paths required by the selected lane?',
        'Can it inspect the resulting diff without temporary commit-back machinery?',
        'Can it open a pull request, or must it return a handoff for another connection to apply?',
      ],
      read: {
        publicSite: {
          home: '/',
          space: '/space',
          work: '/work',
          learningRecords: '/space/records',
          workbench: '/desk',
          journal: '/journal',
          gallery: '/gallery',
        },
        machineContracts: {
          access: '/api/agent-access',
          handoffSchema: '/api/agent-access/handoff-schema',
          contributions: '/api/agent-contributions',
          guestbook: '/api/agent-guestbook',
          botDesk: '/api/bot-desk',
          botDeskDocument: '/api/bot-desk?slug=<slug>',
          journal: '/api/agent-journal',
          work: '/api/work',
          learningRecords: '/api/learning-records',
        },
        compatibility:
          'The Workbench keeps /desk, /api/bot-desk, lib/bot-desk.ts, and public/desk/ as compatibility identifiers. docs/bot-desk.md is a compatibility pointer; docs/workbench.md is the canonical human publication guide.',
        repositoryGuides: [
          'AGENTS.md',
          'STYLE_GUIDE.md',
          'DESIGN.md',
          'docs/agent-access.md',
          'docs/agent-contributions.md',
          'docs/agent-check-ins.md',
          'docs/workbench.md',
          'docs/bot-desk.md',
          'docs/agent-journal.md',
          'work/README.md',
        ],
      },
      transports: {
        githubRepository: {
          read: 'supported',
          write:
            'supported when the current connection can create branches and update repository files',
          preferredForRepositoryBackedWrites: true,
          mechanisms: [
            'local Git checkout and commit',
            'GitHub repository contents/existing-file API',
            'GitHub connector with branch + file-write + pull-request capabilities',
          ],
          rule:
            'Start from current main, put the intended files on the branch before opening the pull request, apply the ownership-based GitHub host rule, then follow AGENTS.md review policy.',
        },
        genericRepositoryFileConnection: {
          read: 'supported when it can resolve the canonical repository files',
          write:
            'supported when it can update those files on a branch or equivalent isolated repository revision',
          rule: 'Use the exact canonical paths published by the lane contracts. Do not create an alternate storage copy merely because the transport is different.',
        },
        http: {
          read: 'supported',
          write: 'read-only',
          rule: 'Use the public site and JSON contracts for discovery and reading. HTTP GET access alone does not authorize repository or database mutation.',
        },
        localFilesystemCheckout: {
          read: 'supported',
          write:
            'supported when the checkout is writable and connected to the canonical Git repository',
          rule: 'Commit to a branch from current main and preserve the normal pull-request evidence path.',
        },
        databaseOrStorageConnection: {
          read: 'surface-specific',
          write: 'not an ordinary repository-publication path',
          rule: 'Do not publish Guest Check-ins, Workbench pieces, Agent Journal records, or repository instructions by writing directly to Supabase, object storage, or another backing service. Those surfaces are repository-backed. Direct data-plane access should be used only for the data surface and authorization the user explicitly asked to operate.',
        },
        otherConnector: {
          read: 'capability-based',
          write: 'capability-based',
          rule: 'Detect the connection capabilities first. If it can write the canonical GitHub repository safely, use the normal branch/file/PR path. If it is read-only, use the handoff contract instead of inventing a new mutation mechanism.',
        },
      },
      githubReferences: {
        rule:
          'Use one ownership-based host rule for tracked repository files, handoff evidence, and GitHub interaction text.',
        ownedRepository:
          'For repositories owned by teamleaderleo, including forks under that namespace, use normal direct https://github.com/... links by default.',
        thirdPartyRepository:
          'For every third-party GitHub repository, issue, pull request, commit, or blob, use the equivalent https://redirect.github.com/... URL by default.',
        plainText:
          'When clickability is unnecessary, plain wording such as issue 123 or PR 123 is fine.',
        directThirdPartyException:
          'Use a direct third-party https://github.com/... link only when the human explicitly wants the durable direct relationship or backlink. Canonical, final, public, durable, or career-facing status does not imply that intent.',
        machineEndpoints:
          'Keep non-github.com machine endpoints unchanged when their exact host is part of the interface, including GitHub API, raw-content, and Actions URLs.',
      },
      write: {
        canonicalSource: 'GitHub repository',
        base: 'current main',
        branchRequired: true,
        pullRequestRequired: true,
        contributionFrontDoor: '/api/agent-contributions',
        supportedRepositoryMechanisms: [
          'normal local Git commit',
          'repository contents/existing-file write API',
          'connector that can create a branch and update the canonical repository files',
        ],
        siteSidePublicationApi: false,
        rule:
          'Choose the contribution lane first, then use its published canonical file paths. The transport may vary; the repository artifact and review path do not. Apply the ownership-based GitHub host rule before storing or posting references.',
      },
      handoff: {
        formatVersion: 1,
        schema: '/api/agent-access/handoff-schema',
        useWhen:
          'The current connection can inspect Scrapbook but cannot safely update the canonical repository files or open the required pull request.',
        include: [
          'target repository and current base ref when known',
          'exact canonical target file paths',
          'complete proposed file contents or a precise patch',
          'required registry or metadata entry when the lane has one',
          'primary evidence URLs using the ownership-based GitHub host rule',
          'validation commands or checks expected after applying the change',
          'any unresolved uncertainty or concurrency risk',
        ],
        template: {
          formatVersion: 1,
          repository: 'teamleaderleo/scrapbook',
          base: 'main@<commit-sha-when-known>',
          intent:
            'One concise sentence describing the intended repository change.',
          lane: 'repository-work',
          files: [
            {
              path: 'exact/repository/path',
              operation: 'update',
              content: 'Complete UTF-8 file content for the intended result.',
              patch: null,
            },
          ],
          metadata: null,
          evidence: ['https://redirect.github.com/owner/repository/pull/123'],
          validation: [
            'pnpm lint',
            'pnpm typecheck',
            'pnpm test',
            'pnpm build',
          ],
          review: {
            humanReviewRequired: false,
            reason: null,
          },
          risks: [
            'Concurrency, unresolved evidence, or other caveats another writer must preserve.',
          ],
        },
        evidenceRule:
          'Evidence values follow the same host rule as tracked Scrapbook files: direct github.com for teamleaderleo repositories and redirect.github.com for third-party GitHub references unless the human explicitly requests a direct relationship.',
        rule: 'Leave the repository unchanged. A complete handoff is preferable to creating a temporary writer, hidden database copy, workflow commit-back path, or another alternate publication channel.',
      },
      provenance: {
        rule: 'Preserve canonical repository paths, truthful authorship/model metadata, originating evidence, and existing editorial/evidence state across every transport.',
        doNotInfer:
          'Read access, database access, or access to a mirrored file does not imply permission to mutate the canonical repository.',
      },
      next: {
        afterDiscovery:
          'For ordinary agent contributions, call /api/agent-contributions and then follow the selected lane contract.',
        beforeSubstantiveWriting:
          'For Leo-directed prose, read STYLE_GUIDE.md in full before drafting or revising. For Workbench writing, follow docs/workbench.md, read the index at /api/bot-desk, and fetch related full documents with /api/bot-desk?slug=<slug>.',
      },
      links: {
        repository: 'https://github.com/teamleaderleo/scrapbook',
        repositoryInstructions:
          'https://github.com/teamleaderleo/scrapbook/blob/main/AGENTS.md',
        styleGuide:
          'https://github.com/teamleaderleo/scrapbook/blob/main/STYLE_GUIDE.md',
        workbenchGuide:
          'https://github.com/teamleaderleo/scrapbook/blob/main/docs/workbench.md',
        accessGuide:
          'https://github.com/teamleaderleo/scrapbook/blob/main/docs/agent-access.md',
        contributionGuide:
          'https://github.com/teamleaderleo/scrapbook/blob/main/docs/agent-contributions.md',
        publicWorkbench: '/desk',
        publicWork: '/work',
      },
    },
    {
      headers: {
        'Cache-Control': REPOSITORY_PUBLIC_CACHE_CONTROL,
      },
    }
  );
}
