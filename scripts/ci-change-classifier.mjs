const ROOT_DOCUMENTATION = new Set(['README.md']);
const UNIT_TEST_SUFFIXES = ['.test.ts', '.test.tsx'];
const WRITING_REGISTRY_PATHS = new Set([
  'lib/agent-guestbook.ts',
  'lib/bot-desk.ts',
]);

function normalizePath(path) {
  return String(path ?? '')
    .trim()
    .replaceAll('\\', '/');
}

function isWorkbenchArticlePath(path) {
  return (
    (path.startsWith('public/desk/') || path.startsWith('public/journal/')) &&
    path.endsWith('.md')
  );
}

export function isWritingFastPassPath(path) {
  const normalized = normalizePath(path);
  if (!normalized) return false;

  return normalized.endsWith('.md') || WRITING_REGISTRY_PATHS.has(normalized);
}

export function isWritingFastPassChange(paths) {
  const normalizedPaths = [...new Set(paths.map(normalizePath).filter(Boolean))];
  if (normalizedPaths.length === 0) return false;
  if (!normalizedPaths.every(isWritingFastPassPath)) return false;

  if (normalizedPaths.includes('lib/bot-desk.ts')) {
    return normalizedPaths.some(isWorkbenchArticlePath);
  }

  return true;
}

export function isBrowserIndependentCiPath(path) {
  const normalized = normalizePath(path);
  if (!normalized) return false;

  if (normalized.endsWith('.md')) return true;
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
      mode: 'full',
      runVerify: true,
      runBrowser: true,
      reason: 'No changed paths were resolved; run the full suite by default.',
      browserIndependentPaths,
      browserRelevantPaths,
    };
  }

  if (isWritingFastPassChange(normalizedPaths)) {
    return {
      mode: 'writing-fast-pass',
      runVerify: false,
      runBrowser: false,
      reason: `Writing fast-pass: all ${normalizedPaths.length} changed path${normalizedPaths.length === 1 ? '' : 's'} are Markdown or an allowlisted publication/check-in registry update.`,
      browserIndependentPaths,
      browserRelevantPaths,
    };
  }

  if (browserRelevantPaths.length > 0) {
    return {
      mode: 'full',
      runVerify: true,
      runBrowser: true,
      reason: `Full suite required because ${browserRelevantPaths.length} changed path${browserRelevantPaths.length === 1 ? '' : 's'} may affect runtime or browser behavior.`,
      browserIndependentPaths,
      browserRelevantPaths,
    };
  }

  return {
    mode: 'verify-only',
    runVerify: true,
    runBrowser: false,
    reason: `Verify-only: all ${normalizedPaths.length} changed path${normalizedPaths.length === 1 ? '' : 's'} are browser-independent, but the change is not an ordinary writing fast-pass.`,
    browserIndependentPaths,
    browserRelevantPaths,
  };
}
