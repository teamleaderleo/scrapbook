import {
  InputError,
  validateFinalise,
  validateImport,
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

function toolResult(data, message) {
  return {
    structuredContent: data,
    content: [{ type: 'text', text: message }],
  };
}

function toolError(error) {
  const message = error instanceof InputError
    ? error.message
    : error instanceof GitHubError
      ? `${error.message}${error.status ? ` (GitHub ${error.status})` : ''}`
      : error instanceof Error
        ? error.message
        : 'Unexpected tool failure.';
  return {
    isError: true,
    structuredContent: { ok: false, error: message },
    content: [{ type: 'text', text: message }],
  };
}

function imagePath(entryId) {
  return `public/gallery/agents/${entryId}.webp`;
}

function workflowState(run) {
  if (!run) return null;
  return {
    id: run.id,
    status: run.status,
    conclusion: run.conclusion,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    url: run.html_url,
    headSha: run.head_sha,
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
      conclusion: run.conclusion,
      url: run.html_url,
    })),
    combinedStatus: combinedStatus.state,
  };
}

function schemas() {
  const proposalProperties = {
    entryId: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', maxLength: 96 },
    name: { type: 'string', minLength: 1, maxLength: 64 },
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
  };
  const proposalSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['entryId', 'name', 'mark', 'note', 'date', 'mode', 'repository', 'sourceLabel', 'sourceHref'],
    properties: proposalProperties,
  };
  return { proposalSchema };
}

