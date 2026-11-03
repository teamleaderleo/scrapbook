---
{
  "id": "bonsplit-284",
  "repository": "manaflow-ai/bonsplit",
  "kind": "pull-request",
  "number": 284,
  "title": "Replace nested SwiftUI hosts with one AppKit split tree",
  "status": "merged",
  "happenedAt": "2026-10-12",
  "recordedAt": "2026-11-03",
  "areas": [
    "native-ui",
    "responsiveness",
    "architecture"
  ],
  "summary": "Built nested splits in AppKit with one hosting view per pane, removing the repeated focus walk that stalled deep split chains.",
  "evidence": {
    "label": "bonsplit PR 284",
    "url": "https://redirect.github.com/manaflow-ai/bonsplit/pull/284",
    "basis": "Public PR body and merge metadata read 2026-11-03; repository visibility independently checked as public. Authored by teamleaderleo; merged into main on 2026-10-12. Implementation and validation are reported by the originating PR; benchmarks were not rerun for this record."
  },
  "claims": [
    {
      "id": "deep-split-first-show",
      "dimension": "latency",
      "metric": "Depth-18 first-show main-actor stall reduction",
      "direction": "reduction",
      "value": 118.991,
      "unit": "seconds",
      "recurrence": "per-event",
      "confidence": "derived",
      "measurementWindow": "October 12 controlled before/after depth scan",
      "population": "cmux fleet builds on capture minis, depth-18 split chain",
      "note": "119 s before, 0.009 s after. Derived difference of PR-reported timings; no app-wide extrapolation.",
      "headline": true,
      "additive": false,
      "overlapGroup": "deep-split-first-show"
    }
  ]
}
---

# Why this record exists

Each nested hosting view repeated SwiftUI's focus traversal. Sibling pane hosts inside an AppKit split tree remove that recursive cost. Credit for the focus-walk diagnosis belongs to Apptah.

This completes the existing [PR 19606](https://redirect.github.com/manaflow-ai/cmux/pull/19606) story. Its per-turn responder cache and an earlier AppDelegate experiment didn't remove the underlying hang; the later source explains that SwiftUI called the hosting-view getter directly. The structural repair reports a depth-18 first-show main-actor stall of 119 seconds before and 0.009 seconds after. Depth and host configuration matter; this isn't an app-wide speedup.

Session restore and repeated workspace switches were exercised. Existing split tests had the same pass/fail pattern on both builds, rather than becoming an entirely green suite.
