#!/usr/bin/env python3
"""Two-second activity sample, once per minute. No arguments, titles, or paths leave the host."""
from __future__ import annotations

import argparse
import datetime as dt
import importlib.machinery
import importlib.util
import json
import os
import plistlib
import re
import resource
import subprocess
import sys
import time
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit, urlunsplit

GIB = 1024**3
MIB = 1024**2


def command(*args: str) -> str:
    return subprocess.run(args, capture_output=True, text=True, check=True, timeout=4,
                          env={**os.environ, "LC_ALL": "C"}).stdout


def helper():
    names = ["mac-health-report.py"] if sys.platform == "darwin" else ["big-red-health-report.py", "big-red-health-report"]
    for name in names:
        path = Path(__file__).resolve().with_name(name)
        if path.is_file():
            loader = importlib.machinery.SourceFileLoader("health_helper", str(path))
            spec = importlib.util.spec_from_loader(loader.name, loader)
            module = importlib.util.module_from_spec(spec)
            loader.exec_module(module)
            return module
    raise RuntimeError("Installed health collector is missing")


def cpu_list(value: str) -> set[int]:
    result: set[int] = set()
    for part in value.strip().split(","):
        match = re.fullmatch(r"(\d+)(?:-(\d+))?", part)
        if not match:
            raise ValueError("Invalid CPU list")
        first, last = int(match[1]), int(match[2] or match[1])
        if not 0 <= first <= last < 1024:
            raise ValueError("CPU list is out of range")
        result.update(range(first, last + 1))
    return result


def linux_topology(root: Path = Path("/sys/bus/event_source/devices")) -> dict[int, str]:
    result = {}
    for device, kind in (("cpu_core", "performance"), ("cpu_atom", "efficiency"), ("cpu_lowpower", "low-power-efficiency")):
        try:
            for cpu in cpu_list((root / device / "cpus").read_text()):
                result[cpu] = kind
        except (OSError, ValueError):
            continue
    return result


def mac_topology(document: list[dict[str, Any]]) -> dict[int, str]:
    result = {}
    for parent in document:
        for cpu in parent.get("IORegistryEntryChildren", []):
            index = cpu.get("logical-cpu-id")
            kind = cpu.get("cluster-type", b"").rstrip(b"\0")
            if isinstance(index, int) and 0 <= index < 1024:
                result[index] = {b"P": "performance", b"E": "efficiency"}.get(kind, "unknown")
    return result


def linux_ticks(root: Path = Path("/proc/stat")) -> dict[int, tuple[int, int]]:
    result = {}
    for line in root.read_text().splitlines():
        fields = line.split()
        if not re.fullmatch(r"cpu\d+", fields[0]):
            continue
        # guest counters are already included in user/nice.
        values = [int(value) for value in fields[1:9]]
        result[int(fields[0][3:])] = (sum(values), values[3] + values[4])
    return result


def linux_memory(path: Path = Path("/proc/meminfo")) -> dict[str, Any]:
    values = {match[1]: int(match[2]) / 1024**2 for line in path.read_text().splitlines()
              if (match := re.match(r"^(\w+):\s+(\d+)\s+kB$", line))}
    total, available = values["MemTotal"], values["MemAvailable"]
    stall = None
    try:
        match = re.search(r"^full avg10=([\d.]+)", Path("/proc/pressure/memory").read_text(), re.M)
        stall = float(match[1]) if match else None
    except OSError:
        pass
    return dict(total_gib=round(total, 3), used_gib=round(total-available, 3), available_gib=round(available, 3),
                swap_used_gib=round(values.get("SwapTotal", 0)-values.get("SwapFree", 0), 3),
                swap_total_gib=round(values.get("SwapTotal", 0), 3), wired_gib=None, compressed_gib=None,
                pressure="unknown", pressure_stall_percent=stall)


def linux_disk() -> tuple[int, int] | None:
    read = write = count = 0
    for line in Path("/proc/diskstats").read_text().splitlines():
        fields = line.split()
        if len(fields) < 10 or not (Path("/sys/block") / fields[2] / "device").exists():
            continue
        read += int(fields[5]) * 512
        write += int(fields[9]) * 512
        count += 1
    return (read, write) if count else None


def mac_disk() -> tuple[int, int] | None:
    document = plistlib.loads(command("ioreg", "-a", "-r", "-l", "-c", "IOBlockStorageDriver").encode())
    stats = [entry["Statistics"] for entry in document if "Statistics" in entry]
    return (sum(entry.get("Bytes (Read)", 0) for entry in stats), sum(entry.get("Bytes (Write)", 0) for entry in stats)) if stats else None


