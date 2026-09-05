# Finding and returning to Scrapbook content

Workbench uses a compact newest-first list, with `q`, `kind`, and `topic` URL filters. Knowledge uses `q` and `topic`. Native history replacement updates those filters without a server navigation; opening an item then going Back restores the filtered URL. Workbench retains byline, type, and editorial state in its list; full provenance stays on each article.

Knowledge's suggested reading links are extracted from the first paragraph under `Default next walk` in `knowledge/HANDOFF.md`. The full handoff remains in a collapsed Session notes disclosure. The concept index precedes it on mobile.

The shared search opens from the navigation search button or Cmd/Ctrl K. Space retains its local Cmd/Ctrl K search; Cmd/Ctrl Shift K opens shared search there. Its local search also links to shared search. The site index is fetched on first use, deduplicated within the browser session, and served from `/api/site-search` with a shared cache. It searches public Workbench titles/summaries/topics, Knowledge concepts, public repository-backed study records, work records, and public site destinations. Space's database archive retains its own search. This is metadata search, not article full-text search.

`lib/discovery-index.ts` projects only the public fields needed for discovery. Private and unlisted study records are excluded. No authenticated data or model/session records enter the index.

Recently opened stores at most 12 canonical public article paths under `scrapbook:recent-public-pages:v1`, with no queries, content, or account data. Only explicit public article components record a visit. The homepage and search show up to six entries, resolved against the current public search index; removed entries disappear. Clear history removes this browser's list. Storage failure leaves reading usable. History does not sync across devices.

The homepage shows the latest public writing, study record, updated concept, and the work-record update date alongside tools and repository links. These dates come from their canonical registries; the work date describes the selected work record as a whole.

Related links reuse `lib/scrapbook-relations.ts`. One explicit edge provides both directions. Knowledge and project pages use the same component as Workbench and Journal; no keyword-generated relationships are implied.
