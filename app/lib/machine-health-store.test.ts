import { describe, expect, it } from 'vitest';

import {
  evaluateMachineHealth,
  machineHealthPayloadSchema,
} from './machine-health-store';
import { healthyMachineReport } from '@/tests/fixtures/machine-health';

describe('machine health contract', () => {
  it('accepts the bounded report and strips unknown fields at every level', () => {
    const parsed = machineHealthPayloadSchema.parse({
      ...healthyMachineReport,
      private_ip: 'must-not-survive',
      hygiene: {
        ...healthyMachineReport.hygiene,
        process_arguments: ['must-not-survive'],
      },
    });

    expect(parsed).toEqual(healthyMachineReport);
  });

  it('rejects a host name or payload shape outside the single-machine contract', () => {
    expect(
      machineHealthPayloadSchema.safeParse({
        ...healthyMachineReport,
        host: 'other-host',
      }).success
    ).toBe(false);
    expect(
      machineHealthPayloadSchema.safeParse({
        ...healthyMachineReport,
        memory: { used_percent: 101, total_gib: 32 },
      }).success
    ).toBe(false);
  });

  it('classifies operator thresholds without treating ordinary load as an incident', () => {
    expect(evaluateMachineHealth(healthyMachineReport)).toEqual({
      state: 'healthy',
      reasons: [],
    });
    expect(
      evaluateMachineHealth({
        ...healthyMachineReport,
        disk: { root_used_percent: 82, root_free_gib: 100 },
      }).state
    ).toBe('watch');
    expect(
      evaluateMachineHealth({
        ...healthyMachineReport,
        services: { ...healthyMachineReport.services, failed_user_units: 1 },
      }).state
    ).toBe('attention');
    expect(
      evaluateMachineHealth({
        ...healthyMachineReport,
        power: {
          ...healthyMachineReport.power,
          idle_suspend_ac: 'suspend',
        },
      }).state
    ).toBe('watch');
  });
});
