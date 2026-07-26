import { randomUUID, timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ScrapbookGitHubClient } from './github-client.mjs';
import { createSessionToolRegistry } from './sessions.mjs';
import { createToolRegistry } from './tools.mjs';

const SERVER_NAME = 'scrapbook-check-in-mcp';
const SERVER_VERSION = '0.4.0';
const INGRESS_MODES = new Set(['bearer', 'tunnel']);
const DEVELOPMENT_SESSION_SECRET = 'development-only-scrapbook-session-signing-secret';

function constantTimeEquals(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function normaliseIngressMode(value) {
  if (!INGRESS_MODES.has(value)) {
    throw new Error(`SCRAPBOOK_INGRESS_MODE must be bearer or tunnel, received: ${value}`);
  }
  return value;
}

function parseAllowedOrigins(value = process.env.SCRAPBOOK_ALLOWED_ORIGINS || '') {
  return new Set(
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function bearerIsValid(req, expectedToken, ingressMode) {
  if (ingressMode === 'tunnel') return true;
  if (!expectedToken) return true;
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return false;
  return constantTimeEquals(header.slice(7), expectedToken);
}

function originIsAllowed(req, allowedOrigins) {
  const origin = req.headers.origin;
  if (!origin) return true;
  return allowedOrigins.has(origin);
}

function sendJson(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [name, value] of Object.entries(extraHeaders)) res.setHeader(name, value);
  res.end(payload);
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, Accept, Mcp-Session-Id, Last-Event-ID, MCP-Protocol-Version, X-Request-Id',
  );
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id, X-Request-Id');
}

function applyIngressSecurity(registry, ingressMode) {
  if (ingressMode !== 'tunnel') return;
  for (const tool of registry.tools) {
    const securitySchemes = [{ type: 'noauth' }];
    tool.securitySchemes = securitySchemes;
    tool._meta = { ...tool._meta, securitySchemes };
  }
}

function normaliseToolResult(result) {
  if (!result?.isError || !Object.hasOwn(result, 'structuredContent')) return result;
  const { structuredContent: _invalidForSuccessSchema, ...errorResult } = result;
  return errorResult;
}

function pluginInstructions(registry, ingressMode) {
  const writes = registry.profile === 'full'
    ? 'Ask for explicit approval before each write.'
    : 'This connection is read-only; do not ask it to change GitHub.';
  const merge = registry.allowMerge
    ? 'Merge is a separate destructive tool and requires the exact pull request confirmation.'
    : 'Merge authority is disabled on this connection.';
  const auth = ingressMode === 'tunnel'
    ? 'Connection access is controlled by the private OpenAI tunnel and workspace permissions.'
    : 'User OAuth is enforced by the trusted public gateway before this backend bearer boundary.';
  return `Read capabilities first. For a turn-by-turn visit, start_check_in_session and follow the returned next tools. The image brief is a separate evolving step; this service only records an attached image source or an explicit text-only choice. ${writes} Preserve the fixed Scrapbook branch, importer, typed guestbook, provenance, draft PR, and green-check boundaries. ${merge} ${auth}`;
}

function resolveSessionSecret({ sessionSecret, inboundToken }) {
  const candidate = sessionSecret || process.env.SCRAPBOOK_SESSION_SECRET || (inboundToken?.length >= 32 ? inboundToken : undefined);
  if (candidate) return candidate;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SCRAPBOOK_SESSION_SECRET is required in production unless the backend bearer token contains at least 32 characters.');
  }
  return DEVELOPMENT_SESSION_SECRET;
}

function toolAccess(tool) {
  const scope = tool.securitySchemes?.flatMap((scheme) => scheme.scopes || [])[0] || '';
  if (scope.endsWith('.merge')) return 'merge';
  if (scope.endsWith('.review')) return 'review';
  if (scope.endsWith('.write')) return 'write';
  return 'read';
}

function finaliseRegistry(source) {
  const tools = source.tools.map((tool) => tool.name === 'advance_check_in_session'
    ? { ...tool, annotations: { ...tool.annotations, idempotentHint: false } }
    : tool);
  const summaries = tools.map((tool) => ({
    name: tool.name,
    access: toolAccess(tool),
    requiresApproval: tool.annotations.readOnlyHint === false,
    destructive: tool.annotations.destructiveHint,
  }));
  return {
    tools,
    profile: source.profile,
    allowMerge: source.allowMerge,
    async call(name, args) {
      const result = await source.call(name, args);
      if (name !== 'get_check_in_capabilities' || result?.isError) return result;
      return {
        ...result,
        structuredContent: { ...result.structuredContent, tools: summaries },
      };
    },
  };
}

