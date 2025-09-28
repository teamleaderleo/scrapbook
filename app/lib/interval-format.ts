export function formatInterval(nowMs: number, due: Date, scheduledDays: number) {
  if (scheduledDays >= 1) return `${Math.round(scheduledDays)}d`;
  const mins = Math.max(1, Math.round((+due - nowMs) / 60000));
  return `${mins}m`;
}