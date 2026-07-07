#!/usr/bin/env python3
"""Report Bandwagon → Linode proxy health to the Next.js dashboard.

Required environment variables:
  PROXY_HEALTH_INGEST_URL=https://teamleaderleo.com/api/proxy-health/ingest
  PROXY_HEALTH_TOKEN=...

Optional:
  PROXY_HEALTH_HOST=bandwagon-la
  EXPECTED_EGRESS_IPV4=172.235.56.214
  EXPECTED_EGRESS_IPV6=2a01:7e03::2000:56ff:fe71:cbd
  PROXY_LATENCY_URL=https://www.gstatic.com/generate_204
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
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


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


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
