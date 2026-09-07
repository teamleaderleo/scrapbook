#!/usr/bin/env python3
import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

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

    def test_rapl_energy_delta_and_wrap(self):
        self.assertEqual(REPORT.rapl_delta_watts(1_000_000, 5_000_000, 100_000_000, 2), 2)
        self.assertEqual(REPORT.rapl_delta_watts(95_000_000, 5_000_000, 100_000_000, 2), 5)

    def test_rapl_frozen_reset_and_impossible_delta_stay_unavailable(self):
        self.assertIsNone(REPORT.rapl_delta_watts(5, 5, 100, 2))
        self.assertIsNone(REPORT.rapl_delta_watts(50, 10, 100, 2))
        self.assertIsNone(REPORT.rapl_delta_watts(1, 9_000_000_001, 10_000_000_000, 2))

    def test_psys_is_primary_and_package_is_not_added_to_it(self):
        before = {'captured_at': 1.0, 'domains': [
            {'name':'psys', 'energy_uj':1_000_000, 'max_energy_range_uj':100_000_000, 'key':'psys'},
            {'name':'package-0', 'energy_uj':2_000_000, 'max_energy_range_uj':100_000_000, 'key':'package-0'},
        ]}
        after = {'captured_at': 3.0, 'domains': [
            {'name':'psys', 'energy_uj':21_000_000, 'max_energy_range_uj':100_000_000, 'key':'psys'},
            {'name':'package-0', 'energy_uj':10_000_000, 'max_energy_range_uj':100_000_000, 'key':'package-0'},
        ]}
        with patch.object(REPORT, 'rapl_energy_snapshot', return_value=after):
            power = REPORT.linux_rapl_power(before)
        self.assertEqual(power['primary'], power['platform'])
        self.assertEqual(power['platform']['watts'], 10)
        self.assertEqual(power['package']['watts'], 4)

    def test_package_only_fallback_remains_labeled_cpu_package(self):
        before = {'captured_at': 1.0, 'domains': [
            {'name':'package-0', 'energy_uj':2_000_000, 'max_energy_range_uj':100_000_000, 'key':'package-0'},
        ]}
        after = {'captured_at': 3.0, 'domains': [
            {'name':'package-0', 'energy_uj':10_000_000, 'max_energy_range_uj':100_000_000, 'key':'package-0'},
        ]}
        with patch.object(REPORT, 'rapl_energy_snapshot', return_value=after):
            power = REPORT.linux_rapl_power(before)
        self.assertIsNone(power['platform'])
        self.assertEqual(power['primary']['scope'], 'cpu-package')
        self.assertEqual(power['primary']['watts'], 4)

    def test_apple_power_telemetry_is_unit_checked_and_labeled(self):
        document = [{
            'Voltage': 12898,
            'InstantAmperage': -629,
            'PowerTelemetryData': {
                'SystemPowerIn': 538,
                'SystemLoad': 8650,
                'SystemVoltageIn': 20158,
                'SystemCurrentIn': 26,
                'BatteryPower': -8112,
                'AdapterEfficiencyLoss': -2,
            },
            'Serial': 'must-not-escape',
        }]
        power = REPORT.apple_power(document)
        self.assertEqual(power['primary'], power['system_load'])
        self.assertEqual(power['system_load']['watts'], 8.65)
        self.assertEqual(power['adapter_input']['watts'], 0.538)
        self.assertEqual(power['battery_flow']['scope'], 'battery-output')
        self.assertEqual(power['battery_flow']['watts'], 8.112)
        self.assertNotIn('Serial', str(power))

    def test_apple_input_voltage_current_sanity_check_rejects_mismatch(self):
        power = REPORT.apple_power([{'PowerTelemetryData': {
            'SystemPowerIn': 10_000,
            'SystemVoltageIn': 20_000,
            'SystemCurrentIn': 25,
        }}])
        self.assertIsNone(power['adapter_input'])
        self.assertIsNone(power['primary'])

    def test_apple_signed_battery_amperage_accepts_wrapped_values(self):
        wrapped = (1 << 16) - 500
        power = REPORT.apple_power([{'Voltage': 10_000, 'InstantAmperage': wrapped}])
        self.assertEqual(REPORT.signed_apple_integer((1 << 32) - 500), -500)
        self.assertEqual(REPORT.signed_apple_integer((1 << 64) - 500), -500)
        self.assertEqual(power['battery_flow']['scope'], 'battery-output')
        self.assertEqual(power['battery_flow']['watts'], 5)
        self.assertEqual(power['primary'], power['battery_flow'])

    def test_missing_and_absurd_apple_power_stay_unavailable(self):
        self.assertEqual(REPORT.apple_power([{}]), REPORT.empty_power())
        self.assertIsNone(REPORT.power_reading(float('nan'), 'platform', 'intel-rapl-psys'))
        self.assertIsNone(REPORT.power_reading(501, 'platform', 'intel-rapl-psys'))
        power = REPORT.apple_power([{'PowerTelemetryData': {'SystemLoad': 900_000}}])
        self.assertIsNone(power['system_load'])

    def test_privileged_rapl_projection_drops_paths_and_unknown_domains(self):
        domains = REPORT.parsed_rapl_domains([
            {'name':'psys', 'energy_uj':10, 'max_energy_range_uj':100, 'path':'private'},
            {'name':'core', 'energy_uj':20, 'max_energy_range_uj':100},
        ])
        self.assertEqual(domains, [{'name':'psys', 'energy_uj':10, 'max_energy_range_uj':100, 'key':'psys'}])
        self.assertNotIn('path', str(domains))


if __name__ == '__main__':
    unittest.main()
