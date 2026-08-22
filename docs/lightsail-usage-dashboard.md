# Lightsail usage reporter

The proxy dashboard can show the Oregon Lightsail instance alongside the existing Bandwagon provider data.

The Lightsail reporter reads the primary Linux interface counters and posts them through the existing proxy-health ingest endpoint. Lightsail counts both incoming and outgoing instance transfer toward the monthly allowance, so `rx + tx` is a useful operational estimate. The local counter begins when the reporter is installed unless `LIGHTSAIL_USAGE_SEED_GB` is supplied.

## Install on Oregon

Copy the reporter from a local clone:

```bash
scp scripts/lightsail-health-report.py oregon:/tmp/lightsail-health-report.py
ssh oregon 'sudo install -m 755 /tmp/lightsail-health-report.py /usr/local/sbin/lightsail-health-report'
```

Create `/etc/lightsail-health.env` with the existing dashboard ingest secret:

```bash
sudo tee /etc/lightsail-health.env >/dev/null <<'EOF'
PROXY_HEALTH_INGEST_URL=https://teamleaderleo.com/api/proxy-health/ingest
PROXY_HEALTH_TOKEN=replace-with-the-existing-ingest-secret
PROXY_HEALTH_HOST=lightsail-oregon
LIGHTSAIL_INTERFACE=ens5
LIGHTSAIL_TRANSFER_LIMIT_GB=3072
LIGHTSAIL_USAGE_SEED_GB=0
EOF
sudo chmod 600 /etc/lightsail-health.env
```

The `$12` Oregon bundle has a 3072 GB monthly transfer allowance. If you have an existing month-to-date transfer estimate when installing the reporter, put that value in `LIGHTSAIL_USAGE_SEED_GB`. The seed is used only when a new UTC calendar month starts or when the local state file is first created.

Create the service:

```bash
sudo tee /etc/systemd/system/lightsail-health-report.service >/dev/null <<'EOF'
[Unit]
Description=Report Lightsail proxy usage to scrapbook
After=network-online.target xray.service hysteria-server.service
Wants=network-online.target

[Service]
Type=oneshot
EnvironmentFile=/etc/lightsail-health.env
ExecStart=/usr/local/sbin/lightsail-health-report
EOF
```

Create the timer:

```bash
sudo tee /etc/systemd/system/lightsail-health-report.timer >/dev/null <<'EOF'
[Unit]
Description=Run Lightsail proxy usage reporter every 5 minutes

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
AccuracySec=30s
Persistent=true

[Install]
WantedBy=timers.target
EOF
```

Enable it and send the first sample:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now lightsail-health-report.timer
sudo systemctl start lightsail-health-report.service
sudo journalctl -u lightsail-health-report.service -n 30 --no-pager
```

A successful report looks like:

```json
{ "ok": true, "host": "lightsail-oregon", "checked_at": "...", "request_id": "..." }
```

The dashboard caches each host for 60 seconds, so the Lightsail card can take about a minute to appear after the first successful report.

## Counter behavior

The reporter stores its monthly running total in:

```text
/var/lib/proxy-health/lightsail-usage.json
```

It handles Linux interface-counter resets after a reboot by treating the new counter value as traffic observed since the reset. At the first sample of a new UTC calendar month, it starts a new cycle and applies `LIGHTSAIL_USAGE_SEED_GB` if configured.

The resulting number is an operational estimate from the instance interface. AWS billing remains authoritative for chargeable transfer and may differ slightly from the local counter.
