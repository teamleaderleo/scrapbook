'use client';

import { useEffect, useState } from 'react';
import {
  CORE_LABELS,
  summarizeCores,
  type ActivityMonitorData,
  type CoreKind,
} from '@/app/lib/machine-activity';

const HOSTS = [
  ['big-red', 'Big Red'],
  ['macbook-air', 'MacBook Air'],
] as const;
const COLORS: Record<CoreKind, string> = {
  performance: 'bg-[#b74a42] dark:bg-[#e77970]',
  efficiency: 'bg-[#378690] dark:bg-[#66c0c8]',
  'low-power-efficiency': 'bg-[#b98532] dark:bg-[#dfb56e]',
  unknown: 'bg-neutral-500',
};
const number = (value: number | null | undefined, unit: string, digits = 1) =>
  value == null ? 'Unavailable' : `${value.toFixed(digits)} ${unit}`;

export function ActivityMonitorView({
  data,
  now,
  error,
  refresh,
}: {
  data: ActivityMonitorData | null;
  now: number;
  error: boolean;
  refresh: () => void;
}) {
  const [host, setHost] = useState<'big-red' | 'macbook-air'>('big-red');
  const [coreGroup, setCoreGroup] = useState<'all' | CoreKind>('all');
  const [sort, setSort] = useState<'cpu_cores' | 'rss_mib'>('cpu_cores');
  const [historyMetric, setHistoryMetric] = useState<
    'cpu' | 'memory' | 'network' | 'disk'
  >('cpu');
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const snapshot = data?.latest.find(item => item.host === host);
  const age = snapshot
    ? Math.max(0, Math.floor((now - Date.parse(snapshot.checked_at)) / 1000))
    : null;
  const stale = age !== null && age > 180;
  const history = data?.history.filter(item => item.host === host) ?? [];
  const minute = Math.floor(now / 60000);
  const byMinute = new Map(
    history.map(item => [Math.floor(Date.parse(item.checked_at) / 60000), item])
  );
  const bins = Array.from({ length: 60 }, (_, index) => ({
    minute: minute - 59 + index,
    sample: byMinute.get(minute - 59 + index),
  }));
  const values = bins.map(bin => {
    const item = bin.sample;
    if (!item) return null;
    if (historyMetric === 'cpu') {
      const cores = item.cpu.cores.filter(
        core => coreGroup === 'all' || core.kind === coreGroup
      );
      return cores.length
        ? cores.reduce((sum, core) => sum + core.used_percent, 0) / cores.length
        : null;
    }
    if (historyMetric === 'memory') return item.memory.used_gib;
    const pair =
      historyMetric === 'network'
        ? [item.network.rx_mib_s, item.network.tx_mib_s]
        : [item.disk.read_mib_s, item.disk.write_mib_s];
    return pair.some(value => value === null) ? null : pair[0]! + pair[1]!;
  });
  const unit =
    historyMetric === 'cpu'
      ? '%'
      : historyMetric === 'memory'
        ? 'GiB'
        : 'MiB/s';
  const maximum = Math.max(
    historyMetric === 'cpu'
      ? 100
      : historyMetric === 'memory'
        ? (snapshot?.memory.total_gib ?? 1)
        : 1,
    ...values.filter((value): value is number => value !== null)
  );
  const selectedIndex = bins.findIndex(bin => bin.minute === selectedMinute);
  const selected = selectedIndex >= 0 ? bins[selectedIndex] : null;
  const timestamp = (value: number) =>
    now === 0
      ? '—'
      : new Date(value * 60000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
  const processes = snapshot?.processes
    ? [...snapshot.processes]
        .sort((a, b) => (b[sort] ?? -1) - (a[sort] ?? -1))
        .slice(0, 10)
    : null;

  return (
    <section
      aria-labelledby="activity-monitor-heading"
      className="border-y border-black/10 py-5 dark:border-white/10"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="activity-monitor-heading"
            className="text-xl font-semibold tracking-tight"
          >
            Activity monitor
          </h2>
          <p
            className={`mt-1 text-xs ${stale || error ? 'text-amber-700 dark:text-amber-300' : 'opacity-60'}`}
            role="status"
          >
            {error
              ? 'Refresh failed · retaining the last successful view. '
              : ''}
            {snapshot
              ? `${stale ? 'Stale · ' : ''}${age! < 60 ? `${age}s` : `${Math.floor(age! / 60)}m`} since sample · ${snapshot.sample_seconds.toFixed(1)}-second observation`
              : 'Waiting for the first activity snapshot'}
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="min-h-9 px-2 text-xs underline underline-offset-4 focus-visible:outline-2"
        >
          Refresh activity
        </button>
      </div>
      <div className="my-4 flex gap-5" aria-label="Activity monitor device">
        {HOSTS.map(([id, label]) => (
          <button
            type="button"
            key={id}
            aria-pressed={host === id}
            onClick={() => {
              setHost(id);
              setCoreGroup('all');
              setSelectedMinute(null);
            }}
            className={`min-h-9 border-b text-sm focus-visible:outline-2 ${host === id ? 'border-current font-semibold' : 'border-transparent opacity-60'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {snapshot ? (
        <>
          <div className="mb-4 flex flex-wrap justify-between gap-2 text-xs opacity-60">
            <span>{snapshot.cpu.model}</span>
            <span>
              {snapshot.process_count ?? 'Unknown'} processes observed
            </span>
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
            <section aria-label="Current CPU groups">
              <h3 className="mb-3 text-sm font-medium">
                CPU ·{' '}
                {number(
                  snapshot.cpu.cores.reduce(
                    (sum, core) => sum + core.used_percent / 100,
                    0
                  ),
                  'cores busy',
                  2
                )}{' '}
                / {snapshot.cpu.cores.length}
              </h3>
              <div className="grid gap-4">
                {summarizeCores(snapshot.cpu.cores).map(group => (
                  <div key={group.kind}>
                    <div className="mb-1.5 flex justify-between gap-3 text-xs">
                      <span>
                        {CORE_LABELS[group.kind]} · {group.count}
                      </span>
                      <span className="tabular-nums">
                        {group.percent.toFixed(1)}% ·{' '}
                        {group.consumed.toFixed(2)} cores busy
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {snapshot.cpu.cores
                        .filter(core => core.kind === group.kind)
                        .map(core => (
                          <div
                            key={core.id}
                            aria-label={`${CORE_LABELS[core.kind]} core ${core.id}: ${core.used_percent.toFixed(1)}%`}
                            className="relative min-w-[3rem] flex-1 overflow-hidden border border-black/10 px-1 py-2 text-center dark:border-white/10"
                          >
                            <span
                              aria-hidden="true"
                              className={`absolute inset-x-0 bottom-0 ${COLORS[core.kind]} opacity-30`}
                              style={{ height: `${core.used_percent}%` }}
                            />
                            <span className="relative block text-[0.65rem] opacity-60">
                              {core.id}
                            </span>
                            <span className="relative text-xs font-medium tabular-nums">
                              {Math.round(core.used_percent)}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section aria-label="Current memory and throughput">
              <h3 className="mb-2 text-sm font-medium">
                Memory and throughput
              </h3>
              <dl className="text-sm">
                <Readout
                  label="RAM used"
                  value={`${snapshot.memory.used_gib.toFixed(1)} / ${snapshot.memory.total_gib.toFixed(1)} GiB`}
                />
                <Readout
                  label="Available"
                  value={number(snapshot.memory.available_gib, 'GiB')}
                />
                <Readout
                  label="Swap occupied"
                  value={`${snapshot.memory.swap_used_gib.toFixed(2)} / ${snapshot.memory.swap_total_gib.toFixed(1)} GiB`}
                />
                <Readout
                  label={
                    host === 'macbook-air'
                      ? 'Memory pressure'
                      : 'Memory stalls (10s)'
                  }
                  value={
                    host === 'macbook-air'
                      ? snapshot.memory.pressure
                      : number(snapshot.memory.pressure_stall_percent, '%', 2)
                  }
                />
                {snapshot.memory.wired_gib !== null ? (
                  <Readout
                    label="Wired / compressed"
                    value={`${snapshot.memory.wired_gib.toFixed(1)} / ${snapshot.memory.compressed_gib?.toFixed(1) ?? '—'} GiB`}
                  />
                ) : null}
                <Readout
                  label="Network ↓ / ↑"
                  value={`${number(snapshot.network.rx_mib_s, '', 2)} / ${number(snapshot.network.tx_mib_s, 'MiB/s', 2)}`}
                />
                <Readout
                  label="Disk read / write"
                  value={`${number(snapshot.disk.read_mib_s, '', 2)} / ${number(snapshot.disk.write_mib_s, 'MiB/s', 2)}`}
                />
                {snapshot.vm ? (
                  <Readout
                    label={`Windows VM · ${snapshot.vm.state}`}
                    value={`${number(snapshot.vm.resident_gib, 'GiB', 2)} · ${number(snapshot.vm.cpu_cores, 'cores', 2)}`}
                  />
                ) : null}
              </dl>
            </section>
          </div>
        </>
      ) : (
        <p className="py-4 text-sm opacity-60">
          No recent report from {HOSTS.find(([id]) => id === host)?.[1]}.
          Sleeping or disconnected machines leave gaps.
        </p>
      )}
      <section className="mt-5" aria-label="Last hour of activity">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-medium">
            Last hour · one-minute snapshots
          </h3>
          <div className="flex gap-3" aria-label="Activity history metric">
            {(['cpu', 'memory', 'network', 'disk'] as const).map(metric => (
              <button
                key={metric}
                type="button"
                aria-pressed={historyMetric === metric}
                className={`min-h-8 border-b text-xs capitalize focus-visible:outline-2 ${historyMetric === metric ? 'border-current font-semibold' : 'border-transparent opacity-60'}`}
                onClick={() => {
                  setHistoryMetric(metric);
                  setSelectedMinute(null);
                }}
              >
                {metric === 'cpu' ? 'CPU' : metric}
              </button>
            ))}
          </div>
        </div>
        {historyMetric === 'cpu' && snapshot ? (
          <label className="mb-2 flex items-center justify-end gap-2 text-xs opacity-70">
            CPU group
            <select
              className="rounded border border-black/10 bg-transparent p-1 dark:border-white/15"
              value={coreGroup}
              onChange={event => {
                setCoreGroup(event.target.value as 'all' | CoreKind);
                setSelectedMinute(null);
              }}
            >
              <option value="all">All cores</option>
              {summarizeCores(snapshot.cpu.cores).map(group => (
                <option key={group.kind} value={group.kind}>
                  {CORE_LABELS[group.kind]}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="mb-1 flex min-h-5 justify-between gap-2 text-xs tabular-nums opacity-60">
          <span>
            {selected?.sample
              ? `${timestamp(selected.minute)} · ${number(values[selectedIndex], unit, 2)}`
              : 'Select a bar to inspect a sample'}
          </span>
          <span>
            0–{maximum.toFixed(historyMetric === 'cpu' ? 0 : 1)} {unit}
          </span>
        </div>
        <div
          className="flex h-24 items-end gap-px border-b border-black/15 dark:border-white/15"
          role="group"
          aria-label="Minute activity history"
        >
          {bins.map((bin, index) => (
            <button
              key={bin.minute}
              type="button"
              disabled={values[index] === null}
              aria-pressed={selectedMinute === bin.minute}
              aria-label={`${timestamp(bin.minute)}: ${number(values[index], unit, 2)}`}
              onClick={() =>
                setSelectedMinute(
                  selectedMinute === bin.minute ? null : bin.minute
                )
              }
              className={`h-full min-w-0 flex-1 content-end focus-visible:outline-2 ${selectedMinute === bin.minute ? 'ring-1 ring-current' : ''}`}
            >
              <span
                aria-hidden="true"
                className={`block w-full ${values[index] === null ? 'bg-black/10 dark:bg-white/10' : 'bg-[#378690] dark:bg-[#66c0c8]'}`}
                style={{
                  height:
                    values[index] === null
                      ? '1px'
                      : `${Math.max(2, (values[index]! / maximum) * 100)}%`,
                }}
              />
            </button>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[0.65rem] tabular-nums opacity-50">
          <span>{timestamp(bins[0].minute)}</span>
          <span>{timestamp(minute)}</span>
        </div>
      </section>
      <details
        className="mt-5 border-t border-black/10 pt-3 dark:border-white/10"
        open={data?.privateAccess || undefined}
      >
        <summary className="cursor-pointer text-sm font-medium">
          Top processes{' '}
          <span className="ml-1 text-xs font-normal opacity-60">
            · owner only
          </span>
        </summary>
        {data?.privateAccess ? (
          processes && !stale ? (
            <>
              <div
                className="my-3 flex gap-4 text-xs"
                aria-label="Process sort"
              >
                {(['cpu_cores', 'rss_mib'] as const).map(key => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={sort === key}
                    onClick={() => setSort(key)}
                    className={`min-h-8 border-b focus-visible:outline-2 ${sort === key ? 'border-current font-semibold' : 'border-transparent opacity-60'}`}
                  >
                    {key === 'cpu_cores' ? 'CPU' : 'Memory'}
                  </button>
                ))}
              </div>
              <table className="w-full table-fixed text-xs">
                <thead className="text-left opacity-60">
                  <tr>
                    <th className="w-1/2 pb-2 font-normal">Process</th>
                    <th className="pb-2 text-right font-normal">CPU cores</th>
                    <th className="pb-2 text-right font-normal">Resident</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.map(process => (
                    <tr
                      key={process.pid}
                      className="border-t border-black/5 dark:border-white/5"
                    >
                      <td className="break-words py-2 pr-2">
                        {process.name}
                        <span className="ml-2 tabular-nums opacity-40">
                          {process.pid}
                        </span>
                      </td>
                      <td className="text-right tabular-nums">
                        {number(process.cpu_cores, '', 2)}
                      </td>
                      <td className="text-right tabular-nums">
                        {number(process.rss_mib, 'MiB', 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs leading-relaxed opacity-50">
                Top 10 by the selected measure. One CPU core means one fully
                busy logical CPU. Resident memory includes shared pages, so
                process rows don’t sum to RAM usage.
              </p>
            </>
          ) : (
            <p className="mt-3 text-xs opacity-60">
              Process detail is unavailable or stale.
            </p>
          )
        ) : (
          <p className="mt-3 text-xs opacity-60">
            Sign in using the dashboard’s private-details controls to see
            executable names, CPU and memory. Arguments and window titles aren’t
            collected.
          </p>
        )}
      </details>
      <p className="mt-4 text-xs leading-relaxed opacity-50">
        Samples arrive about once a minute while each machine is awake; the page
        refreshes while visible. Short spikes between samples can be missed.
        Network totals include virtual interfaces. Mac available RAM is a
        VM-counter estimate; wired/compressed values describe parts of memory
        already counted above.
      </p>
    </section>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-black/5 py-1.5 dark:border-white/5">
      <dt className="opacity-60">{label}</dt>
      <dd className="text-right tabular-nums">{value}</dd>
    </div>
  );
}

export function MachineActivityMonitor() {
  const [data, setData] = useState<ActivityMonitorData | null>(null);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(0);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let stopped = false;
    let pending = false;
    let failures = 0;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController | undefined;
    const load = async () => {
      clearTimeout(timer);
      if (stopped || pending || document.visibilityState !== 'visible') return;
      pending = true;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 10000);
      try {
        const response = await fetch('/api/machine-health/activity', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Activity unavailable');
        const next: ActivityMonitorData = await response.json();
        if (!stopped) {
          setData(next);
          setError(false);
          setNow(Date.now());
        }
        failures = 0;
      } catch {
        if (!stopped) {
          setError(true);
          setNow(Date.now());
        }
        failures += 1;
      } finally {
        clearTimeout(timeout);
        pending = false;
        if (!stopped)
          timer = setTimeout(load, Math.min(300000, 60000 * 2 ** failures));
      }
    };
    const visibility = () => {
      if (document.visibilityState === 'visible') void load();
      else clearTimeout(timer);
    };
    void load();
    const ageTimer = setInterval(() => {
      if (document.visibilityState === 'visible') setNow(Date.now());
    }, 15000);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      stopped = true;
      controller?.abort();
      clearTimeout(timer);
      clearInterval(ageTimer);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [revision]);
  return (
    <ActivityMonitorView
      data={data}
      now={now}
      error={error}
      refresh={() => setRevision(value => value + 1)}
    />
  );
}
