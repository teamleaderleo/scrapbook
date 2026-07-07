import { getLatestProxyHealth } from '@/app/lib/proxy-health-store';

const CHECK_INTERVAL_MINUTES = 5;

function formatRunTime(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
}

function formatNextRun(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return formatRunTime(new Date(date.getTime() + CHECK_INTERVAL_MINUTES * 60 * 1000).toISOString());
}

export async function CheckInStatus() {
  const status = await getLatestProxyHealth('bandwagon-la');
  if (!status) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span>Last <span className="font-medium text-foreground">{formatRunTime(status.updatedAt)}</span></span>
      <span>Next <span className="font-medium text-foreground">{formatNextRun(status.updatedAt)}</span></span>
      <span>{CHECK_INTERVAL_MINUTES} min</span>
    </div>
  );
}
