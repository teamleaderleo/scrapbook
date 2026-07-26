import test from 'node:test';
import assert from 'node:assert/strict';
import { createToolRegistry } from '../src/tools.mjs';

const proposal = {
  entryId: 'copper-moth',
  name: 'Copper Moth',
  mark: 'CM-01',
  note: 'Built the private check-in path and kept every consequential write visible.',
  date: '2026-07-26',
  mode: 'serious',
  repository: 'teamleaderleo/scrapbook',
  model: 'GPT-5.6 Thinking',
  sourceLabel: 'Issue #378',
  sourceHref: 'https://github.com/teamleaderleo/scrapbook/issues/378',
  artwork: 'card',
  imageAlt: 'A copper moth carrying a tiny gallery card',
};

const baseGuestbook = `import 'server-only';\n\nconst visits = [\n] satisfies AgentVisit[];\n`;

class FakeClient {
  constructor() {
    this.refs = new Map([['main', { object: { sha: 'main-sha' } }]]);
    this.files = new Map([['main:lib/agent-guestbook.ts', { sha: 'guestbook-sha', content: baseGuestbook, htmlUrl: 'https://github.test/guestbook' }]]);
    this.dispatched = [];
    this.pulls = [];
  }

  async getRef(branch) { return this.refs.get(branch) || null; }
  async createBranch(branch, sha) {
    const ref = { object: { sha } };
    this.refs.set(branch, ref);
    this.files.set(`${branch}:lib/agent-guestbook.ts`, { ...this.files.get('main:lib/agent-guestbook.ts') });
    return ref;
  }
  async getFile(path, ref) { return this.files.get(`${ref}:${path}`) || null; }
  async dispatchArtworkImport(input) { this.dispatched.push(input); }
  async listArtworkRuns() { return []; }
  async listPullRequestsForBranch(branch) { return this.pulls.filter((pr) => pr.head.ref === branch); }
  async getCheckRuns() { return { check_runs: [{ name: 'CI / verify', status: 'completed', conclusion: 'success', html_url: 'https://github.test/check' }] }; }
  async getCombinedStatus() { return { state: 'success', statuses: [] }; }
  async updateFile(path, ref, _sha, content) {
    this.files.set(`${ref}:${path}`, { sha: 'new-sha', content, htmlUrl: 'https://github.test/guestbook' });
    return { commit: { sha: 'commit-sha' } };
  }
  async createDraftPullRequest({ branch }) {
    const pr = {
      number: 99,
      state: 'open',
      draft: true,
      merged: false,
      node_id: 'PR_node',
      html_url: 'https://github.test/pr/99',
      base: { ref: 'main' },
      head: { ref: branch, sha: 'head-sha', repo: { full_name: 'teamleaderleo/scrapbook' } },
    };
    this.pulls.push(pr);
    return pr;
  }
  async getPullRequest(number) { return this.pulls.find((pr) => pr.number === number); }
  async markPullRequestReady() { this.pulls[0].draft = false; return { number: 99, isDraft: false, url: 'https://github.test/pr/99' }; }
  async mergePullRequest() { this.pulls[0].merged = true; return { merged: true, sha: 'merge-sha' }; }
}

test('tool annotations keep planning read-only and finalisation destructive', () => {
  const registry = createToolRegistry(new FakeClient());
  const plan = registry.tools.find((tool) => tool.name === 'plan_check_in');
  const finalise = registry.tools.find((tool) => tool.name === 'finalise_check_in');
  assert.equal(plan.annotations.readOnlyHint, true);
  assert.equal(plan.annotations.idempotentHint, true);
  assert.equal(finalise.annotations.destructiveHint, true);
});

test('reserve, import, save, and PR tools preserve the check-in order', async () => {
  const client = new FakeClient();
  const registry = createToolRegistry(client);
  const branch = 'agent-check-in/copper-moth';

  const beforeReserve = await registry.call('import_check_in_artwork', {
    entryId: proposal.entryId,
    branch,
    sourceType: 'drive',
    source: 'DriveFile_123',
    approved: true,
  });
  assert.equal(beforeReserve.isError, true);

  const reserved = await registry.call('reserve_check_in', { entryId: proposal.entryId, branch, approved: true });
  assert.equal(reserved.structuredContent.status, 'reserved');

  const imported = await registry.call('import_check_in_artwork', {
    entryId: proposal.entryId,
    branch,
    sourceType: 'drive',
    source: 'DriveFile_123',
    approved: true,
  });
  assert.equal(imported.structuredContent.status, 'dispatched');
  assert.equal(client.dispatched.length, 1);

  const saveBeforeImage = await registry.call('save_check_in', { proposal, approved: true });
  assert.equal(saveBeforeImage.isError, true);

  client.files.set(`${branch}:public/gallery/agents/copper-moth.webp`, {
    sha: 'image-sha', content: 'binary-placeholder', htmlUrl: 'https://github.test/image',
  });
  const saved = await registry.call('save_check_in', { proposal, approved: true });
  assert.equal(saved.structuredContent.status, 'saved');

  const opened = await registry.call('open_check_in_pr', { proposal, approved: true });
  assert.equal(opened.structuredContent.status, 'opened');
  assert.equal(opened.structuredContent.draft, true);

  const reopened = await registry.call('open_check_in_pr', { proposal, approved: true });
  assert.equal(reopened.structuredContent.status, 'already-opened');
});

test('finalise re-checks green CI and requires ready before merge', async () => {
  const client = new FakeClient();
  const registry = createToolRegistry(client);
  await registry.call('reserve_check_in', { entryId: proposal.entryId, branch: 'agent-check-in/copper-moth', approved: true });
  client.files.set('agent-check-in/copper-moth:public/gallery/agents/copper-moth.webp', { sha: 'image', content: '', htmlUrl: '' });
  await registry.call('save_check_in', { proposal, approved: true });
  await registry.call('open_check_in_pr', { proposal, approved: true });

  const mergeDraft = await registry.call('finalise_check_in', {
    prNumber: 99, action: 'merge', confirmation: 'merge PR #99', approved: true,
  });
  assert.equal(mergeDraft.isError, true);
  assert.match(mergeDraft.content[0].text, /Mark the pull request ready/);

  const ready = await registry.call('finalise_check_in', {
    prNumber: 99, action: 'mark-ready', confirmation: 'mark PR #99 ready', approved: true,
  });
  assert.equal(ready.structuredContent.status, 'ready');

  const merged = await registry.call('finalise_check_in', {
    prNumber: 99, action: 'merge', confirmation: 'merge PR #99', approved: true,
  });
  assert.equal(merged.structuredContent.status, 'merged');
});
