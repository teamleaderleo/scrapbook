---
{
  "id": "glaeda-1133",
  "repository": "teamleaderleo/glaeda",
  "kind": "pull-request",
  "number": 1133,
  "title": "Reclaim eligible linked worktrees with --apply",
  "status": "merged",
  "happenedAt": "2026-09-23",
  "recordedAt": "2026-09-25",
  "areas": [
    "developer-loop",
    "storage"
  ],
  "summary": "glaeda-worktree-reclaim gained --apply: it re-plans each eligible linked worktree, pins an orphan HEAD, rechecks for movement and removes it with git's own guards, recording commit and branch so it can be recreated. The first runs cleared a backlog of 248 idle worktrees across Air Blue and Big Red. The first apply on Air Blue ran from the PR build shortly before merge.",
  "evidence": {
    "label": "Glaeda PR 1133",
    "url": "https://redirect.github.com/teamleaderleo/glaeda/pull/1133#issuecomment-5826944522",
    "basis": "PR comment summarizing the apply receipts from 2026-09-23 (24 h idle window): first apply on Air Blue, 2 repos, 57 linked, 8 reclaimed; Air Blue backlog, 21 repos, 211 linked, 148 reclaimed; Big Red backlog, 23 repos, 161 linked, 92 reclaimed. No other outcomes, circuit breaker never tripped. Per-repository free space rose by 11.4 GiB in total."
  },
  "claims": [
    {
      "id": "worktrees-reclaimed-backlog",
      "dimension": "storage",
      "metric": "idle linked worktrees removed in the first apply runs",
      "direction": "reduction",
      "value": 248,
      "unit": "worktrees",
      "recurrence": "one-time",
      "confidence": "measured",
      "measurementWindow": "three apply runs, 2026-09-23 03:00 to 03:15 EDT",
      "population": "Git repositories under ~/Projects on Air Blue and Big Red",
      "note": "Exact count from receipts; each reclaim is recoverable from the recorded commit and branch. Free space rose by 11.4 GiB (sum of per-repository before and after readings, so other host activity can move it).",
      "headline": true,
      "additive": false,
      "overlapGroup": "glaeda-worktree-reclaim"
    }
  ]
}
---

# Why this record exists

Every agent task leaves a worktree behind. Before this, they were removed by hand or not at all; afterwards the backlog was gone in one pass and a scheduled job could keep it gone.
