---
{
  "id": "glaeda-1168",
  "repository": "teamleaderleo/glaeda",
  "kind": "pull-request",
  "number": 1168,
  "title": "glaeda-fleet-status: one typed fleet status document with typed actions",
  "status": "merged",
  "happenedAt": "2026-09-24",
  "recordedAt": "2026-09-25",
  "areas": [
    "fleet",
    "observability"
  ],
  "summary": "A single typed status read of the whole build fleet, with typed follow-up actions, replacing ad hoc checks that misreported healthy minis as broken.",
  "evidence": {
    "label": "Glaeda PR 1168",
    "url": "https://github.com/teamleaderleo/glaeda/pull/1168",
    "basis": "PR body: live read of the 15-mini fleet in 33 s; members wrongly marked broken went from 14 of 17 to 3 real errors, with 124 onboarding warnings reported separately."
  },
  "claims": [
    {
      "id": "false-broken-members",
      "dimension": "observability",
      "metric": "fleet members wrongly reported broken",
      "direction": "reliability",
      "value": 11,
      "unit": "members",
      "recurrence": "one-time",
      "confidence": "observed",
      "measurementWindow": "one live fleet read, 2026-09-24",
      "population": "Manaflow build fleet members",
      "note": "14 of 17 flagged to 3 real errors.",
      "headline": false,
      "additive": false,
      "overlapGroup": null
    }
  ]
}
---

# Why this record exists

Operators and agents act on fleet status; false alarms on most of the fleet made it unusable.
