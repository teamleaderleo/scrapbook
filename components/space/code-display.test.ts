import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CodeDisplay } from './code-display';

describe('CodeDisplay', () => {
  it('gives highlighted code a labeled, horizontally readable shell', () => {
    const html = renderToStaticMarkup(
      createElement(CodeDisplay, {
        code: 'const value = cache.get(key);',
        codeHtml:
          '<pre class="shiki"><code><span>const value = cache.get(key);</span></code></pre>',
        title: 'Implementation code',
      })
    );

    expect(html).toContain('data-code-display="true"');
    expect(html).toContain('Implementation code');
    expect(html).toContain('aria-label="Copy Implementation code"');
    expect(html).toContain('overflow-x-auto');
    expect(html).toContain('whitespace-pre');
    expect(html).toContain('!bg-transparent');
    expect(html).not.toContain('bg-white');
    expect(html).not.toContain('#24273a');
  });

  it('keeps the same shell and copy affordance when highlighting is unavailable', () => {
    const html = renderToStaticMarkup(
      createElement(CodeDisplay, {
        code: 'return result;',
        codeHtml: '',
        title: 'Fallback code',
      })
    );

    expect(html).toContain('Fallback code');
    expect(html).toContain('aria-label="Copy Fallback code"');
    expect(html).toContain('return result;');
  });

  it('does not offer a copy control for an empty code artifact', () => {
    const html = renderToStaticMarkup(
      createElement(CodeDisplay, {
        code: '',
        codeHtml: '',
        title: 'Empty code',
      })
    );

    expect(html).toContain('No code available.');
    expect(html).not.toContain('aria-label="Copy Empty code"');
  });
});
