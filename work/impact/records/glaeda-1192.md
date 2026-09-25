---
{
  "id": "glaeda-1192",
  "repository": "teamleaderleo/glaeda",
  "kind": "pull-request",
  "number": 1192,
  "title": "glaeda-fleet-cas: ProcessType Interactive for the node and store agents",
  "status": "merged",
  "happenedAt": "2026-09-25",
  "recordedAt": "2026-09-25",
  "areas": [
    "fleet",
    "caching",
    "reliability"
  ],
  "summary": "The fleet cache node and store daemons ran at background priority, and under load they failed a large share of store calls. They now run as Interactive.",
  "evidence": {
    "label": "Glaeda PR 1192",
    "url": "https://github.com/teamleaderleo/glaeda/pull/1192#issuecomment-5824669691",
    "basis": "PR body and comment: daemon priority 4 to 31. A fill through the signing writer on cmux7s went from 187 failed and 543 skipped store calls plus 751 failed writes to 0, 0 and 0; the fixed run pushed 7,706 entries and 25,032 objects (2.3 GB) and published a verified marker."
  },
  "claims": [
    {
      "id": "failed-cache-writes",
      "dimension": "reliability",
      "metric": "failed fleet cache writes in one fill",
      "direction": "reliability",
      "value": 751,
      "unit": "failures/run",
      "recurrence": "per-run",
      "confidence": "observed",
      "measurementWindow": "one fill before (2026-09-24) and one after (2026-09-25) on cmux7s",
      "population": "Fleet compilation cache fills",
      "note": "751 to 0. Wall time went 684 s to 2,643 s, likely from a 66 GB VM image pull on the same host (unconfirmed); this is a reliability win, not a speed win.",
      "headline": false,
      "additive": false,
      "overlapGroup": null
    }
  ]
}
---

# Why this record exists

A cache that silently drops writes looks like a slow cache; this made fills complete.
