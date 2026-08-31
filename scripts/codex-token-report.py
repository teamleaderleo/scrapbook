#!/usr/bin/env python3
"""Collect complete-hour Codex token counters and quota snapshots.

The report contains aggregate counters, quota percentages/reset times, and the
fixed source label only. It does not emit session IDs, prompts, responses,
paths, account identities, or machine names.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import hmac
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


TOKEN_FIELDS = (
    "input_tokens",
    "cached_input_tokens",
    "cache_write_input_tokens",
    "output_tokens",
    "reasoning_output_tokens",
    "total_tokens",
)
FORK_REPLAY_SECONDS = 2
MAX_HOURS = 720
MAX_CONFIG_BYTES = 16_384
MAX_QUOTA_SAMPLES = 4_096
INGEST_TIMEOUT_SECONDS = 60
QUOTA_STATE_VERSION = 1
CONFIG_KEYS = frozenset({"ingest_url", "ingest_secret"})
LIMIT_ID_PATTERN = re.compile(r"^[A-Za-z0-9_.:-]{1,64}$")


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


def empty_window(start: dt.datetime) -> dict[str, Any]:
    end = start + dt.timedelta(hours=1)
    return {
        "source": "session-jsonl",
        "window_started_at": iso_timestamp(start),
        "window_ended_at": iso_timestamp(end),
        **dict.fromkeys(TOKEN_FIELDS, 0),
        "model_calls": 0,
        "active_routes": 0,
        "session_fingerprints": [],
        "fingerprints_complete": False,
    }


def quota_samples_from_payload(
    timestamp: dt.datetime, payload: dict[str, Any]
) -> list[dict[str, Any]]:
    rate_limits = payload.get("rate_limits")
    if not isinstance(rate_limits, dict):
        return []

    candidate_limit_id = rate_limits.get("limit_id")
    limit_id = (
        candidate_limit_id
        if isinstance(candidate_limit_id, str)
        and LIMIT_ID_PATTERN.fullmatch(candidate_limit_id)
        else "codex"
    )
    samples: list[dict[str, Any]] = []
    for name in ("primary", "secondary"):
        window = rate_limits.get(name)
        if not isinstance(window, dict):
            continue
        used_percent = window.get("used_percent")
        window_minutes = window.get("window_minutes")
        if (
            isinstance(used_percent, bool)
            or not isinstance(used_percent, (int, float))
            or not math.isfinite(float(used_percent))
            or float(used_percent) < 0
            or float(used_percent) > 100
            or isinstance(window_minutes, bool)
            or not isinstance(window_minutes, int)
            or window_minutes < 1
            or window_minutes > 525_600
        ):
            continue

        resets_at_value = window.get("resets_at")
        resets_at: str | None = None
        if resets_at_value is not None:
            if (
                isinstance(resets_at_value, bool)
                or not isinstance(resets_at_value, (int, float))
                or not math.isfinite(float(resets_at_value))
            ):
                continue
            try:
                resets_at = iso_timestamp(
                    dt.datetime.fromtimestamp(
                        float(resets_at_value), tz=dt.timezone.utc
                    )
                )
            except (OverflowError, OSError, ValueError):
                continue

        samples.append(
            {
                "observed_at": iso_timestamp(timestamp),
                "limit_id": limit_id,
                "window_minutes": window_minutes,
                "used_percent": float(used_percent),
                "resets_at": resets_at,
            }
        )
    return samples


def dedupe_quota_samples(samples: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_observation: dict[tuple[str, str, int], dict[str, Any]] = {}
    for sample in samples:
        key = (
            str(sample["observed_at"]),
            str(sample["limit_id"]),
            int(sample["window_minutes"]),
        )
        by_observation[key] = sample

    ordered = sorted(
        by_observation.values(),
        key=lambda sample: (
            str(sample["observed_at"]),
            str(sample["limit_id"]),
            int(sample["window_minutes"]),
        ),
    )
    latest_percent: dict[tuple[str, int], float] = {}
    transitions: list[dict[str, Any]] = []
    for sample in ordered:
        key = (str(sample["limit_id"]), int(sample["window_minutes"]))
        used_percent = float(sample["used_percent"])
        if latest_percent.get(key) == used_percent:
            continue
        latest_percent[key] = used_percent
        transitions.append(sample)

    return transitions[-MAX_QUOTA_SAMPLES:]


def collect_windows_and_quota(
    now: dt.datetime,
    hours: int,
    session_directory: Path | None = None,
    fingerprint_key: bytes | None = None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    if hours < 1 or hours > MAX_HOURS:
        raise ValueError(f"hours must be between 1 and {MAX_HOURS}")
    window_end = complete_hour(now)
    window_start = window_end - dt.timedelta(hours=hours)
    directory = session_directory or Path.home() / ".codex" / "sessions"
    if not directory.is_dir():
        raise FileNotFoundError(f"Codex session directory is unavailable: {directory}")

    starts = [window_start + dt.timedelta(hours=index) for index in range(hours)]
    windows = {start: empty_window(start) for start in starts}
    fingerprints: dict[dt.datetime, set[str]] = {start: set() for start in starts}
    fingerprints_complete = {start: fingerprint_key is not None for start in starts}
    quota_observations: list[dict[str, Any]] = []

    try:
        paths = list(directory.rglob("*.jsonl"))
    except (FileNotFoundError, PermissionError) as error:
        raise FileNotFoundError(
            f"Codex session directory is unavailable: {directory}"
        ) from error

    for path in paths:
        try:
            if path.stat().st_mtime < window_start.timestamp():
                continue
            session_started_at: dt.datetime | None = None
            session_id: str | None = None
            forked_session = False
            events: list[tuple[dt.datetime, dict[str, int]]] = []
            path_quota_observations: list[dict[str, Any]] = []
            with path.open("r", encoding="utf-8") as session:
                for line in session:
                    try:
                        record = json.loads(line)
                        payload = record.get("payload") or {}
                    except (AttributeError, json.JSONDecodeError):
                        continue
                    timestamp = utc_timestamp(record.get("timestamp"))
                    if timestamp is None:
                        continue
                    if session_started_at is None:
                        session_started_at = timestamp
                    if record.get("type") == "session_meta":
                        candidate = payload.get("id") or payload.get("session_id")
                        if isinstance(candidate, str) and candidate:
                            session_id = candidate
                    if payload.get("forked_from_id"):
                        forked_session = True
                    if payload.get("type") != "token_count" or not (
                        window_start <= timestamp < window_end
                    ):
                        continue

                    path_quota_observations.extend(
                        quota_samples_from_payload(timestamp, payload)
                    )
                    try:
                        usage = (payload.get("info") or {}).get("last_token_usage")
                    except AttributeError:
                        continue
                    if not isinstance(usage, dict):
                        continue
                    values: dict[str, int] = {}
                    for field in TOKEN_FIELDS:
                        value = usage.get(field, 0)
                        if (
                            isinstance(value, bool)
                            or not isinstance(value, int)
                            or value < 0
                        ):
                            values = {}
                            break
                        values[field] = value
                    if values:
                        events.append((timestamp, values))

            if forked_session and session_started_at is not None:
                cutoff = session_started_at + dt.timedelta(
                    seconds=FORK_REPLAY_SECONDS
                )
                if sum(timestamp < cutoff for timestamp, _ in events) > 1:
                    events = [event for event in events if event[0] >= cutoff]

            quota_observations.extend(path_quota_observations)
            route_hours: set[dt.datetime] = set()
            for timestamp, values in events:
                start = complete_hour(timestamp)
                window = windows.get(start)
                if window is None:
                    continue
                for field, value in values.items():
                    window[field] += value
                window["model_calls"] += 1
                route_hours.add(start)
            for start in route_hours:
                windows[start]["active_routes"] += 1
                if fingerprint_key is None or session_id is None:
                    fingerprints_complete[start] = False
                else:
                    fingerprints[start].add(
                        hmac.new(
                            fingerprint_key,
                            session_id.encode("utf-8"),
                            hashlib.sha256,
                        ).hexdigest()[:32]
                    )
        except (FileNotFoundError, PermissionError, OSError):
            for start in starts:
                fingerprints_complete[start] = False
            continue

    for start in starts:
        windows[start]["session_fingerprints"] = sorted(fingerprints[start])
        windows[start]["fingerprints_complete"] = fingerprints_complete[start]
    return (
        [windows[start] for start in starts],
        dedupe_quota_samples(quota_observations),
    )


def collect_windows(
    now: dt.datetime,
    hours: int,
    session_directory: Path | None = None,
    fingerprint_key: bytes | None = None,
) -> list[dict[str, Any]]:
    windows, _ = collect_windows_and_quota(
        now, hours, session_directory, fingerprint_key=fingerprint_key
    )
    return windows


def report(
    source: str,
    now: dt.datetime,
    hours: int,
    session_directory: Path | None = None,
    fingerprint_key: bytes | None = None,
) -> dict[str, Any]:
    if source not in {"big-red", "macbook-air"}:
        raise ValueError("source must be big-red or macbook-air")
    windows, quota_samples = collect_windows_and_quota(
        now, hours, session_directory, fingerprint_key=fingerprint_key
    )
    return {
        "schema_version": 1,
        "source": source,
        "collected_at": iso_timestamp(now),
        "windows": windows,
        "quota_samples": quota_samples,
    }


def hours_since_success(now: dt.datetime, state_file: Path) -> int:
    try:
        state = json.loads(state_file.read_text(encoding="utf-8"))
        last_end = utc_timestamp(state.get("last_window_ended_at"))
    except (AttributeError, FileNotFoundError, json.JSONDecodeError, OSError):
        return MAX_HOURS
    if state.get("quota_state_version") != QUOTA_STATE_VERSION:
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
                "quota_state_version": QUOTA_STATE_VERSION,
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
    environment_url = os.environ.get("CODEX_TOKEN_INGEST_URL", "").strip()
    environment_secret = os.environ.get("MACHINE_HEALTH_INGEST_SECRET", "").strip()
    if config_file is None:
        if bool(environment_url) != bool(environment_secret):
            raise ValueError("Both token ingest environment variables are required")
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
            "User-Agent": "scrapbook-codex-token-reporter/1",
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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Collect complete-hour Codex token counters and quota snapshots"
    )
    parser.add_argument(
        "--source", choices=("big-red", "macbook-air"), required=True
    )
    parser.add_argument("--hours", type=int)
    parser.add_argument("--session-directory", type=Path)
    parser.add_argument("--config-file", type=Path)
    parser.add_argument(
        "--state-file",
        type=Path,
        default=Path.home()
        / ".local"
        / "state"
        / "scrapbook"
        / "codex-token-reporter.json",
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
    try:
        url, secret = load_credentials(args.config_file)
        payload = report(
            args.source,
            now,
            hours,
            args.session_directory,
            fingerprint_key=secret.encode("utf-8") if secret else None,
        )
    except (FileNotFoundError, ValueError) as error:
        print(str(error), file=sys.stderr)
        return 2

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
