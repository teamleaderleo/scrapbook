import type { MachineHealthPayload } from '@/app/lib/machine-health-store';

export const healthyMachineReport: MachineHealthPayload = {
  schema_version: 1,
  host: 'big-red',
  checked_at: '2026-08-29T06:00:00.000Z',
  uptime_seconds: 86_400,
  load: { one: 1.6, five: 1.4, fifteen: 1.2, logical_cpus: 16 },
  cpu: { used_percent: 12 },
  memory: { used_percent: 24, total_gib: 32 },
  disk: { root_used_percent: 12, root_free_gib: 800 },
  temperature: { peak_sensor_c: 58 },
  graphics: { clock_mhz: 450, max_clock_mhz: 2_250 },
  services: {
    failed_system_units: 0,
    failed_user_units: 0,
    ssh: 'active',
    tailscale: 'active',
    network_manager: 'active',
    time_sync: 'active',
  },
  network: {
    connectivity: 'full',
    tailscale_backend: 'running',
    tailscale_self_online: true,
    rx_mib_s: 0.8,
    tx_mib_s: 0.2,
  },
  power: {
    profile: 'balanced',
    idle_suspend_ac: 'nothing',
    idle_suspend_battery: 'nothing',
    hibernate_targets_masked: true,
    on_ac: true,
    battery_percent: 100,
    battery_state: 'full',
  },
  hygiene: {
    browser_roots: 1,
    codex_workers: 2,
    unexpected_dev_listeners: 0,
  },
};
