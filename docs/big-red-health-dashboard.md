# Big Red health dashboard

`/machine-health` is a private, lightweight health check for the Big Red Ubuntu workstation. It is deliberately smaller than a monitoring stack: one short-lived collector process, one compact POST per hour, and one Postgres row per run.

This change only provides the code and operating plan. It does **not** apply the database migration, set credentials, install a user service or timer, or deploy Scrapbook.

## What it answers

The page starts with the questions that matter when Leo is away from the machine:

- Is the snapshot fresh, and did a configured guardrail trip?
- Are hourly CPU/memory/network/disk activity, Linux resource pressure, root capacity, peak sensor temperature, and the readable iGPU activity clock moving in a bad direction?
- Are SSH, Tailscale, NetworkManager, GNOME Remote Desktop, and time sync active?
- Is automatic idle suspend still disabled while deliberate lid-close suspend remains available, and are hibernate targets still masked?
- Is the machine on AC, what is the aggregate battery state, and are there failed systemd units, unexpected development listeners, excess browser memory, or active RDP connections?
- Is the unique macOS remote client offline, online but idle, direct, relayed, or unknown?
- Did the current GNOME Remote Desktop process initialize its Vulkan/VA-API path, fall back to software, or not yet receive an RDP session?
- What desktop state is active now: GNOME version, pixel mode, refresh, scale, screen-shield state,
  animation state, and configured mirror/extend mode?
- How many agent routes, jobs, and descendant processes are explicitly owned, how much RSS do they account for, and did any ownership record become unknown or leave residue?
- How much local Codex state is allocated, how much is active or unknown, did the scan finish cleanly, and how did the total change over seven days?

The dashboard defaults to 24 hourly bins and offers 7- and 30-day daily rollups. Its time control starts in the browser's own time zone and can switch to UTC. Browser/Codex counts, tagged route/process counts, aggregate memory, and the active RDP connection count stay coarse. The current workspace view also splits hook-owned execution into chat roots, main-root jobs, subagent jobs, processes, and memory. It keeps opaque route and agent IDs out of the snapshot.

Each stored row also carries its accounting source, interval count, window length, and uptime. The activity footer therefore distinguishes full sysstat windows, partial coverage, point-sample fallbacks, and reboot discontinuities instead of drawing equally authoritative bars from unlike data.

This is not literal Screen Time. Each row combines an hourly aggregate with a few current point observations, so the UI leaves empty bins visible and never implies that a process ran continuously between reports.

## Privacy boundary

The ingestion schema is an allowlist and strips unknown keys at every object level. The collector never emits:

- IP addresses, interface names, SSIDs, routes, or open port numbers (network throughput is summed across non-loopback interfaces);
- Tailscale peer names, identities, tailnet addresses, current endpoints, or relay regions;
- process IDs, route IDs, executable paths, command arguments, environment variables, or package lists;
- browser URLs, titles, history, cookies, profiles, tab contents, or per-process memory;
- usernames, home-directory paths, serial numbers, or raw command output.

The collector parses local command output and emits only enum values, booleans, percentages, byte totals, and aggregate counts. Its legacy Codex count observes code-mode worker leaves while excluding persistent desktop and remote-control daemons. The route view calls the v2 ownership tool's aggregate `status` contract; the process-tag view calls the hook adapter's aggregate `status` contract. Scrapbook does not repeat either cgroup classifier or read route receipts directly. It checks the root/job/process/memory sums before accepting a tag snapshot. Malformed, missing, inconsistent, or version-mismatched status becomes `unavailable` instead of a guessed zero. Browser RSS sums the browser process trees and is a trend signal rather than unique physical memory because shared pages can appear in more than one process. RDP visibility counts established local connections without emitting the peer or endpoint.

