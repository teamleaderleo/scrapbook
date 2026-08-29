#!/usr/bin/env python3
"""Regression tests for the dependency-free Big Red collector."""

from __future__ import annotations

import importlib.util
import datetime as dt
import unittest
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).with_name("big-red-health-report.py")
SPEC = importlib.util.spec_from_file_location("big_red_health_report", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
REPORT = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(REPORT)


class SysstatParsingTest(unittest.TestCase):
    def test_reduces_named_devices_to_bounded_aggregates(self) -> None:
        record = REPORT.sysstat_record(
            {
                "timestamp": {"interval": 600},
                "cpu-load": [
                    {"cpu": "0", "idle": 5},
                    {"cpu": "all", "idle": 75},
                ],
                "memory": {"memused-percent": 40},
                "network": {
                    "net-dev": [
                        {"iface": "lo", "rxkB": 100, "txkB": 100},
                        {"iface": "wifi-private", "rxkB": 2_048, "txkB": 1_024},
                        {"iface": "tailnet-private", "rxkB": 1_024, "txkB": 512},
                    ]
                },
                "disk": [
                    {"disk-device": "loop0", "rkB": 9_999, "wkB": 9_999},
                    {"disk-device": "private-device", "rkB": 4_096, "wkB": 2_048},
                ],
                "psi": {
                    "psi-cpu": {"some_avg": 1.5},
                    "psi-mem": {"full_avg": 0.25},
                    "psi-io": {"full_avg": 0.75},
                },
            }
        )

        self.assertIsNotNone(record)
        assert record is not None
        self.assertEqual(record["cpu"], 25)
        self.assertEqual(record["memory"], 40)
        self.assertEqual(record["rx"], 3)
        self.assertEqual(record["tx"], 1.5)
        self.assertEqual(record["disk_read"], 4)
        self.assertEqual(record["disk_write"], 2)
        self.assertEqual(record["psi_cpu"], 1.5)
        self.assertEqual(record["psi_memory"], 0.25)
        self.assertEqual(record["psi_io"], 0.75)

    def test_weights_uneven_accounting_intervals(self) -> None:
        records = [
            {"interval": 300.0, "cpu": 10.0},
            {"interval": 900.0, "cpu": 30.0},
        ]
        self.assertEqual(REPORT.weighted_average(records, "cpu"), 25)

    def test_requires_explicit_utc_timestamps(self) -> None:
        self.assertIsNone(
            REPORT.sysstat_timestamp(
                {
                    "timestamp": {
                        "date": "2026-08-29",
                        "time": "07:30:00",
                        "tz": "CST",
                    }
                }
            )
        )

    def test_falls_back_to_a_labeled_point_sample(self) -> None:
        now = dt.datetime(2026, 8, 29, tzinfo=dt.timezone.utc)
        with (
            patch.object(REPORT, "sysstat_activity", return_value=None),
            patch.object(REPORT, "activity_sample", return_value=(12.5, 0.25, 0.5)),
            patch.object(REPORT, "memory", return_value=(30.0, 32.0)),
        ):
            activity = REPORT.activity_window(now)

        self.assertEqual(activity["source"], "point")
        self.assertEqual(activity["sample_count"], 1)
        self.assertEqual(activity["cpu_used_percent"], 12.5)
        self.assertIsNone(activity["cpu_pressure_some_percent"])


if __name__ == "__main__":
    unittest.main()
