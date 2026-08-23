const ROOT_DOCUMENTATION = new Set(['README.md']);
const UNIT_TEST_SUFFIXES = ['.test.ts', '.test.tsx'];
const WRITING_REGISTRY_PATHS = new Set([
  'lib/agent-guestbook.ts',
  'lib/bot-desk.ts',
]);

const E2E_GROUPS = new Map([
  ['tests/e2e/activity-field-lab.spec.ts', ['activity-lab']],
  ['tests/e2e/activity-paper-marks.spec.ts', ['home']],
  ['tests/e2e/activity-scoreboard-selection.spec.ts', ['home']],
  ['tests/e2e/bot-desk.spec.ts', ['desk']],
  ['tests/e2e/home-now-shelf.spec.ts', ['home']],
  ['tests/e2e/homepage-density.spec.ts', ['home']],
  ['tests/e2e/operator-console.spec.ts', ['home']],
  ['tests/e2e/site-navigation.spec.ts', ['navigation']],
  ['tests/e2e/visual-shell.spec.ts', ['shell']],
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
  if (normalized.endsWith('.sql')) return true;
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

function browserGroupsForPath(path) {
  if (E2E_GROUPS.has(path)) return E2E_GROUPS.get(path);

  if (path === 'app/page.tsx') return ['home'];
  if (path.startsWith('components/home/')) return ['home'];
  if (path === 'lib/github-home.ts') return ['home'];
  if (path === 'lib/scraplet-store.ts') return ['home'];
  if (path.startsWith('app/api/scraplet/')) return ['home'];
  if (path.startsWith('app/api/github-activity/')) return ['home'];

  if (path.startsWith('app/desk/')) return ['desk'];
  if (path === 'lib/bot-desk-display.ts') return ['home', 'desk'];
  if (path === 'lib/censor-reveal.ts') return ['home', 'desk'];
  if (path === 'components/ui/censor-reveal.tsx') return ['home', 'desk'];

  if (path === 'lib/site-navigation.ts') return ['home', 'navigation', 'shell'];
  if (path === 'components/site-atlas.tsx') return ['navigation', 'shell'];
  if (path === 'components/site-nav.tsx') return ['navigation', 'shell'];

  if (path === 'components/theme-toggle.tsx') return ['shell'];

  if (path === 'app/activity-lab/page.tsx') return ['activity-lab'];
  if (path.startsWith('components/labs/activity-')) return ['activity-lab'];

  return null;
}

function classifyBrowserGroups(paths) {
  const groups = new Set();

  for (const path of paths) {
    const pathGroups = browserGroupsForPath(path);
    if (!pathGroups) return ['full'];
    for (const group of pathGroups) groups.add(group);
  }

  return [...groups].sort();
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
      browserGroups: ['full'],
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
      browserGroups: [],
      reason: `Writing fast-pass: all ${normalizedPaths.length} changed path${normalizedPaths.length === 1 ? '' : 's'} are Markdown or an allowlisted publication/check-in registry update.`,
      browserIndependentPaths,
      browserRelevantPaths,
    };
  }

  if (browserRelevantPaths.length > 0) {
    const browserGroups = classifyBrowserGroups(browserRelevantPaths);
    const full = browserGroups.includes('full');
    return {
      mode: full ? 'full' : 'scoped-browser',
      runVerify: true,
      runBrowser: true,
      browserGroups,
      reason: full
        ? `Full browser suite required because ${browserRelevantPaths.length} changed path${browserRelevantPaths.length === 1 ? '' : 's'} include an unscoped runtime, config, workflow, or browser test surface.`
        : `Scoped browser suite: ${browserGroups.join(', ')} cover ${browserRelevantPaths.length} browser-relevant changed path${browserRelevantPaths.length === 1 ? '' : 's'}.`,
      browserIndependentPaths,
      browserRelevantPaths,
    };
  }

  return {
    mode: 'verify-only',
    runVerify: true,
    runBrowser: false,
    browserGroups: [],
    reason: `Verify-only: all ${normalizedPaths.length} changed path${normalizedPaths.length === 1 ? '' : 's'} are browser-independent, but the change is not an ordinary writing fast-pass.`,
    browserIndependentPaths,
    browserRelevantPaths,
  };
}
