# Scrapbook check-in plugin MCP server

Private, tool-only MCP service for issue #378. It lets a ChatGPT plugin run a guided repository-backed agent check-in while preserving Scrapbook’s existing branch, image-import, typed-data, pull-request, and CI boundaries.

ChatGPT may call the connection a custom app in parts of the product. Current OpenAI developer documentation calls the developer package and connection a plugin. This repository contains the MCP server behind a private plugin; it is not a public Plugin Directory submission.

## Current status

The repository implementation is ready for a real connection test. The product flow is not complete until a private ChatGPT connection passes the acceptance run.

Implemented in draft PR #381:

- official `@modelcontextprotocol/sdk` Streamable HTTP transport;
- stateless `POST /mcp` handling compatible with normal Node hosting and Vercel Functions;
- real SDK-client negotiation, tool-list, and tool-call smoke coverage;
- signed seven-day guided sessions for turn-by-turn collection and publication;
- explicit input and output schemas for every advertised tool;
- accurate read, write, review, and merge annotations;
- OAuth scope metadata for a public gateway connection;
- `noauth` metadata only for the loopback hop behind OpenAI Secure MCP Tunnel;
- safe read-only and full write profiles;
- merge authority hidden unless separately enabled;
- fixed repository, branch, workflow, guestbook, image, PR, and CI boundaries;
- creative route, style, personality, and remix metadata from #382.

Still required before merging the service:

1. connect the service to the target ChatGPT account or workspace;
2. refresh and review the discovered tool snapshot;
3. pass the read-only guided evaluation set;
4. on an eligible write-capable workspace, create one narrow draft PR with merge disabled;
5. record the acceptance result on PR #381.

## Guided turn-by-turn flow

The preferred sequence is:

1. `get_check_in_capabilities`
2. `start_check_in_session`
3. `submit_check_in_text`
4. create the image through the separate evolving creative/image-brief flow
5. `attach_check_in_artwork_source`, or deliberately call `skip_check_in_artwork`
6. `plan_check_in_session`
7. in the full profile, call `advance_check_in_session` after each explicit approval until a draft PR exists
8. inspect CI with `get_check_in_status`

Each session result includes a signed `sessionToken`, current stage, collected draft, artwork source, missing fields, exact next eligible tools, and whether the next action requires approval.

```text
awaiting_text
  -> awaiting_artwork
  -> ready_for_plan
  -> awaiting_branch
  -> awaiting_artwork_import?  # image visits only
  -> awaiting_entry_save
  -> awaiting_draft_pr
  -> published
```

`advance_check_in_session` performs at most one repository mutation per approved call. It delegates to the existing granular tools to reserve the branch, dispatch the importer, save the typed entry, or open the draft PR. It never marks ready or merges, and it does not dispatch a duplicate importer while one is pending.

The image brief itself remains a separate evolving step. The MCP records only an already-created Drive file ID, a supported GitHub attachment, or an explicit text-only choice; it does not constrain the creative prompt.

See [`guided-sessions.md`](guided-sessions.md) for the full state machine and token boundary.

## Signed stateless sessions

Vercel may route consecutive MCP calls to different Function processes. The guided flow therefore carries its state in an HMAC-signed token rather than an in-memory map or database.

Set a dedicated signing key:

```bash
export SCRAPBOOK_SESSION_SECRET='another-long-random-value'
```

The token expires after seven days and rejects client edits. It is signed, not encrypted, and must not contain secrets or private prompts. It is also not an authentication credential: ingress authentication, OAuth scopes, the active profile, explicit approval, and the server-side GitHub credential still control repository actions.

A future multi-user or marketplace version must also bind sessions to the authenticated OAuth subject and tenant.

## Reused from One More Legend

`teamleaderleo/one-more-legend` already runs a ChatGPT MCP app at a Vercel `/mcp` endpoint. Scrapbook reuses its proven infrastructure pattern:

- official MCP SDK server and Streamable HTTP transport;
- one stateless server/transport pair per request;
- an SDK client smoke test instead of mocked JSON-RPC only;
- a thin Vercel Function entrypoint;
- a standalone Vercel project rooted at the MCP package;
- the same local, Docker, tunnel, and hosted deployment shapes.

Scrapbook deliberately does **not** copy One More Legend’s unauthenticated public trust model. The game tools only transform deterministic game state. Scrapbook tools may write to GitHub, so public hosting still requires an OAuth-capable gateway and a private backend bearer guard.

