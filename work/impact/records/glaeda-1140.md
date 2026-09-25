---
{
  "id": "glaeda-1140",
  "repository": "teamleaderleo/glaeda",
  "kind": "pull-request",
  "number": 1140,
  "title": "Add glaeda-disk: where the disk went, and reclaim idle build output",
  "status": "merged",
  "happenedAt": "2026-09-23",
  "recordedAt": "2026-09-25",
  "areas": [
    "developer-loop",
    "storage"
  ],
  "summary": "glaeda-disk reports where the disk went by family and deletes idle, reproducible build output (Xcode DerivedData, temp-dir scratch, idle session scratchpads) with process, git and idle-window vetoes. On Air Blue it deleted 52.8 GiB of idle build output in its first day and a half, 35.5 GiB of it after merge.",
  "evidence": {
    "label": "Glaeda PR 1140",
    "url": "https://redirect.github.com/teamleaderleo/glaeda/pull/1140#issuecomment-5826944345",
    "basis": "PR comment summarizing Air Blue's receipt file (~/Projects/recovery/disk-reclaim/receipts.jsonl): 32 deletions, all outcome reclaimed, all idle 6 h or more, 2026-09-23 11:57 to 2026-09-24 18:50 EDT. 17.3 GiB in 18 deletions before merge (PR build), 35.5 GiB in 14 after. By family: DerivedData 36.1 GiB, temp scratch 12.7, session scratch 4.0."
  },
  "claims": [
    {
      "id": "air-blue-idle-output-deleted",
      "dimension": "storage",
      "metric": "idle build output deleted by glaeda-disk on Air Blue",
      "direction": "reduction",
      "value": 52.8,
      "unit": "GiB",
      "recurrence": "one-time",
      "confidence": "measured",
      "measurementWindow": "32 receipt lines, 2026-09-23 11:57 to 2026-09-24 18:50 EDT",
      "population": "Air Blue (Leo's MacBook Air)",
      "note": "Gross bytes deleted, not sustained free space: DerivedData and scratch regrow when the next build or session needs them. 35.5 GiB of it came after merge; the other 17.3 GiB was deleted by the PR's own build before merge. The minis run the same pressure job but have not been under pressure (194 to 270 GiB free against a 69.1 GiB threshold), so there are no mini receipts.",
      "headline": true,
      "additive": false,
      "overlapGroup": "air-blue-disk-reclaim"
    }
  ]
}
---

# Why this record exists

Disk kept filling on Air Blue from one DerivedData copy per parallel cmux session, and nothing watched it. This turned repeated manual cleanups into an unattended job with a receipt per deletion.
