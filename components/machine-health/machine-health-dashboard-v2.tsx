import {
  type CodexTokenSample,
  evaluateMachineHealth,
  type MachineHealthSample,
  type StoredMachineHealth,
} from '@/app/lib/machine-health-store';
import { GitHubIcon } from '@/components/icons/github-icon';
import { GoogleIcon } from '@/components/icons/google-icon';
import { PressedSprig } from '@/components/cozy-flourishes';
import {
  PaperCreature,
  type PaperCreaturePose,
} from '@/components/paper-creature';
import { MemoryStick, Thermometer, Timer } from 'lucide-react';
import Link from 'next/link';
import { MachineHealthOverview } from './machine-health-overview';
import { MachineHealthRefresh } from './machine-health-refresh';
import { MachineHealthTimestamp } from './machine-health-timestamp';

const HOUR_MS = 60 * 60_000;
const GIB = 1_024 ** 3;
const MIB = 1_024 ** 2;

const COMPANION_POSES: { pose: PaperCreaturePose; label: string }[] = [
  { pose: 'idle', label: 'keeping watch' },
  { pose: 'reading', label: 'reading the gauges' },
  { pose: 'napping', label: 'napping beside the dashboard' },
  { pose: 'archivist', label: 'filing today’s notes' },
  { pose: 'carrying', label: 'bringing a fresh pencil' },
];

function DailyCompanion({ now }: { now: number }) {
  const companion =
    COMPANION_POSES[
      Math.floor(now / (24 * HOUR_MS)) % COMPANION_POSES.length
    ];
  return (
    <div
      className="relative h-12 w-[4.75rem]"
      title={`Scraplet is ${companion.label}`}
    >
      <PressedSprig className="absolute -right-1 -top-4 h-14 w-10 rotate-6 opacity-35" />
      <PaperCreature
        pose={companion.pose}
        size="md"
        label={`Scraplet is ${companion.label}`}
        animateKey={companion.pose}
        className="absolute bottom-0 left-0"
      />
    </div>
  );
}

function formatDuration(seconds: number) {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}

function formatMemory(bytes: number) {
  return bytes >= GIB
    ? `${(bytes / GIB).toFixed(1)} GiB`
    : `${Math.round(bytes / MIB)} MiB`;
}

function isRecentHistory(reason: string) {
  return (
    reason.includes('in the last 24 hours') ||
    reason.includes('recorded in the last 24 hours')
  );
}

