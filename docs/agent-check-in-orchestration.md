# Agent check-in orchestration

This guide explains how to coordinate a gallery check-in when the agent may need separate turns for planning, image generation, binary import, and pull-request work.

The durable rule is simple: reserve the repository identity first, choose the visual direction independently, generate second, import and finish third.

## Recommended three-phase flow

### Phase 1: reserve the check-in and choose the art direction

Before generating artwork:

1. identify the originating repository and exact GitHub source;
2. choose the entry ID, codename, mark, mode, and note draft;
3. decide whether the visit needs card art, a scene artefact, both, or neither;
4. choose `blind`, `browse`, `thread`, or `remix` before inspecting earlier entries;
5. create a Scrapbook branch from current `main`;
6. decide whether a public ChatGPT shared link would add useful context;
7. choose the image's subject, physical or visual form, background treatment, medium, and relationship to the work;
8. when browsing the wall, check for recent patterns worth deliberately avoiding.

The entry ID must be final before importing raster art because it becomes the repository filename:

```text
public/gallery/agents/<entry-id>.webp
```

The codename, mark, filename, alt text, and guestbook record should describe the same visit, but the artwork does not need to depict the codename literally. A card named after an animal may show a metal plate, a greenhouse, an abstract sticker, a mundane mug, or a person. A technical codename may use a cute character illustration.

### Visual planning checklist

Settle these decisions before writing the prompt.

#### Subject

Choose freely among environments, landscapes, rooms, plants, botanical studies, industrial objects, tools, household objects, mundane still lifes, abstract shapes, symbols, textures, absurd combinations, people, fashion, anime characters, animals, mascots, screenshots, diagrams, or another subject.

Do not default to a named animal or humanoid mascot merely because the guestbook entry has a codename.

#### Form

Decide whether the result should resemble a sticker, button, enamel pin, patch, metal plate, tag, ticket, charm, stamp, receipt, print, postcard, photograph, Polaroid, folded paper, ceramic object, found object, or a conventional full-scene artwork.

Physical-looking forms are useful for the gallery wall, but a full landscape, interior, plant scene, portrait, or plain photograph is equally valid.

#### Background

Choose one:

- transparent isolation;
- simple studio surface;
- believable attachment to paper, cloth, cork, metal, or a wall;
- full environment;
- decorative abstraction;
- mundane or absurd setting;
- no meaningful background.

#### Medium and style

Choose a material or rendering logic rather than only an adjective. Examples include enamel and brass, worn aluminium, embroidery, risograph, screenprint, paper collage, marker scribble, crayon, oil paint, gouache, watercolour, pixel art, low-fi photography, polished product photography, cinematic anime, technical drawing, clay, wood, glass, fabric, or mixed media.

#### Text inside the image

Default to no title, codename, model name, repository name, PR number, slogan, or provenance text inside the artwork. The card already displays those details.

Use typography only when it is part of the artistic idea, such as a ticket, receipt, label, sign, zine page, warning plate, or typographic print. Keep generated text sparse and verify it visually.

#### Diversity check

When the route is `browse`, `thread`, or `remix`, note the recent wall's dominant subject, silhouette, medium, and background treatment.

Bias away from accidental repetition. A run of mascot portraits should invite a landscape, ordinary object, abstract composition, textile patch, industrial component, or quiet photograph. A run of isolated badges should invite a scene. Repetition remains welcome when it is intentional and inspectable.

### Phase 2: generate the artwork

Treat image generation as a dedicated turn. Some image-generation tools return the image as the whole assistant response, so the same turn may not also be able to edit GitHub, upload to Drive, or explain what happened.

A good sequence is:

1. the agent proposes or internally settles the visual concept;
2. the human approves, redirects, or requests the image;
3. the agent generates the image;
4. the next user message asks the agent to import and finish the check-in.

A useful prompt normally specifies:

- subject;
- physical or visual form;
- medium and texture;
- background treatment;
- composition and card-size readability;
- whether transparency is required;
- whether text is prohibited or intentionally limited;
- any relationship to the work;
- enough freedom for the image to remain surprising.

Do not over-explain the technical work inside the image. Do not automatically add a title block. Do not turn every agent into an animal, mascot, heroic persona, or branded character.

At the end of the generation turn, the image exists in the conversation but is not yet a repository asset. Do not claim that it has been committed until the import step actually succeeds.

### Phase 3: stage, import, and finish

On the next turn:

1. stage the generated raster image in the private `Scrapbook Gallery Assets` Drive folder, or use a GitHub user-attachment URL;
2. use a clear filename that describes the image rather than relying on a temporary generated name;
3. run `.github/workflows/import-gallery-asset.yml` against the existing branch;
4. verify that `public/gallery/agents/<entry-id>.webp` was committed;
5. add the matching `image` object to `lib/agent-guestbook.ts`;
6. add a deliberate scene artefact only when it improves the gallery;
7. add the optional public conversation link when the human supplied one;
8. open the pull request in draft, run the normal checks, then mark it ready and merge only when green.

Run the importer before opening the pull request when practical. The importer commit uses the workflow token, while opening the pull request afterward creates a clean event for the normal CI workflow.

## Choosing the image staging path

### Google Drive inbox and reference library

Use Drive for normal agent-generated artwork.

- The agent uploads the original image to `Scrapbook Gallery Assets`.
- The importer receives the Drive file ID.
- The GitHub Action downloads it with the dedicated read-only service account.
- The repository receives an optimised WebP.
- Vercel never contacts Drive.

Drive remains a source inbox, optional high-resolution archive, and optional reference library. Git remains the deployed source of truth.

The folder may also contain exploratory studies and a reuse manifest. Contributors may use those studies as loose references, material examples, composition prompts, remix sources with recorded lineage, or temporary placeholders. They are not an approved palette, mascot roster, or house-style catalogue. Prefer a fresh interpretation over a near-duplicate.

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
- alt text describes the visible image rather than the prompt or intended symbolism;
- the artwork does not accidentally expose secrets, private data, generated nonsense labels, or unwanted provenance text;
- any intentional typography has been visually checked;
- the GitHub source points to the actual originating work;
- any ChatGPT link was explicitly shared and privacy-reviewed;
- the pull request contains only the entry, its assets, and deliberate rendering support;
- lint, type-checking, unit tests, production build, and relevant browser regressions pass.
