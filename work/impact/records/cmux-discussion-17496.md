---
{
  "id": "cmux-discussion-17496",
  "repository": "manaflow-ai/cmux",
  "kind": "discussion",
  "number": 17496,
  "title": "Is this now considered normal download/app size for a native mac (terminal) app?",
  "status": "published",
  "happenedAt": "2026-10-06T02:28:55Z",
  "recordedAt": "2026-10-15",
  "areas": [
    "app-size",
    "packaging",
    "release",
    "architecture"
  ],
  "summary": "Track the cmux app-size campaign from the 775 MB installed and 312 MB DMG discussion baseline through thin architecture-specific release checkpoints and the component-level optimization records.",
  "evidence": {
    "label": "CMUX Discussion 17496",
    "url": "https://redirect.github.com/manaflow-ai/cmux/discussions/17496",
    "basis": "Discussion #17496 body reports a 775 MB app and 312 MB DMG. Leo maintainer comment https://redirect.github.com/manaflow-ai/cmux/discussions/17496#discussioncomment-18874534 states future next-release targets of 248 MB arm64 installed, 266 MB Intel installed, and 79/93 MB DMGs. Post-merge PR #19255 comment https://redirect.github.com/manaflow-ai/cmux/pull/19255#issuecomment-6107295819 measures signed ULMO checkpoints of 741.8/461.3/481.9 MiB installed and 238.9/145.0/160.8 MB DMGs. Component records link the architecture chain (#19211, #19213, #19305, #19361, #19601), package/resource work (#19356, #19379, #19386, #19355, #20743), executable/helper work (#19428, #19665, #19666, #20662, #20762), and CEF locale trim/supersession (#16732). #19222 is a release-notarization enabler without a standalone size delta; #20943 remains open and is not counted."
  },
  "claims": [
    {
      "id": "discussion-installed-baseline",
      "dimension": "campaign",
      "metric": "discussion app installed-size baseline",
      "direction": "baseline",
      "value": 775,
      "unit": "MB/app",
      "recurrence": "one-time",
      "confidence": "observed",
      "measurementWindow": "discussion #17496 body, created 2026-10-06",
      "population": "v0.65-era app reported by discussion author",
      "note": "The discussion reports 775 MB installed; it is a campaign baseline, not a current universal-release receipt.",
      "headline": false,
      "additive": false,
      "overlapGroup": "cmux-app-size-campaign-2026-10"
    },
    {
      "id": "discussion-dmg-baseline",
      "dimension": "campaign",
      "metric": "discussion DMG download baseline",
      "direction": "baseline",
      "value": 312,
      "unit": "MB/DMG",
      "recurrence": "one-time",
      "confidence": "observed",
      "measurementWindow": "discussion #17496 body, created 2026-10-06",
      "population": "v0.65-era DMG reported by discussion author",
      "note": "The discussion reports a 312 MB DMG baseline; later PRs measure ULMO and thin variants separately.",
      "headline": false,
      "additive": false,
      "overlapGroup": "cmux-app-size-campaign-2026-10"
    },
    {
      "id": "discussion-arm64-installed-target",
      "dimension": "campaign",
      "metric": "maintainer-comment Apple-silicon installed target",
      "direction": "baseline",
      "value": 248,
      "unit": "MB/app",
      "recurrence": "one-time",
      "confidence": "projected",
      "measurementWindow": "discussion comment 18874534 on 2026-10-12",
      "population": "next-release Apple-silicon target",
      "note": "Leo states 248 MB as a next-release target, not a receipt for the current installed app.",
      "headline": true,
      "additive": false,
      "overlapGroup": "cmux-app-size-campaign-2026-10"
    },
    {
      "id": "discussion-intel-installed-target",
      "dimension": "campaign",
      "metric": "maintainer-comment Intel installed target",
      "direction": "baseline",
      "value": 266,
      "unit": "MB/app",
      "recurrence": "one-time",
      "confidence": "projected",
      "measurementWindow": "discussion comment 18874534 on 2026-10-12",
      "population": "next-release Intel target",
      "note": "Leo states 266 MB as a next-release target, not a live Intel release receipt.",
      "headline": false,
      "additive": false,
      "overlapGroup": "cmux-app-size-campaign-2026-10"
    },
    {
      "id": "discussion-arm64-dmg-target",
      "dimension": "campaign",
      "metric": "maintainer-comment Apple-silicon DMG target",
      "direction": "baseline",
      "value": 79,
      "unit": "MB/DMG",
      "recurrence": "one-time",
      "confidence": "projected",
      "measurementWindow": "discussion comment 18874534 on 2026-10-12",
      "population": "next-release Apple-silicon DMG target",
      "note": "Leo states 79 MB as a next-release target; later #19255 ULMO output is a separate measured checkpoint.",
      "headline": false,
      "additive": false,
      "overlapGroup": "cmux-app-size-campaign-2026-10"
    },
    {
      "id": "discussion-intel-dmg-target",
      "dimension": "campaign",
      "metric": "maintainer-comment Intel DMG target",
      "direction": "baseline",
      "value": 93,
      "unit": "MB/DMG",
      "recurrence": "one-time",
      "confidence": "projected",
      "measurementWindow": "discussion comment 18874534 on 2026-10-12",
      "population": "next-release Intel DMG target",
      "note": "Leo states 93 MB as a next-release target; later #19255 ULMO output is a separate measured checkpoint.",
      "headline": false,
      "additive": false,
      "overlapGroup": "cmux-app-size-campaign-2026-10"
    },
    {
      "id": "stable-universal-installed-checkpoint",
      "dimension": "campaign",
      "metric": "measured stable universal installed checkpoint",
      "direction": "baseline",
      "value": 741.8,
      "unit": "MiB/app",
      "recurrence": "one-time",
      "confidence": "observed",
      "measurementWindow": "release run 38122582636 comment on PR 19255",
      "population": "signed universal stable app",
      "note": "Measured post-merge release checkpoint; do not treat as the 775 MB discussion baseline or sum with component claims.",
      "headline": false,
      "additive": false,
      "overlapGroup": "cmux-app-size-campaign-2026-10"
    },
    {
      "id": "stable-arm64-installed-checkpoint",
      "dimension": "campaign",
      "metric": "measured stable arm64 installed checkpoint",
      "direction": "baseline",
      "value": 461.3,
      "unit": "MiB/app",
      "recurrence": "one-time",
      "confidence": "observed",
      "measurementWindow": "release run 38122582636 comment on PR 19255",
      "population": "signed arm64 stable app",
      "note": "Measured post-merge release checkpoint; one Apple-silicon update reached this size.",
      "headline": false,
      "additive": false,
      "overlapGroup": "cmux-app-size-campaign-2026-10"
    },
    {
      "id": "stable-intel-installed-checkpoint",
      "dimension": "campaign",
      "metric": "measured stable Intel installed checkpoint",
      "direction": "baseline",
      "value": 481.9,
      "unit": "MiB/app",
      "recurrence": "one-time",
      "confidence": "observed",
      "measurementWindow": "release run 38122582636 comment on PR 19255",
      "population": "signed x86_64 stable app",
      "note": "Measured artifact checkpoint; native Intel update was not run live.",
      "headline": false,
      "additive": false,
      "overlapGroup": "cmux-app-size-campaign-2026-10"
    },
    {
      "id": "stable-universal-dmg-checkpoint",
      "dimension": "campaign",
      "metric": "measured stable universal ULMO DMG checkpoint",
      "direction": "baseline",
      "value": 238.9,
      "unit": "MB/DMG",
      "recurrence": "one-time",
      "confidence": "observed",
      "measurementWindow": "release run 38122582636 comment on PR 19255",
      "population": "signed universal ULMO DMG",
      "note": "Measured release artifact.",
      "headline": false,
      "additive": false,
      "overlapGroup": "cmux-app-size-campaign-2026-10"
    },
    {
      "id": "stable-arm64-dmg-checkpoint",
      "dimension": "campaign",
      "metric": "measured stable arm64 ULMO DMG checkpoint",
      "direction": "baseline",
      "value": 145,
      "unit": "MB/DMG",
      "recurrence": "one-time",
      "confidence": "observed",
      "measurementWindow": "release run 38122582636 comment on PR 19255",
      "population": "signed arm64 ULMO DMG",
      "note": "Measured release artifact.",
      "headline": false,
      "additive": false,
      "overlapGroup": "cmux-app-size-campaign-2026-10"
    },
    {
      "id": "stable-intel-dmg-checkpoint",
      "dimension": "campaign",
      "metric": "measured stable Intel ULMO DMG checkpoint",
      "direction": "baseline",
      "value": 160.8,
      "unit": "MB/DMG",
      "recurrence": "one-time",
      "confidence": "observed",
      "measurementWindow": "release run 38122582636 comment on PR 19255",
      "population": "signed x86_64 ULMO DMG",
      "note": "Measured release artifact; no native Intel update was run live.",
      "headline": false,
      "additive": false,
      "overlapGroup": "cmux-app-size-campaign-2026-10"
    }
  ]
}
---

