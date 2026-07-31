# Bundle analysis

Scrapbook measures production bundles before changing imports, dependencies, or framework optimization flags.

## Generate reports

Install the locked dependencies, then run:

```bash
pnpm analyze
```

The command performs a production build with the already-installed Next bundle analyzer enabled. The analyzer emits inspectable reports beneath `.next/analyze/`. A normal `pnpm build` does not enable the analyzer.

Do not commit generated `.next` output.

## Keep comparisons controlled

Compare a baseline and candidate built from the same parent commit with the same:

- Node major version;
- `pnpm-lock.yaml`;
- environment-variable shape;
- production build command;
- analyzer version;
- machine or CI runner class where timing is part of the claim.

Record the exact commit, command, route, report, and measurement date. Build timing from unlike machines is orientation, not evidence of an optimization.

## Read route ownership, not only totals

For each representative route, record:

```text
initial client JavaScript
shared client chunks
route-only client chunks
large package owners
duplicate package copies
unexpected client-side server dependencies
dynamically isolated editors, simulations, and labs
```

Prioritize ordinary routes such as the homepage, blog, timezone tool, and gallery before optional laboratory or editor surfaces.

Large packages are not automatically defects. Monaco, Shiki, Tiptap, Three.js, React Three Fiber, Framer Motion, Markdown renderers, icon packages, AWS clients, database clients, and agent SDKs should be judged by whether they are present on routes that need them.

## Candidate discipline

Prefer, in order:

1. remove accidental client imports of server-only code;
2. isolate optional route or component surfaces;
3. remove duplicate or dead dependencies;
4. narrow imports when current tooling does not already tree-shake them;
5. replace a utility library only after a retained route-level benefit is measured;
6. add experimental framework flags only for a documented need with a rollback.

Every retained optimization should report:

- baseline and candidate commit;
- affected routes and chunks;
- byte and build-time deltas;
- functional and browser validation;
- measurement noise;
- compatibility cost;
- revert path.

Retain negative results. A plausible change that produces no material route-level improvement is useful evidence against unnecessary churn.

Issue #218 owns the current measurement and optimization backlog.