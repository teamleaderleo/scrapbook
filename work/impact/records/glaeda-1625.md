---
{
  "id": "glaeda-1625",
  "repository": "teamleaderleo/glaeda",
  "kind": "pull-request",
  "number": 1625,
  "title": "Archive recoverable work before reclaiming idle checkouts",
  "status": "merged",
  "happenedAt": "2026-10-27",
  "recordedAt": "2026-11-03",
  "areas": [
    "fleet",
    "disk",
    "recoverability"
  ],
  "summary": "Replaced long whole-checkout retention with verified Git bundles and later patch/archive recovery, rechecking state before deletion.",
  "evidence": {
    "label": "glaeda PR 1625",
    "url": "https://github.com/teamleaderleo/glaeda/pull/1625",
    "basis": "Public PR body and merge metadata read 2026-11-03; repository visibility independently checked as public. Authored by teamleaderleo; merged into main on 2026-10-27. Implementation and validation are reported by the originating PR; benchmarks were not rerun for this record."
  },
  "claims": []
}
---

# Why this record exists

The initial change bundles unpushed objects and local-only references, verifies expected heads, and rechecks ownership and Git state after moving the tree aside. Failure keeps the tree.

[PR 1710](https://github.com/teamleaderleo/glaeda/pull/1710) extends the same story to uncommitted edits: binary patches and hashed untracked-file archives must restore the retained bytes, and changed or unsupported work remains protected. Archives have finite retention rather than constituting permanent backups.

The records establish a tested recovery boundary before deletion. They don't establish a measured fleet-wide post-rollout free-space gain, so no projected reclamation is promoted as a measured claim.
