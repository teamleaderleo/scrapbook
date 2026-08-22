import type { LightsailAwsSnapshot } from '@/app/lib/lightsail-aws';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { LightsailUsageCard } from './lightsail-usage-card';

const snapshot: LightsailAwsSnapshot = {
  checkedAt: '2026-08-22T15:00:00.000Z',
  region: 'us-west-2',
  availabilityZone: 'us-west-2a',
  instanceName: 'private-instance-name',
  state: 'running',
  publicIpAddress: '192.0.2.10',
  staticIp: true,
  blueprintName: 'Private blueprint',
  poolSize: 1,
  pooledInstanceNames: ['private-instance-name'],
  plan: {
    bundleId: 'private-bundle',
    name: 'Private plan',
    priceUsd: 12,
    ramGb: 2,
    cpuCount: 2,
    diskGb: 60,
    transferPerInstanceGb: 3072,
  },
  transfer: {
    cycleStart: '2026-08-01T00:00:00.000Z',
    resetAt: '2026-09-01T00:00:00.000Z',
    allowanceBytes: 3 * 1024 ** 4,
    usedBytes: 50 * 1024 ** 3,
    remainingBytes: 3 * 1024 ** 4 - 50 * 1024 ** 3,
    networkInBytes: 25 * 1024 ** 3,
    networkOutBytes: 25 * 1024 ** 3,
    last24hBytes: 10 * 1024 ** 3,
    last24hInBytes: 5 * 1024 ** 3,
    last24hOutBytes: 5 * 1024 ** 3,
  },
  cpu: { average24h: 1, maximum24h: 20 },
  burst: { latestPercent: 100, average24h: 100, maximum24h: 100 },
  statusCheckFailures24h: 0,
  ports: { tcp443: true, udp443: true, ssh22: true },
  billing: {
    costUsd: 0,
    transferInGb: 0.29,
    transferOutGb: 0.27,
    overageOutGb: 0,
    estimated: true,
  },
  billingError: null,
};

describe('LightsailUsageCard', () => {
  it('keeps private infrastructure details out of the rendered response', () => {
    const html = renderToStaticMarkup(
      createElement(LightsailUsageCard, { data: snapshot })
    );

    expect(html).toContain('AWS transfer · current month');
    expect(html).toContain('24h traffic');
    expect(html).toContain('CPU · 24h');

    expect(html).not.toContain('Burst capacity');
    expect(html).not.toContain('Plan');
    expect(html).not.toContain('Endpoints');
    expect(html).not.toContain('Billing MTD');
    expect(html).not.toContain(snapshot.instanceName);
    expect(html).not.toContain(snapshot.publicIpAddress);
    expect(html).not.toContain(snapshot.blueprintName);
  });
});
