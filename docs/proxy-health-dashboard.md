# Proxy health dashboard

This adds a read-only dashboard for the Bandwagon → Linode proxy path.

## Website environment variables

Set these on the Next.js host:

```bash
DATABASE_URL="postgresql://..."
PROXY_HEALTH_INGEST_SECRET="a-long-random-secret"
PROXY_HEALTH_DIAGNOSTIC_SECRET="another-long-random-secret"
PROXY_DASHBOARD_TOKEN="a-separate-dashboard-access-token"
```

`PROXY_HEALTH_INGEST_SECRET` is the preferred credential for Bandwagon health reports. The older `PROXY_HEALTH_TOKEN` name remains supported for compatibility.

`PROXY_HEALTH_DIAGNOSTIC_SECRET` protects the database diagnostic endpoint. When omitted, the diagnostic endpoint falls back to the ingest credential.

`PROXY_DASHBOARD_TOKEN` is required in production. Open the access form and
submit it once to exchange the token for a seven-day HttpOnly access cookie:

```text
/proxy-dashboard/access
```

## Paths

```text
GET  /proxy-dashboard
POST /api/proxy-health/ingest
GET  /api/proxy-health/latest
GET  /api/proxy-health/diagnostic
```

The ingest API stores the latest health payload and historical samples in Postgres:

```sql
proxy_health_status(host primary key, payload jsonb, checked_at timestamptz, updated_at timestamptz)
proxy_health_samples(id bigserial primary key, host text, checked_at timestamptz, ...)
```

The schema is created by `drizzle/0008_proxy_health.sql`. Apply migrations before deploying a new environment; dashboard reads and ingest requests do not run DDL.

Ingestion accepts JSON reports up to 64 KiB. The route validates an explicit
allowlist of reporter fields, bounds nested history and error collections, and
discards unknown fields before writing the report. Authentication tokens are
compared in constant time. These limits keep accidental or compromised clients
from turning the JSONB payload into an unbounded storage channel.

The diagnostic endpoint requires a bearer token or `x-proxy-health-token` header. It reports whether the database is reachable, whether both tables exist, the newest report timestamp, and the number of samples received in the previous 24 hours.

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
{ "ok": true, "host": "bandwagon-la", "checked_at": "...", "request_id": "..." }
```

Then open:

```text
https://teamleaderleo.com/proxy-dashboard
```

After configuring `PROXY_DASHBOARD_TOKEN`, open:

```text
https://teamleaderleo.com/proxy-dashboard/access
```

Enter the read token in the password field. The form sends it in the POST body
instead of putting it in browser history, access logs, or referrers. The
exchange redirects to `/proxy-dashboard`. Production returns an ordinary
not-found response when the dashboard token is missing or the access cookie is
invalid. Local development remains available without a token.
