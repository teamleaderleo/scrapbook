import http from 'node:http';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { ScrapbookGitHubClient } from './github-client.mjs';
import { createToolRegistry } from './tools.mjs';

const SERVER_NAME = 'scrapbook-check-in-mcp';
const SERVER_VERSION = '0.1.0';
const LATEST_PROTOCOL = '2025-06-18';
const SUPPORTED_PROTOCOLS = new Set(['2025-06-18', '2025-03-26']);
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

function bearerIsValid(req, expectedToken) {
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

export function createMcpHandler({
  githubClient = new ScrapbookGitHubClient(),
  inboundToken = process.env.SCRAPBOOK_MCP_BEARER_TOKEN,
  allowedOrigins = new Set(
    (process.env.SCRAPBOOK_ALLOWED_ORIGINS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  ),
  logger = console,
} = {}) {
  const registry = createToolRegistry(githubClient);

  return async function handle(req, res) {
    const requestId = req.headers['x-request-id'] || randomUUID();
    res.setHeader('X-Request-Id', requestId);

    if (req.url === '/healthz' && req.method === 'GET') {
      return jsonResponse(res, 200, { ok: true, service: SERVER_NAME, version: SERVER_VERSION });
    }
    if (req.url !== '/mcp') {
      return jsonResponse(res, 404, { error: 'Not found.' });
    }
    if (!originIsAllowed(req, allowedOrigins)) {
      return jsonResponse(res, 403, { error: 'Origin is not allowed.' });
    }
    if (!bearerIsValid(req, inboundToken)) {
      res.setHeader('WWW-Authenticate', 'Bearer');
      return jsonResponse(res, 401, { error: 'Bearer authentication is required.' });
    }
    if (req.method === 'GET') {
      return jsonResponse(res, 405, { error: 'This server uses JSON responses over POST and does not expose an SSE stream.' }, { Allow: 'POST, GET' });
    }
    if (req.method !== 'POST') {
      return jsonResponse(res, 405, { error: 'Method not allowed.' }, { Allow: 'POST, GET' });
    }
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
        case 'initialize': {
          result = {
            protocolVersion: negotiatedProtocol(message.params?.protocolVersion),
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: SERVER_NAME, title: 'Scrapbook check-in orchestrator', version: SERVER_VERSION },
            instructions: 'Plan first. Ask for explicit approval before each write. Preserve the fixed Scrapbook branch, importer, typed guestbook, draft PR, and green-check boundaries.',
          };
          break;
        }
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

export function startServer({ port = Number(process.env.PORT || 8787), ...options } = {}) {
  if (process.env.NODE_ENV === 'production' && !process.env.SCRAPBOOK_MCP_BEARER_TOKEN) {
    throw new Error('SCRAPBOOK_MCP_BEARER_TOKEN is required in production.');
  }
  const server = http.createServer(createMcpHandler(options));
  server.listen(port, '0.0.0.0', () => {
    console.log(`${SERVER_NAME} listening on http://0.0.0.0:${port}/mcp`);
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}
