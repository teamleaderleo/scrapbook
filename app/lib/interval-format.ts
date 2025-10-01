export function formatInterval(_nowMs: number, _due: Date, scheduledDays: number) {
  const totalMinutes = Math.max(1, Math.round(scheduledDays * 24 * 60));
  if (totalMinutes >= 60 * 24) return `${Math.round(totalMinutes / (60 * 24))}d`;
  if (totalMinutes >= 60)     return `${Math.round(totalMinutes / 60)}h`;
  return `${totalMinutes}m`;
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
