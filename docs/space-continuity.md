# Space continuity contracts

Space should feel immediate on ordinary return navigation without making browser storage a second database. The continuity layer separates public data reuse, browser fallback, and ephemeral presentation state while leaving private review state request-bound.

## 1. Canonical browse URL state

`lib/space-browse-state.ts` owns the stable serialization for ordinary list/reader state:

- `lane`;
- `tags`;
- `item`.

The parameter order is always `lane`, `tags`, `item`. Empty values disappear. The same serialization produces the per-view `viewKey` used by ephemeral history restoration. Shared review and reading-sheet route helpers consume this serializer; remaining component-local URL assembly should migrate onto it rather than inventing another ordering convention.

Reading-sheet and Trail-specific parameters remain outside this first codec until their current route helpers are migrated deliberately. Keep `from`, `return`, `practice`, and `stage` in their existing owner until one complete migration is ready.

## 2. Shared anonymous first-page cache

`app/space/public-data.ts` owns the reusable server-side public first page. It is deliberately separate from request identity and review rows.

Rules:

- use a request-independent anonymous Supabase client with no cookie/session storage;
- rely on the repository RLS policy that gives `anon` and `authenticated` the same public item projection while excluding `visibility:private` rows;
- cache only the first 100 public item rows selected by `SPACE_ITEM_SELECT`;
- use Next Cache Components with a 60-second stale/revalidate window and 24-hour hard expiry;
- tag the entry as `space-public-items`;
- keep the eight-second upstream timeout and abort boundary;
- start the public page request independently of the request-bound identity lookup;
- query private owner review rows only after identity resolves and outside the shared cache;
- invalidate `space-public-items` after successful item add/edit writes;
- leave review/enrollment actions out of the public cache invalidation path.

The shared cache reduces repeated public database work on warm route navigation without putting cookies, owner identity, or review schedules into a cross-request cache. A cached public page remains subject to the same public RLS projection as a live anonymous read.

## 3. Bounded public browser snapshot

`lib/space-public-snapshot.ts` and `lib/space-public-snapshot-storage.ts` define the only browser-persistent archive fallback.

Rules:

- versioned key: `scrapbook:space-public-snapshot:v1`;
- explicit public field allowlists at snapshot, item, and version boundaries;
- maximum 100 items, matching the current first public page;
- maximum serialized size 2 MiB UTF-8 before parse/write;
- maximum age 24 hours;
- tolerate at most five minutes of forward clock skew;
- exclude `review`, `userId`, and future non-allowlisted fields from serialization;
- reject unknown/private stored fields rather than inheriting future `Item` fields automatically;
- restore cached public items with private fields absent;
- treat localStorage read/write/quota/security failures as ordinary cache misses;
- remove invalid, stale, or over-budget payloads when storage permits.

### Runtime admission sequence

`ItemsProvider` uses the snapshot as a stale-readable outage fallback:

1. Start with the server-provided public items, which may themselves come from the shared anonymous server cache.
2. A successful non-empty first page wins and refreshes the bounded browser snapshot.
3. A successful live empty archive clears any older snapshot so removed material cannot reappear during a later outage.
4. If the server explicitly failed and supplied zero usable public items, admit a valid recent browser snapshot after hydration.
5. Revalidate an admitted snapshot immediately through the existing `reload()` path.
6. A successful revalidation replaces the cache-backed list and refreshes the snapshot; a refresh failure preserves the visible list and bounded error UI.
7. Private/admin review rows continue through their authenticated path and never enter browser storage.

Do not merge cached browser items with a partial server response. Either the server supplied a usable current public page or the browser snapshot is a temporary fallback.

## 4. Same-entry list UI history

`lib/space-history-ui.ts` owns ephemeral Back/Forward state that cannot be reconstructed from the URL. Version 2 stores:

- the current 20-item list page;
- scroll position;
- expanded row IDs.

Rules:

- namespace under `__scrapbookSpaceUi` while preserving Next/router-owned history fields;
- bind every snapshot to the exact canonical list `viewKey`;
- page is bounded to a finite positive range;
- expanded IDs are deduplicated and capped at 24;
- scroll position is clamped to a finite non-negative bound;
- reject legacy/wrong-version, cross-view, malformed, oversized, or out-of-range payloads;
- never store review schedules, reactions, practice answers, learned state, or other durable learning data here.

`SpaceView` owns list restoration because it already owns pagination and the scroll container. `ResultsClient` keeps the expansion map local and reports only the bounded expanded IDs upward. Restoration waits until live/cached Space data is ready so an empty hydration frame cannot clamp a retained page or consume a scroll snapshot against zero-height content.

The focused browser regression seeds 25 deterministic public fallback rows, moves to list page 2, expands one row, scrolls the actual Space list container, and verifies those values are present on the current history entry before navigating to Trail. Browser Back must restore page 2, the same expanded row, and the recorded scroll position. When a usable live archive wins over the seeded fallback, that fixture-specific regression skips rather than overriding live data.

## Browser-history ownership

Use ordinary canonical URLs for durable navigation identity. Use same-entry `history.state` only for ephemeral presentation restoration on the current canonical entry. The mobile editor remains history-neutral; its dismiss/reopen continuity comes from retaining one Monaco instance, while navigation Back/Forward belongs to the Space continuity lane.

Incidental hover, viewport observation, editor draft text, review state, and other high-frequency/private state do not receive history entries.

## Measurement

Evaluate continuity as separate journeys rather than one synthetic timing number:

- cold load with healthy server data;
- warm navigation inside the 60-second shared public cache window;
- cold load with server archive failure + valid cached browser snapshot;
- warm in-app list ↔ reader return;
- reading sheet ↔ prior list/Trail return;
- Back/Forward restoration of filter, list page, scroll, and expanded rows.

Record the exact route, data condition, viewport, and cache state with each measurement. The useful result is immediate usable content and restored context, rather than only a lower aggregate load number.