function DetailRow({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string | null;
}) {
  return (
    <div className="border-black/7 dark:border-white/8 grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-t py-3 first:border-t-0">
      <div className="min-w-0">
        <dt className="text-sm">{label}</dt>
        {note ? <dd className="opacity-45 mt-0.5 text-xs">{note}</dd> : null}
      </div>
      <dd className="text-right text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function PrivateDetails({
  report,
  recentHistory,
}: {
  report: StoredMachineHealth;
  recentHistory: string[];
}) {
  const payload = report.payload;
  const failedUnits =
    payload.services.failed_system_units + payload.services.failed_user_units;
  const buildState =
    payload.build_state?.source === 'filesystem' ? payload.build_state : null;
  const runtime =
    payload.hygiene.codex_runtime?.source === 'codex-runtime-tree-v1'
      ? payload.hygiene.codex_runtime
      : null;
  const route =
    payload.route_activity?.source === 'codex-route-leases-v2'
      ? payload.route_activity
      : null;
  const remote = payload.network.remote_client;
  const remoteLabel =
    payload.hygiene.rdp_connections > 0
      ? 'Connected'
      : remote?.state === 'direct'
        ? 'Direct'
        : remote?.state === 'relay'
          ? 'Relayed'
          : remote?.state === 'online-idle'
            ? 'Online'
            : remote?.state === 'offline'
              ? 'Offline'
              : 'Idle';
  const beryl =
    payload.beryl?.source === 'big-red-connectivity-check-v1' &&
    payload.beryl.ssh === 'available'
      ? payload.beryl
      : null;

  return (
    <details className="border-t border-black/10 dark:border-white/10">
      <summary className="min-h-12 cursor-pointer py-4 text-sm font-medium opacity-60 hover:opacity-100">
        Private details
      </summary>
      <div className="grid gap-x-8 pb-4 md:grid-cols-2">
        <dl>
          <DetailRow
            label="Services"
            value={failedUnits === 0 ? 'Normal' : `${failedUnits} failed`}
            note={`SSH ${payload.services.ssh} · Tailscale ${payload.services.tailscale} · time sync ${payload.services.time_sync}`}
          />
          <DetailRow
            label="Remote access"
            value={remoteLabel}
            note={
              payload.services.gnome_remote_desktop
                ? `GNOME Remote Desktop ${payload.services.gnome_remote_desktop}`
                : null
            }
          />
          <DetailRow
            label="Agent routes"
            value={route ? String(route.active_routes) : '—'}
            note={
              route
                ? `${route.active_jobs ?? 0} jobs · ${route.tagged_processes ?? 0} tagged processes`
                : 'Route evidence unavailable'
            }
          />
          <DetailRow
            label="Codex runtime"
            value={
              runtime
                ? formatMemory(runtime.pss_bytes ?? runtime.rss_bytes)
                : '—'
            }
            note={
              runtime
                ? `${runtime.processes} processes · ${runtime.mcp_servers} MCP`
                : null
            }
          />
        </dl>
        <dl>
          <DetailRow
            label="Build state"
            value={
              buildState?.total_gib == null
                ? '—'
                : `${buildState.total_gib.toFixed(1)} GiB`
            }
            note={
              buildState?.target_count == null
                ? null
                : `${buildState.target_count} targets · ${buildState.active_build_processes ?? 0} building`
            }
          />
          <DetailRow
            label="Browser memory"
            value={formatMemory(payload.hygiene.browser_rss_bytes)}
            note={`${payload.hygiene.browser_roots} browser root${payload.hygiene.browser_roots === 1 ? '' : 's'}`}
          />
          <DetailRow
            label="Router"
            value={
              beryl ? `${Math.round(beryl.soc_temp_millic / 1_000)} °C` : '—'
            }
            note={
              beryl
                ? `Up ${formatDuration(beryl.uptime_seconds)}`
                : 'Router details unavailable'
            }
          />
          <DetailRow
            label="Machine uptime"
            value={formatDuration(payload.uptime_seconds)}
          />
        </dl>
      </div>
      {recentHistory.length > 0 ? (
        <details className="border-black/7 dark:border-white/8 border-t py-1 text-sm">
          <summary className="min-h-11 opacity-45 cursor-pointer py-3 hover:opacity-80">
            Recent resolved events ({recentHistory.length})
          </summary>
          <ul className="opacity-55 grid gap-2 pb-3 text-xs">
            {recentHistory.map(reason => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </details>
  );
}

function PrivateSignIn({ authError }: { authError: boolean }) {
  return (
    <div className="min-h-12 flex items-center justify-between gap-4 border-t border-black/10 py-2 dark:border-white/10">
      <span className="text-xs opacity-40">
        {authError ? 'Sign-in didn’t finish' : 'Private details'}
      </span>
      <div className="flex items-center">
        <Link
          href="/machine-health/access/oauth/google"
          prefetch={false}
          aria-label="Sign in with Google for private details"
          title="Sign in with Google"
          className="size-10 opacity-55 grid place-items-center transition-opacity hover:opacity-90 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-[#a53b34]"
        >
          <GoogleIcon className="size-5" aria-hidden="true" />
        </Link>
        <Link
          href="/machine-health/access/oauth/github"
          prefetch={false}
          aria-label="Sign in with GitHub for private details"
          title="Sign in with GitHub"
          className="size-10 opacity-55 grid place-items-center transition-opacity hover:opacity-90 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-[#a53b34]"
        >
          <GitHubIcon className="size-5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export function MachineHealthDashboard({
  report,
  samples,
  codexSamples = [],
  now,
  hasPrivateAccess = false,
  ownerAuthConfigured = false,
  authError = false,
}: {
  report: StoredMachineHealth;
  samples: MachineHealthSample[];
  codexSamples?: CodexTokenSample[];
  now: number;
  hasPrivateAccess?: boolean;
  ownerAuthConfigured?: boolean;
  authError?: boolean;
}) {
  const payload = report.payload;
  const assessment = evaluateMachineHealth(payload);
  const recentHistory = assessment.reasons.filter(isRecentHistory);
  const activeReasons: string[] = [];
  const ageHours = Math.max(0, (now - Date.parse(report.checkedAt)) / HOUR_MS);
  if (ageHours > 3)
    activeReasons.unshift(
      `Latest update is ${Math.floor(ageHours)} hours old.`
    );
  if (payload.disk.root_used_percent >= 90)
    activeReasons.push('Storage is above 90%.');
  else if (payload.disk.root_used_percent >= 80)
    activeReasons.push('Storage is above 80%.');
  if (payload.memory.used_percent >= 90)
    activeReasons.push('Memory is above 90%.');
  const failedUnits =
    payload.services.failed_system_units + payload.services.failed_user_units;
  if (failedUnits > 0)
    activeReasons.push(
      `${failedUnits} service${failedUnits === 1 ? '' : 's'} failed.`
    );
  if (payload.network.connectivity !== 'full')
    activeReasons.push('Network connectivity is degraded.');
  if (payload.network.tailscale_backend !== 'running')
    activeReasons.push('Tailscale is not running.');
  const attention = payload.disk.root_used_percent >= 90 || failedUnits > 0;
  const status = attention
    ? 'Needs attention'
    : activeReasons.length > 0
      ? 'Check Big Red'
      : 'Online';
  const statusColor = attention
    ? 'bg-red-600 dark:bg-red-400'
    : activeReasons.length > 0
      ? 'bg-amber-600 dark:bg-amber-300'
      : 'bg-emerald-600 dark:bg-emerald-400';
  const publicSamples = samples.map(sample => ({
    checkedAt: sample.checkedAt,
    cpuUsedPercent: sample.cpuUsedPercent,
    memoryUsedPercent: sample.memoryUsedPercent,
    rootUsedPercent: sample.rootUsedPercent,
    networkRxMibS: sample.networkRxMibS,
    networkTxMibS: sample.networkTxMibS,
    diskReadMibS: sample.diskReadMibS,
    diskWriteMibS: sample.diskWriteMibS,
    pressurePercent: sample.pressurePercent,
    coreAveragePercent: sample.coreAveragePercent ?? null,
    corePeakPercent: sample.corePeakPercent ?? null,
    networkPeakMibS: sample.networkPeakMibS ?? null,
    diskPeakMibS: sample.diskPeakMibS ?? null,
  }));

  return (
    <div className="grid gap-6">
      <header className="flex items-start justify-between gap-4 px-1 pt-1">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] opacity-40">
            Atlas · Tools
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.045em]">
            Big Red
          </h1>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${statusColor}`}
            />
            <span className="font-medium">{status}</span>
            <span aria-hidden="true" className="opacity-25">
              ·
            </span>
            <MachineHealthTimestamp checkedAt={report.checkedAt} now={now} />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <MachineHealthRefresh />
          <DailyCompanion now={now} />
        </div>
      </header>

      {activeReasons.length > 0 ? (
        <section
          className={`border-l-2 px-3 py-1 text-sm ${attention ? 'border-red-600 dark:border-red-400' : 'border-amber-600 dark:border-amber-300'}`}
          aria-labelledby="current-issues-heading"
        >
          <h2 id="current-issues-heading" className="font-semibold">
            Current issue{activeReasons.length === 1 ? '' : 's'}
          </h2>
          <ul className="opacity-65 mt-1 grid gap-1">
            {activeReasons.map(reason => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <MachineHealthOverview
        samples={publicSamples}
        codexSamples={codexSamples}
        now={now}
        current={{
          cpuPercent: payload.cpu.used_percent,
          memoryPercent: payload.memory.used_percent,
          storagePercent: payload.disk.root_used_percent,
          storageFreeGib: payload.disk.root_free_gib,
        }}
      />

      <section aria-label="Additional machine details">
        <div className="grid grid-cols-3 gap-4 border-t border-black/10 py-4 text-center dark:border-white/10">
          <div aria-label="Temperature" title="Temperature">
            <Thermometer
              aria-hidden="true"
              className="size-4 mx-auto stroke-[1.7] opacity-40"
            />
            <span className="sr-only">Temperature</span>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {payload.temperature.peak_sensor_c === null
                ? '—'
                : `${Math.round(payload.temperature.peak_sensor_c)} °C`}
            </p>
          </div>
          <div aria-label="Installed memory" title="Installed memory">
            <MemoryStick
              aria-hidden="true"
              className="size-4 mx-auto stroke-[1.7] opacity-40"
            />
            <span className="sr-only">Installed memory</span>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {payload.memory.total_gib.toFixed(0)} GiB
            </p>
          </div>
          <div aria-label="Uptime" title="Uptime">
            <Timer
              aria-hidden="true"
              className="size-4 mx-auto stroke-[1.7] opacity-40"
            />
            <span className="sr-only">Uptime</span>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatDuration(payload.uptime_seconds)}
            </p>
          </div>
        </div>

        {hasPrivateAccess ? (
          <PrivateDetails report={report} recentHistory={recentHistory} />
        ) : ownerAuthConfigured ? (
          <PrivateSignIn authError={authError} />
        ) : null}
      </section>
    </div>
  );
}
