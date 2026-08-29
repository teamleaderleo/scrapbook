import {
  evaluateMachineHealth,
  type MachineHealthSample,
  type StoredMachineHealth,
} from '@/app/lib/machine-health-store';
import type { ReactNode } from 'react';

const HOUR_MS = 60 * 60 * 1_000;

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatDuration(seconds: number) {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}

function formatTimestamp(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
  }).format(new Date(value));
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="bg-white/52 dark:bg-black/12 rounded-xl border border-black/10 p-4 dark:border-white/10">
      <p className="opacity-55 text-[0.68rem] font-bold uppercase tracking-[0.16em]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tabular-nums tracking-tight">
        {value}
      </p>
      {note ? <p className="mt-1 text-xs opacity-60">{note}</p> : null}
    </div>
  );
}

function Pill({
  children,
  good = true,
}: {
  children: ReactNode;
  good?: boolean;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${good ? 'border-emerald-700/25 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200' : 'border-amber-700/25 bg-amber-500/10 text-amber-950 dark:text-amber-100'}`}
    >
      {children}
    </span>
  );
}

function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2)
    return (
      <div className="grid h-16 place-items-center text-xs opacity-50">
        More snapshots needed
      </div>
    );
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, 1);
  const points = values
    .map(
      (value, index) =>
        `${(index / (values.length - 1)) * 100},${40 - ((value - min) / spread) * 34}`
    )
    .join(' ');
  return (
    <svg
      className="h-16 w-full overflow-visible"
      viewBox="0 0 100 44"
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Trend({
  title,
  value,
  values,
}: {
  title: string;
  value: string;
  values: number[];
}) {
  return (
    <div className="bg-white/48 dark:bg-black/12 rounded-xl border border-black/10 p-4 dark:border-white/10">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-bold">{title}</h3>
        <span className="font-mono text-sm tabular-nums opacity-70">
          {value}
        </span>
      </div>
      <div className="mt-3 text-[#a8342e] dark:text-[#ef8f87]">
        <Sparkline
          values={values}
          label={`${title} over the available 30-day history`}
        />
      </div>
    </div>
  );
}

export function MachineHealthDashboard({
  report,
  samples,
  now,
}: {
  report: StoredMachineHealth;
  samples: MachineHealthSample[];
  now: number;
}) {
  const payload = report.payload;
  const assessment = evaluateMachineHealth(payload);
  const ageHours = Math.max(0, (now - Date.parse(report.checkedAt)) / HOUR_MS);
  const stale = ageHours > 36;
  const state =
    stale && assessment.state === 'healthy' ? 'watch' : assessment.state;
  const reasons = stale
    ? [`Snapshot is ${Math.floor(ageHours)} hours old.`, ...assessment.reasons]
    : assessment.reasons;
  const stateLabel =
    state === 'healthy'
      ? 'Looks good'
      : state === 'watch'
        ? 'Worth a look'
        : 'Needs attention';
  const failedUnits =
    payload.services.failed_system_units + payload.services.failed_user_units;
  const serviceRows = [
    ['SSH', payload.services.ssh],
    ['Tailscale', payload.services.tailscale],
    ['NetworkManager', payload.services.network_manager],
    ['Time sync', payload.services.time_sync],
  ] as const;

  return (
    <div className="grid gap-3">
      <section
        className={`rounded-2xl border p-5 sm:p-6 ${state === 'healthy' ? 'bg-emerald-100/45 dark:border-emerald-300/15 border-emerald-800/20 dark:bg-emerald-950/20' : state === 'watch' ? 'bg-amber-100/55 dark:border-amber-300/15 border-amber-800/20 dark:bg-amber-950/20' : 'bg-red-100/55 border-red-900/25 dark:border-red-300/20 dark:bg-red-950/25'}`}
      >
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="opacity-55 text-[0.68rem] font-black uppercase tracking-[0.2em]">
              Big Red · health check
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {stateLabel}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 opacity-70">
              Sanitized workstation signals only. No IP addresses, URLs, tab
              titles, command lines, ports, peer names, or secrets are
              collected.
            </p>
          </div>
          <div className="opacity-65 shrink-0 text-left text-xs leading-5 sm:text-right">
            <p>{formatTimestamp(report.checkedAt, 'Asia/Shanghai')}</p>
            <p>{formatTimestamp(report.checkedAt, 'America/Vancouver')}</p>
            <p className="mt-1 font-mono">
              {samples.length} snapshots · 30d view
            </p>
          </div>
        </div>
        {reasons.length > 0 ? (
          <ul className="border-current/10 mt-5 grid gap-2 border-t pt-4 text-sm">
            {reasons.map(reason => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
        ) : (
          <p className="border-current/10 mt-5 border-t pt-4 text-sm">
            No configured guardrail is currently tripped.
          </p>
        )}
      </section>

      <section
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Current resource use"
      >
        <Metric
          label="Root disk"
          value={formatPercent(payload.disk.root_used_percent)}
          note={`${payload.disk.root_free_gib.toFixed(0)} GiB free`}
        />
        <Metric
          label="Memory"
          value={formatPercent(payload.memory.used_percent)}
          note={`${payload.memory.total_gib.toFixed(0)} GiB installed`}
        />
        <Metric
          label="Load / CPU"
          value={(payload.load.one / payload.load.logical_cpus).toFixed(2)}
          note={`${payload.load.logical_cpus} logical CPUs`}
        />
        <Metric
          label="Uptime"
          value={formatDuration(payload.uptime_seconds)}
          note={
            payload.temperature.peak_sensor_c === null
              ? 'Temperature unavailable'
              : `${Math.round(payload.temperature.peak_sensor_c)} °C peak sensor`
          }
        />
      </section>

      <section
        className="grid gap-3 lg:grid-cols-3"
        aria-label="Thirty-day trends"
      >
        <Trend
          title="Root disk"
          value={formatPercent(payload.disk.root_used_percent)}
          values={samples.map(sample => sample.rootUsedPercent)}
        />
        <Trend
          title="Memory"
          value={formatPercent(payload.memory.used_percent)}
          values={samples.map(sample => sample.memoryUsedPercent)}
        />
        <Trend
          title="Load per CPU"
          value={(payload.load.one / payload.load.logical_cpus).toFixed(2)}
          values={samples.map(sample => sample.loadPerCpu)}
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.25fr_1fr]">
        <div className="dark:bg-black/12 rounded-2xl border border-black/10 bg-white/50 p-5 dark:border-white/10">
          <h2 className="text-lg font-black">Guardrails</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {serviceRows.map(([name, value]) => (
              <Pill key={name} good={value === 'active'}>
                {name}: {value}
              </Pill>
            ))}
            <Pill good={payload.network.connectivity === 'full'}>
              Network: {payload.network.connectivity}
            </Pill>
            <Pill good={payload.network.tailscale_backend === 'running'}>
              Tailnet: {payload.network.tailscale_backend}
            </Pill>
            <Pill good={payload.power.sleep_targets_masked}>
              Sleep targets:{' '}
              {payload.power.sleep_targets_masked ? 'masked' : 'changed'}
            </Pill>
            <Pill good={failedUnits === 0}>Failed units: {failedUnits}</Pill>
          </div>
        </div>
        <div className="dark:bg-black/12 rounded-2xl border border-black/10 bg-white/50 p-5 dark:border-white/10">
          <h2 className="text-lg font-black">Workspace hygiene</h2>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <dt className="opacity-55 text-xs">Browsers</dt>
              <dd className="mt-1 text-xl font-black tabular-nums">
                {payload.hygiene.browser_roots}
              </dd>
            </div>
            <div>
              <dt className="opacity-55 text-xs">Codex workers</dt>
              <dd className="mt-1 text-xl font-black tabular-nums">
                {payload.hygiene.codex_workers}
              </dd>
            </div>
            <div>
              <dt className="opacity-55 text-xs">Dev listeners</dt>
              <dd className="mt-1 text-xl font-black tabular-nums">
                {payload.hygiene.unexpected_dev_listeners}
              </dd>
            </div>
          </dl>
          <p className="opacity-55 mt-4 text-xs leading-5">
            Counts are aggregate and intentionally omit names, arguments, ports,
            and ownership details.
          </p>
        </div>
      </section>

      <footer className="px-2 py-1 text-xs opacity-50">
        Daily is enough. The page shows 30 days; ingestion deletes samples older
        than 90 days.
      </footer>
    </div>
  );
}