The desktop readout calls the repository-owned GNOME polish snapshot and keeps only version, pixel
dimensions, refresh, logical scale, screen-shield state, animation state, and mirror/extend mode.
Wallpaper names, URIs, settings outside that allowlist, desktop-entry identities, asset hashes, and
raw command output are dropped. It is a current readout, not another history chart or alert.
A direct live GNOME receipt took 0.28 seconds and 32,680 KiB peak RSS. The complete collector took
11.40 seconds and 53,428 KiB peak RSS in the final print-only check; its compact payload was 5,319
bytes. The existing Codex-state scan still dominates the hourly run.

The Codex-state view calls `leo-workspace/tools/codex_state_inventory.py` in aggregate mode. The accepted contract opens no content files, uses no network or privileged process reads, mutates nothing, and has no retention authority. Scrapbook reconciles class, file, and allocated-byte totals before accepting active, authoritative, manifest-referenced, and unknown buckets. Any nonzero reclaimable or reconstructible total is rejected because the current inventory contract has not earned cleanup authority. Paths, file names, manifests, process identities, and content never enter the report.

Remote-client state is derived from the same local `tailscale status --json` read used for Big Red's own state. Exactly one macOS peer is required; zero or multiple candidates become unavailable. The report emits only `offline`, `online-idle`, `direct`, `relay`, or `unknown`, plus a last-seen age. Direct requires an active peer with a current endpoint; relay requires an active peer with relay evidence. Host names, node keys, addresses, tailnet IPs, relay regions, traffic totals, and timestamps never enter the report. The public repository contains the contract and collector code, but no machine snapshot or credential.

RDP acceleration state is bound to the current `gnome-remote-desktop.service` invocation. The collector reads at most 512 journal records for that invocation and emits one enum: `hardware-ready` after both Vulkan and VA-API initialize, `software-fallback` after the latest relevant failure, `awaiting-session` when Vulkan is ready but no VA-API session attempt exists, or `unknown`. A new daemon invocation cannot inherit an old failure. Invocation IDs, journal messages, driver strings, client capabilities, endpoints, and timestamps never enter the report. `hardware-ready` proves initialization, not rendered frame rate, codec selection, or end-to-end latency.

## Frequency, history, and cost

The default proposal is one report per hour, with manual runs whenever a change needs a before/after check.

- The server reads 60 days so equal-window comparisons have a prior period; the dashboard shows
  24-hour, 7-day, and 30-day views.
- Every successful ingest deletes samples older than 90 days, so retention needs no second scheduled job.
- Retry posts with the same host and timestamp update one sample instead of duplicating it, and an older delayed report cannot replace the latest status row.
- The current exact-head live report measured 3,987 bytes as compact JSON and 5,015 bytes pretty-printed. Ninety days at hourly frequency is 2,160 rows and roughly 8.2 MiB of raw compact payload; a conservative database budget remains under 20 MiB after allowing for JSONB, scalar columns, row overhead, and the index.
- The page has a manual refresh control and refreshes its server data once per hour while the tab is visible. Returning to a tab refreshes it only when the last page refresh is at least an hour old.

Big Red already runs Ubuntu's `sysstat` accounting every 10 minutes. The collector reuses the six newest records to produce time-weighted 60-minute averages for CPU, memory, aggregate non-loopback network throughput, and non-loop disk I/O, plus CPU/memory/I/O [Pressure Stall Information](https://docs.kernel.org/accounting/psi.html). It emits only the aggregate result; host names, device names, and interface names parsed from `sadf` never enter the report. If readable accounting data is unavailable, the collector fails soft to the original 250 ms `/proc` point sample and labels the source accordingly.

The reuse path has no new resident process. A five-run same-machine comparison measured 934 ms mean before route status and 945 ms after it, a 10.5 ms difference inside the observed run-to-run spread. The compact payload grew by 181 bytes. Existing local sysstat history occupied 624 KiB after about 15 hours, independent of this dashboard.

