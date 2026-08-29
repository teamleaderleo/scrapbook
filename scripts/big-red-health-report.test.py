#!/usr/bin/env python3
"""Regression tests for the dependency-free Big Red collector."""

from __future__ import annotations

import importlib.util
import datetime as dt
import json
import os
import tempfile
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


class CodexUsageTest(unittest.TestCase):
    def test_aggregates_only_the_previous_complete_hour(self) -> None:
        now = dt.datetime(2026, 8, 29, 7, 23, tzinfo=dt.timezone.utc)
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            session = directory / "route.jsonl"
            records = [
                {
                    "timestamp": "2026-08-29T05:59:59Z",
                    "payload": {
                        "type": "token_count",
                        "info": {
                            "last_token_usage": {
                                field: 999 for field in REPORT.CODEX_TOKEN_FIELDS
                            }
                        },
                    },
                },
                {
                    "timestamp": "2026-08-29T06:15:00Z",
                    "payload": {
                        "type": "token_count",
                        "info": {
                            "last_token_usage": {
                                "input_tokens": 100,
                                "cached_input_tokens": 80,
                                "cache_write_input_tokens": 5,
                                "output_tokens": 20,
                                "reasoning_output_tokens": 7,
                                "total_tokens": 120,
                            }
                        },
                    },
                },
                {
                    "timestamp": "2026-08-29T07:01:00Z",
                    "payload": {
                        "type": "token_count",
                        "info": {
                            "last_token_usage": {
                                field: 999 for field in REPORT.CODEX_TOKEN_FIELDS
                            }
                        },
                    },
                },
            ]
            session.write_text(
                "\n".join(json.dumps(record) for record in records), encoding="utf-8"
            )
            os.utime(session, (now.timestamp(), now.timestamp()))

            usage = REPORT.codex_usage_window(now, directory)

        self.assertEqual(usage["source"], "session-jsonl")
        self.assertEqual(usage["window_started_at"], "2026-08-29T06:00:00Z")
        self.assertEqual(usage["window_ended_at"], "2026-08-29T07:00:00Z")
        self.assertEqual(usage["input_tokens"], 100)
        self.assertEqual(usage["cached_input_tokens"], 80)
        self.assertEqual(usage["output_tokens"], 20)
        self.assertEqual(usage["reasoning_output_tokens"], 7)
        self.assertEqual(usage["model_calls"], 1)
        self.assertEqual(usage["active_routes"], 1)

    def test_marks_a_missing_source_unavailable(self) -> None:
        now = dt.datetime(2026, 8, 29, 7, 23, tzinfo=dt.timezone.utc)
        usage = REPORT.codex_usage_window(now, Path("/definitely/not/present"))

        self.assertEqual(usage["source"], "unavailable")
        self.assertEqual(usage["model_calls"], 0)


class BuildStateTest(unittest.TestCase):
    def test_measures_glaeda_targets_and_cache_without_exposing_paths(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            worktrees = [root / "glaeda", root / "worktree"]
            for index, worktree in enumerate(worktrees, start=1):
                target = worktree / "target"
                target.mkdir(parents=True)
                (target / "artifact").write_bytes(b"x" * index * 2 * REPORT.MIB)
            cache = root / "cache"
            cache.mkdir()
            (cache / "state").write_bytes(b"x" * 8 * REPORT.MIB)

            with patch.object(
                REPORT, "active_glaeda_build_processes", return_value=2
            ):
                state = REPORT.build_state(worktrees, cache)

        self.assertEqual(state["source"], "filesystem")
        self.assertEqual(state["target_count"], 2)
        self.assertEqual(state["active_build_processes"], 2)
        self.assertGreater(state["target_gib"], 0)
        self.assertGreater(state["glaeda_cache_gib"], 0)
        self.assertNotIn(str(root), json.dumps(state))

    def test_marks_missing_worktree_inventory_unavailable(self) -> None:
        with patch.object(REPORT, "glaeda_worktrees", return_value=None):
            state = REPORT.build_state()

        self.assertEqual(state["source"], "unavailable")
        self.assertIsNone(state["total_gib"])


if __name__ == "__main__":
    unittest.main()
