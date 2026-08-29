#!/usr/bin/env python3
"""Emit or post a privacy-bounded Big Red health snapshot.

The JSON contract deliberately contains no command output, process arguments,
ports, addresses, interface names, SSIDs, Tailscale peers, or browser metadata.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import shutil
import subprocess
import urllib.request
import urllib.parse
from pathlib import Path
from typing import Any


GIB = 1024**3
COMMAND_TIMEOUT_SECONDS = 4


def run(*command: str) -> tuple[int, str]:
    try:
        result = subprocess.run(
            command,
            check=False,
            capture_output=True,
            text=True,
            timeout=COMMAND_TIMEOUT_SECONDS,
        )
        return result.returncode, result.stdout.strip()
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return 127, ""


def service_state(name: str, *, user: bool = False) -> str:
    command = ["systemctl"]
    if user:
        command.append("--user")
    command.extend(["is-active", name])
    code, output = run(*command)
    if code == 0 and output == "active":
        return "active"
    load_code, load = run("systemctl", *( ["--user"] if user else []), "show", "-p", "LoadState", "--value", name)
    if load_code != 0 or load == "not-found":
        return "missing"
    return "inactive" if output in {"inactive", "failed", "activating", "deactivating"} else "unknown"


def failed_unit_count(*, user: bool = False) -> int:
    command = ["systemctl"]
    if user:
        command.append("--user")
    command.extend(["--failed", "--no-legend", "--plain"])
    _, output = run(*command)
    return sum(1 for line in output.splitlines() if line.strip())


def memory() -> tuple[float, float]:
    values: dict[str, int] = {}
    for line in Path("/proc/meminfo").read_text(encoding="utf-8").splitlines():
        match = re.match(r"^(MemTotal|MemAvailable):\s+(\d+)\s+kB$", line)
        if match:
            values[match.group(1)] = int(match.group(2)) * 1024
    total = values.get("MemTotal", 0)
    available = values.get("MemAvailable", 0)
    used_percent = 0.0 if total <= 0 else (total - available) / total * 100
    return round(used_percent, 2), round(total / GIB, 2)


def peak_sensor_temperature() -> float | None:
    code, output = run("sensors", "-j")
    if code != 0 or not output:
        return None
    try:
        data = json.loads(output)
    except json.JSONDecodeError:
        return None

    values: list[float] = []

    def visit(value: Any) -> None:
        if isinstance(value, dict):
            for key, child in value.items():
                if key.endswith("_input") and isinstance(child, (int, float)) and -20 <= child <= 150:
                    values.append(float(child))
                else:
                    visit(child)
        elif isinstance(value, list):
            for child in value:
                visit(child)

    visit(data)
    return round(max(values), 1) if values else None


def tailscale_state() -> tuple[str, bool | None]:
    code, output = run("tailscale", "status", "--json")
    if code != 0 or not output:
        return "unknown", None
    try:
        status = json.loads(output)
    except json.JSONDecodeError:
        return "unknown", None
    backend = str(status.get("BackendState", "")).lower()
    mapped = {
        "running": "running",
        "needslogin": "needs-login",
        "stopped": "stopped",
    }.get(backend, "unknown")
    online = status.get("Self", {}).get("Online")
    return mapped, online if isinstance(online, bool) else None


def connectivity() -> str:
    _, output = run("nmcli", "-t", "-f", "CONNECTIVITY", "general")
    value = output.lower()
    return value if value in {"full", "limited", "portal", "none"} else "unknown"


def power_profile() -> str:
    _, output = run("powerprofilesctl", "get")
    value = output.lower()
    return value if value in {"performance", "balanced", "power-saver"} else "unknown"


def hibernate_targets_masked() -> bool:
    targets = ("hibernate.target", "hybrid-sleep.target")
    return all(run("systemctl", "is-enabled", target)[1] == "masked" for target in targets)


def idle_suspend_action(power_source: str) -> str:
    _, output = run(
        "gsettings",
        "get",
        "org.gnome.settings-daemon.plugins.power",
        f"sleep-inactive-{power_source}-type",
    )
    value = output.strip("'\"").lower()
    return value if value in {"nothing", "suspend", "hibernate", "shutdown"} else "unknown"


def process_table() -> dict[int, tuple[int, str, str]]:
    rows: dict[int, tuple[int, str, str]] = {}
    for entry in Path("/proc").iterdir():
        if not entry.name.isdigit():
            continue
        try:
            stat = (entry / "stat").read_text(encoding="utf-8")
            close = stat.rfind(")")
            fields = stat[close + 2 :].split()
            parent = int(fields[1])
            comm = (entry / "comm").read_text(encoding="utf-8").strip().lower()
            cmdline = (entry / "cmdline").read_bytes().replace(b"\0", b" ").decode("utf-8", "replace").lower()
            rows[int(entry.name)] = (parent, comm, cmdline)
        except (FileNotFoundError, PermissionError, ProcessLookupError, ValueError):
            continue
    return rows


def hygiene_counts() -> tuple[int, int, int]:
    rows = process_table()
    browser_names = {"firefox", "chrome", "chromium", "msedge", "brave"}
    browser_roots = sum(
        1
        for _, (_, comm, cmdline) in rows.items()
        if comm in browser_names and "--type=" not in cmdline
    )
    codex_workers = sum(
        1
        for _, (_, comm, cmdline) in rows.items()
        if comm == "codex" and "app-server" in cmdline and "--listen stdio://" in cmdline
    )

    _, listeners = run("ss", "-H", "-ltnp")
    dev_pids: set[int] = set()
    patterns = ("next dev", "vite", "webpack serve", "uvicorn", "gunicorn", "flask run", "rails server")
    for pid_text in re.findall(r'pid=(\d+)', listeners):
        pid = int(pid_text)
        row = rows.get(pid)
        if row and any(pattern in row[2] for pattern in patterns):
            dev_pids.add(pid)
    return browser_roots, codex_workers, len(dev_pids)


def build_report() -> dict[str, Any]:
    load_one, load_five, load_fifteen = os.getloadavg()
    logical_cpus = os.cpu_count() or 1
    used_percent, total_gib = memory()
    disk = shutil.disk_usage("/")
    tailscale_backend, tailscale_online = tailscale_state()
    browser_roots, codex_workers, dev_listeners = hygiene_counts()
    time_sync_states = (service_state("chrony.service"), service_state("systemd-timesyncd.service"))

    return {
        "schema_version": 1,
        "host": "big-red",
        "checked_at": dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z"),
        "uptime_seconds": max(0, int(float(Path("/proc/uptime").read_text().split()[0]))),
        "load": {
            "one": round(load_one, 3),
            "five": round(load_five, 3),
            "fifteen": round(load_fifteen, 3),
            "logical_cpus": logical_cpus,
        },
        "memory": {"used_percent": used_percent, "total_gib": total_gib},
        "disk": {
            "root_used_percent": round(disk.used / disk.total * 100, 2),
            "root_free_gib": round(disk.free / GIB, 2),
        },
        "temperature": {"peak_sensor_c": peak_sensor_temperature()},
        "services": {
            "failed_system_units": failed_unit_count(),
            "failed_user_units": failed_unit_count(user=True),
            "ssh": service_state("ssh.service"),
            "tailscale": service_state("tailscaled.service"),
            "network_manager": service_state("NetworkManager.service"),
            "time_sync": "active" if "active" in time_sync_states else ("missing" if all(state == "missing" for state in time_sync_states) else "inactive"),
        },
        "network": {
            "connectivity": connectivity(),
            "tailscale_backend": tailscale_backend,
            "tailscale_self_online": tailscale_online,
        },
        "power": {
            "profile": power_profile(),
            "idle_suspend_ac": idle_suspend_action("ac"),
            "idle_suspend_battery": idle_suspend_action("battery"),
            "hibernate_targets_masked": hibernate_targets_masked(),
        },
        "hygiene": {
            "browser_roots": browser_roots,
            "codex_workers": codex_workers,
            "unexpected_dev_listeners": dev_listeners,
        },
    }


def post_report(report: dict[str, Any], endpoint: str, token: str) -> None:
    parsed_endpoint = urllib.parse.urlsplit(endpoint)
    local_http = parsed_endpoint.scheme == "http" and parsed_endpoint.hostname in {
        "127.0.0.1",
        "localhost",
        "::1",
    }
    if parsed_endpoint.scheme != "https" and not local_http:
        raise RuntimeError("Machine health endpoint must use HTTPS")
    payload = json.dumps(report, separators=(",", ":")).encode("utf-8")
    request = urllib.request.Request(
        endpoint,
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "big-red-health-report/1",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        if response.status // 100 != 2:
            raise RuntimeError(f"Health endpoint returned HTTP {response.status}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--print-only", action="store_true", help="Never send the report")
    args = parser.parse_args()
    report = build_report()
    print(json.dumps(report, indent=2, sort_keys=True))

    if args.print_only:
        return 0
    endpoint = os.environ.get("MACHINE_HEALTH_INGEST_URL", "").strip()
    token = os.environ.get("MACHINE_HEALTH_INGEST_SECRET", "").strip()
    if not endpoint and not token:
        return 0
    if not endpoint or not token:
        raise SystemExit("Both MACHINE_HEALTH_INGEST_URL and MACHINE_HEALTH_INGEST_SECRET are required")
    post_report(report, endpoint, token)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
