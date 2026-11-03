---
{
  "id": "glaeda-1803",
  "repository": "teamleaderleo/glaeda",
  "kind": "pull-request",
  "number": 1803,
  "title": "Reclaim idle scratch despite unreadable launchd plist files",
  "status": "merged",
  "happenedAt": "2026-11-02",
  "recordedAt": "2026-11-03",
  "areas": [
    "fleet",
    "disk",
    "observability"
  ],
  "summary": "Used verified launchctl state when launchd plist files are unreadable and started report-only volume census after eligible cleanup passes.",
  "evidence": {
    "label": "glaeda PR 1803",
    "url": "https://github.com/teamleaderleo/glaeda/pull/1803",
    "basis": "Public PR body and merge metadata read 2026-11-03; repository visibility independently checked as public. Authored by teamleaderleo; merged into main on 2026-11-02. Implementation and validation are reported by the originating PR; benchmarks were not rerun for this record."
  },
  "claims": [
    {
      "id": "scratch-first-pass",
      "dimension": "storage",
      "metric": "Idle scratch reclaimed in one initial pass",
      "direction": "reduction",
      "value": 38.7,
      "unit": "GiB",
      "recurrence": "one-time",
      "confidence": "measured",
      "measurementWindow": "November 2 first cleanup pass after deployment",
      "population": "One CI mini identified as mini A in the public PR",
      "note": "Free space briefly reached 97 GiB, then fell to about 64 GiB after jobs refilled it. Reclaimed bytes, not durable fleet free space.",
      "headline": true,
      "additive": false,
      "overlapGroup": "glaeda-disk-hygiene"
    }
  ]
}
---

# Why this record exists

An unreadable root-owned plist conservatively vetoed every scratch folder. The fallback accepts launchctl output only when its loaded path matches the plist, then repeats the check immediately before deletion. Failure, mismatch or an unloaded job still retains the folder.

The first pass on one host reclaimed 38.7 GiB. Later jobs consumed much of the newly available space, so this isn't a permanent free-space gain or a fleet sum. The census separately makes previously unwalked storage visible; it doesn't imply every owner-controlled cache was reclaimed.
