#!/usr/bin/env python3
"""Collect complete-hour Codex token counters on macOS or Linux.

The report contains aggregate counters and the fixed source label only. It does
not emit session IDs, prompts, responses, paths, account data, or machine names.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import hmac
import json
import os
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
CONFIG_KEYS = frozenset({"ingest_url", "ingest_secret"})


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


def empty_window(start: dt.datetime) -> dict[str, Any]:
    end = start + dt.timedelta(hours=1)
    return {
        "source": "session-jsonl",
        "window_started_at": start.isoformat().replace("+00:00", "Z"),
        "window_ended_at": end.isoformat().replace("+00:00", "Z"),
        **dict.fromkeys(TOKEN_FIELDS, 0),
        "model_calls": 0,
        "active_routes": 0,
        "session_fingerprints": [],
        "fingerprints_complete": False,
    }


def collect_windows(
    now: dt.datetime,
    hours: int,
    session_directory: Path | None = None,
    fingerprint_key: bytes | None = None,
) -> list[dict[str, Any]]:
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
                    if payload.get("type") != "token_count":
                        continue
                    try:
                        usage = (payload.get("info") or {}).get("last_token_usage")
                    except AttributeError:
                        continue
                    if not isinstance(usage, dict) or not (
                        window_start <= timestamp < window_end
                    ):
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
    return [windows[start] for start in starts]


def report(
    source: str,
    now: dt.datetime,
    hours: int,
    session_directory: Path | None = None,
    fingerprint_key: bytes | None = None,
) -> dict[str, Any]:
    if source not in {"big-red", "macbook-air"}:
        raise ValueError("source must be big-red or macbook-air")
    return {
        "schema_version": 1,
        "source": source,
        "collected_at": now.astimezone(dt.timezone.utc)
        .isoformat()
        .replace("+00:00", "Z"),
        "windows": collect_windows(
            now, hours, session_directory, fingerprint_key=fingerprint_key
        ),
    }


def hours_since_success(now: dt.datetime, state_file: Path) -> int:
    try:
        state = json.loads(state_file.read_text(encoding="utf-8"))
        last_end = utc_timestamp(state.get("last_window_ended_at"))
    except (AttributeError, FileNotFoundError, json.JSONDecodeError, OSError):
        return 1
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
                "last_window_ended_at": complete_hour(now)
                .isoformat()
                .replace("+00:00", "Z")
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
        with opener.open(request, timeout=15) as response:
            if response.status < 200 or response.status >= 300:
                raise RuntimeError(f"ingest returned HTTP {response.status}")
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"ingest returned HTTP {error.code}") from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"ingest failed: {error.reason}") from error


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Collect complete-hour Codex token counters"
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
