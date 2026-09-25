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
  "summary": "One command turns a cmux Mac mini into a GitHub Actions runner with fleet labels. The first owned-mini job ran green, and by later that day the fleet served manaflow-ai/cmux with 13 runners.",
  "evidence": {
    "label": "Glaeda PR 1146",
    "url": "https://github.com/teamleaderleo/glaeda/pull/1146#issuecomment-5812849555",
    "basis": "PR comment: teamleaderleo/cmux run 35990802447 ran on cmux15-glaeda and succeeded in 29 s. glaeda-1175's body lists 13 owned runners on manaflow-ai/cmux (std 11, light 2)."
  },
  "claims": [
    {
      "id": "owned-runners",
      "dimension": "capacity",
      "metric": "owned Mac mini runners serving manaflow-ai/cmux",
      "direction": "shift",
      "value": 13,
      "unit": "runners",
      "recurrence": "none",
      "confidence": "observed",
      "measurementWindow": "2026-09-24",
      "population": "manaflow-ai/cmux GitHub Actions runners",
      "note": "0 to 13 owned runners on the day, a capacity shift beside Blacksmith. Later PRs (glaeda-1189, 1200) plan 36; not job-verified yet.",
      "headline": true,
      "additive": false,
      "overlapGroup": null
    }
  ]
}
---

# Why this record exists

The owned fleet is what later CI routing (owned pool first, Blacksmith overflow) builds on.
