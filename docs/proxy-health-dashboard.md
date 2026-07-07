# Proxy health dashboard

This adds a read-only dashboard for the Bandwagon → Linode proxy path.

## Website environment variables

Set these on the Next.js host:

```bash
PROXY_HEALTH_TOKEN="a-long-random-secret"
PROXY_DASHBOARD_TOKEN="optional-read-token"
```

`PROXY_HEALTH_TOKEN` is required. Bandwagon uses it to POST health reports.

`PROXY_DASHBOARD_TOKEN` is optional. If set, open the dashboard with:

```text
/proxy-dashboard?token=optional-read-token
```

## Paths

```text
GET  /proxy-dashboard
POST /api/proxy-health/ingest
GET  /api/proxy-health/latest
```

The ingest API stores the latest health payload in Postgres. The table is created automatically on first read/write:

```sql
proxy_health_status(host primary key, payload jsonb, checked_at timestamptz, updated_at timestamptz)
```

## Install reporter on Bandwagon

From a local clone of this repo, copy the reporter to Bandwagon:

```bash
scp scripts/proxy-health-report.py bandwagon:/usr/local/sbin/proxy-health-report
ssh bandwagon 'chmod 755 /usr/local/sbin/proxy-health-report'
```

On Bandwagon, create the env file:

```bash
cat >/etc/proxy-health.env <<'EOF'
PROXY_HEALTH_INGEST_URL=https://teamleaderleo.com/api/proxy-health/ingest
PROXY_HEALTH_TOKEN=replace-with-the-same-secret-set-on-the-website
PROXY_HEALTH_HOST=bandwagon-la
EXPECTED_EGRESS_IPV4=172.235.56.214
EXPECTED_EGRESS_IPV6=2a01:7e03::2000:56ff:fe71:cbd
EOF
chmod 600 /etc/proxy-health.env
```

Create the systemd service:

```bash
cat >/etc/systemd/system/proxy-health-report.service <<'EOF'
[Unit]
Description=Report proxy health to dashboard
After=network-online.target xray.service wg-egress-netns.service xray-wg-sidecar.service lightsail-egress-socks.service
Wants=network-online.target

[Service]
Type=oneshot
EnvironmentFile=/etc/proxy-health.env
ExecStart=/usr/local/sbin/proxy-health-report
EOF
```

Create the timer:

```bash
cat >/etc/systemd/system/proxy-health-report.timer <<'EOF'
[Unit]
Description=Run proxy health reporter every 5 minutes

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
AccuracySec=30s
Persistent=true

[Install]
WantedBy=timers.target
EOF
```

Enable it:

```bash
systemctl daemon-reload
systemctl enable --now proxy-health-report.timer
systemctl start proxy-health-report.service
journalctl -u proxy-health-report.service -n 50 --no-pager
```

## Manual test from Bandwagon

```bash
set -a
. /etc/proxy-health.env
set +a
/usr/local/sbin/proxy-health-report
```

A good response looks like:

```json
{"ok":true,"host":"bandwagon-la","checked_at":"..."}
```

Then open:

```text
https://teamleaderleo.com/proxy-dashboard
```

or, if `PROXY_DASHBOARD_TOKEN` is set:

```text
https://teamleaderleo.com/proxy-dashboard?token=your-read-token
```
