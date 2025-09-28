export function formatInterval(nowMs: number, due: Date, scheduledDays: number) {
  if (scheduledDays >= 1) return `${Math.round(scheduledDays)}d`;
  const mins = Math.max(1, Math.round((+due - nowMs) / 60000));
  if (mins >= 60) return `${Math.round(mins / 60)}h`;
  return `${mins}m`;
}

export function formatDueRelative(nowMs: number, due: Date) {
  const diff = +due - nowMs;
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  if (mins < 60) return diff >= 0 ? `in ${mins}m` : `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return diff >= 0 ? `in ${hrs}h` : `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return diff >= 0 ? `in ${days}d` : `${days}d ago`;
}
