'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Scrapbook root failed to load', error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Workshop unavailable | teamleaderleo</title>
        <style>{`
          :root { color-scheme: light dark; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
          button, a { font: inherit; }
          button:focus-visible, a:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
          .global-error-page {
            --page: #ecebe6;
            --ink: #17181b;
            --paper: #f4f1ea;
            --line: rgba(23, 24, 27, 0.16);
            --muted: rgba(23, 24, 27, 0.65);
            min-height: 100dvh;
            display: grid;
            place-items: center;
            padding: 1rem;
            background: var(--page);
            color: var(--ink);
          }
          .global-error-card {
            width: min(100%, 30rem);
            padding: 1.5rem;
            border: 1px solid var(--line);
            border-radius: 1.25rem;
            background: var(--paper);
            box-shadow: 0 18px 55px rgba(20, 20, 24, 0.16);
          }
          .global-error-label { margin: 0; font: 600 0.625rem/1.4 ui-monospace, monospace; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
          .global-error-title { margin: 0.55rem 0 0; font-size: clamp(1.5rem, 5vw, 2rem); line-height: 1.15; }
          .global-error-copy { margin: 0.75rem 0 0; max-width: 38ch; font-size: 0.925rem; line-height: 1.6; color: var(--muted); }
          .global-error-reference { margin: 0.75rem 0 0; font: 0.625rem/1.4 ui-monospace, monospace; color: var(--muted); }
          .global-error-actions { display: flex; flex-wrap: wrap; gap: 0.625rem; margin-top: 1.5rem; }
          .global-error-action { min-height: 2.75rem; display: inline-flex; align-items: center; justify-content: center; padding: 0.65rem 0.9rem; border: 1px solid var(--line); border-radius: 0.7rem; color: inherit; font-size: 0.875rem; font-weight: 650; text-decoration: none; cursor: pointer; }
          .global-error-action-primary { border-color: var(--ink); background: var(--ink); color: var(--paper); }
          .global-error-action-secondary { background: transparent; }
          @media (prefers-color-scheme: dark) {
            .global-error-page { --page: #101115; --ink: #eeeae3; --paper: #18191d; --line: rgba(255, 255, 255, 0.15); --muted: rgba(255, 255, 255, 0.65); }
            .global-error-card { box-shadow: 0 20px 58px rgba(0, 0, 0, 0.38); }
          }
        `}</style>
      </head>
      <body>
        <main className="global-error-page">
          <section className="global-error-card">
            <p className="global-error-label">Workshop unavailable</p>
            <h1 className="global-error-title">
              The scrapbook could not open.
            </h1>
            <p className="global-error-copy">
              Retry the workshop shell. If it still will not open, the home page
              may work on a fresh request.
            </p>
            {error.digest ? (
              <p className="global-error-reference">Reference {error.digest}</p>
            ) : null}
            <div className="global-error-actions">
              <button
                type="button"
                onClick={reset}
                className="global-error-action global-error-action-primary"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => window.location.assign('/')}
                className="global-error-action global-error-action-secondary"
              >
                Go home
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
