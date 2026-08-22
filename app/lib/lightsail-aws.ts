import { createHash, createHmac } from 'node:crypto';

import { headers } from 'next/headers';

const DEFAULT_REGION = 'us-west-2';
const DEFAULT_INSTANCE_NAME = 'lightsail-uswest2';
const CACHE_MS = 60_000;
const CREDENTIAL_SKEW_MS = 5 * 60_000;
const DAY_MS = 24 * 60 * 60 * 1000;

type AwsCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  expiration?: number;
};

type MetricPoint = {
  timestamp?: number | string;
  sum?: number;
  average?: number;
  maximum?: number;
  sampleCount?: number;
};

type Instance = {
  name?: string;
  bundleId?: string;
  blueprintName?: string;
  isStaticIp?: boolean;
  publicIpAddress?: string;
  location?: { availabilityZone?: string; regionName?: string };
  hardware?: {
    cpuCount?: number;
    ramSizeInGb?: number;
    disks?: Array<{ isSystemDisk?: boolean; sizeInGb?: number }>;
  };
  networking?: {
    monthlyTransfer?: { gbPerMonthAllocated?: number };
    ports?: Array<{
      accessDirection?: string;
      accessType?: string;
      fromPort?: number;
      toPort?: number;
      protocol?: string;
    }>;
  };
  state?: { code?: number; name?: string };
};

type Bundle = {
  bundleId?: string;
  name?: string;
  price?: number;
  ramSizeInGb?: number;
  cpuCount?: number;
  diskSizeInGb?: number;
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
  cpu: { average24h: number | null; maximum24h: number | null };
  burst: {
    latestPercent: number | null;
    average24h: number | null;
    maximum24h: number | null;
  };
  statusCheckFailures24h: number | null;
  ports: { tcp443: boolean; udp443: boolean; ssh22: boolean };
  billing: BillingSummary | null;
  billingError: string | null;
};

export type LightsailAwsReadResult =
  | { status: 'ok'; data: LightsailAwsSnapshot }
  | { status: 'configuration-error'; message: string }
  | { status: 'error'; message: string };

let credentialCache:
  | { roleArn: string; credentials: AwsCredentials }
  | undefined;
let dashboardCache:
  | {
      region: string;
      instanceName: string;
      expiresAt: number;
      data: LightsailAwsSnapshot;
    }
  | undefined;

