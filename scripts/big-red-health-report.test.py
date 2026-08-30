#!/usr/bin/env python3
"""Regression tests for the dependency-free Big Red collector."""

from __future__ import annotations

import contextlib
import datetime as dt
import http.server
import importlib.util
import io
import json
import os
import tempfile
import threading
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

    def test_collects_one_window_across_utc_midnight(self) -> None:
        def statistic(date: str, time: str, cpu: float) -> dict[str, object]:
            return {
                "timestamp": {
                    "date": date,
                    "time": time,
                    "tz": "UTC",
                    "interval": 600,
                },
                "cpu-load": [{"cpu": "all", "idle": 100 - cpu}],
                "memory": {"memused-percent": 30},
            }

        documents = {
            "sa29": {
                "sysstat": {
                    "hosts": [
                        {
                            "statistics": [
                                statistic("2026-08-29", "23:40:00", 10),
                                statistic("2026-08-29", "23:50:00", 20),
                            ]
                        }
                    ]
                }
            },
            "sa30": {
                "sysstat": {
                    "hosts": [
                        {
                            "statistics": [
                                statistic("2026-08-30", "00:00:00", 30),
                                statistic("2026-08-30", "00:10:00", 40),
                                statistic("2026-08-30", "00:20:00", 50),
                                statistic("2026-08-30", "00:30:00", 60),
                            ]
                        }
                    ]
                }
            },
        }

        def fake_run(*arguments: str) -> tuple[int, str]:
            return 0, json.dumps(documents[Path(arguments[2]).name])

        now = dt.datetime(2026, 8, 30, 0, 35, tzinfo=dt.timezone.utc)
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            (directory / "sa29").touch()
            (directory / "sa30").touch()
            with patch.object(REPORT, "run", side_effect=fake_run):
                activity = REPORT.sysstat_activity(now, directory)

        self.assertIsNotNone(activity)
        assert activity is not None
        self.assertEqual(activity["sample_count"], 6)
        self.assertEqual(activity["window_minutes"], 60)
        self.assertEqual(activity["cpu_used_percent"], 35)
        self.assertEqual(activity["cpu_peak_percent"], 60)

    def test_falls_back_to_a_labeled_point_sample(self) -> None:
        now = dt.datetime(2026, 8, 29, tzinfo=dt.timezone.utc)
        with (
            patch.object(REPORT, "sysstat_activity", return_value=None),
            patch.object(REPORT, "activity_sample", return_value=(12.5, 0.25, 0.5)),
            patch.object(REPORT, "memory", return_value=(30.0, 32.0, 7.0, 8.0)),
        ):
            activity = REPORT.activity_window(now)

        self.assertEqual(activity["source"], "point")
        self.assertEqual(activity["sample_count"], 1)
        self.assertEqual(activity["cpu_used_percent"], 12.5)
        self.assertIsNone(activity["cpu_pressure_some_percent"])


