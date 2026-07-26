import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToolRegistry } from '../src/orchestration.mjs';
import { createToolRegistry } from '../src/tools.mjs';

const startInput = {
  repository: 'teamleaderleo/scrapbook',
  model: 'GPT-5.6 Thinking',
  sourceLabel: 'Issue #378',
  sourceHref: 'https://github.com/teamleaderleo/scrapbook/issues/378',
  inspiration: 'blind',
  style: 'custom',
  styleNote: 'An ordinary object or scene chosen freely after the branch is reserved.',
  personalities: ['deadpan', 'restrained'],
};

const textInput = {
  entryId: 'reserved-before-art',
  name: 'Reserved Before Art',
  mark: 'RBA-1',
  note: 'Reserved the final identity before taking the creative turn, then returned to finish the visit.',
  date: '2026-07-27',
  mode: 'serious',
};

const baseGuestbook = `import 'server-only';\n\nconst visits = [\n] satisfies AgentVisit[];\n`;

class FakeClient {
  constructor() {
    this.refs = new Map([['main', { object: { sha: 'main-sha' } }]]);
    this.files = new Map([['main:lib/agent-guestbook.ts', {
      sha: 'guestbook-sha',
      content: baseGuestbook,
      htmlUrl: 'https://github.com/teamleaderleo/scrapbook/blob/main/lib/agent-guestbook.ts',
    }]]);
    this.dispatched = [];
    this.runs = [];
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
  async dispatchArtworkImport(input) {
    this.dispatched.push(input);
    this.runs = [{
      id: 17,
      status: 'in_progress',
      conclusion: null,
      created_at: '2026-07-27T12:00:00Z',
      updated_at: '2026-07-27T12:00:00Z',
      html_url: 'https://github.com/teamleaderleo/scrapbook/actions/runs/17',
      head_sha: this.refs.get(input.branch)?.object.sha || null,
    }];
  }
  async listArtworkRuns() { return this.runs; }
  async listPullRequestsForBranch(branch) { return this.pulls.filter((pr) => pr.head.ref === branch); }
  async getCheckRuns() {
    return { check_runs: [{ name: 'CI / verify', status: 'completed', conclusion: 'success', html_url: 'https://github.test/check' }] };
  }
  async getCombinedStatus() { return { state: 'success', statuses: [] }; }
  async updateFile(path, ref, _sha, content) {
    this.files.set(`${ref}:${path}`, { sha: 'new-sha', content, htmlUrl: 'https://github.test/guestbook' });
    return { commit: { sha: 'commit-sha' } };
  }
  async createDraftPullRequest({ branch }) {
    const pr = {
      number: 118,
      state: 'open',
      draft: true,
      merged: false,
      node_id: 'PR_reserved_before_art',
      html_url: 'https://github.test/pr/118',
      base: { ref: 'main' },
      head: { ref: branch, sha: 'head-sha', repo: { full_name: 'teamleaderleo/scrapbook' } },
    };
    this.pulls.push(pr);
    return pr;
  }
}

function registry(client, profile = 'full') {
  return createSessionToolRegistry(createToolRegistry(client, { profile, allowMerge: false }), {
    sessionSecret: 'orchestration-test-secret-with-enough-bytes',
    now: () => Date.parse('2026-07-27T12:00:00.000Z'),
    randomId: () => 'orchestration-fixed-id',
  });
}

async function startAndWrite(sessionRegistry) {
  const started = await sessionRegistry.call('start_check_in_session', startInput);
  return sessionRegistry.call('submit_check_in_text', {
    sessionToken: started.structuredContent.sessionToken,
    ...textInput,
  });
}

test('read-only flow stops at identity reservation before the artwork turn', async () => {
  const sessionRegistry = registry(new FakeClient(), 'read-only');
  const names = sessionRegistry.tools.map((tool) => tool.name);
  assert.ok(!names.includes('reserve_check_in_identity'));

  const capabilities = await sessionRegistry.call('get_check_in_capabilities', {});
  assert.equal(capabilities.structuredContent.sessionFlow.identityReservation, 'before-artwork-generation');
  assert.match(capabilities.structuredContent.sessionFlow.sequence[2], /connect a full profile/);

  const written = await startAndWrite(sessionRegistry);
  assert.equal(written.structuredContent.session.stage, 'awaiting_branch');
  assert.deepEqual(written.structuredContent.session.next.tools, ['get_check_in_session']);
  assert.match(written.structuredContent.session.next.reason, /full write-capable profile/);
});

test('full guided flow reserves identity before accepting artwork', async () => {
  const client = new FakeClient();
  const sessionRegistry = registry(client);
  const names = sessionRegistry.tools.map((tool) => tool.name);
  assert.ok(names.includes('reserve_check_in_identity'));

  const written = await startAndWrite(sessionRegistry);
  assert.equal(written.structuredContent.session.stage, 'awaiting_branch');
  assert.deepEqual(written.structuredContent.session.next.tools, ['reserve_check_in_identity']);

  const blockedArtwork = await sessionRegistry.call('attach_check_in_artwork_source', {
    sessionToken: written.structuredContent.sessionToken,
    sourceType: 'drive',
    source: 'DriveFile_ReservedBeforeArt',
    imageAlt: 'A scratched household switch resting on an ordinary shelf',
  });
  assert.equal(blockedArtwork.isError, true);
  assert.match(blockedArtwork.content[0].text, /Reserve the final check-in identity/);

  const reserved = await sessionRegistry.call('reserve_check_in_identity', {
    sessionToken: written.structuredContent.sessionToken,
    approved: true,
  });
  assert.equal(reserved.structuredContent.action.tool, 'reserve_check_in');
  assert.equal(reserved.structuredContent.session.stage, 'awaiting_artwork');
  assert.equal(client.refs.has('agent-check-in/reserved-before-art'), true);
  assert.equal(client.dispatched.length, 0);

  const reservedAgain = await sessionRegistry.call('reserve_check_in_identity', {
    sessionToken: reserved.structuredContent.sessionToken,
    approved: true,
  });
  assert.equal(reservedAgain.structuredContent.action.status, 'already-reserved');
  assert.equal(client.refs.size, 2);

  const attached = await sessionRegistry.call('attach_check_in_artwork_source', {
    sessionToken: reservedAgain.structuredContent.sessionToken,
    sourceType: 'drive',
    source: 'DriveFile_ReservedBeforeArt',
    imageAlt: 'A scratched household switch resting on an ordinary shelf',
  });
  assert.equal(attached.structuredContent.session.stage, 'ready_for_plan');

  const planned = await sessionRegistry.call('plan_check_in_session', {
    sessionToken: attached.structuredContent.sessionToken,
  });
  assert.equal(planned.structuredContent.session.stage, 'awaiting_artwork_import');

  const imported = await sessionRegistry.call('advance_check_in_session', {
    sessionToken: planned.structuredContent.sessionToken,
    approved: true,
  });
  assert.equal(imported.structuredContent.action.tool, 'import_check_in_artwork');
  assert.equal(client.dispatched.length, 1);

  const waiting = await sessionRegistry.call('advance_check_in_session', {
    sessionToken: imported.structuredContent.sessionToken,
    approved: true,
  });
  assert.equal(waiting.structuredContent.action, null);
  assert.equal(client.dispatched.length, 1);

  const branch = 'agent-check-in/reserved-before-art';
  client.files.set(`${branch}:public/gallery/agents/reserved-before-art.webp`, {
    sha: 'image-sha',
    content: 'binary-placeholder',
    htmlUrl: 'https://github.test/image',
  });
  client.runs[0].status = 'completed';
  client.runs[0].conclusion = 'success';

  const saved = await sessionRegistry.call('advance_check_in_session', {
    sessionToken: waiting.structuredContent.sessionToken,
    approved: true,
  });
  assert.equal(saved.structuredContent.action.tool, 'save_check_in');
  assert.equal(saved.structuredContent.session.stage, 'awaiting_draft_pr');

  const opened = await sessionRegistry.call('advance_check_in_session', {
    sessionToken: saved.structuredContent.sessionToken,
    approved: true,
  });
  assert.equal(opened.structuredContent.action.tool, 'open_check_in_pr');
  assert.equal(opened.structuredContent.session.stage, 'published');
  assert.equal(client.pulls.length, 1);
});