# Why this record exists

Track the cmux app-size campaign from the 775 MB installed and 312 MB DMG discussion baseline through thin architecture-specific release checkpoints and the component-level optimization records.

The discussion baseline, maintainer targets, and post-merge release checkpoints are deliberately kept in separate claims. They are not an additive sum. Component records carry their own overlap groups and preserve main versus feat-cmux-next status.

The follow-up [PR 19733](https://github.com/manaflow-ai/cmux/pull/19733) supplies the first published nightly receipt for the feat-cmux-next fat-LTO chain: installed app 660.5 to 638.2 MB, DMG 191.2 to 187.7 MB, client 78.9 to 59.3 MB, and OptChat Chief 10.8 to 8.7 MB. These component and artifact values overlap [PR 19666](https://github.com/manaflow-ai/cmux/pull/19666), and the roughly two-minute release-link cost remains part of the tradeoff.

The campaign also retains two supersession checkpoints without creating duplicate headline records:

- [PR 19213](https://github.com/manaflow-ai/cmux/pull/19213) stripped the feat-cmux-next macOS SSH payloads. Its post-merge nightly proof measured 962.1 to 932.2 MiB installed, 289.7 to 285.5 MB DMG, x86_64 payload 94.2 to 79.1 MiB, and arm64 payload 86.9 to 72.0 MiB. This feature-branch receipt overlaps the main payload-strip work in [PR 19211](https://github.com/manaflow-ai/cmux/pull/19211) and is superseded by on-demand payload removal in [PR 19361](https://github.com/manaflow-ai/cmux/pull/19361) and its feat port [PR 19601](https://github.com/manaflow-ai/cmux/pull/19601).
- [PR 16732](https://github.com/manaflow-ai/cmux/pull/16732) measured the corrected CEF locale allowlist at 770,858,025 bytes installed, 35,562,084 bytes (about 33.9 MiB) smaller, and about 10.4 MiB smaller in its package zip. The build used a local-backend workaround; the earlier 36.46 MiB estimate was reduced after restoring regional catalogs. It is separate from CEF symbol stripping in [PR 20662](https://github.com/manaflow-ai/cmux/pull/20662).
- [PR 19222](https://github.com/manaflow-ai/cmux/pull/19222) enabled stable reuse of the notarization scripts for the later thin-release work. It has no standalone post-change size claim; the body only notes about 277 MiB of Intel code that an Apple-silicon universal app did not run.
