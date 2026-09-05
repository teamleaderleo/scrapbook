#!/usr/bin/env python3
"""Send one privacy-safe macOS resource sample to Scrapbook.

Only aggregate counters and the fixed ``macbook-air`` source label leave the
machine. The collector never enumerates processes, applications, windows,
paths, commands, network peers, or interface identities.
"""

from __future__ import annotations

import argparse
import ctypes
import datetime as dt
import json
import os
import re
import shutil
import stat
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


MAX_CONFIG_BYTES = 16_384
CONFIG_KEYS = frozenset({"ingest_url", "ingest_secret"})
GIB = 1024**3
MIB = 1024**2


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


def run(*arguments: str) -> str:
    return subprocess.run(
        arguments,
        check=True,
        capture_output=True,
        text=True,
        timeout=10,
    ).stdout


def sysctl(name: str) -> str:
    return run("/usr/sbin/sysctl", "-n", name).strip()


def cpu_percent(before: list[list[int]], after: list[list[int]]) -> list[float]:
    if len(before) != len(after) or not before:
        raise ValueError("CPU counter shape changed during collection")
    values: list[float] = []
    for old, new in zip(before, after, strict=True):
        if len(old) != 4 or len(new) != 4:
            raise ValueError("CPU counter shape is invalid")
        deltas = [max(0, current - previous) for previous, current in zip(old, new)]
        total = sum(deltas)
        values.append(0.0 if total == 0 else round(100 * (total - deltas[2]) / total, 2))
    return values


def mach_cpu_ticks() -> list[list[int]]:
    if sys.platform != "darwin":
        raise OSError("Mach CPU counters are only available on macOS")
    library = ctypes.CDLL("/usr/lib/libSystem.B.dylib")
    processor_count = ctypes.c_uint()
    processor_info = ctypes.POINTER(ctypes.c_int)()
    processor_info_count = ctypes.c_uint()
    library.mach_host_self.restype = ctypes.c_uint
    library.mach_task_self.restype = ctypes.c_uint
    result = library.host_processor_info(
        library.mach_host_self(),
        2,  # PROCESSOR_CPU_LOAD_INFO
        ctypes.byref(processor_count),
        ctypes.byref(processor_info),
        ctypes.byref(processor_info_count),
    )
    if result != 0 or processor_count.value < 1:
        raise OSError("Mach CPU counters are unavailable")
    try:
        expected = processor_count.value * 4
        if processor_info_count.value < expected:
            raise OSError("Mach CPU counters are incomplete")
        return [
            [processor_info[index * 4 + state] for state in range(4)]
            for index in range(processor_count.value)
        ]
    finally:
        library.vm_deallocate(
            library.mach_task_self(),
            ctypes.cast(processor_info, ctypes.c_void_p),
            processor_info_count.value * ctypes.sizeof(ctypes.c_int),
        )


def network_bytes(document: str) -> tuple[int, int]:
    """Aggregate interface counters without returning interface identities."""
    lines = [line.split() for line in document.splitlines() if line.strip()]
    header = next((line for line in lines if line[:2] == ["Name", "Mtu"]), None)
    if not header:
        raise ValueError("Network counter table is unavailable")
    name_index = header.index("Name")
    input_index = header.index("Ibytes")
    output_index = header.index("Obytes")
    maxima: dict[str, tuple[int, int]] = {}
    for fields in lines[lines.index(header) + 1 :]:
        if len(fields) <= max(name_index, input_index, output_index):
            continue
        name = fields[name_index]
        if name == "lo0":
            continue
        try:
            counters = (int(fields[input_index]), int(fields[output_index]))
        except ValueError:
            continue
        prior = maxima.get(name, (0, 0))
        maxima[name] = (max(prior[0], counters[0]), max(prior[1], counters[1]))
    return sum(value[0] for value in maxima.values()), sum(
        value[1] for value in maxima.values()
    )


def vm_pages(document: str) -> tuple[int, dict[str, int]]:
    match = re.search(r"page size of (\d+) bytes", document)
    if not match:
        raise ValueError("VM page size is unavailable")
    pages: dict[str, int] = {}
    for line in document.splitlines()[1:]:
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        digits = re.sub(r"[^0-9]", "", value)
        if digits:
            pages[key.strip()] = int(digits)
    return int(match.group(1)), pages


