#!/usr/bin/env python3
"""Regression tests for the direct agent usage reporter."""

from __future__ import annotations

import datetime as dt
import importlib.util
import json
import os
import sqlite3
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("agent-direct-usage-report.py")
SPEC = importlib.util.spec_from_file_location("agent_direct_usage_report", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
REPORT = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(REPORT)


NOW = dt.datetime(2026, 9, 11, 7, 23, tzinfo=dt.timezone.utc)
SECRET_TEXT = "PROMPT-SENTINEL-do-not-emit"


def ms(value: str) -> int:
    return int(dt.datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp() * 1000)


def claude_line(
    message_id: str,
    timestamp: str,
    model: str = "claude-opus-5",
    request_id: str = "req_1",
    entrypoint: str = "claude-desktop",
    **usage: int,
) -> str:
    return json.dumps(
        {
            "type": "assistant",
            "timestamp": timestamp,
            "requestId": request_id,
            "entrypoint": entrypoint,
            "sessionId": "session-secret",
            "cwd": "/Users/someone/private-repo",
            "message": {
                "id": message_id,
                "model": model,
                "content": [{"type": "text", "text": SECRET_TEXT}],
                "usage": {
                    "input_tokens": usage.get("direct", 10),
                    "cache_read_input_tokens": usage.get("read", 1000),
                    "cache_creation_input_tokens": usage.get("write", 100),
                    "output_tokens": usage.get("output", 50),
                },
            },
        }
    )


class Fixture:
    def __init__(self) -> None:
        self.directory = tempfile.TemporaryDirectory()
        self.root = Path(self.directory.name)
        self.claude = self.root / "claude" / "projects"
        self.claude.mkdir(parents=True)
        self.opencode = self.root / "opencode.db"
        self.t3code = self.root / "state.sqlite"
        self.quota = self.root / "claudeAgent.json"

    def close(self) -> None:
        self.directory.cleanup()

    def transcript(self, name: str, *lines: str) -> Path:
        path = self.claude / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        os.utime(path, (NOW.timestamp(), NOW.timestamp()))
        return path

    def opencode_db(self, sessions: list[tuple[str, str | None]], messages: list[tuple[str, dict]]) -> None:
        connection = sqlite3.connect(self.opencode)
        connection.execute("CREATE TABLE session (id TEXT PRIMARY KEY, parent_id TEXT, title TEXT)")
        connection.execute(
            "CREATE TABLE message (id TEXT PRIMARY KEY, session_id TEXT, time_created INTEGER,"
            " time_updated INTEGER, data TEXT)"
        )
        for session_id, parent in sessions:
            connection.execute("INSERT INTO session VALUES (?, ?, ?)", (session_id, parent, SECRET_TEXT))
        for index, (session_id, data) in enumerate(messages):
            completed = data.get("time", {}).get("completed")
            created = data.get("time", {}).get("created", completed or ms("2026-09-11T06:00:00Z"))
            connection.execute(
                "INSERT INTO message VALUES (?, ?, ?, ?, ?)",
                (f"msg_{index}", session_id, created, completed or created, json.dumps(data)),
            )
        connection.commit()
        connection.close()

    def t3code_db(self, *session_ids: str) -> None:
        connection = sqlite3.connect(self.t3code)
        connection.execute(
            "CREATE TABLE provider_session_runtime (thread_id TEXT PRIMARY KEY, provider_name TEXT,"
            " resume_cursor_json TEXT)"
        )
        for index, session_id in enumerate(session_ids):
            connection.execute(
                "INSERT INTO provider_session_runtime VALUES (?, 'opencode', ?)",
                (f"thread-{index}", json.dumps({"schemaVersion": 1, "sessionId": session_id})),
            )
        connection.commit()
        connection.close()


def opencode_message(completed: str | None, model: str = "muse-spark-1.3", provider: str = "opencode", **tokens: int) -> dict:
    return {
        "role": "assistant",
        "providerID": provider,
        "modelID": model,
        "path": {"cwd": "/Users/someone/private-repo"},
        "time": {"created": ms("2026-09-11T05:59:00Z"), **({"completed": ms(completed)} if completed else {})},
        "cost": tokens.get("cost_micros", 0) / 1_000_000,
        "tokens": {
            "input": tokens.get("input", 20),
            "output": tokens.get("output", 5),
            "reasoning": tokens.get("reasoning", 7),
            "cache": {"read": tokens.get("read", 300), "write": tokens.get("write", 0)},
        },
    }


class ReporterTest(unittest.TestCase):
    def setUp(self) -> None:
        self.fixture = Fixture()

    def tearDown(self) -> None:
        self.fixture.close()

    def run_report(self, hours: int = 3, **overrides: object) -> dict:
        arguments = {
            "claude_root": self.fixture.claude,
            "opencode_db": self.fixture.opencode,
            "t3code_state": self.fixture.t3code,
            "t3code_claude_cache": self.fixture.quota,
        }
        arguments.update(overrides)
        payload, _ = REPORT.report(NOW, hours, **arguments)
        return payload

    def test_claude_deduplicates_repeats_and_forks_and_maps_logical_input(self) -> None:
        self.fixture.transcript(
            "project/a.jsonl",
            claude_line("msg_a", "2026-09-11T06:10:00Z"),
            claude_line("msg_a", "2026-09-11T06:10:01Z"),
            claude_line("msg_b", "2026-09-11T06:20:00Z", request_id="req_2", output=70),
        )
        self.fixture.transcript("project/fork.jsonl", claude_line("msg_a", "2026-09-11T06:10:00Z"))
        payload = self.run_report(opencode_db=None)
        [sample] = payload["usage_samples"]
        self.assertEqual(sample["harness"], "claude-code")
        self.assertEqual(sample["provider"], "anthropic")
        self.assertEqual(sample["observed_at"], "2026-09-11T06:00:00Z")
        self.assertEqual(sample["request_count"], 2)
        self.assertEqual(sample["input_tokens"], 2 * (10 + 1000 + 100))
        self.assertEqual(sample["cached_input_tokens"], 2000)
        self.assertEqual(sample["cache_write_input_tokens"], 200)
        self.assertEqual(sample["output_tokens"], 120)
        self.assertIsNone(sample["reasoning_tokens"])
        self.assertEqual(sample["total_tokens"], sample["input_tokens"] + sample["output_tokens"])

    def test_claude_dedupes_before_the_window_and_skips_current_hour(self) -> None:
        self.fixture.transcript(
            "project/a.jsonl",
            claude_line("msg_old", "2026-09-11T03:59:59Z"),
            claude_line("msg_old", "2026-09-11T04:00:01Z"),
            claude_line("msg_now", "2026-09-11T07:05:00Z", request_id="req_now"),
            claude_line("msg_sdk", "2026-09-11T05:00:00Z", request_id="req_sdk", entrypoint="sdk-cli"),
            claude_line("msg_syn", "2026-09-11T05:00:00Z", model="<synthetic>", request_id="req_syn"),
        )
        payload = self.run_report(opencode_db=None)
        self.assertEqual(
            [(s["harness"], s["observed_at"], s["request_count"]) for s in payload["usage_samples"]],
            [("claude-agent-sdk", "2026-09-11T05:00:00Z", 1)],
        )

    def test_claude_skips_files_untouched_since_the_window(self) -> None:
        path = self.fixture.transcript("project/stale.jsonl", claude_line("msg_a", "2026-09-11T06:10:00Z"))
        stale = (NOW - dt.timedelta(hours=5)).timestamp()
        os.utime(path, (stale, stale))
        self.assertEqual(self.run_report(opencode_db=None)["usage_samples"], [])

    def test_opencode_counts_finished_messages_and_attributes_t3code(self) -> None:
        self.fixture.opencode_db(
            [("ses_cli", None), ("ses_t3", None), ("ses_t3_child", "ses_t3")],
            [
                ("ses_cli", opencode_message("2026-09-11T06:05:00Z", cost_micros=1500)),
                ("ses_cli", opencode_message(None)),
                ("ses_cli", opencode_message("2026-09-11T07:01:00Z")),
                ("ses_t3_child", opencode_message("2026-09-11T05:30:00Z", provider="opencode-go", model="muse-spark-1.3-contributor")),
                ("ses_cli", {"role": "user", "time": {"created": ms("2026-09-11T06:00:00Z")}}),
            ],
        )
        self.fixture.t3code_db("ses_t3")
        payload = self.run_report(claude_root=None)
        samples = {s["harness"]: s for s in payload["usage_samples"]}
        self.assertEqual(set(samples), {"opencode", "t3code"})
        direct = samples["opencode"]
        self.assertEqual(direct["provider"], "opencode-zen")
        self.assertEqual(direct["observed_at"], "2026-09-11T06:00:00Z")
        self.assertEqual(direct["request_count"], 1)
        self.assertEqual(direct["input_tokens"], 320)
        self.assertEqual(direct["cached_input_tokens"], 300)
        self.assertEqual(direct["output_tokens"], 12)
        self.assertEqual(direct["reasoning_tokens"], 7)
        self.assertEqual(direct["total_tokens"], 332)
        self.assertEqual(direct["api_equivalent_estimate_usd"], 0.0015)
        self.assertEqual(samples["t3code"]["provider"], "opencode-go")
        self.assertEqual(samples["t3code"]["observed_at"], "2026-09-11T05:00:00Z")

    def test_missing_t3code_state_leaves_opencode_attribution(self) -> None:
        self.fixture.opencode_db([("ses", None)], [("ses", opencode_message("2026-09-11T06:05:00Z"))])
        payload = self.run_report(claude_root=None)
        self.assertEqual([s["harness"] for s in payload["usage_samples"]], ["opencode"])

    def test_claude_quota_uses_fresh_t3code_windows_only(self) -> None:
        windows = [
            {"id": "five_hour", "windowDurationMins": 300, "usedPercent": 57, "resetsAt": "2026-09-11T09:40:00.138Z"},
            {"id": "seven_day", "windowDurationMins": 10080, "usedPercent": 116, "resetsAt": "2026-09-17T09:00:00Z"},
        ]
        document = {"auth": {"email": "person@example.com"}, "usageLimits": {"checkedAt": "2026-09-11T07:11:31.548Z", "windows": windows}}
        self.fixture.quota.write_text(json.dumps(document), encoding="utf-8")
        payload = self.run_report(claude_root=None, opencode_db=None)
        self.assertEqual(
            [(q["limit_id"], q["percent_value"], q["window_minutes"]) for q in payload["quota_samples"]],
            [("five_hour", 57.0, 300)],
        )
        self.assertEqual(payload["quota_samples"][0]["sample_id"], "t3code-20260911T071131Z")
        self.assertNotIn("example.com", json.dumps(payload))

        document["usageLimits"]["checkedAt"] = "2026-09-08T07:00:00Z"
        self.fixture.quota.write_text(json.dumps(document), encoding="utf-8")
        self.assertEqual(self.run_report(claude_root=None, opencode_db=None)["quota_samples"], [])

    def test_payload_carries_no_content_paths_or_session_ids(self) -> None:
        self.fixture.transcript("project/a.jsonl", claude_line("msg_a", "2026-09-11T06:10:00Z"))
        self.fixture.opencode_db([("ses_private", None)], [("ses_private", opencode_message("2026-09-11T06:05:00Z"))])
        encoded = json.dumps(self.run_report())
        for forbidden in (SECRET_TEXT, "private-repo", "session-secret", "ses_private", "msg_a", "req_1"):
            self.assertNotIn(forbidden, encoded)

    def test_chunks_stay_under_the_ingest_limits(self) -> None:
        usage = [{"sample_id": str(index)} for index in range(901)]
        posts = REPORT.chunks({"usage_samples": usage, "quota_samples": [{"q": 1}]})
        self.assertEqual([len(post["usage_samples"]) for post in posts], [400, 400, 101])
        self.assertEqual([len(post["quota_samples"]) for post in posts], [1, 0, 0])
        self.assertEqual(REPORT.chunks({"usage_samples": [], "quota_samples": []}), [])
        self.assertEqual(len(REPORT.chunks({"usage_samples": [], "quota_samples": [{"q": 1}]})), 1)

    def test_long_model_names_get_a_stable_bounded_sample_id(self) -> None:
        buckets = REPORT.Buckets()
        model = "m" * 127
        buckets.add(NOW, "anthropic", "claude-code", model, REPORT.CLAUDE_CONTRACT, {"input_tokens": 1})
        [sample] = buckets.samples()
        self.assertLessEqual(len(sample["sample_id"]), 128)
        self.assertEqual(sample["sample_id"], buckets.samples()[0]["sample_id"])


if __name__ == "__main__":
    unittest.main()