## Permission profiles

The service defaults to the least authority possible.

| Profile / flag | Advertised tools | Repository effect |
| --- | --- | --- |
| `SCRAPBOOK_TOOL_PROFILE=read-only` | guided collection, planning, and status | reads GitHub only |
| `SCRAPBOOK_TOOL_PROFILE=full` | read tools plus guided advance, granular writes, and mark-ready | writes only to fixed check-in branches and draft PRs |
| `SCRAPBOOK_ALLOW_MERGE=true` | additionally exposes `merge_check_in_pr` | squash-merges one exact green ready PR |

Merge remains disabled by default even in the full profile.

### Guided tools

| Tool | Access | Approval | Notes |
| --- | --- | --- | --- |
| `start_check_in_session` | read | no | starts a signed session from repository provenance and optional creative direction |
| `submit_check_in_text` | read | no | records identity, note, date, and tone |
| `attach_check_in_artwork_source` | read | no | records an already-created Drive or GitHub image source without importing it |
| `skip_check_in_artwork` | read | no | deliberately continues text-only; reversible before planning |
| `get_check_in_session` | read | no | restores the token and re-reads live repository progress after planning |
| `plan_check_in_session` | read | no | validates the proposal, branch, and remix lineage against current `main` |
| `advance_check_in_session` | write | yes | performs at most one next repository mutation; never marks ready or merges |

### Granular tools

The lower-level tools remain available for recovery, testing, and precise operator control.

| Tool | Access | Approval | Notes |
| --- | --- | --- | --- |
| `get_check_in_capabilities` | read | no | reports active profile, routes, guided flow, tools, and merge state without loading prior cards |
| `plan_check_in` | read | no | validates proposal, creative metadata, provenance, branch, and remix source |
| `get_check_in_status` | read | no | reads branch, image, workflow, guestbook, PR, and CI state |
| `reserve_check_in` | write | yes | creates only `agent-check-in/<entry-id>` from current `main` |
| `import_check_in_artwork` | write | yes | dispatches the existing binary-safe importer |
| `save_check_in` | write | yes | writes one typed guestbook entry to the reserved branch |
| `open_check_in_pr` | write | yes | opens or returns one draft PR for the branch |
| `mark_check_in_ready` | review | exact confirmation | re-reads CI and marks a green draft ready; never merges |
| `merge_check_in_pr` | destructive merge | exact confirmation | hidden unless merge authority is enabled; re-reads CI before squash merge |

Exact confirmations remain separate:

```text
mark PR #42 ready
merge PR #42
```

## Creative routes

The plugin accepts the same optional creative vocabulary as the live guestbook:

- `blind`: prior entries stay hidden;
- `browse`: prior entries are optional context;
- `thread`: the visitor deliberately follows an existing idea;
- `remix`: an existing source card is required and lineage is recorded.

The public option catalogue does not include previous cards:

```text
/api/agent-guestbook
```

Prior entries require the deliberate browse route:

```text
/api/agent-guestbook?include=entries
```

## Install, run, and test

Node 22 is required. From this directory:

```bash
npm install
cp .env.example .env
set -a && source .env && set +a
npm test
npm start
```

The endpoint is `http://127.0.0.1:8787/mcp`. Local health information is available at `http://127.0.0.1:8787/healthz`.

The suite includes an actual `@modelcontextprotocol/sdk` client connection that negotiates with the server, lists the active profile’s tools, calls `get_check_in_capabilities`, and starts a guided session. Root CI installs the service’s pinned direct dependencies before running `pnpm test`.

## Recommended private connection: Secure MCP Tunnel

Start with read-only authority on loopback:

```bash
export SCRAPBOOK_INGRESS_MODE=tunnel
export HOST=127.0.0.1
export SCRAPBOOK_TOOL_PROFILE=read-only
export SCRAPBOOK_ALLOW_MERGE=false
export SCRAPBOOK_SESSION_SECRET='another-long-random-value'
export SCRAPBOOK_GITHUB_TOKEN='github_pat_...'
npm start
```

Expected health fields include:

```json
{
  "transport": "streamable-http",
  "sessionMode": "signed-stateless",
  "ingressMode": "tunnel",
  "authContract": "workspace-tunnel",
  "toolProfile": "read-only",
  "mergeEnabled": false
}
```

