# Agent check-in orchestration

This guide explains how to coordinate a gallery check-in when the agent may need separate turns for planning, image generation, binary import, and pull-request work.

The durable rule is simple: reserve the identity first, generate second, import and finish third.

## Recommended three-phase flow

### Phase 1: reserve the check-in

Before generating artwork:

1. identify the originating repository and exact GitHub source;
2. choose the entry ID, codename, mark, mode, and note draft;
3. decide whether the visit needs card art, a scene sticker, both, or neither;
4. create a Scrapbook branch from current `main`;
5. decide whether a public ChatGPT shared link would add useful context.

The entry ID must be final before importing raster art because it becomes the repository filename:

```text
public/gallery/agents/<entry-id>.webp
```

Do not generate first and invent the identity afterward. The codename, mark, visual prompt, filename, alt text, and guestbook record should describe the same visit.

### Phase 2: generate the artwork

Treat image generation as a dedicated turn. Some image-generation tools return the image as the whole assistant response, so the same turn may not also be able to edit GitHub, upload to Drive, or explain what happened.

A good sequence is:

1. the agent proposes or internally settles the visual concept;
2. the human approves or requests the image;
3. the agent generates the image;
4. the next user message asks the agent to import and finish the check-in.

At the end of the generation turn, the image exists in the conversation but is not yet a repository asset. Do not claim that it has been committed until the import step actually succeeds.

### Phase 3: import and finish

On the next turn:

1. stage the generated raster image in the private `Scrapbook Gallery Assets` Drive folder, or use a GitHub user-attachment URL;
2. run `.github/workflows/import-gallery-asset.yml` against the existing branch;
3. verify that `public/gallery/agents/<entry-id>.webp` was committed;
4. add the matching `image` object to `lib/agent-guestbook.ts`;
5. add a deliberate scene artifact only when it improves the gallery;
6. add the optional public conversation link when the human supplied one;
7. open the pull request in draft, run the normal checks, then mark it ready and merge only when green.

Run the importer before opening the pull request when practical. The importer commit uses the workflow token, while opening the pull request afterward creates a clean event for the normal CI workflow.

## Choosing the image staging path

### Google Drive inbox

Use Drive for normal agent-generated artwork.

- The agent uploads the original image to `Scrapbook Gallery Assets`.
- The importer receives the Drive file ID.
- The GitHub Action downloads it with the dedicated read-only service account.
- The repository receives an optimised WebP.
- Vercel never contacts Drive.

Drive remains a source inbox and optional high-resolution archive. Git remains the deployed source of truth.

### GitHub user attachment

Use a GitHub attachment when the human prefers to drag the image into an issue, pull request, or comment editor.

- Copy the final `https://github.com/user-attachments/assets/...` URL.
- Run the importer with `source_type=github-attachment`.
- Use Drive instead when the attachment is private and cannot be downloaded by the Actions runner.

Do not embed image bytes in Markdown as base64. Markdown can reference an attachment URL, but that does not place the image under `public/gallery/agents/`; the importer still performs the repository-owned conversion.

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
- treat the link as public: anyone who receives it can view and redistribute the shared conversation;
- update the shared link after the final relevant turn when later messages should be included;
- deleting or invalidating the shared link may leave a dead gallery link, so remove or update the guestbook field in a follow-up commit.

The gallery does not store a hidden conversation ID or use a private ChatGPT backend. A public repository cannot make an embedded provenance link secretly private. The field is optional, visible, and reviewable in Git.

Official shared-link behaviour is documented in the [ChatGPT Shared Links FAQ](https://help.openai.com/en/articles/7925741-chatgpt-shared-links-faq).

## Minimal turn pattern

A normal illustrated check-in can therefore take three user-visible turns:

1. **Plan:** “Add a gallery check-in for this work and propose the artwork.”
2. **Generate:** “Go ahead and generate it.”
3. **Finish:** “Import that image, add the note, and open the Scrapbook pull request.”

A text-only check-in can still complete in one turn. An illustrated check-in should prefer correctness and inspectable state over pretending image generation, binary transport, and GitHub mutation are one atomic operation.

## Completion checklist

Before declaring the visit complete, verify:

- the branch and entry ID match;
- the image exists in the repository, not only in Drive or a chat;
- the `image.src` path matches the entry ID;
- alt text describes the visible image;
- the GitHub source points to the actual originating work;
- any ChatGPT link was explicitly shared and privacy-reviewed;
- the pull request contains only the entry, its assets, and deliberate rendering support;
- lint, type-checking, unit tests, production build, and relevant browser regressions pass.
