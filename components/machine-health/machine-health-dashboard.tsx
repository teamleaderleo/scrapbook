import {
  type CodexTokenSample,
  evaluateMachineHealth,
  type MachineHealthSample,
  type StoredMachineHealth,
} from '@/app/lib/machine-health-store';
import type { ReactNode } from 'react';
import { MachineHealthActivity } from './machine-health-activity';
import { MachineHealthTimestamp } from './machine-health-timestamp';

const HOUR_MS = 60 * 60 * 1_000;
const MIB = 1_024 ** 2;
const GIB = 1_024 ** 3;

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatDuration(seconds: number) {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}

function formatGib(value: number) {
  return `${value.toFixed(1)} GiB`;
}

function formatMemory(bytes: number) {
  return bytes < GIB
    ? `${Math.round(bytes / MIB)} MiB`
    : `${(bytes / GIB).toFixed(1)} GiB`;
}

function formatMemoryDelta(bytes: number) {
  const sign = bytes >= 0 ? '+' : '−';
  return `${sign}${formatMemory(Math.abs(bytes))} / 7d`;
}

function formatCpuTime(microseconds: number) {
  if (microseconds < 1_000_000) return `${Math.round(microseconds / 1_000)} ms`;
  const seconds = microseconds / 1_000_000;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)} s`;
  const minutes = seconds / 60;
  return `${minutes.toFixed(minutes < 10 ? 1 : 0)} min`;
}

function formatRefresh(value: number) {
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)} Hz`;
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
  codexSamples = [],
  now,
}: {
  report: StoredMachineHealth;
  samples: MachineHealthSample[];
  codexSamples?: CodexTokenSample[];
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
  const reliability =
    payload.reliability?.source === 'journal-24h' ? payload.reliability : null;
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
  const buildState =
    payload.build_state?.source === 'filesystem' ? payload.build_state : null;
  const codexState =
    payload.codex_state?.source === 'codex-state-inventory-v1'
      ? payload.codex_state
      : null;
  const routeActivity =
    payload.route_activity?.source === 'codex-route-leases-v2'
      ? payload.route_activity
      : null;
  const processTags =
    payload.process_tags?.source === 'codex-route-hook-v1'
      ? payload.process_tags
      : null;
  const desktop =
    payload.desktop?.source === 'gnome-polish-live-v2' ? payload.desktop : null;
  const desktopNote = desktop
    ? [
        formatRefresh(desktop.refresh_hz),
        `${Math.round(desktop.logical_scale * 100)}%`,
        desktop.screen_shield_active ? 'screen blanked' : 'screen on',
      ].join(' · ')
    : 'unavailable';
  const desktopModeNote = desktop
    ? [
        `GNOME ${desktop.gnome_shell}`,
        desktop.screen_share_mode === 'mirror-primary' ? 'mirror' : 'extend',
        desktop.animations_enabled ? 'motion on' : 'motion off',
      ].join(' · ')
    : null;
  const remoteClient = payload.network.remote_client;
  const remoteServer = payload.services.gnome_remote_desktop;
  const remoteAcceleration = payload.services.gnome_remote_desktop_acceleration;
  const remoteSessions =
    payload.services.gnome_remote_desktop_sessions?.source === 'grd-journal-24h'
      ? payload.services.gnome_remote_desktop_sessions
      : null;
  const remoteAccelerationLabel =
    remoteAcceleration?.source === 'grd-current-invocation'
      ? remoteAcceleration.state === 'hardware-ready'
        ? 'VA-API ready'
        : remoteAcceleration.state === 'software-fallback'
          ? 'Software encode'
          : remoteAcceleration.state === 'awaiting-session'
            ? 'VA-API pending'
            : 'Graphics unknown'
      : null;
  const remoteState = remoteClient?.state ?? 'unavailable';
  const remoteProbe =
    remoteClient?.source === 'tailscale-status'
      ? remoteClient.transport_probe
      : undefined;
  const remoteValue =
    payload.hygiene.rdp_connections > 0
      ? 'Connected'
      : remoteState === 'offline'
        ? 'Mac offline'
        : remoteState === 'online-idle'
          ? 'Mac online'
          : remoteState === 'direct'
            ? 'Direct'
            : remoteState === 'relay'
              ? 'Relayed'
              : '—';
  const remotePath =
    remoteState === 'online-idle'
      ? 'Path idle'
      : remoteState === 'direct'
        ? 'Direct'
        : remoteState === 'relay'
          ? 'Relayed'
          : remoteState === 'unknown'
            ? 'Path unknown'
            : null;
  const remoteSessionNote = remoteSessions
    ? [
        remoteSessions.truncated ? '24h partial' : '24h',
        `${remoteSessions.session_endings} endings`,
        `${remoteSessions.transport_endings} transport`,
        remoteSessions.user_logoffs > 0
          ? `${remoteSessions.user_logoffs} logoff${remoteSessions.user_logoffs === 1 ? '' : 's'}`
          : null,
        remoteSessions.server_disconnects > 0
          ? `${remoteSessions.server_disconnects} server`
          : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : null;
  const remoteNote = [
    remoteState === 'offline' &&
    remoteClient?.last_seen_seconds_ago !== null &&
    remoteClient?.last_seen_seconds_ago !== undefined
      ? `Seen ${formatDuration(remoteClient.last_seen_seconds_ago)} ago`
      : remoteProbe
        ? `${Math.round(remoteProbe.rtt_ms)} ms`
        : remotePath,
    remoteServer ? `GRD ${remoteServer}` : null,
    remoteAccelerationLabel,
    payload.hygiene.rdp_connections > 0
      ? `${payload.hygiene.rdp_connections} RDP`
      : null,
    remoteSessionNote,
  ]
    .filter(Boolean)
    .join(' · ');
  const processCoverage =
    payload.process_coverage?.source === 'codex-process-coverage-v1'
      ? payload.process_coverage
      : null;
  const codexRuntime =
    payload.hygiene.codex_runtime?.source === 'codex-runtime-tree-v1'
      ? payload.hygiene.codex_runtime
      : null;
  const codexRuntimeNote = codexRuntime
    ? [
        `${codexRuntime.processes} proc`,
        `${codexRuntime.code_mode_hosts} code`,
        `${codexRuntime.mcp_servers} MCP`,
        codexRuntime.swap_bytes === null
          ? codexRuntime.memory_errors > 0
            ? 'memory partial'
            : null
          : `${formatMemory(codexRuntime.swap_bytes)} swap`,
      ]
        .filter(Boolean)
        .join(' · ')
    : 'unavailable';
  const processCoverageValue = processCoverage
    ? `${processCoverage.scoped_processes} / ${processCoverage.discoverable_processes}`
    : '—';
  const processCoverageNote = processCoverage
    ? [
        `${processCoverage.discoverable_roots} roots`,
        processCoverage.discoverable_rss_bytes === null
          ? null
          : formatMemory(processCoverage.discoverable_rss_bytes),
        processCoverage.scope_evidence === 'partial'
          ? 'partial visibility'
          : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : 'unavailable';
  const processTagsNote = processTags
    ? [
        `${processTags.active_main_roots} main`,
        `${processTags.active_subagents} agent${processTags.active_subagents === 1 ? '' : 's'}`,
        `${processTags.active_jobs} jobs`,
      ].join(' · ')
    : 'unavailable';
  const processTagsResourceNote = processTags
    ? [
        `${processTags.tagged_processes} proc`,
        `${formatMemory(processTags.tagged_memory_current_bytes)} memory`,
        processTags.unknown_jobs > 0
          ? `${processTags.unknown_jobs} unknown`
          : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : null;
  const routeUnknown = routeActivity
    ? (routeActivity.unknown_routes ?? 0) + (routeActivity.unknown_jobs ?? 0)
    : null;
  const routeNote = routeActivity
    ? [
        `${routeActivity.active_jobs ?? 0} jobs`,
        `${routeActivity.tagged_processes ?? 0} proc`,
        `${formatMemory(routeActivity.tagged_rss_bytes ?? 0)} RSS`,
        (routeActivity.residue_jobs ?? 0) > 0
          ? `${routeActivity.residue_jobs} residue`
          : null,
        routeUnknown && routeUnknown > 0 ? `${routeUnknown} unknown` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : 'unavailable';
  const routeResourceJobs = routeActivity?.tagged_resource_jobs ?? null;
  const routeResourceNote =
    routeActivity && routeResourceJobs !== null && routeResourceJobs > 0
      ? [
          routeActivity.tagged_memory_current_bytes === null ||
          routeActivity.tagged_memory_current_bytes === undefined
            ? null
            : `${formatMemory(routeActivity.tagged_memory_current_bytes)} memory`,
          routeActivity.largest_tagged_job_memory_peak_bytes === null ||
          routeActivity.largest_tagged_job_memory_peak_bytes === undefined
            ? null
            : `${formatMemory(routeActivity.largest_tagged_job_memory_peak_bytes)} job peak`,
          routeActivity.tagged_cpu_usage_usec === null ||
          routeActivity.tagged_cpu_usage_usec === undefined
            ? null
            : `${formatCpuTime(routeActivity.tagged_cpu_usage_usec)} CPU`,
          routeActivity.tagged_io_read_bytes === null ||
          routeActivity.tagged_io_read_bytes === undefined ||
          routeActivity.tagged_io_write_bytes === null ||
          routeActivity.tagged_io_write_bytes === undefined
            ? 'I/O —'
            : `${formatMemory(
                routeActivity.tagged_io_read_bytes +
                  routeActivity.tagged_io_write_bytes
              )} I/O`,
        ]
          .filter(Boolean)
          .join(' · ')
      : null;
  const routeCoverageNote =
    routeActivity && routeResourceJobs !== null && routeResourceJobs > 0
      ? [
          ['memory', routeActivity.tagged_memory_observed_jobs],
          ['CPU', routeActivity.tagged_cpu_observed_jobs],
          ['I/O', routeActivity.tagged_io_observed_jobs],
          ['pressure', routeActivity.tagged_pressure_observed_jobs],
        ]
          .filter(([, observed]) => observed !== routeResourceJobs)
          .map(
            ([label, observed]) =>
              `${label} ${observed ?? '—'}/${routeResourceJobs}`
          )
          .join(' · ')
      : '';
  const buildStateBaseline = [...samples]
    .reverse()
    .find(
      sample =>
        Date.parse(sample.checkedAt) <= now - 7 * 24 * HOUR_MS &&
        sample.buildStateGib !== null
    );
  const buildStateDelta =
    buildState?.total_gib != null && buildStateBaseline?.buildStateGib != null
      ? buildState.total_gib - buildStateBaseline.buildStateGib
      : null;
  const buildStateNote = buildState
    ? [
        buildState.target_count === null
          ? null
          : `${buildState.target_count} targets`,
        buildState.largest_target_gib == null
          ? null
          : `${buildState.largest_target_gib.toFixed(1)} GiB max`,
        buildState.median_target_gib == null
          ? null
          : `${buildState.median_target_gib.toFixed(1)} GiB median`,
        buildState.glaeda_cache_gib === null
          ? null
          : `${buildState.glaeda_cache_gib.toFixed(1)} GiB cache`,
        buildState.active_build_processes === null
          ? null
          : `${buildState.active_build_processes} building`,
        buildStateDelta === null
          ? null
          : `${buildStateDelta >= 0 ? '+' : ''}${buildStateDelta.toFixed(1)} GiB / 7d`,
      ]
        .filter(Boolean)
        .join(' · ')
    : 'awaiting snapshot';
  const codexStateBaseline = [...samples]
    .reverse()
    .find(
      sample =>
        Date.parse(sample.checkedAt) <= now - 7 * 24 * HOUR_MS &&
        sample.codexStateAllocatedBytes !== null
    );
  const codexStateDelta =
    codexState && codexStateBaseline?.codexStateAllocatedBytes != null
      ? codexState.allocated_bytes - codexStateBaseline.codexStateAllocatedBytes
      : null;
  const codexStateNote = codexState
    ? `${formatMemory(codexState.active_bytes)} active · ${formatMemory(codexState.unknown_bytes)} unknown`
    : 'unavailable';
  const codexStateEvidence = codexState
    ? [
        codexState.snapshot_evidence === 'partial' ? 'partial' : null,
        `${formatMemory(codexState.reclaimable_bytes)} reclaimable`,
        `${(codexState.scan_duration_ms / 1_000).toFixed(1)} s`,
      ]
        .filter(Boolean)
        .join(' · ')
    : null;
  const browserRssBaseline = [...samples]
    .reverse()
    .find(sample => Date.parse(sample.checkedAt) <= now - 7 * 24 * HOUR_MS);
  const browserRssDelta = browserRssBaseline
    ? payload.hygiene.browser_rss_bytes - browserRssBaseline.browserRssBytes
    : null;

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
        ) : null}
      </section>

      <section
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8"
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
          label="Build state"
          value={
            buildState?.total_gib == null
              ? '—'
              : formatGib(buildState.total_gib)
          }
          note={buildStateNote}
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
        <Metric label="Remote" value={remoteValue} note={remoteNote} />
      </section>

      <MachineHealthActivity
        samples={samples}
        codexSamples={codexSamples}
        now={now}
        graphicsMaxClockMhz={payload.graphics.max_clock_mhz}
        latestActivity={payload.activity}
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
            {remoteServer ? (
              <Pill good={remoteServer === 'active'}>
                Remote desktop: {remoteServer}
              </Pill>
            ) : null}
            {remoteAcceleration ? (
              <Pill
                good={
                  remoteAcceleration.source === 'grd-current-invocation' &&
                  remoteAcceleration.state !== 'software-fallback' &&
                  remoteAcceleration.state !== 'unknown'
                }
              >
                RDP graphics: {remoteAccelerationLabel ?? 'unavailable'}
              </Pill>
            ) : null}
            {desktop?.wallpaper_references_complete === undefined ? null : (
              <Pill good={desktop.wallpaper_references_complete}>
                Wallpaper refs:{' '}
                {desktop.wallpaper_references_complete ? 'ready' : 'missing'}
              </Pill>
            )}
            <Pill good={idleSuspendDisabled}>
              Idle suspend: {idleSuspendDisabled ? 'off' : 'changed'}
            </Pill>
            <Pill good={payload.power.hibernate_targets_masked}>
              Hibernate:{' '}
              {payload.power.hibernate_targets_masked ? 'masked' : 'changed'}
            </Pill>
            <Pill good={failedUnits === 0}>Failed units: {failedUnits}</Pill>
            {reliability ? (
              <>
                <Pill good={reliability.crash_exits === 0}>
                  Crashes · 24h: {reliability.crash_exits}
                </Pill>
                <Pill good={reliability.automatic_restarts === 0}>
                  Auto restarts · 24h: {reliability.automatic_restarts}
                </Pill>
              </>
            ) : (
              <Pill good={false}>Crash history: unavailable</Pill>
            )}
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
          <dl className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
            <div>
              <dt className="opacity-55 text-xs">Browser apps</dt>
              <dd className="mt-1 text-xl font-black tabular-nums">
                {payload.hygiene.browser_roots}
              </dd>
            </div>
            <div>
              <dt className="opacity-55 text-xs">Browser RSS</dt>
              <dd className="mt-1 text-xl font-black tabular-nums">
                {formatMemory(payload.hygiene.browser_rss_bytes)}
              </dd>
              {browserRssDelta === null ? null : (
                <dd className="opacity-55 mt-1 text-[0.68rem] tabular-nums">
                  {formatMemoryDelta(browserRssDelta)}
                </dd>
              )}
            </div>
            <div>
              <dt className="opacity-55 text-xs">Codex state</dt>
              <dd className="mt-1 text-xl font-black tabular-nums">
                {codexState ? formatMemory(codexState.allocated_bytes) : '—'}
              </dd>
              <dd className="opacity-55 mt-1 text-[0.68rem] tabular-nums">
                {codexStateNote}
              </dd>
              {codexStateEvidence ? (
                <dd className="opacity-55 mt-1 text-[0.68rem] tabular-nums">
                  {codexStateEvidence}
                </dd>
              ) : null}
              {codexStateDelta === null ? null : (
                <dd className="opacity-55 mt-1 text-[0.68rem] tabular-nums">
                  {formatMemoryDelta(codexStateDelta)}
                </dd>
              )}
            </div>
            <div>
              <dt className="opacity-55 text-xs">Codex tags</dt>
              <dd className="mt-1 text-xl font-black tabular-nums">
                {processTags?.active_routes ?? '—'}
              </dd>
              <dd className="opacity-55 mt-1 text-[0.68rem] tabular-nums">
                {processTagsNote}
              </dd>
              {processTagsResourceNote ? (
                <dd className="opacity-55 mt-1 text-[0.68rem] tabular-nums">
                  {processTagsResourceNote}
                </dd>
              ) : null}
            </div>
            <div>
              <dt className="opacity-55 text-xs">Process scopes</dt>
              <dd className="mt-1 text-xl font-black tabular-nums">
                {processCoverageValue}
              </dd>
              <dd className="opacity-55 mt-1 text-[0.68rem] tabular-nums">
                {processCoverageNote}
              </dd>
            </div>
            <div>
              <dt className="opacity-55 text-xs">Codex runtime</dt>
              <dd className="mt-1 text-xl font-black tabular-nums">
                {codexRuntime
                  ? formatMemory(
                      codexRuntime.pss_bytes ?? codexRuntime.rss_bytes
                    )
                  : '—'}
              </dd>
              <dd className="opacity-55 mt-1 text-[0.68rem] tabular-nums">
                {codexRuntimeNote}
              </dd>
            </div>
            <div>
              <dt className="opacity-55 text-xs">Agent routes</dt>
              <dd className="mt-1 text-xl font-black tabular-nums">
                {routeActivity?.active_routes ?? '—'}
              </dd>
              <dd className="opacity-55 mt-1 text-[0.68rem] tabular-nums">
                {routeNote}
              </dd>
              {routeResourceNote ? (
                <dd className="opacity-55 mt-1 text-[0.68rem] tabular-nums">
                  {routeResourceNote}
                </dd>
              ) : null}
              {routeCoverageNote ? (
                <dd className="mt-1 text-[0.68rem] tabular-nums text-amber-800 dark:text-amber-200">
                  {routeCoverageNote}
                </dd>
              ) : null}
            </div>
            <div>
              <dt className="opacity-55 text-xs">Dev listeners</dt>
              <dd className="mt-1 text-xl font-black tabular-nums">
                {payload.hygiene.unexpected_dev_listeners}
              </dd>
            </div>
            <div>
              <dt className="opacity-55 text-xs">Desktop</dt>
              <dd className="mt-1 text-xl font-black tabular-nums">
                {desktop
                  ? `${desktop.pixel_width}×${desktop.pixel_height}`
                  : '—'}
              </dd>
              <dd className="opacity-55 mt-1 text-[0.68rem] tabular-nums">
                {desktopNote}
              </dd>
              {desktopModeNote ? (
                <dd className="opacity-55 mt-1 text-[0.68rem]">
                  {desktopModeNote}
                </dd>
              ) : null}
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