function numberOrNull(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringOrNull(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function errorText(value: unknown) {
  if (value instanceof Error && value.message) return value.message.slice(0, 500);
  return String(value).slice(0, 500);
}

function sha256(value: string) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function hmac(key: Buffer | string, value: string) {
  return createHmac('sha256', key).update(value, 'utf8').digest();
}

function amzDate(value: Date) {
  return value.toISOString().replace(/[:-]|\.\d{3}/g, '');
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

async function oidcCredentials(roleArn: string): Promise<AwsCredentials> {
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
      'AWS_ROLE_ARN is set, but Vercel did not supply an OIDC token for this request.'
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
    throw new Error(
      `Unable to assume the Vercel AWS role: ${xmlValue(body, 'Message') ?? `STS HTTP ${response.status}`}`
    );
  }

  const accessKeyId = xmlValue(body, 'AccessKeyId');
  const secretAccessKey = xmlValue(body, 'SecretAccessKey');
  const sessionToken = xmlValue(body, 'SessionToken');
  const expirationText = xmlValue(body, 'Expiration');
  if (!accessKeyId || !secretAccessKey || !sessionToken) {
    throw new Error('AWS STS returned incomplete temporary credentials.');
  }

  const parsedExpiration = expirationText ? Date.parse(expirationText) : Number.NaN;
  return {
    accessKeyId,
    secretAccessKey,
    sessionToken,
    expiration: Number.isFinite(parsedExpiration)
      ? parsedExpiration
      : Date.now() + 45 * 60_000,
  };
}

async function credentials(): Promise<AwsCredentials> {
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

  if (
    credentialCache?.roleArn === roleArn &&
    credentialCache.credentials.expiration &&
    credentialCache.credentials.expiration - CREDENTIAL_SKEW_MS > Date.now()
  ) {
    return credentialCache.credentials;
  }

  const value = await oidcCredentials(roleArn);
  credentialCache = { roleArn, credentials: value };
  return value;
}

async function awsJson<T>({
  credentials: creds,
  service,
  region,
  host = `${service}.${region}.amazonaws.com`,
  targetPrefix,
  action,
  body,
}: {
  credentials: AwsCredentials;
  service: string;
  region: string;
  host?: string;
  targetPrefix: string;
  action: string;
  body: Record<string, unknown>;
}): Promise<T> {
  const now = new Date();
  const timestamp = amzDate(now);
  const day = timestamp.slice(0, 8);
  const target = `${targetPrefix}.${action}`;
  const payload = JSON.stringify(body);
  const headerValues: Record<string, string> = {
    'content-type': 'application/x-amz-json-1.1',
    host,
    'x-amz-date': timestamp,
    'x-amz-target': target,
  };
  if (creds.sessionToken) {
    headerValues['x-amz-security-token'] = creds.sessionToken;
  }

  const signedHeaders = Object.keys(headerValues).sort();
  const canonicalHeaders = signedHeaders
    .map(name => `${name}:${headerValues[name].trim().replace(/\s+/g, ' ')}\n`)
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
  const kDate = hmac(`AWS4${creds.secretAccessKey}`, day);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = createHmac('sha256', kSigning)
    .update(stringToSign, 'utf8')
    .digest('hex');

  const requestHeaders: Record<string, string> = {
    'content-type': headerValues['content-type'],
    'x-amz-date': timestamp,
    'x-amz-target': target,
    authorization:
      `AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${scope}, ` +
      `SignedHeaders=${signedHeaders.join(';')}, Signature=${signature}`,
  };
  if (creds.sessionToken) {
    requestHeaders['x-amz-security-token'] = creds.sessionToken;
  }

  const response = await fetch(`https://${host}/`, {
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
      detail = stringOrNull(parsed.message) ?? stringOrNull(parsed.Message) ?? text;
    } catch {
      // Keep raw AWS response.
    }
    throw new Error(
      `${service}.${action} failed (${response.status}): ${detail.slice(0, 400)}`
    );
  }
  return (text ? JSON.parse(text) : {}) as T;
}

function lightsail<T>(
  creds: AwsCredentials,
  region: string,
  action: string,
  body: Record<string, unknown>
) {
  return awsJson<T>({
    credentials: creds,
    service: 'lightsail',
    region,
    targetPrefix: 'Lightsail_20161128',
    action,
    body,
  });
}

async function getInstances(creds: AwsCredentials, region: string) {
  const values: Instance[] = [];
  let pageToken: string | undefined;
  do {
    const result = await lightsail<{
      instances?: Instance[];
      nextPageToken?: string;
    }>(creds, region, 'GetInstances', pageToken ? { pageToken } : {});
    if (Array.isArray(result.instances)) values.push(...result.instances);
    pageToken = stringOrNull(result.nextPageToken) ?? undefined;
  } while (pageToken);
  return values;
}

async function getBundles(creds: AwsCredentials, region: string) {
  const values: Bundle[] = [];
  let pageToken: string | undefined;
  do {
    const result = await lightsail<{ bundles?: Bundle[]; nextPageToken?: string }>(
      creds,
      region,
      'GetBundles',
      { includeInactive: true, ...(pageToken ? { pageToken } : {}) }
    );
    if (Array.isArray(result.bundles)) values.push(...result.bundles);
    pageToken = stringOrNull(result.nextPageToken) ?? undefined;
  } while (pageToken);
  return values;
}

async function metric(
  creds: AwsCredentials,
  region: string,
  instanceName: string,
  metricName: string,
  startTime: Date,
  endTime: Date,
  period: number,
  statistics: string[],
  unit: string
) {
  const result = await lightsail<{ metricData?: MetricPoint[] }>(
    creds,
    region,
    'GetInstanceMetricData',
    {
      instanceName,
      metricName,
      startTime: startTime.getTime() / 1000,
      endTime: endTime.getTime() / 1000,
      period,
      statistics,
      unit,
    }
  );
  return Array.isArray(result.metricData) ? result.metricData : [];
}

function pointTime(point: MetricPoint) {
  if (typeof point.timestamp === 'number' && Number.isFinite(point.timestamp)) {
    return point.timestamp * 1000;
  }
  if (typeof point.timestamp === 'string') {
    const value = Date.parse(point.timestamp);
    return Number.isFinite(value) ? value : null;
  }
  return null;
}

function metricSum(points: MetricPoint[], since?: number) {
  let total = 0;
  for (const point of points) {
    const value = numberOrNull(point.sum);
    if (value === null) continue;
    if (since !== undefined) {
      const timestamp = pointTime(point);
      if (timestamp === null || timestamp < since) continue;
    }
    total += value;
  }
  return total;
}

function metricAverage(points: MetricPoint[]) {
  let total = 0;
  let samples = 0;
  for (const point of points) {
    const value = numberOrNull(point.average);
    if (value === null) continue;
    const count = numberOrNull(point.sampleCount) ?? 1;
    total += value * count;
    samples += count;
  }
  return samples > 0 ? total / samples : null;
}

function metricMaximum(points: MetricPoint[]) {
  let result: number | null = null;
  for (const point of points) {
    const value = numberOrNull(point.maximum);
    if (value !== null && (result === null || value > result)) result = value;
  }
  return result;
}

function metricLatestAverage(points: MetricPoint[]) {
  let result: { timestamp: number; value: number } | null = null;
  for (const point of points) {
    const timestamp = pointTime(point);
    const value = numberOrNull(point.average);
    if (timestamp === null || value === null) continue;
    if (!result || timestamp > result.timestamp) result = { timestamp, value };
  }
  return result?.value ?? null;
}

function utcMonthStart(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

function utcNextMonth(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 1));
}

function tomorrow(value: Date) {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate() + 1)
  );
}

