# Big Red health dashboard

`/machine-health` is a private, lightweight health check for the Big Red Ubuntu workstation. It is deliberately smaller than a monitoring stack: one short-lived collector process, one compact POST per hour, and one Postgres row per run.

This change only provides the code and operating plan. It does **not** apply the database migration, set credentials, install a user service or timer, or deploy Scrapbook.

## What it answers

The page starts with the questions that matter when Leo is away from the machine:

- Is the snapshot fresh, and did a configured guardrail trip?
- Are hourly CPU/memory/network/disk activity, Linux resource pressure, root capacity, peak sensor temperature, and the readable iGPU activity clock moving in a bad direction?
- Are SSH, Tailscale, NetworkManager, and time sync active?
- Is automatic idle suspend still disabled while deliberate lid-close suspend remains available, and are hibernate targets still masked?
- Is the machine on AC, what is the aggregate battery state, and are there failed systemd units, unexpected development listeners, or an implausible number of browser/Codex roots?

The dashboard defaults to 24 hourly bins and offers 7- and 30-day daily rollups. Its time control starts in the browser's own time zone and can switch to UTC. Browser/Codex counts are intentionally coarse. They support cleanup without turning the dashboard into process surveillance.

Each stored row also carries its accounting source, interval count, window length, and uptime. The activity footer therefore distinguishes full sysstat windows, partial coverage, point-sample fallbacks, and reboot discontinuities instead of drawing equally authoritative bars from unlike data.

This is not literal Screen Time. Each row combines an hourly aggregate with a few current point observations, so the UI leaves empty bins visible and never implies that a process ran continuously between reports.

## Privacy boundary

The ingestion schema is an allowlist and strips unknown keys at every object level. The collector never emits:

- IP addresses, interface names, SSIDs, routes, or open port numbers (network throughput is summed across non-loopback interfaces);
- Tailscale peer names, identities, or tailnet addresses;
- process IDs, executable paths, command arguments, environment variables, or package lists;
- browser URLs, titles, history, cookies, profiles, or tab contents;
- usernames, home-directory paths, serial numbers, or raw command output.

The collector parses local command output and emits only enum values, booleans, percentages, and aggregate counts. Its Codex count observes code-mode worker leaves while excluding persistent desktop and remote-control daemons. The public repository contains the contract and collector code, but no machine snapshot or credential.

## Frequency, history, and cost

The default proposal is one report per hour, with manual runs whenever a change needs a before/after check.

- The dashboard reads the latest 30 days and offers 24-hour, 7-day, and 30-day views.
- Every successful ingest deletes samples older than 90 days, so retention needs no second scheduled job.
- Retry posts with the same host and timestamp update one sample instead of duplicating it, and an older delayed report cannot replace the latest status row.
- A measured expanded report is 1,205 bytes as compact JSON and 1,557 bytes pretty-printed. Ninety days at hourly frequency is 2,160 rows and roughly 2.5 MiB of raw compact payload; a conservative database budget remains under 12 MiB after allowing for JSONB, scalar columns, row overhead, and the index.
- There is no daemon, polling loop, Prometheus, Grafana, log drain, or client-side refresh.

Big Red already runs Ubuntu's `sysstat` accounting every 10 minutes. The collector reuses the six newest records to produce time-weighted 60-minute averages for CPU, memory, aggregate non-loopback network throughput, and non-loop disk I/O, plus CPU/memory/I/O [Pressure Stall Information](https://docs.kernel.org/accounting/psi.html). It emits only the aggregate result; host names, device names, and interface names parsed from `sadf` never enter the report. If readable accounting data is unavailable, the collector fails soft to the original 250 ms `/proc` point sample and labels the source accordingly.

The reuse path has no new resident process. In a five-run live comparison, the original collector took 0.50–0.56 seconds; the optimized collector had a 0.36-second median with no mandatory sleep. The underlying `sadf` extraction itself completed in under 0.01 seconds. Existing local sysstat history occupied 624 KiB after about 15 hours, independent of this dashboard.

An independent `sar` read of the same six intervals reconciled the collector output after rounding: CPU 7.25%, memory 12.44%, network 0.059/0.045 MiB/s, disk 1.989/11.043 MiB/s, and PSI CPU/memory/I/O 0.193/0.015/0.345%. The Python regression test separately verifies interval weighting, loopback/loop-device exclusion, UTC handling, and the labeled point-sample fallback.

The collector also reads battery/AC state and the Intel iGPU's current/max activity clocks from sysfs when those files are available. Big Red does not currently expose a user-readable GPU busy percentage, so the dashboard labels the clock honestly and does not invent utilization or install another package.

These are operator thresholds rather than hardware safety limits:

- root disk at 80%: watch; at 90%: attention;
- memory at 90%: watch;
- any failed system or user unit: attention;
- anything other than full NetworkManager connectivity or running Tailscale: watch;
- automatic idle suspend no longer disabled on AC or battery: watch;
- hibernate or hybrid-sleep no longer masked: watch;
- any detected development listener: watch;
- report older than 3 hours: watch.

CPU/memory peaks, disk/network throughput, PSI, load, and the iGPU clock are displayed but do not yet alert. Pressure is a better contention signal than utilization alone, but thresholds should be based on an observed Big Red baseline instead of imported folklore.

## Website configuration

Apply `drizzle/0016_machine_health.sql` through the normal Scrapbook migration process, then set:

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

## Manual collector check

From the Scrapbook checkout on Big Red:

```bash
scripts/big-red-health-report.py --print-only
```

This performs read-only local checks, prints the exact sanitized payload, and never sends it. With neither reporting environment variable set, the default invocation also stays local.

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
3. Remove the route, component, store, collector, and documentation files in a revert commit.
4. Only if history should be erased, separately approve dropping `machine_health_status` and `machine_health_samples`. Leaving the tiny, inaccessible tables in place is the more reversible default.

No rollback step requires firmware, boot, disk, network, login, SSH, Tailscale, or sleep-policy changes.

## Related finding

The existing proxy-dashboard documentation says production verifies its signed access cookie, but the current `/proxy-dashboard` page does not call `hasProxyDashboardAccess`. The machine-health route performs that check correctly. Fixing the older route should be reviewed as a separate narrow security change rather than bundled silently into this feature.
