---
{
  "id": "glaeda-1758",
  "repository": "teamleaderleo/glaeda",
  "kind": "pull-request",
  "number": 1758,
  "title": "Remove redundant CPU holds after a matched fleet trial",
  "status": "merged",
  "happenedAt": "2026-10-30",
  "recordedAt": "2026-11-03",
  "areas": [
    "fleet",
    "scheduling",
    "throughput"
  ],
  "summary": "Disabled the default sustained-CPU admission hold after a role-matched trial, retaining other resource gates and reserved measurement-host policy.",
  "evidence": {
    "label": "glaeda PR 1758",
    "url": "https://github.com/teamleaderleo/glaeda/pull/1758",
    "basis": "Public PR body and merge metadata read 2026-11-03; repository visibility independently checked as public. Authored by teamleaderleo; merged into main on 2026-10-30. Implementation and validation are reported by the originating PR; benchmarks were not rerun for this record."
  },
  "claims": [
    {
      "id": "cpu-hold-throughput",
      "dimension": "throughput",
      "metric": "Jobs started per mini-hour improvement, difference-in-differences",
      "direction": "throughput",
      "value": 15,
      "unit": "percent",
      "recurrence": "none",
      "confidence": "derived",
      "measurementWindow": "October 30 16:50-18:20 UTC; baseline 13:40-15:40 UTC",
      "population": "Three role-matched minis per arm; no nightly-slot mini in either arm",
      "note": "Raw rates 15.8 versus 22.0; ratio 1.21 before and 1.39 during. PR reports about 15% DiD. Median normalized duration unchanged.",
      "headline": true,
      "additive": false,
      "overlapGroup": "glaeda-fleet-admission"
    }
  ]
}
---

# Why this record exists

The trial compares one plain, one compile-role and one GUI-role mini in each arm. Difference-in-differences against an earlier common-policy window reduces the raw jobs-per-mini-hour increase to about 15%. Median normalized job duration is essentially unchanged; the trial doesn't establish a broad job-latency speedup.

The units ledger becomes the main limit, and memory-pressure protection still activates. This is one short operational trial, not an annual capacity or monetary estimate.
