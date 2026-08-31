#!/usr/bin/env python3
"""Regression tests for the Mac resource LaunchAgent renderer."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("mac-health-launchd.py")
SPEC = importlib.util.spec_from_file_location("mac_health_launchd", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class MacHealthLaunchdTest(unittest.TestCase):
    def test_agent_is_hourly_short_lived_and_secret_free(self) -> None:
        document = MODULE.launch_agent(
            "/usr/bin/python3",
            "/private/reporter.py",
            "/private/config.json",
            27,
        )
        self.assertEqual(document["Label"], MODULE.LABEL)
        self.assertEqual(document["StartCalendarInterval"], {"Minute": 27})
        self.assertTrue(document["RunAtLoad"])
        self.assertNotIn("KeepAlive", document)
        self.assertNotIn("EnvironmentVariables", document)
        self.assertNotIn("secret", str(document).lower())


if __name__ == "__main__":
    unittest.main()
