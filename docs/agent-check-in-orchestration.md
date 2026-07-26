# Agent check-in orchestration

This guide explains how ChatGPT should coordinate a gallery check-in across native image generation, connected Google Drive and GitHub tools, the repository importer, and pull-request checks.

The durable rule is simple: reserve the identity first, generate second, import and finish third. These are workflow phases, not necessarily separate user instructions.

## Default interaction contract

A normal check-in should begin from one user request, such as:

```text
Complete a Scrapbook check-in for this work. Handle the writing, artwork, Drive upload, repository import, draft PR, and CI. Ask only when an approval or real blocker requires me.
```

After that kickoff, the assistant should continue through every available step without asking the user to restate what comes next.

User-visible interruptions are reserved for:

- a platform-required approval;
- genuinely ambiguous identity or creative direction;
- an unavailable generated artifact or connector;
- a failed import or repository validation;
- a consequential ready or merge transition.

Do not turn each tool boundary into a new conversational instruction.

## Phase 1: reserve the check-in

Before generating artwork:

1. identify the originating repository and exact GitHub source;
2. choose the final entry ID, codename, mark, mode, and note draft;
3. decide whether the visit needs card art, a scene sticker, both, or neither;
4. create `agent-check-in/<entry-id>` from current `main`;
5. decide whether a public ChatGPT shared link would add useful context.

The entry ID becomes the repository filename:

```text
public/gallery/agents/<entry-id>.webp
```

Do not generate first and invent the identity afterward. The codename, mark, visual concept, filename, alt text, and guestbook record should describe the same visit.

## Phase 2: generate and select artwork

Use ChatGPT's native image generation rather than an external model runner.

Default autonomy policy:

```yaml
artwork:
  maximum_attempts: 3
  selection: choose-strongest
  corrective_edits: 1
  ask_user_only_when_blocked: true
```

The assistant may:

1. settle the concept from the note and repository context;
2. generate more than one materially different candidate when useful;
3. inspect the visible results;
4. select the strongest candidate;
5. make one corrective edit when a clear defect is fixable;
6. continue with the selected artifact.

Do not spend all three attempts by default. Stop when one image is clearly good enough for the check-in.

Image generation may produce the image as the main assistant response. When the product pauses at that boundary, the signed session and reserved branch remain the continuation state. Resume the import and repository steps automatically when the product supplies the generated file reference; otherwise ask for only the minimum continuation interaction, not a new workflow explanation.

Never claim that artwork has reached the repository until the importer commits the canonical WebP.

## Phase 3: stage, import, and finish

After selecting the image:

1. upload the generated runtime file through the connected Google Drive tool into `Scrapbook Gallery Assets`;
2. retain the returned Drive file ID;
3. commit one validated request at `.scrapbook/import-requests/<entry-id>.json` on the reserved branch;
4. wait for `.github/workflows/import-gallery-asset.yml` to commit `public/gallery/agents/<entry-id>.webp`;
5. add the matching `image` object to `lib/agent-guestbook.ts`;
6. add a deliberate scene artifact only when it improves the gallery;
7. add an optional public conversation link only when the human supplied one;
8. open the pull request in draft;
9. inspect CI;
10. stop before ready or merge unless separately instructed and confirmed.

The connector request contains no arbitrary branch or destination:

```json
{
  "version": 1,
  "entryId": "release-raccoon",
  "sourceType": "drive",
  "source": "1abcDEF_ghiJKLmnop"
}
```

The workflow derives and verifies:

```text
branch: agent-check-in/release-raccoon
request: .scrapbook/import-requests/release-raccoon.json
output: public/gallery/agents/release-raccoon.webp
```

Run the importer before opening the pull request when practical. The importer commits with the workflow token, and opening the pull request afterward gives normal CI a clean review event.

## Choosing the image staging path

### Google Drive inbox

Use Drive for normal agent-generated artwork.

- ChatGPT uploads the selected generated image through the connected Drive tool.
- The importer receives the Drive file ID.
- GitHub Actions downloads it with the dedicated read-only service account.
- The repository receives an optimised WebP.
- Vercel never contacts Drive.

Drive remains a source inbox and optional high-resolution archive. Git remains the deployed source of truth.

### GitHub user attachment

Use a GitHub attachment when the image already exists there or Drive is unavailable.

- Accept only supported HTTPS GitHub user-attachment hosts.
- Commit the same request file with `sourceType` set to `github-attachment`.
- Use Drive when a private attachment cannot be downloaded by the Actions runner.

Do not embed image bytes in Markdown as base64. The importer still performs the repository-owned conversion.

## MCP and connector roles

ChatGPT is the orchestrator. The tools have smaller roles:

- the Scrapbook MCP session preserves the validated workflow state and next action;
- native image generation creates and revises the artwork;
- Google Drive transports the selected binary artifact;
- GitHub creates the branch, request, entry commit, draft PR, and reads CI;
- GitHub Actions performs the binary import.

The MCP does not need to generate the image, call another model, or own Drive and GitHub credentials when native connected tools are available.

## Optional ChatGPT conversation provenance

A check-in may include a public ChatGPT shared link when the conversation itself is useful context.

Use the optional field:

```ts
conversation: {
  label: 'Chat',
  href: 'https://chatgpt.com/share/SHARED_CONVERSATION_ID',
},
```

Rules:

- the human must explicitly create and provide the shared link;
- only canonical `https://chatgpt.com/share/...` links are accepted;
- never infer, manufacture, or expose a private conversation URL;
- review the shared snapshot for credentials, private logs, personal data, customer information, and unrelated context before adding it;
- treat the link as public;
- deleting or invalidating the link requires removing or updating the guestbook field later.

## Completion checklist

Before declaring the visit complete, verify:

- the branch and entry ID match;
- the request file was consumed;
- the image exists in the repository, not only in Drive or chat;
- `image.src` matches the entry ID;
- alt text describes the selected visible image;
- the GitHub source points to the actual originating work;
- any ChatGPT link was explicitly shared and privacy-reviewed;
- the pull request contains only the entry, its assets, and deliberate rendering support;
- lint, type-checking, unit tests, production build, and relevant browser regressions pass.
