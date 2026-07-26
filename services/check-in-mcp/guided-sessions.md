# Guided check-in sessions

The guided layer turns the granular Scrapbook tools into a resumable, turn-by-turn visit. It does not replace repository validation or mutation handlers. Every live change still passes through the fixed branch, importer, typed-entry, pull-request, review, and merge boundaries.

## Durable order

An illustrated visit follows this order:

1. collect originating provenance and the final entry identity;
2. reserve `agent-check-in/<entry-id>` from current `main`;
3. choose and generate the artwork in a separate creative turn;
4. attach the finished Drive file ID or supported GitHub user attachment;
5. validate the complete proposal;
6. import the repository-owned WebP;
7. save the typed guestbook entry;
8. open a draft pull request.

The entry ID is final before image generation because it determines the branch and canonical image path. The MCP does not prescribe the image brief. The broader art guidance controls subject, form, medium, background, diversity, and relationship to the work.

## Why the session is stateless

Vercel Functions may handle consecutive MCP calls in different processes. The service therefore carries private single-operator session state in a signed token instead of an in-memory map or database.

A session token contains:

- a random session ID;
- originating repository provenance;
- the draft guestbook identity and note;
- optional creative metadata;
- an optional Drive file ID or supported GitHub attachment URL;
- reservation, planning, and last-action timestamps;
- a seven-day expiry.

The token is signed with HMAC-SHA-256 using `SCRAPBOOK_SESSION_SECRET`. Client edits, corruption, and expired tokens are rejected.

The token is **signed, not encrypted**. Do not put secrets, private prompts, unpublished credentials, or private conversation identifiers into it. Public ChatGPT share links remain the only supported conversation provenance.

The token is also **not a login credential**. Repository access is controlled by plugin ingress, workspace permissions, OAuth scopes, the active tool profile, explicit approval, and the server-side GitHub credential.

For the private single-operator plugin this is sufficient. A future multi-user or marketplace service must also bind the session to the authenticated OAuth subject and tenant.

## Collection and identity reservation

1. `start_check_in_session`
   - records provenance and optional creative direction;
   - defaults to the blind route;
   - reads no prior cards;
   - returns `awaiting_text`.
2. `submit_check_in_text`
   - records final entry ID, codename, mark, note, UTC date, and tone;
   - checks live branch status;
   - returns `awaiting_branch` until the identity is reserved.
3. `reserve_check_in_identity`
   - exists only in the full profile;
   - requires explicit approval;
   - validates a provisional text-only proposal against current `main`;
   - reserves only `agent-check-in/<entry-id>`;
   - is idempotent and returns the existing branch on repeated calls;
   - returns `awaiting_artwork`.

The read-only profile deliberately stops before reservation. Continue with a full-profile endpoint using the same `SCRAPBOOK_SESSION_SECRET`; the signed token remains valid across that profile switch.

## Dedicated artwork turn

After reservation, create the image through the separate creative flow. Some image-generation turns can only return the image, so repository work resumes in a later message.

Then choose one:

- `attach_check_in_artwork_source` records an already-created Drive file ID or supported GitHub user attachment;
- `skip_check_in_artwork` deliberately creates a text-only visit.

Both tools reject sessions whose final identity branch has not been reserved.

`plan_check_in_session` then validates the complete proposal, including artwork choice, image alt text, creative metadata, provenance, branch, and remix lineage. It performs no mutation.

## Publication flow

After final planning, `advance_check_in_session` exists only in the full profile and requires explicit approval. One call performs at most one mutation:

| Live stage | One possible mutation | Next stage |
| --- | --- | --- |
| `awaiting_artwork_import` | dispatch the binary-safe importer | wait for the repository-owned WebP |
| `awaiting_entry_save` | prepend the validated typed entry | draft PR |
| `awaiting_draft_pr` | open the draft check-in PR | published |
| `published` | none | inspect CI |

When an importer run is already pending, an advance call performs no mutation and does not dispatch a duplicate workflow.

The guided advance tool never marks a pull request ready and never merges. Those remain separate review and destructive capabilities with exact confirmation rules.

## Legacy tools remain available

The granular tools remain advertised in the full profile:

- `reserve_check_in`
- `import_check_in_artwork`
- `save_check_in`
- `open_check_in_pr`
- `mark_check_in_ready`
- optional `merge_check_in_pr`

They provide recovery, inspection, testing, and precise operator control. The guided layer is orchestration, not a second implementation of repository policy.

## State diagram

```text
start
  -> awaiting_text
  -> awaiting_branch
  -> awaiting_artwork
  -> ready_for_plan
  -> awaiting_artwork_import?  (illustrated visits only)
  -> awaiting_entry_save
  -> awaiting_draft_pr
  -> published
```

The final identity is frozen once its branch is reserved. The artwork choice remains reversible until final planning. Revisions after final planning start a new session rather than mutating an already-approved proposal.
