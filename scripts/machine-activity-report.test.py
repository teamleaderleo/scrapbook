#!/usr/bin/env python3
import importlib.util
import tempfile
import unittest
from pathlib import Path

SPEC = importlib.util.spec_from_file_location('activity', Path(__file__).with_name('machine-activity-report.py'))
REPORT = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(REPORT)


class ActivityTest(unittest.TestCase):
    def test_kernel_cpu_lists_and_hybrid_topology(self):
        self.assertEqual(REPORT.cpu_list('0-2,5'), {0, 1, 2, 5})
        with self.assertRaises(ValueError):
            REPORT.cpu_list('0-99999')
        with tempfile.TemporaryDirectory() as root:
            for device, cpus in [('cpu_core','0-5'), ('cpu_atom','6-13'), ('cpu_lowpower','14-15')]:
                path = Path(root)/device
                path.mkdir()
                (path/'cpus').write_text(cpus)
            topology = REPORT.linux_topology(Path(root))
        self.assertEqual(list(topology.values()).count('performance'), 6)
        self.assertEqual(topology[14], 'low-power-efficiency')

    def test_mac_mapping_uses_logical_ids_not_performance_level_order(self):
        result = REPORT.mac_topology([{'IORegistryEntryChildren': [
            {'logical-cpu-id': 0, 'cluster-type': b'E\0'},
            {'logical-cpu-id': 6, 'cluster-type': b'P\0'},
            {'logical-cpu-id': 9, 'cluster-type': b'future\0'},
        ]}])
        self.assertEqual(result, {0:'efficiency', 6:'performance', 9:'unknown'})

    def test_counter_reset_stays_unavailable(self):
        self.assertEqual(REPORT.rates((100, 200), (99, 300), 1), (None, 0.0))
        self.assertEqual(REPORT.rates(None, (99, 300), 1), (None, None))
        self.assertEqual(REPORT.rates((0, 0), (2*REPORT.MIB, REPORT.MIB), 2), (1, 0.5))

    def test_cpu_time_supports_mac_fractional_seconds_and_days(self):
        self.assertEqual(REPORT.cpu_time('1:02.50'), 62.5)
        self.assertEqual(REPORT.cpu_time('2-01:02:03'), 176523)

    def test_process_cpu_is_interval_based_and_pid_reuse_is_not_activity(self):
        before = {1:(2, 1, 'old', 'start-a'), 2:(3, 2, 'same', 'start-b')}
        after = {1:(5, 3, 'new', 'start-c'), 2:(4, 2, 'same\n', 'start-b')}
        rows = {row['pid']:row for row in REPORT.top_processes(before, after, 2)}
        self.assertIsNone(rows[1]['cpu_cores'])
        self.assertEqual(rows[2]['cpu_cores'], 0.5)
        self.assertEqual(rows[2]['name'], 'same')
        self.assertNotIn('start-b', str(rows))
        self.assertIsNone(REPORT.top_processes(None, after, 2))

    def test_top_rows_include_both_cpu_and_memory_leaders_with_a_bound(self):
        before = {i:(0, 0, f'p{i}', str(i)) for i in range(1, 51)}
        after = {i:(i, 51-i, f'p{i}', str(i)) for i in range(1, 51)}
        rows = REPORT.top_processes(before, after, 1)
        self.assertEqual(len(rows), 20)
        self.assertIn(1, [row['pid'] for row in rows])
        self.assertIn(50, [row['pid'] for row in rows])

    def test_ingest_reuses_only_the_existing_health_origin(self):
        self.assertEqual(REPORT.activity_url('https://example.test/api/machine-health/ingest'), 'https://example.test/api/machine-health/activity/ingest')
        with self.assertRaises(ValueError):
            REPORT.activity_url('https://example.test/unrelated')


if __name__ == '__main__':
    unittest.main()
