import type { MachineHealthPayload } from '@/app/lib/machine-health-store';

export const healthyMachineReport: MachineHealthPayload = {
  schema_version: 1,
  host: 'big-red',
  checked_at: '2026-08-29T06:00:00.000Z',
  uptime_seconds: 86_400,
  load: { one: 1.6, five: 1.4, fifteen: 1.2, logical_cpus: 16 },
  memory: { used_percent: 24, total_gib: 32 },
  disk: { root_used_percent: 12, root_free_gib: 800 },
  temperature: { peak_sensor_c: 58 },
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
  },
  power: { profile: 'balanced', sleep_targets_masked: true },
  hygiene: {
    browser_roots: 1,
    codex_workers: 2,
    unexpected_dev_listeners: 0,
  },
};
