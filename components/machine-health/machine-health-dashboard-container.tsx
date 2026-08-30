import { readMachineHealth } from '@/app/lib/machine-health-store';
import { headers } from 'next/headers';
import { MachineHealthDashboard } from './machine-health-dashboard-v2';

function StateCard({
  title,
  body,
  requestId,
}: {
  title: string;
  body: string;
  requestId?: string;
}) {
  return (
    <section
      className="dark:bg-black/15 rounded-2xl border border-black/10 bg-white/70 p-5 dark:border-white/10"
      role="status"
    >
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm opacity-70">{body}</p>
      {requestId ? (
        <p className="mt-3 font-mono text-xs opacity-60">Request {requestId}</p>
      ) : null}
    </section>
  );
}

export async function MachineHealthDashboardContainer({
  hasPrivateAccess,
  ownerAuthConfigured,
  authError = false,
}: {
  hasPrivateAccess: boolean;
  ownerAuthConfigured: boolean;
  authError?: boolean;
}) {
  await headers();
  const result = await readMachineHealth(60);
  if (result.status === 'configuration-error')
    return (
      <StateCard
        title="Health check not connected"
        body={result.message}
        requestId={result.requestId}
      />
    );
  if (result.status === 'error')
    return (
      <StateCard
        title="Health data unavailable"
        body={result.message}
        requestId={result.requestId}
      />
    );
  if (result.status === 'empty')
    return (
      <StateCard
        title="No snapshot yet"
        body="The storage tables exist, but Big Red has not sent its first sanitized report."
      />
    );
  return (
    <MachineHealthDashboard
      report={result.report}
      samples={result.samples}
      codexSamples={result.codexSamples}
      now={Date.parse(result.observedAt)}
      hasPrivateAccess={hasPrivateAccess}
      ownerAuthConfigured={ownerAuthConfigured}
      authError={authError}
    />
  );
}
