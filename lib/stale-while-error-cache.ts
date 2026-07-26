export type StaleCacheStatus = 'hit' | 'miss' | 'stale';

export type StaleCacheDiagnostics = {
  status: StaleCacheStatus;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  consecutiveFailures: number;
  nextRetryAt: string | null;
};

export type StaleCacheResult<T> = {
  value: T | null;
  diagnostics: StaleCacheDiagnostics;
  error?: unknown;
};

type StaleCacheOptions<T> = {
  load: () => Promise<T>;
  freshForMs: number;
  staleForMs: number;
  retryBaseMs: number;
  retryMaxMs: number;
  now?: () => number;
};

function asIso(timestamp: number | null): string | null {
  return timestamp === null ? null : new Date(timestamp).toISOString();
}

export function createStaleWhileErrorCache<T>({
  load,
  freshForMs,
  staleForMs,
  retryBaseMs,
  retryMaxMs,
  now = Date.now,
}: StaleCacheOptions<T>) {
  let value: T | null = null;
  let freshUntil = 0;
  let staleUntil = 0;
  let lastAttemptAt: number | null = null;
  let lastSuccessAt: number | null = null;
  let consecutiveFailures = 0;
  let nextRetryAt = 0;
  let lastError: unknown;
  let inFlight: Promise<StaleCacheResult<T>> | null = null;

  const usableValue = (timestamp: number) =>
    value !== null && timestamp < staleUntil ? value : null;

  const result = (
    status: StaleCacheStatus,
    timestamp: number,
    error = lastError,
  ): StaleCacheResult<T> => ({
    value: usableValue(timestamp),
    diagnostics: {
      status,
      lastAttemptAt: asIso(lastAttemptAt),
      lastSuccessAt: asIso(lastSuccessAt),
      consecutiveFailures,
      nextRetryAt: nextRetryAt > timestamp ? asIso(nextRetryAt) : null,
    },
    ...(error === undefined ? {} : { error }),
  });

  const refresh = async (): Promise<StaleCacheResult<T>> => {
    lastAttemptAt = now();

    try {
      const nextValue = await load();
      const completedAt = now();
      value = nextValue;
      freshUntil = completedAt + freshForMs;
      staleUntil = completedAt + staleForMs;
      lastSuccessAt = completedAt;
      consecutiveFailures = 0;
      nextRetryAt = 0;
      lastError = undefined;
      return result('miss', completedAt, undefined);
    } catch (error) {
      const failedAt = now();
      consecutiveFailures += 1;
      lastError = error;
      const backoff = Math.min(
        retryBaseMs * 2 ** Math.max(0, consecutiveFailures - 1),
        retryMaxMs,
      );
      nextRetryAt = failedAt + backoff;
      return result(usableValue(failedAt) === null ? 'miss' : 'stale', failedAt, error);
    }
  };

  return {
    async get(): Promise<StaleCacheResult<T>> {
      const timestamp = now();
      if (value !== null && timestamp < freshUntil) return result('hit', timestamp, undefined);
      if (inFlight) return inFlight;

      if (timestamp < nextRetryAt) {
        return result(usableValue(timestamp) === null ? 'miss' : 'stale', timestamp);
      }

      inFlight = refresh().finally(() => {
        inFlight = null;
      });
      return inFlight;
    },
  };
}
