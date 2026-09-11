#!/usr/bin/env python3
"""Render a secret-free hourly macOS LaunchAgent for direct agent usage.

Reuses the Codex token LaunchAgent shape: same fixed arguments, background
priority, low-priority I/O, and no stdout/stderr log. Only the label and the
default minute differ, so the three hourly Air Blue reporters stay staggered.
"""

from __future__ import annotations

import argparse
import importlib.util
import plistlib
import sys
from pathlib import Path
from typing import Any


LABEL = "com.teamleaderleo.scrapbook-agent-direct-usage"

_SPEC = importlib.util.spec_from_file_location(
    "codex_token_launchd", Path(__file__).with_name("codex-token-launchd.py")
)
assert _SPEC is not None and _SPEC.loader is not None
codex = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(codex)


def launch_agent(
    python_path: str,
    reporter_path: str,
    config_path: str,
    state_path: str,
    calendar_minute: int,
) -> dict[str, Any]:
    document = codex.launch_agent(
        python_path, reporter_path, config_path, state_path, calendar_minute
    )
    document["Label"] = LABEL
    return document


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Render the Air Blue direct agent usage LaunchAgent"
    )
    parser.add_argument("--python", required=True, type=codex.absolute_path)
    parser.add_argument("--reporter", required=True, type=codex.absolute_path)
    parser.add_argument("--config", required=True, type=codex.absolute_path)
    parser.add_argument("--state", required=True, type=codex.absolute_path)
    parser.add_argument("--minute", default=37, type=codex.minute)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    document = launch_agent(
        args.python, args.reporter, args.config, args.state, args.minute
    )
    sys.stdout.buffer.write(plistlib.dumps(document, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