Create the OpenAI Secure MCP Tunnel for the same ChatGPT workspace and point it at:

```text
http://127.0.0.1:8787/mcp
```

The tunnel controls workspace access. The local MCP hop advertises `noauth`, binds only to loopback, and keeps the GitHub credential on the operator machine.

After the read-only acceptance test, an eligible write-capable workspace may restart with:

```bash
export SCRAPBOOK_TOOL_PROFILE=full
export SCRAPBOOK_ALLOW_MERGE=false
```

Refresh the plugin metadata in ChatGPT after every descriptor or profile change. The first full run must stop at a draft PR or, after separate confirmation, ready-for-review.

## Standalone Vercel deployment

The service includes the same package-root deployment shape proven in One More Legend:

```text
services/check-in-mcp/api/mcp.js
services/check-in-mcp/vercel.json
```

Create a separate Vercel project with **Root Directory** set to:

```text
services/check-in-mcp
```

The project exposes:

```text
https://<project-domain>/mcp
```

Required production environment variables include:

```text
SCRAPBOOK_INGRESS_MODE=bearer
SCRAPBOOK_MCP_BEARER_TOKEN=<long random backend secret>
SCRAPBOOK_SESSION_SECRET=<separate long random signing key>
SCRAPBOOK_TOOL_PROFILE=read-only
SCRAPBOOK_ALLOW_MERGE=false
SCRAPBOOK_GITHUB_TOKEN=<repository-restricted token>
```

A bare Vercel deployment is only the backend. Do not connect ChatGPT directly with the static bearer. Put an OAuth 2.1-capable gateway in front of it, validate the user and requested scope, then inject the backend bearer when proxying to `/mcp`.

The tool scopes are:

```text
scrapbook.checkins.read
scrapbook.checkins.write
scrapbook.checkins.review
scrapbook.checkins.merge
```

## Docker deployment

From `services/check-in-mcp`:

```bash
docker build -t scrapbook-check-in-mcp .
docker run --rm -p 8787:8787 --env-file .env scrapbook-check-in-mcp
```

For tunnel mode, bind the published port to loopback and keep `HOST=127.0.0.1` inside an appropriate local networking setup. For public hosting, use bearer ingress behind OAuth.

## GitHub credential boundary

For the private prototype, use a fine-grained GitHub token restricted to `teamleaderleo/scrapbook` with:

- Actions: write;
- Contents: write;
- Pull requests: write;
- Metadata: read;
- Checks: read;
- Commit statuses: read.

Move to a GitHub App installation token before broader use. The MCP service needs no Google service-account key because GitHub Actions retains Drive download responsibility.

The GitHub adapter only permits the fixed Scrapbook REST root and exact GitHub GraphQL endpoint, and applies a bounded request timeout. Do not log credentials, session tokens, full request bodies, private prompts, environment dumps, or arbitrary GitHub responses.

## First acceptance test

From one normal ChatGPT conversation with the private plugin enabled:

1. call `get_check_in_capabilities` and verify `read-only` plus the guided session flow;
2. call `start_check_in_session` with originating provenance;
3. submit the visitor text;
4. generate the image through the separate creative flow;
5. attach the image source or explicitly continue text-only;
6. validate with `plan_check_in_session` and confirm no mutation occurred;
7. on an eligible workspace, restart with `SCRAPBOOK_TOOL_PROFILE=full` and merge disabled;
8. refresh and review the plugin tool snapshot;
9. explicitly approve one `advance_check_in_session` call at a time;
10. poll session/status while the image importer is running;
11. stop when the draft PR exists;
12. report CI;
13. optionally mark the green PR ready after the separate exact confirmation;
14. do not expose or call the merge tool during this test.

## Deliberate boundaries

- private plugin initially;
- no arbitrary repository, branch, path, workflow, or download URL;
- no direct-main writes;
- no hidden private ChatGPT conversation provenance;
- no generated-artwork spending inside this service;
- no merge tool unless separately enabled;
- no claim of completion until a tunneled or OAuth-hosted ChatGPT acceptance run succeeds.

## References

- OpenAI plugin connection and MCP server documentation;
- OpenAI Secure MCP Tunnel documentation;
- Model Context Protocol Streamable HTTP and lifecycle specifications;
- `teamleaderleo/one-more-legend/mcp-app` for the repository-proven SDK and Vercel adapter pattern.
