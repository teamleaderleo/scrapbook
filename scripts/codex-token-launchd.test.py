#!/usr/bin/env python3
"""Regression tests for the secret-free macOS LaunchAgent renderer."""

from __future__ import annotations

import argparse
import importlib.util
import plistlib
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("codex-token-launchd.py")
SPEC = importlib.util.spec_from_file_location("codex_token_launchd", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
LAUNCHD = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(LAUNCHD)


class CodexTokenLaunchdTest(unittest.TestCase):
    def test_renders_hourly_background_agent_without_a_secret(self) -> None:
        document = LAUNCHD.launch_agent(
            "/opt/homebrew/bin/python3",
            "/Users/leo/Library/Application Support/Scrapbook/codex-token-report.py",
            "/Users/leo/Library/Application Support/Scrapbook/codex-token.json",
            "/Users/leo/Library/Application Support/Scrapbook/codex-token-state.json",
            17,
        )
        encoded = plistlib.dumps(document)
        decoded = plistlib.loads(encoded)

        self.assertEqual(decoded["Label"], LAUNCHD.LABEL)
        self.assertTrue(decoded["RunAtLoad"])
        self.assertEqual(decoded["StartCalendarInterval"], {"Minute": 17})
        self.assertEqual(decoded["ProcessType"], "Background")
        self.assertTrue(decoded["LowPriorityIO"])
        self.assertIn("macbook-air", decoded["ProgramArguments"])
        self.assertNotIn(b"ingest_secret", encoded)
        self.assertNotIn(b"MACHINE_HEALTH_INGEST_SECRET", encoded)

    def test_rejects_relative_paths_and_invalid_minutes(self) -> None:
        with self.assertRaises(argparse.ArgumentTypeError):
            LAUNCHD.absolute_path("relative/reporter.py")
        with self.assertRaises(argparse.ArgumentTypeError):
            LAUNCHD.minute("60")


if __name__ == "__main__":
    unittest.main()
