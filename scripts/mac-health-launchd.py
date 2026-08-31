#!/usr/bin/env python3
"""Render a secret-free hourly LaunchAgent for Mac resource reporting."""

from __future__ import annotations

import argparse
import plistlib
import sys
from pathlib import Path
from typing import Any


LABEL = "com.teamleaderleo.scrapbook-mac-health"


def absolute_path(value: str) -> str:
    path = Path(value)
    if not path.is_absolute():
        raise argparse.ArgumentTypeError("paths must be absolute")
    return str(path)


def minute(value: str) -> int:
    parsed = int(value)
    if not 0 <= parsed <= 59:
        raise argparse.ArgumentTypeError("minute must be between 0 and 59")
    return parsed


def launch_agent(
    python_path: str, reporter_path: str, config_path: str, calendar_minute: int
) -> dict[str, Any]:
    return {
        "Label": LABEL,
        "ProgramArguments": [
            python_path,
            reporter_path,
            "--config-file",
            config_path,
        ],
        "RunAtLoad": True,
        "StartCalendarInterval": {"Minute": calendar_minute},
        "ProcessType": "Background",
        "LowPriorityIO": True,
        "StandardOutPath": "/dev/null",
        "StandardErrorPath": "/dev/null",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Render the Mac health LaunchAgent")
    parser.add_argument("--python", required=True, type=absolute_path)
    parser.add_argument("--reporter", required=True, type=absolute_path)
    parser.add_argument("--config", required=True, type=absolute_path)
    parser.add_argument("--minute", default=27, type=minute)
    args = parser.parse_args()
    sys.stdout.buffer.write(
        plistlib.dumps(
            launch_agent(args.python, args.reporter, args.config, args.minute),
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
