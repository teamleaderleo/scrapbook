import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { resolvePublicIngressOptions } from '../api/mcp.js';

const bearer = `bearer-${'a'.repeat(40)}`;
const session = `session-${'b'.repeat(40)}`;

test('public ingress always uses bearer mode with separate explicit secrets', () => {
  assert.deepEqual(resolvePublicIngressOptions({
    SCRAPBOOK_INGRESS_MODE: 'tunnel',
    SCRAPBOOK_MCP_BEARER_TOKEN: bearer,
    SCRAPBOOK_SESSION_SECRET: session,
  }), {
    ingressMode: 'bearer',
    inboundToken: bearer,
    sessionSecret: session,
  });
});

test('public ingress rejects missing, short, and reused secrets', () => {
  assert.throws(
    () => resolvePublicIngressOptions({ SCRAPBOOK_SESSION_SECRET: session }),
    /SCRAPBOOK_MCP_BEARER_TOKEN/,
  );
  assert.throws(
    () => resolvePublicIngressOptions({
      SCRAPBOOK_MCP_BEARER_TOKEN: bearer,
      SCRAPBOOK_SESSION_SECRET: 'short',
    }),
    /SCRAPBOOK_SESSION_SECRET/,
  );
  assert.throws(
    () => resolvePublicIngressOptions({
      SCRAPBOOK_MCP_BEARER_TOKEN: bearer,
      SCRAPBOOK_SESSION_SECRET: bearer,
    }),
    /separate secrets/,
  );
});

test('public handler returns a generic unavailable response when ingress is unconfigured', async () => {
  const previousBearer = process.env.SCRAPBOOK_MCP_BEARER_TOKEN;
  const previousSession = process.env.SCRAPBOOK_SESSION_SECRET;
  delete process.env.SCRAPBOOK_MCP_BEARER_TOKEN;
  delete process.env.SCRAPBOOK_SESSION_SECRET;

  const headers = new Map();
  const response = {
    statusCode: 0,
    body: '',
    setHeader(name, value) {
      headers.set(name.toLowerCase(), value);
    },
    end(value = '') {
      this.body = value;
    },
  };

  try {
    await handler({ headers: {} }, response);
  } finally {
    if (previousBearer === undefined) delete process.env.SCRAPBOOK_MCP_BEARER_TOKEN;
    else process.env.SCRAPBOOK_MCP_BEARER_TOKEN = previousBearer;
    if (previousSession === undefined) delete process.env.SCRAPBOOK_SESSION_SECRET;
    else process.env.SCRAPBOOK_SESSION_SECRET = previousSession;
  }

  assert.equal(response.statusCode, 503);
  assert.equal(headers.get('cache-control'), 'no-store');
  assert.deepEqual(JSON.parse(response.body), {
    error: 'Scrapbook MCP ingress is unavailable.',
  });
  assert.doesNotMatch(response.body, /TOKEN|SECRET|bearer|session/i);
});
