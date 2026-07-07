import SiteNav from '@/components/site-nav';
import { getLatestProxyHealth, type ProxyHealthPayload } from '@/app/lib/proxy-health-store';
import { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Proxy Dashboard',
  description: 'Bandwagon and Linode proxy health dashboard.',
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatRelative(timestamp: string | null | undefined) {
  if (!timestamp) return 'unknown';
  const ms = Date.now() - new Date(timestamp).getTime();
  if (!Number.isFinite(ms)) return 'unknown';
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function formatBytes(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'unknown';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
}

function serviceTone(status: string | undefined) {
  if (status === 'active') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  if (status === 'inactive' || status === 'failed') return 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300';
  return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300';
}

function modeTone(mode: string | undefined) {
  if (mode === 'normal') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  if (mode === 'fallback') return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300';
  if (mode === 'degraded') return 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300';
  return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300';
}

function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>{children}</span>;
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-background/80 p-5 shadow-sm backdrop-blur">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="break-all text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function Locked() {
  return (
    <main className="min-h-screen bg-sidebar-background">
      <SiteNav />
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
        <div className="rounded-3xl border bg-background p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Proxy Dashboard</p>
          <h1 className="mt-4 text-3xl font-bold">Locked</h1>
          <p className="mt-3 text-muted-foreground">Add the dashboard token as a query string to view this page.</p>
        </div>
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border bg-background p-6 shadow-sm">
      <h1 className="text-2xl font-bold">No proxy health report yet</h1>
      <p className="mt-3 text-muted-foreground">Install the Bandwagon reporter and let it POST to the ingest API. Once the first payload arrives, this page will show the current route, services, egress IPs, and WireGuard stats.</p>
      <pre className="mt-5 overflow-x-auto rounded-xl bg-zinc-950 p-4 text-xs text-zinc-100"><code>{`PROXY_HEALTH_INGEST_URL=https://teamleaderleo.com/api/proxy-health/ingest
PROXY_HEALTH_TOKEN=your-secret-token
/usr/local/sbin/proxy-health-report`}</code></pre>
    </div>
  );
}

export default async function ProxyDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = firstValue(params?.token);
  const requiredToken = process.env.PROXY_DASHBOARD_TOKEN;

  if (requiredToken && token !== requiredToken) {
    return <Locked />;
  }

  const status = await getLatestProxyHealth('bandwagon-la');
  const payload: ProxyHealthPayload | undefined = status?.payload;
  const services = payload?.services ?? {};
  const errors = Array.isArray(payload?.errors) ? payload.errors : [];
  const mode = typeof payload?.mode === 'string' ? payload.mode : 'unknown';
  const sidecarOk = payload?.egress?.sidecar_ok === true;
  const fallbackOk = payload?.egress?.fallback_ok === true;
  const latestJsonHref = token ? `/api/proxy-health/latest?token=${encodeURIComponent(token)}` : '/api/proxy-health/latest';

  return (
    <main className="min-h-screen bg-sidebar-background">
      <SiteNav />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Proxy Dashboard</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">Bandwagon → Linode</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">Read-only health view for Xray, WireGuard egress, Linode IPs, and fallback readiness.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill className={modeTone(mode)}>{mode}</Pill>
            <Pill className="border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300">updated {formatRelative(status?.updatedAt)}</Pill>
          </div>
        </div>

        {!status ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Current route">
              <Row label="Mode" value={<Pill className={modeTone(mode)}>{mode}</Pill>} />
              <Row label="Host" value={status.host} />
              <Row label="Checked" value={formatRelative(status.checkedAt)} />
              <Row label="Xray outbound" value={`${payload?.xray?.outbound_address ?? 'unknown'}:${payload?.xray?.outbound_port ?? 'unknown'}`} />
            </Card>

            <Card title="Egress">
              <Row label="IPv4" value={payload?.egress?.ipv4 ?? 'unknown'} />
              <Row label="Expected IPv4" value={payload?.expected?.ipv4 ?? 'unknown'} />
              <Row label="IPv6" value={payload?.egress?.ipv6 ?? 'unknown'} />
              <Row label="Expected IPv6" value={payload?.expected?.ipv6 ?? 'unknown'} />
            </Card>

            <Card title="Readiness">
              <Row label="WG sidecar" value={<Pill className={sidecarOk ? serviceTone('active') : serviceTone('failed')}>{sidecarOk ? 'ok' : 'failed'}</Pill>} />
              <Row label="SSH fallback" value={<Pill className={fallbackOk ? serviceTone('active') : serviceTone('failed')}>{fallbackOk ? 'ready' : 'failed'}</Pill>} />
              <Row label="Errors" value={errors.length === 0 ? 'none' : `${errors.length}`} />
            </Card>

            <Card title="Services">
              {['xray', 'wg-egress-netns', 'xray-wg-sidecar', 'lightsail-egress-socks'].map((name) => (
                <Row key={name} label={name} value={<Pill className={serviceTone(services[name])}>{services[name] ?? 'unknown'}</Pill>} />
              ))}
            </Card>

            <Card title="WireGuard">
              <Row label="Handshake age" value={typeof payload?.wireguard?.latest_handshake_seconds_ago === 'number' ? `${payload.wireguard.latest_handshake_seconds_ago}s` : 'unknown'} />
              <Row label="Received" value={formatBytes(payload?.wireguard?.rx_bytes)} />
              <Row label="Sent" value={formatBytes(payload?.wireguard?.tx_bytes)} />
            </Card>

            <Card title="Links">
              <div className="space-y-3 text-sm">
                <Link className="block rounded-xl border p-3 hover:bg-accent" href={latestJsonHref}>Latest JSON</Link>
                <p className="text-muted-foreground">The ingest endpoint is <code className="rounded bg-muted px-1 py-0.5">/api/proxy-health/ingest</code>.</p>
              </div>
            </Card>

            {errors.length > 0 && (
              <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 lg:col-span-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700 dark:text-red-300">Errors</h2>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-red-700 dark:text-red-300">
                  {errors.map((error, index) => <li key={`${error}-${index}`}>{error}</li>)}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
