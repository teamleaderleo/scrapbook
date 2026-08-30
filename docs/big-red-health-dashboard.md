# Big Red health dashboard

`/machine-health` is a private, lightweight health check for the Big Red Ubuntu workstation. One short-lived collector sends a compact hourly health report. Codex token accounting uses one row per device and complete UTC hour so Big Red and the MacBook Air can share the same view.

This change only provides the code and operating plan. It does **not** apply the database migration, set credentials, install a user service or timer, or deploy Scrapbook.

## What it answers

The page starts with the questions that matter when Leo is away from the machine:

- Is the snapshot fresh, and did a configured guardrail trip?
- Are hourly CPU/memory/network/disk activity, current whole-machine swap occupancy, Linux resource pressure, root capacity, peak sensor temperature, the readable iGPU activity clock, and sampled physical-panel state moving in a bad direction?
- Are SSH, Tailscale, NetworkManager, GNOME Remote Desktop, and time sync active?
- Is automatic idle suspend still disabled while deliberate lid-close suspend remains available, and are hibernate targets still masked?
- Is the machine on AC, what is the aggregate battery state, and are there failed systemd units, unexpected development listeners, excess browser memory, or active RDP connections?
- Is the unique macOS remote client offline, online but idle, direct, relayed, or unknown, and what
  one-shot path RTT did Big Red observe while that peer was active?
- Is GNOME's idle screen shield blocking new desktop-sharing sessions, and how many source-matched
  admission blocks occurred in the last 24 hours?
- Is the Beryl reachable, are Tailscale/OpenClash running with Netify inactive, what do its
  thermal and memory receipts show, and what does Big Red's bounded local Wi-Fi/gateway sample show?
- Did the current GNOME Remote Desktop process initialize its Vulkan/VA-API path, fall back to software, or not yet receive an RDP session?
- What desktop state is active now: GNOME version, pixel mode, refresh, scale, screen-shield and
  physical-backlight state, saved animation preference, and configured mirror/extend mode?
- How many agent routes, jobs, and descendant processes are explicitly owned, how much RSS do they account for, and did any ownership record become unknown or leave residue?
- How much local Codex state is allocated, how much is active or unknown, did the scan finish cleanly, and how did the total change over seven days?
- How many Codex tokens came from Big Red and the MacBook Air, and what share of input was served from cache?

The dashboard defaults to the last 10 complete hourly bins and also offers 24-hour, 7-day, and
30-day views. Every token range ends at the last complete UTC hour; the long views group the same
hours into rolling 24-hour bars instead of replacing them with partial calendar days. UTC fixes the
storage boundary, while the browser's time zone changes only the labels. Token cards sum the
selected device-hour records. Cached input percent is `cached_input_tokens / input_tokens`; the
card shows the exact counts with the percentage. The source line shows how many complete
source-hours each device supplied. Browser/Codex counts, tagged route/process counts,
aggregate memory, and the active RDP connection count stay coarse. The current workspace view also
splits hook-owned execution into chat roots, main-root jobs, subagent jobs, processes, and memory. It
keeps opaque route and agent IDs out of the snapshot.

Codex runtime PSS is also a historical gauge. Each hour or day keeps the highest complete
proportional-memory receipt and runtime process count observed in that bin, then compares the range
high with the same-length prior range. A failed proportional-memory read stays empty rather than
mixing RSS into the PSS series. The current card can still fall back to RSS and labels that fallback.

Each stored row also carries its accounting source, interval count, window length, and uptime. The
activity charts mark the exact bins containing partial coverage, point-sample fallbacks and reboot
discontinuities with distinct line/shape cues that do not rely on color. The footer keeps the range
totals. This avoids drawing equally authoritative bars from unlike data.

This is not literal Screen Time. Each row combines an hourly aggregate with a few current point observations, so the UI leaves empty bins visible and never implies that a process ran continuously between reports. The panel chart reports the share of authoritative physical-backlight snapshots observed on. It weights the range by snapshots, shows on/off/unknown counts, and never converts missing states into off time.

## Privacy boundary

The ingestion schema is an allowlist and strips unknown keys at every object level. The collector never emits:

