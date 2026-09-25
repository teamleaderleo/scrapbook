---
{
  "id": "glaeda-1209",
  "repository": "teamleaderleo/glaeda",
  "kind": "pull-request",
  "number": 1209,
  "title": "fleet-cas: tailnet addressing, launchd wrapper, upstream error logging",
  "status": "merged",
  "happenedAt": "2026-09-25",
  "recordedAt": "2026-09-25",
  "areas": [
    "fleet",
    "caching",
    "reliability"
  ],
  "summary": "Cross-machine reads through the deployed fleet cache services never worked: macOS Local Network privacy blocks launchd-started third-party binaries on the headless minis from other hosts' LAN addresses. The store and nodes now use tailnet addresses, and a fresh full cmux app build on cmux11s hit every cacheable task through its deployed node.",
  "evidence": {
    "label": "Glaeda PR 1209",
    "url": "https://redirect.github.com/teamleaderleo/glaeda/pull/1209#issuecomment-5826438514",
    "basis": "PR body: before, the launchd-started node on cmux8s got \"No route to host\" for the store's LAN address on cmux7s while the same binary from ssh connected. Pre-merge comment: fresh full-app read on cmux11s through its deployed node LaunchAgent, over the tailnet, from the store on cmux7s, commit 2ae26d1c, Xcode 26.6: 4,192 of 4,192 cacheable tasks hit, all 7,706 signed index entries fetched and verified (kv_sig_fail 0, up_errors 0), BUILD SUCCEEDED in 326 s."
  },
  "claims": [
    {
      "id": "deployed-cross-machine-hits",
      "dimension": "reliability",
      "metric": "cacheable tasks hit through a deployed node reading another mini's store",
      "direction": "reliability",
      "value": 4192,
      "unit": "tasks/build",
      "recurrence": "per-run",
      "confidence": "observed",
      "measurementWindow": "one fresh full-app build on cmux11s before merge, 2026-09-25",
      "population": "Fresh full cmux app builds on Manaflow minis using the deployed fleet-cas node (Xcode 26.6)",
      "note": "Before, the deployed (launchd) node could not reach the store at all, so deployed cross-machine reads served nothing; lab reads in glaeda-1162 and glaeda-1180 ran from ssh, which the block does not affect. The 326 s build time is not claimed as a reduction: there is no same-host, same-Xcode cold baseline for it (756 s in glaeda-1162 was Xcode 26.3).",
      "headline": true,
      "additive": false,
      "overlapGroup": "glaeda-fleet-cas-fresh-build"
    }
  ]
}
---

# Why this record exists

The lab numbers in glaeda-1162 and glaeda-1180 only become a fleet feature once the launchd services can reach the store. This is the first verified read through the deployed path, and the new upstream error logging is what would have exposed the silent LAN block earlier.
