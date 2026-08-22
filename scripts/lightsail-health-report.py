#!/usr/bin/env python3
"""Report Lightsail proxy traffic and service health to the scrapbook dashboard.

Required environment variables:
  PROXY_HEALTH_INGEST_URL=https://teamleaderleo.com/api/proxy-health/ingest
  PROXY_HEALTH_TOKEN=...

Optional:
  PROXY_HEALTH_HOST=lightsail-oregon
  LIGHTSAIL_INTERFACE=ens5
  LIGHTSAIL_TRANSFER_LIMIT_GB=3072
  LIGHTSAIL_USAGE_SEED_GB=0
  LIGHTSAIL_STATE_FILE=/var/lib/proxy-health/lightsail-usage.json
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

HOST = os.environ.get("PROXY_HEALTH_HOST", "lightsail-oregon")
INGEST_URL = os.environ.get("PROXY_HEALTH_INGEST_URL")
TOKEN = os.environ.get("PROXY_HEALTH_TOKEN")
INTERFACE = os.environ.get("LIGHTSAIL_INTERFACE", "ens5")
TRANSFER_LIMIT_GB = float(os.environ.get("LIGHTSAIL_TRANSFER_LIMIT_GB", "3072"))
USAGE_SEED_GB = float(os.environ.get("LIGHTSAIL_USAGE_SEED_GB", "0"))
STATE_FILE = Path(
    os.environ.get(
        "LIGHTSAIL_STATE_FILE", "/var/lib/proxy-health/lightsail-usage.json"
    )
)


def now() -> datetime:
    return datetime.now(timezone.utc)


def iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def month_key(value: datetime) -> str:
    return value.astimezone(timezone.utc).strftime("%Y-%m")


def next_month(value: datetime) -> datetime:
    value = value.astimezone(timezone.utc)
    if value.month == 12:
        return datetime(value.year + 1, 1, 1, tzinfo=timezone.utc)
    return datetime(value.year, value.month + 1, 1, tzinfo=timezone.utc)


def as_nonnegative_int(value: Any, default: int = 0) -> int:
    if isinstance(value, bool):
        return default
    try:
        number = int(value)
    except (TypeError, ValueError):
        return default
    return max(0, number)


def read_counter(name: str) -> int:
    path = Path("/sys/class/net") / INTERFACE / "statistics" / name
    return as_nonnegative_int(path.read_text().strip())


def read_state() -> dict[str, Any]:
    try:
        value = json.loads(STATE_FILE.read_text())
    except Exception:
        return {}
    return value if isinstance(value, dict) else {}


def write_state(value: dict[str, Any]) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary = STATE_FILE.with_suffix(".tmp")
    temporary.write_text(json.dumps(value, separators=(",", ":")))
    os.chmod(temporary, 0o600)
    os.replace(temporary, STATE_FILE)


def current_usage(rx_bytes: int, tx_bytes: int, checked_at: datetime) -> int:
    state = read_state()
    current_month = month_key(checked_at)
    first_sample = not state
    seed = max(0, int(USAGE_SEED_GB * 1024**3)) if first_sample else 0

    if state.get("month") != current_month:
        used_bytes = seed
    else:
        used_bytes = as_nonnegative_int(state.get("used_bytes"), seed)
        last_rx = as_nonnegative_int(state.get("last_rx"), rx_bytes)
        last_tx = as_nonnegative_int(state.get("last_tx"), tx_bytes)

        # Interface counters reset after a reboot. In that case, the current
        # counter value is traffic observed since the reset, so keep it.
        rx_delta = rx_bytes - last_rx if rx_bytes >= last_rx else rx_bytes
        tx_delta = tx_bytes - last_tx if tx_bytes >= last_tx else tx_bytes
        used_bytes += max(0, rx_delta) + max(0, tx_delta)

    write_state(
        {
            "month": current_month,
            "last_rx": rx_bytes,
            "last_tx": tx_bytes,
            "used_bytes": used_bytes,
            "checked_at": iso(checked_at),
        }
    )
    return used_bytes


def service_status(name: str) -> str:
    try:
        completed = subprocess.run(
            ["systemctl", "is-active", name],
            timeout=5,
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
    except Exception:
        return "unknown"

    output = (completed.stdout or completed.stderr).strip()
    if output:
        return output[:128]
    return "active" if completed.returncode == 0 else "unknown"


def build_payload() -> dict[str, Any]:
    checked_at = now()
    errors: list[str] = []

    try:
        rx_bytes = read_counter("rx_bytes")
        tx_bytes = read_counter("tx_bytes")
    except Exception as exc:  # noqa: BLE001 - reporter errors are dashboard data
        rx_bytes = 0
        tx_bytes = 0
        errors.append(f"interface counter read failed: {exc}")

    used_bytes = current_usage(rx_bytes, tx_bytes, checked_at)
    limit_bytes = max(0, int(TRANSFER_LIMIT_GB * 1024**3))
    services = {
        "xray": service_status("xray"),
        "hysteria-server": service_status("hysteria-server"),
    }
    mode = (
        "normal"
        if services["xray"] == "active" and services["hysteria-server"] == "active"
        else "degraded"
    )

    return {
        "host": HOST,
        "checked_at": iso(checked_at),
        "mode": mode,
        "services": services,
        "provider": {
            "usage": {
                "source": "lightsail-local-counter",
                "used_bytes": used_bytes,
                "limit_bytes": limit_bytes,
                "reset_at": iso(next_month(checked_at)),
                "suspended": False,
                "policy_violation": False,
                "last_raw_at": iso(checked_at),
            }
        },
        # The existing dashboard sample table stores these two counters. For
        # Lightsail they represent the primary interface, rather than WireGuard.
        "wireguard": {
            "rx_bytes": rx_bytes,
            "tx_bytes": tx_bytes,
        },
        "errors": errors,
    }


def post_payload(payload: dict[str, Any]) -> None:
    if not INGEST_URL:
        raise SystemExit("PROXY_HEALTH_INGEST_URL is not set")
    if not TOKEN:
        raise SystemExit("PROXY_HEALTH_TOKEN is not set")

    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        INGEST_URL,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
            "User-Agent": "lightsail-proxy-health/1.0",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            sys.stdout.write(response.read().decode("utf-8") + "\n")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"POST failed: HTTP {exc.code}: {body}") from exc


def main() -> None:
    post_payload(build_payload())


if __name__ == "__main__":
    main()
