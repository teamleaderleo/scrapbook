#!/usr/bin/env python3
"""Regression tests for the direct agent usage LaunchAgent renderer."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("agent-direct-usage-launchd.py")
SPEC = importlib.util.spec_from_file_location("agent_direct_usage_launchd", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
LAUNCHD = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(LAUNCHD)


class LaunchAgentTest(unittest.TestCase):
    def test_renders_a_distinct_secret_free_hourly_agent(self) -> None:
        document = LAUNCHD.launch_agent(
            "/usr/bin/python3",
            "/support/agent-direct-usage-report.py",
            "/support/agent-direct-usage.json",
            "/support/agent-direct-usage-state.json",
            37,
        )
        self.assertEqual(document["Label"], "com.teamleaderleo.scrapbook-agent-direct-usage")
        self.assertEqual(
            document["ProgramArguments"],
            [
                "/usr/bin/python3",
                "/support/agent-direct-usage-report.py",
                "--source",
                "macbook-air",
                "--config-file",
                "/support/agent-direct-usage.json",
                "--state-file",
                "/support/agent-direct-usage-state.json",
            ],
        )
        self.assertEqual(document["StartCalendarInterval"], {"Minute": 37})
        self.assertEqual(document["ProcessType"], "Background")
        self.assertTrue(document["LowPriorityIO"])
        self.assertNotIn("secret", repr(document).replace("agent-direct-usage", ""))


if __name__ == "__main__":
    unittest.main()
