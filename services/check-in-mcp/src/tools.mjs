import {
  INSPIRATION_MODES,
  InputError,
  PERSONALITY_PRESETS,
  REMIX_KINDS,
  STYLE_PRESETS,
  validateImport,
  validateMarkReady,
  validateMerge,
  validateOpenPr,
  validateProposal,
  validateReservation,
  validateSave,
  validateStatus,
} from './contracts.mjs';
import { containsEntry, insertVisit } from './guestbook.mjs';
import { GitHubError, SCRAPBOOK_REPOSITORY } from './github-client.mjs';

const GUESTBOOK_PATH = 'lib/agent-guestbook.ts';
const WORKFLOW_PATH = '.github/workflows/import-gallery-asset.yml';
const TOOL_PROFILES = new Set(['read-only', 'full']);
const SCOPES = {
  read: 'scrapbook.checkins.read',
  write: 'scrapbook.checkins.write',
  review: 'scrapbook.checkins.review',
  merge: 'scrapbook.checkins.merge',
};

function toolResult(data, message) {
  return {
    structuredContent: data,
    content: [{ type: 'text', text: message }],
  };
}

function toolError(error, extra = {}) {
  const message = error instanceof InputError
    ? error.message
    : error instanceof GitHubError
      ? `${error.message}${error.status ? ` (GitHub ${error.status})` : ''}`
      : error instanceof Error
        ? error.message
        : 'Unexpected tool failure.';
  return {
    isError: true,
    structuredContent: { ok: false, error: message, ...extra },
    content: [{ type: 'text', text: message }],
  };
}

function object(properties, required = []) {
  return { type: 'object', additionalProperties: false, properties, required };
}

const nullableString = { anyOf: [{ type: 'string' }, { type: 'null' }] };
const nullableInteger = { anyOf: [{ type: 'integer' }, { type: 'null' }] };
const nullableBoolean = { anyOf: [{ type: 'boolean' }, { type: 'null' }] };

