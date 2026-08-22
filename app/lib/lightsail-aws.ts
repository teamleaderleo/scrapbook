import { createHash, createHmac } from 'node:crypto';

import { headers } from 'next/headers';

const DEFAULT_REGION = 'us-west-2';
const DEFAULT_INSTANCE_NAME = 'lightsail-uswest2';
const DASHBOARD_CACHE_MS = 60_000;
const CREDENTIAL_REFRESH_SKEW_MS = 5 * 60_000;
const DAY_MS = 24 * 60 * 60 * 1000;

type AwsCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  expiration?: number;
};

type MetricDatapoint = {
  timestamp?: number | string;
  sum?: number;
  average?: number;
  maximum?: number;
  sampleCount?: number;
};

type LightsailInstance = {
  name?: string;
  bundleId?: string;
  blueprintName?: string;
  createdAt?: number | string;
  isStaticIp?: boolean;
  publicIpAddress?: string;
  location?: {
    availabilityZone?: string;
    regionName?: string;
  };
  hardware?: {
    cpuCount?: number;
    disks?: Array<{
      isSystemDisk?: boolean;
      sizeInGb?: number;
    }>;
  };
  networking?: {
    monthlyTransfer?: {
      gbPerMonthAllocated?: number;
    };
    ports?: Array<{
      accessDirection?: string;
      accessType?: string;
      fromPort?: number;
      toPort?: number;
      protocol?: string;
    }>;
  };
  state?: {
    code?: number;
    name?: string;
  };
};

type LightsailBundle = {
  bundleId?: string;
  cpuCount?: number;
  diskSizeInGb?: number;
  name?: string;
  price?: number;
  ramSizeInGb?: number;
  transferPerMonthInGb?: number;
};

type BillingSummary = {
  costUsd: number | null;
  transferInGb: number | null;
  transferOutGb: number | null;
  overageOutGb: number | null;
  estimated: boolean | null;
};

export type LightsailAwsSnapshot = {
  checkedAt: string;
  region: string;
  availabilityZone: string | null;
  instanceName: string;
  state: string | null;
  publicIpAddress: string | null;
  staticIp: boolean | null;
  blueprintName: string | null;
  poolSize: number;
  pooledInstanceNames: string[];
  plan: {
    bundleId: string | null;
    name: string | null;
    priceUsd: number | null;
    ramGb: number | null;
    cpuCount: number | null;
    diskGb: number | null;
    transferPerInstanceGb: number | null;
  };
  transfer: {
    cycleStart: string;
    resetAt: string;
    allowanceBytes: number | null;
    usedBytes: number;
    remainingBytes: number | null;
    networkInBytes: number;
    networkOutBytes: number;
    last24hBytes: number;
    last24hInBytes: number;
    last24hOutBytes: number;
  };
  cpu: {
    average24h: number | null;
    maximum24h: number | null;
  };
  burst: {
    latestPercent: number | null;
    average24h: number | null;
    maximum24h: number | null;
  };
  statusCheckFailures24h: number | null;
  ports: {
    tcp443: boolean;
    udp443: boolean;
    ssh22: boolean;
  };
  billing: BillingSummary | null;
  billingError: string | null;
};

export type LightsailAwsReadResult =
  | { status: 'ok'; data: LightsailAwsSnapshot }
  | { status: 'configuration-error'; message: string }
  | { status: 'error'; message: string };

let cachedRoleCredentials:
  | { roleArn: string; credentials: AwsCredentials }
  | undefined;
let cachedDashboard:
  | { expiresAt: number; region: string; instanceName: string; data: LightsailAwsSnapshot }
  | undefined;

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function sha256(value: string) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function hmac(key: Buffer | string, value: string) {
  return createHmac('sha256', key).update(value, 'utf8').digest();
}

