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

        self.assertEqual(counts, (1, 350 * REPORT.MIB, 1, 0, 1))

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
                "MESSAGE": "private.service crashed",
            },
            {
                "MESSAGE_ID": REPORT.SYSTEMD_PROCESS_EXIT_MESSAGE_ID,
                "EXIT_CODE": "killed",
                "MESSAGE": "another-private.service was stopped",
            },
            {
                "MESSAGE_ID": REPORT.SYSTEMD_RESTART_MESSAGE_ID,
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
        self.assertEqual(reliability["crash_exits"], 1)
        self.assertEqual(reliability["automatic_restarts"], 1)
        self.assertFalse(reliability["truncated"])
        self.assertNotIn("private.service", json.dumps(reliability))

    def test_marks_missing_or_malformed_journal_data_unavailable(self) -> None:
        for response in ((127, ""), (0, "not json")):
            with self.subTest(response=response):
                with patch.object(REPORT, "run", return_value=response):
                    reliability = REPORT.reliability_window()
                self.assertEqual(reliability["source"], "unavailable")
                self.assertEqual(reliability["crash_exits"], 0)
                self.assertEqual(reliability["automatic_restarts"], 0)

    def test_caps_pathological_event_volume(self) -> None:
        record = json.dumps({"MESSAGE_ID": REPORT.SYSTEMD_RESTART_MESSAGE_ID})
        with (
            patch.object(REPORT, "RELIABILITY_EVENT_LIMIT", 2),
            patch.object(REPORT, "run", return_value=(0, "\n".join([record] * 3))),
        ):
            reliability = REPORT.reliability_window()

        self.assertEqual(reliability["automatic_restarts"], 2)
        self.assertTrue(reliability["truncated"])


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