function schemas() {
  const entryId = { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', maxLength: 96 };
  const proposal = object({
    entryId,
    name: { type: 'string', minLength: 1, maxLength: 80 },
    mark: { type: 'string', minLength: 1, maxLength: 16 },
    note: { type: 'string', minLength: 1, maxLength: 240 },
    date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    mode: { type: 'string', enum: ['quiet', 'goofy', 'serious', 'overdone'] },
    repository: { type: 'string', pattern: '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$' },
    model: { type: 'string', minLength: 1, maxLength: 80 },
    sourceLabel: { type: 'string', minLength: 1, maxLength: 64 },
    sourceHref: { type: 'string', format: 'uri', maxLength: 512 },
    conversationLabel: { type: 'string', minLength: 1, maxLength: 32 },
    conversationHref: { type: 'string', format: 'uri', maxLength: 512 },
    artwork: { type: 'string', enum: ['none', 'card'] },
    imageAlt: { type: 'string', minLength: 1, maxLength: 240 },
    branch: { type: 'string', maxLength: 160 },
    inspiration: { type: 'string', enum: INSPIRATION_MODES },
    style: { type: 'string', enum: STYLE_PRESETS },
    styleNote: { type: 'string', minLength: 1, maxLength: 160 },
    personalities: {
      type: 'array',
      maxItems: 3,
      uniqueItems: true,
      items: { type: 'string', enum: PERSONALITY_PRESETS },
    },
    remixSourceId: entryId,
    remixKind: { type: 'string', enum: REMIX_KINDS },
    remixNote: { type: 'string', minLength: 1, maxLength: 160 },
  }, ['entryId', 'name', 'mark', 'note', 'date', 'mode', 'repository', 'sourceLabel', 'sourceHref']);

  const checkRuns = {
    type: 'array',
    items: object({
      name: { type: 'string' },
      status: { type: 'string' },
      conclusion: nullableString,
      url: nullableString,
    }, ['name', 'status', 'conclusion', 'url']),
  };
  const checks = object({
    green: { type: 'boolean' },
    checkRuns,
    combinedStatus: { type: 'string' },
  }, ['green', 'checkRuns', 'combinedStatus']);
  const toolSummary = object({
    name: { type: 'string' },
    access: { type: 'string', enum: ['read', 'write', 'review', 'merge'] },
    requiresApproval: { type: 'boolean' },
    destructive: { type: 'boolean' },
  }, ['name', 'access', 'requiresApproval', 'destructive']);

  return {
    entryId,
    proposal,
    checks,
    emptyInput: object({}, []),
    capabilitiesOutput: object({
      ok: { const: true },
      profile: { type: 'string', enum: ['read-only', 'full'] },
      mergeEnabled: { type: 'boolean' },
      repository: { const: SCRAPBOOK_REPOSITORY },
      catalogue: object({
        options: { const: '/api/agent-guestbook' },
        entries: { const: '/api/agent-guestbook?include=entries' },
      }, ['options', 'entries']),
      routes: {
        type: 'array',
        items: object({
          id: { type: 'string', enum: INSPIRATION_MODES },
          priorEntries: { type: 'string', enum: ['hidden', 'optional', 'required'] },
        }, ['id', 'priorEntries']),
      },
      tools: { type: 'array', items: toolSummary },
    }, ['ok', 'profile', 'mergeEnabled', 'repository', 'catalogue', 'routes', 'tools']),
    planOutput: object({
      ok: { const: true },
      proposal,
      repository: { const: SCRAPBOOK_REPOSITORY },
      branch: object({ name: { type: 'string' }, exists: { type: 'boolean' }, sha: nullableString }, ['name', 'exists', 'sha']),
      paths: object({
        guestbook: { const: GUESTBOOK_PATH },
        image: nullableString,
        importerWorkflow: { const: WORKFLOW_PATH },
      }, ['guestbook', 'image', 'importerWorkflow']),
      nextActions: { type: 'array', items: { type: 'string' } },
    }, ['ok', 'proposal', 'repository', 'branch', 'paths', 'nextActions']),
    reserveOutput: object({
      ok: { const: true },
      status: { type: 'string', enum: ['reserved', 'already-reserved'] },
      branch: { type: 'string' },
      sha: { type: 'string' },
      baseSha: { type: 'string' },
    }, ['ok', 'status', 'branch', 'sha']),
    importOutput: object({
      ok: { const: true },
      status: { type: 'string', enum: ['dispatched', 'already-imported'] },
      workflow: { type: 'string' },
      runName: { type: 'string' },
      branch: { type: 'string' },
      imagePath: { type: 'string' },
      imageUrl: { type: 'string' },
    }, ['ok', 'status', 'branch', 'imagePath']),
    statusOutput: object({
      ok: { const: true },
      entryId,
      branch: object({ exists: { type: 'boolean' }, sha: nullableString, name: { type: 'string' } }, ['exists', 'sha', 'name']),
      image: object({ exists: { type: 'boolean' }, path: { type: 'string' }, url: nullableString }, ['exists', 'path', 'url']),
      guestbook: object({ exists: { type: 'boolean' }, containsEntry: { type: 'boolean' } }, ['exists', 'containsEntry']),
      importer: {
        anyOf: [
          { type: 'null' },
          object({
            id: nullableInteger,
            status: nullableString,
            conclusion: nullableString,
            createdAt: nullableString,
            updatedAt: nullableString,
            url: nullableString,
            headSha: nullableString,
          }, ['id', 'status', 'conclusion', 'createdAt', 'updatedAt', 'url', 'headSha']),
        ],
      },
      pullRequest: {
        anyOf: [
          { type: 'null' },
          object({
            number: { type: 'integer' },
            state: { type: 'string' },
            draft: nullableBoolean,
            merged: nullableBoolean,
            url: { type: 'string' },
            headSha: { type: 'string' },
          }, ['number', 'state', 'draft', 'merged', 'url', 'headSha']),
        ],
      },
      checks: { anyOf: [{ type: 'null' }, checks] },
    }, ['ok', 'entryId', 'branch', 'image', 'guestbook', 'importer', 'pullRequest', 'checks']),
    saveOutput: object({
      ok: { const: true },
      status: { type: 'string', enum: ['saved', 'already-saved'] },
      branch: { type: 'string' },
      path: { const: GUESTBOOK_PATH },
      commitSha: { type: 'string' },
    }, ['ok', 'status', 'branch', 'path']),
    openPrOutput: object({
      ok: { const: true },
      status: { type: 'string', enum: ['opened', 'already-opened'] },
      number: { type: 'integer' },
      state: { type: 'string' },
      draft: { type: 'boolean' },
      url: { type: 'string' },
      headSha: { type: 'string' },
    }, ['ok', 'status', 'number', 'draft', 'url']),
    reviewOutput: object({
      ok: { const: true },
      status: { type: 'string', enum: ['ready', 'already-ready', 'already-merged'] },
      number: { type: 'integer' },
      url: { type: 'string' },
      checks,
    }, ['ok', 'status', 'number', 'url']),
    mergeOutput: object({
      ok: { const: true },
      status: { type: 'string', enum: ['merged', 'already-merged'] },
      number: { type: 'integer' },
      sha: { type: 'string' },
      url: { type: 'string' },
      checks,
    }, ['ok', 'status', 'number', 'url']),
  };
}

function securedDescriptor({ access, invoking, invoked, ...descriptor }) {
  const securitySchemes = [{ type: 'oauth2', scopes: [SCOPES[access]] }];
  return {
    ...descriptor,
    securitySchemes,
    _meta: {
      securitySchemes,
      'openai/toolInvocation/invoking': invoking,
      'openai/toolInvocation/invoked': invoked,
    },
  };
}

function imagePath(entryId) {
  return `public/gallery/agents/${entryId}.webp`;
}

function workflowState(run) {
  if (!run) return null;
  return {
    id: run.id ?? null,
    status: run.status ?? null,
    conclusion: run.conclusion ?? null,
    createdAt: run.created_at ?? null,
    updatedAt: run.updated_at ?? null,
    url: run.html_url ?? null,
    headSha: run.head_sha ?? null,
  };
}

function checksAreGreen(checkRuns, combinedStatus) {
  const runs = checkRuns.check_runs || [];
  const accepted = new Set(['success', 'neutral', 'skipped']);
  const completed = runs.length > 0 && runs.every((run) => run.status === 'completed');
  const successful = completed && runs.every((run) => accepted.has(run.conclusion));
  const statusOkay = !combinedStatus.statuses?.length || combinedStatus.state === 'success';
  return {
    green: successful && statusOkay,
    checkRuns: runs.map((run) => ({
      name: run.name,
      status: run.status,
      conclusion: run.conclusion ?? null,
      url: run.html_url ?? null,
    })),
    combinedStatus: combinedStatus.state,
  };
}

function assertCheckInPr(pr) {
  if (!pr || pr.base?.ref !== 'main' || pr.head?.repo?.full_name !== SCRAPBOOK_REPOSITORY || !pr.head?.ref?.startsWith('agent-check-in/')) {
    throw new InputError('The pull request is outside the Scrapbook check-in boundary.', 'prNumber');
  }
}

async function loadChecks(client, pr) {
  const [checkRuns, combinedStatus] = await Promise.all([
    client.getCheckRuns(pr.head.sha),
    client.getCombinedStatus(pr.head.sha),
  ]);
  return checksAreGreen(checkRuns, combinedStatus);
}

function greenCheckError(checks, action) {
  return {
    isError: true,
    structuredContent: { ok: false, error: 'Repository checks are not green.', checks },
    content: [{ type: 'text', text: `Repository checks must be green before ${action} this check-in.` }],
  };
}

export function createToolRegistry(client, { profile = 'read-only', allowMerge = false } = {}) {
  if (!TOOL_PROFILES.has(profile)) throw new Error(`Unknown Scrapbook tool profile: ${profile}`);
  const schema = schemas();
  const full = profile === 'full';

  const definitions = [
    {
      access: 'read',
      requiresApproval: false,
      descriptor: securedDescriptor({
        access: 'read',
        name: 'get_check_in_capabilities',
        title: 'Get Scrapbook check-in capabilities',
        description: 'Use this first to learn which check-in routes and permissions this private plugin currently exposes. It does not read prior guestbook entries or change GitHub.',
        inputSchema: schema.emptyInput,
        outputSchema: schema.capabilitiesOutput,
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
        invoking: 'Reading check-in capabilities',
        invoked: 'Check-in capabilities loaded',
      }),
    },
    {
      access: 'read',
      requiresApproval: false,
      descriptor: securedDescriptor({
        access: 'read',
        name: 'plan_check_in',
        title: 'Plan a Scrapbook check-in',
        description: 'Use this to validate one proposed gallery check-in, including optional creative direction or remix lineage, and report the fixed branch, files, provenance, artwork path, and next approval steps. It performs no write.',
        inputSchema: schema.proposal,
        outputSchema: schema.planOutput,
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true, idempotentHint: true },
        invoking: 'Validating the check-in plan',
        invoked: 'Check-in plan validated',
      }),
    },
    {
      access: 'read',
      requiresApproval: false,
      descriptor: securedDescriptor({
        access: 'read',
        name: 'get_check_in_status',
        title: 'Get check-in status',
        description: 'Use this to inspect the fixed branch, imported WebP, typed guestbook entry, importer workflow, draft pull request, and CI checks without changing GitHub.',
        inputSchema: object({ entryId: schema.entryId, branch: { type: 'string' } }, ['entryId', 'branch']),
        outputSchema: schema.statusOutput,
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true, idempotentHint: true },
        invoking: 'Reading the check-in status',
        invoked: 'Check-in status loaded',
      }),
    },
    ...(full ? [
      {
        access: 'write',
        requiresApproval: true,
        descriptor: securedDescriptor({
          access: 'write',
          name: 'reserve_check_in',
          title: 'Reserve a check-in branch',
          description: 'Use this only after explicit approval to create the fixed non-main branch for one validated entry ID. Repeated calls return the existing branch.',
          inputSchema: object({
            entryId: schema.entryId,
            branch: { type: 'string' },
            approved: { type: 'boolean', const: true },
          }, ['entryId', 'branch', 'approved']),
          outputSchema: schema.reserveOutput,
          annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true, idempotentHint: true },
          invoking: 'Reserving the check-in branch',
          invoked: 'Check-in branch reserved',
        }),
      },
      {
        access: 'write',
        requiresApproval: true,
        descriptor: securedDescriptor({
          access: 'write',
          name: 'import_check_in_artwork',
          title: 'Import check-in artwork',
          description: 'Use this only after explicit approval to dispatch Scrapbook’s existing binary-safe importer for a Drive file ID or supported GitHub user attachment. It writes only the matching repository-owned WebP to the reserved branch.',
          inputSchema: object({
            entryId: schema.entryId,
            branch: { type: 'string' },
            sourceType: { type: 'string', enum: ['drive', 'github-attachment'] },
            source: { type: 'string', minLength: 1, maxLength: 512 },
            approved: { type: 'boolean', const: true },
          }, ['entryId', 'branch', 'sourceType', 'source', 'approved']),
          outputSchema: schema.importOutput,
          annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true, idempotentHint: false },
          invoking: 'Dispatching the artwork importer',
          invoked: 'Artwork import dispatched',
        }),
      },
      {
        access: 'write',
        requiresApproval: true,
        descriptor: securedDescriptor({
          access: 'write',
          name: 'save_check_in',
          title: 'Save the typed check-in',
          description: 'Use this only after explicit approval to prepend one validated entry to lib/agent-guestbook.ts on the reserved branch. When image metadata is present, the matching WebP must already exist.',
          inputSchema: object({ proposal: schema.proposal, approved: { type: 'boolean', const: true } }, ['proposal', 'approved']),
          outputSchema: schema.saveOutput,
          annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true, idempotentHint: true },
          invoking: 'Saving the typed check-in',
          invoked: 'Typed check-in saved',
        }),
      },
      {
        access: 'write',
        requiresApproval: true,
        descriptor: securedDescriptor({
          access: 'write',
          name: 'open_check_in_pr',
          title: 'Open the draft check-in pull request',
          description: 'Use this only after explicit approval when the typed entry is saved. It opens one draft pull request with originating provenance and the optional importer run, or returns the existing branch pull request.',
          inputSchema: object({
            proposal: schema.proposal,
            importerRunUrl: { type: 'string', format: 'uri' },
            approved: { type: 'boolean', const: true },
          }, ['proposal', 'approved']),
          outputSchema: schema.openPrOutput,
          annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true, idempotentHint: true },
          invoking: 'Opening the draft pull request',
          invoked: 'Draft pull request opened',
        }),
      },
      {
        access: 'review',
        requiresApproval: true,
        descriptor: securedDescriptor({
          access: 'review',
          name: 'mark_check_in_ready',
          title: 'Mark a check-in ready for review',
          description: 'Use this only after the user explicitly confirms the exact pull request. It re-reads CI and marks a green draft check-in pull request ready. It never merges.',
          inputSchema: object({
            prNumber: { type: 'integer', minimum: 1 },
            confirmation: { type: 'string' },
            approved: { type: 'boolean', const: true },
          }, ['prNumber', 'confirmation', 'approved']),
          outputSchema: schema.reviewOutput,
          annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true, idempotentHint: true },
          invoking: 'Checking and marking the PR ready',
          invoked: 'Pull request marked ready',
        }),
      },
      ...(allowMerge ? [{
        access: 'merge',
        requiresApproval: true,
        descriptor: securedDescriptor({
          access: 'merge',
          name: 'merge_check_in_pr',
          title: 'Merge a check-in pull request',
          description: 'Use this only after the user explicitly confirms the exact ready pull request. It re-reads CI and squash-merges one green Scrapbook check-in PR. This tool is hidden unless merge authority is enabled at server startup.',
          inputSchema: object({
            prNumber: { type: 'integer', minimum: 1 },
            confirmation: { type: 'string' },
            approved: { type: 'boolean', const: true },
          }, ['prNumber', 'confirmation', 'approved']),
          outputSchema: schema.mergeOutput,
          annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true, idempotentHint: true },
          invoking: 'Checking and merging the PR',
          invoked: 'Check-in pull request merged',
        }),
      }] : []),
    ] : []),
  ];

  const tools = definitions.map(({ descriptor }) => descriptor);
  const available = new Set(tools.map((tool) => tool.name));

  const handlers = {
    async get_check_in_capabilities() {
      return toolResult({
        ok: true,
        profile,
        mergeEnabled: full && allowMerge,
        repository: SCRAPBOOK_REPOSITORY,
        catalogue: {
          options: '/api/agent-guestbook',
          entries: '/api/agent-guestbook?include=entries',
        },
        routes: [
          { id: 'blind', priorEntries: 'hidden' },
          { id: 'browse', priorEntries: 'optional' },
          { id: 'thread', priorEntries: 'optional' },
          { id: 'remix', priorEntries: 'required' },
        ],
        tools: definitions.map(({ descriptor, access, requiresApproval }) => ({
          name: descriptor.name,
          access,
          requiresApproval,
          destructive: descriptor.annotations.destructiveHint,
        })),
      }, `The Scrapbook plugin is running in the ${profile} profile${full && allowMerge ? ' with merge authority' : ''}.`);
    },

    async plan_check_in(args) {
      const proposal = validateProposal(args);
      const guestbook = await client.getFile(GUESTBOOK_PATH, 'main');
      if (!guestbook) throw new Error('Scrapbook guestbook file is unavailable on main.');
      if (containsEntry(guestbook.content, proposal.entryId)) {
        throw new InputError(`Entry ID ${proposal.entryId} already exists on main.`, 'entryId');
      }
      if (proposal.remixSourceId && !containsEntry(guestbook.content, proposal.remixSourceId)) {
        throw new InputError(`Remix source ${proposal.remixSourceId} does not exist on main.`, 'remixSourceId');
      }
      const branch = await client.getRef(proposal.branch);
      return toolResult({
        ok: true,
        proposal,
        repository: SCRAPBOOK_REPOSITORY,
        branch: { name: proposal.branch, exists: Boolean(branch), sha: branch?.object?.sha || null },
        paths: {
          guestbook: GUESTBOOK_PATH,
          image: proposal.artwork === 'card' ? imagePath(proposal.entryId) : null,
          importerWorkflow: WORKFLOW_PATH,
        },
        nextActions: full
          ? [
              branch ? 'Import artwork or save the entry.' : 'Ask for approval to reserve the branch.',
              proposal.artwork === 'card' ? 'Import the repository-owned WebP before saving the entry.' : 'Save the typed entry.',
              'Open a draft PR after the entry is saved.',
            ]
          : ['Connect a full write-capable plugin profile before asking to change GitHub.'],
      }, `Check-in ${proposal.entryId} is valid. The reserved branch is ${proposal.branch}.`);
    },

    async get_check_in_status(args) {
      const input = validateStatus(args);
      const [branch, image, guestbook, runs, pulls] = await Promise.all([
        client.getRef(input.branch),
        client.getFile(imagePath(input.entryId), input.branch),
        client.getFile(GUESTBOOK_PATH, input.branch),
        client.listArtworkRuns(input.entryId, input.branch),
        client.listPullRequestsForBranch(input.branch, 'all'),
      ]);
      const pr = pulls[0] || null;
      const checks = pr?.head?.sha ? await loadChecks(client, pr) : null;
      return toolResult({
        ok: true,
        entryId: input.entryId,
        branch: { exists: Boolean(branch), sha: branch?.object?.sha || null, name: input.branch },
        image: { exists: Boolean(image), path: imagePath(input.entryId), url: image?.htmlUrl || null },
        guestbook: { exists: Boolean(guestbook), containsEntry: guestbook ? containsEntry(guestbook.content, input.entryId) : false },
        importer: workflowState(runs[0]),
        pullRequest: pr ? {
          number: pr.number,
          state: pr.state,
          draft: pr.draft ?? null,
          merged: pr.merged ?? null,
          url: pr.html_url,
          headSha: pr.head.sha,
        } : null,
        checks,
      }, `Status loaded for ${input.entryId}.`);
    },

    async reserve_check_in(args) {
      const input = validateReservation(args);
      const existing = await client.getRef(input.branch);
      if (existing) {
        return toolResult({ ok: true, status: 'already-reserved', branch: input.branch, sha: existing.object.sha }, `Branch ${input.branch} already exists.`);
      }
      const main = await client.getRef('main');
      if (!main) throw new Error('Scrapbook main branch is unavailable.');
      const created = await client.createBranch(input.branch, main.object.sha);
      return toolResult({
        ok: true,
        status: 'reserved',
        branch: input.branch,
        sha: created.object.sha,
        baseSha: main.object.sha,
      }, `Reserved ${input.branch} from current main.`);
    },

    async import_check_in_artwork(args) {
      const input = validateImport(args);
      const branch = await client.getRef(input.branch);
      if (!branch) throw new InputError('Reserve the check-in branch before importing artwork.', 'branch');
      const existingImage = await client.getFile(imagePath(input.entryId), input.branch);
      if (existingImage) {
        return toolResult({
          ok: true,
          status: 'already-imported',
          branch: input.branch,
          imagePath: imagePath(input.entryId),
          imageUrl: existingImage.htmlUrl,
        }, `The repository-owned WebP already exists for ${input.entryId}.`);
      }
      await client.dispatchArtworkImport(input);
      return toolResult({
        ok: true,
        status: 'dispatched',
        workflow: WORKFLOW_PATH,
        runName: `Import gallery asset for ${input.entryId} on ${input.branch}`,
        branch: input.branch,
        imagePath: imagePath(input.entryId),
      }, `Dispatched the existing gallery importer for ${input.entryId}.`);
    },

    async save_check_in(args) {
      const { proposal } = validateSave(args);
      const branch = await client.getRef(proposal.branch);
      if (!branch) throw new InputError('Reserve the check-in branch before saving the entry.', 'proposal.branch');
      if (proposal.artwork === 'card') {
        const image = await client.getFile(imagePath(proposal.entryId), proposal.branch);
        if (!image) throw new InputError('Import the repository-owned WebP before saving image metadata.', 'proposal.artwork');
      }
      const guestbook = await client.getFile(GUESTBOOK_PATH, proposal.branch);
      if (!guestbook) throw new Error('Guestbook file is unavailable on the reserved branch.');
      const inserted = insertVisit(guestbook.content, proposal);
      if (!inserted.changed) {
        return toolResult({ ok: true, status: inserted.status, branch: proposal.branch, path: GUESTBOOK_PATH }, `The typed entry for ${proposal.entryId} is already saved.`);
      }
      const result = await client.updateFile(
        GUESTBOOK_PATH,
        proposal.branch,
        guestbook.sha,
        inserted.content,
        `guestbook: add ${proposal.name}`,
      );
      return toolResult({
        ok: true,
        status: 'saved',
        branch: proposal.branch,
        path: GUESTBOOK_PATH,
        commitSha: result.commit.sha,
      }, `Saved the typed guestbook entry for ${proposal.name}.`);
    },

    async open_check_in_pr(args) {
      const { proposal, importerRunUrl } = validateOpenPr(args);
      const existing = await client.listPullRequestsForBranch(proposal.branch, 'all');
      if (existing.length) {
        const pr = existing[0];
        return toolResult({
          ok: true,
          status: 'already-opened',
          number: pr.number,
          state: pr.state,
          draft: pr.draft,
          url: pr.html_url,
        }, `Pull request #${pr.number} already tracks ${proposal.branch}.`);
      }
      const guestbook = await client.getFile(GUESTBOOK_PATH, proposal.branch);
      if (!guestbook || !containsEntry(guestbook.content, proposal.entryId)) {
        throw new InputError('Save the typed guestbook entry before opening the pull request.', 'proposal.entryId');
      }
      const repoName = proposal.repository.split('/')[1];
      const title = `guestbook: ${proposal.name} checks in from ${repoName}`;
      const body = [
        '## Summary',
        '',
        `Add **${proposal.name}** (${proposal.mark}) to the Scrapbook agent guestbook.`,
        '',
        '## Originating provenance',
        '',
        `- repository: \`${proposal.repository}\``,
        `- source: [${proposal.sourceLabel}](${proposal.sourceHref})`,
        ...(importerRunUrl ? [`- importer run: ${importerRunUrl}`] : []),
        '',
        '## Boundary',
        '',
        '- draft until the repository checks pass',
        '- no direct-main write',
        '- no autonomous merge',
        '- card art remains attached to this entry',
        '',
        'Tracks #378.',
      ].join('\n');
      const pr = await client.createDraftPullRequest({ branch: proposal.branch, title, body });
      return toolResult({
        ok: true,
        status: 'opened',
        number: pr.number,
        draft: pr.draft,
        url: pr.html_url,
        headSha: pr.head.sha,
      }, `Opened draft pull request #${pr.number}.`);
    },

    async mark_check_in_ready(args) {
      const input = validateMarkReady(args);
      const pr = await client.getPullRequest(input.prNumber);
      assertCheckInPr(pr);
      if (pr.merged) {
        return toolResult({ ok: true, status: 'already-merged', number: pr.number, url: pr.html_url }, `Pull request #${pr.number} is already merged.`);
      }
      const checks = await loadChecks(client, pr);
      if (!checks.green) return greenCheckError(checks, 'marking ready');
      if (!pr.draft) {
        return toolResult({ ok: true, status: 'already-ready', number: pr.number, url: pr.html_url, checks }, `Pull request #${pr.number} is already ready for review.`);
      }
      const ready = await client.markPullRequestReady(pr.node_id);
      return toolResult({ ok: true, status: 'ready', number: ready.number, url: ready.url, checks }, `Marked pull request #${ready.number} ready for review.`);
    },

    async merge_check_in_pr(args) {
      const input = validateMerge(args);
      const pr = await client.getPullRequest(input.prNumber);
      assertCheckInPr(pr);
      if (pr.merged) {
        return toolResult({ ok: true, status: 'already-merged', number: pr.number, url: pr.html_url }, `Pull request #${pr.number} is already merged.`);
      }
      if (pr.draft) throw new InputError('Mark the pull request ready before merging it.', 'prNumber');
      const checks = await loadChecks(client, pr);
      if (!checks.green) return greenCheckError(checks, 'merging');
      const merged = await client.mergePullRequest(pr.number, pr.head.sha);
      if (!merged.merged) throw new GitHubError(merged.message || 'GitHub declined the merge.', 409, merged);
      return toolResult({
        ok: true,
        status: 'merged',
        number: pr.number,
        sha: merged.sha,
        url: pr.html_url,
        checks,
      }, `Squash-merged pull request #${pr.number}.`);
    },
  };

  return {
    tools,
    profile,
    allowMerge: full && allowMerge,
    async call(name, args) {
      if (!available.has(name)) {
        return toolError(new InputError(`Tool ${name} is unavailable in the ${profile} profile.`, 'name'));
      }
      const handler = handlers[name];
      try {
        return await handler(args ?? {});
      } catch (error) {
        return toolError(error);
      }
    },
  };
}