function collapseHeaderWhitespace(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function amzDate(value: Date) {
  return value.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function dateStamp(value: Date) {
  return amzDate(value).slice(0, 8);
}

function xmlValue(xml: string, name: string) {
  const match = xml.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`));
  if (!match) return null;
  return match[1]
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function cleanAwsError(value: unknown) {
  if (value instanceof Error && value.message) return value.message.slice(0, 500);
  return String(value).slice(0, 500);
}

async function requestOidcCredentials(roleArn: string): Promise<AwsCredentials> {
  let token = process.env.VERCEL_OIDC_TOKEN?.trim() || '';

  if (!token) {
    try {
      token = (await headers()).get('x-vercel-oidc-token')?.trim() || '';
    } catch {
      token = '';
    }
  }

  if (!token) {
    throw new Error(
      'AWS_ROLE_ARN is configured, but this request has no Vercel OIDC token.'
    );
  }

  const form = new URLSearchParams({
    Action: 'AssumeRoleWithWebIdentity',
    Version: '2011-06-15',
    RoleArn: roleArn,
    RoleSessionName: 'scrapbook-lightsail-dashboard',
    WebIdentityToken: token,
    DurationSeconds: '3600',
  });

  const response = await fetch('https://sts.amazonaws.com/', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
    cache: 'no-store',
  });
  const body = await response.text();

  if (!response.ok) {
    const message = xmlValue(body, 'Message') ?? `STS HTTP ${response.status}`;
    throw new Error(`Unable to assume the Vercel AWS role: ${message}`);
  }

  const accessKeyId = xmlValue(body, 'AccessKeyId');
  const secretAccessKey = xmlValue(body, 'SecretAccessKey');
  const sessionToken = xmlValue(body, 'SessionToken');
  const expirationText = xmlValue(body, 'Expiration');
  const expiration = expirationText ? Date.parse(expirationText) : Number.NaN;

  if (!accessKeyId || !secretAccessKey || !sessionToken) {
    throw new Error('AWS STS returned incomplete temporary credentials.');
  }

  return {
    accessKeyId,
    secretAccessKey,
    sessionToken,
    expiration: Number.isFinite(expiration) ? expiration : Date.now() + 45 * 60_000,
  };
}

async function awsCredentials(): Promise<AwsCredentials> {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

  if (accessKeyId && secretAccessKey) {
    return {
      accessKeyId,
      secretAccessKey,
      sessionToken: process.env.AWS_SESSION_TOKEN?.trim() || undefined,
    };
  }

  const roleArn = process.env.AWS_ROLE_ARN?.trim();
  if (!roleArn) {
    throw new Error(
      'Configure AWS_ROLE_ARN for Vercel OIDC, or AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.'
    );
  }

  const cached = cachedRoleCredentials;
  if (
    cached?.roleArn === roleArn &&
    cached.credentials.expiration &&
    cached.credentials.expiration - CREDENTIAL_REFRESH_SKEW_MS > Date.now()
  ) {
    return cached.credentials;
  }

  const credentials = await requestOidcCredentials(roleArn);
  cachedRoleCredentials = { roleArn, credentials };
  return credentials;
}

async function awsJsonRequest<T>({
  credentials,
  service,
  region,
  targetPrefix,
  action,
  body,
  host,
}: {
  credentials: AwsCredentials;
  service: string;
  region: string;
  targetPrefix: string;
  action: string;
  body: Record<string, unknown>;
  host?: string;
}): Promise<T> {
  const requestDate = new Date();
  const timestamp = amzDate(requestDate);
  const day = dateStamp(requestDate);
  const requestHost = host ?? `${service}.${region}.amazonaws.com`;
  const endpoint = `https://${requestHost}/`;
  const payload = JSON.stringify(body);
  const target = `${targetPrefix}.${action}`;
  const canonicalHeaderMap: Record<string, string> = {
    'content-type': 'application/x-amz-json-1.1',
    host: requestHost,
    'x-amz-date': timestamp,
    'x-amz-target': target,
  };

  if (credentials.sessionToken) {
    canonicalHeaderMap['x-amz-security-token'] = credentials.sessionToken;
  }

  const signedHeaders = Object.keys(canonicalHeaderMap).sort();
  const canonicalHeaders = signedHeaders
    .map(name => `${name}:${collapseHeaderWhitespace(canonicalHeaderMap[name])}\n`)
    .join('');
  const canonicalRequest = [
    'POST',
    '/',
    '',
    canonicalHeaders,
    signedHeaders.join(';'),
    sha256(payload),
  ].join('\n');
  const scope = `${day}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    timestamp,
    scope,
    sha256(canonicalRequest),
  ].join('\n');
  const kDate = hmac(`AWS4${credentials.secretAccessKey}`, day);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = createHmac('sha256', kSigning)
    .update(stringToSign, 'utf8')
    .digest('hex');
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${scope}, ` +
    `SignedHeaders=${signedHeaders.join(';')}, Signature=${signature}`;

  const requestHeaders: Record<string, string> = {
    'content-type': canonicalHeaderMap['content-type'],
    'x-amz-date': timestamp,
    'x-amz-target': target,
    authorization,
  };
  if (credentials.sessionToken) {
    requestHeaders['x-amz-security-token'] = credentials.sessionToken;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: requestHeaders,
    body: payload,
    cache: 'no-store',
  });
  const text = await response.text();

  if (!response.ok) {
    let detail = text;
    try {
      const parsed = JSON.parse(text) as { message?: unknown; Message?: unknown };
      detail =
        stringValue(parsed.message) ?? stringValue(parsed.Message) ?? text;
    } catch {
      // Keep the raw response below.
    }
    throw new Error(`${service}.${action} failed (${response.status}): ${detail.slice(0, 400)}`);
  }

  return (text ? JSON.parse(text) : {}) as T;
}

function lightsailRequest<T>(
  credentials: AwsCredentials,
  region: string,
  action: string,
  body: Record<string, unknown>
) {
  return awsJsonRequest<T>({
    credentials,
    service: 'lightsail',
    region,
    targetPrefix: 'Lightsail_20161128',
    action,
    body,
  });
}

async function allInstances(credentials: AwsCredentials, region: string) {
  const instances: LightsailInstance[] = [];
  let pageToken: string | undefined;

  do {
    const response = await lightsailRequest<{
      instances?: LightsailInstance[];
      nextPageToken?: string;
    }>(credentials, region, 'GetInstances', pageToken ? { pageToken } : {});
    if (Array.isArray(response.instances)) instances.push(...response.instances);
    pageToken = stringValue(response.nextPageToken) ?? undefined;
  } while (pageToken);

  return instances;
}

async function allBundles(credentials: AwsCredentials, region: string) {
  const bundles: LightsailBundle[] = [];
  let pageToken: string | undefined;

  do {
    const response = await lightsailRequest<{
      bundles?: LightsailBundle[];
      nextPageToken?: string;
    }>(credentials, region, 'GetBundles', {
      includeInactive: true,
      ...(pageToken ? { pageToken } : {}),
    });
    if (Array.isArray(response.bundles)) bundles.push(...response.bundles);
    pageToken = stringValue(response.nextPageToken) ?? undefined;
  } while (pageToken);

  return bundles;
}

async function metricData(
  credentials: AwsCredentials,
  region: string,
  instanceName: string,
  metricName: string,
  startTime: Date,
  endTime: Date,
  period: number,
  statistics: string[],
  unit: string
) {
  const response = await lightsailRequest<{ metricData?: MetricDatapoint[] }>(
    credentials,
    region,
    'GetInstanceMetricData',
    {
      instanceName,
      metricName,
      period,
      startTime: startTime.getTime() / 1000,
      endTime: endTime.getTime() / 1000,
      statistics,
      unit,
    }
  );
  return Array.isArray(response.metricData) ? response.metricData : [];
}

function pointTimeMs(point: MetricDatapoint) {
  if (typeof point.timestamp === 'number' && Number.isFinite(point.timestamp)) {
    return point.timestamp * 1000;
  }
  if (typeof point.timestamp === 'string') {
    const parsed = Date.parse(point.timestamp);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function sumMetric(points: MetricDatapoint[], sinceMs?: number) {
  return points.reduce((total, point) => {
    const value = finiteNumber(point.sum);
    if (value === null) return total;
    if (sinceMs !== undefined) {
      const timestamp = pointTimeMs(point);
      if (timestamp === null || timestamp < sinceMs) return total;
    }
    return total + value;
  }, 0);
}

function weightedAverage(points: MetricDatapoint[], key: 'average') {
  let weighted = 0;
  let samples = 0;
  for (const point of points) {
    const value = finiteNumber(point[key]);
    if (value === null) continue;
    const sampleCount = finiteNumber(point.sampleCount) ?? 1;
    weighted += value * sampleCount;
    samples += sampleCount;
  }
  return samples > 0 ? weighted / samples : null;
}

function maximum(points: MetricDatapoint[]) {
  const values = points.map(point => finiteNumber(point.maximum)).filter((value): value is number => value !== null);
  return values.length > 0 ? Math.max(...values) : null;
}

function latestAverage(points: MetricDatapoint[]) {
  return points
    .map(point => ({ value: finiteNumber(point.average), timestamp: pointTimeMs(point) }))
    .filter(
      (point): point is { value: number; timestamp: number } =>
        point.value !== null && point.timestamp !== null
    )
    .sort((left, right) => right.timestamp - left.timestamp)[0]?.value ?? null;
}

function monthStart(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

function nextMonth(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 1));
}

function tomorrowUtc(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate() + 1));
}

