import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { createHighlighter } from 'shiki';

// Configure marked
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
});

// Sanitization config
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
    '*': ['class', 'style'] // Allow style for syntax highlighting
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

// Create highlighter instance once (singleton pattern for best performance)
let highlighterInstance: Awaited<ReturnType<typeof createHighlighter>> | null = null;
let highlighterPromise: Promise<Awaited<ReturnType<typeof createHighlighter>>> | null = null;

async function getHighlighter() {
  if (highlighterInstance) {
    return highlighterInstance;
  }
  
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['one-light', 'catppuccin-macchiato'],
      langs: ['python', 'javascript', 'typescript', 'jsx', 'tsx', 'bash', 'sql', 'json'],
    });
  }
  
  highlighterInstance = await highlighterPromise;
  return highlighterInstance;
}

/**
 * Highlight code to HTML using Shiki
 */
export async function highlightCode(
  code: string | null,
  language: string = 'python'
): Promise<string> {
  if (!code) return '';
  
  try {
    const highlighter = await getHighlighter();
    
    return highlighter.codeToHtml(code, {
      lang: language,
      themes: {
        light: 'one-light',
        dark: 'catppuccin-macchiato',
      },
      defaultColor: false, // Use CSS variables for theme switching
    });
  } catch (error) {
    // Fallback if language not supported
    console.warn(`Shiki highlighting failed for language: ${language}`, error);
    return `<pre><code>${code}</code></pre>`;
  }
}