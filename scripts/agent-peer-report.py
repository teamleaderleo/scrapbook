#!/usr/bin/env python3
"""Collect complete-hour delegated peer-agent usage for machine-health.

Reads the content-free Big Red ledgers written by the subscription peer
wrappers (Claude Code / Antigravity CLI) and the contributor-free Muse peer:

  ~/.local/state/big-red-agent-peer/usage.jsonl   (big-red-agent-peer-usage/v1)
  ~/.local/state/big-red-muse-peer/usage.jsonl    (big-red-muse-peer-usage/v1)

and emits one aggregate ``agent-usage-sample/v1`` row per complete UTC hour
and provider/harness/model/effort group. Only aggregate counters plus
run/success counts leave the machine: no prompt, response, session or
conversation ID, repository/path, account identity, or credential state.

Token semantics match the existing machine-health accounting: input is the
logical input total, cached input is a subset of input (never added a second
time), cache creation/write stays a distinct diagnostic counter, output is
distinct, and reasoning is a diagnostic subset where the provider reports it.
Claude's client-side ``total_cost_usd`` is preserved only as the diagnostic
``api_equivalent_estimate_usd`` field; it is never the subscription bill and
``actual_marginal_cost_usd`` is never emitted.
"""

from __future__ import annotations

import argparse
import datetime as dt
import fcntl
import json
import math
import os
import re
import stat
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


MAX_HOURS = 720
MAX_LEDGER_BYTES = 64 * 1024 * 1024
MAX_CONFIG_BYTES = 16_384
INGEST_TIMEOUT_SECONDS = 60
CONFIG_KEYS = frozenset({"ingest_url", "ingest_secret"})
IDENTITY_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.:/@#+\-]{0,127}$")
PEER_SCHEMA = "big-red-agent-peer-usage/v1"
MUSE_SCHEMA = "big-red-muse-peer-usage/v1"
PEER_CONTRACT = "big-red-agent-peer-usage/v1"
MUSE_CONTRACT = "big-red-muse-peer-usage/v1"

TOKEN_FIELDS = (
    ("input_tokens", "input_tokens"),
    ("cached_input_tokens", "cached_input_tokens"),
    ("cache_creation_input_tokens", "cache_write_input_tokens"),
    ("output_tokens", "output_tokens"),
    ("reasoning_tokens", "reasoning_tokens"),
    ("total_tokens", "total_tokens"),
)


class RejectRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(
        self,
        request: urllib.request.Request,
        file_pointer: Any,
        code: int,
        message: str,
        headers: Any,
        new_url: str,
    ) -> None:
        return None


def utc_timestamp(value: object) -> dt.datetime | None:
    try:
        parsed = dt.datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return None
    return parsed.astimezone(dt.timezone.utc)


def complete_hour(value: dt.datetime) -> dt.datetime:
    return value.astimezone(dt.timezone.utc).replace(
        minute=0, second=0, microsecond=0
    )


def iso_timestamp(value: dt.datetime) -> str:
    return value.astimezone(dt.timezone.utc).isoformat().replace("+00:00", "Z")


def hour_stamp(value: dt.datetime) -> str:
    return value.astimezone(dt.timezone.utc).strftime("%Y%m%dT%HZ")


