import http from 'node:http';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { ScrapbookGitHubClient } from './github-client.mjs';
import { createToolRegistry } from './tools.mjs';

const SERVER_NAME = 'scrapbook-check-in-mcp';
const SERVER_VERSION = '0.2.0';
const LATEST_PROTOCOL = '2025-06-18';
const SUPPORTED_PROTOCOLS = new Set(['2025-06-18', '2025-03-26']);
const INGRESS_MODES = new Set(['bearer', 'tunnel']);
const MAX_BODY_BYTES = 1024 * 1024;

function jsonResponse(res, status, body, extraHeaders = {}) {
  const payload = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  res.end(payload);
}

function jsonRpcResult(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function jsonRpcError(id, code, message, data) {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: { code, message, ...(data === undefined ? {} : { data }) },
  };
}

function constantTimeEquals(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
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

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error('Request body exceeds 1 MiB.'), { status: 413 });
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) throw Object.assign(new Error('Request body is required.'), { status: 400 });
  try {
    return JSON.parse(text);
  } catch {
    throw Object.assign(new Error('Request body must be valid JSON.'), { status: 400 });
  }
}

function negotiatedProtocol(requested) {
  return SUPPORTED_PROTOCOLS.has(requested) ? requested : LATEST_PROTOCOL;
}

function normaliseIngressMode(value) {
  if (!INGRESS_MODES.has(value)) throw new Error(`SCRAPBOOK_INGRESS_MODE must be bearer or tunnel, received: ${value}`);
  return value;
}

function pluginInstructions(registry) {
  const writes = registry.profile === 'full'
    ? 'Ask for explicit approval before each write.'
    : 'This connection is read-only; do not ask it to change GitHub.';
  const merge = registry.allowMerge
    ? 'Merge is a separate destructive tool and requires the exact pull request confirmation.'
    : 'Merge authority is disabled on this connection.';
  return `Read capabilities first. ${writes} Preserve the fixed Scrapbook branch, importer, typed guestbook, provenance, draft PR, and green-check boundaries. ${merge}`;
}

export function createMcpHandler({
  githubClient = new ScrapbookGitHubClient(),
  inboundToken = process.env.SCRAPBOOK_MCP_BEARER_TOKEN,
  ingressMode = process.env.SCRAPBOOK_INGRESS_MODE || 'bearer',
  toolProfile = process.env.SCRAPBOOK_TOOL_PROFILE || 'read-only',
  allowMerge = process.env.SCRAPBOOK_ALLOW_MERGE === 'true',
  allowedOrigins = new Set(
    (process.env.SCRAPBOOK_ALLOWED_ORIGINS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  ),
  logger = console,
} = {}) {
  const resolvedIngressMode = normaliseIngressMode(ingressMode);
  const registry = createToolRegistry(githubClient, { profile: toolProfile, allowMerge });

  return async function handle(req, res) {
    const requestId = req.headers['x-request-id'] || randomUUID();
    res.setHeader('X-Request-Id', requestId);

    if (req.url === '/healthz' && req.method === 'GET') {
      return jsonResponse(res, 200, {
        ok: true,
        service: SERVER_NAME,
        version: SERVER_VERSION,
        ingressMode: resolvedIngressMode,
        toolProfile: registry.profile,
        mergeEnabled: registry.allowMerge,
      });
    }
    if (req.url !== '/mcp') return jsonResponse(res, 404, { error: 'Not found.' });
    if (!originIsAllowed(req, allowedOrigins)) return jsonResponse(res, 403, { error: 'Origin is not allowed.' });
    if (!bearerIsValid(req, inboundToken, resolvedIngressMode)) {
      res.setHeader('WWW-Authenticate', 'Bearer');
      return jsonResponse(res, 401, { error: 'Bearer authentication is required.' });
    }
    if (req.method === 'GET') {
      return jsonResponse(
        res,
        405,
        { error: 'This tool-only server uses JSON responses over POST and does not expose an SSE stream.' },
        { Allow: 'POST, GET' },
      );
    }
    if (req.method !== 'POST') return jsonResponse(res, 405, { error: 'Method not allowed.' }, { Allow: 'POST, GET' });
    const contentType = req.headers['content-type'] || '';
    if (!contentType.toLowerCase().startsWith('application/json')) {
      return jsonResponse(res, 415, { error: 'Content-Type must be application/json.' });
    }

    let message;
    try {
      message = await readJson(req);
    } catch (error) {
      return jsonResponse(res, error.status || 400, jsonRpcError(null, -32700, error.message));
    }
    if (Array.isArray(message) || !message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
      return jsonResponse(res, 400, jsonRpcError(message?.id, -32600, 'Invalid JSON-RPC request.'));
    }

    const startedAt = Date.now();
    try {
      if (message.method === 'notifications/initialized' || message.method.startsWith('notifications/')) {
        res.writeHead(202, { 'Cache-Control': 'no-store' });
        res.end();
        return;
      }

      let result;
      switch (message.method) {
        case 'initialize':
          result = {
            protocolVersion: negotiatedProtocol(message.params?.protocolVersion),
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: SERVER_NAME, title: 'Scrapbook check-in plugin', version: SERVER_VERSION },
            instructions: pluginInstructions(registry),
          };
          break;
        case 'ping':
          result = {};
          break;
        case 'tools/list':
          result = { tools: registry.tools };
          break;
        case 'tools/call': {
          const name = message.params?.name;
          if (typeof name !== 'string') {
            return jsonResponse(res, 200, jsonRpcError(message.id, -32602, 'tools/call requires params.name.'));
          }
          result = await registry.call(name, message.params?.arguments || {});
          break;
        }
        default:
          return jsonResponse(res, 200, jsonRpcError(message.id, -32601, `Method not found: ${message.method}`));
      }

      logger.info?.({ requestId, method: message.method, tool: message.params?.name, durationMs: Date.now() - startedAt });
      return jsonResponse(res, 200, jsonRpcResult(message.id, result));
    } catch (error) {
      logger.error?.({ requestId, method: message.method, durationMs: Date.now() - startedAt, error: error?.message });
      return jsonResponse(res, 500, jsonRpcError(message.id, -32603, 'Internal server error.', { requestId }));
    }
  };
}

export function startServer({
  port = Number(process.env.PORT || 8787),
  host = process.env.HOST || (process.env.SCRAPBOOK_INGRESS_MODE === 'tunnel' ? '127.0.0.1' : '0.0.0.0'),
  ...options
} = {}) {
  const ingressMode = normaliseIngressMode(options.ingressMode || process.env.SCRAPBOOK_INGRESS_MODE || 'bearer');
  const inboundToken = options.inboundToken ?? process.env.SCRAPBOOK_MCP_BEARER_TOKEN;
  if (process.env.NODE_ENV === 'production' && ingressMode === 'bearer' && !inboundToken) {
    throw new Error('SCRAPBOOK_MCP_BEARER_TOKEN is required for production bearer ingress.');
  }
  if (ingressMode === 'tunnel' && !['127.0.0.1', '::1', 'localhost'].includes(host)) {
    throw new Error('Tunnel ingress must bind only to loopback. Set HOST=127.0.0.1.');
  }
  const server = http.createServer(createMcpHandler({ ...options, ingressMode, inboundToken }));
  server.listen(port, host, () => {
    console.log(`${SERVER_NAME} listening on http://${host}:${port}/mcp (${ingressMode}, ${process.env.SCRAPBOOK_TOOL_PROFILE || 'read-only'})`);
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}
