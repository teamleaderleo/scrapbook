'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function CodeDisplay({
  code,
  codeHtml,
  title = 'Code',
  className = '',
}: {
  code?: string;
  codeHtml?: string;
  title?: string;
  className?: string;
}) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle'
  );
  const hasCode = Boolean(code?.length);

  const copyCode = async () => {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1600);
    } catch {
      setCopyState('failed');
    }
  };

  return (
    <figure
      aria-label={title}
      className={`min-w-0 max-w-full overflow-hidden rounded-xl border border-[hsl(var(--material-paper-edge)/0.72)] bg-[hsl(var(--material-paper-ink)/0.025)] shadow-[inset_0_1px_0_hsl(var(--material-paper-face)/0.45)] ${className}`}
      data-code-display
    >
      <div className="flex min-h-10 items-center justify-between gap-3 border-b border-[hsl(var(--material-paper-edge)/0.58)] bg-[hsl(var(--material-paper-face)/0.3)] px-3 sm:px-4">
        <figcaption className="min-w-0 truncate font-mono text-[9px] font-semibold uppercase tracking-[0.13em] text-[hsl(var(--material-paper-ink)/0.52)]">
          {title}
        </figcaption>

        {hasCode ? (
          <button
            type="button"
            onClick={() => void copyCode()}
            aria-label={`Copy ${title}`}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 font-mono text-[10px] font-semibold text-[hsl(var(--material-paper-ink)/0.58)] transition-colors hover:bg-[hsl(var(--material-paper-ink)/0.06)] hover:text-[hsl(var(--material-paper-ink))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--material-paper-ink)/0.3)]"
          >
            {copyState === 'copied' ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>
              {copyState === 'copied'
                ? 'Copied'
                : copyState === 'failed'
                  ? 'Copy failed'
                  : 'Copy'}
            </span>
          </button>
        ) : null}
      </div>

      <div className="max-w-full overflow-x-auto overscroll-x-contain">
        {codeHtml ? (
          <div
            className="min-w-max [&_pre]:m-0 [&_pre]:min-h-full [&_pre]:min-w-max [&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-6 [&_pre]:whitespace-pre [&_code]:font-mono [&_code]:text-sm [&_code]:leading-6 [&_code]:whitespace-pre [&_span]:!bg-transparent"
            dangerouslySetInnerHTML={{ __html: codeHtml }}
          />
        ) : (
          <pre className="m-0 min-w-max p-4 font-mono text-sm leading-6 whitespace-pre text-[hsl(var(--material-paper-ink))]">
            <code>{code || 'No code available.'}</code>
          </pre>
        )}
      </div>

      <span className="sr-only" aria-live="polite">
        {copyState === 'copied'
          ? `${title} copied to clipboard.`
          : copyState === 'failed'
            ? `Could not copy ${title}.`
            : ''}
      </span>
    </figure>
  );
}
