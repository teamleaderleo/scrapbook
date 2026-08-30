#!/usr/bin/env python3
"""Render a secret-free hourly macOS LaunchAgent for Codex token reporting."""

from __future__ import annotations

import argparse
import plistlib
import sys
from pathlib import Path
from typing import Any


LABEL = "com.teamleaderleo.scrapbook-codex-token"


def absolute_path(value: str) -> str:
    path = Path(value)
    if not path.is_absolute():
        raise argparse.ArgumentTypeError("paths must be absolute")
    return str(path)


def minute(value: str) -> int:
    parsed = int(value)
    if parsed < 0 or parsed > 59:
        raise argparse.ArgumentTypeError("minute must be between 0 and 59")
    return parsed


def launch_agent(
    python_path: str,
    reporter_path: str,
    config_path: str,
    state_path: str,
    calendar_minute: int,
) -> dict[str, Any]:
    return {
        "Label": LABEL,
        "ProgramArguments": [
            python_path,
            reporter_path,
            "--source",
            "macbook-air",
            "--config-file",
            config_path,
            "--state-file",
            state_path,
        ],
        "RunAtLoad": True,
        "StartCalendarInterval": {"Minute": calendar_minute},
        "ProcessType": "Background",
        "LowPriorityIO": True,
        "StandardOutPath": "/dev/null",
        "StandardErrorPath": "/dev/null",
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Render the MacBook Air Codex token LaunchAgent"
    )
    parser.add_argument("--python", required=True, type=absolute_path)
    parser.add_argument("--reporter", required=True, type=absolute_path)
    parser.add_argument("--config", required=True, type=absolute_path)
    parser.add_argument("--state", required=True, type=absolute_path)
    parser.add_argument("--minute", default=17, type=minute)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    document = launch_agent(
        args.python,
        args.reporter,
        args.config,
        args.state,
        args.minute,
    )
    sys.stdout.buffer.write(plistlib.dumps(document, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
