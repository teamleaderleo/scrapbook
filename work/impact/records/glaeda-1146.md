---
{
  "id": "glaeda-1146",
  "repository": "teamleaderleo/glaeda",
  "kind": "pull-request",
  "number": 1146,
  "title": "glaeda-cmux-runner: one-command GitHub Actions runner for a cmux Mac mini",
  "status": "merged",
  "happenedAt": "2026-09-24",
  "recordedAt": "2026-09-25",
  "areas": [
    "fleet",
    "ci"
  ],
  "summary": "One command turns a cmux Mac mini into a GitHub Actions runner with fleet labels. The first owned-mini runner (cmux15-glaeda) ran a job green on the fork.",
  "evidence": {
    "label": "Glaeda PR 1146",
    "url": "https://github.com/teamleaderleo/glaeda/pull/1146#issuecomment-5812849555",
    "basis": "PR comment: teamleaderleo/cmux run 35990802447 ran on cmux15-glaeda and succeeded in 29 s. Later the same day, glaeda#1175's body lists 13 glaeda pool runners registered on manaflow-ai/cmux (std 11, light 2), before the owned pool was switched on."
  },
  "claims": [
    {
      "id": "owned-runners",
      "dimension": "compute",
      "metric": "owned Mac mini runners with a verified job",
      "direction": "shift",
      "value": 1,
      "unit": "runners",
      "recurrence": "none",
      "confidence": "observed",
      "measurementWindow": "2026-09-24",
      "population": "Owned Manaflow Mac mini runners (first job on the teamleaderleo/cmux fork)",
      "note": "0 to 1, job-verified on the fork. By glaeda#1175, 13 runners were registered on manaflow-ai/cmux but not yet taking jobs; glaeda#1200 plans 36. Neither is job-verified here.",
      "headline": false,
      "additive": false,
      "overlapGroup": null
    }
  ]
}
---

# Why this record exists

The first owned runner: the later owned-pool-first CI routing builds on it.
