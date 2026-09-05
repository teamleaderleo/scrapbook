import { describe, expect, it } from 'vitest';
import {
  activitySnapshotSchema,
  publicActivitySnapshot,
  summarizeCores,
} from './machine-activity';
import { activitySnapshot } from '@/tests/fixtures/machine-activity';

describe('Activity telemetry', () => {
  it('keeps process identity out of the public projection and history', () => {
    const projection = publicActivitySnapshot({
      ...activitySnapshot,
      other_private_field: 'secret',
    } as typeof activitySnapshot);
    expect(JSON.stringify(projection)).not.toContain('PRIVATE-PROCESS');
    expect(projection).not.toHaveProperty('processes');
    expect(projection).not.toHaveProperty('other_private_field');
  });
  it('normalizes each core group by its own capacity', () => {
    const groups = summarizeCores(activitySnapshot.cpu.cores);
    expect(groups.map(group => [group.kind, group.count])).toEqual([
      ['performance', 2],
      ['efficiency', 1],
      ['low-power-efficiency', 1],
    ]);
    expect(groups[0].consumed).toBeCloseTo(1.2);
    expect(groups[0].percent).toBeCloseTo(60);
    expect(groups[2].percent).toBe(5);
  });
  it('rejects duplicate cores, impossible memory, and unbounded process rows', () => {
    expect(activitySnapshotSchema.safeParse(activitySnapshot).success).toBe(
      true
    );
    expect(
      activitySnapshotSchema.safeParse({
        ...activitySnapshot,
        cpu: {
          ...activitySnapshot.cpu,
          cores: [activitySnapshot.cpu.cores[0], activitySnapshot.cpu.cores[0]],
        },
      }).success
    ).toBe(false);
    expect(
      activitySnapshotSchema.safeParse({
        ...activitySnapshot,
        memory: { ...activitySnapshot.memory, used_gib: 999 },
      }).success
    ).toBe(false);
    expect(
      activitySnapshotSchema.safeParse({
        ...activitySnapshot,
        processes: Array(21).fill(activitySnapshot.processes![0]),
      }).success
    ).toBe(false);
  });
});

it('accepts the macOS kernel process at PID zero', () => {
  expect(
    activitySnapshotSchema.safeParse({
      ...activitySnapshot,
      processes: [{ pid: 0, name: 'kernel_task', cpu_cores: 1, rss_mib: 100 }],
    }).success
  ).toBe(true);
});