def valid_identity(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    return value if IDENTITY_PATTERN.fullmatch(value) else None


def counter(value: object) -> int | None:
    if (
        isinstance(value, bool)
        or not isinstance(value, int)
        or value < 0
        or value > 9_007_199_254_740_991
    ):
        return None
    return value


def estimate(value: object) -> float | None:
    if (
        isinstance(value, bool)
        or not isinstance(value, (int, float))
        or not math.isfinite(float(value))
        or float(value) < 0
    ):
        return None
    return float(value)


def lane_identity(schema: object, provider: object) -> tuple[str, str, str] | None:
    """Map a receipt to (provider, harness, accounting_contract)."""
    if schema == PEER_SCHEMA and provider == "claude":
        return ("anthropic", "claude-code", PEER_CONTRACT)
    if schema == PEER_SCHEMA and provider == "antigravity":
        return ("google", "antigravity", PEER_CONTRACT)
    if schema == MUSE_SCHEMA and provider == "opencode-zen":
        return ("opencode-zen", "muse", MUSE_CONTRACT)
    return None


def read_ledger(path: Path) -> list[dict[str, Any]] | None:
    """Read one JSONL ledger; return None when the file is absent.

    Raises FileNotFoundError with an unavailable-reason for present but
    unreadable/untrusted ledgers so callers never report them as zero.
    """
    try:
        descriptor = os.open(
            path, os.O_RDONLY | os.O_CLOEXEC | os.O_NOFOLLOW
        )
    except FileNotFoundError:
        return None
    except OSError as error:
        raise FileNotFoundError(f"Peer usage ledger is unavailable: {path}") from error
    try:
        metadata = os.fstat(descriptor)
        if not stat.S_ISREG(metadata.st_mode):
            raise FileNotFoundError(f"Peer usage ledger is not a regular file: {path}")
        if metadata.st_uid != os.geteuid():
            raise FileNotFoundError(f"Peer usage ledger is not owned by the current user: {path}")
        if metadata.st_nlink != 1:
            raise FileNotFoundError(f"Peer usage ledger must have one link: {path}")
        if stat.S_IMODE(metadata.st_mode) & 0o077:
            raise FileNotFoundError(
                f"Peer usage ledger must not be accessible by group or other: {path}"
            )
        if metadata.st_size > MAX_LEDGER_BYTES:
            raise FileNotFoundError(f"Peer usage ledger exceeds its bounded read ceiling: {path}")
        fcntl.flock(descriptor, fcntl.LOCK_SH)
        try:
            raw = os.read(descriptor, MAX_LEDGER_BYTES + 1)
        finally:
            fcntl.flock(descriptor, fcntl.LOCK_UN)
    except OSError as error:
        raise FileNotFoundError(f"Peer usage ledger is unavailable: {path}") from error
    finally:
        os.close(descriptor)
    if len(raw) > MAX_LEDGER_BYTES:
        raise FileNotFoundError(f"Peer usage ledger exceeds its bounded read ceiling: {path}")
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as error:
        raise FileNotFoundError(f"Peer usage ledger is not UTF-8: {path}") from error
    receipts: list[dict[str, Any]] = []
    for line in text.splitlines():
        if not line.strip():
            continue
        try:
            value = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(value, dict):
            receipts.append(value)
    return receipts


def collect_samples(
    now: dt.datetime,
    hours: int,
    peer_ledger: Path | None,
    muse_ledger: Path | None,
) -> tuple[list[dict[str, Any]], list[str]]:
    if hours < 1 or hours > MAX_HOURS:
        raise ValueError(f"hours must be between 1 and {MAX_HOURS}")
    window_end = complete_hour(now)
    window_start = window_end - dt.timedelta(hours=hours)
    warnings: list[str] = []
    receipts: list[dict[str, Any]] = []
    for label, ledger in (("peer", peer_ledger), ("muse", muse_ledger)):
        if ledger is None:
            continue
        lane = read_ledger(ledger)
        if lane is None:
            warnings.append(f"{label} ledger is absent, lane unavailable: {ledger}")
            continue
        receipts.extend(lane)

    buckets: dict[tuple[str, str, str, str, str, str], dict[str, Any]] = {}
    for receipt in receipts:
        identity = lane_identity(receipt.get("schema"), receipt.get("provider"))
        if identity is None:
            continue
        provider, harness, contract = identity
        model = valid_identity(receipt.get("model"))
        if model is None:
            continue
        raw_effort = receipt.get("effort")
        effort = valid_identity(raw_effort) if raw_effort is not None else None
        settled = utc_timestamp(receipt.get("settled_at"))
        if settled is None or not (window_start <= settled < window_end):
            continue
        start = complete_hour(settled)
        key = (iso_timestamp(start), provider, harness, model, effort or "", contract)
        bucket = buckets.get(key)
        if bucket is None:
            bucket = {
                "observed_at": iso_timestamp(start),
                "provider": provider,
                "harness": harness,
                "model": model,
                "effort": effort,
                "accounting_contract": contract,
                "runs": 0,
                "exit_observed": 0,
                "successful_runs": 0,
                "estimate_observed": 0,
                "api_equivalent_estimate_usd": 0.0,
                "step_observed": 0,
                "agent_steps": 0,
                **{sample: 0 for _, sample in TOKEN_FIELDS},
                **{f"{sample}_observed": 0 for _, sample in TOKEN_FIELDS},
            }
            buckets[key] = bucket
        bucket["runs"] += 1
        exit_code = receipt.get("exit_code")
        if isinstance(exit_code, bool):
            pass
        elif isinstance(exit_code, int):
            bucket["exit_observed"] += 1
            if exit_code == 0:
                bucket["successful_runs"] += 1
        for receipt_field, sample_field in TOKEN_FIELDS:
            value = counter(receipt.get(receipt_field))
            if value is not None:
                bucket[sample_field] += value
                bucket[f"{sample_field}_observed"] += 1
        if identity[2] == PEER_CONTRACT:
            amount = estimate(receipt.get("api_equivalent_estimate_usd"))
            if amount is not None:
                bucket["api_equivalent_estimate_usd"] = round(
                    float(bucket["api_equivalent_estimate_usd"]) + amount, 8
                )
                bucket["estimate_observed"] += 1
        else:
            steps = counter(receipt.get("step_count"))
            if steps is not None:
                bucket["agent_steps"] += steps
                bucket["step_observed"] += 1

    samples: list[dict[str, Any]] = []
    for key in sorted(buckets):
        bucket = buckets[key]
        observed_at, provider, harness, model, _, _ = key
        effort_label = bucket["effort"] or "noeffort"
        sample_id = (
            f"peer-{hour_stamp(dt.datetime.fromisoformat(observed_at.replace('Z', '+00:00')))}"
            f"-{provider}-{harness}-{model}-{effort_label}"
        )
        if len(sample_id) > 128 or not IDENTITY_PATTERN.fullmatch(sample_id):
            sample_id = f"peer-{hour_stamp(dt.datetime.fromisoformat(observed_at.replace('Z', '+00:00')))}-{provider}-{harness}"
        estimate_value: float | None = None
        if bucket["estimate_observed"] > 0:
            estimate_value = float(bucket["api_equivalent_estimate_usd"])
        samples.append(
            {
                "schema": "agent-usage-sample/v1",
                "sample_id": sample_id,
                "observed_at": observed_at,
                "provider": provider,
                "harness": harness,
                "model": model,
                "effort": bucket["effort"],
                "accounting_contract": bucket["accounting_contract"],
                "run_ref": None,
                **{
                    sample: (bucket[sample] if bucket[f"{sample}_observed"] > 0 else None)
                    for _, sample in TOKEN_FIELDS
                },
                "request_count": bucket["runs"],
                "successful_request_count": (
                    bucket["successful_runs"] if bucket["exit_observed"] > 0 else None
                ),
                "api_equivalent_estimate_usd": estimate_value,
                "turn_count": None,
                "agent_step_count": (
                    bucket["agent_steps"] if bucket["step_observed"] > 0 else None
                ),
            }
        )
    return samples, warnings


def report(
    source: str,
    now: dt.datetime,
    hours: int,
    peer_ledger: Path | None = None,
    muse_ledger: Path | None = None,
) -> tuple[dict[str, Any], list[str]]:
    if source not in {"big-red", "macbook-air"}:
        raise ValueError("source must be big-red or macbook-air")
    home = Path.home()
    if peer_ledger is None:
        peer_ledger = home / ".local" / "state" / "big-red-agent-peer" / "usage.jsonl"
    if muse_ledger is None:
        muse_ledger = home / ".local" / "state" / "big-red-muse-peer" / "usage.jsonl"
    samples, warnings = collect_samples(now, hours, peer_ledger, muse_ledger)
    return (
        {
            "schema": "agent-telemetry-report/v1",
            "source": source,
            "collected_at": iso_timestamp(now),
            "usage_samples": samples,
            "quota_samples": [],
        },
        warnings,
    )


def hours_since_success(now: dt.datetime, state_file: Path) -> int:
    try:
        state = json.loads(state_file.read_text(encoding="utf-8"))
        last_end = utc_timestamp(state.get("last_window_ended_at"))
    except (AttributeError, FileNotFoundError, json.JSONDecodeError, OSError):
        return MAX_HOURS
    if last_end is None:
        return 1
    elapsed = int((complete_hour(now) - last_end).total_seconds() // 3_600)
    return min(MAX_HOURS, max(1, elapsed))


def save_success_state(now: dt.datetime, state_file: Path) -> None:
    state_file.parent.mkdir(parents=True, exist_ok=True)
    temporary = state_file.with_name(f".{state_file.name}.tmp")
    temporary.write_text(
        json.dumps(
            {
                "last_window_ended_at": iso_timestamp(complete_hour(now)),
            },
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )
    os.replace(temporary, state_file)


def validate_ingest_url(value: str) -> str:
    parsed = urllib.parse.urlparse(value)
    if parsed.scheme == "https" and parsed.netloc:
        return value
    if (
        parsed.scheme == "http"
        and parsed.hostname in {"127.0.0.1", "localhost", "::1"}
        and parsed.netloc
    ):
        return value
    raise ValueError("The ingest URL must use HTTPS, except for loopback testing")


def load_credentials(config_file: Path | None) -> tuple[str, str]:
    environment_url = os.environ.get("AGENT_PEER_INGEST_URL", "").strip()
    environment_secret = os.environ.get("MACHINE_HEALTH_INGEST_SECRET", "").strip()
    if config_file is None:
        if bool(environment_url) != bool(environment_secret):
            raise ValueError("Both peer ingest environment variables are required")
        if environment_url:
            environment_url = validate_ingest_url(environment_url)
        return environment_url, environment_secret
    if environment_url or environment_secret:
        raise ValueError("Do not combine a credential file with ingest environment variables")

    try:
        descriptor = os.open(
            config_file,
            os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK,
        )
        with os.fdopen(descriptor, "rb") as credential_stream:
            metadata = os.fstat(credential_stream.fileno())
            if not stat.S_ISREG(metadata.st_mode):
                raise ValueError("The credential file must be a regular file")
            if metadata.st_uid != os.getuid():
                raise ValueError("The credential file must be owned by the current user")
            if metadata.st_nlink != 1:
                raise ValueError("The credential file must have one link")
            if stat.S_IMODE(metadata.st_mode) & 0o077:
                raise ValueError(
                    "The credential file must not be accessible by group or other"
                )
            encoded_document = credential_stream.read(MAX_CONFIG_BYTES + 1)
    except OSError as error:
        raise ValueError("The credential file is unavailable") from error
    if len(encoded_document) > MAX_CONFIG_BYTES:
        raise ValueError("The credential file is too large")
    try:
        document = json.loads(encoded_document.decode("utf-8"))
    except (UnicodeError, json.JSONDecodeError) as error:
        raise ValueError("The credential file is invalid") from error
    if not isinstance(document, dict) or set(document) != CONFIG_KEYS:
        raise ValueError("The credential file fields are invalid")
    url = document.get("ingest_url")
    secret = document.get("ingest_secret")
    if not isinstance(url, str) or not url.strip():
        raise ValueError("The credential file ingest URL is invalid")
    if not isinstance(secret, str) or not secret.strip():
        raise ValueError("The credential file ingest secret is invalid")
    return validate_ingest_url(url.strip()), secret.strip()


def send(payload: dict[str, Any], url: str, secret: str) -> None:
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    request = urllib.request.Request(
        validate_ingest_url(url),
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {secret}",
            "Content-Type": "application/json",
            "User-Agent": "scrapbook-agent-peer-reporter/1",
        },
    )
    opener = urllib.request.build_opener(RejectRedirects())
    try:
        with opener.open(request, timeout=INGEST_TIMEOUT_SECONDS) as response:
            if response.status < 200 or response.status >= 300:
                raise RuntimeError(f"ingest returned HTTP {response.status}")
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"ingest returned HTTP {error.code}") from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"ingest failed: {error.reason}") from error


