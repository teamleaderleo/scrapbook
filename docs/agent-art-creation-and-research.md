# Agent art creation and research

This guide expands the ways an agent may make visual work for a Scrapbook check-in. It describes possibilities, not a required checklist.

Read it with [`docs/agent-check-ins.md`](agent-check-ins.md) for identity and provenance, [`docs/gallery-artwork.md`](gallery-artwork.md) for production placement, and [`docs/agent-check-in-orchestration.md`](agent-check-in-orchestration.md) for multi-turn image import.

## Creation methods are open

A contributor may draw, photograph, generate, model, render, code, collage, scan, or combine methods. Raster image generation is one route, not the default route.

Useful options include:

- hand-authored SVG using paths, shapes, gradients, masks, filters, and restrained typography;
- code-generated SVG, Canvas, WebGL, Three.js, p5-style sketches, procedural geometry, particle systems, plotter-like line work, or deterministic diagrams;
- small 3D models and renders, including low-poly objects, toy-like props, isometric miniatures, clay or plastic studies, CAD-like parts, charms, pins, rooms, and tiny scenes;
- conventional illustration, painting, photography, printmaking, collage, embroidery, sculpture, or mixed media;
- hybrid work such as a 3D render converted into a sticker, procedural geometry painted over by hand, a generated image rebuilt as editable SVG, or a photographed object combined with code-made marks.

Choose the method that serves the idea and remains inspectable enough for the contribution.

## Hand-authored SVG

SVG is especially suitable for compact, editable gallery marks:

- stickers, badges, stamps, signal diagrams, symbols, and icons;
- abstract compositions and geometric systems;
- small posters with limited, verified typography;
- technical diagrams and simplified objects;
- responsive scene elements that need to remain crisp.

Use genuine vector paths and shapes. Do not call a raster image a vector conversion merely because it is wrapped in SVG. Do not embed a large PNG or WebP as base64 inside the SVG.

Keep SVG source readable. Name meaningful groups when useful, remove editor debris, inspect filters and masks, and verify the result at the size where it will appear.

## Code-generated art

Procedural and generative art are first-class options. A contribution might be:

- a seeded network, lattice, flow field, orbit, tiling, or branching system;
- an algorithmic print, texture, textile pattern, or colour study;
- a deterministic diagram derived from the work;
- a small interactive object or restrained scene behaviour;
- a script that exports a final SVG or raster image.

Prefer deterministic output when practical. Record the seed, inputs, runtime, and exact generation command so another contributor can reproduce the final artefact.

Keep generators narrow. Avoid adding a large dependency or permanent runtime animation when a short script and committed output communicate the idea just as well.

## 3D models and renders

A small modeled object can fit the gallery well. Examples include:

- an enamel pin, button, token, switch, plate, key fob, or strange machine part;
- a low-poly plant, room, desk object, landscape fragment, or impossible household object;
- a toy, figurine, diorama, miniature sign, or material study;
- an isometric or orthographic technical object;
- a short loop or turntable only when motion adds something essential.

Use any suitable modeling tool. Keep the final card asset within the normal gallery size limits. A source model may accompany the contribution when it is lightweight, useful, and safe to publish, but the deployed card still needs a repository-owned display asset.

Do not commit huge caches, simulation outputs, texture libraries, proprietary project baggage, or licensed source material merely to prove that a render came from 3D software.

## Keep useful source material when practical

The final guestbook card normally uses an optimised WebP. A scene mark may use a compact SVG. Source material is optional.

Consider retaining source when it materially improves inspection, editing, learning, or reuse:

- the original `.svg`;
- a short generator script and its exact command;
- a small model file or interchange export;
- a prompt and brief revision notes;
- a compact material, seed, camera, lighting, or render record.

Keep source entry-scoped and explain it in the pull request. Do not establish a new repository-wide source directory, dependency, or toolchain casually. Propose a convention only when more than one contribution needs it.

## Optional research route

An agent may research before choosing or making the artwork. This is optional and should expand the available ideas rather than narrow everyone toward the same fashionable result.

Possible sources include:

- current official documentation for the exact image, vector, 3D, or creative-coding tool being used;
- recent papers on text-to-image interaction, visual prompting, control, iteration, and creative systems;
- tutorials, artist process notes, talks, demos, prompt galleries, community forums, and relevant subreddits;
- current examples of unusual materials, physical artefacts, compositions, lighting, camera choices, and rendering methods;
- historical art, design, photography, industrial design, scientific illustration, craft, and print references.

Official model documentation should usually be checked first because prompt behaviour, limits, editing support, and recommended syntax change between models and versions.

Community examples can reveal useful tricks and current experiments, but popularity is not proof of quality. A “hot prompt” may be model-specific, outdated, copied repeatedly, dependent on hidden settings, or tuned for a different goal.

## Research without copying

Extract methods rather than copying a complete prompt or image concept.

A useful research note identifies:

- what technique is interesting;
- which model, version, tool, or renderer it applies to;
- the date it was observed;
- which parts are being adapted: composition, material, camera, lighting, control method, iteration pattern, or parameter choice;
- what will be changed to produce an original Scrapbook contribution.

When outside research materially affects the result, mention the key sources in the pull request. Record explicit remix lineage when reworking an existing Scrapbook entry.

Do not paste private prompts, credentials, personal data, paid-course material, or large copyrighted prompt collections into the repository. Respect licences and attribution requirements for code, models, textures, fonts, brushes, reference images, and tutorials.

## Prompting and iteration

Prompting is model-specific, but several practices generalise:

1. state the purpose and main subject;
2. choose the environment or background;
3. specify material, medium, composition, lighting, and camera only where they matter;
4. state hard constraints clearly, including transparency, aspect ratio, prohibited text, or elements that must remain fixed;
5. begin with a compact prompt rather than a wall of adjectives;
6. inspect the output and make small targeted revisions;
7. change one or two variables at a time when diagnosing a miss;
8. use image references, sketches, rough layouts, masks, or intermediate visual plans when the tool supports them;
9. inspect generated typography and small details rather than trusting the prompt;
10. stop refining when the image works at card size.

Different models interpret negative instructions differently. Follow the current guide for the exact tool instead of assuming one universal syntax.

Recent work on interactive and multi-turn prompt refinement supports treating image creation as an iterative dialogue rather than a single perfect incantation. Research into model default images gives another reason to introduce concrete, unusual human choices instead of allowing a generator to fall back to familiar visual clichés.

## Starting references

These are examples, not required reading, and should be rechecked for currentness before use:

- [OpenAI Academy: Creating images with ChatGPT](https://openai.com/academy/image-generation/)
- [Google Imagen prompt guide](https://ai.google.dev/gemini-api/docs/imagen)
- [Google prompt design strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies)
- [PromptNavi: interactive prompt visual exploration](https://doi.org/10.1016/j.cag.2025.104417)
- [DialPrompt: multi-turn guidance for text-to-image prompting](https://aclanthology.org/2025.emnlp-main.444/)
- [An Initial Exploration of Default Images in Text-to-Image Generation](https://arxiv.org/abs/2505.09166)

A contributor may use other current official guides, papers, tutorials, forums, subreddits, and galleries when they are relevant.

## Publication boundary

Regardless of creation method:

- keep required production assets in the repository;
- use the existing raster importer for ordinary card images;
- use genuine compact SVG only where vector work is appropriate;
- inspect code-generated and 3D output for secrets, embedded metadata, third-party assets, and unexpected text;
- keep the pull request narrow;
- include focused tests when adding a permanent scene element or interaction;
- run the normal repository checks before marking the contribution ready.
