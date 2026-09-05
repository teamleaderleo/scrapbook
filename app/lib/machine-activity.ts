import { z } from 'zod';

const nonnegative = z.number().finite().min(0);
const percent = nonnegative.max(100);
export const coreKindSchema = z.enum([
  'performance',
  'efficiency',
  'low-power-efficiency',
  'unknown',
]);
export type CoreKind = z.infer<typeof coreKindSchema>;
export const activitySnapshotSchema = z.object({
  schema_version: z.literal(1),
  host: z.enum(['big-red', 'macbook-air']),
  checked_at: z.string().datetime({ offset: true }),
  sample_seconds: nonnegative.min(0.2).max(30),
  cpu: z
    .object({
      model: z.string().min(1).max(100),
      cores: z
        .array(
          z.object({
            id: z.number().int().min(0).max(1023),
            kind: coreKindSchema,
            used_percent: percent,
          })
        )
        .min(1)
        .max(256),
    })
    .superRefine((cpu, context) => {
      if (new Set(cpu.cores.map(core => core.id)).size !== cpu.cores.length)
        context.addIssue({ code: 'custom', message: 'CPU IDs must be unique' });
    }),
  memory: z
    .object({
      total_gib: nonnegative.positive(),
      used_gib: nonnegative,
      available_gib: nonnegative,
      swap_used_gib: nonnegative,
      swap_total_gib: nonnegative,
      wired_gib: nonnegative.nullable(),
      compressed_gib: nonnegative.nullable(),
      pressure: z.enum(['normal', 'warning', 'critical', 'unknown']),
      pressure_stall_percent: percent.nullable(),
    })
    .superRefine((memory, context) => {
      if (
        memory.used_gib > memory.total_gib ||
        memory.swap_used_gib > memory.swap_total_gib ||
        Math.abs(memory.used_gib + memory.available_gib - memory.total_gib) >
          0.03
      )
        context.addIssue({
          code: 'custom',
          message: 'Memory accounting is inconsistent',
        });
    }),
  network: z.object({
    rx_mib_s: nonnegative.nullable(),
    tx_mib_s: nonnegative.nullable(),
  }),
  disk: z.object({
    read_mib_s: nonnegative.nullable(),
    write_mib_s: nonnegative.nullable(),
  }),
  vm: z
    .object({
      state: z.enum([
        'running',
        'paused',
        'stopping',
        'off',
        'crashed',
        'suspended',
      ]),
      vcpus: nonnegative.int().max(1024).nullable(),
      allocated_gib: nonnegative.nullable(),
      resident_gib: nonnegative.nullable(),
      cpu_cores: nonnegative.max(1024).nullable(),
    })
    .nullable(),
  process_count: z.number().int().min(0).max(100000).nullable(),
  processes: z
    .array(
      z.object({
        pid: z.number().int().min(0),
        name: z.string().min(1).max(80),
        cpu_cores: nonnegative.max(1024).nullable(),
        rss_mib: nonnegative,
      })
    )
    .max(20)
    .nullable(),
  observer: z.object({ cpu_ms: nonnegative, wall_ms: nonnegative }),
});

export type ActivitySnapshot = z.infer<typeof activitySnapshotSchema>;
export type PublicActivitySnapshot = Omit<ActivitySnapshot, 'processes'>;
export type ActivitySnapshotView = PublicActivitySnapshot & {
  processes?: ActivitySnapshot['processes'];
};
export type ActivityMonitorData = {
  observedAt: string;
  privateAccess: boolean;
  latest: ActivitySnapshotView[];
  history: PublicActivitySnapshot[];
};

// Enumerate the public projection: new private fields must never hitch a ride.
export function publicActivitySnapshot(
  value: ActivitySnapshot
): PublicActivitySnapshot {
  return {
    schema_version: value.schema_version,
    host: value.host,
    checked_at: value.checked_at,
    sample_seconds: value.sample_seconds,
    cpu: value.cpu,
    memory: value.memory,
    network: value.network,
    disk: value.disk,
    vm: value.vm,
    process_count: value.process_count,
    observer: value.observer,
  };
}

export const CORE_LABELS: Record<CoreKind, string> = {
  performance: 'Performance',
  efficiency: 'Efficiency',
  'low-power-efficiency': 'Low-power efficiency',
  unknown: 'Unclassified',
};

export function summarizeCores(cores: ActivitySnapshot['cpu']['cores']) {
  return (Object.keys(CORE_LABELS) as CoreKind[]).flatMap(kind => {
    const included = cores.filter(core => core.kind === kind);
    if (!included.length) return [];
    const consumed = included.reduce(
      (sum, core) => sum + core.used_percent / 100,
      0
    );
    return [
      {
        kind,
        count: included.length,
        consumed,
        percent: (consumed / included.length) * 100,
      },
    ];
  });
}
