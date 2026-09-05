#!/usr/bin/env python3
"""Regression tests for the delegated peer-agent usage reporter."""

from __future__ import annotations

import datetime as dt
import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("agent-peer-report.py")
SPEC = importlib.util.spec_from_file_location("agent_peer_report", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
REPORT = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(REPORT)


NOW = dt.datetime(2026, 9, 5, 7, 23, tzinfo=dt.timezone.utc)


def peer_receipt(
    provider: str,
    model: str,
    settled_at: str,
    exit_code: int = 0,
    **tokens: object,
) -> dict[str, object]:
    receipt: dict[str, object] = {
        "schema": "big-red-agent-peer-usage/v1",
        "provider": provider,
        "model": model,
        "effort": "high",
        "mode": "work",
        "billing_class": "subscription",
        "actual_marginal_cost_usd": None,
        "started_at": "2026-09-05T05:58:00Z",
        "settled_at": settled_at,
        "wall_duration_ms": 120_000,
        "exit_code": exit_code,
        "provider_status": "ok",
        "usage_observed": True,
        "result_bytes": 512,
    }
    receipt.update(tokens)
    return receipt


def muse_receipt(settled_at: str, exit_code: int = 0, **fields: object) -> dict[str, object]:
    receipt: dict[str, object] = {
        "schema": "big-red-muse-peer-usage/v1",
        "provider": "opencode-zen",
        "model": "muse-spark",
        "effort": "provider-default",
        "mode": "run",
        "billing_class": "contributor-free",
        "actual_marginal_cost_usd": 0.0,
        "reported_cost_usd": 0.0125,
        "started_at": "2026-09-05T05:58:00Z",
        "settled_at": settled_at,
        "wall_duration_ms": 60_000,
        "exit_code": exit_code,
        "provider_status": "finish",
        "usage_observed": True,
        "step_count": 3,
        "input_tokens": 1000,
        "cached_input_tokens": 200,
        "cache_creation_input_tokens": 50,
        "output_tokens": 400,
        "reasoning_tokens": 100,
        "total_tokens": 1400,
        "result_bytes": 256,
    }
    receipt.update(fields)
    return receipt


def write_ledger(directory: str, name: str, rows: list[dict[str, object]]) -> Path:
    path = Path(directory) / name
    path.write_text(
        "".join(json.dumps(row, sort_keys=True) + "\n" for row in rows),
        encoding="utf-8",
    )
    path.chmod(0o600)
    return path


def collect(peer_rows, muse_rows, now=NOW, hours=24):
    with tempfile.TemporaryDirectory() as directory:
        peer = write_ledger(directory, "peer.jsonl", peer_rows)
        muse = write_ledger(directory, "muse.jsonl", muse_rows)
        return REPORT.collect_samples(now, hours, peer, muse)


class AgentPeerReportTest(unittest.TestCase):
    def test_claude_and_antigravity_stay_separate(self):
        claude = peer_receipt(
            "claude",
            "claude-opus-5",
            "2026-09-05T06:15:00Z",
            input_tokens=1000,
            cached_input_tokens=800,
            cache_creation_input_tokens=100,
            output_tokens=200,
            reasoning_tokens=None,
            total_tokens=1200,
            api_equivalent_estimate_usd=0.25,
        )
        gemini = peer_receipt(
            "antigravity",
            "gemini-3.7-flash-high",
            "2026-09-05T06:40:00Z",
            input_tokens=2000,
            cached_input_tokens=500,
            cache_creation_input_tokens=None,
            output_tokens=300,
            reasoning_tokens=150,
            total_tokens=2300,
        )
        samples, warnings = collect([claude, gemini], [])
        self.assertEqual(warnings, [])
        self.assertEqual(len(samples), 2)
        by_harness = {sample["harness"]: sample for sample in samples}
        claude_sample = by_harness["claude-code"]
        self.assertEqual(claude_sample["provider"], "anthropic")
        self.assertEqual(claude_sample["model"], "claude-opus-5")
        self.assertEqual(claude_sample["accounting_contract"], "big-red-agent-peer-usage/v1")
        self.assertEqual(claude_sample["input_tokens"], 1000)
        self.assertEqual(claude_sample["cached_input_tokens"], 800)
        # cache_creation maps to the neutral cache-write counter.
        self.assertEqual(claude_sample["cache_write_input_tokens"], 100)
        self.assertEqual(claude_sample["reasoning_tokens"], None)
        self.assertEqual(claude_sample["request_count"], 1)
        self.assertEqual(claude_sample["successful_request_count"], 1)
        self.assertEqual(claude_sample["api_equivalent_estimate_usd"], 0.25)
        gemini_sample = by_harness["antigravity"]
        self.assertEqual(gemini_sample["provider"], "google")
        self.assertEqual(gemini_sample["reasoning_tokens"], 150)
        self.assertIsNone(gemini_sample["api_equivalent_estimate_usd"])
        for sample in samples:
            self.assertEqual(sample["schema"], "agent-usage-sample/v1")
            self.assertEqual(sample["observed_at"], "2026-09-05T06:00:00Z")
            self.assertIsNone(sample["run_ref"])
            self.assertNotIn("actual_marginal_cost_usd", sample)
            # Cached input stays a separate counter; it is never folded into input.
            self.assertLessEqual(sample["cached_input_tokens"] or 0, sample["input_tokens"] or 0)

    def test_concurrent_receipts_count_runs_and_helper_success(self):
        rows = [
            peer_receipt("claude", "claude-opus-5", "2026-09-05T06:05:00Z", 0,
                         input_tokens=100, cached_input_tokens=10,
                         cache_creation_input_tokens=5, output_tokens=20,
                         reasoning_tokens=None, total_tokens=120),
            peer_receipt("claude", "claude-opus-5", "2026-09-05T06:35:00Z", 1,
                         input_tokens=200, cached_input_tokens=20,
                         cache_creation_input_tokens=6, output_tokens=30,
                         reasoning_tokens=None, total_tokens=230),
            peer_receipt("claude", "claude-opus-5", "2026-09-05T06:55:00Z", 0,
                         input_tokens=None, cached_input_tokens=None,
                         cache_creation_input_tokens=None, output_tokens=None,
                         reasoning_tokens=None, total_tokens=None,
                         api_equivalent_estimate_usd=0.1),
        ]
        samples, _ = collect(rows, [])
        self.assertEqual(len(samples), 1)
        sample = samples[0]
        self.assertEqual(sample["request_count"], 3)
        self.assertEqual(sample["successful_request_count"], 2)
        self.assertEqual(sample["input_tokens"], 300)
        self.assertEqual(sample["cached_input_tokens"], 30)
        self.assertEqual(sample["output_tokens"], 50)
        self.assertIsNone(sample["reasoning_tokens"])
        self.assertEqual(sample["api_equivalent_estimate_usd"], 0.1)

    def test_utc_hour_boundary_and_window(self):
        rows = [
            peer_receipt("claude", "claude-opus-5", "2026-09-05T06:00:00Z",
                         input_tokens=10, cached_input_tokens=1,
                         cache_creation_input_tokens=0, output_tokens=2,
                         reasoning_tokens=None, total_tokens=12),
            peer_receipt("claude", "claude-opus-5", "2026-09-05T07:00:00Z",
                         input_tokens=99, cached_input_tokens=9,
                         cache_creation_input_tokens=0, output_tokens=9,
                         reasoning_tokens=None, total_tokens=108),
            peer_receipt("claude", "claude-opus-5", "2026-09-04T06:59:00Z",
                         input_tokens=50, cached_input_tokens=5,
                         cache_creation_input_tokens=0, output_tokens=5,
                         reasoning_tokens=None, total_tokens=55),
        ]
        samples, _ = collect(rows, [], now=NOW, hours=24)
        # Exact hour start belongs to the new hour; the partial current hour
        # (07:00) and the out-of-window hour are excluded.
        self.assertEqual(len(samples), 1)
        self.assertEqual(samples[0]["observed_at"], "2026-09-05T06:00:00Z")
        self.assertEqual(samples[0]["input_tokens"], 10)

    def test_muse_receipt_maps_to_neutral_contract(self):
        samples, _ = collect([], [muse_receipt("2026-09-05T06:10:00Z")])
        self.assertEqual(len(samples), 1)
        sample = samples[0]
        self.assertEqual(sample["provider"], "opencode-zen")
        self.assertEqual(sample["harness"], "muse")
        self.assertEqual(sample["effort"], "provider-default")
        self.assertEqual(sample["accounting_contract"], "big-red-muse-peer-usage/v1")
        self.assertEqual(sample["input_tokens"], 1000)
        self.assertEqual(sample["cached_input_tokens"], 200)
        self.assertEqual(sample["cache_write_input_tokens"], 50)
        self.assertEqual(sample["agent_step_count"], 3)
        self.assertEqual(sample["request_count"], 1)
        self.assertEqual(sample["successful_request_count"], 1)
        # Muse's provider-reported cost is not an API-equivalent estimate.
        self.assertIsNone(sample["api_equivalent_estimate_usd"])
        self.assertNotIn("reported_cost_usd", sample)

    def test_unknown_provider_and_bad_rows_are_skipped(self):
        rows = [
            peer_receipt("future-provider", "model-x", "2026-09-05T06:10:00Z",
                         input_tokens=10, cached_input_tokens=1,
                         cache_creation_input_tokens=0, output_tokens=2,
                         reasoning_tokens=None, total_tokens=12),
            {"schema": "big-red-agent-peer-usage/v1", "provider": "claude"},
            peer_receipt("claude", "claude-opus-5", "not-a-timestamp",
                         input_tokens=10, cached_input_tokens=1,
                         cache_creation_input_tokens=0, output_tokens=2,
                         reasoning_tokens=None, total_tokens=12),
        ]
        samples, _ = collect(rows, [])
        self.assertEqual(samples, [])

    def test_corrupt_line_does_not_abort_the_hour(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "peer.jsonl"
            good = json.dumps(peer_receipt(
                "claude", "claude-opus-5", "2026-09-05T06:10:00Z",
                input_tokens=10, cached_input_tokens=1,
                cache_creation_input_tokens=0, output_tokens=2,
                reasoning_tokens=None, total_tokens=12,
            ))
            path.write_text(good + "\n{not json\n", encoding="utf-8")
            path.chmod(0o600)
            muse = write_ledger(directory, "muse.jsonl", [])
            samples, _ = REPORT.collect_samples(NOW, 24, path, muse)
        self.assertEqual(len(samples), 1)
        self.assertEqual(samples[0]["input_tokens"], 10)

    def test_missing_ledger_is_unavailable_not_zero(self):
        with tempfile.TemporaryDirectory() as directory:
            missing = Path(directory) / "absent.jsonl"
            muse = write_ledger(directory, "muse.jsonl", [muse_receipt("2026-09-05T06:10:00Z")])
            samples, warnings = REPORT.collect_samples(NOW, 24, missing, muse)
        self.assertEqual(len(samples), 1)
        self.assertEqual(len(warnings), 1)
        self.assertIn("unavailable", warnings[0])
        with tempfile.TemporaryDirectory() as directory:
            samples, warnings = REPORT.collect_samples(
                NOW, 24, Path(directory) / "a.jsonl", Path(directory) / "b.jsonl"
            )
        self.assertEqual(samples, [])
        self.assertEqual(len(warnings), 2)

    def test_untrusted_ledger_fails_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            path = write_ledger(directory, "peer.jsonl", [
                peer_receipt("claude", "claude-opus-5", "2026-09-05T06:10:00Z",
                             input_tokens=1, cached_input_tokens=0,
                             cache_creation_input_tokens=0, output_tokens=1,
                             reasoning_tokens=None, total_tokens=2),
            ])
            path.chmod(0o644)
            with self.assertRaises(FileNotFoundError):
                REPORT.collect_samples(NOW, 24, path, None)

    def test_symlink_ledger_is_refused(self):
        with tempfile.TemporaryDirectory() as directory:
            target = write_ledger(directory, "real.jsonl", [])
            link = Path(directory) / "link.jsonl"
            os.symlink(target, link)
            with self.assertRaises(FileNotFoundError):
                REPORT.collect_samples(NOW, 24, link, None)

    def test_envelope_shape_and_order(self):
        rows = [
            peer_receipt("antigravity", "gemini-3.7-flash-high", "2026-09-05T05:10:00Z",
                         input_tokens=5, cached_input_tokens=1,
                         cache_creation_input_tokens=None, output_tokens=1,
                         reasoning_tokens=1, total_tokens=6),
            muse_receipt("2026-09-05T06:10:00Z"),
        ]
        with tempfile.TemporaryDirectory() as directory:
            peer = write_ledger(directory, "peer.jsonl", rows[:1])
            muse = write_ledger(directory, "muse.jsonl", rows[1:])
            payload, _ = REPORT.report("big-red", NOW, 24, peer, muse)
        self.assertEqual(payload["schema"], "agent-telemetry-report/v1")
        self.assertEqual(payload["source"], "big-red")
        self.assertEqual(payload["quota_samples"], [])
        observed = [sample["observed_at"] for sample in payload["usage_samples"]]
        self.assertEqual(observed, sorted(observed))
        self.assertEqual(len(payload["usage_samples"]), 2)


if __name__ == "__main__":
    unittest.main()
