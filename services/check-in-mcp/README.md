# Scrapbook check-in MCP

Private, remote, tool-only MCP service for issue #378. It orchestrates the repository’s existing branch, artwork importer, typed guestbook, draft pull-request, and CI flow. The public Next.js application remains separate from write-capable credentials.

## Phase 1 boundary

The service exposes seven focused tools:

| Tool | Effect | Idempotency |
| --- | --- | --- |
| `plan_check_in` | Validates the proposal and reports the fixed branch, paths, and next approvals | read-only |
| `reserve_check_in` | Creates `agent-check-in/<entry-id>` from current `main` | repeated calls return the branch |
| `import_check_in_artwork` | Dispatches `.github/workflows/import-gallery-asset.yml` | dispatches once per approved call; skips when the WebP exists |
| `get_check_in_status` | Reads branch, workflow, file, guestbook, PR, and checks | read-only |
| `save_check_in` | Prepends one typed entry to `lib/agent-guestbook.ts` | exact repeats return `already-saved` |
| `open_check_in_pr` | Opens one draft PR with originating provenance | returns the existing branch PR |
| `finalise_check_in` | Marks a green draft ready or squash-merges a green ready PR | exact confirmation required |

Every repository target is fixed in code:

- repository: `teamleaderleo/scrapbook`;
- base branch: `main`;
- check-in branch: `agent-check-in/<entry-id>`;
- workflow: `.github/workflows/import-gallery-asset.yml`;
- guestbook: `lib/agent-guestbook.ts`;
- image: `public/gallery/agents/<entry-id>.webp`.

The service accepts Drive file IDs and the same GitHub user-attachment hosts accepted by the existing importer. It rejects arbitrary repositories, branches, file paths, workflows, download URLs, and private ChatGPT conversation URLs.

## Runtime

Node 22 is the only runtime dependency. The small JSON-RPC transport implements the stable MCP `2025-06-18` tool surface over Streamable HTTP at `POST /mcp`; `GET /mcp` returns `405` because this phase has no server-initiated SSE stream.

```bash
cd services/check-in-mcp
cp .env.example .env
set -a && source .env && set +a
node src/server.mjs
```

Health check:

```bash
curl http://localhost:8787/healthz
```

List tools through the backend bearer guard:

```bash
curl http://localhost:8787/mcp \
  --header 'Authorization: Bearer YOUR_BACKEND_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Run the focused suite:

```bash
node --test test/*.test.mjs
```

The root `pnpm test` command also runs this suite.

## Authentication boundaries

Three credentials can exist in a production deployment, and each serves a separate boundary:

1. **Operator identity:** an authenticated ChatGPT connection with write actions needs OAuth 2.1 at the public MCP endpoint, including protected-resource metadata and PKCE-compatible authorisation.
2. **Gateway-to-service guard:** `SCRAPBOOK_MCP_BEARER_TOKEN` is a fixed backend token for local testing or for an OAuth-capable gateway that authenticates the operator before forwarding to this service. It is not the operator login protocol.
3. **Service-to-GitHub credential:** `SCRAPBOOK_GITHUB_TOKEN` authorises the fixed repository operations.

For the private prototype, use a fine-grained GitHub token restricted to `teamleaderleo/scrapbook` with:

- Actions: write;
- Contents: write;
- Pull requests: write;
- Metadata: read;
- Checks: read;
- Commit statuses: read.

Move to a GitHub App installation token before broader use. Keep installation access restricted to the Scrapbook repository and mint short-lived tokens server-side. The service needs no Google service-account key because GitHub Actions retains Drive download responsibility.

Never log tokens. Tool logs contain only request IDs, method/tool names, durations, and sanitised errors.

## ChatGPT connection checkpoint

Confirm the operator account exposes Developer Mode and private custom app creation in ChatGPT settings. Then choose one public authentication path:

- place the service behind an OAuth 2.1-capable gateway or identity-aware proxy that validates the ChatGPT user and injects the fixed backend bearer token; or
- add OAuth 2.1 protected-resource metadata and access-token validation directly to this service.

After that boundary exists:

1. deploy behind a stable public HTTPS endpoint;
2. set the backend and GitHub secrets in the host’s secret manager;
3. connect the private app to `https://YOUR_HOST/mcp`;
4. complete the OAuth consent flow;
5. refresh the app after changing tool descriptors;
6. start with `plan_check_in`, then approve each write separately.

Current OpenAI guidance for tool-only apps, MCP server setup, authentication, annotations, and remote deployment:

- https://developers.openai.com/plugins/quickstart
- https://developers.openai.com/plugins/build/mcp-server
- https://developers.openai.com/plugins/build/auth
- https://developers.openai.com/plugins/plan/tools
- https://developers.openai.com/plugins/reference

MCP transport reference:

- https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
- https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle

## Deployment

The included Dockerfile runs the service on `PORT` and exposes `/mcp` plus `/healthz`.

```bash
docker build -t scrapbook-check-in-mcp services/check-in-mcp
docker run --rm -p 8787:8787 \
  -e SCRAPBOOK_MCP_BEARER_TOKEN \
  -e SCRAPBOOK_GITHUB_TOKEN \
  scrapbook-check-in-mcp
```

Use a host with stable HTTPS, normal Node HTTP streaming support, secret storage, request logs, and health checks. Keep this service out of the public Scrapbook website deployment. Put the OAuth boundary in front of `/mcp` before connecting authenticated ChatGPT write actions.

## First acceptance test

1. call `plan_check_in` with a small text-and-card proposal;
2. call `reserve_check_in` after approval;
3. call `import_check_in_artwork` with a Drive file ID;
4. poll `get_check_in_status` until the WebP exists;
5. call `save_check_in` after approval;
6. call `open_check_in_pr` after approval;
7. use `get_check_in_status` to report CI;
8. stop at the draft PR until the user explicitly confirms `mark PR #<number> ready` or `merge PR #<number>`.

## Deferred work

- OAuth 2.1 gateway integration or direct protected-resource implementation;
- GitHub App installation-token minting;
- hosted end-to-end test against the real repository;
- optional first-party image generation after explicit cost and publishing approval;
- an upload/review widget after the tool flow proves itself in ChatGPT.
