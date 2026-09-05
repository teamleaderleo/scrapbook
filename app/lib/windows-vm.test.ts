import { describe, expect, it } from 'vitest';
import {
  machineHealthPayloadSchema,
  windowsVmSchema,
} from './machine-health-store';
import { healthyMachineReport } from '@/tests/fixtures/machine-health';

describe('VM and resource measurement contract', () => {
  const vm = {
    source: 'libvirt',
    state: 'running',
    vcpus: 14,
    allocated_gib: 12,
    resident_gib: 12.2,
    cpu_cores: 2,
  };
  it('accepts older snapshots and host RSS above guest allocation', () => {
    expect(
      machineHealthPayloadSchema.safeParse(healthyMachineReport).success
    ).toBe(true);
    expect(windowsVmSchema.safeParse(vm).success).toBe(true);
    expect(windowsVmSchema.safeParse({ source: 'unavailable' }).success).toBe(
      true
    );
  });
  it('rejects invalid numeric telemetry and impossible RAM usage', () => {
    for (const field of [
      'vcpus',
      'allocated_gib',
      'resident_gib',
      'cpu_cores',
    ]) {
      expect(windowsVmSchema.safeParse({ ...vm, [field]: -1 }).success).toBe(
        false
      );
      expect(
        windowsVmSchema.safeParse({ ...vm, [field]: Infinity }).success
      ).toBe(false);
    }
    expect(
      machineHealthPayloadSchema.safeParse({
        ...healthyMachineReport,
        memory: { ...healthyMachineReport.memory, current_used_gib: 10000 },
      }).success
    ).toBe(false);
  });
  it('strips unexpected domain identity fields', () => {
    expect(
      windowsVmSchema.parse({
        ...vm,
        name: 'private-domain',
        address: 'private-address',
      })
    ).toEqual(vm);
  });
});