The process-tag status read added 348 bytes to the compact live payload and took 26.6 ms median
across 15 idle reads, with a 25.8–32.4 ms observed range. It adds one bounded local `systemctl` query
to each hourly report and no sampler or resident process. A physical two-context canary placed one
main-root scope and one subagent scope under the same opaque chat root. The adapter and collector
both reported 1 root, 1 main bucket, 1 subagent, 2 jobs, 2 processes, exact matching memory sums and
zero unknown jobs. Both scopes exited normally and `--collect` left zero matching units.

The accepted fields come from the agent-aware hook contract in leo-workspace PR 78. Until that
contract reaches canonical `leo-workspace`, the collector returns `unavailable`; it does not infer
agent ownership from the older aggregate.

The exact-head collector took 10.43 seconds and 54,208 KiB peak RSS in a live print-only run. The Codex-state scan accounted for 8.70 seconds and returned 1.73 GiB across 9,792 files and 48 classes. One hourly run is about 0.3% duty cycle, with no resident process between reports. The source marked process evidence partial, split the bytes between active and unknown, and reported zero reclaimable bytes with retention authority false. The dashboard displays those facts and the seven-day total-size delta without treating growth as an alert.

Remote-client classification reuses the existing Tailscale status document, so it adds no second Tailscale command or network probe. Acceleration classification adds two bounded local reads: the service invocation ID and up to 512 journal records from that invocation. Those two reads took 5.1 ms median and 8.1 ms maximum across 20 live probes.

Route activity, process tags, and Codex state are point observations at report time. The hygiene panel shows exact-scoped versus discoverable Codex processes beside active routes, jobs, tagged descendants, aggregate memory, residue, unknown ownership records, and local state growth. Hook tags add main-root and subagent rollups without exposing their identities. Historical bins show the highest lease-tagged process count observed in each hour or day; they do not imply continuous runtime between reports. Token-route activity remains a separate previous-complete-hour measurement because it answers a different question.

Build/cache state and Codex state are gauges rather than activity totals. Their charts keep the
highest observed value in each hour or day and compare the current range high with the same-length
prior range. Missing source data stays empty instead of becoming zero. The existing current value
and seven-day point delta remain in Workspace hygiene; the charts show when growth or cleanup was
observed.

An independent `sar` read of the same six intervals reconciled the collector output after rounding: CPU 7.25%, memory 12.44%, network 0.059/0.045 MiB/s, disk 1.989/11.043 MiB/s, and PSI CPU/memory/I/O 0.193/0.015/0.345%. The Python regression test separately verifies interval weighting, loopback/loop-device exclusion, UTC handling, and the labeled point-sample fallback.

The collector also reads battery/AC state and the Intel iGPU's current/max activity clocks from sysfs when those files are available. Big Red does not currently expose a user-readable GPU busy percentage, so the dashboard labels the clock honestly and does not invent utilization or install another package.

These are operator thresholds rather than hardware safety limits:

- root disk at 80%: watch; at 90%: attention;
- memory at 90%: watch;
- any failed system or user unit: attention;
- anything other than full NetworkManager connectivity or running Tailscale: watch;
- GNOME Remote Desktop present but not active: watch;
- current GNOME Remote Desktop invocation reports software fallback: watch;
- automatic idle suspend no longer disabled on AC or battery: watch;
- hibernate or hybrid-sleep no longer masked: watch;
- any detected development listener: watch;
- unavailable route ownership status, any residue job, or any unknown route/job record: watch;
- report older than 3 hours: watch.

CPU/memory peaks, disk/network throughput, PSI, load, and the iGPU clock are displayed but do not yet alert. Pressure is a better contention signal than utilization alone, but thresholds should be based on an observed Big Red baseline instead of imported folklore.

## Website configuration

Apply `drizzle/0016_machine_health.sql` and `drizzle/0017_machine_health_hygiene.sql` in order
through the normal Scrapbook migration process, then set:

```text
MACHINE_HEALTH_INGEST_SECRET=<long random ingest-only secret>
MACHINE_HEALTH_DASHBOARD_TOKEN=<private read token>
```

