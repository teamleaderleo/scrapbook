#!/usr/bin/env python3
"""Emit or post a privacy-bounded Big Red health snapshot.

The JSON contract deliberately contains no command output, process arguments,
ports, addresses, interface names, SSIDs, Tailscale peers, or browser metadata.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import os
import re
import shutil
import subprocess
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


GIB = 1024**3
MIB = 1024**2
COMMAND_TIMEOUT_SECONDS = 4
ACTIVITY_SAMPLE_SECONDS = 0.25
SYSSTAT_WINDOW_RECORDS = 6
SYSSTAT_MAX_AGE_MINUTES = 90
CODEX_TOKEN_FIELDS = (
    "input_tokens",
    "cached_input_tokens",
    "cache_write_input_tokens",
    "output_tokens",
    "reasoning_output_tokens",
    "total_tokens",
)
GLAEDA_REPOSITORY = Path.home() / "Projects" / "glaeda"
GLAEDA_CACHE = Path.home() / ".cache" / "glaeda"


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
    load_code, load = run(
        "systemctl",
        *(["--user"] if user else []),
        "show",
        "-p",
        "LoadState",
        "--value",
        name,
    )
    if load_code != 0 or load == "not-found":
        return "missing"
    return (
        "inactive"
        if output in {"inactive", "failed", "activating", "deactivating"}
        else "unknown"
    )


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


def cpu_counters() -> tuple[int, int]:
    fields = Path("/proc/stat").read_text(encoding="utf-8").splitlines()[0].split()[1:]
    values = [int(value) for value in fields]
    total = sum(values)
    idle = values[3] + (values[4] if len(values) > 4 else 0)
    return total, idle


def network_counters() -> tuple[int, int]:
    received = 0
    transmitted = 0
    for line in Path("/proc/net/dev").read_text(encoding="utf-8").splitlines()[2:]:
        if ":" not in line:
            continue
        interface, counters = line.split(":", 1)
        if interface.strip() == "lo":
            continue
        fields = counters.split()
        if len(fields) >= 16:
            received += int(fields[0])
            transmitted += int(fields[8])
    return received, transmitted


def activity_sample() -> tuple[float, float, float]:
    first_total, first_idle = cpu_counters()
    first_rx, first_tx = network_counters()
    started = time.monotonic()
    time.sleep(ACTIVITY_SAMPLE_SECONDS)
    elapsed = max(time.monotonic() - started, 0.001)
    second_total, second_idle = cpu_counters()
    second_rx, second_tx = network_counters()

    total_delta = max(0, second_total - first_total)
    idle_delta = max(0, second_idle - first_idle)
    cpu_used = (
        0.0 if total_delta == 0 else (total_delta - idle_delta) / total_delta * 100
    )
    rx_mib_s = max(0, second_rx - first_rx) / MIB / elapsed
    tx_mib_s = max(0, second_tx - first_tx) / MIB / elapsed
    return round(max(0, min(100, cpu_used)), 2), round(rx_mib_s, 3), round(tx_mib_s, 3)


def finite_number(value: Any) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    number = float(value)
    return number if math.isfinite(number) else None


def sysstat_timestamp(statistic: dict[str, Any]) -> dt.datetime | None:
    timestamp = statistic.get("timestamp")
    if not isinstance(timestamp, dict) or timestamp.get("tz") != "UTC":
        return None
    date = timestamp.get("date")
    time_value = timestamp.get("time")
    if not isinstance(date, str) or not isinstance(time_value, str):
        return None
    try:
        return dt.datetime.fromisoformat(
            f"{date}T{time_value}+00:00"
        ).astimezone(dt.timezone.utc)
    except ValueError:
        return None


def sysstat_record(statistic: dict[str, Any]) -> dict[str, float] | None:
    timestamp = statistic.get("timestamp")
    cpu_rows = statistic.get("cpu-load")
    memory_row = statistic.get("memory")
    if (
        not isinstance(timestamp, dict)
        or not isinstance(cpu_rows, list)
        or not isinstance(memory_row, dict)
    ):
        return None

    interval = finite_number(timestamp.get("interval"))
    cpu_all = next(
        (row for row in cpu_rows if isinstance(row, dict) and row.get("cpu") == "all"),
        None,
    )
    idle = finite_number(cpu_all.get("idle")) if cpu_all else None
    memory_used = finite_number(memory_row.get("memused-percent"))
    if interval is None or interval <= 0 or idle is None or memory_used is None:
        return None

    network = statistic.get("network")
    network_rows = network.get("net-dev") if isinstance(network, dict) else None
    rx_kib_s = 0.0
    tx_kib_s = 0.0
    if isinstance(network_rows, list):
        for row in network_rows:
            if not isinstance(row, dict) or row.get("iface") == "lo":
                continue
            rx_kib_s += max(0.0, finite_number(row.get("rxkB")) or 0.0)
            tx_kib_s += max(0.0, finite_number(row.get("txkB")) or 0.0)

    disk_read_kib_s = 0.0
    disk_write_kib_s = 0.0
    disk_rows = statistic.get("disk")
    if isinstance(disk_rows, list):
        for row in disk_rows:
            if not isinstance(row, dict):
                continue
            device = row.get("disk-device")
            if not isinstance(device, str) or device.startswith(("loop", "ram")):
                continue
            disk_read_kib_s += max(0.0, finite_number(row.get("rkB")) or 0.0)
            disk_write_kib_s += max(0.0, finite_number(row.get("wkB")) or 0.0)

    psi = statistic.get("psi")
    psi_cpu = psi.get("psi-cpu") if isinstance(psi, dict) else None
    psi_memory = psi.get("psi-mem") if isinstance(psi, dict) else None
    psi_io = psi.get("psi-io") if isinstance(psi, dict) else None

    return {
        "interval": interval,
        "cpu": max(0.0, min(100.0, 100.0 - idle)),
        "memory": max(0.0, min(100.0, memory_used)),
        "rx": rx_kib_s / 1024,
        "tx": tx_kib_s / 1024,
        "disk_read": disk_read_kib_s / 1024,
        "disk_write": disk_write_kib_s / 1024,
        "psi_cpu": max(
            0.0,
            min(
                100.0,
                (finite_number(psi_cpu.get("some_avg")) or 0.0)
                if isinstance(psi_cpu, dict)
                else 0.0,
            ),
        ),
        "psi_memory": max(
            0.0,
            min(
                100.0,
                (finite_number(psi_memory.get("full_avg")) or 0.0)
                if isinstance(psi_memory, dict)
                else 0.0,
            ),
        ),
        "psi_io": max(
            0.0,
            min(
                100.0,
                (finite_number(psi_io.get("full_avg")) or 0.0)
                if isinstance(psi_io, dict)
                else 0.0,
            ),
        ),
    }


def weighted_average(records: list[dict[str, float]], key: str) -> float:
    weight = sum(record["interval"] for record in records)
    if weight <= 0:
        return 0.0
    return sum(record[key] * record["interval"] for record in records) / weight


def sysstat_activity(now: dt.datetime) -> dict[str, Any] | None:
    directory = Path("/var/log/sysstat")
    try:
        files = sorted(
            directory.glob("sa[0-9][0-9]"),
            key=lambda path: path.stat().st_mtime,
            reverse=True,
        )[:2]
    except (FileNotFoundError, PermissionError):
        return None

    cutoff = now - dt.timedelta(minutes=SYSSTAT_MAX_AGE_MINUTES)
    records_by_timestamp: dict[dt.datetime, dict[str, float]] = {}
    for path in files:
        code, output = run(
            "sadf",
            "-j",
            str(path),
            "--",
            "-u",
            "-r",
            "-q",
            "PSI",
            "-d",
            "-n",
            "DEV",
        )
        if code != 0 or not output:
            continue
        try:
            document = json.loads(output)
            hosts = document.get("sysstat", {}).get("hosts", [])
            statistics = hosts[0].get("statistics", []) if hosts else []
        except (AttributeError, IndexError, json.JSONDecodeError):
            continue
        if not isinstance(statistics, list):
            continue
        for statistic in statistics:
            if not isinstance(statistic, dict):
                continue
            observed_at = sysstat_timestamp(statistic)
            record = sysstat_record(statistic)
            if (
                observed_at is not None
                and record is not None
                and cutoff <= observed_at <= now + dt.timedelta(minutes=5)
            ):
                records_by_timestamp[observed_at] = record

    records = [
        record
        for _, record in sorted(records_by_timestamp.items())[-SYSSTAT_WINDOW_RECORDS:]
    ]
    if not records:
        return None

    return {
        "source": "sysstat-10m",
        "window_minutes": round(sum(record["interval"] for record in records) / 60),
        "sample_count": len(records),
        "cpu_used_percent": round(weighted_average(records, "cpu"), 2),
        "cpu_peak_percent": round(max(record["cpu"] for record in records), 2),
        "memory_used_percent": round(weighted_average(records, "memory"), 2),
        "memory_peak_percent": round(max(record["memory"] for record in records), 2),
        "network_rx_mib_s": round(weighted_average(records, "rx"), 3),
        "network_tx_mib_s": round(weighted_average(records, "tx"), 3),
        "disk_read_mib_s": round(weighted_average(records, "disk_read"), 3),
        "disk_write_mib_s": round(weighted_average(records, "disk_write"), 3),
        "cpu_pressure_some_percent": round(weighted_average(records, "psi_cpu"), 3),
        "memory_pressure_full_percent": round(
            weighted_average(records, "psi_memory"), 3
        ),
        "io_pressure_full_percent": round(weighted_average(records, "psi_io"), 3),
    }


def activity_window(now: dt.datetime) -> dict[str, Any]:
    historical = sysstat_activity(now)
    if historical is not None:
        return historical

    cpu_used, network_rx_mib_s, network_tx_mib_s = activity_sample()
    memory_used, _ = memory()
    return {
        "source": "point",
        "window_minutes": 0,
        "sample_count": 1,
        "cpu_used_percent": cpu_used,
        "cpu_peak_percent": cpu_used,
        "memory_used_percent": memory_used,
        "memory_peak_percent": memory_used,
        "network_rx_mib_s": network_rx_mib_s,
        "network_tx_mib_s": network_tx_mib_s,
        "disk_read_mib_s": None,
        "disk_write_mib_s": None,
        "cpu_pressure_some_percent": None,
        "memory_pressure_full_percent": None,
        "io_pressure_full_percent": None,
    }


def codex_usage_window(
    now: dt.datetime, session_directory: Path | None = None
) -> dict[str, Any]:
    """Aggregate the previous complete UTC hour without retaining content."""
    window_end = now.astimezone(dt.timezone.utc).replace(
        minute=0, second=0, microsecond=0
    )
    window_start = window_end - dt.timedelta(hours=1)
    directory = session_directory or Path.home() / ".codex" / "sessions"
    totals = {field: 0 for field in CODEX_TOKEN_FIELDS}
    model_calls = 0
    active_routes = 0

    try:
        paths = list(directory.rglob("*.jsonl"))
    except (FileNotFoundError, PermissionError):
        paths = []
        available = False
    else:
        available = directory.is_dir()

    for path in paths:
        try:
            if path.stat().st_mtime < window_start.timestamp():
                continue
            route_active = False
            with path.open("r", encoding="utf-8") as session:
                for line in session:
                    try:
                        record = json.loads(line)
                        payload = record.get("payload") or {}
                        info = payload.get("info") or {}
                        if payload.get("type") != "token_count":
                            continue
                        timestamp = dt.datetime.fromisoformat(
                            str(record.get("timestamp", "")).replace("Z", "+00:00")
                        ).astimezone(dt.timezone.utc)
                        usage = info.get("last_token_usage")
                    except (AttributeError, json.JSONDecodeError, ValueError):
                        continue
                    if not isinstance(usage, dict) or not (
                        window_start <= timestamp < window_end
                    ):
                        continue
                    values: dict[str, int] = {}
                    valid = True
                    for field in CODEX_TOKEN_FIELDS:
                        value = usage.get(field, 0)
                        if (
                            isinstance(value, bool)
                            or not isinstance(value, int)
                            or value < 0
                        ):
                            valid = False
                            break
                        values[field] = value
                    if not valid:
                        continue
                    for field, value in values.items():
                        totals[field] += value
                    model_calls += 1
                    route_active = True
            if route_active:
                active_routes += 1
        except (FileNotFoundError, PermissionError, OSError):
            continue

    return {
        "source": "session-jsonl" if available else "unavailable",
        "window_started_at": window_start.isoformat().replace("+00:00", "Z"),
        "window_ended_at": window_end.isoformat().replace("+00:00", "Z"),
        **totals,
        "model_calls": model_calls,
        "active_routes": active_routes,
    }


def read_number(path: Path) -> float | None:
    try:
        return float(path.read_text(encoding="utf-8").strip())
    except (FileNotFoundError, PermissionError, ValueError):
        return None


def graphics_clock() -> tuple[float | None, float | None]:
    candidates: list[tuple[float, float]] = []
    for card in Path("/sys/class/drm").glob("card[0-9]*"):
        pairs = (
            (card / "gt_act_freq_mhz", card / "gt_max_freq_mhz"),
            (card / "gt/gt0/rps_act_freq_mhz", card / "gt/gt0/rps_max_freq_mhz"),
        )
        for current_path, max_path in pairs:
            current = read_number(current_path)
            maximum = read_number(max_path)
            if current is not None and maximum is not None and maximum > 0:
                candidates.append((current, maximum))
                break
    if not candidates:
        return None, None
    current, maximum = max(candidates, key=lambda pair: pair[1])
    return round(current, 1), round(maximum, 1)


def battery_state() -> tuple[bool | None, float | None, str]:
    battery = next(iter(sorted(Path("/sys/class/power_supply").glob("BAT*"))), None)
    percent = read_number(battery / "capacity") if battery else None
    raw_state = ""
    if battery:
        try:
            raw_state = (battery / "status").read_text(encoding="utf-8").strip().lower()
        except (FileNotFoundError, PermissionError):
            pass
    state = {
        "full": "full",
        "charging": "charging",
        "discharging": "discharging",
        "not charging": "not-charging",
    }.get(raw_state, "unknown")

    adapter_values = [
        read_number(path)
        for pattern in ("ADP*/online", "AC*/online")
        for path in Path("/sys/class/power_supply").glob(pattern)
    ]
    known_adapter_values = [value for value in adapter_values if value is not None]
    on_ac = (
        any(value >= 1 for value in known_adapter_values)
        if known_adapter_values
        else None
    )
    return on_ac, percent, state


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
                if (
                    key.endswith("_input")
                    and isinstance(child, (int, float))
                    and -20 <= child <= 150
                ):
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
    return all(
        run("systemctl", "is-enabled", target)[1] == "masked" for target in targets
    )


def idle_suspend_action(power_source: str) -> str:
    _, output = run(
        "gsettings",
        "get",
        "org.gnome.settings-daemon.plugins.power",
        f"sleep-inactive-{power_source}-type",
    )
    value = output.strip("'\"").lower()
    return (
        value
        if value in {"nothing", "suspend", "hibernate", "shutdown"}
        else "unknown"
    )


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
            cmdline = (
                (entry / "cmdline")
                .read_bytes()
                .replace(b"\0", b" ")
                .decode("utf-8", "replace")
                .lower()
            )
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
    # Each active Codex route owns one code-mode REPL. Count only that leaf
    # process so the persistent desktop and remote-control daemons are excluded.
    codex_workers = sum(
        1 for _, (_, comm, _) in rows.items() if comm == "node_repl"
    )

    _, listeners = run("ss", "-H", "-ltnp")
    dev_pids: set[int] = set()
    patterns = (
        "next dev",
        "vite",
        "webpack serve",
        "uvicorn",
        "gunicorn",
        "flask run",
        "rails server",
    )
    for pid_text in re.findall(r'pid=(\d+)', listeners):
        pid = int(pid_text)
        row = rows.get(pid)
        if row and any(pattern in row[2] for pattern in patterns):
            dev_pids.add(pid)
    return browser_roots, codex_workers, len(dev_pids)


def glaeda_worktrees(repository: Path = GLAEDA_REPOSITORY) -> list[Path] | None:
    code, output = run(
        "git", "-C", str(repository), "worktree", "list", "--porcelain"
    )
    if code != 0:
        return None
    worktrees = []
    for line in output.splitlines():
        if line.startswith("worktree "):
            worktrees.append(Path(line.removeprefix("worktree ")))
    return worktrees


def apparent_directory_sizes(
    paths: list[Path], *, exclude: str | None = None
) -> dict[Path, int] | None:
    existing = [path for path in paths if path.is_dir()]
    if not existing:
        return {}
    command = ["du", "-sb"]
    if exclude is not None:
        command.append(f"--exclude={exclude}")
    command.extend(["--", *(str(path) for path in existing)])
    code, output = run(*command)
    if code != 0:
        return None

    sizes: dict[Path, int] = {}
    for line in output.splitlines():
        size_text, separator, path_text = line.partition("\t")
        if not separator:
            return None
        try:
            sizes[Path(path_text)] = int(size_text)
        except ValueError:
            return None
    return sizes if len(sizes) == len(existing) else None


def active_glaeda_build_processes(worktrees: list[Path]) -> int:
    roots = [path.absolute() for path in worktrees]
    active = 0
    for entry in Path("/proc").iterdir():
        if not entry.name.isdigit():
            continue
        try:
            comm = (entry / "comm").read_text(encoding="utf-8").strip().lower()
            if comm not in {"cargo", "rustc"} and not comm.startswith("glaeda-"):
                continue
            cwd = (entry / "cwd").resolve(strict=True)
        except (FileNotFoundError, PermissionError, ProcessLookupError, OSError):
            continue
        if any(cwd == root or root in cwd.parents for root in roots):
            active += 1
    return active


def build_state(
    worktrees: list[Path] | None = None,
    cache: Path = GLAEDA_CACHE,
) -> dict[str, Any]:
    observed_worktrees = worktrees if worktrees is not None else glaeda_worktrees()
    if observed_worktrees is None:
        return {
            "source": "unavailable",
            "total_gib": None,
            "target_gib": None,
            "glaeda_cache_gib": None,
            "target_count": None,
            "active_build_processes": None,
        }

    targets = [worktree / "target" for worktree in observed_worktrees]
    existing_targets = [target for target in targets if target.is_dir()]
    target_sizes = apparent_directory_sizes(existing_targets)
    cache_sizes = apparent_directory_sizes(
        [cache] if cache.is_dir() else [], exclude="work-*"
    )
    if target_sizes is None or cache_sizes is None:
        return {
            "source": "unavailable",
            "total_gib": None,
            "target_gib": None,
            "glaeda_cache_gib": None,
            "target_count": len(existing_targets),
            "active_build_processes": active_glaeda_build_processes(
                observed_worktrees
            ),
        }

    target_bytes = sum(target_sizes.get(target, 0) for target in existing_targets)
    cache_bytes = cache_sizes.get(cache, 0)
    return {
        "source": "filesystem",
        "total_gib": round((target_bytes + cache_bytes) / GIB, 2),
        "target_gib": round(target_bytes / GIB, 2),
        "glaeda_cache_gib": round(cache_bytes / GIB, 2),
        "target_count": len(existing_targets),
        "active_build_processes": active_glaeda_build_processes(observed_worktrees),
    }


def build_report() -> dict[str, Any]:
    now = dt.datetime.now(dt.timezone.utc)
    load_one, load_five, load_fifteen = os.getloadavg()
    logical_cpus = os.cpu_count() or 1
    activity = activity_window(now)
    codex_usage = codex_usage_window(now)
    _, total_gib = memory()
    disk = shutil.disk_usage("/")
    graphics_clock_mhz, graphics_max_clock_mhz = graphics_clock()
    on_ac, battery_percent, power_state = battery_state()
    tailscale_backend, tailscale_online = tailscale_state()
    browser_roots, codex_workers, dev_listeners = hygiene_counts()
    time_sync_states = (
        service_state("chrony.service"),
        service_state("systemd-timesyncd.service"),
    )

    return {
        "schema_version": 1,
        "host": "big-red",
        "checked_at": now.isoformat().replace("+00:00", "Z"),
        "uptime_seconds": max(
            0, int(float(Path("/proc/uptime").read_text().split()[0]))
        ),
        "load": {
            "one": round(load_one, 3),
            "five": round(load_five, 3),
            "fifteen": round(load_fifteen, 3),
            "logical_cpus": logical_cpus,
        },
        "cpu": {"used_percent": activity["cpu_used_percent"]},
        "memory": {
            "used_percent": activity["memory_used_percent"],
            "total_gib": total_gib,
        },
        "disk": {
            "root_used_percent": round(disk.used / disk.total * 100, 2),
            "root_free_gib": round(disk.free / GIB, 2),
        },
        "temperature": {"peak_sensor_c": peak_sensor_temperature()},
        "graphics": {
            "clock_mhz": graphics_clock_mhz,
            "max_clock_mhz": graphics_max_clock_mhz,
        },
        "activity": {
            "source": activity["source"],
            "window_minutes": activity["window_minutes"],
            "sample_count": activity["sample_count"],
            "cpu_peak_percent": activity["cpu_peak_percent"],
            "memory_peak_percent": activity["memory_peak_percent"],
            "cpu_pressure_some_percent": activity[
                "cpu_pressure_some_percent"
            ],
            "memory_pressure_full_percent": activity[
                "memory_pressure_full_percent"
            ],
            "io_pressure_full_percent": activity["io_pressure_full_percent"],
            "disk_read_mib_s": activity["disk_read_mib_s"],
            "disk_write_mib_s": activity["disk_write_mib_s"],
        },
        "codex_usage": codex_usage,
        "services": {
            "failed_system_units": failed_unit_count(),
            "failed_user_units": failed_unit_count(user=True),
            "ssh": service_state("ssh.service"),
            "tailscale": service_state("tailscaled.service"),
            "network_manager": service_state("NetworkManager.service"),
            "time_sync": (
                "active"
                if "active" in time_sync_states
                else (
                    "missing"
                    if all(state == "missing" for state in time_sync_states)
                    else "inactive"
                )
            ),
        },
        "network": {
            "connectivity": connectivity(),
            "tailscale_backend": tailscale_backend,
            "tailscale_self_online": tailscale_online,
            "rx_mib_s": activity["network_rx_mib_s"],
            "tx_mib_s": activity["network_tx_mib_s"],
        },
        "power": {
            "profile": power_profile(),
            "idle_suspend_ac": idle_suspend_action("ac"),
            "idle_suspend_battery": idle_suspend_action("battery"),
            "hibernate_targets_masked": hibernate_targets_masked(),
            "on_ac": on_ac,
            "battery_percent": battery_percent,
            "battery_state": power_state,
        },
        "hygiene": {
            "browser_roots": browser_roots,
            "codex_workers": codex_workers,
            "unexpected_dev_listeners": dev_listeners,
        },
        "build_state": build_state(),
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
    parser.add_argument(
        "--print-only", action="store_true", help="Never send the report"
    )
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
        raise SystemExit(
            "Both MACHINE_HEALTH_INGEST_URL and MACHINE_HEALTH_INGEST_SECRET are required"
        )
    post_report(report, endpoint, token)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
