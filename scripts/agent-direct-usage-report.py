#!/usr/bin/env python3
"""Collect complete-hour direct agent usage on Air Blue for machine-health.

Reads the local records that interactive agent tools already keep:

  ~/.claude/projects/**/*.jsonl                (Claude Code transcripts)
  ~/.local/share/opencode/opencode.db          (opencode message ledger)
  ~/.t3/userdata/state.sqlite                  (t3code thread -> opencode session)
  ~/.t3/caches/claudeAgent.json                (t3code's Claude usage-limit probe)

and emits the existing ``agent-telemetry-report/v1`` envelope: one aggregate
``agent-usage-sample/v1`` row per complete UTC hour and provider/harness/model,
plus the latest Claude subscription window percentages as
``provider-quota-sample/v1`` rows. Only counters, model identifiers, and quota
percentages leave the machine: no prompt, response, tool output, title, path,
session or message ID, account identity, or credential.

t3code is not a separate token source. Its own usage scanner rereads the Codex
and Claude transcripts, so counting it would double-count. Instead, opencode
sessions that t3code started are attributed to the ``t3code`` harness, and
every other opencode session stays ``opencode``. Codex usage and quota stay
with codex-token-report.py.

Token semantics match the delegated peer lane: input is the logical input
total (uncached input + cache reads + cache writes), cached input is the cache
read subset, cache writes stay a separate diagnostic, output includes
reasoning, and reasoning is a diagnostic subset. opencode stores output and
reasoning as disjoint counters, so they are added before emission. opencode's
per-message cost is an API-equivalent estimate, never a bill.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import importlib.util
import json
import math
import os
import sqlite3
import sys
from pathlib import Path
from typing import Any, Iterator


PEER_REPORTER = Path(__file__).with_name("agent-peer-report.py")
_SPEC = importlib.util.spec_from_file_location("agent_peer_report", PEER_REPORTER)
if _SPEC is None or _SPEC.loader is None:
    raise SystemExit(f"agent-peer-report.py must be installed beside {Path(__file__).name}")
peer = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(peer)

CLAUDE_CONTRACT = "claude-code-transcript-usage/v1"
OPENCODE_CONTRACT = "opencode-message-usage/v1"
QUOTA_CONTRACT = "t3code-claude-usage-limits/v1"
MAX_SAMPLES_PER_POST = 400
MAX_QUOTA_AGE = dt.timedelta(hours=48)
MAX_T3CODE_CACHE_BYTES = 1024 * 1024
MAX_TRANSCRIPT_LINE_BYTES = 8 * 1024 * 1024
OPENCODE_PROVIDERS = {"opencode": "opencode-zen"}

COUNTER_FIELDS = (
    "input_tokens",
    "cached_input_tokens",
    "cache_write_input_tokens",
    "reasoning_tokens",
    "output_tokens",
    "total_tokens",
)


def epoch_ms(value: dt.datetime) -> int:
    return int(value.timestamp() * 1000)


def from_epoch_ms(value: object) -> dt.datetime | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    if not math.isfinite(float(value)):
        return None
    try:
        return dt.datetime.fromtimestamp(float(value) / 1000, dt.timezone.utc)
    except (OverflowError, OSError, ValueError):
        return None


class Buckets:
    """Complete-hour aggregates keyed by hour, provider, harness, model."""

    def __init__(self) -> None:
        self.rows: dict[tuple[str, str, str, str, str], dict[str, Any]] = {}

    def add(
        self,
        at: dt.datetime,
        provider: str,
        harness: str,
        model: str,
        contract: str,
        counters: dict[str, int | None],
        estimate_usd: float | None = None,
    ) -> None:
        hour = peer.iso_timestamp(peer.complete_hour(at))
        key = (hour, provider, harness, model, contract)
        row = self.rows.get(key)
        if row is None:
            row = {
                "requests": 0,
                "estimate_usd": None,
                **{field: None for field in COUNTER_FIELDS},
            }
            self.rows[key] = row
        row["requests"] += 1
        for field in COUNTER_FIELDS:
            value = counters.get(field)
            if value is not None:
                row[field] = (row[field] or 0) + value
        if estimate_usd is not None:
            row["estimate_usd"] = round((row["estimate_usd"] or 0.0) + estimate_usd, 8)

    def samples(self) -> list[dict[str, Any]]:
        samples: list[dict[str, Any]] = []
        for key in sorted(self.rows):
            hour, provider, harness, model, contract = key
            row = self.rows[key]
            stamp = peer.hour_stamp(peer.utc_timestamp(hour))
            sample_id = f"direct-{stamp}-{model}"
            if len(sample_id) > 128 or not peer.IDENTITY_PATTERN.fullmatch(sample_id):
                digest = hashlib.sha256(model.encode("utf-8")).hexdigest()[:16]
                sample_id = f"direct-{stamp}-{digest}"
            samples.append(
                {
                    "schema": "agent-usage-sample/v1",
                    "sample_id": sample_id,
                    "observed_at": hour,
                    "provider": provider,
                    "harness": harness,
                    "model": model,
                    "effort": None,
                    "accounting_contract": contract,
                    "run_ref": None,
                    **{field: row[field] for field in COUNTER_FIELDS},
                    "request_count": row["requests"],
                    "successful_request_count": None,
                    "api_equivalent_estimate_usd": row["estimate_usd"],
                    "turn_count": None,
                    "agent_step_count": None,
                }
            )
        return samples


def transcript_files(root: Path, modified_since: dt.datetime) -> list[Path]:
    """Transcripts touched since the window began, in a stable order.

    A message inside the window can only live in a file written during the
    window, so older files are skipped without being opened. Symlinks are
    never followed.
    """
    cutoff = modified_since.timestamp()
    files: list[Path] = []
    for directory, subdirectories, names in os.walk(root, followlinks=False):
        subdirectories.sort()
        for name in sorted(names):
            if not name.endswith(".jsonl"):
                continue
            path = Path(directory) / name
            try:
                metadata = path.lstat()
            except OSError:
                continue
            if path.is_symlink() or not path.is_file():
                continue
            if metadata.st_mtime >= cutoff:
                files.append(path)
    return files


def transcript_lines(path: Path) -> Iterator[bytes]:
    try:
        with path.open("rb") as stream:
            for line in stream:
                if len(line) <= MAX_TRANSCRIPT_LINE_BYTES:
                    yield line
    except OSError:
        return


def collect_claude(
    root: Path,
    window_start: dt.datetime,
    window_end: dt.datetime,
    buckets: Buckets,
) -> int:
    """Add Claude Code requests; return the number of counted requests.

    Claude Code writes one line per content block and repeats the same
    message usage on each, and forked sessions copy earlier lines. Requests
    are deduplicated globally by message and request ID before the window
    check, and the first copy wins.
    """
    seen: set[tuple[str, str]] = set()
    counted = 0
    for path in transcript_files(root, window_start):
        for line in transcript_lines(path):
            if b'"usage"' not in line or b'"assistant"' not in line:
                continue
            try:
                entry = json.loads(line)
            except (json.JSONDecodeError, UnicodeDecodeError):
                continue
            if not isinstance(entry, dict) or entry.get("type") != "assistant":
                continue
            message = entry.get("message")
            if not isinstance(message, dict):
                continue
            usage = message.get("usage")
            message_id = message.get("id")
            if not isinstance(usage, dict) or not isinstance(message_id, str):
                continue
            request_id = entry.get("requestId")
            key = (message_id, request_id if isinstance(request_id, str) else "")
            if key in seen:
                continue
            seen.add(key)
            model = peer.valid_identity(message.get("model"))
            if model is None:
                continue
            at = peer.utc_timestamp(entry.get("timestamp"))
            if at is None or not (window_start <= at < window_end):
                continue
            direct = peer.counter(usage.get("input_tokens"))
            cache_read = peer.counter(usage.get("cache_read_input_tokens"))
            cache_write = peer.counter(usage.get("cache_creation_input_tokens"))
            output = peer.counter(usage.get("output_tokens"))
            parts = [value for value in (direct, cache_read, cache_write) if value is not None]
            input_total = sum(parts) if parts else None
            entrypoint = entry.get("entrypoint")
            harness = (
                "claude-agent-sdk"
                if isinstance(entrypoint, str) and entrypoint.startswith("sdk")
                else "claude-code"
            )
            buckets.add(
                at,
                "anthropic",
                harness,
                model,
                CLAUDE_CONTRACT,
                {
                    "input_tokens": input_total,
                    "cached_input_tokens": cache_read,
                    "cache_write_input_tokens": cache_write,
                    "reasoning_tokens": None,
                    "output_tokens": output,
                    "total_tokens": (
                        input_total + output
                        if input_total is not None and output is not None
                        else None
                    ),
                },
            )
            counted += 1
    return counted


def read_only_sqlite(path: Path) -> sqlite3.Connection:
    """Open a live SQLite database without writing to it.

    ``mode=ro`` still reads the write-ahead log, so recently committed
    messages are visible; ``immutable=1`` would silently miss them.
    """
    connection = sqlite3.connect(f"{path.resolve().as_uri()}?mode=ro", uri=True, timeout=5)
    connection.execute("PRAGMA query_only = ON")
    return connection


def t3code_opencode_sessions(state_db: Path) -> set[str]:
    """opencode session IDs that a t3code thread started."""
    if not state_db.is_file():
        return set()
    sessions: set[str] = set()
    try:
        connection = read_only_sqlite(state_db)
        try:
            rows = connection.execute(
                "SELECT resume_cursor_json FROM provider_session_runtime"
                " WHERE provider_name = 'opencode'"
            ).fetchall()
        finally:
            connection.close()
    except sqlite3.Error:
        return set()
    for (cursor,) in rows:
        try:
            value = json.loads(cursor) if isinstance(cursor, str) else None
        except json.JSONDecodeError:
            continue
        session_id = value.get("sessionId") if isinstance(value, dict) else None
        if isinstance(session_id, str) and session_id:
            sessions.add(session_id)
    return sessions


def collect_opencode(
    database: Path,
    window_start: dt.datetime,
    window_end: dt.datetime,
    t3code_sessions: set[str],
    buckets: Buckets,
) -> int:
    """Add finished opencode assistant messages; return the counted total.

    A message is bucketed by its completion time, and unfinished messages are
    skipped, so a stored hour never changes after it is sent.
    """
    connection = read_only_sqlite(database)
    try:
        parents = dict(connection.execute("SELECT id, parent_id FROM session").fetchall())
        rows = connection.execute(
            "SELECT session_id, data FROM message"
            " WHERE time_updated >= ? AND json_extract(data, '$.role') = 'assistant'",
            (epoch_ms(window_start),),
        ).fetchall()
    finally:
        connection.close()

    def root_session(session_id: str) -> str:
        current = session_id
        for _ in range(64):
            parent = parents.get(current)
            if not isinstance(parent, str) or not parent:
                return current
            current = parent
        return current

    counted = 0
    for session_id, data in rows:
        try:
            message = json.loads(data)
        except (json.JSONDecodeError, TypeError):
            continue
        if not isinstance(message, dict):
            continue
        time = message.get("time")
        completed = from_epoch_ms(time.get("completed")) if isinstance(time, dict) else None
        if completed is None or not (window_start <= completed < window_end):
            continue
        provider_id = peer.valid_identity(message.get("providerID"))
        model = peer.valid_identity(message.get("modelID"))
        tokens = message.get("tokens")
        if provider_id is None or model is None or not isinstance(tokens, dict):
            continue
        cache = tokens.get("cache") if isinstance(tokens.get("cache"), dict) else {}
        direct = peer.counter(tokens.get("input"))
        cache_read = peer.counter(cache.get("read"))
        cache_write = peer.counter(cache.get("write"))
        output = peer.counter(tokens.get("output"))
        reasoning = peer.counter(tokens.get("reasoning"))
        parts = [value for value in (direct, cache_read, cache_write) if value is not None]
        input_total = sum(parts) if parts else None
        output_parts = [value for value in (output, reasoning) if value is not None]
        output_total = sum(output_parts) if output_parts else None
        harness = (
            "t3code"
            if isinstance(session_id, str) and root_session(session_id) in t3code_sessions
            else "opencode"
        )
        buckets.add(
            completed,
            OPENCODE_PROVIDERS.get(provider_id, provider_id),
            harness,
            model,
            OPENCODE_CONTRACT,
            {
                "input_tokens": input_total,
                "cached_input_tokens": cache_read,
                "cache_write_input_tokens": cache_write,
                "reasoning_tokens": reasoning,
                "output_tokens": output_total,
                "total_tokens": (
                    input_total + output_total
                    if input_total is not None and output_total is not None
                    else None
                ),
            },
            peer.estimate(message.get("cost")),
        )
        counted += 1
    return counted


def collect_claude_quota(cache_file: Path, now: dt.datetime) -> list[dict[str, Any]]:
    """Claude subscription windows from t3code's latest usage-limit probe."""
    try:
        if cache_file.stat().st_size > MAX_T3CODE_CACHE_BYTES:
            return []
        document = json.loads(cache_file.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return []
    limits = document.get("usageLimits") if isinstance(document, dict) else None
    if not isinstance(limits, dict):
        return []
    checked = peer.utc_timestamp(limits.get("checkedAt"))
    windows = limits.get("windows")
    if checked is None or not isinstance(windows, list):
        return []
    if checked > now + dt.timedelta(minutes=10) or now - checked > MAX_QUOTA_AGE:
        return []
    sample_id = f"t3code-{checked.strftime('%Y%m%dT%H%M%SZ')}"
    samples: list[dict[str, Any]] = []
    seen: set[str] = set()
    for window in windows[:16]:
        if not isinstance(window, dict):
            continue
        limit_id = peer.valid_identity(window.get("id"))
        used = window.get("usedPercent")
        if limit_id is None or limit_id in seen:
            continue
        if isinstance(used, bool) or not isinstance(used, (int, float)):
            continue
        if not math.isfinite(float(used)) or not 0 <= float(used) <= 100:
            continue
        minutes = window.get("windowDurationMins")
        if isinstance(minutes, bool) or not isinstance(minutes, int) or not 1 <= minutes <= 525_600:
            minutes = None
        resets = peer.utc_timestamp(window.get("resetsAt"))
        seen.add(limit_id)
        samples.append(
            {
                "schema": "provider-quota-sample/v1",
                "sample_id": sample_id,
                "observed_at": peer.iso_timestamp(checked),
                "provider": "anthropic",
                "harness": "claude-code",
                "model": None,
                "plan_class": None,
                "quota_contract": QUOTA_CONTRACT,
                "limit_id": limit_id,
                "window_minutes": minutes,
                "percent_orientation": "used",
                "percent_value": float(used),
                "resets_at": peer.iso_timestamp(resets) if resets else None,
                "balance_unit": None,
                "balance_value": None,
            }
        )
    return samples


def report(
    now: dt.datetime,
    hours: int,
    claude_root: Path | None,
    opencode_db: Path | None,
    t3code_state: Path | None,
    t3code_claude_cache: Path | None,
) -> tuple[dict[str, Any], list[str]]:
    if hours < 1 or hours > peer.MAX_HOURS:
        raise ValueError(f"hours must be between 1 and {peer.MAX_HOURS}")
    window_end = peer.complete_hour(now)
    window_start = window_end - dt.timedelta(hours=hours)
    warnings: list[str] = []
    buckets = Buckets()

    if claude_root is not None:
        if claude_root.is_dir():
            collect_claude(claude_root, window_start, window_end, buckets)
        else:
            warnings.append(f"Claude Code transcripts are absent, lane unavailable: {claude_root}")

    if opencode_db is not None:
        if opencode_db.is_file():
            sessions = t3code_opencode_sessions(t3code_state) if t3code_state else set()
            try:
                collect_opencode(opencode_db, window_start, window_end, sessions, buckets)
            except sqlite3.Error as error:
                warnings.append(f"opencode ledger is unreadable, lane unavailable: {error}")
        else:
            warnings.append(f"opencode ledger is absent, lane unavailable: {opencode_db}")

    quota = collect_claude_quota(t3code_claude_cache, now) if t3code_claude_cache else []
    return (
        {
            "schema": "agent-telemetry-report/v1",
            "source": "macbook-air",
            "collected_at": peer.iso_timestamp(now),
            "usage_samples": buckets.samples(),
            "quota_samples": quota,
        },
        warnings,
    )


def chunks(payload: dict[str, Any]) -> list[dict[str, Any]]:
    """Split a report under the ingest's 512 KiB body and sample limits."""
    usage = payload["usage_samples"]
    parts = [usage[index : index + MAX_SAMPLES_PER_POST] for index in range(0, len(usage), MAX_SAMPLES_PER_POST)]
    if not parts:
        parts = [[]]
    return [
        {**payload, "usage_samples": part, "quota_samples": payload["quota_samples"] if index == 0 else []}
        for index, part in enumerate(parts)
        if part or (index == 0 and payload["quota_samples"])
    ]


def parse_args() -> argparse.Namespace:
    home = Path.home()
    parser = argparse.ArgumentParser(
        description="Collect complete-hour direct Claude Code, opencode, and t3code usage"
    )
    parser.add_argument("--source", choices=("macbook-air",), default="macbook-air")
    parser.add_argument("--hours", type=int)
    parser.add_argument("--claude-root", type=Path, default=home / ".claude" / "projects")
    parser.add_argument(
        "--opencode-db", type=Path, default=home / ".local" / "share" / "opencode" / "opencode.db"
    )
    parser.add_argument("--t3code-state", type=Path, default=home / ".t3" / "userdata" / "state.sqlite")
    parser.add_argument(
        "--t3code-claude-cache", type=Path, default=home / ".t3" / "caches" / "claudeAgent.json"
    )
    parser.add_argument("--skip-claude", action="store_true")
    parser.add_argument("--skip-opencode", action="store_true")
    parser.add_argument("--skip-quota", action="store_true")
    parser.add_argument("--config-file", type=Path)
    parser.add_argument(
        "--state-file",
        type=Path,
        default=home / ".local" / "state" / "scrapbook" / "agent-direct-reporter.json",
    )
    parser.add_argument("--print-only", action="store_true")
    parser.add_argument(
        "--summary-only",
        action="store_true",
        help="print per-lane totals instead of the payload; never sends",
    )
    return parser.parse_args()


def summary(payload: dict[str, Any]) -> dict[str, Any]:
    lanes: dict[str, dict[str, int]] = {}
    for sample in payload["usage_samples"]:
        key = f"{sample['harness']}/{sample['provider']}/{sample['model']}"
        lane = lanes.setdefault(key, {"hours": 0, "requests": 0, "input": 0, "output": 0})
        lane["hours"] += 1
        lane["requests"] += sample["request_count"] or 0
        lane["input"] += sample["input_tokens"] or 0
        lane["output"] += sample["output_tokens"] or 0
    return {
        "usage_samples": len(payload["usage_samples"]),
        "quota_samples": len(payload["quota_samples"]),
        "posts": len(chunks(payload)),
        "lanes": dict(sorted(lanes.items())),
    }


def main() -> int:
    args = parse_args()
    now = dt.datetime.now(dt.timezone.utc)
    hours = args.hours if args.hours is not None else peer.hours_since_success(now, args.state_file)
    try:
        url, secret = peer.load_credentials(args.config_file)
        payload, warnings = report(
            now,
            hours,
            None if args.skip_claude else args.claude_root,
            None if args.skip_opencode else args.opencode_db,
            None if args.skip_opencode else args.t3code_state,
            None if args.skip_quota else args.t3code_claude_cache,
        )
    except (FileNotFoundError, ValueError) as error:
        print(str(error), file=sys.stderr)
        return 2
    for warning in warnings:
        print(warning, file=sys.stderr)

    if args.summary_only:
        print(json.dumps(summary(payload), indent=2))
        return 0
    posts = chunks(payload)
    if not posts:
        print("no complete-hour direct usage or quota; nothing to send", file=sys.stderr)
        return 0
    if args.print_only or not url or not secret:
        print(json.dumps(payload, indent=2, sort_keys=True))
        return 0
    try:
        for post in posts:
            peer.send(post, url, secret)
        peer.save_success_state(now, args.state_file)
    except (OSError, RuntimeError, ValueError) as error:
        print(str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
