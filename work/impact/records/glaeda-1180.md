---
{
  "id": "glaeda-1180",
  "repository": "teamleaderleo/glaeda",
  "kind": "pull-request",
  "number": 1180,
  "title": "Record the cross-machine full-app read of the fleet compilation cache",
  "status": "merged",
  "happenedAt": "2026-09-24",
  "recordedAt": "2026-09-25",
  "areas": [
    "build-performance",
    "caching",
    "fleet"
  ],
  "summary": "Repeated glaeda-1162's full-app measurement with the store filled on one mini and read from another over the LAN.",
  "evidence": {
    "label": "Glaeda PR 1180",
    "url": "https://github.com/teamleaderleo/glaeda/pull/1180",
    "basis": "PR body: cmux8s filled, cmux7s read, Xcode 26.3: 4,191 of 4,191 hits in 127 s (warm node 77 s; same-host reference 108 s). 7,631 of 7,634 outputs byte-identical; the 3 that differ are two Go WireGuard library copies and the debug dylib."
  },
  "claims": [
    {
      "id": "cross-machine-full-app-read",
      "dimension": "developer-loop",
      "metric": "fresh full cmux app build reading another mini's store",
      "direction": "reduction",
      "value": 629,
      "unit": "seconds/run",
      "recurrence": "per-event",
      "confidence": "observed",
      "measurementWindow": "one build, 2026-09-24, against glaeda-1162's 756 s cold baseline",
      "population": "Fresh builds on Manaflow M4 Pro minis",
      "note": "756 s to 127 s. Members share entries only on the same Xcode build. The network adds about 20 to 30 s.",
      "headline": false,
      "additive": false,
      "overlapGroup": "glaeda-fleet-cas-fresh-build"
    }
  ]
}
---

# Why this record exists

Confirms the fleet win holds across machines, not only on the host that filled the store.
