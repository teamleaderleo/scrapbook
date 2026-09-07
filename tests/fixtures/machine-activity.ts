import type { ActivitySnapshot } from '@/app/lib/machine-activity';
export const activitySnapshot: ActivitySnapshot = {
  schema_version: 1,
  host: 'big-red',
  checked_at: '2026-09-05T03:00:00Z',
  sample_seconds: 2,
  cpu: {
    model: 'Intel Core Ultra',
    cores: [
      { id: 0, kind: 'performance', used_percent: 80 },
      { id: 1, kind: 'performance', used_percent: 40 },
      { id: 2, kind: 'efficiency', used_percent: 20 },
      { id: 3, kind: 'low-power-efficiency', used_percent: 5 },
    ],
  },
  memory: {
    total_gib: 30,
    used_gib: 15,
    available_gib: 15,
    swap_used_gib: 0.1,
    swap_total_gib: 8,
    wired_gib: null,
    compressed_gib: null,
    pressure: 'unknown',
    pressure_stall_percent: 0.2,
  },
  network: { rx_mib_s: 3, tx_mib_s: 1 },
  disk: { read_mib_s: 4, write_mib_s: 2 },
  panel: {
    source: 'sysfs-backlight',
    state: 'off',
    actual_brightness_percent: 0,
  },
  power: {
    primary: {
      watts: 28.4,
      scope: 'platform',
      source: 'intel-rapl-psys',
      quality: 'measured',
    },
    platform: {
      watts: 28.4,
      scope: 'platform',
      source: 'intel-rapl-psys',
      quality: 'measured',
    },
    package: {
      watts: 16.2,
      scope: 'cpu-package',
      source: 'intel-rapl-package',
      quality: 'measured',
    },
    system_load: null,
    adapter_input: null,
    battery_flow: null,
  },
  vm: {
    state: 'running',
    vcpus: 14,
    allocated_gib: 12,
    resident_gib: 11.9,
    cpu_cores: 0.3,
  },
  process_count: 123,
  processes: [
    { pid: 123, name: 'PRIVATE-PROCESS', cpu_cores: 1.2, rss_mib: 1024 },
  ],
  observer: { cpu_ms: 60, wall_ms: 2300 },
};
