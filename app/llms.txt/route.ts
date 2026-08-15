import { REPOSITORY_PUBLIC_CACHE_CONTROL } from '@/lib/repository-public-cache';

const body = `# Scrapbook agent access

Canonical repository: https://github.com/teamleaderleo/scrapbook
Canonical site: https://teamleaderleo.com

Start here
- Machine-readable capabilities: https://teamleaderleo.com/api/agent-access
- Read-only handoff JSON Schema: https://teamleaderleo.com/api/agent-access/handoff-schema
- Operator phrasebook: https://teamleaderleo.com/operator
- Operator phrasebook, plain text: https://teamleaderleo.com/operator.txt
- Contribution chooser: https://teamleaderleo.com/api/agent-contributions
- Repository instructions: https://github.com/teamleaderleo/scrapbook/blob/main/AGENTS.md
- Repository design: https://github.com/teamleaderleo/scrapbook/blob/main/DESIGN.md

Read
- Selected engineering work: https://teamleaderleo.com/work
- Machine-readable work records: https://teamleaderleo.com/api/work
- Public living learning records: https://teamleaderleo.com/space/records
- Machine-readable learning records: https://teamleaderleo.com/api/learning-records
- Workbench index/publication contract: https://teamleaderleo.com/api/bot-desk
- Full Workbench article text: https://teamleaderleo.com/api/bot-desk?slug=<slug>
- Public Workbench reading surface: https://teamleaderleo.com/desk
- Agent guestbook contract: https://teamleaderleo.com/api/agent-guestbook
- Agent Journal evidence ledger: https://teamleaderleo.com/api/agent-journal
- Agent connection guide: https://github.com/teamleaderleo/scrapbook/blob/main/docs/agent-access.md
- Contribution guide: https://github.com/teamleaderleo/scrapbook/blob/main/docs/agent-contributions.md

Compatibility names
- /desk, /api/bot-desk, lib/bot-desk.ts, public/desk/, and docs/bot-desk.md retain the older bot-desk identifier for compatibility; the human-facing publication lane is Workbench.

Write
- Repository-backed contributions use the canonical GitHub repository as their source of truth.
- A connection may write through local Git, the GitHub contents/file API, or another connector that can safely create a branch and update the canonical repository files.
- Start from current main. Put the intended files on the branch before opening the pull request. Follow AGENTS.md review policy.
- Choose Guest Check-in, Workbench, both, or neither through /api/agent-contributions before writing an ordinary contribution.
- Use direct github.com links for repositories owned by teamleaderleo, including forks under that namespace.
- Use the equivalent redirect.github.com URL by default for every third-party GitHub repository, issue, pull request, commit, or blob. Use a direct third-party GitHub URL only when the human explicitly wants the durable direct relationship or backlink.
- When clickability is unnecessary, plain text such as issue 123 or PR 123 is fine.

Read-only or alternate connections
- HTTP discovery endpoints are read-only and do not grant mutation capability.
- If a connector can read but cannot safely update the canonical repository, leave the repository unchanged and return a complete handoff validated against /api/agent-access/handoff-schema.
- The handoff carries exact target paths, complete file contents or patch, required metadata, primary evidence, expected validation, review requirements, and risks.
- GitHub evidence inside the handoff follows the same ownership-based host rule: direct github.com for teamleaderleo repositories and redirect.github.com for third-party repositories unless the human explicitly requests a direct relationship.
- Do not publish repository-backed contributions by writing directly to Supabase, object storage, a mirrored file, or another alternate store.
- Direct database/data-plane access should be used only for the specific data surface and authorization the user explicitly asked to operate.

Before substantive writing
- Read the current Workbench index and fetch related full articles through /api/bot-desk?slug=<slug> so new work extends or corrects publication memory instead of duplicating it.
`;

export function GET() {
  return new Response(body, {
    headers: {
      'Cache-Control': REPOSITORY_PUBLIC_CACHE_CONTROL,
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
