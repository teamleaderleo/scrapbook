# Learning-record migration plan

This plan describes a later, separately reviewed migration from current Space
items to revisioned learning records. The fixture-backed schema and public
reader must prove the model first. This document does not authorize or execute
a production data migration.

## Boundary and invariants

- Preserve the current `items.id` as the durable source identity. A migrated
  record uses `space:<items.id>` even if its title or slug changes later.
- Preserve the current slug as the first canonical path and keep an alias when
  a later revision changes it.
- Copy `url`, timestamps, tags, category, and each item version into explicit
  provenance or revision fields. Never synthesize missing source history.
- Do not copy FSRS review rows, due dates, owner tokens, private drafts, or raw
  chat transcripts into the public projection.
- Public, unlisted, and private-owner visibility must be explicit on every
  record. Missing visibility fails closed to private-owner.
- Mutations remain owner-only. Public and unlisted records are read models, not
  public write surfaces.

## Staged migration

1. Export `items`, their version arrays, and related review-row counts to a
   timestamped, access-controlled snapshot. Record row counts and content
   hashes without publishing private text.
2. Run a dry projection using `projectSpaceItemToLearningRecord`. Emit a report
   of invalid URLs, missing slugs, duplicate IDs, duplicate slugs, and relations
   whose targets do not exist. Do not write records in this phase.
3. Resolve duplicates by source ID first. For a repeated slug with different
   source IDs, keep both stable IDs, choose one canonical slug explicitly, and
   give the other a deterministic suffixed slug plus an alias. Never merge
   bodies merely because their titles look similar.
4. Write a canary batch to a new table or repository snapshot. Compare every
   public projection with the source item and verify private fields are absent.
5. Backfill the remaining records in bounded batches. Record source ID,
   destination ID, outcome, and checksum in a migration ledger so retries are
   idempotent.
6. Switch reads behind a reversible flag only after counts, sampled content,
   canonical URLs, authorization, and mobile rendering pass. Keep the old read
   path available for at least one release window.

## Retention and deletion

- Keep the pre-migration export until the new model has survived the agreed
  observation window and a restore drill. Then apply the same private-data
  retention policy as the source rather than keeping an indefinite shadow copy.
- Keep revision metadata needed to explain public changes. Removing a public
  record creates a tombstone or redirect only when that does not expose private
  identity or content.
- Review schedules remain in their existing owner-only system until deliberately
  retired. They are not learning-record revisions and are never made public as
  a side effect of migration.
- A source deletion request propagates to projected bodies, search indexes,
  caches, and agent-facing exports. The migration ledger may retain only the
  minimum opaque identifier and deletion outcome needed for audit.

## Rollback

Before cutover, verify the snapshot can recreate the current item count and a
sample of version arrays. Rollback means disabling the new-read flag, restoring
the old Space read path, invalidating record caches, and leaving new writes
paused while the migration ledger is reconciled. Do not reverse-copy projected
records into `items`; restore from the immutable source snapshot instead.

The production schema, authorization policies, deletion behavior, and cutover
flag require explicit human review before execution. The fixture contract can
ship independently because it neither changes storage nor mutates live data.
