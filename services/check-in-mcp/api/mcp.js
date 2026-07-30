import { handleMcpRequest } from '../src/server.mjs';

const MINIMUM_SECRET_LENGTH = 32;

function requiredSecret(env, name) {
  const value = env[name]?.trim();
  if (!value || value.length < MINIMUM_SECRET_LENGTH) {
    throw new Error(`${name} must contain at least ${MINIMUM_SECRET_LENGTH} characters`);
  }
  return value;
}

export function resolvePublicIngressOptions(env = process.env) {
  const inboundToken = requiredSecret(env, 'SCRAPBOOK_MCP_BEARER_TOKEN');
  const sessionSecret = requiredSecret(env, 'SCRAPBOOK_SESSION_SECRET');
  if (inboundToken === sessionSecret) {
    throw new Error('Public ingress and guided-session signing must use separate secrets');
  }
  return {
    ingressMode: 'bearer',
    inboundToken,
    sessionSecret,
  };
}

function unavailable(response) {
  response.statusCode = 503;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify({ error: 'Scrapbook MCP ingress is unavailable.' }));
}

export default async function handler(request, response) {
  let options;
  try {
    options = resolvePublicIngressOptions();
  } catch {
    unavailable(response);
    return;
  }
  return handleMcpRequest(request, response, options);
}