function billingRegionPrefix(region: string) {
  const prefixes: Record<string, string> = {
    'us-east-1': 'USE1',
    'us-east-2': 'USE2',
    'us-west-1': 'USW1',
    'us-west-2': 'USW2',
    'ca-central-1': 'CAN1',
    'ap-northeast-1': 'APN1',
    'ap-northeast-2': 'APN2',
    'ap-east-1': 'APE1',
    'ap-southeast-1': 'APS1',
    'ap-southeast-2': 'APS2',
    'ap-south-1': 'APS3',
    'ap-southeast-3': 'APS4',
    'ap-southeast-5': 'APS7',
    'eu-west-1': 'EU',
    'eu-central-1': 'EUC1',
    'eu-west-2': 'EUW2',
    'eu-west-3': 'EUW3',
    'eu-north-1': 'EUN1',
    'eu-south-2': 'EUS2',
    'sa-east-1': 'SAE1',
  };
  return prefixes[region] ?? null;
}

async function costExplorerSummary(
  credentials: AwsCredentials,
  lightsailRegion: string,
  now: Date
): Promise<BillingSummary | null> {
  const regionPrefix = billingRegionPrefix(lightsailRegion);
  if (!regionPrefix) return null;

  const start = monthStart(now).toISOString().slice(0, 10);
  const end = tomorrowUtc(now).toISOString().slice(0, 10);
  const response = await awsJsonRequest<{
    ResultsByTime?: Array<{
      Estimated?: boolean;
      Groups?: Array<{
        Keys?: string[];
        Metrics?: Record<
          string,
          {
            Amount?: string;
            Unit?: string;
          }
        >;
      }>;
    }>;
  }>({
    credentials,
    service: 'ce',
    region: 'us-east-1',
    host: 'ce.us-east-1.amazonaws.com',
    targetPrefix: 'AWSInsightsIndexService',
    action: 'GetCostAndUsage',
    body: {
      TimePeriod: { Start: start, End: end },
      Granularity: 'MONTHLY',
      Metrics: ['UsageQuantity', 'UnblendedCost'],
      Filter: {
        Dimensions: {
          Key: 'SERVICE',
          Values: ['Amazon Lightsail'],
        },
      },
      GroupBy: [{ Type: 'DIMENSION', Key: 'USAGE_TYPE' }],
    },
  });

  const result = response.ResultsByTime?.[0];
  const groups = Array.isArray(result?.Groups) ? result.Groups : [];
  const usage = new Map<string, number>();
  let costUsd = 0;
  let hasCost = false;

  for (const group of groups) {
    const key = group.Keys?.[0];
    if (!key) continue;
    const usageAmount = Number(group.Metrics?.UsageQuantity?.Amount);
    if (Number.isFinite(usageAmount)) usage.set(key, usageAmount);
    const cost = Number(group.Metrics?.UnblendedCost?.Amount);
    if (Number.isFinite(cost)) {
      costUsd += cost;
      hasCost = true;
    }
  }

  const inType = `${regionPrefix}-TotalDataXfer-In-Bytes`;
  const outType = `${regionPrefix}-TotalDataXfer-Out-Bytes`;
  const overageType = `${regionPrefix}-DataXfer-Out-Overage-Bytes`;

  return {
    costUsd: hasCost ? costUsd : null,
    transferInGb: usage.get(inType) ?? null,
    transferOutGb: usage.get(outType) ?? null,
    overageOutGb: usage.get(overageType) ?? 0,
    estimated: typeof result?.Estimated === 'boolean' ? result.Estimated : null,
  };
}

