import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

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
    '*': ['class']
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