def cpu_time(value: str) -> float:
    days, _, clock = value.rpartition("-")
    parts = [float(part) for part in clock.split(":")]
    if len(parts) not in (2, 3):
        raise ValueError("Unrecognized process CPU time")
    return (int(days) * 86400 if days else 0) + sum(part * 60**index for index, part in enumerate(reversed(parts)))


def process_snapshot() -> dict[int, tuple[float, float, str, str]] | None:
    if sys.platform == "darwin":
        try:
            output = command("ps", "-axo", "pid=,rss=,time=,lstart=,comm=")
            result = {}
            for line in output.splitlines():
                fields = line.split(None, 8)
                if len(fields) == 9:
                    pid, rss, ticks = fields[:3]
                    name = fields[8]
                    # basename only; never collect command arguments or executable paths in reports.
                    result[int(pid)] = (cpu_time(ticks), int(rss)/1024, Path(name).name, " ".join(fields[3:8]))
            return result
        except (OSError, ValueError, subprocess.SubprocessError):
            return None
    result = {}
    ticks_per_second = os.sysconf("SC_CLK_TCK")
    page_mib = os.sysconf("SC_PAGE_SIZE") / MIB
    try:
        paths = list(Path("/proc").glob("[0-9]*/stat"))
    except OSError:
        return None
    for path in paths:
        try:
            value = path.read_text()
            left, right = value.index("("), value.rindex(")")
            fields = value[right+2:].split()
            # start time distinguishes recycled PIDs.
            result[int(path.parent.name)] = ((int(fields[11])+int(fields[12]))/ticks_per_second,
                                             max(0, int(fields[21]))*page_mib, value[left+1:right], fields[19])
        except (OSError, ValueError, IndexError):
            continue
    return result


def top_processes(before, after, elapsed: float):
    if before is None or after is None:
        return None
    rows = []
    for pid, (ticks, rss, name, identity) in after.items():
        old = before.get(pid)
        cpu = (ticks-old[0])/elapsed if old and old[3] == identity and ticks >= old[0] else None
        safe_name = re.sub(r"[\x00-\x1f\x7f]", "", name)[:80] or "unknown"
        rows.append(dict(pid=pid, name=safe_name, cpu_cores=round(cpu, 3) if cpu is not None else None, rss_mib=round(rss, 2)))
    by_cpu = sorted(rows, key=lambda row: row["cpu_cores"] or 0, reverse=True)[:10]
    by_memory = sorted(rows, key=lambda row: row["rss_mib"], reverse=True)[:10]
    return list({row["pid"]: row for row in by_cpu + by_memory}.values())


def rates(before, after, seconds):
    if before is None or after is None:
        return (None, None)
    return tuple(round((new-old) / MIB / seconds, 3) if new >= old else None for old, new in zip(before, after))


