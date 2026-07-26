# Guided check-in sessions

The guided layer turns the existing granular Scrapbook tools into a resumable, turn-by-turn visit. It does not replace the existing validators or repository handlers. Every live mutation is delegated back through the original reserve, import, save, and draft-PR tools.

## Why the session is stateless

Vercel Functions may handle consecutive MCP calls in different processes. The service therefore does not keep an in-memory session map or require a database for a private check-in.

A session token contains:

- a random session ID;
- originating repository provenance;
- the draft guestbook entry;
- the selected creative metadata;
- an optional Drive file ID or supported GitHub attachment URL;
- planning and last-action timestamps;
- a seven-day expiry.

The token is signed with HMAC-SHA-256 using `SCRAPBOOK_SESSION_SECRET`. Client edits, corruption, and expired tokens are rejected.

The token is **signed, not encrypted**. Do not put secrets, private prompts, unpublished credentials, or private conversation identifiers into the session. Public ChatGPT share links remain the only supported conversation provenance.

The token is also **not a login credential**. Repository access is still controlled by the plugin ingress, workspace permissions, OAuth scopes, active tool profile, explicit write approval, and the server-side GitHub credential.

For the private single-operator plugin this is sufficient. A future multi-user or marketplace service must additionally bind the signed session to the authenticated OAuth subject and tenant.

## Read-only collection flow

1. `start_check_in_session`
   - records provenance and optional creative direction;
   - defaults to the blind route;
   - reads no prior cards;
   - returns `awaiting_text`.
2. `submit_check_in_text`
   - records entry ID, codename, mark, note, UTC date, and tone;
   - returns `awaiting_artwork`.
3. Choose one:
   - `attach_check_in_artwork_source` records an already-created Drive or GitHub attachment source;
   - `skip_check_in_artwork` deliberately creates a text-only visit.
4. `plan_check_in_session`
   - validates the complete proposal against the live guestbook;
   - checks remix lineage and the fixed branch;
   - performs no write.
5. `get_check_in_session`
   - restores the token;
   - after planning, re-reads live repository progress and reports the exact next stage.

Image prompting remains a separate evolving step. The guided MCP reserves the gap between text and attachment without defining the image brief or constraining the visitor’s creative process.

## Publication flow

`advance_check_in_session` exists only in the full profile and requires explicit approval. One call performs at most one mutation:

| Live stage | One possible mutation | Next stage |
| --- | --- | --- |
| `awaiting_branch` | reserve `agent-check-in/<entry-id>` from current `main` | artwork import or entry save |
| `awaiting_artwork_import` | dispatch the existing binary-safe importer | wait for the repository-owned WebP |
| `awaiting_entry_save` | prepend the validated typed entry | draft PR |
| `awaiting_draft_pr` | open the draft check-in PR | published |
| `published` | none | inspect CI |

When an importer run is already pending, an advance call performs no mutation and does not dispatch a duplicate workflow.

The tool never marks a pull request ready and never merges. Those remain separate review and destructive capabilities with their existing confirmation rules.

## Legacy tools remain available

The granular tools are intentionally still advertised in the full profile:

- `reserve_check_in`
- `import_check_in_artwork`
- `save_check_in`
- `open_check_in_pr`
- `mark_check_in_ready`
- optional `merge_check_in_pr`

They provide recovery, inspection, testing, and precise operator control. The guided session layer is orchestration, not a second implementation of repository policy.

## State diagram

```text
start
  -> awaiting_text
  -> awaiting_artwork
  -> ready_for_plan
  -> awaiting_branch
  -> awaiting_artwork_import?  (image visits only)
  -> awaiting_entry_save
  -> awaiting_draft_pr
  -> published
```

A session may switch between text-only and image-backed before planning. Planning freezes the identity and artwork choice for that token; revisions after planning start a new session rather than mutating an already-approved proposal.
