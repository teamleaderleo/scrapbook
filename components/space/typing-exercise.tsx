'use client';

import { useEffect, useRef, useState } from 'react';
import { typingFeedback } from '@/lib/typing-feedback';
import { spaceTypingWpm, type SpaceTypingTarget } from '@/lib/space-practice';
import { insertedMistakes } from '@/lib/practice-history';

export function TypingExercise({
  target,
  recall = false,
  onComplete,
}: {
  target: SpaceTypingTarget;
  recall?: boolean;
  onComplete?: (result: {
    elapsed: number;
    wpm: number | null;
    mistakes: number;
    assisted: boolean;
  }) => void;
}) {
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [assisted, setAssisted] = useState(false);
  const [indentTab, setIndentTab] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const mistakes = useRef(0);
  const clock = useRef<{ start: number; previous: number } | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const reference = useRef<HTMLPreElement>(null);
  const feedback = typingFeedback(target.text, input);
  const entered = Array.from(input);

  const pause = () => {
    if (clock.current)
      setElapsed(
        clock.current.previous + performance.now() - clock.current.start
      );
    clock.current = null;
    setRunning(false);
  };

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      if (clock.current)
        setElapsed(
          clock.current.previous + performance.now() - clock.current.start
        );
    }, 250);
    const onHidden = () => {
      if (document.hidden) pause();
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, [running]);

  useEffect(() => {
    const container = reference.current;
    const cursor = container?.querySelector<HTMLElement>(
      '[data-typing-cursor]'
    );
    if (!container || !cursor) return;
    const top =
      cursor.getBoundingClientRect().top -
      container.getBoundingClientRect().top;
    if (top < 0 || top > container.clientHeight - 28)
      container.scrollTop += top - container.clientHeight / 2;
  }, [input]);

  const update = (value: string) => {
    if (feedback.complete) return;
    mistakes.current += insertedMistakes(target.text, input, value);
    if (!clock.current && value) {
      clock.current = { start: performance.now(), previous: elapsed };
      setRunning(true);
    }
    setInput(value);
    if (value === target.text) {
      const duration = clock.current
        ? clock.current.previous + performance.now() - clock.current.start
        : elapsed;
      const helped = assisted || (recall && revealed);
      onComplete?.({
        elapsed: duration,
        wpm:
          !helped && duration >= 1000
            ? spaceTypingWpm(feedback.total, duration)
            : null,
        mistakes: mistakes.current,
        assisted: helped,
      });
    }
    if (value === target.text || !value) pause();
  };
  const restart = () => {
    clock.current = null;
    setRunning(false);
    setElapsed(0);
    setInput('');
    setAssisted(false);
    setRevealed(false);
    mistakes.current = 0;
    textarea.current?.focus();
  };
  const errorCount = feedback.entered - feedback.correct;

  return (
    <div data-typing-exercise className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-muted-foreground">
        <span>{target.label}</span>
        <span>
          {feedback.complete
            ? 'Complete'
            : input
              ? running
                ? 'Typing'
                : 'Paused'
              : 'Start typing'}{' '}
          · {Math.floor(elapsed / 1000)}s
        </span>
      </div>
      {recall && !revealed && !feedback.complete ? (
        <div className="flex items-center justify-between gap-4 border-y border-border/60 bg-muted/30 px-4 py-5">
          <span className="text-sm text-muted-foreground">
            Reconstruct the function from memory.
          </span>
          <button
            type="button"
            className="min-h-[44px] shrink-0 px-2 text-sm underline underline-offset-4"
            onClick={() => setRevealed(true)}
          >
            Reveal code
          </button>
        </div>
      ) : (
        <>
          <p className="sr-only">Typing reference: {target.text}</p>
          <pre
            ref={reference}
            aria-hidden="true"
            className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words border-y border-border/60 bg-muted/30 px-4 py-4 font-mono text-sm leading-7 sm:max-h-72"
          >
            {Array.from(target.text).map((character, index) => {
              const typed = entered[index];
              const current = index === feedback.entered;
              const wrong = typed !== undefined && typed !== character;
              return (
                <span
                  key={index}
                  data-typing-cursor={current ? '' : undefined}
                  className={
                    wrong
                      ? 'bg-destructive/15 text-destructive underline'
                      : current
                        ? 'border-l-2 border-foreground bg-muted text-foreground'
                        : typed === undefined
                          ? 'text-muted-foreground'
                          : 'text-foreground'
                  }
                >
                  {wrong && character === ' '
                    ? '·'
                    : wrong && character === '\n'
                      ? '↵\n'
                      : character}
                </span>
              );
            })}
          </pre>
        </>
      )}
      <textarea
        ref={textarea}
        value={input}
        readOnly={feedback.complete}
        onChange={event => update(event.target.value)}
        onBlur={pause}
        onPaste={() => setAssisted(true)}
        onDrop={() => setAssisted(true)}
        onKeyDown={event => {
          if (
            event.key !== 'Tab' ||
            event.shiftKey ||
            !indentTab ||
            feedback.complete
          )
            return;
          event.preventDefault();
          const node = event.currentTarget;
          const start = node.selectionStart;
          const end = node.selectionEnd;
          const indent = target.text[start] === '\t' ? '\t' : '  ';
          update(input.slice(0, start) + indent + input.slice(end));
          requestAnimationFrame(() =>
            node.setSelectionRange(start + indent.length, start + indent.length)
          );
        }}
        aria-label="Typing input"
        placeholder="Type the code here…"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        className="block min-h-[160px] w-full resize-y bg-transparent px-4 py-3 font-mono text-base leading-7 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      />
      <div
        className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border/60 px-4 py-3 font-mono text-xs tabular-nums"
        data-typing-stats
      >
        <span>
          {Math.min(feedback.entered, feedback.total)} / {feedback.total} chars
        </span>
        <span>{feedback.match}% match</span>
        <span>
          {errorCount} {errorCount === 1 ? 'mismatch' : 'mismatches'}
        </span>
        {elapsed >= 1000 && !assisted && !(recall && revealed) ? (
          <span>{spaceTypingWpm(feedback.correct, elapsed)} WPM</span>
        ) : null}
        {assisted ? (
          <span className="text-muted-foreground">Pasted · untimed result</span>
        ) : null}
        {recall && revealed ? (
          <span className="text-muted-foreground">Reference revealed</span>
        ) : null}
      </div>
      {feedback.first >= 0 ? (
        <p className="px-4 pb-3 text-xs leading-5 text-destructive">
          First mismatch: line {feedback.line}, column {feedback.column}.{' '}
          {Object.entries(feedback.errors)
            .filter(([, count]) => count > 0)
            .map(([kind, count]) => `${count} ${kind}`)
            .join(' · ')}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-2">
        <label className="flex min-h-[44px] items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={indentTab}
            onChange={event => setIndentTab(event.target.checked)}
          />
          Tab inserts indentation
        </label>
        <button
          type="button"
          onClick={restart}
          className="min-h-[44px] px-3 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          Restart
        </button>
      </div>
      <p role="status" className="px-4 pb-3 text-xs text-muted-foreground">
        {feedback.complete
          ? 'Exact pass. Explain a decision in this function, or try changing an edge case.'
          : 'Timing pauses when you leave the input.'}
      </p>
    </div>
  );
}