def collect(sample_seconds: float = 2.0) -> dict[str, Any]:
    started = time.monotonic()
    def cpu_used():
        return sum(resource.getrusage(kind).ru_utime + resource.getrusage(kind).ru_stime
                   for kind in (resource.RUSAGE_SELF, resource.RUSAGE_CHILDREN))
    cpu_started = cpu_used()
    module = helper()
    mac = sys.platform == "darwin"
    if mac:
        try:
            topology = mac_topology(plistlib.loads(command("ioreg", "-p", "IODeviceTree", "-a", "-r", "-l", "-n", "cpus").encode()))
        except (OSError, ValueError, subprocess.SubprocessError):
            topology = {}
        model = module.sysctl("machdep.cpu.brand_string")
        def read_cpu():
            return {index: (sum(values), values[2]) for index, values in enumerate(module.mach_cpu_ticks())}
        def read_network():
            return module.network_bytes(command("netstat", "-ibn"))
        read_disk = mac_disk
    else:
        topology = linux_topology()
        model = next((line.split(":", 1)[1].strip() for line in Path("/proc/cpuinfo").read_text().splitlines() if line.startswith("model name")), "CPU")
        read_cpu, read_network, read_disk = linux_ticks, module.network_counters, linux_disk
    def optional(read):
        try:
            return read()
        except (OSError, ValueError, subprocess.SubprocessError):
            return None
    before_processes = process_snapshot()
    process_started = time.monotonic()
    before_network = optional(read_network)
    network_started = time.monotonic()
    before_disk = optional(read_disk)
    disk_started = time.monotonic()
    before_cpu = read_cpu()
    sample_started = time.monotonic()
    time.sleep(sample_seconds)
    after_cpu = read_cpu()
    elapsed = time.monotonic() - sample_started
    after_network = optional(read_network)
    network_elapsed = time.monotonic() - network_started
    after_disk = optional(read_disk)
    disk_elapsed = time.monotonic() - disk_started
    after_processes = process_snapshot()
    process_elapsed = time.monotonic() - process_started
    cores = []
    for index, (total, idle) in after_cpu.items():
        if index not in before_cpu:
            raise ValueError("CPU topology changed during sampling")
        previous_total, previous_idle = before_cpu[index]
        delta = total-previous_total
        if delta <= 0 or idle < previous_idle:
            raise ValueError("CPU counters reset during sampling")
        cores.append(dict(id=index, kind=topology.get(index, "unknown"), used_percent=round(max(0, min(100, 100*(delta-idle+previous_idle)/delta)), 2)))
    if mac:
        vm_stat = command("vm_stat")
        total_bytes = int(module.sysctl("hw.memsize"))
        used_percent, total = module.memory_usage(total_bytes, vm_stat)
        size, pages = module.vm_pages(vm_stat)
        swap_used, swap_total = module.swap_usage(module.sysctl("vm.swapusage"))
        try:
            pressure = {1: "normal", 2: "warning", 4: "critical"}.get(int(module.sysctl("kern.memorystatus_vm_pressure_level")), "unknown")
        except (OSError, ValueError, subprocess.SubprocessError):
            pressure = "unknown"
        memory = dict(total_gib=total, used_gib=round(total*used_percent/100, 3), available_gib=round(total*(1-used_percent/100), 3),
                      swap_used_gib=swap_used, swap_total_gib=swap_total,
                      wired_gib=round(pages.get("Pages wired down", 0)*size/GIB, 3),
                      compressed_gib=round(pages.get("Pages occupied by compressor", 0)*size/GIB, 3),
                      pressure=pressure, pressure_stall_percent=None)
    else:
        memory = linux_memory()
    rx, tx = rates(before_network, after_network, network_elapsed)
    read, write = rates(before_disk, after_disk, disk_elapsed)
    vm = None if mac else module.windows_vm()
    if vm and vm.get("source") != "libvirt":
        vm = None
    result = dict(schema_version=1, host="macbook-air" if mac else "big-red",
                  checked_at=dt.datetime.now(dt.timezone.utc).isoformat(), sample_seconds=round(elapsed, 3),
                  cpu=dict(model=model[:100], cores=cores), memory=memory,
                  network=dict(rx_mib_s=rx, tx_mib_s=tx), disk=dict(read_mib_s=read, write_mib_s=write),
                  process_count=len(after_processes) if after_processes is not None else None,
                  processes=top_processes(before_processes, after_processes, process_elapsed),
                  vm=vm, observer=dict(cpu_ms=round((cpu_used()-cpu_started)*1000, 2), wall_ms=round((time.monotonic()-started)*1000, 2)))
    return result


def activity_url(value: str) -> str:
    parsed = urlsplit(value)
    if parsed.path.rstrip("/") != "/api/machine-health/ingest":
        raise ValueError("Expected the existing machine health ingest URL")
    return urlunsplit((parsed.scheme, parsed.netloc, "/api/machine-health/activity/ingest", "", ""))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config-file", type=Path)
    parser.add_argument("--print-only", action="store_true")
    parser.add_argument("--summary-only", action="store_true")
    args = parser.parse_args()
    report = collect()
    if args.summary_only:
        print(json.dumps({"host": report["host"], "cpu_groups": {kind: sum(core["kind"] == kind for core in report["cpu"]["cores"]) for kind in {core["kind"] for core in report["cpu"]["cores"]}},
                          "memory": report["memory"], "disk": report["disk"], "process_count": report["process_count"], "named_rows": len(report["processes"] or []), "observer": report["observer"]}))
        return
    if args.print_only:
        print(json.dumps(report))
        return
    module = helper()
    if sys.platform == "darwin":
        if args.config_file is None:
            raise ValueError("Existing resource reporter configuration is required")
        url, secret = module.load_credentials(args.config_file)
        module.send(report, activity_url(url), secret)
    else:
        module.post_report(report, activity_url(os.environ.get("MACHINE_HEALTH_INGEST_URL", "")), os.environ.get("MACHINE_HEALTH_INGEST_SECRET", ""))


if __name__ == "__main__":
    try:
        main()
    except (OSError, RuntimeError, ValueError, subprocess.SubprocessError):
        # Never log private process data, credential URLs, or subprocess output.
        print("Activity sample failed", file=sys.stderr)
        raise SystemExit(1)
