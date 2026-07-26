import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createMcpHandler } from '../src/server.mjs';

class ReadOnlyFakeClient {
  async getFile(path, ref) {
    if (path === 'lib/agent-guestbook.ts' && ref === 'main') {
      return { sha: 'x', content: "const visits = [\n] satisfies AgentVisit[];", htmlUrl: '' };
    }
    return null;
  }
  async getRef() { return null; }
}

async function withServer(options, run) {
  const server = http.createServer(createMcpHandler({
    githubClient: new ReadOnlyFakeClient(),
    inboundToken: 'secret-token',
    logger: { info() {}, error() {} },
    ...options,
  }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function rpc(url, method, params = {}, { authenticated = true } = {}) {
  return fetch(`${url}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authenticated ? { Authorization: 'Bearer secret-token' } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
}

test('bearer ingress requires backend authentication', async () => {
  await withServer({}, async (url) => {
    const response = await rpc(url, 'ping', {}, { authenticated: false });
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('www-authenticate'), 'Bearer');
  });
});

test('tunnel ingress accepts the loopback transport without a backend bearer header', async () => {
  await withServer({ ingressMode: 'tunnel', inboundToken: undefined }, async (url) => {
    const response = await rpc(url, 'ping', {}, { authenticated: false });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.deepEqual(payload.result, {});
  });
});

test('default profile exposes the safe read-only plugin surface', async () => {
  await withServer({}, async (url) => {
    const initialize = await rpc(url, 'initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'test', version: '1' },
    }).then((response) => response.json());
    assert.equal(initialize.result.protocolVersion, '2025-06-18');
    assert.deepEqual(initialize.result.capabilities, { tools: { listChanged: false } });
    assert.match(initialize.result.instructions, /read-only/);
    assert.match(initialize.result.instructions, /Merge authority is disabled/);

    const listed = await rpc(url, 'tools/list').then((response) => response.json());
    assert.deepEqual(
      listed.result.tools.map((tool) => tool.name),
      ['get_check_in_capabilities', 'plan_check_in', 'get_check_in_status'],
    );
    for (const tool of listed.result.tools) {
      assert.ok(tool.outputSchema);
      assert.ok(tool.securitySchemes);
    }

    const health = await fetch(`${url}/healthz`).then((response) => response.json());
    assert.equal(health.version, '0.2.0');
    assert.equal(health.ingressMode, 'bearer');
    assert.equal(health.toolProfile, 'read-only');
    assert.equal(health.mergeEnabled, false);
  });
});

test('full profile advertises write and review tools while merge stays opt-in', async () => {
  await withServer({ toolProfile: 'full' }, async (url) => {
    const listed = await rpc(url, 'tools/list').then((response) => response.json());
    assert.ok(listed.result.tools.some((tool) => tool.name === 'reserve_check_in'));
    assert.ok(listed.result.tools.some((tool) => tool.name === 'mark_check_in_ready'));
    assert.ok(!listed.result.tools.some((tool) => tool.name === 'merge_check_in_pr'));
  });

  await withServer({ toolProfile: 'full', allowMerge: true }, async (url) => {
    const listed = await rpc(url, 'tools/list').then((response) => response.json());
    const merge = listed.result.tools.find((tool) => tool.name === 'merge_check_in_pr');
    assert.equal(merge.annotations.destructiveHint, true);
    assert.deepEqual(merge.securitySchemes[0].scopes, ['scrapbook.checkins.merge']);
  });
});
