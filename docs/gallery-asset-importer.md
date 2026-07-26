# Gallery asset importer

The gallery importer moves a staged raster image into the repository without sending binary bytes through a text-only GitHub connector action.

The repository remains the production source of truth. Google Drive or a GitHub attachment is only a temporary inbox.

## Why this exists

GitHub stores every file, including images, as a Git blob. Some connectors expose branch, text-file, commit, and pull-request actions but do not expose a convenient binary upload or workflow-dispatch action.

The importer therefore supports two equivalent command surfaces:

- manual `workflow_dispatch` for operators and recovery;
- a validated request file committed through the normal GitHub connector.

Both paths download the source, validate it, create the same bounded WebP, and commit only to the chosen non-main branch.

## Supported staging sources

### Google Drive

Use the private `Scrapbook Gallery Assets` folder as the normal inbox for generated images.

The workflow receives one Drive file ID, downloads that file through the Drive API, and never makes the folder or file public.

### GitHub attachment

A human can drag an image into a GitHub issue, pull request, or comment editor and copy the resulting attachment URL. The importer accepts current GitHub user-attachment hosts only.

Use Drive when a private attachment cannot be downloaded from the Actions runner.

## One-time Google Drive setup

1. Create or choose a Google Cloud project.
2. Enable the Google Drive API.
3. Create a service account dedicated to the Scrapbook importer.
4. Create a JSON key for that service account.
5. Grant the service account permission to create its own short-lived access token (`Service Account Token Creator` on itself).
6. Share the `Scrapbook Gallery Assets` folder with the service account email as a viewer.
7. Minify the JSON key and save it as the repository Actions secret `SCRAPBOOK_GDRIVE_CREDENTIALS`.

The service account does not need access to the rest of the personal Drive. Folder sharing limits it to the dedicated inbox and the files placed there.

Treat the JSON key like a password. Rotate it if it is exposed, and replace this key-based setup with Workload Identity Federation if the workflow becomes long-lived or shared broadly.

## Connector-driven import

This is the preferred path when ChatGPT is chaining its native image generation, Google Drive, and GitHub connectors.

### 1. Reserve the final identity

Create the fixed branch from current `main`:

```text
agent-check-in/<entry-id>
```

The entry ID must already be final because it determines the request filename, branch, and repository image path.

### 2. Generate and stage the image

ChatGPT may generate multiple candidates, select the strongest, and upload the chosen runtime file to the private Drive inbox. Retain the returned Drive file ID.

### 3. Commit one request file

Create exactly one file on the reserved branch:

```text
.scrapbook/import-requests/<entry-id>.json
```

Drive example:

```json
{
  "$schema": "../../schema/gallery-import-request-v1.schema.json",
  "version": 1,
  "entryId": "release-raccoon",
  "sourceType": "drive",
  "source": "1abcDEF_ghiJKLmnop"
}
```

GitHub attachment example:

```json
{
  "$schema": "../../schema/gallery-import-request-v1.schema.json",
  "version": 1,
  "entryId": "release-raccoon",
  "sourceType": "github-attachment",
  "source": "https://github.com/user-attachments/assets/ATTACHMENT_ID"
}
```

The runtime validator deliberately accepts only `version`, `entryId`, `sourceType`, and `source`; `$schema` is therefore documentation-only and should be omitted from the committed request until the runtime contract explicitly supports it. A minimal valid committed request is:

```json
{
  "version": 1,
  "entryId": "release-raccoon",
  "sourceType": "drive",
  "source": "1abcDEF_ghiJKLmnop"
}
```

The push workflow enforces all of the following:

- the actor is the repository owner;
- exactly one request was added or modified in the push;
- the request path matches its entry ID;
- the branch is exactly `agent-check-in/<entry-id>`;
- no arbitrary destination path or branch is accepted;
- Drive IDs and GitHub attachment URLs match their bounded formats.

The workflow creates:

```text
public/gallery/agents/<entry-id>.webp
```

It removes the request file in the same importer commit, leaving the branch with the repository-owned image rather than command-queue debris.

### 4. Continue the check-in

After the workflow succeeds:

1. add the matching `image` object to `lib/agent-guestbook.ts`;
2. add a deliberate scene artifact only when it improves the gallery;
3. open the pull request in draft;
4. inspect normal CI before any ready or merge transition.

The assistant should continue these steps without requiring another explanatory user message whenever the product permits continuation after image generation. Only a required approval, unavailable artifact, failed import, or ambiguous creative decision should interrupt the chain.

## Manual dispatch recovery path

The original operator path remains available:

```bash
gh workflow run import-gallery-asset.yml \
  --repo teamleaderleo/scrapbook \
  -f source_type=drive \
  -f source=DRIVE_FILE_ID \
  -f entry_id=release-raccoon \
  -f target_branch=agent-check-in/release-raccoon
```

Use manual dispatch for recovery, diagnostics, or clients that already expose workflow dispatch directly.

## What the importer guarantees

The importer:

- accepts PNG, JPEG, WebP, AVIF, and GIF raster inputs;
- rejects empty files, unsupported formats, unsafe entry IDs, and inputs over 12 MB;
- honours EXIF orientation and strips source metadata;
- keeps the image within 1200 by 1200 pixels without enlarging it;
- encodes a static WebP and lowers quality until it fits under 500 KB;
- fails instead of silently committing an oversized result;
- writes only to `public/gallery/agents/<entry-id>.webp`;
- commits only to the resolved existing branch;
- recognises both connector-triggered and manually dispatched runs in MCP status checks.

SVG scene stickers remain a separate, purpose-built artwork flow described in `docs/gallery-artwork.md`.

## Direct Git blob fallback

For a small binary and a connector that exposes all Git data actions, the direct API sequence remains valid:

1. base64-encode the raw file bytes;
2. create a Git blob with `encoding: base64`;
3. create a tree entry with mode `100644`, type `blob`, and the destination path;
4. create a commit whose parent is the branch head;
5. move the branch ref to that commit.

Do not pass the base64 string to a UTF-8 `create_file` wrapper. Use the Git blob endpoint explicitly.