export function createToolRegistry(client) {
  const { proposalSchema } = schemas();

  const tools = [
    {
      name: 'plan_check_in',
      title: 'Plan a Scrapbook check-in',
      description: 'Use this when a user wants to validate a proposed Scrapbook gallery check-in and see the exact branch, file, provenance, artwork, and approval steps before any write.',
      inputSchema: proposalSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
    },
    {
      name: 'reserve_check_in',
      title: 'Reserve a check-in branch',
      description: 'Use this after explicit approval to create the fixed non-main branch for one validated entry ID. Repeated calls return the existing branch.',
      inputSchema: {
        type: 'object', additionalProperties: false, required: ['entryId', 'branch', 'approved'],
        properties: {
          entryId: proposalSchema.properties.entryId,
          branch: { type: 'string' },
          approved: { type: 'boolean', const: true },
        },
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true, idempotentHint: true },
    },
    {
      name: 'import_check_in_artwork',
      title: 'Import check-in artwork',
      description: 'Use this after explicit approval to dispatch Scrapbook’s existing binary-safe importer for a Drive file ID or supported GitHub user attachment. The importer writes only the entry WebP to the reserved branch.',
      inputSchema: {
        type: 'object', additionalProperties: false,
        required: ['entryId', 'branch', 'sourceType', 'source', 'approved'],
        properties: {
          entryId: proposalSchema.properties.entryId,
          branch: { type: 'string' },
          sourceType: { type: 'string', enum: ['drive', 'github-attachment'] },
          source: { type: 'string', minLength: 1, maxLength: 512 },
          approved: { type: 'boolean', const: true },
        },
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true, idempotentHint: false },
    },
    {
      name: 'get_check_in_status',
      title: 'Get check-in status',
      description: 'Use this to inspect the reserved branch, imported WebP, typed guestbook entry, importer workflow, pull request, and current CI checks without changing GitHub.',
      inputSchema: {
        type: 'object', additionalProperties: false, required: ['entryId', 'branch'],
        properties: { entryId: proposalSchema.properties.entryId, branch: { type: 'string' } },
      },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
    },
    {
      name: 'save_check_in',
      title: 'Save the typed check-in',
      description: 'Use this after explicit approval to prepend one validated entry to lib/agent-guestbook.ts on the reserved branch. Card artwork must already exist at the exact repository path.',
      inputSchema: {
        type: 'object', additionalProperties: false, required: ['proposal', 'approved'],
        properties: { proposal: proposalSchema, approved: { type: 'boolean', const: true } },
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true, idempotentHint: true },
    },
    {
      name: 'open_check_in_pr',
      title: 'Open the draft check-in pull request',
      description: 'Use this after explicit approval when the typed entry is saved. Opens one draft PR with the originating source and optional importer run, or returns the existing PR for the branch.',
      inputSchema: {
        type: 'object', additionalProperties: false, required: ['proposal', 'approved'],
        properties: {
          proposal: proposalSchema,
          importerRunUrl: { type: 'string', format: 'uri' },
          approved: { type: 'boolean', const: true },
        },
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true, idempotentHint: true },
    },
    {
      name: 'finalise_check_in',
      title: 'Finalise a check-in pull request',
      description: 'Use this only after a user explicitly confirms the exact action. Marks a green draft PR ready, or squash-merges a green ready PR. Repository checks are re-read immediately before the write.',
      inputSchema: {
        type: 'object', additionalProperties: false, required: ['prNumber', 'action', 'confirmation', 'approved'],
        properties: {
          prNumber: { type: 'integer', minimum: 1 },
          action: { type: 'string', enum: ['mark-ready', 'merge'] },
          confirmation: { type: 'string' },
          approved: { type: 'boolean', const: true },
        },
      },
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true, idempotentHint: true },
    },
  ];

  const handlers = {
    async plan_check_in(args) {
      const proposal = validateProposal(args);
      const guestbook = await client.getFile(GUESTBOOK_PATH, 'main');
      if (!guestbook) throw new Error('Scrapbook guestbook file is unavailable on main.');
      if (containsEntry(guestbook.content, proposal.entryId)) {
        throw new InputError(`Entry ID ${proposal.entryId} already exists on main.`, 'entryId');
      }
      const branch = await client.getRef(proposal.branch);
      return toolResult(
        {
          ok: true,
          proposal,
          repository: SCRAPBOOK_REPOSITORY,
          branch: { name: proposal.branch, exists: Boolean(branch), sha: branch?.object?.sha || null },
          paths: {
            guestbook: GUESTBOOK_PATH,
            image: proposal.artwork === 'card' ? imagePath(proposal.entryId) : null,
            importerWorkflow: WORKFLOW_PATH,
          },
          nextActions: [
            branch ? 'Import artwork or save the entry.' : 'Ask for approval to reserve the branch.',
            proposal.artwork === 'card' ? 'Import the repository-owned WebP before saving the entry.' : 'Save the typed entry.',
            'Open a draft PR after the entry is saved.',
          ],
        },
        `Check-in ${proposal.entryId} is valid. The reserved branch is ${proposal.branch}.`,
      );
    },

    async reserve_check_in(args) {
      const input = validateReservation(args);
      const existing = await client.getRef(input.branch);
      if (existing) {
        return toolResult(
          { ok: true, status: 'already-reserved', branch: input.branch, sha: existing.object.sha },
          `Branch ${input.branch} already exists.`,
        );
      }
      const main = await client.getRef('main');
      if (!main) throw new Error('Scrapbook main branch is unavailable.');
      const created = await client.createBranch(input.branch, main.object.sha);
      return toolResult(
        { ok: true, status: 'reserved', branch: input.branch, sha: created.object.sha, baseSha: main.object.sha },
        `Reserved ${input.branch} from current main.`,
      );
    },

    async import_check_in_artwork(args) {
      const input = validateImport(args);
      const branch = await client.getRef(input.branch);
      if (!branch) throw new InputError('Reserve the check-in branch before importing artwork.', 'branch');
      const existingImage = await client.getFile(imagePath(input.entryId), input.branch);
      if (existingImage) {
        return toolResult(
          { ok: true, status: 'already-imported', branch: input.branch, imagePath: imagePath(input.entryId), imageUrl: existingImage.htmlUrl },
          `The repository-owned WebP already exists for ${input.entryId}.`,
        );
      }
      await client.dispatchArtworkImport(input);
      return toolResult(
        {
          ok: true,
          status: 'dispatched',
          workflow: WORKFLOW_PATH,
          runName: `Import gallery asset for ${input.entryId} on ${input.branch}`,
          branch: input.branch,
          imagePath: imagePath(input.entryId),
        },
        `Dispatched the existing gallery importer for ${input.entryId}.`,
      );
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
      let checks = null;
      if (pr?.head?.sha) {
        const [checkRuns, combinedStatus] = await Promise.all([
          client.getCheckRuns(pr.head.sha),
          client.getCombinedStatus(pr.head.sha),
        ]);
        checks = checksAreGreen(checkRuns, combinedStatus);
      }
      const status = {
        ok: true,
        entryId: input.entryId,
        branch: { exists: Boolean(branch), sha: branch?.object?.sha || null, name: input.branch },
        image: { exists: Boolean(image), path: imagePath(input.entryId), url: image?.htmlUrl || null },
        guestbook: { exists: Boolean(guestbook), containsEntry: guestbook ? containsEntry(guestbook.content, input.entryId) : false },
        importer: workflowState(runs[0]),
        pullRequest: pr ? { number: pr.number, state: pr.state, draft: pr.draft, merged: pr.merged, url: pr.html_url, headSha: pr.head.sha } : null,
        checks,
      };
      return toolResult(status, `Status loaded for ${input.entryId}.`);
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
        return toolResult(
          { ok: true, status: inserted.status, branch: proposal.branch, path: GUESTBOOK_PATH },
          `The typed entry for ${proposal.entryId} is already saved.`,
        );
      }
      const result = await client.updateFile(
        GUESTBOOK_PATH,
        proposal.branch,
        guestbook.sha,
        inserted.content,
        `guestbook: add ${proposal.name}`,
      );
      return toolResult(
        { ok: true, status: 'saved', branch: proposal.branch, path: GUESTBOOK_PATH, commitSha: result.commit.sha },
        `Saved the typed guestbook entry for ${proposal.name}.`,
      );
    },

    async open_check_in_pr(args) {
      const { proposal, importerRunUrl } = validateOpenPr(args);
      const existing = await client.listPullRequestsForBranch(proposal.branch, 'all');
      if (existing.length) {
        const pr = existing[0];
        return toolResult(
          { ok: true, status: 'already-opened', number: pr.number, state: pr.state, draft: pr.draft, url: pr.html_url },
          `Pull request #${pr.number} already tracks ${proposal.branch}.`,
        );
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
      return toolResult(
        { ok: true, status: 'opened', number: pr.number, draft: pr.draft, url: pr.html_url, headSha: pr.head.sha },
        `Opened draft pull request #${pr.number}.`,
      );
    },

    async finalise_check_in(args) {
      const input = validateFinalise(args);
      const pr = await client.getPullRequest(input.prNumber);
      if (pr.base?.ref !== 'main' || pr.head?.repo?.full_name !== SCRAPBOOK_REPOSITORY || !pr.head?.ref?.startsWith('agent-check-in/')) {
        throw new InputError('The pull request is outside the Scrapbook check-in boundary.', 'prNumber');
      }
      if (pr.merged) {
        return toolResult({ ok: true, status: 'already-merged', number: pr.number, url: pr.html_url }, `Pull request #${pr.number} is already merged.`);
      }
      const [checkRuns, combinedStatus] = await Promise.all([
        client.getCheckRuns(pr.head.sha),
        client.getCombinedStatus(pr.head.sha),
      ]);
      const checks = checksAreGreen(checkRuns, combinedStatus);
      if (!checks.green) {
        return {
          isError: true,
          structuredContent: { ok: false, error: 'Repository checks are not green.', checks },
          content: [{ type: 'text', text: 'Repository checks must be green before finalising this check-in.' }],
        };
      }
      if (input.action === 'mark-ready') {
        if (!pr.draft) {
          return toolResult({ ok: true, status: 'already-ready', number: pr.number, url: pr.html_url, checks }, `Pull request #${pr.number} is already ready for review.`);
        }
        const ready = await client.markPullRequestReady(pr.node_id);
        return toolResult({ ok: true, status: 'ready', number: ready.number, url: ready.url, checks }, `Marked pull request #${ready.number} ready for review.`);
      }
      if (pr.draft) throw new InputError('Mark the pull request ready before merging it.', 'action');
      const merged = await client.mergePullRequest(pr.number, pr.head.sha);
      if (!merged.merged) throw new GitHubError(merged.message || 'GitHub declined the merge.', 409, merged);
      return toolResult({ ok: true, status: 'merged', number: pr.number, sha: merged.sha, url: pr.html_url, checks }, `Squash-merged pull request #${pr.number}.`);
    },
  };

  return {
    tools,
    async call(name, args) {
      const handler = handlers[name];
      if (!handler) return toolError(new InputError(`Unknown tool: ${name}`, 'name'));
      try {
        return await handler(args ?? {});
      } catch (error) {
        return toolError(error);
      }
    },
  };
}
