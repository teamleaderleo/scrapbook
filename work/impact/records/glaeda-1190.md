---
{
  "id": "glaeda-1190",
  "repository": "teamleaderleo/glaeda",
  "kind": "pull-request",
  "number": 1190,
  "title": "worktree reclaim: delete local branches whose work has landed (--branches)",
  "status": "merged",
  "happenedAt": "2026-09-25",
  "recordedAt": "2026-09-25",
  "areas": [
    "developer-loop"
  ],
  "summary": "Removing a worktree kept its branch, so every agent task left a local branch behind. The hourly reclaim now also deletes local branches that are not checked out, are idle, and whose work landed (a merged PR containing the tip, or git alone), with a compare-and-swap delete and a receipt to restore each one.",
  "evidence": {
    "label": "Glaeda PR 1190",
    "url": "https://redirect.github.com/teamleaderleo/glaeda/pull/1190#issuecomment-5826944682",
    "basis": "PR comment summarizing the hourly LaunchAgent's receipts on Air Blue (~/Library/Logs/glaeda-worktree-reclaim.jsonl): the four runs with a branch pass after merge, ending 2026-09-25 00:15 EDT, deleted 64, 64, 64 and 63 branches (255 total), each hitting the 64-per-run cap; 1 branch was kept because it changed at recheck; circuit breaker never tripped."
  },
  "claims": [
    {
      "id": "landed-branches-deleted",
      "dimension": "developer-loop",
      "metric": "landed local branches deleted by the hourly reclaim on Air Blue",
      "direction": "reduction",
      "value": 255,
      "unit": "branches",
      "recurrence": "one-time",
      "confidence": "measured",
      "measurementWindow": "first four branch-pass runs after merge, 2026-09-24 20:03 to 2026-09-25 00:15 EDT",
      "population": "Local branches in the Git repositories under ~/Projects on Air Blue",
      "note": "Backlog clearance, capped at 64 per run, and eligible branches remained, so the total keeps rising. Before, these were only removed by a manual git branch -D. Big Red runs the same job; its receipts were not read here.",
      "headline": true,
      "additive": false,
      "overlapGroup": "glaeda-worktree-reclaim"
    }
  ]
}
---

# Why this record exists

Squash merges leave git unable to tell a landed branch from live work; asking GitHub for the merged PR is what lets landed squash-merged branches go without a human sorting them.
