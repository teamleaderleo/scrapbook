---
{
  "id": "glaeda-1162",
  "repository": "teamleaderleo/glaeda",
  "kind": "pull-request",
  "number": 1162,
  "title": "Measure the fleet compilation cache mini to mini on the full cmux app",
  "status": "merged",
  "happenedAt": "2026-09-24",
  "recordedAt": "2026-09-25",
  "areas": [
    "build-performance",
    "caching",
    "fleet"
  ],
  "summary": "Measured Xcode's compilation cache served from a shared fleet store on the Manaflow M4 Pro minis: a fresh full cmux app build that reads a filled store instead of compiling.",
  "evidence": {
    "label": "Glaeda PR 1162",
    "url": "https://github.com/teamleaderleo/glaeda/pull/1162",
    "basis": "PR body and docs/experiments/fleet-compilation-cache-minis-2026-09-24.md: full cmux app, Xcode 26.3, cold build 756 s; fresh build reading the store 132 s with 4,191 of 4,191 cacheable tasks hit and byte-identical outputs. About 52 s of the 132 s was fetching."
  },
  "claims": [
    {
      "id": "fresh-full-app-build",
      "dimension": "developer-loop",
      "metric": "fresh full cmux app build with a filled fleet cache",
      "direction": "reduction",
      "value": 624,
      "unit": "seconds/run",
      "recurrence": "per-event",
      "confidence": "observed",
      "measurementWindow": "one cold and one cached build, 2026-09-24",
      "population": "Fresh builds on a Manaflow M4 Pro mini",
      "note": "756 s to 132 s. Lab measurement, not CI. For the full app the store and reader were on the same mini; cross-machine was shown on the CmuxSettingsUI chain, and for the full app in glaeda-1180.",
      "headline": true,
      "additive": false,
      "overlapGroup": "glaeda-fleet-cas-fresh-build"
    }
  ]
}
---

# Why this record exists

The case for putting the compilation cache on the fleet: a machine that has never built cmux can produce the app in about two minutes.