function publicPort(instance: LightsailInstance, port: number, protocol: string) {
  return Boolean(
    instance.networking?.ports?.some(rule => {
      if (rule.accessDirection && rule.accessDirection !== 'inbound') return false;
      if (rule.accessType && rule.accessType !== 'public') return false;
      if (rule.protocol !== protocol) return false;
      const from = finiteNumber(rule.fromPort);
      const to = finiteNumber(rule.toPort);
      return from !== null && to !== null && from <= port && to >= port;
    })
  );
}

async function buildSnapshot(
  credentials: AwsCredentials,
  region: string,
  instanceName: string
): Promise<LightsailAwsSnapshot> {
  const checkedAt = new Date();
  const cycleStart = monthStart(checkedAt);
  const resetAt = nextMonth(checkedAt);
  const cutoff24h = checkedAt.getTime() - DAY_MS;
  const [instances, bundles] = await Promise.all([
    allInstances(credentials, region),
    allBundles(credentials, region),
  ]);
  const instance = instances.find(item => item.name === instanceName);

  if (!instance) {
    const available = instances.map(item => item.name).filter(Boolean).join(', ');
    throw new Error(
      `Lightsail instance ${instanceName} was not found in ${region}.${available ? ` Available: ${available}` : ''}`
    );
  }

  const bundleId = stringValue(instance.bundleId);
  const pool = bundleId
    ? instances.filter(item => item.bundleId === bundleId)
    : [instance];
  const bundle = bundleId
    ? bundles.find(item => item.bundleId === bundleId) ?? null
    : null;

  const network = await Promise.all(
    pool.map(async pooledInstance => {
      if (!pooledInstance.name) return null;
      const [networkIn, networkOut] = await Promise.all([
        metricData(
          credentials,
          region,
          pooledInstance.name,
          'NetworkIn',
          cycleStart,
          checkedAt,
          3600,
          ['Sum'],
          'Bytes'
        ),
        metricData(
          credentials,
          region,
          pooledInstance.name,
          'NetworkOut',
          cycleStart,
          checkedAt,
          3600,
          ['Sum'],
          'Bytes'
        ),
      ]);
      return {
        monthIn: sumMetric(networkIn),
        monthOut: sumMetric(networkOut),
        dayIn: sumMetric(networkIn, cutoff24h),
        dayOut: sumMetric(networkOut, cutoff24h),
      };
    })
  );

  const networkTotals = network.reduce(
    (total, value) => ({
      monthIn: total.monthIn + (value?.monthIn ?? 0),
      monthOut: total.monthOut + (value?.monthOut ?? 0),
      dayIn: total.dayIn + (value?.dayIn ?? 0),
      dayOut: total.dayOut + (value?.dayOut ?? 0),
    }),
    { monthIn: 0, monthOut: 0, dayIn: 0, dayOut: 0 }
  );

  const start24h = new Date(cutoff24h);
  const [cpuPoints, burstPoints, statusPoints] = await Promise.all([
    metricData(
      credentials,
      region,
      instanceName,
      'CPUUtilization',
      start24h,
      checkedAt,
      300,
      ['Average', 'Maximum'],
      'Percent'
    ),
    metricData(
      credentials,
      region,
      instanceName,
      'BurstCapacityPercentage',
      start24h,
      checkedAt,
      300,
      ['Average', 'Maximum'],
      'Percent'
    ),
    metricData(
      credentials,
      region,
      instanceName,
      'StatusCheckFailed',
      start24h,
      checkedAt,
      60,
      ['Sum'],
      'Count'
    ),
  ]);

  const allocatedGb = pool.reduce((total, item) => {
    const value = finiteNumber(item.networking?.monthlyTransfer?.gbPerMonthAllocated);
    return total + (value ?? 0);
  }, 0);
  const fallbackPerInstanceGb = finiteNumber(bundle?.transferPerMonthInGb);
  const allowanceGb =
    allocatedGb > 0
      ? allocatedGb
      : fallbackPerInstanceGb !== null
        ? fallbackPerInstanceGb * Math.max(1, pool.length)
        : null;
  const allowanceBytes = allowanceGb === null ? null : allowanceGb * 1024 ** 3;
  const usedBytes = networkTotals.monthIn + networkTotals.monthOut;
  const remainingBytes =
    allowanceBytes === null ? null : Math.max(0, allowanceBytes - usedBytes);

  let billing: BillingSummary | null = null;
  let billingError: string | null = null;
  try {
    billing = await costExplorerSummary(credentials, region, checkedAt);
  } catch (error) {
    billingError = cleanAwsError(error);
  }

  return {
    checkedAt: checkedAt.toISOString(),
    region,
    availabilityZone: stringValue(instance.location?.availabilityZone),
    instanceName,
    state: stringValue(instance.state?.name),
    publicIpAddress: stringValue(instance.publicIpAddress),
    staticIp: typeof instance.isStaticIp === 'boolean' ? instance.isStaticIp : null,
    blueprintName: stringValue(instance.blueprintName),
    poolSize: pool.length,
    pooledInstanceNames: pool.map(item => item.name).filter((value): value is string => Boolean(value)),
    plan: {
      bundleId,
      name: stringValue(bundle?.name),
      priceUsd: finiteNumber(bundle?.price),
      ramGb: finiteNumber(bundle?.ramSizeInGb),
      cpuCount: finiteNumber(bundle?.cpuCount) ?? finiteNumber(instance.hardware?.cpuCount),
      diskGb:
        finiteNumber(bundle?.diskSizeInGb) ??
        finiteNumber(instance.hardware?.disks?.find(disk => disk.isSystemDisk)?.sizeInGb),
      transferPerInstanceGb:
        finiteNumber(instance.networking?.monthlyTransfer?.gbPerMonthAllocated) ??
        fallbackPerInstanceGb,
    },
    transfer: {
      cycleStart: cycleStart.toISOString(),
      resetAt: resetAt.toISOString(),
      allowanceBytes,
      usedBytes,
      remainingBytes,
      networkInBytes: networkTotals.monthIn,
      networkOutBytes: networkTotals.monthOut,
      last24hBytes: networkTotals.dayIn + networkTotals.dayOut,
      last24hInBytes: networkTotals.dayIn,
      last24hOutBytes: networkTotals.dayOut,
    },
    cpu: {
      average24h: weightedAverage(cpuPoints, 'average'),
      maximum24h: maximum(cpuPoints),
    },
    burst: {
      latestPercent: latestAverage(burstPoints),
      average24h: weightedAverage(burstPoints, 'average'),
      maximum24h: maximum(burstPoints),
    },
    statusCheckFailures24h: sumMetric(statusPoints),
    ports: {
      tcp443: publicPort(instance, 443, 'tcp'),
      udp443: publicPort(instance, 443, 'udp'),
      ssh22: publicPort(instance, 22, 'tcp'),
    },
    billing,
    billingError,
  };
}

export async function readLightsailAwsDashboard(): Promise<LightsailAwsReadResult> {
  const region = process.env.AWS_LIGHTSAIL_REGION?.trim() || DEFAULT_REGION;
  const instanceName =
    process.env.AWS_LIGHTSAIL_INSTANCE_NAME?.trim() || DEFAULT_INSTANCE_NAME;

  if (
    cachedDashboard &&
    cachedDashboard.region === region &&
    cachedDashboard.instanceName === instanceName &&
    cachedDashboard.expiresAt > Date.now()
  ) {
    return { status: 'ok', data: cachedDashboard.data };
  }

  let credentials: AwsCredentials;
  try {
    credentials = await awsCredentials();
  } catch (error) {
    return { status: 'configuration-error', message: cleanAwsError(error) };
  }

  try {
    const data = await buildSnapshot(credentials, region, instanceName);
    cachedDashboard = {
      expiresAt: Date.now() + DASHBOARD_CACHE_MS,
      region,
      instanceName,
      data,
    };
    return { status: 'ok', data };
  } catch (error) {
    return { status: 'error', message: cleanAwsError(error) };
  }
}
