# Space continuity contracts

Space should feel immediate on ordinary return navigation without making browser storage a second database. The continuity layer therefore separates three short-lived concerns and leaves durable learning/review state elsewhere.

## 1. Canonical browse URL state

`lib/space-browse-state.ts` owns the stable serialization for the ordinary list/reader state:

- `lane`;
- `tags`;
- `item`.

The parameter order is always `lane`, `tags`, `item`. Empty values disappear. The same serialization produces the per-view `viewKey` used by ephemeral history restoration.

Reading-sheet and Trail-specific parameters remain outside this first codec until their current route helpers are migrated deliberately; do not duplicate `from`, `return`, `practice`, or `stage` in a second half-migrated helper.

## 2. Bounded public archive snapshot

`lib/space-public-snapshot.ts` and `lib/space-public-snapshot-storage.ts` define the only browser-persistent archive fallback.

Rules:

- versioned key: `scrapbook:space-public-snapshot:v1`;
- maximum 100 items, matching the current first public page;
- maximum age 24 hours;
- tolerate at most five minutes of forward clock skew;
- strip `review` and `userId` before serialization;
- reject cached payloads that contain those fields;
- restore cached items with `review: null` and `userId: null`;
- do not write empty snapshots;
- treat localStorage read/write/quota/security failures as cache misses;
- remove invalid/stale payloads when storage permits.

### Admission sequence

The eventual `ItemsProvider` integration should stay one-way and conservative:

1. Start with the server-provided public items exactly as today.
2. After hydration, if the server supplied usable public items, keep them and write/update the bounded public snapshot.
3. If the server supplied no usable public items and a valid cached public snapshot exists, admit the cached items immediately and mark the visible state as stale/cached.
4. Revalidate through the existing `reload()` path; a successful public response replaces the cache-backed list and refreshes the snapshot.
5. A refresh failure preserves the admitted list and surfaces the existing bounded error state.
6. Private/admin review rows continue through their existing authenticated path and never enter the public snapshot.

Do not merge cached public items with a partial server response in this first slice. Either the server supplied a usable current public page or the cache is a temporary fallback.

## 3. Same-entry UI history

`lib/space-history-ui.ts` owns ephemeral Back/Forward state that cannot be reconstructed from the URL:

- scroll position;
- expanded row IDs.

Rules:

- namespace under `__scrapbookSpaceUi` while preserving Next/router-owned history fields;
- bind every snapshot to the exact canonical `viewKey`;
- cap expanded IDs at 24 and deduplicate them;
- clamp scroll positions to a finite non-negative bound;
- reject wrong-version, cross-view, malformed, oversized, or out-of-range payloads;
- never store review schedules, reactions, practice answers, learned state, or other durable learning data here.

## Browser-history ownership

Use ordinary canonical URLs for durable navigation identity. Use same-entry `history.state` only for ephemeral presentation restoration. Temporary modal state may use its own explicit same-document marker when that marker has independent Back/Forward semantics; it should disappear on close and must not become a durable learning identifier.

## Measurement

Evaluate continuity as separate journeys rather than one synthetic timing number:

- cold load with healthy server data;
- cold load with server archive failure + valid cached public snapshot;
- warm in-app list ↔ reader return;
- reading sheet ↔ prior list/Trail return;
- Back/Forward restoration of filter, target, scroll, and expanded rows.

Record the exact route, data condition, viewport, and cache state with each measurement. The useful result is immediate usable content and restored context, not merely a lower aggregate load number.
