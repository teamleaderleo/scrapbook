#!/usr/bin/env python3
"""Report proxy health to the Next.js dashboard.

Required environment variables:
  PROXY_HEALTH_INGEST_URL=https://www.teamleaderleo.com/api/proxy-health/ingest
  PROXY_HEALTH_TOKEN=...

Optional:
  PROXY_HEALTH_HOST=bandwagon-la
  EXPECTED_EGRESS_IPV4=172.235.56.214
  EXPECTED_EGRESS_IPV6=2a01:7e03::2000:56ff:fe71:cbd
  PROXY_LATENCY_URL=https://www.gstatic.com/generate_204
  GLOBALPING_LOCATION=Shanghai
  GLOBALPING_BANDWAGON_TARGET=67.230.173.112
  GLOBALPING_LINODE_TARGET=172.235.56.214
  GLOBALPING_INTERVAL_SECONDS=1800
  KIWI_VM_ENABLED=1
  KIWI_VM_VEID=2154886
  KIWI_VM_API_KEY=...
  KIWI_VM_API_URL=https://api.64clouds.com/v1
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

HOST = os.environ.get("PROXY_HEALTH_HOST", "bandwagon-la")
INGEST_URL = os.environ.get("PROXY_HEALTH_INGEST_URL")
TOKEN = os.environ.get("PROXY_HEALTH_TOKEN")
EXPECTED_IPV4 = os.environ.get("EXPECTED_EGRESS_IPV4", "172.235.56.214")
EXPECTED_IPV6 = os.environ.get("EXPECTED_EGRESS_IPV6", "2a01:7e03::2000:56ff:fe71:cbd")
XRAY_CONFIG = Path(os.environ.get("XRAY_CONFIG", "/usr/local/etc/xray/config.json"))
SIDECAR_SOCKS = os.environ.get("SIDECAR_SOCKS", "10.200.0.2:18089")
FALLBACK_SOCKS = os.environ.get("FALLBACK_SOCKS", "127.0.0.1:18088")
LATENCY_URL = os.environ.get("PROXY_LATENCY_URL", "https://www.gstatic.com/generate_204")
WG_LATENCY_TARGET = os.environ.get("WG_LATENCY_TARGET", "10.77.0.1")
GLOBALPING_ENABLED = os.environ.get("GLOBALPING_ENABLED", "1") != "0"
GLOBALPING_API_URL = os.environ.get("GLOBALPING_API_URL", "https://api.globalping.io/v1/measurements")
GLOBALPING_LOCATION = os.environ.get("GLOBALPING_LOCATION", "Shanghai")
GLOBALPING_BANDWAGON_TARGET = os.environ.get("GLOBALPING_BANDWAGON_TARGET", "67.230.173.112")
GLOBALPING_LINODE_TARGET = os.environ.get("GLOBALPING_LINODE_TARGET", EXPECTED_IPV4)
GLOBALPING_INTERVAL_SECONDS = int(os.environ.get("GLOBALPING_INTERVAL_SECONDS", "1800"))
GLOBALPING_CACHE = Path(os.environ.get("GLOBALPING_CACHE", "/var/lib/proxy-health/globalping-cache.json"))
KIWI_VM_ENABLED = os.environ.get("KIWI_VM_ENABLED", "0") == "1"
KIWI_VM_API_URL = os.environ.get("KIWI_VM_API_URL", "https://api.64clouds.com/v1")
KIWI_VM_VEID = os.environ.get("KIWI_VM_VEID")
KIWI_VM_API_KEY = os.environ.get("KIWI_VM_API_KEY")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def unix_to_iso(value: Any) -> str | None:
    try:
        timestamp = int(value)
    except (TypeError, ValueError):
        return None
    if timestamp <= 0:
        return None
    return iso(datetime.fromtimestamp(timestamp, tz=timezone.utc))


def floor_hour(dt: datetime) -> datetime:
    dt = dt.astimezone(timezone.utc)
    return datetime(dt.year, dt.month, dt.day, dt.hour, tzinfo=timezone.utc)


def floor_day(dt: datetime) -> datetime:
    dt = dt.astimezone(timezone.utc)
    return datetime(dt.year, dt.month, dt.day, tzinfo=timezone.utc)


def as_int(value: Any) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return max(0, value)
    if isinstance(value, float) and value >= 0:
        return int(value)
    if isinstance(value, str) and value.isdigit():
        return int(value)
    return None


def as_bool(value: Any) -> bool | None:
    if isinstance(value, bool):
        return value
    if value in (0, 1):
        return bool(value)
    if isinstance(value, str) and value.lower() in {"0", "1", "false", "true"}:
        return value.lower() in {"1", "true"}
    return None


def run(command: list[str], timeout: int = 10) -> tuple[bool, str]:
    try:
        completed = subprocess.run(
            command,
            timeout=timeout,
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        output = (completed.stdout or completed.stderr).strip()
        return completed.returncode == 0, output
    except Exception as exc:  # noqa: BLE001 - this is a reporter; return errors as data
        return False, str(exc)


def service_status(name: str) -> str:
    ok, output = run(["systemctl", "is-active", name], timeout=5)
    if ok:
        return output.strip() or "active"
    return output.strip() or "unknown"


def curl_via_socks(url: str, socks: str, timeout: int = 12) -> tuple[bool, str]:
    return run(
        [
            "curl",
            "-fsS",
            "--max-time",
            str(timeout),
            "--socks5-hostname",
            socks,
            url,
        ],
        timeout=timeout + 3,
    )


def http_total_ms_via_socks(url: str, socks: str, timeout: int = 10) -> float | None:
    ok, output = run(
        [
            "curl",
            "-fsS",
            "-o",
            "/dev/null",
            "-w",
            "%{time_total}",
            "--max-time",
            str(timeout),
            "--socks5-hostname",
            socks,
            url,
        ],
        timeout=timeout + 3,
    )
    if not ok:
        return None
    try:
        return round(float(output.strip()) * 1000, 2)
    except ValueError:
        return None


def request_json(url: str, data: dict[str, Any] | None = None, timeout: int = 20) -> dict[str, Any]:
    body = json.dumps(data).encode("utf-8") if data is not None else None
    request = urllib.request.Request(
        url,
        data=body,
        method="POST" if data is not None else "GET",
        headers={
            "Content-Type": "application/json",
            "User-Agent": "bandwagon-proxy-health/1.0",
        },
    )

    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def request_form_json(endpoint: str, data: dict[str, Any], timeout: int = 20) -> dict[str, Any]:
    url = f"{KIWI_VM_API_URL.rstrip('/')}/{endpoint.lstrip('/')}"
    body = urllib.parse.urlencode(data).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "bandwagon-proxy-health/1.0",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def extract_globalping_avg_ms(measurement: dict[str, Any]) -> float | None:
    for item in measurement.get("results", []) or []:
        result = item.get("result") or {}
        stats = result.get("stats") or {}
        for key in ("avg", "average", "mean"):
            value = stats.get(key)
            if isinstance(value, (int, float)) and value >= 0:
                return round(float(value), 2)
        raw = result.get("rawOutput") or result.get("raw_output") or ""
        parsed = parse_ping_avg_ms(str(raw))
        if parsed is not None:
            return parsed
    return None


def globalping_ping_avg_ms(target: str) -> float | None:
    payload = {
        "type": "ping",
        "target": target,
        "locations": [{"magic": GLOBALPING_LOCATION}],
        "limit": 1,
        "measurementOptions": {"packets": 3},
    }

    created = request_json(GLOBALPING_API_URL, payload, timeout=20)
    measurement_id = created.get("id")
    if not isinstance(measurement_id, str) or not measurement_id:
        return None

    url = f"{GLOBALPING_API_URL.rstrip('/')}/{measurement_id}"
    for _ in range(12):
        time.sleep(2)
        measurement = request_json(url, timeout=20)
        value = extract_globalping_avg_ms(measurement)
        if value is not None:
            return value
        if measurement.get("status") in {"failed", "finished"}:
            break
    return None


def read_globalping_cache() -> dict[str, Any] | None:
    try:
        payload = json.loads(GLOBALPING_CACHE.read_text())
        checked_at = payload.get("checked_at")
        checked_ts = datetime.fromisoformat(str(checked_at).replace("Z", "+00:00")).timestamp()
        if time.time() - checked_ts <= GLOBALPING_INTERVAL_SECONDS:
            return {**payload, "source": "cache"}
    except Exception:
        return None
    return None


def write_globalping_cache(payload: dict[str, Any]) -> None:
    try:
        GLOBALPING_CACHE.parent.mkdir(parents=True, exist_ok=True)
        GLOBALPING_CACHE.write_text(json.dumps(payload))
    except Exception:
        pass


def read_globalping() -> dict[str, Any]:
    base = {
        "location": GLOBALPING_LOCATION,
        "bandwagon_target": GLOBALPING_BANDWAGON_TARGET,
        "linode_target": GLOBALPING_LINODE_TARGET,
    }

    if not GLOBALPING_ENABLED:
        return {**base, "bandwagon_ms": None, "linode_ms": None, "source": "disabled"}

    cached = read_globalping_cache()
    if cached is not None:
        return {**base, **cached}

    try:
        result = {
            **base,
            "bandwagon_ms": globalping_ping_avg_ms(GLOBALPING_BANDWAGON_TARGET),
            "linode_ms": globalping_ping_avg_ms(GLOBALPING_LINODE_TARGET),
            "source": "globalping",
            "checked_at": now_iso(),
        }
        write_globalping_cache(result)
        return result
    except Exception as exc:  # noqa: BLE001 - keep main health report alive
        return {**base, "bandwagon_ms": None, "linode_ms": None, "source": "globalping", "error": str(exc)}


def summarize_raw_usage(raw_stats: dict[str, Any], multiplier: int) -> dict[str, Any]:
    rows = raw_stats.get("data")
    if not isinstance(rows, list):
        return {"raw_sample_count": 0, "daily": [], "hourly": []}

    points: list[tuple[datetime, int, int, int]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        timestamp = as_int(row.get("timestamp"))
        if timestamp is None:
            continue
        in_bytes = as_int(row.get("network_in_bytes")) or 0
        out_bytes = as_int(row.get("network_out_bytes")) or 0
        dt = datetime.fromtimestamp(timestamp, tz=timezone.utc)
        points.append((dt, in_bytes * multiplier, out_bytes * multiplier, (in_bytes + out_bytes) * multiplier))

    if not points:
        return {"raw_sample_count": 0, "daily": [], "hourly": []}

    latest = max(point[0] for point in points)
    day_start = floor_day(latest) - timedelta(days=29)
    hour_start = floor_hour(latest) - timedelta(hours=23)

    daily: dict[str, dict[str, Any]] = {}
    for index in range(30):
        dt = day_start + timedelta(days=index)
        daily[iso(dt)] = {"checked_at": iso(dt), "bytes": 0, "in_bytes": 0, "out_bytes": 0}

    hourly: dict[str, dict[str, Any]] = {}
    for index in range(24):
        dt = hour_start + timedelta(hours=index)
        hourly[iso(dt)] = {"checked_at": iso(dt), "bytes": 0, "in_bytes": 0, "out_bytes": 0}

    for dt, in_bytes, out_bytes, total_bytes in points:
        day = floor_day(dt)
        day_key = iso(day)
        if day_key in daily:
            daily[day_key]["bytes"] += total_bytes
            daily[day_key]["in_bytes"] += in_bytes
            daily[day_key]["out_bytes"] += out_bytes

        hour = floor_hour(dt)
        hour_key = iso(hour)
        if hour_key in hourly:
            hourly[hour_key]["bytes"] += total_bytes
            hourly[hour_key]["in_bytes"] += in_bytes
            hourly[hour_key]["out_bytes"] += out_bytes

    return {
        "raw_sample_count": len(points),
        "last_raw_at": iso(latest),
        "daily": list(daily.values()),
        "hourly": list(hourly.values()),
    }


def read_provider_usage() -> dict[str, Any]:
    if not KIWI_VM_ENABLED:
        return {"source": "disabled"}
    if not KIWI_VM_VEID or not KIWI_VM_API_KEY:
        return {"source": "kiwivm", "error": "missing KiwiVM credentials"}

    credentials = {"veid": KIWI_VM_VEID, "api_key": KIWI_VM_API_KEY}

    try:
        data = request_form_json("getServiceInfo", credentials, timeout=20)
    except urllib.error.HTTPError as exc:
        return {"source": "kiwivm", "error": f"HTTP {exc.code}"}
    except Exception as exc:  # noqa: BLE001 - keep main health report alive
        return {"source": "kiwivm", "error": str(exc)}

    error = data.get("error")
    message = data.get("message") if isinstance(data.get("message"), str) else None
    plan_monthly_data = as_int(data.get("plan_monthly_data"))
    data_counter = as_int(data.get("data_counter"))
    multiplier = as_int(data.get("monthly_data_multiplier")) or 1

    limit_bytes = plan_monthly_data * multiplier if plan_monthly_data is not None else None
    used_bytes = data_counter * multiplier if data_counter is not None else None

    result: dict[str, Any] = {
        "source": "kiwivm",
        "used_bytes": used_bytes,
        "limit_bytes": limit_bytes,
        "reset_at": unix_to_iso(data.get("data_next_reset")),
        "suspended": as_bool(data.get("suspended")),
        "policy_violation": as_bool(data.get("policy_violation")),
        "error": error,
        "message": message,
    }

    try:
        raw_stats = request_form_json("getRawUsageStats", credentials, timeout=30)
        raw_error = raw_stats.get("error")
        if raw_error not in (None, 0, "0"):
            result["raw_error"] = str(raw_error)
        else:
            result.update(summarize_raw_usage(raw_stats, multiplier))
    except urllib.error.HTTPError as exc:
        result["raw_error"] = f"HTTP {exc.code}"
    except Exception as exc:  # noqa: BLE001
        result["raw_error"] = str(exc)

    # Do not include provider IPs, hostname, email, node location, rDNS, SSH port, screenshots, or keys.
    return result


def parse_ping_avg_ms(output: str) -> float | None:
    match = re.search(r"(?:rtt|round-trip).*?=\s*([0-9.]+)/([0-9.]+)/([0-9.]+)", output)
    if not match:
        return None
    try:
        return round(float(match.group(2)), 2)
    except ValueError:
        return None


def ping_avg_ms(target: str, timeout: int = 8) -> float | None:
    ok, output = run(
        ["ip", "netns", "exec", "wg-egress", "ping", "-c", "3", "-W", "2", target],
        timeout=timeout,
    )
    if not ok:
        return None
    return parse_ping_avg_ms(output)


def read_latency() -> dict[str, Any]:
    return {
        "wg_ms": ping_avg_ms(WG_LATENCY_TARGET),
        "public_ms": http_total_ms_via_socks(LATENCY_URL, SIDECAR_SOCKS),
        "target": LATENCY_URL,
    }


def read_xray_outbound() -> dict[str, Any]:
    result: dict[str, Any] = {
        "outbound_tag": None,
        "outbound_address": None,
        "outbound_port": None,
    }

    try:
        config = json.loads(XRAY_CONFIG.read_text())
    except Exception as exc:  # noqa: BLE001
        result["error"] = f"could not read xray config: {exc}"
        return result

    for outbound in config.get("outbounds", []):
        if outbound.get("protocol") != "socks":
            continue
        server = (outbound.get("settings", {}).get("servers") or [{}])[0]
        result = {
            "outbound_tag": outbound.get("tag"),
            "outbound_address": server.get("address"),
            "outbound_port": server.get("port"),
        }
        break

    return result


def read_wireguard() -> dict[str, Any]:
    latest_handshake_seconds_ago = None
    rx_bytes = None
    tx_bytes = None

    ok, handshakes = run(["ip", "netns", "exec", "wg-egress", "wg", "show", "wg0", "latest-handshakes"], timeout=5)
    if ok:
        for line in handshakes.splitlines():
            parts = line.split()
            if len(parts) >= 2 and parts[1].isdigit():
                latest = int(parts[1])
                if latest > 0:
                    latest_handshake_seconds_ago = max(0, int(time.time()) - latest)
                break

    ok, transfer = run(["ip", "netns", "exec", "wg-egress", "wg", "show", "wg0", "transfer"], timeout=5)
    if ok:
        for line in transfer.splitlines():
            parts = line.split()
            if len(parts) >= 3 and parts[1].isdigit() and parts[2].isdigit():
                rx_bytes = int(parts[1])
                tx_bytes = int(parts[2])
                break
    return {
        "latest_handshake_seconds_ago": latest_handshake_seconds_ago,
        "rx_bytes": rx_bytes,
        "tx_bytes": tx_bytes,
    }


def detect_mode(xray: dict[str, Any], sidecar_ok: bool, fallback_ok: bool) -> str:
    address = xray.get("outbound_address")
    port = xray.get("outbound_port")

    if address == "10.200.0.2" and port == 18089:
        return "normal" if sidecar_ok else "degraded"
    if address == "127.0.0.1" and port == 18088:
        return "fallback" if fallback_ok else "degraded"
    return "unknown"


def build_payload() -> dict[str, Any]:
    errors: list[str] = []

    services = {
        "xray": service_status("xray"),
        "wg-egress-netns": service_status("wg-egress-netns"),
        "xray-wg-sidecar": service_status("xray-wg-sidecar"),
        "lightsail-egress-socks": service_status("lightsail-egress-socks"),
    }

    sidecar_ipv4_ok, sidecar_ipv4 = curl_via_socks("https://api64.ipify.org", SIDECAR_SOCKS)
    sidecar_ipv6_ok, sidecar_ipv6 = curl_via_socks("https://v6.ident.me", SIDECAR_SOCKS)
    fallback_ipv4_ok, fallback_ipv4 = curl_via_socks("https://api64.ipify.org", FALLBACK_SOCKS)

    if not sidecar_ipv4_ok:
        errors.append(f"sidecar IPv4 check failed: {sidecar_ipv4}")
    if not sidecar_ipv6_ok:
        errors.append(f"sidecar IPv6 check failed: {sidecar_ipv6}")
    if not fallback_ipv4_ok:
        errors.append(f"fallback IPv4 check failed: {fallback_ipv4}")

    xray = read_xray_outbound()
    if xray.get("error"):
        errors.append(str(xray["error"]))

    sidecar_ok = sidecar_ipv4_ok and sidecar_ipv4.strip() == EXPECTED_IPV4
    fallback_ok = fallback_ipv4_ok and fallback_ipv4.strip() == EXPECTED_IPV4
    globalping = read_globalping()
    if globalping.get("error"):
        errors.append(f"globalping check failed: {globalping['error']}")

    provider_usage = read_provider_usage()
    if provider_usage.get("error") not in (None, 0, "0"):
        errors.append(f"provider usage check failed: {provider_usage['error']}")
    if provider_usage.get("raw_error"):
        errors.append(f"provider raw usage check failed: {provider_usage['raw_error']}")

    return {
        "host": HOST,
        "checked_at": now_iso(),
        "mode": detect_mode(xray, sidecar_ok, fallback_ok),
        "services": services,
        "egress": {
            "ipv4": sidecar_ipv4.strip() if sidecar_ipv4_ok else None,
            "ipv6": sidecar_ipv6.strip() if sidecar_ipv6_ok else None,
            "fallback_ipv4": fallback_ipv4.strip() if fallback_ipv4_ok else None,
            "sidecar_ok": sidecar_ok,
            "fallback_ok": fallback_ok,
        },
        "latency": read_latency(),
        "globalping": globalping,
        "provider": {"usage": provider_usage},
        "wireguard": read_wireguard(),
        "xray": xray,
        "expected": {
            "ipv4": EXPECTED_IPV4,
            "ipv6": EXPECTED_IPV6,
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
            "User-Agent": "bandwagon-proxy-health/1.0",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            sys.stdout.write(response.read().decode("utf-8") + "\n")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"POST failed: HTTP {exc.code}: {body}") from exc


def main() -> None:
    payload = build_payload()
    post_payload(payload)


if __name__ == "__main__":
    main()
