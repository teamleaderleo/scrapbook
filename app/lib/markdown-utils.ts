import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { createHighlighter } from 'shiki';

// ----- marked config -----
marked.setOptions({
  gfm: true,
  breaks: true,
});

// ----- sanitize-html config -----
const SANITIZE_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
    'a', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3',
    'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th',
    'td', 'img', 'hr', 'div', 'span'
  ],
  allowedAttributes: {
    'a': ['href', 'target', 'rel'],
    'img': ['src', 'alt', 'title'],
    '*': ['class', 'style'],
  },
};

/**
 * Parse markdown to sanitized HTML
 */
export async function parseMarkdown(markdown: string | null): Promise<string> {
  if (!markdown) return '';
  const rawHtml = await marked.parse(markdown);
  return sanitizeHtml(rawHtml, SANITIZE_CONFIG);
}

// ===== Shiki highlighter (global, HMR-safe singleton) =====

// Use a global symbol key so the value persists across dev HMR/module reloads
const SHIKI_KEY = Symbol.for('app/shiki/highlighterPromise');

type HighlighterType = Awaited<ReturnType<typeof createHighlighter>>;

function getHighlighterPromise(): Promise<HighlighterType> {
  const g = globalThis as unknown as Record<symbol, Promise<HighlighterType> | undefined>;

  if (!g[SHIKI_KEY]) {
    // Create ONCE per process. Subsequent imports reuse this promise.
    g[SHIKI_KEY] = createHighlighter({
      themes: ['one-light', 'catppuccin-macchiato'],
      langs: ['python', 'javascript', 'typescript', 'jsx', 'tsx', 'bash', 'sql', 'json'],
    });
  }

  return g[SHIKI_KEY]!;
}

/**
 * Highlight code to HTML using Shiki
 * (Server-only recommended. Don’t import this module in client components.)
 */
export async function highlightCode(
  code: string | null,
  language: string = 'python'
): Promise<string> {
  if (!code) return '';

  try {
    const highlighter = await getHighlighterPromise();
    return highlighter.codeToHtml(code, {
      lang: language,
      themes: {
        light: 'one-light',
        dark: 'catppuccin-macchiato',
      },
      defaultColor: false, // Use CSS variables for theme switching
    });
  } catch (error) {
    console.warn(`Shiki highlighting failed for language: ${language}`, error);
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  }
}

// Small helper to safely fallback when Shiki fails
function escapeHtml(str: string) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/**
 * Optional: manual cleanup if we ever truly need to reinit Shiki.
 * Normally we should NOT call this in Next dev/production.
 */
// export async function disposeShiki() {
//   const g = globalThis as unknown as Record<symbol, Promise<HighlighterType> | undefined>;
//   const p = g[SHIKI_KEY];
//   if (p) {
//     try {
//       const h = await p;
//       // @ts-ignore - dispose() exists on Shiki highlighter
//       h.dispose?.();
//     } finally {
//       delete g[SHIKI_KEY];
//     }
//   }
// }