class MemoryTest(unittest.TestCase):
    def test_reports_ram_and_whole_machine_swap_without_raw_meminfo(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            meminfo = Path(temporary_directory) / "meminfo"
            meminfo.write_text(
                "\n".join(
                    [
                        "MemTotal:       33554432 kB",
                        "MemAvailable:   25165824 kB",
                        "SwapTotal:       8388608 kB",
                        "SwapFree:         786432 kB",
                        "PrivateField:          1 kB",
                    ]
                ),
                encoding="utf-8",
            )

            observed = REPORT.memory(meminfo)

        self.assertEqual(observed, (25.0, 32.0, 7.25, 8.0))


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

    def test_uses_keyed_session_fingerprints_without_emitting_ids(self) -> None:
        now = dt.datetime(2026, 8, 29, 7, 23, tzinfo=dt.timezone.utc)
        token_usage = {
            "input_tokens": 100,
            "cached_input_tokens": 80,
            "cache_write_input_tokens": 5,
            "output_tokens": 20,
            "reasoning_output_tokens": 7,
            "total_tokens": 120,
        }
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            session = directory / "route.jsonl"
            records = [
                {
                    "timestamp": "2026-08-29T06:00:00Z",
                    "type": "session_meta",
                    "payload": {"id": "private-session-id"},
                },
                {
                    "timestamp": "2026-08-29T06:15:00Z",
                    "payload": {
                        "type": "token_count",
                        "info": {"last_token_usage": token_usage},
                    },
                },
            ]
            session.write_text(
                "\n".join(json.dumps(record) for record in records), encoding="utf-8"
            )
            os.utime(session, (now.timestamp(), now.timestamp()))

            result = REPORT.codex_usage_window(
                now, directory, fingerprint_key=b"test-key"
            )

        self.assertTrue(result["fingerprints_complete"])
        self.assertEqual(len(result["session_fingerprints"]), 1)
        self.assertNotIn("private-session-id", json.dumps(result))

    def test_excludes_history_replayed_at_fork_start(self) -> None:
        now = dt.datetime(2026, 8, 29, 7, 23, tzinfo=dt.timezone.utc)
        usage = {
            "input_tokens": 100,
            "cached_input_tokens": 80,
            "cache_write_input_tokens": 5,
            "output_tokens": 20,
            "reasoning_output_tokens": 7,
            "total_tokens": 120,
        }
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            session = directory / "forked-route.jsonl"
            records = [
                {
                    "timestamp": "2026-08-29T06:15:00.000Z",
                    "payload": {"forked_from_id": "parent-route"},
                },
                {
                    "timestamp": "2026-08-29T06:15:00.001Z",
                    "payload": {
                        "type": "token_count",
                        "info": {"last_token_usage": usage},
                    },
                },
                {
                    "timestamp": "2026-08-29T06:15:00.002Z",
                    "payload": {
                        "type": "token_count",
                        "info": {"last_token_usage": usage},
                    },
                },
                {
                    "timestamp": "2026-08-29T06:15:08Z",
                    "payload": {
                        "type": "token_count",
                        "info": {"last_token_usage": usage},
                    },
                },
            ]
            session.write_text(
                "\n".join(json.dumps(record) for record in records), encoding="utf-8"
            )
            os.utime(session, (now.timestamp(), now.timestamp()))

            result = REPORT.codex_usage_window(now, directory)

        self.assertEqual(result["input_tokens"], 100)
        self.assertEqual(result["total_tokens"], 120)
        self.assertEqual(result["model_calls"], 1)
        self.assertEqual(result["active_routes"], 1)


class RouteActivityTest(unittest.TestCase):
    def test_accepts_only_bounded_aggregate_status(self) -> None:
        status = {
            "source": "codex-route-leases-v2",
            "active_routes": 2,
            "active_jobs": 3,
            "complete_residue_jobs": 1,
            "unknown_routes": 0,
            "unknown_jobs": 1,
            "tagged_processes": 17,
            "tagged_rss_bytes": 512 * REPORT.MIB,
            "tagged_resource_jobs": 3,
            "tagged_memory_observed_jobs": 3,
            "tagged_cpu_observed_jobs": 3,
            "tagged_io_observed_jobs": 0,
            "tagged_pressure_observed_jobs": 3,
            "tagged_memory_current_bytes": 384 * REPORT.MIB,
            "largest_tagged_job_memory_peak_bytes": 192 * REPORT.MIB,
            "tagged_cpu_usage_usec": 2_500_000,
            "tagged_io_read_bytes": None,
            "tagged_io_write_bytes": None,
            "tagged_cpu_pressure_some_usec": 198,
            "tagged_memory_pressure_some_usec": 0,
            "tagged_memory_pressure_full_usec": 0,
            "tagged_io_pressure_some_usec": 0,
            "tagged_io_pressure_full_usec": 0,
            "route_id": "must-not-escape",
        }
        with patch.object(REPORT, "run", return_value=(0, json.dumps(status))):
            activity = REPORT.route_activity(Path("/private/helper"))

        self.assertEqual(activity["source"], "codex-route-leases-v2")
        self.assertEqual(activity["active_routes"], 2)
        self.assertEqual(activity["active_jobs"], 3)
        self.assertEqual(activity["residue_jobs"], 1)
        self.assertEqual(activity["tagged_processes"], 17)
        self.assertEqual(activity["tagged_memory_current_bytes"], 384 * REPORT.MIB)
        self.assertEqual(activity["tagged_cpu_usage_usec"], 2_500_000)
        self.assertIsNone(activity["tagged_io_read_bytes"])
        self.assertNotIn("route_id", activity)
        self.assertNotIn("must-not-escape", json.dumps(activity))

    def test_marks_missing_malformed_or_invalid_status_unavailable(self) -> None:
        responses = (
            (127, ""),
            (0, "not json"),
            (0, json.dumps({"source": "wrong"})),
            (
                0,
                json.dumps(
                    {
                        "source": "codex-route-leases-v2",
                        "active_routes": True,
                        "active_jobs": 0,
                        "complete_residue_jobs": 0,
                        "unknown_routes": 0,
                        "unknown_jobs": 0,
                        "tagged_processes": 0,
                        "tagged_rss_bytes": 0,
                    }
                ),
            ),
        )
        for response in responses:
            with self.subTest(response=response):
                with patch.object(REPORT, "run", return_value=response):
                    activity = REPORT.route_activity(Path("/private/helper"))
                self.assertEqual(activity["source"], "unavailable")
                self.assertIsNone(activity["active_routes"])

    def test_withholds_inconsistent_resource_telemetry_only(self) -> None:
        status = {
            "source": "codex-route-leases-v2",
            "active_routes": 2,
            "active_jobs": 3,
            "complete_residue_jobs": 0,
            "unknown_routes": 0,
            "unknown_jobs": 0,
            "tagged_processes": 17,
            "tagged_rss_bytes": 512 * REPORT.MIB,
            "tagged_resource_jobs": 1,
            "tagged_memory_observed_jobs": 2,
            "tagged_memory_current_bytes": 384 * REPORT.MIB,
        }
        with patch.object(REPORT, "run", return_value=(0, json.dumps(status))):
            activity = REPORT.route_activity(Path("/private/helper"))

        self.assertEqual(activity["source"], "codex-route-leases-v2")
        self.assertEqual(activity["active_jobs"], 3)
        self.assertIsNone(activity["tagged_resource_jobs"])
        self.assertIsNone(activity["tagged_memory_current_bytes"])


class ProcessTagsTest(unittest.TestCase):
    def test_accepts_only_consistent_content_blind_aggregates(self) -> None:
        status = {
            "source": "codex-route-hook-v1",
            "active_routes": 2,
            "active_main_roots": 1,
            "active_subagents": 3,
            "active_agents": 4,
            "active_jobs": 5,
            "main_root_jobs": 2,
            "subagent_jobs": 3,
            "tagged_processes": 17,
            "main_root_processes": 7,
            "subagent_processes": 10,
            "tagged_memory_current_bytes": 512 * REPORT.MIB,
            "tagged_rss_bytes": 512 * REPORT.MIB,
            "main_root_memory_current_bytes": 192 * REPORT.MIB,
            "subagent_memory_current_bytes": 320 * REPORT.MIB,
            "unknown_jobs": 0,
            "route_id": "must-not-escape",
        }
        with (
            patch.object(Path, "is_file", return_value=True),
            patch.object(REPORT, "run", return_value=(0, json.dumps(status))),
        ):
            tags = REPORT.process_tags(Path("/private/helper"))

        self.assertEqual(tags["source"], "codex-route-hook-v1")
        self.assertEqual(tags["active_routes"], 2)
        self.assertEqual(tags["active_main_roots"], 1)
        self.assertEqual(tags["active_subagents"], 3)
        self.assertEqual(tags["tagged_processes"], 17)
        self.assertEqual(tags["tagged_memory_current_bytes"], 512 * REPORT.MIB)
        self.assertNotIn("active_agents", tags)
        self.assertNotIn("tagged_rss_bytes", tags)
        self.assertNotIn("route_id", tags)
        self.assertNotIn("must-not-escape", json.dumps(tags))

    def test_marks_missing_malformed_or_inconsistent_status_unavailable(self) -> None:
        valid = {
            "source": "codex-route-hook-v1",
            "active_routes": 1,
            "active_main_roots": 1,
            "active_subagents": 0,
            "active_jobs": 1,
            "main_root_jobs": 1,
            "subagent_jobs": 0,
            "tagged_processes": 1,
            "main_root_processes": 1,
            "subagent_processes": 0,
            "tagged_memory_current_bytes": 1,
            "main_root_memory_current_bytes": 1,
            "subagent_memory_current_bytes": 0,
            "unknown_jobs": 0,
        }
        responses = (
            ((127, ""), "helper-failed"),
            ((0, "not json"), "invalid-receipt"),
            ((0, json.dumps({**valid, "source": "wrong"})), "schema-mismatch"),
            (
                (
                    0,
                    json.dumps(
                        {
                            key: value
                            for key, value in valid.items()
                            if key != "main_root_jobs"
                        }
                    ),
                ),
                "schema-mismatch",
            ),
            ((0, json.dumps({**valid, "active_routes": True})), "invalid-receipt"),
            ((0, json.dumps({**valid, "active_jobs": 2})), "invalid-receipt"),
            ((0, json.dumps({**valid, "tagged_processes": 2})), "invalid-receipt"),
            (
                (0, json.dumps({**valid, "tagged_memory_current_bytes": 2})),
                "invalid-receipt",
            ),
        )
        for response, reason in responses:
            with self.subTest(response=response):
                with (
                    patch.object(Path, "is_file", return_value=True),
                    patch.object(REPORT, "run", return_value=response),
                ):
                    tags = REPORT.process_tags(Path("/private/helper"))
                self.assertEqual(tags["source"], "unavailable")
                self.assertEqual(tags["availability_reason"], reason)
                self.assertIsNone(tags["active_routes"])

    def test_marks_an_absent_process_tag_helper_without_running_it(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            helper = Path(temporary) / "missing.py"
            with patch.object(REPORT, "run") as runner:
                tags = REPORT.process_tags(helper)

        self.assertEqual(tags["source"], "unavailable")
        self.assertEqual(tags["availability_reason"], "helper-missing")
        self.assertIsNone(tags["active_routes"])
        runner.assert_not_called()


class ProcessCoverageTest(unittest.TestCase):
    def test_accepts_only_consistent_aggregate_coverage(self) -> None:
        status = {
            "schema_version": 1,
            "source": "codex-process-coverage-v1",
            "observed_at": "2026-08-29T06:00:00.000Z",
            "process_visibility": "partial",
            "discoverable_roots": 3,
            "discoverable_processes": 18,
            "session_identity_processes": 18,
            "thread_fallback_processes": 0,
            "scoped_processes": 0,
            "hook_scope_processes": 0,
            "lease_scope_processes": 0,
            "generic_scope_processes": 18,
            "unknown_scope_processes": 0,
            "observed_scope_coverage_percent": 0.0,
            "scope_coverage_percent": None,
            "discoverable_rss_bytes": 134_975_488,
            "environ_errors": 3,
            "identity_errors": 0,
            "cgroup_errors": 0,
            "rss_errors": 0,
            "process_races": 0,
            "private_identity": "must-not-escape",
        }
        with patch.object(REPORT, "run", return_value=(0, json.dumps(status))):
            coverage = REPORT.process_coverage(Path("/private/helper"))

        self.assertEqual(coverage["source"], "codex-process-coverage-v1")
        self.assertEqual(coverage["scope_evidence"], "partial")
        self.assertEqual(coverage["discoverable_roots"], 3)
        self.assertEqual(coverage["discoverable_processes"], 18)
        self.assertEqual(coverage["scoped_processes"], 0)
        self.assertEqual(coverage["evidence_errors"], 3)
        self.assertNotIn("private_identity", coverage)
        self.assertNotIn("must-not-escape", json.dumps(coverage))

    def test_rejects_inconsistent_or_malformed_coverage(self) -> None:
        invalid = (
            (127, ""),
            (0, "not json"),
            (0, json.dumps({"source": "wrong"})),
            (
                0,
                json.dumps(
                    {
                        "schema_version": 1,
                        "source": "codex-process-coverage-v1",
                        "observed_at": "2026-08-29T06:00:00.000Z",
                        "process_visibility": "complete",
                        "discoverable_roots": 2,
                        "discoverable_processes": 1,
                        "session_identity_processes": 1,
                        "thread_fallback_processes": 0,
                        "scoped_processes": 0,
                        "hook_scope_processes": 0,
                        "lease_scope_processes": 0,
                        "generic_scope_processes": 1,
                        "unknown_scope_processes": 0,
                        "observed_scope_coverage_percent": 0.0,
                        "scope_coverage_percent": 0.0,
                        "discoverable_rss_bytes": 1,
                        "environ_errors": 0,
                        "identity_errors": 0,
                        "cgroup_errors": 0,
                        "rss_errors": 0,
                        "process_races": 0,
                    }
                ),
            ),
        )
        for response in invalid:
            with self.subTest(response=response):
                with patch.object(REPORT, "run", return_value=response):
                    coverage = REPORT.process_coverage(Path("/private/helper"))
                self.assertEqual(coverage["source"], "unavailable")
                self.assertIsNone(coverage["discoverable_processes"])


class CodexStateTest(unittest.TestCase):
    @staticmethod
    def status() -> dict[str, object]:
        return {
            "schema_version": 1,
            "document_type": "big-red-codex-state-aggregate-report",
            "observed_at": "2026-08-29T06:00:00.000Z",
            "installed_build": {"package": "chatgpt", "version": "26.825.31414"},
            "scan_duration_ms": 7_391,
            "snapshot_stable": True,
            "manifest_scan_complete": True,
            "process_scan_complete": False,
            "relevant_process_count": 31,
            "content_files_opened": 0,
            "privileged_process_observation": False,
            "privileged_link_reads": 0,
            "privileged_fd_table_reads": 0,
            "network_used": False,
            "mutation_performed": False,
            "retention_authority": False,
            "reconstructible_bytes": 0,
            "reclaimable_bytes": 0,
            "class_count": 48,
            "file_count": 9_792,
            "allocated_bytes": 1_849_430_016,
            "classifications": {
                "active": 11,
                "authoritative": 0,
                "manifest-referenced": 0,
                "unknown": 37,
            },
            "files_by_classification": {
                "active": 3_450,
                "authoritative": 0,
                "manifest-referenced": 0,
                "unknown": 6_342,
            },
            "allocated_bytes_by_classification": {
                "active": 918_818_816,
                "authoritative": 0,
                "manifest-referenced": 0,
                "unknown": 930_611_200,
            },
            "private_path": "must-not-escape",
        }

    def test_accepts_only_content_blind_reconciled_aggregates(self) -> None:
        with patch.object(
            REPORT, "run_codex_state", return_value=(0, json.dumps(self.status()))
        ):
            state = REPORT.codex_state(Path("/private/helper"))

        self.assertEqual(state["source"], "codex-state-inventory-v1")
        self.assertEqual(state["snapshot_evidence"], "partial")
        self.assertEqual(state["allocated_bytes"], 1_849_430_016)
        self.assertEqual(state["active_bytes"], 918_818_816)
        self.assertEqual(state["unknown_bytes"], 930_611_200)
        self.assertEqual(state["reclaimable_bytes"], 0)
        self.assertFalse(state["retention_authority"])
        self.assertNotIn("private_path", state)
        self.assertNotIn("must-not-escape", json.dumps(state))

    def test_marks_malformed_inconsistent_or_authoritative_results_unavailable(
        self,
    ) -> None:
        valid = self.status()
        cases = (
            (127, ""),
            (0, "not json"),
            (0, json.dumps({**valid, "schema_version": 2})),
            (0, json.dumps({**valid, "allocated_bytes": True})),
            (0, json.dumps({**valid, "reclaimable_bytes": 1})),
            (0, json.dumps({**valid, "retention_authority": True})),
            (
                0,
                json.dumps(
                    {
                        **valid,
                        "allocated_bytes_by_classification": {
                            **valid["allocated_bytes_by_classification"],
                            "unknown": 1,
                        },
                    }
                ),
            ),
        )
        for response in cases:
            with self.subTest(response=response[0:1]):
                with patch.object(REPORT, "run_codex_state", return_value=response):
                    state = REPORT.codex_state(Path("/private/helper"))
                self.assertEqual(state["source"], "unavailable")
                self.assertIsNone(state["allocated_bytes"])


class BerylHealthTest(unittest.TestCase):
    @staticmethod
    def diagnostic(**overrides: str) -> str:
        values = {
            "router_ssh": "available",
            "router_tailscale_service": "running",
            "router_openclash_service": "running",
            "router_netifyd_service": "inactive",
            "router_fan_service": "running",
            "router_tailscaled_processes": "1",
            "router_clash_processes": "1",
            "router_netifyd_processes": "0",
            "router_tailscaled_rss_kib": "31540",
            "router_clash_rss_kib": "51020",
            "router_mem_available_kib": "89116",
            "router_uptime_seconds": "449097",
            "router_oom_kills_current_boot": "15",
            "router_latest_oom_age_seconds": "102224",
            "router_soc_temp_millic": "78664",
            "router_fan_policy_enabled": "1",
            "router_fan_policy_temperature_celsius": "75",
            "router_fan_policy_warning_celsius": "75",
            "router_pwm_fan_current_state": "14",
            "router_pwm_fan_max_state": "255",
            "router_cpu_thermal_current_state": "0",
            "router_cpu_thermal_max_state": "3",
        }
        values.update(overrides)
        section = "\n".join(f"{key}={value}" for key, value in values.items())
        return f"timestamp=private\n\nBeryl local health:\n{section}\n\nDNS:\n"

    def test_parses_only_the_allowlisted_router_section(self) -> None:
        output = self.diagnostic().replace(
            "\n\nDNS:\n", "\nrouter_address=private\n\nDNS:\n"
        )
        with patch.object(
            REPORT,
            "run_connectivity_diagnostic",
            return_value=(0, output),
        ):
            health = REPORT.beryl_health()

        self.assertEqual(health["source"], "big-red-connectivity-check-v1")
        self.assertEqual(health["ssh"], "available")
        self.assertEqual(health["soc_temp_millic"], 78_664)
        self.assertEqual(health["latest_oom_age_seconds"], 102_224)
        self.assertEqual(
            health["fan"],
            {
                "service": "running",
                "policy_enabled": True,
                "policy_temperature_c": 75,
                "policy_warning_c": 75,
                "pwm_current_state": 14,
                "pwm_max_state": 255,
                "cpu_cooling_current_state": 0,
                "cpu_cooling_max_state": 3,
            },
        )
        self.assertNotIn("timestamp", health)

    def test_fails_closed_on_duplicate_or_inconsistent_fields(self) -> None:
        duplicate = self.diagnostic().replace(
            "\n\nDNS:\n", "\nrouter_soc_temp_millic=1\n\nDNS:\n"
        )
        inconsistent = self.diagnostic(router_pwm_fan_current_state="256")
        for output in (duplicate, inconsistent):
            with (
                self.subTest(output=output[-40:]),
                patch.object(
                    REPORT,
                    "run_connectivity_diagnostic",
                    return_value=(0, output),
                ),
            ):
                self.assertEqual(REPORT.beryl_health(), {"source": "unavailable"})

    def test_preserves_bounded_ssh_unavailability(self) -> None:
        output = "Beryl local health:\nrouter_ssh=unavailable\n"
        with patch.object(
            REPORT, "run_connectivity_diagnostic", return_value=(0, output)
        ):
            self.assertEqual(
                REPORT.beryl_health(),
                {
                    "source": "big-red-connectivity-check-v1",
                    "ssh": "unavailable",
                },
            )


class RemoteClientTest(unittest.TestCase):
    NOW = dt.datetime(2026, 8, 29, 18, 0, tzinfo=dt.timezone.utc)

    @staticmethod
    def status(**peer_overrides: object) -> dict[str, object]:
        peer: dict[str, object] = {
            "OS": "macOS",
            "Online": True,
            "Active": False,
            "CurAddr": "",
            "Relay": "private-region",
            "LastSeen": "2026-08-29T17:59:00Z",
            "HostName": "must-not-escape",
            "PublicKey": "must-not-escape",
            "TailscaleIPs": ["100.64.0.1"],
        }
        peer.update(peer_overrides)
        return {
            "BackendState": "Running",
            "Self": {"Online": True},
            "Peer": {"private-peer-key": peer},
        }

    def test_classifies_offline_idle_direct_and_relay_without_peer_detail(self) -> None:
        cases = (
            ({"Online": False}, "offline"),
            ({}, "online-idle"),
            ({"Active": True, "CurAddr": "private-endpoint"}, "direct"),
            ({"Active": True, "CurAddr": ""}, "relay"),
        )
        for overrides, expected in cases:
            with self.subTest(expected=expected):
                result = REPORT.remote_client_state(
                    self.status(**overrides), self.NOW
                )
                self.assertEqual(result["source"], "tailscale-status")
                self.assertEqual(result["state"], expected)
                encoded = json.dumps(result)
                self.assertNotIn("must-not-escape", encoded)
                self.assertNotIn("private-region", encoded)
                self.assertNotIn("private-endpoint", encoded)
                self.assertNotIn("private-peer-key", encoded)

        offline = REPORT.remote_client_state(
            self.status(Online=False, LastSeen="2026-08-29T12:00:00Z"),
            self.NOW,
        )
        self.assertEqual(offline["last_seen_seconds_ago"], 6 * 3_600)

        active_zero_time = REPORT.remote_client_state(
            self.status(LastSeen="0001-01-01T00:00:00Z"), self.NOW
        )
        self.assertIsNone(active_zero_time["last_seen_seconds_ago"])

    def test_fails_closed_on_missing_or_ambiguous_macos_peer(self) -> None:
        statuses = (
            {},
            {"Peer": {}},
            {
                "Peer": {
                    "one": self.status()["Peer"]["private-peer-key"],
                    "two": self.status()["Peer"]["private-peer-key"],
                }
            },
        )
        for status in statuses:
            with self.subTest(status=status):
                result = REPORT.remote_client_state(status, self.NOW)
                self.assertEqual(
                    result,
                    {
                        "source": "unavailable",
                        "state": "unavailable",
                        "last_seen_seconds_ago": None,
                    },
                )

    def test_reads_one_tailscale_document_for_host_and_remote_state(self) -> None:
        with patch.object(
            REPORT,
            "run",
            return_value=(0, json.dumps(self.status(Online=False))),
        ):
            backend, online, remote = REPORT.tailscale_state(self.NOW)

        self.assertEqual(backend, "running")
        self.assertTrue(online)
        self.assertEqual(remote["state"], "offline")

    def test_parses_one_path_probe_without_peer_detail(self) -> None:
        cases = (
            ("via 192.0.2.1:41641", "direct"),
            ("via [2001:db8::1]:41641", "direct"),
            ("via DERP(private-region)", "relay"),
            ("via peer-relay(private-peer)", "peer-relay"),
        )
        for route, expected in cases:
            with self.subTest(expected=expected):
                probe = REPORT.parse_tailscale_ping(
                    f"pong from must-not-escape (100.64.0.1) {route} in 221ms"
                )
                self.assertEqual(
                    probe,
                    {
                        "source": "tailscale-ping",
                        "path": expected,
                        "rtt_ms": 221.0,
                        "samples": 1,
                    },
                )
                self.assertNotIn("must-not-escape", json.dumps(probe))
                self.assertNotIn("private", json.dumps(probe))

        self.assertIsNone(
            REPORT.parse_tailscale_ping(
                "pong from must-not-escape (100.64.0.1) "
                "via future-route(private) in 221ms"
            )
        )

    def test_adds_one_probe_only_for_an_active_remote_path(self) -> None:
        responses = (
            (0, json.dumps(self.status(Active=True, CurAddr="private-endpoint"))),
            (
                0,
                "pong from must-not-escape (100.64.0.1) "
                "via 192.0.2.1:41641 in 221ms",
            ),
        )
        with patch.object(REPORT, "run", side_effect=responses) as run:
            backend, online, remote = REPORT.tailscale_state(self.NOW)

        self.assertEqual(backend, "running")
        self.assertTrue(online)
        self.assertEqual(remote["state"], "direct")
        self.assertEqual(
            remote["transport_probe"],
            {
                "source": "tailscale-ping",
                "path": "direct",
                "rtt_ms": 221.0,
                "samples": 1,
            },
        )
        self.assertEqual(run.call_count, 2)
        encoded = json.dumps(remote)
        self.assertNotIn("must-not-escape", encoded)
        self.assertNotIn("private-endpoint", encoded)
        self.assertNotIn("100.64.0.1", encoded)

    def test_skips_probe_for_inactive_or_unknown_remote_paths(self) -> None:
        cases = (
            {"Online": False},
            {"Active": False},
            {"Active": True, "CurAddr": "", "Relay": ""},
        )
        for overrides in cases:
            with self.subTest(overrides=overrides):
                with patch.object(
                    REPORT,
                    "run",
                    return_value=(0, json.dumps(self.status(**overrides))),
                ) as run:
                    _backend, _online, remote = REPORT.tailscale_state(
                        self.NOW
                    )

                self.assertNotIn("transport_probe", remote)
                run.assert_called_once_with("tailscale", "status", "--json")

    def test_malformed_self_and_time_evidence_fail_soft(self) -> None:
        status = self.status(LastSeen="not-a-time")
        status["Self"] = "not-an-object"
        with patch.object(REPORT, "run", return_value=(0, json.dumps(status))):
            backend, online, remote = REPORT.tailscale_state(self.NOW)

        self.assertEqual(backend, "running")
        self.assertIsNone(online)
        self.assertEqual(remote["state"], "online-idle")
        self.assertIsNone(remote["last_seen_seconds_ago"])


class RemoteAccelerationTest(unittest.TestCase):
    INVOCATION_ID = "a" * 32

    @staticmethod
    def journal(*messages: str) -> str:
        return "\n".join(json.dumps({"MESSAGE": message}) for message in messages)

    def test_classifies_current_hardware_fallback_and_waiting_paths(self) -> None:
        cases = (
            (
                [
                    "[HWAccel.Vulkan] Initialization of Vulkan was successful",
                    "[HWAccel.VAAPI] Successfully initialized VAAPI private detail",
                ],
                "hardware-ready",
            ),
            (
                [
                    "[HWAccel.Vulkan] Initialization of Vulkan was successful",
                    "[RDP] Did not initialize VAAPI: private failure detail",
                ],
                "software-fallback",
            ),
            (
                ["[HWAccel.Vulkan] Initialization of Vulkan was successful"],
                "awaiting-session",
            ),
            ([], "unknown"),
        )
        for messages, expected in cases:
            with self.subTest(expected=expected):
                self.assertEqual(REPORT.grd_acceleration_state(messages), expected)

    def test_uses_only_the_current_service_invocation_and_emits_no_log_detail(
        self,
    ) -> None:
        output = self.journal(
            "[HWAccel.Vulkan] Initialization of Vulkan was successful",
            "[HWAccel.VAAPI] Successfully initialized VAAPI must-not-escape",
        )
        with patch.object(
            REPORT,
            "run",
            side_effect=((0, self.INVOCATION_ID), (0, output)),
        ) as run:
            acceleration = REPORT.gnome_remote_desktop_acceleration()

        self.assertEqual(
            acceleration,
            {
                "source": "grd-current-invocation",
                "state": "hardware-ready",
            },
        )
        self.assertNotIn("must-not-escape", json.dumps(acceleration))
        self.assertIn(
            f"_SYSTEMD_INVOCATION_ID={self.INVOCATION_ID}", run.call_args_list[1].args
        )

    def test_latest_vaapi_result_wins_within_one_invocation(self) -> None:
        output = self.journal(
            "[HWAccel.Vulkan] Initialization of Vulkan was successful",
            "[RDP] Did not initialize VAAPI: first attempt",
            "[HWAccel.VAAPI] Successfully initialized VAAPI later attempt",
        )
        with patch.object(
            REPORT,
            "run",
            side_effect=((0, self.INVOCATION_ID), (0, output)),
        ):
            acceleration = REPORT.gnome_remote_desktop_acceleration()

        self.assertEqual(acceleration["state"], "hardware-ready")

    def test_invalid_invocation_or_journal_fails_closed(self) -> None:
        cases = (
            ((0, "private-invalid-id"),),
            ((0, self.INVOCATION_ID), (127, "")),
            ((0, self.INVOCATION_ID), (0, "not-json")),
        )
        for responses in cases:
            with self.subTest(responses=responses):
                with patch.object(REPORT, "run", side_effect=responses):
                    acceleration = REPORT.gnome_remote_desktop_acceleration()
                self.assertEqual(
                    acceleration,
                    {"source": "unavailable", "state": "unavailable"},
                )


class RemoteSessionWindowTest(unittest.TestCase):
    NOW = dt.datetime(2026, 8, 30, 9, 0, tzinfo=dt.timezone.utc)

    @staticmethod
    def journal(*messages: str) -> str:
        return "\n".join(json.dumps({"MESSAGE": message}) for message in messages)

    def test_counts_bounded_session_endings_without_log_detail(self) -> None:
        output = self.journal(
            "[RDP] Network or intentional disconnect, stopping session",
            "[transport_read_layer]: ERRCONNECT_CONNECT_TRANSPORT_FAILED secret",
            "[rdp_set_error_info]: ERRINFO_LOGOFF_BY_USER secret",
            "[rdp_set_error_info]: ERRINFO_RPC_INITIATED_DISCONNECT secret",
            "unrelated private journal detail",
        )
        with patch.object(REPORT, "run", return_value=(0, output)) as run:
            sessions = REPORT.gnome_remote_desktop_sessions(self.NOW)

        self.assertEqual(
            sessions,
            {
                "source": "grd-journal-24h",
                "window_hours": 24,
                "session_endings": 1,
                "transport_endings": 1,
            "user_logoffs": 1,
            "server_disconnects": 1,
            "admission_blocks": 0,
            "truncated": False,
            },
        )
        self.assertNotIn("secret", json.dumps(sessions))
        self.assertIn(
            "--unit=gnome-remote-desktop.service",
            run.call_args.args,
        )
        self.assertIn("2026-08-29T09:00:00+00:00", run.call_args.args)

    def test_counts_session_creation_inhibition_without_retaining_log_text(
        self,
    ) -> None:
        output = self.journal(
            "Failed to start remote desktop session: "
            "GDBus.Error:org.freedesktop.DBus.Error.Failed: "
            "Session creation inhibited private detail",
            "[rdp_set_error_info]: ERRINFO_RPC_INITIATED_DISCONNECT",
        )
        with patch.object(REPORT, "run", return_value=(0, output)):
            sessions = REPORT.gnome_remote_desktop_sessions(self.NOW)

        self.assertEqual(sessions["admission_blocks"], 1)
        self.assertEqual(sessions["server_disconnects"], 1)
        self.assertNotIn("private detail", json.dumps(sessions))

    def test_marks_a_truncated_window_and_counts_only_the_bounded_tail(self) -> None:
        records = [
            json.dumps(
                {
                    "MESSAGE": (
                        "[RDP] Network or intentional disconnect, stopping session"
                    )
                }
            )
            for _ in range(REPORT.GRD_SESSION_EVENT_LIMIT + 1)
        ]
        with patch.object(REPORT, "run", return_value=(0, "\n".join(records))):
            sessions = REPORT.gnome_remote_desktop_sessions(self.NOW)

        self.assertTrue(sessions["truncated"])
        self.assertEqual(
            sessions["session_endings"], REPORT.GRD_SESSION_EVENT_LIMIT
        )

    def test_unavailable_or_invalid_journal_fails_closed(self) -> None:
        for response in ((127, ""), (0, "not-json"), (0, '[]')):
            with self.subTest(response=response):
                with patch.object(REPORT, "run", return_value=response):
                    sessions = REPORT.gnome_remote_desktop_sessions(self.NOW)
                self.assertEqual(sessions["source"], "unavailable")
                self.assertIsNone(sessions["session_endings"])


class DesktopStateTest(unittest.TestCase):
    @staticmethod
    def snapshot() -> dict[str, object]:
        return {
            "source": "gnome-polish-live-v2",
            "schema_version": 2,
            "variant": "baseline",
            "gnome_shell": "50.1",
            "display": {
                "mode": "3072x1920",
                "refresh_hz": 165.0,
                "logical_scale": 1.5,
                "screen_shield_active": True,
                "private_connector": "must-not-survive",
            },
            "settings": {
                "org.gnome.desktop.interface/enable-animations": True,
                "org.gnome.desktop.remote-desktop.rdp/screen-share-mode": (
                    "mirror-primary"
                ),
                "org.gnome.desktop.background/picture-uri": "must-not-survive",
            },
            "candidate_assets": ["must-not-survive"],
            "configured_wallpapers": {
                "complete": False,
                "light": {"basename": "must-not-survive"},
                "dark": {"basename": "must-not-survive"},
            },
        }

    def test_allows_only_current_desktop_dimensions_and_modes(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            backlight = Path(temporary) / "panel"
            backlight.mkdir()
            (backlight / "actual_brightness").write_text("0\n", encoding="utf-8")
            (backlight / "max_brightness").write_text("500\n", encoding="utf-8")
            (backlight / "bl_power").write_text("4\n", encoding="utf-8")
            with patch.object(
                REPORT,
                "run",
                return_value=(0, json.dumps(self.snapshot())),
            ) as run:
                desktop = REPORT.desktop_state(
                    Path("/private/helper"), Path(temporary)
                )

        self.assertEqual(
            desktop,
            {
                "source": "gnome-polish-live-v2",
                "gnome_shell": "50.1",
                "pixel_width": 3072,
                "pixel_height": 1920,
                "refresh_hz": 165.0,
                "logical_scale": 1.5,
                "screen_shield_active": True,
                "animations_enabled": True,
                "screen_share_mode": "mirror-primary",
                "wallpaper_references_complete": False,
                "panel": {
                    "source": "sysfs-backlight",
                    "state": "off",
                    "actual_brightness_percent": 0.0,
                },
            },
        )
        self.assertNotIn("private", json.dumps(desktop))
        self.assertEqual(
            run.call_args.args,
            (
                REPORT.sys.executable,
                "/private/helper",
                "snapshot",
                "--variant",
                "baseline",
            ),
        )

    def test_malformed_or_drifted_desktop_receipt_is_unavailable(self) -> None:
        cases = (None, {**self.snapshot(), "schema_version": 3})
        with tempfile.TemporaryDirectory() as temporary:
            for value in cases:
                with self.subTest(value=value):
                    output = "not-json" if value is None else json.dumps(value)
                    with patch.object(REPORT, "run", return_value=(0, output)):
                        desktop = REPORT.desktop_state(
                            backlight_root=Path(temporary)
                        )
                    self.assertEqual(desktop["source"], "unavailable")
                    self.assertEqual(desktop["panel"]["source"], "unavailable")
                    self.assertTrue(
                        all(
                            item is None
                            for key, item in desktop.items()
                            if key not in {"source", "panel"}
                        )
                    )

        invalid_mode = self.snapshot()
        invalid_mode["settings"] = {
            **invalid_mode["settings"],
            "org.gnome.desktop.remote-desktop.rdp/screen-share-mode": "private",
        }
        with patch.object(
            REPORT,
            "run",
            return_value=(0, json.dumps(invalid_mode)),
        ):
            with tempfile.TemporaryDirectory() as temporary:
                self.assertEqual(
                    REPORT.desktop_state(backlight_root=Path(temporary))["source"],
                    "unavailable",
                )

        missing_wallpaper_state = self.snapshot()
        missing_wallpaper_state.pop("configured_wallpapers")
        with patch.object(
            REPORT,
            "run",
            return_value=(0, json.dumps(missing_wallpaper_state)),
        ):
            with tempfile.TemporaryDirectory() as temporary:
                self.assertEqual(
                    REPORT.desktop_state(backlight_root=Path(temporary))["source"],
                    "unavailable",
                )

    def test_backlight_receipt_is_bounded_and_fails_closed(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            first = root / "first-private-name"
            first.mkdir()
            (first / "actual_brightness").write_text("151\n", encoding="utf-8")
            (first / "max_brightness").write_text("496\n", encoding="utf-8")
            (first / "bl_power").write_text("0\n", encoding="utf-8")

            receipt = REPORT.panel_backlight_state(root)
            self.assertEqual(
                receipt,
                {
                    "source": "sysfs-backlight",
                    "state": "on",
                    "actual_brightness_percent": 30.4,
                },
            )
            self.assertNotIn("private", json.dumps(receipt))

            second = root / "second-private-name"
            second.mkdir()
            (second / "actual_brightness").write_text("0\n", encoding="utf-8")
            (second / "max_brightness").write_text("100\n", encoding="utf-8")
            (second / "bl_power").write_text("4\n", encoding="utf-8")
            self.assertEqual(REPORT.panel_backlight_state(root)["state"], "on")

            (first / "actual_brightness").write_text("invalid\n", encoding="utf-8")
            self.assertEqual(
                REPORT.panel_backlight_state(root),
                {
                    "source": "unavailable",
                    "state": "unavailable",
                    "actual_brightness_percent": None,
                },
            )


class CodexRuntimeTest(unittest.TestCase):
    def test_aggregates_minimal_control_trees_without_process_detail(self) -> None:
        mib = REPORT.MIB
        rows = {
            10: (1, "chatgpt", "/usr/lib/chatgpt/chatgpt", mib),
            11: (
                10,
                "codex",
                "/usr/lib/chatgpt/resources/codex app-server",
                mib,
            ),
            12: (11, "node_repl", "/runtime/node_repl", mib),
            13: (
                11,
                "mainthread",
                "/runtime/node /plugin/mcp/server.mjs --stdio",
                mib,
            ),
            14: (11, "python3", "collector must-not-survive", mib),
            20: (
                1,
                "codex",
                (
                    "/home/private/.codex/packages/standalone/releases/v/bin/"
                    "codex app-server --remote-control"
                ),
                mib,
            ),
            21: (20, "node", "node ./mcp/server.cjs --stdio", mib),
            30: (1, "node", "node ./mcp/server.cjs --stdio unrelated", mib),
        }

        runtime = REPORT.codex_runtime(
            rows,
            memory_reader=lambda pid: (pid * mib, pid * 2 * mib),
            own_pid=14,
        )

        self.assertEqual(
            runtime,
            {
                "source": "codex-runtime-tree-v1",
                "control_roots": 2,
                "processes": 6,
                "code_mode_hosts": 1,
                "mcp_servers": 2,
                "rss_bytes": 6 * mib,
                "pss_bytes": 87 * mib,
                "swap_bytes": 174 * mib,
                "memory_errors": 0,
                "process_classes": {
                    "control": {
                        "processes": 3,
                        "rss_bytes": 3 * mib,
                        "pss_bytes": 41 * mib,
                        "swap_bytes": 82 * mib,
                    },
                    "code_mode": {
                        "processes": 1,
                        "rss_bytes": mib,
                        "pss_bytes": 12 * mib,
                        "swap_bytes": 24 * mib,
                    },
                    "mcp": {
                        "processes": 2,
                        "rss_bytes": 2 * mib,
                        "pss_bytes": 34 * mib,
                        "swap_bytes": 68 * mib,
                    },
                    "other": {
                        "processes": 0,
                        "rss_bytes": 0,
                        "pss_bytes": 0,
                        "swap_bytes": 0,
                    },
                },
            },
        )
        serialized = json.dumps(runtime)
        self.assertNotIn("private", serialized)
        self.assertNotIn("server.cjs", serialized)
        self.assertNotIn("collector", serialized)

    def test_memory_error_withholds_pss_and_swap_without_losing_counts(self) -> None:
        rows = {
            10: (1, "chatgpt", "/usr/lib/chatgpt/chatgpt", REPORT.MIB),
            11: (10, "node_repl", "node_repl", REPORT.MIB),
        }

        def memory(pid: int) -> tuple[int, int]:
            if pid == 11:
                raise FileNotFoundError
            return REPORT.MIB, 0

        runtime = REPORT.codex_runtime(rows, memory_reader=memory, own_pid=999)

        self.assertEqual(runtime["processes"], 2)
        self.assertEqual(runtime["memory_errors"], 1)
        self.assertIsNone(runtime["pss_bytes"])
        self.assertIsNone(runtime["swap_bytes"])
        for process_class in runtime["process_classes"].values():
            self.assertIsNone(process_class["pss_bytes"])
            self.assertIsNone(process_class["swap_bytes"])

    def test_reads_only_bounded_pss_and_swap_totals(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            process = root / "42"
            process.mkdir()
            (process / "smaps_rollup").write_text(
                "Rss: 100 kB\nPss: 75 kB\nSwap: 25 kB\n",
                encoding="utf-8",
            )

            values = REPORT.process_pss_swap(42, root)

        self.assertEqual(values, (75 * 1024, 25 * 1024))


class HygieneTest(unittest.TestCase):
    def test_aggregates_browser_descendant_rss_without_process_detail(self) -> None:
        rows = {
            100: (1, "chrome", "/usr/bin/google-chrome", 100 * REPORT.MIB),
            101: (
                100,
                "chrome",
                "/usr/bin/google-chrome --type=renderer",
                200 * REPORT.MIB,
            ),
            102: (101, "chrome", "chrome child", 50 * REPORT.MIB),
            200: (1, "node_repl", "node_repl", 10 * REPORT.MIB),
            300: (1, "electron", "unrelated app", 500 * REPORT.MIB),
        }
        with (
            patch.object(REPORT, "process_table", return_value=rows),
            patch.object(REPORT, "run", return_value=(0, "")),
            patch.object(REPORT, "established_tcp_connections", return_value=1),
        ):
            counts = REPORT.hygiene_counts()

        self.assertEqual(counts[:5], (1, 350 * REPORT.MIB, 1, 0, 1))
        self.assertEqual(
            counts[5],
            {
                "source": "codex-runtime-tree-v1",
                "control_roots": 0,
                "processes": 0,
                "code_mode_hosts": 0,
                "mcp_servers": 0,
                "rss_bytes": 0,
                "pss_bytes": 0,
                "swap_bytes": 0,
                "memory_errors": 0,
                "process_classes": {
                    name: {
                        "processes": 0,
                        "rss_bytes": 0,
                        "pss_bytes": 0,
                        "swap_bytes": 0,
                    }
                    for name in ("control", "code_mode", "mcp", "other")
                },
            },
        )

    def test_counts_only_established_connections_on_the_local_rdp_port(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            table = Path(temporary_directory) / "tcp"
            table.write_text(
                "  sl  local_address rem_address   st\n"
                "   0: 00000000:0D3D 00000000:0000 0A\n"
                "   1: 0100007F:0D3D 0200007F:C001 01\n"
                "   2: 0100007F:0D3D 0200007F:C002 06\n"
                "   3: 0100007F:1F90 0200007F:C003 01\n",
                encoding="utf-8",
            )

            count = REPORT.established_tcp_connections(3389, (table,))

        self.assertEqual(count, 1)

    def test_reads_the_configured_rdp_port_without_emitting_it(self) -> None:
        with patch.object(REPORT, "run", return_value=(0, "uint16 3391")):
            port = REPORT.configured_rdp_port()

        self.assertEqual(port, 3391)


class ReliabilityTest(unittest.TestCase):
    def test_counts_structured_crashes_and_restarts_without_unit_detail(self) -> None:
        records = [
            {
                "MESSAGE_ID": REPORT.SYSTEMD_PROCESS_EXIT_MESSAGE_ID,
                "EXIT_CODE": "dumped",
                "USER_UNIT": REPORT.DESKTOP_SEARCH_UNIT,
                "MESSAGE": "desktop search crashed",
            },
            {
                "MESSAGE_ID": REPORT.SYSTEMD_PROCESS_EXIT_MESSAGE_ID,
                "EXIT_CODE": "dumped",
                "UNIT": "private.service",
                "MESSAGE": "private.service crashed",
            },
            {
                "MESSAGE_ID": REPORT.SYSTEMD_PROCESS_EXIT_MESSAGE_ID,
                "EXIT_CODE": "exited",
                "EXIT_STATUS": "7",
                "USER_UNIT": "expected-failure-canary.service",
                "MESSAGE": "expected failure arm exited",
            },
            {
                "MESSAGE_ID": REPORT.SYSTEMD_PROCESS_EXIT_MESSAGE_ID,
                "EXIT_CODE": "killed",
                "MESSAGE": "another-private.service was stopped",
            },
            {
                "MESSAGE_ID": REPORT.SYSTEMD_RESTART_MESSAGE_ID,
                "USER_UNIT": REPORT.DESKTOP_SEARCH_UNIT,
                "MESSAGE": "desktop search restarted",
            },
            {
                "MESSAGE_ID": REPORT.SYSTEMD_RESTART_MESSAGE_ID,
                "UNIT": "private.service",
                "MESSAGE": "private.service restarted",
            },
        ]
        with patch.object(
            REPORT,
            "run",
            return_value=(0, "\n".join(json.dumps(record) for record in records)),
        ):
            reliability = REPORT.reliability_window(
                dt.datetime(2026, 8, 29, 12, tzinfo=dt.timezone.utc)
            )

        self.assertEqual(reliability["source"], "journal-24h")
        self.assertEqual(reliability["window_hours"], 24)
        self.assertEqual(reliability["crash_exits"], 2)
        self.assertEqual(reliability["automatic_restarts"], 2)
        self.assertEqual(
            reliability["breakdown"],
            {
                "desktop_search": {"crash_exits": 1, "automatic_restarts": 1},
                "other": {"crash_exits": 1, "automatic_restarts": 1},
            },
        )
        self.assertFalse(reliability["truncated"])
        self.assertNotIn("private.service", json.dumps(reliability))
        self.assertNotIn(REPORT.DESKTOP_SEARCH_UNIT, json.dumps(reliability))

    def test_marks_missing_or_malformed_journal_data_unavailable(self) -> None:
        for response in ((127, ""), (0, "not json")):
            with self.subTest(response=response):
                with patch.object(REPORT, "run", return_value=response):
                    reliability = REPORT.reliability_window()
                self.assertEqual(reliability["source"], "unavailable")
                self.assertEqual(reliability["crash_exits"], 0)
                self.assertEqual(reliability["automatic_restarts"], 0)
                self.assertEqual(
                    reliability["breakdown"],
                    {
                        "desktop_search": {
                            "crash_exits": 0,
                            "automatic_restarts": 0,
                        },
                        "other": {"crash_exits": 0, "automatic_restarts": 0},
                    },
                )

    def test_caps_pathological_event_volume(self) -> None:
        record = json.dumps({"MESSAGE_ID": REPORT.SYSTEMD_RESTART_MESSAGE_ID})
        with (
            patch.object(REPORT, "RELIABILITY_EVENT_LIMIT", 2),
            patch.object(REPORT, "run", return_value=(0, "\n".join([record] * 3))),
        ):
            reliability = REPORT.reliability_window()

        self.assertEqual(reliability["automatic_restarts"], 2)
        self.assertEqual(
            reliability["breakdown"]["other"]["automatic_restarts"], 2
        )
        self.assertTrue(reliability["truncated"])


class BuildStateTest(unittest.TestCase):
    def test_accepts_only_path_free_partial_hot_run_aggregates(self) -> None:
        report = {
            "schema_version": 2,
            "authority": "local_hot_run_filesystem_observation",
            "operation": "status",
            "mutation_performed": False,
            "completeness": "partial",
            "summary": {
                "state_count": 4,
                "in_use_count": None,
                "warm_count": None,
                "reclaimable_count": None,
                "quarantined_count": None,
                "unknown_count": None,
                "logical_bytes": None,
                "allocated_bytes": None,
                "reclaimable_allocated_bytes": None,
            },
            "states": [],
            "problems": ["permission_denied"],
        }
        with patch.object(REPORT, "run", return_value=(0, json.dumps(report))):
            observation = REPORT.glaeda_hot_run_observation(
                Path("/private/glaeda"), Path("/private/hot-run")
            )

        self.assertEqual(
            observation,
            {
                "source": "glaeda-hot-run-observation-v2",
                "completeness": "partial",
                "state_count": 4,
                "logical_bytes": None,
                "allocated_bytes": None,
                "reclaimable_count": None,
                "reclaimable_allocated_bytes": None,
                "problems": ["permission_denied"],
            },
        )
        self.assertNotIn("private", json.dumps(observation))

    def test_rejects_partial_hot_run_bytes_and_stale_schema(self) -> None:
        report = {
            "schema_version": 2,
            "authority": "local_hot_run_filesystem_observation",
            "operation": "status",
            "mutation_performed": False,
            "completeness": "partial",
            "summary": {
                "state_count": 1,
                "in_use_count": None,
                "warm_count": None,
                "reclaimable_count": None,
                "quarantined_count": None,
                "unknown_count": None,
                "logical_bytes": 1,
                "allocated_bytes": None,
                "reclaimable_allocated_bytes": None,
            },
            "states": [],
            "problems": ["permission_denied"],
        }
        with patch.object(REPORT, "run", return_value=(0, json.dumps(report))):
            self.assertIsNone(
                REPORT.glaeda_hot_run_observation(Path("/observer"), Path("/root"))
            )
        report["schema_version"] = 1
        report["summary"]["logical_bytes"] = None
        with patch.object(REPORT, "run", return_value=(0, json.dumps(report))):
            self.assertIsNone(
                REPORT.glaeda_hot_run_observation(Path("/observer"), Path("/root"))
            )

    def test_accepts_complete_hot_run_without_retaining_state_records(self) -> None:
        report = {
            "schema_version": 2,
            "authority": "local_hot_run_filesystem_observation",
            "operation": "status",
            "mutation_performed": False,
            "completeness": "complete",
            "summary": {
                "state_count": 1,
                "in_use_count": 0,
                "warm_count": 0,
                "reclaimable_count": 0,
                "quarantined_count": 0,
                "unknown_count": 1,
                "logical_bytes": 3,
                "allocated_bytes": 4_096,
                "reclaimable_allocated_bytes": 0,
            },
            "states": [{"state_id": "private-state-id"}],
            "problems": [],
        }
        with patch.object(REPORT, "run", return_value=(0, json.dumps(report))):
            observation = REPORT.glaeda_hot_run_observation(
                Path("/observer"), Path("/root")
            )

        self.assertIsNotNone(observation)
        self.assertNotIn("private-state-id", json.dumps(observation))
        assert observation is not None
        self.assertEqual(observation["allocated_bytes"], 4_096)

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

            with (
                patch.object(
                    REPORT, "active_glaeda_build_processes", return_value=2
                ),
                patch.object(
                    REPORT,
                    "glaeda_hot_run_observation",
                    return_value={"state_count": 4},
                ),
            ):
                state = REPORT.build_state(worktrees, cache)

        self.assertEqual(state["source"], "filesystem")
        self.assertEqual(state["target_count"], 2)
        self.assertEqual(state["active_build_processes"], 2)
        self.assertGreater(state["target_gib"], 0)
        self.assertGreater(state["glaeda_cache_gib"], 0)
        self.assertEqual(state["hot_run"], {"state_count": 4})
        self.assertNotIn(str(root), json.dumps(state))

    def test_summarizes_target_skew_without_paths(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            worktrees = [root / "glaeda", root / "worktree"]
            targets = [worktree / "target" for worktree in worktrees]
            for target in targets:
                target.mkdir(parents=True)
            cache = root / "cache"
            cache.mkdir()
            sizes = {
                targets[0]: 2 * REPORT.GIB,
                targets[1]: 4 * REPORT.GIB,
                cache: REPORT.GIB,
            }

            with (
                patch.object(
                    REPORT,
                    "apparent_directory_sizes",
                    side_effect=lambda paths, **_kwargs: {
                        path: sizes[path] for path in paths
                    },
                ),
                patch.object(
                    REPORT, "active_glaeda_build_processes", return_value=0
                ),
                patch.object(REPORT, "glaeda_hot_run_observation", return_value=None),
            ):
                state = REPORT.build_state(worktrees, cache)

        self.assertEqual(state["largest_target_gib"], 4.0)
        self.assertEqual(state["median_target_gib"], 3.0)
        self.assertNotIn(str(root), json.dumps(state))

    def test_marks_missing_worktree_inventory_unavailable(self) -> None:
        with (
            patch.object(REPORT, "glaeda_worktrees", return_value=None),
            patch.object(
                REPORT,
                "glaeda_hot_run_observation",
                return_value={"state_count": 4},
            ),
        ):
            state = REPORT.build_state()

        self.assertEqual(state["source"], "unavailable")
        self.assertIsNone(state["total_gib"])
        self.assertEqual(state["hot_run"], {"state_count": 4})


class ReportDeliveryTest(unittest.TestCase):
    def test_cross_origin_redirect_does_not_receive_bearer_token(self) -> None:
        destination_authorization: list[str | None] = []
        source_authorization: list[str | None] = []

        class Destination(http.server.BaseHTTPRequestHandler):
            def do_POST(self) -> None:
                destination_authorization.append(self.headers.get("Authorization"))
                self.send_response(204)
                self.end_headers()

            def log_message(self, _format: str, *_args: object) -> None:
                return

        destination = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Destination)
        destination_url = f"http://127.0.0.1:{destination.server_port}/capture"

        class Redirect(http.server.BaseHTTPRequestHandler):
            def do_POST(self) -> None:
                source_authorization.append(self.headers.get("Authorization"))
                self.send_response(302)
                self.send_header("Location", destination_url)
                self.end_headers()

            def log_message(self, _format: str, *_args: object) -> None:
                return

        source = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Redirect)
        threads = [
            threading.Thread(target=destination.serve_forever, daemon=True),
            threading.Thread(target=source.serve_forever, daemon=True),
        ]
        for thread in threads:
            thread.start()
        try:
            with self.assertRaisesRegex(RuntimeError, "redirects are refused"):
                REPORT.post_report(
                    {"host": "big-red"},
                    f"http://127.0.0.1:{source.server_port}/ingest",
                    "private-ingest-token",
                )
        finally:
            source.shutdown()
            destination.shutdown()
            source.server_close()
            destination.server_close()
            for thread in threads:
                thread.join(timeout=2)

        self.assertEqual(source_authorization, ["Bearer private-ingest-token"])
        self.assertEqual(destination_authorization, [])

    def test_https_downgrade_redirect_is_rejected_by_the_same_handler(self) -> None:
        request = REPORT.urllib.request.Request("https://example.invalid/ingest")
        self.assertIsNone(
            REPORT.RejectRedirects().redirect_request(
                request,
                None,
                302,
                "Found",
                {},
                "http://example.invalid/capture",
            )
        )

    def test_configured_send_is_quiet(self) -> None:
        report = {"host": "big-red"}
        output = io.StringIO()
        with (
            patch.object(REPORT, "build_report", return_value=report),
            patch.object(REPORT, "post_report") as post,
            patch.object(REPORT.sys, "argv", ["big-red-health-report.py"]),
            patch.dict(
                REPORT.os.environ,
                {
                    "MACHINE_HEALTH_INGEST_URL": "https://example.invalid/ingest",
                    "MACHINE_HEALTH_INGEST_SECRET": "private-ingest-token",
                },
                clear=True,
            ),
            contextlib.redirect_stdout(output),
        ):
            self.assertEqual(REPORT.main(), 0)

        self.assertEqual(output.getvalue(), "")
        post.assert_called_once_with(
            report,
            "https://example.invalid/ingest",
            "private-ingest-token",
        )

    def test_print_only_never_posts(self) -> None:
        output = io.StringIO()
        with (
            patch.object(REPORT, "build_report", return_value={"host": "big-red"}),
            patch.object(REPORT, "post_report") as post,
            patch.object(
                REPORT.sys,
                "argv",
                ["big-red-health-report.py", "--print-only"],
            ),
            patch.dict(REPORT.os.environ, {}, clear=True),
            contextlib.redirect_stdout(output),
        ):
            self.assertEqual(REPORT.main(), 0)

        self.assertIn('"host": "big-red"', output.getvalue())
        post.assert_not_called()

    def test_unconfigured_default_prints_locally(self) -> None:
        output = io.StringIO()
        with (
            patch.object(REPORT, "build_report", return_value={"host": "big-red"}),
            patch.object(REPORT, "post_report") as post,
            patch.object(REPORT.sys, "argv", ["big-red-health-report.py"]),
            patch.dict(REPORT.os.environ, {}, clear=True),
            contextlib.redirect_stdout(output),
        ):
            self.assertEqual(REPORT.main(), 0)

        self.assertIn('"host": "big-red"', output.getvalue())
        post.assert_not_called()


if __name__ == "__main__":
    unittest.main()
