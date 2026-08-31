import { client } from '@/app/lib/db/db';
import { z } from 'zod';

const codexQuotaSourceSchema = z.enum(['big-red', 'macbook-air']);
const codexQuotaLimitIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_.:-]+$/);

export const codexQuotaSampleSchema = z.object({
  observed_at: z.string().datetime({ offset: true }),
  limit_id: codexQuotaLimitIdSchema,
  window_minutes: z.number().int().min(1).max(525_600),
  used_percent: z.number().finite().min(0).max(100),
  resets_at: z.string().datetime({ offset: true }).nullable(),
});

export const codexQuotaEnvelopeSchema = z
  .object({
    source: codexQuotaSourceSchema,
    collected_at: z.string().datetime({ offset: true }),
    quota_samples: z.array(codexQuotaSampleSchema).max(4_096).optional(),
  })
  .superRefine((report, context) => {
    const keys = (report.quota_samples ?? []).map(
      sample =>
        `${sample.observed_at}\u0000${sample.limit_id}\u0000${sample.window_minutes}`
    );
    if (new Set(keys).size !== keys.length)
      context.addIssue({
        code: 'custom',
        path: ['quota_samples'],
        message: 'Codex quota samples must be unique within a report',
      });
  });

export type CodexQuotaSample = {
  source: z.infer<typeof codexQuotaSourceSchema>;
  observedAt: string;
  limitId: string;
  windowMinutes: number;
  usedPercent: number;
  resetsAt: string | null;
};

export async function saveCodexQuotaReport(
  report: z.infer<typeof codexQuotaEnvelopeSchema>
) {
  const samples = report.quota_samples ?? [];
  if (samples.length === 0) return { samples: 0 };

  await client.begin(async sql => {
    for (const sample of samples) {
      await sql`
        INSERT INTO codex_quota_samples (
          source,
          observed_at,
          limit_id,
          window_minutes,
          used_percent,
          resets_at,
          collected_at
        ) VALUES (
          ${report.source},
          ${sample.observed_at},
          ${sample.limit_id},
          ${sample.window_minutes},
          ${sample.used_percent},
          ${sample.resets_at},
          ${report.collected_at}
        )
        ON CONFLICT (source, observed_at, limit_id, window_minutes)
        DO UPDATE SET
          used_percent = EXCLUDED.used_percent,
          resets_at = EXCLUDED.resets_at,
          collected_at = GREATEST(
            codex_quota_samples.collected_at,
            EXCLUDED.collected_at
          )
        WHERE codex_quota_samples.collected_at <= EXCLUDED.collected_at
      `;
    }

    await sql`
      DELETE FROM codex_quota_samples
      WHERE observed_at < now() - interval '365 days'
    `;
  });

  return { samples: samples.length };
}

export async function readCodexQuotaSamples(days = 30): Promise<CodexQuotaSample[]> {
  const boundedDays = Math.max(1, Math.min(365, Math.floor(days)));
  const rows = await client<
    {
      source: CodexQuotaSample['source'];
      observed_at: Date | string;
      limit_id: string;
      window_minutes: number;
      used_percent: number;
      resets_at: Date | string | null;
    }[]
  >`
    SELECT
      source,
      observed_at,
      limit_id,
      window_minutes,
      used_percent,
      resets_at
    FROM codex_quota_samples
    WHERE observed_at >= now() - (${boundedDays}::int * interval '1 day')
    ORDER BY observed_at ASC, source ASC
  `;

  return rows.map(row => ({
    source: row.source,
    observedAt: new Date(row.observed_at).toISOString(),
    limitId: row.limit_id,
    windowMinutes: row.window_minutes,
    usedPercent: Number(row.used_percent),
    resetsAt: row.resets_at === null ? null : new Date(row.resets_at).toISOString(),
  }));
}