The dashboard token may be omitted if the existing `PROXY_DASHBOARD_TOKEN` should unlock both private operations pages. The signed cookies remain different and path-scoped. The ingest credential has no fallback to the proxy credential.

Paths:

```text
GET  /machine-health/access
GET  /machine-health
POST /api/machine-health/ingest
```

Production `/machine-health` verifies its signed, seven-day HttpOnly cookie before reading the database. Invalid or unconfigured access returns the ordinary not-found page. The access form sends the token in a POST body rather than a query string.

Ingestion accepts reports no more than 48 hours old and no more than 10 minutes in the future. The collector refuses to send its credential over plain HTTP except to loopback during local testing.
It refuses every redirect, so a response cannot forward the ingest bearer token to another origin
or downgrade an HTTPS request to HTTP.

## Manual collector check

From the Scrapbook checkout on Big Red:

```bash
scripts/big-red-health-report.py --print-only
```

This performs read-only local checks, prints the exact sanitized payload, and never sends it. With
neither reporting environment variable set, the default invocation also prints locally and sends
nothing. A configured successful send is quiet, so the hourly service does not copy every snapshot
into the user journal.

The route section expects the authoritative helper at `~/Projects/leo-workspace/tools/codex_route_job.py`. If it is absent, fails, or changes its aggregate contract, the report marks route activity unavailable. Restoring that exact helper restores the section; no dashboard-side ownership fallback exists.

The Codex-state section expects `~/Projects/leo-workspace/tools/codex_state_inventory.py`. Missing, slow, malformed, privileged, mutating, or cleanup-authoritative output becomes unavailable. The collector allows 12 seconds for this read and rejects output above 64 KiB.

After the website migration, secrets, and deployment are separately approved, a one-time post would use:

```bash
MACHINE_HEALTH_INGEST_URL=https://teamleaderleo.com/api/machine-health/ingest \
MACHINE_HEALTH_INGEST_SECRET='<ingest secret>' \
scripts/big-red-health-report.py
```

## Proposed user timer — not installed

Keep scheduling in Leo's user session so the collector never needs root and exits after each report. A later authorized installation can copy the script to `~/.local/bin/big-red-health-report`, put the two reporting variables in a mode-`0600` environment file, and install these user units:

```ini
# ~/.config/systemd/user/big-red-health-report.service
[Unit]
Description=Send a sanitized Big Red health snapshot
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
EnvironmentFile=%h/.config/big-red-health.env
ExecStart=%h/.local/bin/big-red-health-report
```

```ini
# ~/.config/systemd/user/big-red-health-report.timer
[Unit]
Description=Take an hourly Big Red health snapshot

[Timer]
OnCalendar=hourly
RandomizedDelaySec=10m
Persistent=true

[Install]
WantedBy=timers.target
```

The randomized delay avoids making the exact workstation schedule externally visible. A manual-only first phase is also viable if hourly history is not useful enough to justify automation.

## Rollback

Each layer can be removed independently:

1. Disable and remove the user timer/service, collector copy, and local environment file. This stops all new reports without affecting the workstation's network or power configuration.
2. Remove the website environment variables and deploy. The access and ingest routes become unavailable.
3. Revert the route-activity fields to remove only the ownership view, or remove the route, component, store, collector, and documentation files to retire the complete dashboard.
4. Only if history should be erased, separately approve dropping `machine_health_status` and `machine_health_samples`. Leaving the tiny, inaccessible tables in place is the more reversible default.

No rollback step requires firmware, boot, disk, network, login, SSH, Tailscale, or sleep-policy changes.

## Related finding

The existing proxy-dashboard documentation says production verifies its signed access cookie, but the current `/proxy-dashboard` page does not call `hasProxyDashboardAccess`. The machine-health route performs that check correctly. Fixing the older route should be reviewed as a separate narrow security change rather than bundled silently into this feature.
