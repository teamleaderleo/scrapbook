#!/usr/bin/env python3
"""Regression tests for the portable Codex token reporter."""

from __future__ import annotations

import datetime as dt
import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SCRIPT = Path(__file__).with_name("codex-token-report.py")
SPEC = importlib.util.spec_from_file_location("codex_token_report", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
REPORT = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(REPORT)


def usage(input_tokens: int, cached_input_tokens: int) -> dict[str, int]:
    return {
        "input_tokens": input_tokens,
        "cached_input_tokens": cached_input_tokens,
        "cache_write_input_tokens": 0,
        "output_tokens": 20,
        "reasoning_output_tokens": 7,
        "total_tokens": input_tokens + 25,
    }


def rate_limits(short_used: float, weekly_used: float) -> dict[str, object]:
    return {
        "limit_id": "codex",
        "primary": {
            "used_percent": short_used,
            "window_minutes": 300,
            "resets_at": 1_788_200_000,
        },
        "secondary": {
            "used_percent": weekly_used,
            "window_minutes": 10_080,
            "resets_at": 1_788_700_000,
        },
    }


class CodexTokenReportTest(unittest.TestCase):
    def test_groups_complete_hours_and_keeps_zero_activity_coverage(self) -> None:
        now = dt.datetime(2026, 8, 29, 7, 23, tzinfo=dt.timezone.utc)
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            session = directory / "route.jsonl"
            records = [
                {
                    "timestamp": "2026-08-29T05:00:00Z",
                    "type": "session_meta",
                    "payload": {"id": "route-one"},
                },
                {
                    "timestamp": "2026-08-29T05:15:00Z",
                    "payload": {
                        "type": "token_count",
                        "info": {"last_token_usage": usage(100, 80)},
                    },
                },
                {
                    "timestamp": "2026-08-29T07:01:00Z",
                    "payload": {
                        "type": "token_count",
                        "info": {"last_token_usage": usage(999, 999)},
                    },
                },
            ]
            session.write_text(
                "\n".join(json.dumps(record) for record in records), encoding="utf-8"
            )
            os.utime(session, (now.timestamp(), now.timestamp()))

            payload = REPORT.report(
                "macbook-air", now, 2, directory, fingerprint_key=b"test-key"
            )

        self.assertEqual(payload["source"], "macbook-air")
        self.assertEqual(len(payload["windows"]), 2)
        self.assertEqual(payload["windows"][0]["input_tokens"], 100)
        self.assertEqual(payload["windows"][0]["cached_input_tokens"], 80)
        self.assertEqual(payload["windows"][0]["active_routes"], 1)
        self.assertTrue(payload["windows"][0]["fingerprints_complete"])
        self.assertEqual(len(payload["windows"][0]["session_fingerprints"]), 1)
        self.assertEqual(payload["windows"][1]["total_tokens"], 0)
        self.assertEqual(payload["quota_samples"], [])

    def test_collects_only_quota_transitions(self) -> None:
        now = dt.datetime(2026, 8, 29, 7, 23, tzinfo=dt.timezone.utc)
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            session = directory / "quota.jsonl"
            records = [
                {
                    "timestamp": "2026-08-29T06:00:00Z",
                    "type": "session_meta",
                    "payload": {"id": "quota-route"},
                },
                {
                    "timestamp": "2026-08-29T06:10:00Z",
                    "payload": {
                        "type": "token_count",
                        "info": {"last_token_usage": usage(100, 95)},
                        "rate_limits": rate_limits(25, 50),
                    },
                },
                {
                    "timestamp": "2026-08-29T06:20:00Z",
                    "payload": {
                        "type": "token_count",
                        "info": {"last_token_usage": usage(100, 95)},
                        "rate_limits": rate_limits(25, 50),
                    },
                },
                {
                    "timestamp": "2026-08-29T06:30:00Z",
                    "payload": {
                        "type": "token_count",
                        "info": {"last_token_usage": usage(100, 95)},
                        "rate_limits": rate_limits(26, 51),
                    },
                },
            ]
            session.write_text(
                "\n".join(json.dumps(record) for record in records), encoding="utf-8"
            )
            os.utime(session, (now.timestamp(), now.timestamp()))

            payload = REPORT.report(
                "big-red", now, 1, directory, fingerprint_key=b"test-key"
            )

        weekly = [
            sample
            for sample in payload["quota_samples"]
            if sample["window_minutes"] == 10_080
        ]
        self.assertEqual([sample["used_percent"] for sample in weekly], [50.0, 51.0])
        self.assertEqual(
            [sample["observed_at"] for sample in weekly],
            ["2026-08-29T06:10:00Z", "2026-08-29T06:30:00Z"],
        )
        self.assertTrue(all(sample["limit_id"] == "codex" for sample in weekly))
        self.assertTrue(all(sample["resets_at"] is not None for sample in weekly))

    def test_excludes_dense_history_replay_at_fork_start(self) -> None:
        now = dt.datetime(2026, 8, 29, 7, 23, tzinfo=dt.timezone.utc)
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            session = directory / "fork.jsonl"
            records = [
                {
                    "timestamp": "2026-08-29T06:15:00.000Z",
                    "type": "session_meta",
                    "payload": {"id": "fork", "forked_from_id": "parent"},
                },
                {
                    "timestamp": "2026-08-29T06:15:00.001Z",
                    "payload": {
                        "type": "token_count",
                        "info": {"last_token_usage": usage(100, 80)},
                    },
                },
                {
                    "timestamp": "2026-08-29T06:15:00.002Z",
                    "payload": {
                        "type": "token_count",
                        "info": {"last_token_usage": usage(100, 80)},
                    },
                },
                {
                    "timestamp": "2026-08-29T06:15:08Z",
                    "payload": {
                        "type": "token_count",
                        "info": {"last_token_usage": usage(200, 160)},
                    },
                },
            ]
            session.write_text(
                "\n".join(json.dumps(record) for record in records), encoding="utf-8"
            )
            os.utime(session, (now.timestamp(), now.timestamp()))

            window = REPORT.collect_windows(
                now, 1, directory, fingerprint_key=b"test-key"
            )[0]

        self.assertEqual(window["input_tokens"], 200)
        self.assertEqual(window["model_calls"], 1)
        self.assertEqual(window["active_routes"], 1)
        self.assertTrue(window["fingerprints_complete"])

    def test_rejects_missing_source_and_unsafe_ingest_url(self) -> None:
        now = dt.datetime(2026, 8, 29, 7, 23, tzinfo=dt.timezone.utc)
        with self.assertRaises(FileNotFoundError):
            REPORT.collect_windows(now, 1, Path("/definitely/not/present"))
        with self.assertRaises(ValueError):
            REPORT.validate_ingest_url("http://example.com/ingest")
        self.assertEqual(
            REPORT.validate_ingest_url("http://127.0.0.1:3000/ingest"),
            "http://127.0.0.1:3000/ingest",
        )

    def test_loads_a_private_owned_credential_file(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            path = Path(temporary_directory) / "credentials.json"
            path.write_text(
                json.dumps(
                    {
                        "ingest_url": "https://example.com/ingest",
                        "ingest_secret": "secret-value",
                    }
                ),
                encoding="utf-8",
            )
            path.chmod(0o600)
            with mock.patch.dict(os.environ, {}, clear=True):
                credentials = REPORT.load_credentials(path)

        self.assertEqual(credentials, ("https://example.com/ingest", "secret-value"))

    def test_rejects_ambiguous_or_exposed_credentials(self) -> None:
        with mock.patch.dict(
            os.environ,
            {"CODEX_TOKEN_INGEST_URL": "https://example.com/ingest"},
            clear=True,
        ):
            with self.assertRaises(ValueError):
                REPORT.load_credentials(None)

        with tempfile.TemporaryDirectory() as temporary_directory:
            path = Path(temporary_directory) / "credentials.json"
            path.write_text(
                json.dumps(
                    {
                        "ingest_url": "https://example.com/ingest",
                        "ingest_secret": "secret-value",
                    }
                ),
                encoding="utf-8",
            )
            path.chmod(0o644)
            with mock.patch.dict(os.environ, {}, clear=True):
                with self.assertRaises(ValueError):
                    REPORT.load_credentials(path)

            path.chmod(0o600)
            link = Path(temporary_directory) / "credentials-link.json"
            link.symlink_to(path)
            with mock.patch.dict(os.environ, {}, clear=True):
                with self.assertRaises(ValueError):
                    REPORT.load_credentials(link)

            hard_link = Path(temporary_directory) / "credentials-hard-link.json"
            os.link(path, hard_link)
            with mock.patch.dict(os.environ, {}, clear=True):
                with self.assertRaises(ValueError):
                    REPORT.load_credentials(path)

    def test_resumes_from_the_last_successful_complete_hour(self) -> None:
        now = dt.datetime(2026, 8, 29, 7, 23, tzinfo=dt.timezone.utc)
        with tempfile.TemporaryDirectory() as temporary_directory:
            state_file = Path(temporary_directory) / "state.json"
            REPORT.save_success_state(
                dt.datetime(2026, 8, 29, 4, 15, tzinfo=dt.timezone.utc),
                state_file,
            )

            self.assertEqual(REPORT.hours_since_success(now, state_file), 3)
            state = json.loads(state_file.read_text(encoding="utf-8"))

        self.assertEqual(state["last_window_ended_at"], "2026-08-29T04:00:00Z")
        self.assertEqual(state["quota_state_version"], 1)

    def test_old_state_triggers_one_time_quota_backfill(self) -> None:
        now = dt.datetime(2026, 8, 29, 7, 23, tzinfo=dt.timezone.utc)
        with tempfile.TemporaryDirectory() as temporary_directory:
            state_file = Path(temporary_directory) / "state.json"
            state_file.write_text(
                json.dumps({"last_window_ended_at": "2026-08-29T06:00:00Z"}),
                encoding="utf-8",
            )

            self.assertEqual(REPORT.hours_since_success(now, state_file), 720)


if __name__ == "__main__":
    unittest.main()