def default_ledger(name: str) -> Path:
    return Path.home() / ".local" / "state" / name / "usage.jsonl"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Collect complete-hour delegated peer-agent usage aggregates"
    )
    parser.add_argument(
        "--source", choices=("big-red", "macbook-air"), default="big-red"
    )
    parser.add_argument("--hours", type=int)
    parser.add_argument("--peer-ledger", type=Path, default=default_ledger("big-red-agent-peer"))
    parser.add_argument("--muse-ledger", type=Path, default=default_ledger("big-red-muse-peer"))
    parser.add_argument("--skip-peer", action="store_true")
    parser.add_argument("--skip-muse", action="store_true")
    parser.add_argument("--config-file", type=Path)
    parser.add_argument(
        "--state-file",
        type=Path,
        default=Path.home()
        / ".local"
        / "state"
        / "scrapbook"
        / "agent-peer-reporter.json",
    )
    parser.add_argument("--print-only", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    now = dt.datetime.now(dt.timezone.utc)
    hours = (
        args.hours
        if args.hours is not None
        else hours_since_success(now, args.state_file)
    )
    peer_ledger = None if args.skip_peer else args.peer_ledger
    muse_ledger = None if args.skip_muse else args.muse_ledger
    try:
        url, secret = load_credentials(args.config_file)
        payload, warnings = report(
            args.source, now, hours, peer_ledger, muse_ledger
        )
    except (FileNotFoundError, ValueError) as error:
        print(str(error), file=sys.stderr)
        return 2
    for warning in warnings:
        print(warning, file=sys.stderr)

    if not payload["usage_samples"]:
        print(json.dumps(payload, indent=2, sort_keys=True))
        print("no complete-hour peer receipts; nothing to send", file=sys.stderr)
        return 0
    if args.print_only or not url or not secret:
        print(json.dumps(payload, indent=2, sort_keys=True))
        return 0
    try:
        send(payload, url, secret)
        save_success_state(now, args.state_file)
    except (OSError, RuntimeError, ValueError) as error:
        print(str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