function regionBillingCode(region: string) {
  const values: Record<string, string> = {
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
  return values[region] ?? null;
}

async function billingSummary(
  creds: AwsCredentials,
  region: string,
  checkedAt: Date
): Promise<BillingSummary | null> {
  const code = regionBillingCode(region);
  if (!code) return null;
  const result = await awsJson<{
    ResultsByTime?: Array<{
      Estimated?: boolean;
      Groups?: Array<{
        Keys?: string[];
        Metrics?: Record<string, { Amount?: string; Unit?: string }>;
      }>;
    }>;
  }>({
    credentials: creds,
    service: 'ce',
    region: 'us-east-1',
    host: 'ce.us-east-1.amazonaws.com',
    targetPrefix: 'AWSInsightsIndexService',
    action: 'GetCostAndUsage',
    body: {
      TimePeriod: {
        Start: utcMonthStart(checkedAt).toISOString().slice(0, 10),
        End: tomorrow(checkedAt).toISOString().slice(0, 10),
      },
      Granularity: 'MONTHLY',
      Metrics: ['UsageQuantity', 'UnblendedCost'],
      Filter: { Dimensions: { Key: 'SERVICE', Values: ['Amazon Lightsail'] } },
      GroupBy: [{ Type: 'DIMENSION', Key: 'USAGE_TYPE' }],
    },
  });

  const period = result.ResultsByTime?.[0];
  const groups = period?.Groups ?? [];
  const usage = new Map<string, number>();
  let costUsd = 0;
  let hasCost = false;
  for (const group of groups) {
    const key = group.Keys?.[0];
    if (!key) continue;
    const quantity = Number(group.Metrics?.UsageQuantity?.Amount);
    if (Number.isFinite(quantity)) usage.set(key, quantity);
    const cost = Number(group.Metrics?.UnblendedCost?.Amount);
    if (Number.isFinite(cost)) {
      costUsd += cost;
      hasCost = true;
    }
  }

  return {
    costUsd: hasCost ? costUsd : null,
    transferInGb: usage.get(`${code}-TotalDataXfer-In-Bytes`) ?? null,
    transferOutGb: usage.get(`${code}-TotalDataXfer-Out-Bytes`) ?? null,
    overageOutGb: usage.get(`${code}-DataXfer-Out-Overage-Bytes`) ?? 0,
    estimated:
      typeof period?.Estimated === 'boolean' ? period.Estimated : null,
  };
}

function hasPublicPort(instance: Instance, port: number, protocol: string) {
  return Boolean(
    instance.networking?.ports?.some(rule => {
      if (rule.accessDirection && rule.accessDirection !== 'inbound') return false;
      if (rule.accessType && rule.accessType !== 'public') return false;
      if (rule.protocol !== protocol) return false;
      const from = numberOrNull(rule.fromPort);
      const to = numberOrNull(rule.toPort);
      return from !== null && to !== null && from <= port && to >= port;
    })
  );
}

async function snapshot(
  creds: AwsCredentials,
  region: string,
  instanceName: string
): Promise<LightsailAwsSnapshot> {
  const checkedAt = new Date();
  const monthStart = utcMonthStart(checkedAt);
  const resetAt = utcNextMonth(checkedAt);
  const cutoff24h = checkedAt.getTime() - DAY_MS;
  const [instances, bundles] = await Promise.all([
    getInstances(creds, region),
    getBundles(creds, region),
  ]);
  const instance = instances.find(value => value.name === instanceName);
  if (!instance) {
    const names = instances.map(value => value.name).filter(Boolean).join(', ');
    throw new Error(
      `Lightsail instance ${instanceName} was not found in ${region}.${names ? ` Available: ${names}` : ''}`
    );
  }

  const bundleId = stringOrNull(instance.bundleId);
  const pool = bundleId
    ? instances.filter(value => value.bundleId === bundleId)
    : [instance];
  const bundle = bundleId
    ? bundles.find(value => value.bundleId === bundleId) ?? null
    : null;

  let monthIn = 0;
  let monthOut = 0;
  let dayIn = 0;
  let dayOut = 0;
  await Promise.all(
    pool.map(async value => {
      if (!value.name) return;
      const [incoming, outgoing] = await Promise.all([
        metric(
          creds,
          region,
          value.name,
          'NetworkIn',
          monthStart,
          checkedAt,
          3600,
          ['Sum'],
          'Bytes'
        ),
        metric(
          creds,
          region,
          value.name,
          'NetworkOut',
          monthStart,
          checkedAt,
          3600,
          ['Sum'],
          'Bytes'
        ),
      ]);
      monthIn += metricSum(incoming);
      monthOut += metricSum(outgoing);
      dayIn += metricSum(incoming, cutoff24h);
      dayOut += metricSum(outgoing, cutoff24h);
    })
  );

  const start24h = new Date(cutoff24h);
  const [cpu, burst, status] = await Promise.all([
    metric(
      creds,
      region,
      instanceName,
      'CPUUtilization',
      start24h,
      checkedAt,
      300,
      ['Average', 'Maximum'],
      'Percent'
    ),
    metric(
      creds,
      region,
      instanceName,
      'BurstCapacityPercentage',
      start24h,
      checkedAt,
      300,
      ['Average', 'Maximum'],
      'Percent'
    ),
    metric(
      creds,
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

  let allocatedGb = 0;
  for (const value of pool) {
    allocatedGb +=
      numberOrNull(value.networking?.monthlyTransfer?.gbPerMonthAllocated) ?? 0;
  }
  const bundleTransferGb = numberOrNull(bundle?.transferPerMonthInGb);
  const allowanceGb =
    allocatedGb > 0
      ? allocatedGb
      : bundleTransferGb !== null
        ? bundleTransferGb * Math.max(pool.length, 1)
        : null;
  const allowanceBytes = allowanceGb === null ? null : allowanceGb * 1024 ** 3;
  const usedBytes = monthIn + monthOut;

  let billing: BillingSummary | null = null;
  let billingError: string | null = null;
  try {
    billing = await billingSummary(creds, region, checkedAt);
  } catch (error) {
    billingError = errorText(error);
  }

  return {
    checkedAt: checkedAt.toISOString(),
    region,
    availabilityZone: stringOrNull(instance.location?.availabilityZone),
    instanceName,
    state: stringOrNull(instance.state?.name),
    publicIpAddress: stringOrNull(instance.publicIpAddress),
    staticIp:
      typeof instance.isStaticIp === 'boolean' ? instance.isStaticIp : null,
    blueprintName: stringOrNull(instance.blueprintName),
    poolSize: pool.length,
    pooledInstanceNames: pool
      .map(value => value.name)
      .filter((value): value is string => Boolean(value)),
    plan: {
      bundleId,
      name: stringOrNull(bundle?.name),
      priceUsd: numberOrNull(bundle?.price),
      ramGb:
        numberOrNull(bundle?.ramSizeInGb) ??
        numberOrNull(instance.hardware?.ramSizeInGb),
      cpuCount:
        numberOrNull(bundle?.cpuCount) ?? numberOrNull(instance.hardware?.cpuCount),
      diskGb:
        numberOrNull(bundle?.diskSizeInGb) ??
        numberOrNull(
          instance.hardware?.disks?.find(value => value.isSystemDisk)?.sizeInGb
        ),
      transferPerInstanceGb:
        numberOrNull(instance.networking?.monthlyTransfer?.gbPerMonthAllocated) ??
        bundleTransferGb,
    },
    transfer: {
      cycleStart: monthStart.toISOString(),
      resetAt: resetAt.toISOString(),
      allowanceBytes,
      usedBytes,
      remainingBytes:
        allowanceBytes === null ? null : Math.max(0, allowanceBytes - usedBytes),
      networkInBytes: monthIn,
      networkOutBytes: monthOut,
      last24hBytes: dayIn + dayOut,
      last24hInBytes: dayIn,
      last24hOutBytes: dayOut,
    },
    cpu: {
      average24h: metricAverage(cpu),
      maximum24h: metricMaximum(cpu),
    },
    burst: {
      latestPercent: metricLatestAverage(burst),
      average24h: metricAverage(burst),
      maximum24h: metricMaximum(burst),
    },
    statusCheckFailures24h: metricSum(status),
    ports: {
      tcp443: hasPublicPort(instance, 443, 'tcp'),
      udp443: hasPublicPort(instance, 443, 'udp'),
      ssh22: hasPublicPort(instance, 22, 'tcp'),
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
    dashboardCache?.region === region &&
    dashboardCache.instanceName === instanceName &&
    dashboardCache.expiresAt > Date.now()
  ) {
    return { status: 'ok', data: dashboardCache.data };
  }

  let creds: AwsCredentials;
  try {
    creds = await credentials();
  } catch (error) {
    return { status: 'configuration-error', message: errorText(error) };
  }

  try {
    const data = await snapshot(creds, region, instanceName);
    dashboardCache = {
      region,
      instanceName,
      expiresAt: Date.now() + CACHE_MS,
      data,
    };
    return { status: 'ok', data };
  } catch (error) {
    return { status: 'error', message: errorText(error) };
  }
}
