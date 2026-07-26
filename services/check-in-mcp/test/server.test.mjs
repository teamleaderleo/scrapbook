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

async function withServer(run) {
  const server = http.createServer(createMcpHandler({
    githubClient: new ReadOnlyFakeClient(),
    inboundToken: 'secret-token',
    logger: { info() {}, error() {} },
  }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('private MCP endpoint requires bearer authentication', async () => {
  await withServer(async (url) => {
    const response = await fetch(`${url}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
    });
    assert.equal(response.status, 401);
  });
});

test('initialize and tools/list expose a stable tool-only MCP surface', async () => {
  await withServer(async (url) => {
    const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer secret-token' };
    const initialize = await fetch(`${url}/mcp`, {
      method: 'POST', headers,
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'initialize',
        params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } },
      }),
    }).then((response) => response.json());
    assert.equal(initialize.result.protocolVersion, '2025-06-18');
    assert.deepEqual(initialize.result.capabilities, { tools: { listChanged: false } });

    const listed = await fetch(`${url}/mcp`, {
      method: 'POST', headers,
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
    }).then((response) => response.json());
    assert.deepEqual(
      listed.result.tools.map((tool) => tool.name),
      ['plan_check_in', 'reserve_check_in', 'import_check_in_artwork', 'get_check_in_status', 'save_check_in', 'open_check_in_pr', 'finalise_check_in'],
    );
  });
});