def memory_usage(total_bytes: int, document: str) -> tuple[float, float]:
    page_size, pages = vm_pages(document)
    available_pages = sum(
        pages.get(key, 0)
        for key in ("Pages free", "Pages inactive", "Pages speculative")
    )
    available = min(total_bytes, available_pages * page_size)
    used_percent = 100 * (total_bytes - available) / total_bytes
    return round(used_percent, 2), round(total_bytes / GIB, 2)


def size_bytes(value: str) -> float:
    match = re.fullmatch(r"([0-9.]+)([KMGT]?)", value.strip(), re.IGNORECASE)
    if not match:
        raise ValueError("Storage counter has an invalid size")
    factor = {"": 1, "K": 1024, "M": MIB, "G": GIB, "T": 1024**4}[
        match.group(2).upper()
    ]
    return float(match.group(1)) * factor


def swap_usage(document: str) -> tuple[float, float]:
    total = re.search(r"total\s*=\s*([^\s]+)", document)
    used = re.search(r"used\s*=\s*([^\s]+)", document)
    if not total or not used:
        raise ValueError("Swap counters are unavailable")
    return round(size_bytes(used.group(1)) / GIB, 3), round(
        size_bytes(total.group(1)) / GIB, 3
    )


def battery(document: str) -> tuple[bool | None, float | None, str]:
    on_ac = True if "'AC Power'" in document else False if "'Battery Power'" in document else None
    match = re.search(r"(\d{1,3})%", document)
    percent = min(100.0, float(match.group(1))) if match else None
    lowered = document.lower()
    if "discharging" in lowered:
        state = "discharging"
    elif "not charging" in lowered:
        state = "not-charging"
    elif "charging" in lowered:
        state = "charging"
    elif "charged" in lowered or (percent == 100 and on_ac):
        state = "full"
    else:
        state = "unknown"
    return on_ac, percent, state


def uptime_seconds(document: str) -> int:
    match = re.search(r"sec\s*=\s*(\d+)", document)
    if not match:
        raise ValueError("Boot time is unavailable")
    return max(0, int(time.time()) - int(match.group(1)))


def report(sample_seconds: float = 1.0) -> dict[str, Any]:
    before_cpu = mach_cpu_ticks()
    before_network = network_bytes(run("/usr/sbin/netstat", "-ibn"))
    started = time.monotonic()
    time.sleep(sample_seconds)
    elapsed = max(0.001, time.monotonic() - started)
    cores = cpu_percent(before_cpu, mach_cpu_ticks())
    after_network = network_bytes(run("/usr/sbin/netstat", "-ibn"))
    rx_mib_s = max(0, after_network[0] - before_network[0]) / MIB / elapsed
    tx_mib_s = max(0, after_network[1] - before_network[1]) / MIB / elapsed

    total_memory = int(sysctl("hw.memsize"))
    memory_percent, total_gib = memory_usage(total_memory, run("/usr/bin/vm_stat"))
    swap_used, swap_total = swap_usage(sysctl("vm.swapusage"))
    disk = shutil.disk_usage("/")
    on_ac, battery_percent, battery_state = battery(run("/usr/bin/pmset", "-g", "batt"))
    one, five, fifteen = os.getloadavg()
    now = dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")
    average_cpu = round(sum(cores) / len(cores), 2)

    return {
        "schema_version": 1,
        "host": "macbook-air",
        "checked_at": now,
        "uptime_seconds": uptime_seconds(sysctl("kern.boottime")),
        "load": {"one": one, "five": five, "fifteen": fifteen, "logical_cpus": len(cores)},
        "cpu": {"used_percent": average_cpu},
        "memory": {
            "used_percent": memory_percent,
            "total_gib": total_gib,
            "current_used_gib": round(total_gib * memory_percent / 100, 2),
            "swap_used_gib": swap_used,
            "swap_total_gib": swap_total,
        },
        "disk": {
            "root_used_percent": round(100 * disk.used / disk.total, 2),
            "root_free_gib": round(disk.free / GIB, 2),
            "root_total_gib": round(disk.total / GIB, 2),
        },
        "temperature": {"peak_sensor_c": None},
        "graphics": {"clock_mhz": None, "max_clock_mhz": None},
        "activity": {
            "source": "point",
            "window_minutes": 0,
            "sample_count": 1,
            "cpu_peak_percent": max(cores),
            "core_average_percent": cores,
            "core_peak_percent": cores,
            "memory_peak_percent": memory_percent,
            "cpu_pressure_some_percent": None,
            "memory_pressure_full_percent": None,
            "io_pressure_full_percent": None,
            "disk_read_mib_s": None,
            "disk_write_mib_s": None,
            "network_peak_mib_s": round(rx_mib_s + tx_mib_s, 4),
            "disk_peak_mib_s": None,
        },
        "services": {
            "failed_system_units": 0,
            "failed_user_units": 0,
            "ssh": "unknown",
            "tailscale": "unknown",
            "network_manager": "unknown",
            "time_sync": "unknown",
        },
        "network": {
            "connectivity": "unknown",
            "tailscale_backend": "unknown",
            "tailscale_self_online": None,
            "rx_mib_s": round(rx_mib_s, 4),
            "tx_mib_s": round(tx_mib_s, 4),
        },
        "power": {
            "profile": "unknown",
            "idle_suspend_ac": "unknown",
            "idle_suspend_battery": "unknown",
            "hibernate_targets_masked": False,
            "on_ac": on_ac,
            "battery_percent": battery_percent,
            "battery_state": battery_state,
        },
        "hygiene": {
            "browser_roots": 0,
            "browser_rss_bytes": 0,
            "codex_workers": 0,
            "unexpected_dev_listeners": 0,
            "rdp_connections": 0,
        },
    }