- IP addresses, interface names, SSIDs, routes, or open port numbers (network throughput is summed across non-loopback interfaces);
- Tailscale peer names, identities, tailnet addresses, current endpoints, or relay regions;
- process IDs, route IDs, executable paths, command arguments, environment variables, or package lists;
- browser URLs, titles, history, cookies, profiles, tab contents, or per-process memory;
- usernames, home-directory paths, serial numbers, or raw command output.

The collector parses local command output and emits only enum values, booleans, percentages, byte totals, and aggregate counts. Its legacy Codex count observes code-mode worker leaves while excluding persistent desktop and remote-control daemons. The route view calls the v2 ownership tool's aggregate `status` contract; the process-tag view calls the hook adapter's aggregate `status` contract. Scrapbook does not repeat either cgroup classifier or read route receipts directly. It checks the root/job/process/memory sums before accepting a tag snapshot. Malformed, missing, inconsistent, or version-mismatched status becomes `unavailable` instead of a guessed zero. Browser RSS sums the browser process trees and is a trend signal rather than unique physical memory because shared pages can appear in more than one process. RDP visibility counts established local connections without emitting the peer or endpoint.

Whole-machine swap occupancy comes from `SwapTotal` and `SwapFree` in `/proc/meminfo` and is a point-in-time capacity gauge. The Memory card keeps it beside RAM use and PSI rather than treating occupied swap as active contention. Older stored snapshots show the swap value as unavailable.

An unavailable process-tag receipt carries one bounded local diagnosis: `helper-missing`,
`helper-failed`, `schema-mismatch`, or `invalid-receipt`. The card renders that reason instead of
treating absent or old helper output as zero tagged work. Older stored reports without a reason
remain valid. The report never emits the helper path, stderr, command, unit name, route identity,
process identity, or raw receipt.

Token reports never send session IDs. Each reporter HMACs the local session ID with the shared
ingest secret and sends a truncated 128-bit fingerprint used only for collision detection. A retry
with the same or a newer collection timestamp replaces the same source-hour row; a delayed older
retry is ignored and reported as such by the ingest response. If Big Red and the MacBook Air report
the same session in the same hour, the later source-hour is marked `overlap-skipped` and omitted from
totals instead of being counted twice. A report without complete fingerprint evidence is marked
`unverified-skipped`. The dashboard shows the skipped source-hour count. Fingerprints are not
returned by the dashboard query.

The source-hour primary key is device plus absolute UTC start time. Report validation compares
parsed instants, so two offset spellings of the same hour cannot enter one bulk insert as duplicate
keys. Every counter must also fit in JavaScript's safe integer range before PostgreSQL receives it;
this keeps exact token counts from becoming rounded JSON numbers.

A content-blind Aug. 30 arithmetic audit checked 40,975 valid local `last_token_usage` events. Every
event satisfied cached input ≤ input and reasoning output ≤ output. `total_tokens` equaled input plus
output for 40,631 events (99.160%); 344 events used a different logged total. The dashboard therefore
keeps `total_tokens` as the source's authoritative total and calculates cache share separately as
the weighted `sum(cached_input_tokens) / sum(input_tokens)`. It does not reconstruct total usage from
the component counters.

The desktop readout calls the repository-owned GNOME polish snapshot and keeps only version, pixel
dimensions, refresh, logical scale, screen-shield state, saved animation preference, mirror/extend
mode, and one boolean stating whether both configured wallpaper files are readable. GNOME Remote
Desktop 50.2 separately asks Mutter to disable animations on its remote-access handle, and GNOME
Shell 50.1 inhibits Shell/St animations until that handle stops. The dashboard therefore labels
the saved value `motion pref`; it does not misreport the temporary effective remote-session state
or imply that every application and web page follows the compositor inhibition. A separate bounded sysfs
receipt reduces one to sixteen backlights to `on`, `off`, or `unknown` plus their maximum actual
brightness percentage. Any missing, malformed, out-of-range, or partially unreadable device makes
that receipt unavailable. No device or connector name survives. Older stored reports omit the
backlight and wallpaper fields instead of being relabeled. The current card shows the latest
receipt; the activity chart derives nullable on/off samples from the same stored payloads.

