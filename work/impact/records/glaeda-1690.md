---
{
  "id": "glaeda-1690",
  "repository": "teamleaderleo/glaeda",
  "kind": "pull-request",
  "number": 1690,
  "title": "Share Git objects across runners and repair reboot identity",
  "status": "merged",
  "happenedAt": "2026-10-27",
  "recordedAt": "2026-11-03",
  "areas": [
    "fleet",
    "git",
    "storage",
    "regression"
  ],
  "summary": "Made runner checkouts borrow a verified per-mini Git mirror, then repaired reboot detection and submodule-store preservation.",
  "evidence": {
    "label": "glaeda PR 1690",
    "url": "https://github.com/teamleaderleo/glaeda/pull/1690",
    "basis": "Public PR body and merge metadata read 2026-11-03; repository visibility independently checked as public. Authored by teamleaderleo; merged into main on 2026-10-27. Implementation and validation are reported by the originating PR; benchmarks were not rerun for this record."
  },
  "claims": [
    {
      "id": "mirror-space-lower",
      "dimension": "storage",
      "metric": "Projected lower per-mini Git storage reduction",
      "direction": "reduction",
      "value": 13,
      "unit": "GB",
      "recurrence": "none",
      "confidence": "projected",
      "measurementWindow": "October 27 16:30 UTC baseline inventory",
      "population": "Eight busy minis with multiple runner checkouts",
      "note": "Lower bound of 13-31 GB projection after retaining one shared mirror; no rollout after-measurement. Not additive with the upper bound or cleanup records.",
      "headline": false,
      "additive": false,
      "overlapGroup": "glaeda-git-mirror"
    },
    {
      "id": "mirror-space-upper",
      "dimension": "storage",
      "metric": "Projected upper per-mini Git storage reduction",
      "direction": "reduction",
      "value": 31,
      "unit": "GB",
      "recurrence": "none",
      "confidence": "projected",
      "measurementWindow": "October 27 16:30 UTC baseline inventory",
      "population": "Same eight busy minis",
      "note": "Upper bound of the same 13-31 GB projection, not another saving.",
      "headline": false,
      "additive": false,
      "overlapGroup": "glaeda-git-mirror"
    }
  ]
}
---

# Why this record exists

[PR 1656](https://github.com/teamleaderleo/glaeda/pull/1656) supplies the full mirror and verified staged seed. Borrowers retain objects the mirror lacks and refuse unsafe or unverified stores.

The first version recorded a device number as mirror identity. A reboot changed that number, causing valid borrowers to discard their Git directory and leave submodule gitfiles dangling. [PR 1726](https://github.com/teamleaderleo/glaeda/pull/1726) changes the identity check and preserves submodule stores when a checkout must be rebuilt; real-Git tests cover reboot and genuine replacement.

The 13 to 31 GB per-busy-mini saving in the original borrowing PR is projected. It isn't a measured deployment result, and it isn't added to the separate scratch-reclamation observation.
