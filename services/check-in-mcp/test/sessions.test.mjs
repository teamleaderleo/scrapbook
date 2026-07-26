import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionCodec, createSessionToolRegistry } from '../src/sessions.mjs';
import { createToolRegistry } from '../src/tools.mjs';

const startInput = {
  repository: 'teamleaderleo/scrapbook',
  model: 'GPT-5.6 Thinking',
  sourceLabel: 'Issue #378',
  sourceHref: 'https://github.com/teamleaderleo/scrapbook/issues/378',
  inspiration: 'thread',
  style: 'zine',
  personalities: ['deadpan', 'satirical'],
};

const textInput = {
  entryId: 'session-sparrow',
  name: 'Session Sparrow',
  mark: 'SS-01',
  note: 'Turned the check-in tools into a guided visit without swallowing the approval boundaries.',
  date: '2026-07-26',
  mode: 'goofy',
};

const baseGuestbook = `import 'server-only';\n\nconst visits = [\n  {\n    id: 'older-entry',\n  },\n] satisfies AgentVisit[];\n`;

class FakeClient {
  constructor() {
    this.refs = new Map([['main', { object: { sha: 'main-sha' } }]]);
    this.files = new Map([['main:lib/agent-guestbook.ts', {
      sha: 'guestbook-sha',
      content: baseGuestbook,
      htmlUrl: 'https://github.test/guestbook',
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
      id: 7,
      status: 'in_progress',
      conclusion: null,
      html_url: 'https://github.test/actions/7',
      head_sha: this.refs.get(input.branch)?.object.sha || null,
    }];
  }
  async listArtworkRuns() { return this.runs; }
  async listPullRequestsForBranch(branch) { return this.pulls.filter((pr) => pr.head.ref === branch); }
  async getCheckRuns() {
    return {
      check_runs: [{
        name: 'CI / verify',
        status: 'completed',
        conclusion: 'success',
        html_url: 'https://github.test/check',
      }],
    };
  }
  async getCombinedStatus() { return { state: 'success', statuses: [] }; }
  async updateFile(path, ref, _sha, content) {
    this.files.set(`${ref}:${path}`, { sha: 'new-sha', content, htmlUrl: 'https://github.test/guestbook' });
    return { commit: { sha: 'commit-sha' } };
  }
  async createDraftPullRequest({ branch }) {
    const pr = {
      number: 101,
      state: 'open',
      draft: true,
      merged: false,
      node_id: 'PR_session',
      html_url: 'https://github.test/pr/101',
      base: { ref: 'main' },
      head: { ref: branch, sha: 'head-sha', repo: { full_name: 'teamleaderleo/scrapbook' } },
    };
    this.pulls.push(pr);
    return pr;
  }
}

function registry(client, profile = 'read-only') {
  const base = createToolRegistry(client, { profile, allowMerge: false });
  return createSessionToolRegistry(base, {
    sessionSecret: 'unit-test-session-secret-with-enough-bytes',
    now: () => Date.parse('2026-07-26T12:00:00.000Z'),
    randomId: () => 'session-fixed-id',
  });
}

async function createReadySession(sessionRegistry, { artwork = true } = {}) {
  const started = await sessionRegistry.call('start_check_in_session', startInput);
  const written = await sessionRegistry.call('submit_check_in_text', {
    sessionToken: started.structuredContent.sessionToken,
    ...textInput,
  });
  if (!artwork) {
    return sessionRegistry.call('skip_check_in_artwork', {
      sessionToken: written.structuredContent.sessionToken,
    });
  }
  return sessionRegistry.call('attach_check_in_artwork_source', {
    sessionToken: written.structuredContent.sessionToken,
    sourceType: 'drive',
    source: 'DriveFile_123',
    imageAlt: 'A sparrow carrying a stack of signed session cards',
  });
}

test('signed session tokens reject tampering and expiry', () => {
  let current = Date.parse('2026-07-26T12:00:00.000Z');
  const codec = createSessionCodec('unit-test-session-secret-with-enough-bytes', {
    now: () => current,
    randomId: () => 'session-fixed-id',
  });
  const token = codec.encode(codec.create({ repository: 'teamleaderleo/scrapbook' }));
  assert.equal(codec.decode(token).id, 'session-fixed-id');

  const tampered = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`;
  assert.throws(() => codec.decode(tampered), /signature is invalid/);

  current += 8 * 24 * 60 * 60 * 1000;
  assert.throws(() => codec.decode(token), /expired/);
});

test('read-only guided flow collects text and artwork without touching GitHub', async () => {
  const client = new FakeClient();
  const sessionRegistry = registry(client);
  const names = sessionRegistry.tools.map((tool) => tool.name);
  assert.deepEqual(names.slice(0, 7), [
    'get_check_in_capabilities',
    'start_check_in_session',
    'submit_check_in_text',
    'attach_check_in_artwork_source',
    'skip_check_in_artwork',
    'get_check_in_session',
    'plan_check_in_session',
  ]);
  assert.ok(!names.includes('advance_check_in_session'));

  const capabilities = await sessionRegistry.call('get_check_in_capabilities', {});
  assert.equal(capabilities.structuredContent.sessionFlow.mode, 'signed-stateless');
  assert.equal(capabilities.structuredContent.sessionFlow.imageBrief, 'separate-evolving-step');

  const ready = await createReadySession(sessionRegistry);
  assert.equal(ready.structuredContent.session.stage, 'ready_for_plan');
  assert.equal(ready.structuredContent.session.draft.artwork, 'card');
  assert.equal(ready.structuredContent.session.artworkSource.sourceType, 'drive');
  assert.equal(client.refs.size, 1);
  assert.equal(client.dispatched.length, 0);
});

test('text-only sessions remain valid and reversible before planning', async () => {
  const sessionRegistry = registry(new FakeClient());
  const ready = await createReadySession(sessionRegistry, { artwork: false });
  assert.equal(ready.structuredContent.session.stage, 'ready_for_plan');
  assert.equal(ready.structuredContent.session.draft.artwork, 'none');
  assert.equal(ready.structuredContent.session.artworkSource, null);

  const replaced = await sessionRegistry.call('attach_check_in_artwork_source', {
    sessionToken: ready.structuredContent.sessionToken,
    sourceType: 'github-attachment',
    source: 'https://github.com/user-attachments/assets/12345678-1234-1234-1234-123456789012',
    imageAlt: 'A deliberately late image arriving after the text-only choice',
  });
  assert.equal(replaced.structuredContent.session.draft.artwork, 'card');
});

test('full guided publisher performs one existing repository mutation per approved turn', async () => {
  const client = new FakeClient();
  const sessionRegistry = registry(client, 'full');
  assert.ok(sessionRegistry.tools.some((tool) => tool.name === 'advance_check_in_session'));

  const ready = await createReadySession(sessionRegistry);
  const planned = await sessionRegistry.call('plan_check_in_session', {
    sessionToken: ready.structuredContent.sessionToken,
  });
  assert.equal(planned.structuredContent.session.stage, 'awaiting_branch');

  const reserved = await sessionRegistry.call('advance_check_in_session', {
    sessionToken: planned.structuredContent.sessionToken,
    approved: true,
  });
  assert.equal(reserved.structuredContent.action.tool, 'reserve_check_in');
  assert.equal(reserved.structuredContent.session.stage, 'awaiting_artwork_import');
  assert.equal(client.refs.has('agent-check-in/session-sparrow'), true);
  assert.equal(client.dispatched.length, 0);

  const dispatched = await sessionRegistry.call('advance_check_in_session', {
    sessionToken: reserved.structuredContent.sessionToken,
    approved: true,
  });
  assert.equal(dispatched.structuredContent.action.tool, 'import_check_in_artwork');
  assert.equal(client.dispatched.length, 1);
  assert.equal(client.pulls.length, 0);

  const waiting = await sessionRegistry.call('advance_check_in_session', {
    sessionToken: dispatched.structuredContent.sessionToken,
    approved: true,
  });
  assert.equal(waiting.structuredContent.action, null);
  assert.match(waiting.content[0].text, /still running/);
  assert.equal(client.dispatched.length, 1);

  const branch = 'agent-check-in/session-sparrow';
  client.files.set(`${branch}:public/gallery/agents/session-sparrow.webp`, {
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
  assert.equal(client.pulls.length, 0);

  const opened = await sessionRegistry.call('advance_check_in_session', {
    sessionToken: saved.structuredContent.sessionToken,
    approved: true,
  });
  assert.equal(opened.structuredContent.action.tool, 'open_check_in_pr');
  assert.equal(opened.structuredContent.session.stage, 'published');
  assert.equal(client.pulls.length, 1);

  const complete = await sessionRegistry.call('advance_check_in_session', {
    sessionToken: opened.structuredContent.sessionToken,
    approved: true,
  });
  assert.equal(complete.structuredContent.action, null);
  assert.match(complete.content[0].text, /already exists/);
});
