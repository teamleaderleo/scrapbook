export type CacheLoadFailure = {
  name: string;
  message: string;
};

export type CacheLoadResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: CacheLoadFailure };

function describeError(error: unknown): CacheLoadFailure {
  if (error instanceof Error) {
    return {
      name: error.name || 'Error',
      message: error.message || String(error),
    };
  }

  return {
    name: 'Error',
    message: String(error),
  };
}

export async function captureCacheLoad<T>(load: () => Promise<T>): Promise<CacheLoadResult<T>> {
  try {
    return { ok: true, value: await load() };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

export function unwrapCacheLoad<T>(result: CacheLoadResult<T>): T {
  if (result.ok) return result.value;

  const error = new Error(result.error.message);
  error.name = result.error.name;
  throw error;
}
