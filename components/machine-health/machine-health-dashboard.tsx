import {
  evaluateMachineHealth,
  type MachineHealthSample,
  type StoredMachineHealth,
} from '@/app/lib/machine-health-store';
import type { ReactNode } from 'react';
import { MachineHealthActivity } from './machine-health-activity';
import { MachineHealthTimestamp } from './machine-health-timestamp';

const HOUR_MS = 60 * 60 * 1_000;

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatDuration(seconds: number) {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
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
  const stale = ageHours > 3;
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
  const idleSuspendDisabled =
    payload.power.idle_suspend_ac === 'nothing' &&
    payload.power.idle_suspend_battery === 'nothing';
  const serviceRows = [
    ['SSH', payload.services.ssh],
    ['Tailscale', payload.services.tailscale],
    ['NetworkManager', payload.services.network_manager],
    ['Time sync', payload.services.time_sync],
  ] as const;
  const battery =
    payload.power.battery_percent === null
      ? '—'
      : `${Math.round(payload.power.battery_percent)}%`;
  const powerNote =
    payload.power.on_ac === null
      ? payload.power.battery_state
      : payload.power.on_ac
        ? `AC · ${payload.power.battery_state}`
        : payload.power.battery_state;
  const graphicsClock =
    payload.graphics.clock_mhz === null
      ? '—'
      : `${Math.round(payload.graphics.clock_mhz)} MHz`;

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
          </div>
          <MachineHealthTimestamp
            checkedAt={report.checkedAt}
            sampleCount={samples.length}
          />
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
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        aria-label="Current resource use"
      >
        <Metric
          label={
            payload.activity.source === 'sysstat-10m'
              ? 'CPU · hourly avg'
              : 'CPU · point'
          }
          value={formatPercent(payload.cpu.used_percent)}
          note={`${formatPercent(payload.activity.cpu_peak_percent)} peak · ${payload.activity.sample_count} sample${payload.activity.sample_count === 1 ? '' : 's'}`}
        />
        <Metric
          label={
            payload.activity.source === 'sysstat-10m'
              ? 'Memory · hourly avg'
              : 'Memory · point'
          }
          value={formatPercent(payload.memory.used_percent)}
          note={`${formatPercent(payload.activity.memory_peak_percent)} peak · ${payload.memory.total_gib.toFixed(0)} GiB`}
        />
        <Metric
          label="Root disk"
          value={formatPercent(payload.disk.root_used_percent)}
          note={`${payload.disk.root_free_gib.toFixed(0)} GiB free`}
        />
        <Metric
          label="Temperature"
          value={
            payload.temperature.peak_sensor_c === null
              ? '—'
              : `${Math.round(payload.temperature.peak_sensor_c)} °C`
          }
          note="peak readable sensor"
        />
        <Metric
          label="iGPU clock"
          value={graphicsClock}
          note={
            payload.graphics.max_clock_mhz === null
              ? 'busy % unavailable'
              : `${Math.round(payload.graphics.max_clock_mhz)} MHz ceiling`
          }
        />
        <Metric label="Battery" value={battery} note={powerNote} />
      </section>

      <MachineHealthActivity
        samples={samples}
        now={now}
        graphicsMaxClockMhz={payload.graphics.max_clock_mhz}
        latestActivity={payload.activity}
        latestCodexUsage={payload.codex_usage}
      />

      <section className="grid gap-3 lg:grid-cols-[1.25fr_1fr]">
        <div
          className="rounded-2xl border border-black/10 p-5 dark:border-white/10"
          style={{
            backgroundColor:
              'light-dark(rgba(255,255,255,0.5), rgba(0,0,0,0.15))',
          }}
        >
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
            <Pill good={idleSuspendDisabled}>
              Idle suspend: {idleSuspendDisabled ? 'off' : 'changed'}
            </Pill>
            <Pill good={payload.power.hibernate_targets_masked}>
              Hibernate:{' '}
              {payload.power.hibernate_targets_masked ? 'masked' : 'changed'}
            </Pill>
            <Pill good={failedUnits === 0}>Failed units: {failedUnits}</Pill>
          </div>
        </div>
        <div
          className="rounded-2xl border border-black/10 p-5 dark:border-white/10"
          style={{
            backgroundColor:
              'light-dark(rgba(255,255,255,0.5), rgba(0,0,0,0.15))',
          }}
        >
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
            Uptime {formatDuration(payload.uptime_seconds)}.
          </p>
        </div>
      </section>

      <footer className="px-2 py-1 text-xs opacity-50">
        Hourly snapshots · 90-day history
      </footer>
    </div>
  );
}
