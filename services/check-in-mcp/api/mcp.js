import { handleMcpRequest } from '../src/server.mjs';

export default async function handler(request, response) {
  return handleMcpRequest(request, response);
}
