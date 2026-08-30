#!/usr/bin/env python3
"""Emit or post a privacy-bounded Big Red health snapshot.

The JSON contract deliberately contains no command output, process arguments,
ports, addresses, interface names, SSIDs, Tailscale peer identifiers, or
browser metadata.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import hmac
import ipaddress
import json
import math
import os
import re
import shutil
import statistics
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable
from pathlib import Path
from typing import Any


GIB = 1024**3
MIB = 1024**2
COMMAND_TIMEOUT_SECONDS = 4
CODEX_STATE_TIMEOUT_SECONDS = 12
CODEX_STATE_OUTPUT_BYTES = 64 * 1024
SMAPS_ROLLUP_OUTPUT_BYTES = 256 * 1024
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
CODEX_FORK_REPLAY_SECONDS = 2
GLAEDA_REPOSITORY = Path.home() / "Projects" / "glaeda"
GLAEDA_CACHE = Path.home() / ".cache" / "glaeda"
CODEX_ROUTE_STATUS_HELPER = (
    Path.home() / "Projects" / "leo-workspace" / "tools" / "codex_route_job.py"
)
CODEX_PROCESS_TAGS_HELPER = (
    Path.home() / "Projects" / "leo-workspace" / "tools" / "codex_route_hook.py"
)
CODEX_PROCESS_COVERAGE_HELPER = (
    Path.home()
    / "Projects"
    / "leo-workspace"
    / "tools"
    / "codex_process_coverage.py"
)
CODEX_STATE_INVENTORY_HELPER = (
    Path.home() / "Projects" / "leo-workspace" / "tools" / "codex_state_inventory.py"
)
GNOME_POLISH_HELPER = (
    Path.home() / "Projects" / "leo-workspace" / "tools" / "gnome_polish_variants.py"
)
RELIABILITY_WINDOW_HOURS = 24
RELIABILITY_EVENT_LIMIT = 4_096
GRD_ACCELERATION_EVENT_LIMIT = 512
GRD_SESSION_EVENT_LIMIT = 512
SYSTEMD_PROCESS_EXIT_MESSAGE_ID = "98e322203f7a4ed290d09fe03c09fe15"
SYSTEMD_RESTART_MESSAGE_ID = "5eb03494b6584870a536b337290809b3"


class RejectRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(
        self,
        request: urllib.request.Request,
        file_pointer: Any,
        code: int,
        message: str,
        headers: Any,
        new_url: str,
    ) -> None:
        return None


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


def run_codex_state(helper: Path) -> tuple[int, str]:
    try:
        result = subprocess.run(
            (sys.executable, str(helper), "--format", "aggregate-json"),
            check=False,
            capture_output=True,
            text=True,
            timeout=CODEX_STATE_TIMEOUT_SECONDS,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return 127, ""
    output = result.stdout.strip()
    if len(output.encode("utf-8")) > CODEX_STATE_OUTPUT_BYTES:
        return 127, ""
    return result.returncode, output


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


def sysstat_activity(
    now: dt.datetime, directory: Path | None = None
) -> dict[str, Any] | None:
    directory = directory or Path("/var/log/sysstat")
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
    now: dt.datetime,
    session_directory: Path | None = None,
    fingerprint_key: bytes | None = None,
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
    session_fingerprints: set[str] = set()
    fingerprints_complete = fingerprint_key is not None

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
            session_started_at: dt.datetime | None = None
            session_id: str | None = None
            forked_session = False
            events: list[tuple[dt.datetime, dict[str, int]]] = []
            with path.open("r", encoding="utf-8") as session:
                for line in session:
                    try:
                        record = json.loads(line)
                        payload = record.get("payload") or {}
                        timestamp = dt.datetime.fromisoformat(
                            str(record.get("timestamp", "")).replace("Z", "+00:00")
                        ).astimezone(dt.timezone.utc)
                        if session_started_at is None:
                            session_started_at = timestamp
                        if record.get("type") == "session_meta":
                            candidate = payload.get("id") or payload.get("session_id")
                            if isinstance(candidate, str) and candidate:
                                session_id = candidate
                        if payload.get("forked_from_id"):
                            forked_session = True
                        info = payload.get("info") or {}
                        if payload.get("type") != "token_count":
                            continue
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
                    events.append((timestamp, values))

            if forked_session and session_started_at is not None:
                # Full-history forks rewrite copied counters at session startup.
                replay_cutoff = session_started_at + dt.timedelta(
                    seconds=CODEX_FORK_REPLAY_SECONDS
                )
                replay_events = sum(
                    timestamp < replay_cutoff for timestamp, _ in events
                )
                if replay_events > 1:
                    events = [
                        event for event in events if event[0] >= replay_cutoff
                    ]

            for _, values in events:
                for field, value in values.items():
                    totals[field] += value
                model_calls += 1
            if events:
                active_routes += 1
                if fingerprint_key is None or session_id is None:
                    fingerprints_complete = False
                else:
                    session_fingerprints.add(
                        hmac.new(
                            fingerprint_key,
                            session_id.encode("utf-8"),
                            hashlib.sha256,
                        ).hexdigest()[:32]
                    )
        except (FileNotFoundError, PermissionError, OSError):
            fingerprints_complete = False
            continue

    return {
        "source": "session-jsonl" if available else "unavailable",
        "window_started_at": window_start.isoformat().replace("+00:00", "Z"),
        "window_ended_at": window_end.isoformat().replace("+00:00", "Z"),
        **totals,
        "model_calls": model_calls,
        "active_routes": active_routes,
        "session_fingerprints": sorted(session_fingerprints),
        "fingerprints_complete": fingerprints_complete,
    }


def route_activity(
    helper: Path = CODEX_ROUTE_STATUS_HELPER,
) -> dict[str, Any]:
    resource_fields = (
        "tagged_resource_jobs",
        "tagged_memory_observed_jobs",
        "tagged_cpu_observed_jobs",
        "tagged_io_observed_jobs",
        "tagged_pressure_observed_jobs",
        "tagged_memory_current_bytes",
        "largest_tagged_job_memory_peak_bytes",
        "tagged_cpu_usage_usec",
        "tagged_io_read_bytes",
        "tagged_io_write_bytes",
        "tagged_cpu_pressure_some_usec",
        "tagged_memory_pressure_some_usec",
        "tagged_memory_pressure_full_usec",
        "tagged_io_pressure_some_usec",
        "tagged_io_pressure_full_usec",
    )
    unavailable = {
        "source": "unavailable",
        "active_routes": None,
        "active_jobs": None,
        "tagged_processes": None,
        "tagged_rss_bytes": None,
        "residue_jobs": None,
        "unknown_routes": None,
        "unknown_jobs": None,
        **dict.fromkeys(resource_fields),
    }
    code, output = run(sys.executable, str(helper), "status")
    if code != 0 or not output:
        return unavailable
    try:
        status = json.loads(output)
    except (json.JSONDecodeError, TypeError):
        return unavailable

    fields = {
        "active_routes": "active_routes",
        "active_jobs": "active_jobs",
        "tagged_processes": "tagged_processes",
        "tagged_rss_bytes": "tagged_rss_bytes",
        "residue_jobs": "complete_residue_jobs",
        "unknown_routes": "unknown_routes",
        "unknown_jobs": "unknown_jobs",
    }
    if not isinstance(status, dict) or status.get("source") != "codex-route-leases-v2":
        return unavailable
    values: dict[str, int | None] = {}
    for public_name, status_name in fields.items():
        value = status.get(status_name)
        if isinstance(value, bool) or not isinstance(value, int) or value < 0:
            return unavailable
        values[public_name] = value
    for field in resource_fields:
        value = status.get(field)
        values[field] = (
            value
            if value is None
            or (
                not isinstance(value, bool)
                and isinstance(value, int)
                and value >= 0
            )
            else None
        )
    resource_jobs = values["tagged_resource_jobs"]
    observed_fields = (
        "tagged_memory_observed_jobs",
        "tagged_cpu_observed_jobs",
        "tagged_io_observed_jobs",
        "tagged_pressure_observed_jobs",
    )
    if resource_jobs is None or any(
        values[field] is not None and values[field] > resource_jobs
        for field in observed_fields
    ):
        for field in resource_fields:
            values[field] = None
    else:
        families = (
            (
                "tagged_memory_observed_jobs",
                (
                    "tagged_memory_current_bytes",
                    "largest_tagged_job_memory_peak_bytes",
                ),
            ),
            ("tagged_cpu_observed_jobs", ("tagged_cpu_usage_usec",)),
            (
                "tagged_io_observed_jobs",
                ("tagged_io_read_bytes", "tagged_io_write_bytes"),
            ),
            (
                "tagged_pressure_observed_jobs",
                (
                    "tagged_cpu_pressure_some_usec",
                    "tagged_memory_pressure_some_usec",
                    "tagged_memory_pressure_full_usec",
                    "tagged_io_pressure_some_usec",
                    "tagged_io_pressure_full_usec",
                ),
            ),
        )
        for observed_field, metric_fields in families:
            observed_jobs = values[observed_field]
            if observed_jobs != resource_jobs:
                for field in metric_fields:
                    values[field] = None
            elif any(values[field] is None for field in metric_fields):
                values[observed_field] = None
    return {"source": "codex-route-leases-v2", **values}


def process_tags(
    helper: Path = CODEX_PROCESS_TAGS_HELPER,
) -> dict[str, Any]:
    fields = (
        "active_routes",
        "active_main_roots",
        "active_subagents",
        "active_jobs",
        "main_root_jobs",
        "subagent_jobs",
        "tagged_processes",
        "main_root_processes",
        "subagent_processes",
        "tagged_memory_current_bytes",
        "main_root_memory_current_bytes",
        "subagent_memory_current_bytes",
        "unknown_jobs",
    )
    unavailable = {
        "source": "unavailable",
        **dict.fromkeys(fields),
    }
    code, output = run(sys.executable, str(helper), "status")
    if code != 0 or not output:
        return unavailable
    try:
        status = json.loads(output)
    except (json.JSONDecodeError, TypeError):
        return unavailable
    if not isinstance(status, dict) or status.get("source") != "codex-route-hook-v1":
        return unavailable

    values: dict[str, int] = {}
    for field in fields:
        value = status.get(field)
        if isinstance(value, bool) or not isinstance(value, int) or value < 0:
            return unavailable
        values[field] = value

    if (
        values["active_routes"] > values["active_jobs"]
        or values["active_main_roots"] > values["active_routes"]
        or values["active_main_roots"] > values["main_root_jobs"]
        or values["active_subagents"] > values["subagent_jobs"]
        or values["main_root_jobs"] + values["subagent_jobs"]
        != values["active_jobs"]
        or values["main_root_processes"] + values["subagent_processes"]
        != values["tagged_processes"]
        or values["main_root_memory_current_bytes"]
        + values["subagent_memory_current_bytes"]
        != values["tagged_memory_current_bytes"]
    ):
        return unavailable
    return {"source": "codex-route-hook-v1", **values}


def desktop_state(helper: Path = GNOME_POLISH_HELPER) -> dict[str, Any]:
    fields = (
        "gnome_shell",
        "pixel_width",
        "pixel_height",
        "refresh_hz",
        "logical_scale",
        "screen_shield_active",
        "animations_enabled",
        "screen_share_mode",
        "wallpaper_references_complete",
    )
    unavailable = {"source": "unavailable", **dict.fromkeys(fields)}
    code, output = run(
        sys.executable,
        str(helper),
        "snapshot",
        "--variant",
        "baseline",
    )
    if code != 0 or not output:
        return unavailable
    try:
        status = json.loads(output)
    except (json.JSONDecodeError, TypeError):
        return unavailable
    if (
        not isinstance(status, dict)
        or status.get("source") != "gnome-polish-live-v2"
        or status.get("schema_version") != 2
        or status.get("variant") != "baseline"
    ):
        return unavailable

    display = status.get("display")
    settings = status.get("settings")
    configured_wallpapers = status.get("configured_wallpapers")
    if (
        not isinstance(display, dict)
        or not isinstance(settings, dict)
        or not isinstance(configured_wallpapers, dict)
    ):
        return unavailable
    mode = display.get("mode")
    mode_match = (
        re.fullmatch(r"([0-9]{3,5})x([0-9]{3,5})", mode)
        if isinstance(mode, str)
        else None
    )
    refresh_hz = finite_number(display.get("refresh_hz"))
    logical_scale = finite_number(display.get("logical_scale"))
    screen_shield_active = display.get("screen_shield_active")
    animations_enabled = settings.get(
        "org.gnome.desktop.interface/enable-animations"
    )
    screen_share_mode = settings.get(
        "org.gnome.desktop.remote-desktop.rdp/screen-share-mode"
    )
    wallpaper_references_complete = configured_wallpapers.get("complete")
    gnome_shell = status.get("gnome_shell")
    if (
        mode_match is None
        or not isinstance(gnome_shell, str)
        or re.fullmatch(r"[0-9]+(?:\.[0-9]+){1,3}", gnome_shell) is None
        or refresh_hz is None
        or not 1 <= refresh_hz <= 1_000
        or logical_scale is None
        or not 0.5 <= logical_scale <= 4
        or not isinstance(screen_shield_active, bool)
        or not isinstance(animations_enabled, bool)
        or screen_share_mode not in {"mirror-primary", "extend"}
        or not isinstance(wallpaper_references_complete, bool)
    ):
        return unavailable
    pixel_width = int(mode_match.group(1))
    pixel_height = int(mode_match.group(2))
    if not 320 <= pixel_width <= 16_384 or not 240 <= pixel_height <= 16_384:
        return unavailable
    return {
        "source": "gnome-polish-live-v2",
        "gnome_shell": gnome_shell,
        "pixel_width": pixel_width,
        "pixel_height": pixel_height,
        "refresh_hz": refresh_hz,
        "logical_scale": logical_scale,
        "screen_shield_active": screen_shield_active,
        "animations_enabled": animations_enabled,
        "screen_share_mode": screen_share_mode,
        "wallpaper_references_complete": wallpaper_references_complete,
    }


def process_coverage(
    helper: Path = CODEX_PROCESS_COVERAGE_HELPER,
) -> dict[str, Any]:
    unavailable = {
        "source": "unavailable",
        "observed_at": None,
        "scope_evidence": None,
        "discoverable_roots": None,
        "discoverable_processes": None,
        "scoped_processes": None,
        "discoverable_rss_bytes": None,
        "evidence_errors": None,
    }
    code, output = run(sys.executable, str(helper))
    if code != 0 or not output:
        return unavailable
    try:
        status = json.loads(output)
    except (json.JSONDecodeError, TypeError):
        return unavailable
    if (
        not isinstance(status, dict)
        or status.get("schema_version") != 1
        or isinstance(status.get("schema_version"), bool)
        or status.get("source") != "codex-process-coverage-v1"
    ):
        return unavailable

    count_fields = (
        "discoverable_roots",
        "discoverable_processes",
        "session_identity_processes",
        "thread_fallback_processes",
        "scoped_processes",
        "hook_scope_processes",
        "lease_scope_processes",
        "generic_scope_processes",
        "unknown_scope_processes",
        "environ_errors",
        "identity_errors",
        "cgroup_errors",
        "rss_errors",
        "process_races",
    )
    counts: dict[str, int] = {}
    for field in count_fields:
        value = status.get(field)
        if isinstance(value, bool) or not isinstance(value, int) or value < 0:
            return unavailable
        counts[field] = value

    observed_at = status.get("observed_at")
    if not isinstance(observed_at, str):
        return unavailable
    try:
        parsed_observed_at = dt.datetime.fromisoformat(
            str(observed_at).replace("Z", "+00:00")
        )
    except ValueError:
        return unavailable
    if parsed_observed_at.tzinfo is None:
        return unavailable

    visibility = status.get("process_visibility")
    if visibility not in {"complete", "partial"}:
        return unavailable
    expected_visibility = (
        "complete"
        if counts["environ_errors"] == 0
        and counts["identity_errors"] == 0
        and counts["process_races"] == 0
        else "partial"
    )
    if visibility != expected_visibility:
        return unavailable
    process_count = counts["discoverable_processes"]
    scoped_count = counts["scoped_processes"]
    if not (
        counts["discoverable_roots"] <= process_count
        and counts["session_identity_processes"]
        + counts["thread_fallback_processes"]
        == process_count
        and scoped_count
        + counts["generic_scope_processes"]
        + counts["unknown_scope_processes"]
        == process_count
        and counts["hook_scope_processes"]
        + counts["lease_scope_processes"]
        == scoped_count
        and counts["cgroup_errors"] == counts["unknown_scope_processes"]
    ):
        return unavailable

    expected_observed_coverage = (
        round(scoped_count / process_count * 100, 1) if process_count else None
    )
    if status.get("observed_scope_coverage_percent") != (
        expected_observed_coverage
    ):
        return unavailable
    scope_evidence = (
        "complete"
        if visibility == "complete" and counts["cgroup_errors"] == 0
        else "partial"
    )
    expected_coverage = (
        expected_observed_coverage if scope_evidence == "complete" else None
    )
    if status.get("scope_coverage_percent") != expected_coverage:
        return unavailable

    rss_bytes = status.get("discoverable_rss_bytes")
    if rss_bytes is not None and (
        isinstance(rss_bytes, bool)
        or not isinstance(rss_bytes, int)
        or rss_bytes < 0
    ):
        return unavailable
    if (counts["rss_errors"] == 0) != (rss_bytes is not None):
        return unavailable

    evidence_errors = sum(
        counts[field]
        for field in (
            "environ_errors",
            "identity_errors",
            "cgroup_errors",
            "rss_errors",
            "process_races",
        )
    )
    return {
        "source": "codex-process-coverage-v1",
        "observed_at": observed_at,
        "scope_evidence": scope_evidence,
        "discoverable_roots": counts["discoverable_roots"],
        "discoverable_processes": process_count,
        "scoped_processes": scoped_count,
        "discoverable_rss_bytes": rss_bytes,
        "evidence_errors": evidence_errors,
    }


def codex_state(
    helper: Path = CODEX_STATE_INVENTORY_HELPER,
) -> dict[str, Any]:
    numeric_fields = (
        "scan_duration_ms",
        "allocated_bytes",
        "file_count",
        "class_count",
        "relevant_process_count",
        "active_bytes",
        "active_files",
        "active_classes",
        "authoritative_bytes",
        "authoritative_files",
        "authoritative_classes",
        "manifest_referenced_bytes",
        "manifest_referenced_files",
        "manifest_referenced_classes",
        "unknown_bytes",
        "unknown_files",
        "unknown_classes",
        "reconstructible_bytes",
        "reclaimable_bytes",
    )
    unavailable = {
        "source": "unavailable",
        "observed_at": None,
        "installed_build": None,
        "snapshot_evidence": None,
        **dict.fromkeys(numeric_fields),
        "retention_authority": None,
    }
    code, output = run_codex_state(helper)
    if code != 0 or not output:
        return unavailable
    try:
        status = json.loads(output)
    except (json.JSONDecodeError, TypeError):
        return unavailable
    if (
        not isinstance(status, dict)
        or status.get("schema_version") != 1
        or isinstance(status.get("schema_version"), bool)
        or status.get("document_type")
        != "big-red-codex-state-aggregate-report"
    ):
        return unavailable

    observed_at = status.get("observed_at")
    if not isinstance(observed_at, str):
        return unavailable
    try:
        parsed_observed_at = dt.datetime.fromisoformat(
            observed_at.replace("Z", "+00:00")
        )
    except ValueError:
        return unavailable
    if parsed_observed_at.tzinfo is None:
        return unavailable

    build = status.get("installed_build")
    if (
        not isinstance(build, dict)
        or build.get("package") != "chatgpt"
        or not isinstance(build.get("version"), str)
        or not re.fullmatch(r"[0-9A-Za-z.+:~_-]{1,64}", build["version"])
    ):
        return unavailable

    boolean_fields = (
        "snapshot_stable",
        "manifest_scan_complete",
        "process_scan_complete",
        "privileged_process_observation",
        "network_used",
        "mutation_performed",
        "retention_authority",
    )
    if any(not isinstance(status.get(field), bool) for field in boolean_fields):
        return unavailable
    source_integer_fields = (
        "scan_duration_ms",
        "allocated_bytes",
        "file_count",
        "class_count",
        "relevant_process_count",
        "content_files_opened",
        "privileged_link_reads",
        "privileged_fd_table_reads",
        "reconstructible_bytes",
        "reclaimable_bytes",
    )
    if any(
        isinstance(status.get(field), bool)
        or not isinstance(status.get(field), int)
        or status[field] < 0
        for field in source_integer_fields
    ):
        return unavailable

    class_keys = ("active", "authoritative", "manifest-referenced", "unknown")
    aggregate_names = (
        ("classifications", "class_count"),
        ("allocated_bytes_by_classification", "allocated_bytes"),
        ("files_by_classification", "file_count"),
    )
    aggregates: dict[str, dict[str, int]] = {}
    for aggregate_name, total_name in aggregate_names:
        aggregate = status.get(aggregate_name)
        if not isinstance(aggregate, dict) or set(aggregate) != set(class_keys):
            return unavailable
        if any(
            isinstance(aggregate.get(key), bool)
            or not isinstance(aggregate.get(key), int)
            or aggregate[key] < 0
            for key in class_keys
        ):
            return unavailable
        if sum(aggregate.values()) != status[total_name]:
            return unavailable
        aggregates[aggregate_name] = aggregate

    if (
        status["content_files_opened"] != 0
        or status["privileged_process_observation"]
        or status["privileged_link_reads"] != 0
        or status["privileged_fd_table_reads"] != 0
        or status["network_used"]
        or status["mutation_performed"]
        or status["retention_authority"]
        or status["reconstructible_bytes"] != 0
        or status["reclaimable_bytes"] != 0
    ):
        return unavailable

    classes = aggregates["classifications"]
    allocated = aggregates["allocated_bytes_by_classification"]
    files = aggregates["files_by_classification"]
    snapshot_evidence = (
        "complete"
        if status["snapshot_stable"]
        and status["manifest_scan_complete"]
        and status["process_scan_complete"]
        else "partial"
    )
    return {
        "source": "codex-state-inventory-v1",
        "observed_at": observed_at,
        "installed_build": build["version"],
        "scan_duration_ms": status["scan_duration_ms"],
        "snapshot_evidence": snapshot_evidence,
        "allocated_bytes": status["allocated_bytes"],
        "file_count": status["file_count"],
        "class_count": status["class_count"],
        "relevant_process_count": status["relevant_process_count"],
        "active_bytes": allocated["active"],
        "active_files": files["active"],
        "active_classes": classes["active"],
        "authoritative_bytes": allocated["authoritative"],
        "authoritative_files": files["authoritative"],
        "authoritative_classes": classes["authoritative"],
        "manifest_referenced_bytes": allocated["manifest-referenced"],
        "manifest_referenced_files": files["manifest-referenced"],
        "manifest_referenced_classes": classes["manifest-referenced"],
        "unknown_bytes": allocated["unknown"],
        "unknown_files": files["unknown"],
        "unknown_classes": classes["unknown"],
        "reconstructible_bytes": 0,
        "reclaimable_bytes": 0,
        "retention_authority": False,
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


def remote_client_state(
    status: dict[str, Any], now: dt.datetime
) -> dict[str, Any]:
    peers = status.get("Peer")
    if not isinstance(peers, dict):
        return {
            "source": "unavailable",
            "state": "unavailable",
            "last_seen_seconds_ago": None,
        }
    macos_peers = [
        peer
        for peer in peers.values()
        if isinstance(peer, dict)
        and str(peer.get("OS", "")).lower() in {"macos", "darwin"}
    ]
    if len(macos_peers) != 1:
        return {
            "source": "unavailable",
            "state": "unavailable",
            "last_seen_seconds_ago": None,
        }

    peer = macos_peers[0]
    online = peer.get("Online")
    active = peer.get("Active")
    if not isinstance(online, bool) or not isinstance(active, bool):
        return {
            "source": "unavailable",
            "state": "unavailable",
            "last_seen_seconds_ago": None,
        }

    last_seen_age: int | None = None
    last_seen = peer.get("LastSeen")
    if isinstance(last_seen, str):
        try:
            observed = dt.datetime.fromisoformat(last_seen.replace("Z", "+00:00"))
            if observed.year > 1:
                last_seen_age = max(
                    0,
                    int(
                        (
                            now.astimezone(dt.timezone.utc) - observed
                        ).total_seconds()
                    ),
                )
        except (TypeError, ValueError):
            pass

    if not online:
        state = "offline"
    elif not active:
        state = "online-idle"
    elif isinstance(peer.get("CurAddr"), str) and peer["CurAddr"].strip():
        state = "direct"
    elif any(
        isinstance(peer.get(key), str) and peer[key].strip()
        for key in ("PeerRelay", "Relay")
    ):
        state = "relay"
    else:
        state = "unknown"
    return {
        "source": "tailscale-status",
        "state": state,
        "last_seen_seconds_ago": last_seen_age,
    }


def parse_tailscale_ping(output: str) -> dict[str, Any] | None:
    pattern = re.compile(
        r"^pong from .+ via (?P<route>.+) in "
        r"(?P<rtt>[0-9]+(?:\.[0-9]+)?)ms$"
    )
    for line in reversed(output.splitlines()):
        match = pattern.fullmatch(line.strip())
        if match is None:
            continue
        route = match.group("route")
        if route.startswith("DERP(") and route.endswith(")"):
            path = "relay"
        elif route.startswith("peer-relay(") and route.endswith(")"):
            path = "peer-relay"
        else:
            host, separator, port = route.rpartition(":")
            if separator != ":" or not port.isdigit():
                continue
            if host.startswith("[") and host.endswith("]"):
                host = host[1:-1]
            try:
                ipaddress.ip_address(host)
            except ValueError:
                continue
            if not 0 < int(port) <= 65_535:
                continue
            path = "direct"
        return {
            "source": "tailscale-ping",
            "path": path,
            "rtt_ms": round(float(match.group("rtt")), 1),
            "samples": 1,
        }
    return None


def remote_transport_probe(
    peer: dict[str, Any], state: str
) -> dict[str, Any] | None:
    if state not in {"direct", "relay"}:
        return None
    addresses = peer.get("TailscaleIPs")
    if not isinstance(addresses, list):
        return None
    target = next(
        (address for address in addresses if isinstance(address, str) and address),
        None,
    )
    if target is None:
        return None
    code, output = run(
        "tailscale",
        "ping",
        "--c",
        "1",
        "--timeout",
        "2s",
        target,
    )
    return parse_tailscale_ping(output) if code == 0 else None


def tailscale_state(
    now: dt.datetime,
) -> tuple[str, bool | None, dict[str, Any]]:
    code, output = run("tailscale", "status", "--json")
    if code != 0 or not output:
        return "unknown", None, remote_client_state({}, now)
    try:
        status = json.loads(output)
    except json.JSONDecodeError:
        return "unknown", None, remote_client_state({}, now)
    if not isinstance(status, dict):
        return "unknown", None, remote_client_state({}, now)
    backend = str(status.get("BackendState", "")).lower()
    mapped = {
        "running": "running",
        "needslogin": "needs-login",
        "stopped": "stopped",
    }.get(backend, "unknown")
    self_state = status.get("Self")
    online = self_state.get("Online") if isinstance(self_state, dict) else None
    remote = remote_client_state(status, now)
    peers = status.get("Peer")
    if remote.get("source") == "tailscale-status" and isinstance(peers, dict):
        macos_peers = [
            peer
            for peer in peers.values()
            if isinstance(peer, dict)
            and str(peer.get("OS", "")).lower() in {"macos", "darwin"}
        ]
        if len(macos_peers) == 1:
            transport_probe = remote_transport_probe(
                macos_peers[0], str(remote.get("state", "unknown"))
            )
            if transport_probe is not None:
                remote["transport_probe"] = transport_probe
    return (
        mapped,
        online if isinstance(online, bool) else None,
        remote,
    )


def grd_acceleration_state(messages: list[str]) -> str:
    vulkan_state = "unknown"
    vaapi_state = "not-attempted"
    for message in messages:
        lowered = message.lower()
        if "[hwaccel.vulkan]" in lowered:
            if "successful" in lowered:
                vulkan_state = "ready"
            elif "fail" in lowered or "error" in lowered:
                vulkan_state = "failed"
        if "successfully initialized vaapi" in lowered:
            vaapi_state = "ready"
        elif "did not initialize vaapi" in lowered:
            vaapi_state = "failed"

    if vulkan_state == "failed" or vaapi_state == "failed":
        return "software-fallback"
    if vulkan_state == "ready" and vaapi_state == "ready":
        return "hardware-ready"
    if vulkan_state == "ready" and vaapi_state == "not-attempted":
        return "awaiting-session"
    return "unknown"


def gnome_remote_desktop_acceleration() -> dict[str, str]:
    code, invocation_id = run(
        "systemctl",
        "--user",
        "show",
        "gnome-remote-desktop.service",
        "--property=InvocationID",
        "--value",
    )
    if code != 0 or re.fullmatch(r"[0-9a-f]{32}", invocation_id) is None:
        return {"source": "unavailable", "state": "unavailable"}

    code, output = run(
        "journalctl",
        "--user",
        "--quiet",
        "--no-pager",
        "--output=json",
        "--output-fields=MESSAGE",
        "--lines",
        str(GRD_ACCELERATION_EVENT_LIMIT),
        f"_SYSTEMD_INVOCATION_ID={invocation_id}",
    )
    if code != 0:
        return {"source": "unavailable", "state": "unavailable"}

    messages: list[str] = []
    try:
        for line in output.splitlines():
            record = json.loads(line)
            message = record.get("MESSAGE") if isinstance(record, dict) else None
            if isinstance(message, str):
                messages.append(message)
    except (json.JSONDecodeError, TypeError):
        return {"source": "unavailable", "state": "unavailable"}

    return {
        "source": "grd-current-invocation",
        "state": grd_acceleration_state(messages),
    }


def gnome_remote_desktop_sessions(
    now: dt.datetime | None = None,
) -> dict[str, Any]:
    unavailable = {
        "source": "unavailable",
        "window_hours": RELIABILITY_WINDOW_HOURS,
        "session_endings": None,
        "transport_endings": None,
        "user_logoffs": None,
        "server_disconnects": None,
        "truncated": False,
    }
    observed_at = now or dt.datetime.now(dt.timezone.utc)
    since = observed_at - dt.timedelta(hours=RELIABILITY_WINDOW_HOURS)
    code, output = run(
        "journalctl",
        "--user",
        "--quiet",
        "--no-pager",
        "--output=json",
        "--output-fields=MESSAGE",
        "--since",
        since.isoformat(),
        "--lines",
        str(GRD_SESSION_EVENT_LIMIT + 1),
        "--unit=gnome-remote-desktop.service",
    )
    if code != 0:
        return unavailable

    try:
        records = [json.loads(line) for line in output.splitlines() if line]
    except (json.JSONDecodeError, TypeError):
        return unavailable
    if any(not isinstance(record, dict) for record in records):
        return unavailable

    truncated = len(records) > GRD_SESSION_EVENT_LIMIT
    messages = [
        message
        for record in records[-GRD_SESSION_EVENT_LIMIT:]
        if isinstance((message := record.get("MESSAGE")), str)
    ]
    return {
        "source": "grd-journal-24h",
        "window_hours": RELIABILITY_WINDOW_HOURS,
        "session_endings": sum(
            "[RDP] Network or intentional disconnect, stopping session" in message
            for message in messages
        ),
        "transport_endings": sum(
            "ERRCONNECT_CONNECT_TRANSPORT_FAILED" in message
            for message in messages
        ),
        "user_logoffs": sum(
            "[rdp_set_error_info]: ERRINFO_LOGOFF_BY_USER" in message
            for message in messages
        ),
        "server_disconnects": sum(
            "[rdp_set_error_info]: ERRINFO_RPC_INITIATED_DISCONNECT" in message
            for message in messages
        ),
        "truncated": truncated,
    }


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


def process_table() -> dict[int, tuple[int, str, str, int]]:
    rows: dict[int, tuple[int, str, str, int]] = {}
    page_size = os.sysconf("SC_PAGE_SIZE")
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
            resident_pages = int((entry / "statm").read_text().split()[1])
            rows[int(entry.name)] = (
                parent,
                comm,
                cmdline,
                resident_pages * page_size,
            )
        except (
            FileNotFoundError,
            IndexError,
            OSError,
            PermissionError,
            ProcessLookupError,
            ValueError,
        ):
            continue
    return rows


def is_codex_control_process(row: tuple[int, str, str, int]) -> bool:
    _, comm, cmdline, _ = row
    desktop_root = (
        comm == "chatgpt"
        and cmdline.startswith("/usr/lib/chatgpt/chatgpt")
        and " --type=" not in cmdline
    )
    app_server = comm == "codex" and " app-server" in cmdline and (
        cmdline.startswith("/usr/lib/chatgpt/resources/codex ")
        or (
            "/.codex/packages/standalone/releases/" in cmdline
            and "/bin/codex app-server" in cmdline
        )
    )
    return desktop_root or app_server


def process_pss_swap(
    pid: int,
    proc_root: Path = Path("/proc"),
) -> tuple[int, int]:
    path = proc_root / str(pid) / "smaps_rollup"
    with path.open("r", encoding="utf-8") as handle:
        content = handle.read(SMAPS_ROLLUP_OUTPUT_BYTES + 1)
    if len(content.encode("utf-8")) > SMAPS_ROLLUP_OUTPUT_BYTES:
        raise ValueError("smaps rollup exceeds the observation limit")
    values: dict[str, int] = {}
    for line in content.splitlines():
        key, separator, tail = line.partition(":")
        fields = tail.split()
        if (
            separator
            and key in {"Pss", "Swap"}
            and len(fields) == 2
            and fields[1] == "kB"
        ):
            values[key] = int(fields[0]) * 1024
    if set(values) != {"Pss", "Swap"} or any(value < 0 for value in values.values()):
        raise ValueError("smaps rollup is incomplete")
    return values["Pss"], values["Swap"]


def codex_runtime(
    rows: dict[int, tuple[int, str, str, int]],
    *,
    memory_reader: Callable[[int], tuple[int, int]] = process_pss_swap,
    own_pid: int | None = None,
) -> dict[str, Any]:
    candidates = {
        pid for pid, row in rows.items() if is_codex_control_process(row)
    }
    roots = set(candidates)
    for pid in candidates:
        parent = rows[pid][0]
        seen: set[int] = set()
        while parent in rows and parent not in seen:
            if parent in candidates:
                roots.discard(pid)
                break
            seen.add(parent)
            parent = rows[parent][0]

    runtime_pids = set(roots)
    while True:
        descendants = {
            pid for pid, (parent, _, _, _) in rows.items() if parent in runtime_pids
        }
        expanded = runtime_pids | descendants
        if expanded == runtime_pids:
            break
        runtime_pids = expanded
    runtime_pids.discard(os.getpid() if own_pid is None else own_pid)

    code_mode_hosts = 0
    mcp_servers = 0
    for pid in runtime_pids:
        _, comm, cmdline, _ = rows[pid]
        if comm in {"node_repl", "codex-code-mode"}:
            code_mode_hosts += 1
        tokens = cmdline.split()
        if comm in {"node", "mainthread"} and any(
            token in {"./server.mjs", "./mcp/server.mjs", "./mcp/server.cjs"}
            or token.endswith("/mcp/server.mjs")
            or token.endswith("/mcp/server.cjs")
            for token in tokens
        ):
            mcp_servers += 1

    pss_bytes = 0
    swap_bytes = 0
    memory_errors = 0
    for pid in runtime_pids:
        try:
            pss, swap = memory_reader(pid)
        except (FileNotFoundError, OSError, UnicodeError, ValueError):
            memory_errors += 1
            continue
        pss_bytes += pss
        swap_bytes += swap

    return {
        "source": "codex-runtime-tree-v1",
        "control_roots": len(roots),
        "processes": len(runtime_pids),
        "code_mode_hosts": code_mode_hosts,
        "mcp_servers": mcp_servers,
        "rss_bytes": sum(rows[pid][3] for pid in runtime_pids),
        "pss_bytes": pss_bytes if memory_errors == 0 else None,
        "swap_bytes": swap_bytes if memory_errors == 0 else None,
        "memory_errors": memory_errors,
    }


def established_tcp_connections(
    local_port: int,
    tables: tuple[Path, ...] = (Path("/proc/net/tcp"), Path("/proc/net/tcp6")),
) -> int:
    port_hex = f"{local_port:04X}"
    connections = 0
    for table in tables:
        try:
            lines = table.read_text(encoding="utf-8").splitlines()[1:]
        except (FileNotFoundError, OSError, PermissionError):
            continue
        for line in lines:
            fields = line.split()
            if len(fields) < 4:
                continue
            local_address = fields[1]
            state = fields[3]
            if (
                state == "01"
                and local_address.rpartition(":")[2].upper() == port_hex
            ):
                connections += 1
    return connections


def configured_rdp_port() -> int:
    _, output = run(
        "gsettings", "get", "org.gnome.desktop.remote-desktop.rdp", "port"
    )
    match = re.search(r"(\d+)\s*$", output)
    if match:
        port = int(match.group(1))
        if 1 <= port <= 65_535:
            return port
    return 3389


def reliability_window(now: dt.datetime | None = None) -> dict[str, Any]:
    observed_at = now or dt.datetime.now(dt.timezone.utc)
    since = observed_at - dt.timedelta(hours=RELIABILITY_WINDOW_HOURS)
    code, output = run(
        "journalctl",
        "--quiet",
        "--no-pager",
        "--output=json",
        "--since",
        since.isoformat(),
        "--lines",
        str(RELIABILITY_EVENT_LIMIT + 1),
        f"MESSAGE_ID={SYSTEMD_PROCESS_EXIT_MESSAGE_ID}",
        f"MESSAGE_ID={SYSTEMD_RESTART_MESSAGE_ID}",
    )
    if code != 0:
        return {
            "source": "unavailable",
            "window_hours": RELIABILITY_WINDOW_HOURS,
            "crash_exits": 0,
            "automatic_restarts": 0,
            "truncated": False,
        }

    try:
        records = [json.loads(line) for line in output.splitlines() if line]
    except (json.JSONDecodeError, TypeError):
        return {
            "source": "unavailable",
            "window_hours": RELIABILITY_WINDOW_HOURS,
            "crash_exits": 0,
            "automatic_restarts": 0,
            "truncated": False,
        }

    truncated = len(records) > RELIABILITY_EVENT_LIMIT
    records = records[-RELIABILITY_EVENT_LIMIT:]
    return {
        "source": "journal-24h",
        "window_hours": RELIABILITY_WINDOW_HOURS,
        "crash_exits": sum(
            record.get("MESSAGE_ID") == SYSTEMD_PROCESS_EXIT_MESSAGE_ID
            and record.get("EXIT_CODE") == "dumped"
            for record in records
        ),
        "automatic_restarts": sum(
            record.get("MESSAGE_ID") == SYSTEMD_RESTART_MESSAGE_ID
            for record in records
        ),
        "truncated": truncated,
    }


def hygiene_counts() -> tuple[int, int, int, int, int, dict[str, Any]]:
    rows = process_table()
    browser_names = {"firefox", "chrome", "chromium", "msedge", "brave"}
    browser_named_pids = {
        pid for pid, (_, comm, _, _) in rows.items() if comm in browser_names
    }
    browser_root_pids = {
        pid
        for pid, (parent, comm, cmdline, _) in rows.items()
        if comm in browser_names
        and "--type=" not in cmdline
        and parent not in browser_named_pids
    }
    browser_pids = set(browser_root_pids)
    while True:
        descendants = {
            pid
            for pid, (parent, _, _, _) in rows.items()
            if parent in browser_pids
        }
        expanded = browser_pids | descendants
        if expanded == browser_pids:
            break
        browser_pids = expanded
    browser_rss_bytes = sum(rows[pid][3] for pid in browser_pids)

    # Each active Codex route owns one code-mode REPL. Count only that leaf
    # process so the persistent desktop and remote-control daemons are excluded.
    codex_workers = sum(
        1 for _, (_, comm, _, _) in rows.items() if comm == "node_repl"
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
    return (
        len(browser_root_pids),
        browser_rss_bytes,
        codex_workers,
        len(dev_pids),
        established_tcp_connections(configured_rdp_port()),
        codex_runtime(rows),
    )


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
            "largest_target_gib": None,
            "median_target_gib": None,
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
            "largest_target_gib": None,
            "median_target_gib": None,
            "glaeda_cache_gib": None,
            "target_count": len(existing_targets),
            "active_build_processes": active_glaeda_build_processes(
                observed_worktrees
            ),
        }

    target_bytes = sum(target_sizes.get(target, 0) for target in existing_targets)
    target_size_values = [
        target_sizes.get(target, 0) for target in existing_targets
    ]
    cache_bytes = cache_sizes.get(cache, 0)
    return {
        "source": "filesystem",
        "total_gib": round((target_bytes + cache_bytes) / GIB, 2),
        "target_gib": round(target_bytes / GIB, 2),
        "largest_target_gib": (
            round(max(target_size_values) / GIB, 2)
            if target_size_values
            else 0.0
        ),
        "median_target_gib": (
            round(statistics.median(target_size_values) / GIB, 2)
            if target_size_values
            else 0.0
        ),
        "glaeda_cache_gib": round(cache_bytes / GIB, 2),
        "target_count": len(existing_targets),
        "active_build_processes": active_glaeda_build_processes(observed_worktrees),
    }


def build_report() -> dict[str, Any]:
    now = dt.datetime.now(dt.timezone.utc)
    load_one, load_five, load_fifteen = os.getloadavg()
    logical_cpus = os.cpu_count() or 1
    activity = activity_window(now)
    fingerprint_secret = os.environ.get("MACHINE_HEALTH_INGEST_SECRET", "")
    codex_usage = codex_usage_window(
        now,
        fingerprint_key=(
            fingerprint_secret.encode("utf-8") if fingerprint_secret else None
        ),
    )
    routes = route_activity()
    tags = process_tags()
    coverage = process_coverage()
    state_inventory = codex_state()
    desktop = desktop_state()
    _, total_gib = memory()
    disk = shutil.disk_usage("/")
    graphics_clock_mhz, graphics_max_clock_mhz = graphics_clock()
    on_ac, battery_percent, power_state = battery_state()
    tailscale_backend, tailscale_online, remote_client = tailscale_state(now)
    (
        browser_roots,
        browser_rss_bytes,
        codex_workers,
        dev_listeners,
        rdp_connections,
        codex_runtime_state,
    ) = hygiene_counts()
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
        "route_activity": routes,
        "process_tags": tags,
        "process_coverage": coverage,
        "codex_state": state_inventory,
        "desktop": desktop,
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
            "gnome_remote_desktop": service_state(
                "gnome-remote-desktop.service", user=True
            ),
            "gnome_remote_desktop_acceleration": (
                gnome_remote_desktop_acceleration()
            ),
            "gnome_remote_desktop_sessions": gnome_remote_desktop_sessions(now),
        },
        "network": {
            "connectivity": connectivity(),
            "tailscale_backend": tailscale_backend,
            "tailscale_self_online": tailscale_online,
            "remote_client": remote_client,
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
            "browser_rss_bytes": browser_rss_bytes,
            "codex_workers": codex_workers,
            "codex_runtime": codex_runtime_state,
            "unexpected_dev_listeners": dev_listeners,
            "rdp_connections": rdp_connections,
        },
        "reliability": reliability_window(now),
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
    opener = urllib.request.build_opener(RejectRedirects())
    try:
        with opener.open(request, timeout=15) as response:
            if response.status // 100 != 2:
                raise RuntimeError(
                    f"Health endpoint returned HTTP {response.status}"
                )
    except urllib.error.HTTPError as exc:
        exc.close()
        if 300 <= exc.code < 400:
            raise RuntimeError("Health endpoint redirects are refused") from None
        raise RuntimeError(f"Health endpoint returned HTTP {exc.code}") from None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--print-only", action="store_true", help="Never send the report"
    )
    args = parser.parse_args()
    report = build_report()

    if args.print_only:
        print(json.dumps(report, indent=2, sort_keys=True))
        return 0
    endpoint = os.environ.get("MACHINE_HEALTH_INGEST_URL", "").strip()
    token = os.environ.get("MACHINE_HEALTH_INGEST_SECRET", "").strip()
    if not endpoint and not token:
        print(json.dumps(report, indent=2, sort_keys=True))
        return 0
    if not endpoint or not token:
        raise SystemExit(
            "Both MACHINE_HEALTH_INGEST_URL and MACHINE_HEALTH_INGEST_SECRET are required"
        )
    post_report(report, endpoint, token)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