def validate_ingest_url(value: str) -> str:
    parsed = urllib.parse.urlparse(value)
    if parsed.scheme == "https" and parsed.netloc:
        return value
    if parsed.scheme == "http" and parsed.hostname in {"127.0.0.1", "localhost", "::1"} and parsed.netloc:
        return value
    raise ValueError("The ingest URL must use HTTPS, except for loopback testing")


def load_credentials(config_file: Path) -> tuple[str, str]:
    try:
        descriptor = os.open(config_file, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
        with os.fdopen(descriptor, "rb") as stream:
            metadata = os.fstat(stream.fileno())
            if not stat.S_ISREG(metadata.st_mode) or metadata.st_uid != os.getuid() or metadata.st_nlink != 1:
                raise ValueError("The credential file must be a regular file owned by the current user")
            if stat.S_IMODE(metadata.st_mode) & 0o077:
                raise ValueError("The credential file must not be accessible by group or other")
            encoded = stream.read(MAX_CONFIG_BYTES + 1)
    except OSError as error:
        raise ValueError("The credential file is unavailable") from error
    if len(encoded) > MAX_CONFIG_BYTES:
        raise ValueError("The credential file is too large")
    try:
        document = json.loads(encoded.decode("utf-8"))
    except (UnicodeError, json.JSONDecodeError) as error:
        raise ValueError("The credential file is invalid") from error
    if not isinstance(document, dict) or set(document) != CONFIG_KEYS:
        raise ValueError("The credential file fields are invalid")
    url, secret = document["ingest_url"], document["ingest_secret"]
    if not isinstance(url, str) or not isinstance(secret, str) or not secret.strip():
        raise ValueError("The credential file values are invalid")
    return validate_ingest_url(url.strip()), secret.strip()


def send(payload: dict[str, Any], url: str, secret: str) -> None:
    request = urllib.request.Request(
        validate_ingest_url(url),
        data=json.dumps(payload, separators=(",", ":")).encode(),
        method="POST",
        headers={
            "Authorization": f"Bearer {secret}",
            "Content-Type": "application/json",
            "User-Agent": "scrapbook-mac-health-reporter/1",
        },
    )
    try:
        with urllib.request.build_opener(RejectRedirects()).open(request, timeout=15) as response:
            if not 200 <= response.status < 300:
                raise RuntimeError(f"ingest returned HTTP {response.status}")
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"ingest returned HTTP {error.code}") from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"ingest failed: {error.reason}") from error


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Send a sanitized Mac resource sample")
    parser.add_argument("--config-file", type=Path)
    parser.add_argument("--print-only", action="store_true")
    parser.add_argument("--sample-seconds", type=float, default=1.0)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not 0.1 <= args.sample_seconds <= 10:
        print("sample seconds must be between 0.1 and 10", file=sys.stderr)
        return 2
    try:
        payload = report(args.sample_seconds)
        if args.print_only:
            print(json.dumps(payload, indent=2, sort_keys=True))
            return 0
        if args.config_file is None:
            raise ValueError("A credential file is required unless --print-only is used")
        url, secret = load_credentials(args.config_file)
        send(payload, url, secret)
    except (OSError, RuntimeError, ValueError, subprocess.SubprocessError) as error:
        print(str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
