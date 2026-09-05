#!/usr/bin/env python3
"""Render the lightweight minute sampler's separate Mac LaunchAgent."""
import argparse
import plistlib
import sys
from pathlib import Path


def absolute_path(value):
    if not Path(value).is_absolute():
        raise argparse.ArgumentTypeError("An absolute path is required")
    return value


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for argument in ("python", "reporter", "config"):
        parser.add_argument(f"--{argument}", required=True, type=absolute_path)
    args = parser.parse_args()
    sys.stdout.buffer.write(plistlib.dumps({
        "Label": "com.teamleaderleo.scrapbook-machine-activity",
        "ProgramArguments": [args.python, args.reporter, "--config-file", args.config],
        "RunAtLoad": True,
        "StartInterval": 60,
        "ProcessType": "Background",
        "LowPriorityIO": True,
        "StandardOutPath": "/dev/null",
        "StandardErrorPath": "/dev/null",
    }))


if __name__ == "__main__":
    main()
