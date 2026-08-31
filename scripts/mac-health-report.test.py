#!/usr/bin/env python3
"""Regression tests for the privacy-safe Mac resource collector."""

from __future__ import annotations

import importlib.util
import json
import os
import stat
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SCRIPT = Path(__file__).with_name("mac-health-report.py")
SPEC = importlib.util.spec_from_file_location("mac_health_report", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class MacHealthReportTest(unittest.TestCase):
    def test_cpu_percent_uses_idle_delta(self) -> None:
        self.assertEqual(
            MODULE.cpu_percent(
                [[100, 40, 300, 10], [10, 10, 80, 0]],
                [[120, 50, 350, 10], [10, 10, 100, 0]],
            ),
            [37.5, 0.0],
        )

    def test_network_aggregation_deduplicates_address_rows_and_drops_loopback(self) -> None:
        document = """Name Mtu Network Address Ipkts Ierrs Ibytes Opkts Oerrs Obytes Coll
en0 1500 link x 1 0 1000 2 0 2000 0
en0 1500 net y 1 0 1000 2 0 2000 0
utun0 1500 link z 1 0 3000 2 0 4000 0
lo0 16384 link q 1 0 9999 2 0 9999 0
"""
        self.assertEqual(MODULE.network_bytes(document), (4000, 6000))

    def test_memory_swap_battery_and_uptime_parsers(self) -> None:
        vm = """Mach Virtual Memory Statistics: (page size of 16384 bytes)
Pages free: 100.
Pages inactive: 200.
Pages speculative: 50.
"""
        used, total = MODULE.memory_usage(16384 * 1000, vm)
        self.assertEqual((used, total), (65.0, 0.02))
        self.assertEqual(
            MODULE.swap_usage("total = 4.00G used = 1536.00M free = 2.50G"),
            (1.5, 4.0),
        )
        self.assertEqual(
            MODULE.battery("Now drawing from 'AC Power'\n 85%; charging;"),
            (True, 85.0, "charging"),
        )
        with mock.patch.object(MODULE.time, "time", return_value=2000):
            self.assertEqual(MODULE.uptime_seconds("{ sec = 500, usec = 0 }"), 1500)

    def test_credentials_require_private_regular_file_and_https(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "config.json"
            path.write_text(
                json.dumps(
                    {
                        "ingest_url": "https://example.test/api/machine-health/ingest",
                        "ingest_secret": "secret",
                    }
                ),
                encoding="utf-8",
            )
            os.chmod(path, stat.S_IRUSR | stat.S_IWUSR)
            self.assertEqual(
                MODULE.load_credentials(path),
                ("https://example.test/api/machine-health/ingest", "secret"),
            )
            os.chmod(path, 0o644)
            with self.assertRaisesRegex(ValueError, "group or other"):
                MODULE.load_credentials(path)

    def test_report_contract_contains_no_identity_fields(self) -> None:
        disk = os.statvfs("/")
        usage = mock.Mock(total=disk.f_blocks, used=1, free=disk.f_bavail)
        command_results = {
            ("/usr/sbin/netstat", "-ibn"): "Name Mtu Network Address Ipkts Ierrs Ibytes Opkts Oerrs Obytes Coll\nen0 1500 link x 1 0 1000 2 0 2000 0\n",
            ("/usr/bin/vm_stat",): "Mach Virtual Memory Statistics: (page size of 4096 bytes)\nPages free: 100.\nPages inactive: 100.\nPages speculative: 0.\n",
            ("/usr/bin/pmset", "-g", "batt"): "Now drawing from 'Battery Power'\n 42%; discharging;",
        }
        sysctls = {
            "hw.memsize": str(4096 * 1000),
            "vm.swapusage": "total = 1.00G used = 0.25G free = 0.75G",
            "kern.boottime": "{ sec = 500, usec = 0 }",
        }
        with (
            mock.patch.object(MODULE, "mach_cpu_ticks", side_effect=[[[1, 1, 8, 0]], [[2, 2, 16, 0]]]),
            mock.patch.object(MODULE, "run", side_effect=lambda *args: command_results[args]),
            mock.patch.object(MODULE, "sysctl", side_effect=lambda name: sysctls[name]),
            mock.patch.object(MODULE.shutil, "disk_usage", return_value=usage),
            mock.patch.object(MODULE.os, "getloadavg", return_value=(1.0, 0.5, 0.25)),
            mock.patch.object(MODULE.time, "sleep"),
            mock.patch.object(MODULE.time, "monotonic", side_effect=[10.0, 11.0]),
            mock.patch.object(MODULE.time, "time", return_value=2000),
        ):
            payload = MODULE.report()
        self.assertEqual(payload["host"], "macbook-air")
        self.assertEqual(payload["activity"]["core_average_percent"], [20.0])
        encoded = json.dumps(payload).lower()
        for forbidden in (
            "path",
            "command",
            "pid",
            "process",
            "endpoint",
            "peer",
            "title",
            "interface",
            "application",
        ):
            self.assertNotIn(forbidden, encoded)


if __name__ == "__main__":
    unittest.main()
