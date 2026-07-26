import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createMcpHandler } from '../src/server.mjs';

const READ_ONLY_TOOLS = [
  'get_check_in_capabilities',
  'start_check_in_session',
  'submit_check_in_text',
  'attach_check_in_artwork_source',
  'skip_check_in_artwork',
  'get_check_in_session',
  'plan_check_in_session',
  'plan_check_in',
  'get_check_in_status',
];

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
    sessionSecret: 'server-test-session-secret-with-enough-bytes',
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
      Accept: 'application/json, text/event-stream',
      ...(authenticated ? { Authorization: 'Bearer secret-token' } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
}

async function readRpcPayload(response) {
  const text = await response.text();
  if (!response.headers.get('content-type')?.includes('text/event-stream')) {
    return JSON.parse(text);
  }
  const data = text
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .filter(Boolean);
  assert.ok(data.length > 0, 'SSE response should contain a data event');
  return JSON.parse(data.at(-1));
}

test('bearer ingress requires backend authentication', async () => {
  await withServer({}, async (url) => {
    const response = await rpc(url, 'ping', {}, { authenticated: false });
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('www-authenticate'), 'Bearer');
  });
});

test('tunnel ingress uses workspace access and no backend bearer header', async () => {
  await withServer({ ingressMode: 'tunnel', inboundToken: undefined }, async (url) => {
    const response = await rpc(url, 'ping', {}, { authenticated: false });
    assert.equal(response.status, 200);

    const listed = await rpc(url, 'tools/list', {}, { authenticated: false }).then(readRpcPayload);
    for (const tool of listed.result.tools) {
      assert.deepEqual(tool.securitySchemes, [{ type: 'noauth' }]);
      assert.deepEqual(tool._meta.securitySchemes, [{ type: 'noauth' }]);
    }

    const health = await fetch(`${url}/healthz`).then((item) => item.json());
    assert.equal(health.version, '0.4.0');
    assert.equal(health.transport, 'streamable-http');
    assert.equal(health.sessionMode, 'signed-stateless');
    assert.equal(health.authContract, 'workspace-tunnel');
  });
});

test('official SDK client negotiates, lists, and calls the guided read-only plugin', async () => {
  await withServer({ ingressMode: 'tunnel', inboundToken: undefined }, async (url) => {
    const client = new Client({ name: 'scrapbook-check-in-smoke', version: '1.0.0' });
    const transport = new StreamableHTTPClientTransport(new URL(`${url}/mcp`));
    try {
      await client.connect(transport);
      const listed = await client.listTools();
      assert.deepEqual(listed.tools.map((tool) => tool.name), READ_ONLY_TOOLS);
      for (const tool of listed.tools) assert.ok(tool.outputSchema);

      const capabilities = await client.callTool({
        name: 'get_check_in_capabilities',
        arguments: {},
      });
      assert.equal(capabilities.isError, undefined);
      assert.equal(capabilities.structuredContent?.profile, 'read-only');
      assert.equal(capabilities.structuredContent?.mergeEnabled, false);
      assert.equal(capabilities.structuredContent?.sessionFlow?.mode, 'signed-stateless');

      const started = await client.callTool({
        name: 'start_check_in_session',
        arguments: {
          repository: 'teamleaderleo/scrapbook',
          sourceLabel: 'Issue #378',
          sourceHref: 'https://github.com/teamleaderleo/scrapbook/issues/378',
        },
      });
      assert.equal(started.isError, undefined);
      assert.equal(started.structuredContent?.session?.stage, 'awaiting_text');
      assert.equal(typeof started.structuredContent?.sessionToken, 'string');
    } finally {
      await client.close();
    }
  });
});

test('default bearer profile exposes the guided read-only OAuth surface', async () => {
  await withServer({}, async (url) => {
    const listed = await rpc(url, 'tools/list').then(readRpcPayload);
    assert.deepEqual(listed.result.tools.map((tool) => tool.name), READ_ONLY_TOOLS);
    for (const tool of listed.result.tools) {
      assert.ok(tool.outputSchema);
      assert.equal(tool.securitySchemes[0].type, 'oauth2');
    }

    const health = await fetch(`${url}/healthz`).then((response) => response.json());
    assert.equal(health.version, '0.4.0');
    assert.equal(health.sessionMode, 'signed-stateless');
    assert.equal(health.ingressMode, 'bearer');
    assert.equal(health.authContract, 'oauth2-gateway');
    assert.equal(health.toolProfile, 'read-only');
    assert.equal(health.mergeEnabled, false);
  });
});

test('tool errors omit structuredContent that would violate the success output schema', async () => {
  await withServer({}, async (url) => {
    const payload = await rpc(url, 'tools/call', {
      name: 'reserve_check_in',
      arguments: {
        entryId: 'blocked-write',
        branch: 'agent-check-in/blocked-write',
        approved: true,
      },
    }).then(readRpcPayload);

    assert.equal(payload.result.isError, true);
    assert.equal(Object.hasOwn(payload.result, 'structuredContent'), false);
    assert.match(payload.result.content[0].text, /unavailable in the read-only profile/);
  });
});

test('full profile advertises guided publication, granular writes, and review while merge stays opt-in', async () => {
  await withServer({ toolProfile: 'full' }, async (url) => {
    const listed = await rpc(url, 'tools/list').then(readRpcPayload);
    assert.ok(listed.result.tools.some((tool) => tool.name === 'advance_check_in_session'));
    assert.ok(listed.result.tools.some((tool) => tool.name === 'reserve_check_in'));
    assert.ok(listed.result.tools.some((tool) => tool.name === 'mark_check_in_ready'));
    assert.ok(!listed.result.tools.some((tool) => tool.name === 'merge_check_in_pr'));
  });

  await withServer({ toolProfile: 'full', allowMerge: true }, async (url) => {
    const listed = await rpc(url, 'tools/list').then(readRpcPayload);
    const merge = listed.result.tools.find((tool) => tool.name === 'merge_check_in_pr');
    assert.equal(merge.annotations.destructiveHint, true);
    assert.deepEqual(merge.securitySchemes[0].scopes, ['scrapbook.checkins.merge']);
  });
});