Animation sources: GNOME Remote Desktop
[`grd-session.c`](https://gitlab.gnome.org/GNOME/gnome-remote-desktop/-/blob/60423c896a54e3eacb65bd93167e91c1ce5e648c/src/grd-session.c),
Mutter
[`meta-screen-cast-session.c`](https://gitlab.gnome.org/GNOME/mutter/-/blob/8e9bb806da4a6a4fc87aa4a481b228dba6735cbd/src/backends/meta-screen-cast-session.c),
and GNOME Shell
[`main.js`](https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/e0fdc4c13250e9a9b8ea9594c83925274f4a5dca/js/ui/main.js).
A direct live GNOME receipt took 0.28 seconds and 32,680 KiB peak RSS. A current print-only
collector observation with the backlight receipt took 3.94 seconds and 64,384 KiB peak RSS; its
compact payload was 6,494 bytes. The existing Codex-state scan still dominates the hourly run.

The Codex-state view calls `leo-workspace/tools/codex_state_inventory.py` in aggregate mode. The accepted contract opens no content files, uses no network or privileged process reads, mutates nothing, and has no retention authority. Scrapbook reconciles class, file, and allocated-byte totals before accepting active, authoritative, manifest-referenced, and unknown buckets. Any nonzero reclaimable or reconstructible total is rejected because the current inventory contract has not earned cleanup authority. Paths, file names, manifests, process identities, and content never enter the report.

The Codex runtime readout follows descendants of two closed control-root shapes: the packaged
ChatGPT desktop root and Codex app servers from the packaged or standalone release paths. Nested
control roots are collapsed before aggregation. It reports only root, process, code-host and MCP
counts plus aggregate RSS, proportional set size, swap and memory-read errors. Proportional memory
is preferred on the card because RSS double-counts shared Node and Chromium pages. The tree is a
resource budget, not route ownership or cleanup authority; active tools and shared infrastructure
remain in the same total. PIDs, paths, arguments, thread IDs and per-process values are discarded.
The first live receipt found two control roots, 69 processes, 13 code hosts and 36 MCP servers:
2,318,140,416 proportional bytes, 3,706,445,824 RSS bytes and 1,533,861,888 swapped bytes with zero
memory-read errors while whole-machine memory use was 10.92%. That supports visibility, not cleanup;
the route registry simultaneously reported zero owned residue.

An additive class receipt splits the already-admitted runtime tree into control processes,
code-mode hosts, MCP servers and other descendants. It emits only process, RSS, PSS and swap totals
for those four fixed buckets. Counts and RSS always reconcile to the runtime total. One failed
`smaps_rollup` read withholds every class PSS and swap value; the consumer rejects partial or
inconsistent sums. Historical reports without the optional class object remain valid.

A bounded live verification made the distinction useful. With the route-owned Next development
server and browser verifier open, the tree held 94 processes and 3,142,606,848 PSS bytes; the
`other` bucket alone held 1,636,202,496 bytes. Closing both reduced the next complete receipt to 83
processes and 2,025,950,208 PSS bytes, with `other` at 506,767,360 bytes. The 11-process /
1,116,656,640-byte drop is evidence that the fixed class catches temporary route tooling. It does
not identify a chat, declare the remaining processes idle, or authorize signaling them.

The 24-hour reliability readout counts structured systemd core-dump exits and automatic restart
events. It partitions both totals into the GNOME desktop-search indexer and all other services,
then discards unit names, messages, exit statuses, timestamps, and invocation identifiers. A
nonzero ordinary exit is not a crash: the live route-lease matrix includes deliberate status-7
failure arms, and those remain outside this metric. Older stored snapshots retain their aggregate
crash and restart totals without a retroactive classification.

The Remote card treats an active GNOME screen shield with no current RDP socket as an admission
action, not a network failure. It shows `Wake screen` beside the independently measured Mac path.
The 24-hour session summary counts only the exact `Session creation inhibited` GRD error as an
admission block; older snapshots omit that counter. The dashboard does not clear the shield itself.

Remote-client state is derived from the same local `tailscale status --json` read used for Big Red's own state. Exactly one macOS peer is required; zero or multiple candidates become unavailable. The report emits only `offline`, `online-idle`, `direct`, `relay`, or `unknown`, plus a last-seen age when Tailscale supplies a nonzero timestamp. Direct requires an active peer with a current endpoint; relay requires an active peer with relay evidence. When that peer is already active, the collector adds one bounded Tailscale disco ping and keeps only its coarse path class and RTT. It skips the probe for offline and idle peers, so the observer does not manufacture an active path or keep a sleeping Mac busy. The RTT is Big Red-to-Mac transport evidence, not Windows App, decoder, display, or input-to-paint latency. Host names, node keys, addresses, tailnet IPs, endpoints, relay regions, traffic totals, and timestamps never enter the report. The public repository contains the contract and collector code, but no machine snapshot or credential.

The Remote card prefers that measured ping path when it exists and falls back to the status class
otherwise. This keeps the current card and history chart consistent during endpoint churn. One ping
describes the observed path; it does not satisfy the multi-sample direct-path gate used by an RDP
quality trial.

The Remote card also summarizes the last 24 hours of GNOME Remote Desktop session endings. It keeps
only bounded counts for total endings, transport endings, user logoffs, and server disconnects.
GNOME labels the common transport ending as network or intentional, so the count is evidence for a
reconnect investigation rather than a fault verdict. Journal text and event timestamps are discarded.

RDP acceleration state is bound to the current `gnome-remote-desktop.service` invocation. The collector reads at most 512 journal records for that invocation and emits one enum: `hardware-ready` after both Vulkan and VA-API initialize, `software-fallback` after the latest relevant failure, `awaiting-session` when Vulkan is ready but no VA-API session attempt exists, or `unknown`. A new daemon invocation cannot inherit an old failure. Invocation IDs, journal messages, driver strings, client capabilities, endpoints, and timestamps never enter the report. `hardware-ready` proves initialization, not rendered frame rate, codec selection, or end-to-end latency.

## Frequency, history, and cost

The default proposal is one report per hour, with manual runs whenever a change needs a before/after check.

- The server reads 60 days so equal-window comparisons have a prior period; the dashboard shows
  24-hour, 7-day, and 30-day views.
- Every successful ingest deletes samples older than 90 days, so retention needs no second scheduled job.
- Retry posts with the same host and timestamp update one sample instead of duplicating it, and an older delayed report cannot replace the latest status row.
- The current exact-head live report measured 3,987 bytes as compact JSON and 5,015 bytes pretty-printed. Ninety days at hourly frequency is 2,160 rows and roughly 8.2 MiB of raw compact payload; a conservative database budget remains under 20 MiB after allowing for JSONB, scalar columns, row overhead, and the index.
- The page has a manual refresh control and refreshes its server data once per hour while the tab is visible. Returning to a tab refreshes it only when the last page refresh is at least an hour old.

A live 30-day Big Red token backfill scanned 720 complete hours in 2.24 seconds at 50,704 KiB peak
RSS. Its compact report was 244,226 bytes, below the 512 KiB ingest limit; only 24 hours contained
model calls. Routine runs scan from the last successful hour and exit after posting.

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

Remote-client classification reuses the existing Tailscale status document. An already-active unique
Mac peer receives one optional Tailscale disco ping with a two-second per-probe timeout inside the
collector's four-second command cap; offline, idle, ambiguous, failed, and malformed cases expose no
RTT. Acceleration classification adds two bounded local reads: the service invocation ID and up to
512 journal records from that invocation. Those two reads took 5.1 ms median and 8.1 ms maximum
across 20 live probes.

Route activity, process tags, and Codex state are point observations at report time. The hygiene panel shows exact-scoped versus discoverable Codex processes beside active routes, jobs, tagged descendants, aggregate memory, residue, unknown ownership records, and local state growth. Hook tags add main-root and subagent rollups without exposing their identities. Historical bins show the highest lease-tagged process count observed in each hour or day; they do not imply continuous runtime between reports. Token usage is stored by source and complete hour, summed across Big Red and the MacBook Air, and deduplicated on source plus hour. Full-history subagent forks replay old session events at creation; both collectors drop that startup replay before accounting so a fork cannot manufacture a token spike.

An Aug. 29 live reconciliation covered the ten complete hours ending at 22:00 UTC. The raw session
sum was 2,184,178,104 tokens, but 7,077 counter events came from two full-history fork startup
replays. Removing those replays left 1,235,555,859 tokens across 8,992 counter events, with a
seven-route hourly high. Cached input was 1,204,553,728 of 1,229,555,057 input tokens, or 97.97%.
The test fixture reproduces the fork shape so the inflated result cannot quietly return.

Build/cache state and Codex state are gauges rather than activity totals. Their charts keep the
highest observed value in each hour or day and compare the current range high with the same-length
prior range. Missing source data stays empty instead of becoming zero. The existing current value
and seven-day point delta remain in Workspace hygiene; the charts show when growth or cleanup was
observed.

An independent `sar` read of the same six intervals reconciled the collector output after rounding:
CPU 7.25%, memory 12.44%, network 0.059/0.045 MiB/s, disk 1.989/11.043 MiB/s, and PSI
CPU/memory/I/O 0.193/0.015/0.345%. Python regression tests separately verify interval weighting,
loopback/loop-device exclusion, explicit UTC, one six-record window spanning two daily archives at
midnight, and the labeled point-sample fallback.

The collector also reads battery/AC state and the Intel iGPU's current/max activity clocks from sysfs when those files are available. Big Red does not currently expose a user-readable GPU busy percentage, so the dashboard labels the clock honestly and does not invent utilization or install another package.

These are operator thresholds rather than hardware safety limits:

- root disk at 80%: watch; at 90%: attention;
- memory at 90%: watch;
- any failed system or user unit: attention;
- anything other than full NetworkManager connectivity or running Tailscale: watch;
- GNOME Remote Desktop present but not active: watch;
- current GNOME Remote Desktop invocation reports software fallback: watch;
- configured GNOME wallpaper references are missing: watch;
- automatic idle suspend no longer disabled on AC or battery: watch;
- hibernate or hybrid-sleep no longer masked: watch;
- any detected development listener: watch;
- any structured core-dump exit in the last 24 hours: watch, split between desktop search and other services when the current collector supplied the breakdown;
- unavailable route ownership status, any residue job, or any unknown route/job record: watch;
- unavailable Beryl diagnostics or SSH, unexpected Tailscale/OpenClash/Netify process shape, an
  inactive fan policy, active CPU thermal cooling, a Beryl OOM in the last 24 hours, or any loss in
  the five-packet gateway point sample: watch;
- report older than 3 hours: watch.

CPU/memory peaks, disk/network throughput, PSI, load, and the iGPU clock are displayed but do not yet alert. Pressure is a better contention signal than utilization alone, but thresholds should be based on an observed Big Red baseline instead of imported folklore.

Beryl data is parsed only from the allowlisted `Beryl local health` and `Beryl local link` sections
of the canonical `/usr/local/bin/big-red-connectivity-check`. The collector runs that diagnostic
once per report. Missing, duplicate, malformed, inconsistent, oversized, or timed-out output fails
closed to unavailable. The link receipt keeps only signal, frequency, channel width, negotiated RX/TX
rates, and aggregates from exactly five gateway pings. It never stores the interface, SSID, BSSID,
gateway address, route, or packet-level output. Negotiated rates describe the current radio link, not
measured internet throughput; RTT is a local gateway point sample, and ping mdev is labeled variation
rather than network jitter. Signal, rate, and latency are display-only until Big Red has its own
baseline. Any observed packet loss is a watch reason, explicitly scoped to the five-packet sample.
The PWM value is a requested cooling-device state, not measured fan RPM; the dashboard compares it
with its reported maximum and does not turn a single temperature sample into a generic hardware
alarm. OOM count is cumulative for the current router boot, so only a reported latest-event age under
24 hours raises a watch reason.

## Website configuration

Apply `drizzle/0016_machine_health.sql`, `drizzle/0017_machine_health_hygiene.sql`, and
`drizzle/0018_codex_token_samples.sql` in order
through the normal Scrapbook migration process, then set:

The token migration also enforces exact UTC-hour boundaries in Postgres. The ingest schema checks
the same rule before opening a transaction, so a half-hour or other shifted window is rejected at
both boundaries.

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
POST /api/machine-health/codex-usage/ingest
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

The optional Beryl section requires the canonical connectivity diagnostic to be installed and its
non-interactive `beryl7` SSH probe to work. The collector runs that diagnostic once with a 10-second
timeout and a 32 KiB output ceiling. It neither changes router settings nor retries service actions.

The route section expects the authoritative helper at `~/Projects/leo-workspace/tools/codex_route_job.py`. If it is absent, fails, or changes its aggregate contract, the report marks route activity unavailable. Restoring that exact helper restores the section; no dashboard-side ownership fallback exists.

The portable token collector runs on macOS or Linux and reads only `~/.codex/sessions`:

```bash
python3 scripts/codex-token-report.py --source macbook-air --hours 720 --print-only
```

The first approved production run can use `--hours 720` to backfill the latest 30 days. Later runs
omit `--hours`; a small local success cursor makes the next run cover every complete hour since the
last accepted post, capped at 30 days. The cursor advances only after a successful response.

```bash
CODEX_TOKEN_INGEST_URL=https://teamleaderleo.com/api/machine-health/codex-usage/ingest \
MACHINE_HEALTH_INGEST_SECRET='<ingest secret>' \
python3 scripts/codex-token-report.py --source macbook-air
```

For launchd, keep those two values in one current-user-owned mode-`0600` JSON file instead of
putting the bearer secret in a plist:

```json
{
  "ingest_url": "https://teamleaderleo.com/api/machine-health/codex-usage/ingest",
  "ingest_secret": "<ingest secret>"
}
```

Pass it with `--config-file`. The reporter rejects symlinks, non-regular files, another owner's
file, group/other permissions, files above 16 KiB, unknown or missing fields, an unsafe URL, and any
mixture of the file with ingest environment variables. Supplying only one environment variable is
also an error instead of a local-print fallback.

## Proposed Mac LaunchAgent — not installed

`scripts/codex-token-launchd.py` renders the plist to standard output. It contains paths and fixed
arguments, never the ingest secret. The generated agent runs once at login and at minute 17 of each
hour as a background, low-I/O process. Missed sleep/offline hours come from the success cursor on
the next run.

An approved installation can use stable copies under Application Support:

```bash
support="$HOME/Library/Application Support/Scrapbook"
agent="$HOME/Library/LaunchAgents/com.teamleaderleo.scrapbook-codex-token.plist"
install -d -m 700 "$support"
mkdir -p "$HOME/Library/LaunchAgents"
install -m 600 scripts/codex-token-report.py "$support/codex-token-report.py"
python3 scripts/codex-token-launchd.py \
  --python "$(command -v python3)" \
  --reporter "$support/codex-token-report.py" \
  --config "$support/codex-token.json" \
  --state "$support/codex-token-state.json" > "$agent"
plutil -lint "$agent"
```

Create `codex-token.json` separately with mode `0600`, then run one explicit backfill before loading
the validated plist:

```bash
python3 "$support/codex-token-report.py" \
  --source macbook-air \
  --config-file "$support/codex-token.json" \
  --state-file "$support/codex-token-state.json" \
  --hours 720
launchctl bootstrap "gui/$(id -u)" "$agent"
launchctl kickstart "gui/$(id -u)/com.teamleaderleo.scrapbook-codex-token"
```

A successful scheduled run writes no stdout or stderr; dashboard source-hour coverage and the
local success cursor expose freshness without an ever-growing log file. Run the reporter manually
to diagnose a failed post. Rollback begins with
`launchctl bootout "gui/$(id -u)" "$agent"`, then removes the plist, stable script copy, credential
file and success cursor.

No Mac file or LaunchAgent is installed by this change.

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

1. Disable and remove the Big Red user timer/service, Mac LaunchAgent if installed, collector copies, local success cursor, and environment files. This stops all new reports without affecting either machine's network or power configuration.
2. Remove the website environment variables and deploy. The access and ingest routes become unavailable.
3. Revert the route-activity fields to remove only the ownership view, or remove the route, component, store, collectors, and documentation files to retire the complete dashboard.
4. Only if history should be erased, separately approve dropping `machine_health_status`, `machine_health_samples`, and `codex_token_samples`. Leaving the tiny, inaccessible tables in place is the more reversible default.

No rollback step requires firmware, boot, disk, network, login, SSH, Tailscale, or sleep-policy changes.

## Related finding

The existing proxy-dashboard documentation says production verifies its signed access cookie, but the current `/proxy-dashboard` page does not call `hasProxyDashboardAccess`. The machine-health route performs that check correctly. Fixing the older route should be reviewed as a separate narrow security change rather than bundled silently into this feature.
