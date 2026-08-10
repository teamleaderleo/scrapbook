const ROOT_DOCUMENTATION = new Set(['README.md']);
const UNIT_TEST_SUFFIXES = ['.test.ts', '.test.tsx'];

function normalizePath(path) {
  return String(path ?? '')
    .trim()
    .replaceAll('\\', '/');
}

export function isBrowserIndependentCiPath(path) {
  const normalized = normalizePath(path);
  if (!normalized) return false;

  if (normalized.startsWith('docs/') && !normalized.endsWith('/')) return true;
  if (ROOT_DOCUMENTATION.has(normalized)) return true;

  if (
    UNIT_TEST_SUFFIXES.some(suffix => normalized.endsWith(suffix)) &&
    !normalized.startsWith('tests/e2e/') &&
    !normalized.startsWith('.github/')
  ) {
    return true;
  }

  return false;
}

export function classifyCiPaths(paths) {
  const normalizedPaths = [...new Set(paths.map(normalizePath).filter(Boolean))];
  const browserIndependentPaths = normalizedPaths.filter(isBrowserIndependentCiPath);
  const browserRelevantPaths = normalizedPaths.filter(
    path => !isBrowserIndependentCiPath(path)
  );

  if (normalizedPaths.length === 0) {
    return {
      runBrowser: true,
      reason: 'No changed paths were resolved; run Chromium by default.',
      browserIndependentPaths,
      browserRelevantPaths,
    };
  }

  if (browserRelevantPaths.length > 0) {
    return {
      runBrowser: true,
      reason: `Chromium required because ${browserRelevantPaths.length} changed path${browserRelevantPaths.length === 1 ? '' : 's'} may affect browser behavior.`,
      browserIndependentPaths,
      browserRelevantPaths,
    };
  }

  return {
    runBrowser: false,
    reason: `Chromium may be skipped because all ${normalizedPaths.length} changed path${normalizedPaths.length === 1 ? '' : 's'} are allowlisted as documentation or colocated unit tests.`,
    browserIndependentPaths,
    browserRelevantPaths,
  };
}