function resolveRuntime({
  githubClient = new ScrapbookGitHubClient(),
  inboundToken = process.env.SCRAPBOOK_MCP_BEARER_TOKEN,
  ingressMode = process.env.SCRAPBOOK_INGRESS_MODE || 'bearer',
  toolProfile = process.env.SCRAPBOOK_TOOL_PROFILE || 'read-only',
  allowMerge = process.env.SCRAPBOOK_ALLOW_MERGE === 'true',
  sessionSecret,
  allowedOrigins = parseAllowedOrigins(),
  logger = console,
} = {}) {
  const resolvedIngressMode = normaliseIngressMode(ingressMode);
  if (process.env.NODE_ENV === 'production' && resolvedIngressMode === 'bearer' && !inboundToken) {
    throw new Error('SCRAPBOOK_MCP_BEARER_TOKEN is required for production bearer ingress.');
  }
  const baseRegistry = createToolRegistry(githubClient, { profile: toolProfile, allowMerge });
  const sessionRegistry = createSessionToolRegistry(baseRegistry, {
    sessionSecret: resolveSessionSecret({ sessionSecret, inboundToken }),
  });
  const registry = finaliseRegistry(sessionRegistry);
  applyIngressSecurity(registry, resolvedIngressMode);
  return {
    inboundToken,
    ingressMode: resolvedIngressMode,
    allowedOrigins,
    logger,
    registry,
    instructions: pluginInstructions(registry, resolvedIngressMode),
  };
}

function healthPayload(runtime) {
  return {
    ok: true,
    service: SERVER_NAME,
    version: SERVER_VERSION,
    transport: 'streamable-http',
    sessionMode: 'signed-stateless',
    ingressMode: runtime.ingressMode,
    authContract: runtime.ingressMode === 'tunnel' ? 'workspace-tunnel' : 'oauth2-gateway',
    toolProfile: runtime.registry.profile,
    mergeEnabled: runtime.registry.allowMerge,
  };
}

export function createProtocolServer(runtime) {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      capabilities: { tools: {} },
      instructions: runtime.instructions,
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: runtime.registry.tools }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const startedAt = Date.now();
    const name = request.params.name;
    const result = normaliseToolResult(await runtime.registry.call(name, request.params.arguments || {}));
    runtime.logger.info?.({
      method: 'tools/call',
      tool: name,
      durationMs: Date.now() - startedAt,
      isError: Boolean(result?.isError),
    });
    return result;
  });

  return server;
}

export async function handleMcpRequest(req, res, options = {}) {
  const runtime = options.registry ? options : resolveRuntime(options);
  const requestId = req.headers['x-request-id'] || randomUUID();
  res.setHeader('X-Request-Id', requestId);
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (!originIsAllowed(req, runtime.allowedOrigins)) {
    sendJson(res, 403, { error: 'Origin is not allowed.' });
    return;
  }
  if (!bearerIsValid(req, runtime.inboundToken, runtime.ingressMode)) {
    sendJson(res, 401, { error: 'Bearer authentication is required.' }, { 'WWW-Authenticate': 'Bearer' });
    return;
  }

  const server = createProtocolServer(runtime);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    transport.close().catch(() => {});
    server.close().catch(() => {});
  };
  res.on?.('close', close);

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    runtime.logger.error?.({ requestId, method: req.body?.method, error: error?.message });
    if (!res.headersSent) {
      sendJson(res, 500, {
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error', data: { requestId } },
        id: null,
      });
    }
  } finally {
    if (res.writableEnded) close();
  }
}

export function createHttpApp(options = {}) {
  const runtime = resolveRuntime(options);
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.get('/healthz', (_req, res) => sendJson(res, 200, healthPayload(runtime)));
  app.all('/mcp', (req, res) => handleMcpRequest(req, res, runtime));
  return app;
}

// Kept for existing callers while the implementation now uses Express + the official SDK.
export function createMcpHandler(options = {}) {
  return createHttpApp(options);
}

export function startServer({
  port = Number(process.env.PORT || 8787),
  host = process.env.HOST || (process.env.SCRAPBOOK_INGRESS_MODE === 'tunnel' ? '127.0.0.1' : '0.0.0.0'),
  ...options
} = {}) {
  const ingressMode = normaliseIngressMode(options.ingressMode || process.env.SCRAPBOOK_INGRESS_MODE || 'bearer');
  const inboundToken = options.inboundToken ?? process.env.SCRAPBOOK_MCP_BEARER_TOKEN;
  if (ingressMode === 'tunnel' && !['127.0.0.1', '::1', 'localhost'].includes(host)) {
    throw new Error('Tunnel ingress must bind only to loopback. Set HOST=127.0.0.1.');
  }

  const app = createHttpApp({ ...options, ingressMode, inboundToken });
  const server = app.listen(port, host, () => {
    console.log(`${SERVER_NAME} listening on http://${host}:${port}/mcp (${ingressMode}, ${process.env.SCRAPBOOK_TOOL_PROFILE || 'read-only'})`);
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}
