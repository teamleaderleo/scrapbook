---
{
  "id": "glaeda-1790",
  "repository": "teamleaderleo/glaeda",
  "kind": "pull-request",
  "number": 1790,
  "title": "Make GitHub polling follow active interest and webhook coverage",
  "status": "merged",
  "happenedAt": "2026-11-01",
  "recordedAt": "2026-11-03",
  "areas": [
    "fleet",
    "api-efficiency",
    "correctness"
  ],
  "summary": "Backed off unread watches, used covered webhook feeds for comments and heads, and aligned head refreshes with explicit query accounting.",
  "evidence": {
    "label": "glaeda PR 1790",
    "url": "https://github.com/teamleaderleo/glaeda/pull/1790",
    "basis": "Public PR body and merge metadata read 2026-11-03; repository visibility independently checked as public. Authored by teamleaderleo; merged into main on 2026-11-01. Public rollout comment 6554569701 and follow-up PR 1792 also read; live rate extrapolates only the observed twenty-minute window."
  },
  "claims": [
    {
      "id": "github-watch-query-rate",
      "dimension": "api-usage",
      "metric": "Comparable-host GraphQL query-rate reduction",
      "direction": "reduction",
      "value": 644,
      "unit": "queries/hour",
      "recurrence": "none",
      "confidence": "derived",
      "measurementWindow": "November 1: last-hour baseline at 05:20 UTC; after 06:23-06:43 UTC",
      "population": "One daemon, 163 watches before and 162-205 after",
      "note": "833/hour before; after 63 queries in 20 min, extrapolated to hourly rate 189. Derived difference; short unmatched windows, not fleet-wide causal proof.",
      "headline": true,
      "additive": false,
      "overlapGroup": "glaeda-github-polling"
    },
    {
      "id": "github-watch-simulation",
      "dimension": "api-usage",
      "metric": "Simulated GraphQL query-rate reduction",
      "direction": "reduction",
      "value": 214,
      "unit": "queries/hour",
      "recurrence": "none",
      "confidence": "derived",
      "measurementWindow": "November 1 GraphqlDietTest on base and head",
      "population": "31 PR watches (9 waited, 11 read, 11 idle), 40 repeatedly read heads and one comment wait",
      "note": "382 to 168 queries/hour in simulation; derived difference. Separate from live host observation; not additive.",
      "headline": false,
      "additive": false,
      "overlapGroup": "glaeda-github-polling"
    }
  ]
}
---

# Why this record exists

The [rollout receipt](https://github.com/teamleaderleo/glaeda/pull/1790#issuecomment-6554569701) reports the more comparable host at 833 queries/hour before and 63 queries in twenty minutes afterward, equivalent to 189/hour, with roughly similar watch populations. The other host's much larger reduction coincides with a sharp fall in watches and isn't attributed to the change.

[PR 1792](https://github.com/teamleaderleo/glaeda/pull/1792) fixes dropped head nudges, controller-coverage reset and cache-hit interest refresh. The receipt still lists lower-priority batching and pagination accounting follow-ups, so those aren't silently treated as completed.

The separate simulated workload falls from 382 to 168 queries/hour. Simulation and live observations aren't additive, and request counts aren't assumed to equal billed quota points.
