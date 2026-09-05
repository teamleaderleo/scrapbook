'use client';

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { typingFeedback } from '@/lib/typing-feedback';
import { spaceTypingWpm, type SpaceTypingTarget } from '@/lib/space-practice';
import styles from './practice.module.css';
import { RotateCcw } from 'lucide-react';
import { insertedMistakes } from '@/lib/practice-history';
import { usePracticeAppearance } from './practice-appearance';

export function TypingExercise({
  target,
  recall = false,
  highlightedLine,
  onComplete,
}: {
  target: SpaceTypingTarget;
  recall?: boolean;
  highlightedLine?: number;
  onComplete?: (result: {
    elapsed: number;
    wpm: number | null;
    mistakes: number;
    assisted: boolean;
  }) => void;
}) {
  const [input, setInput] = useState('');
  const appearance = usePracticeAppearance();
  const syntax = target.kind === 'code' ? appearance?.syntax[target.text] : undefined;
  const [focused, setFocused] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0, caret: 0 });
  const referenceId = useId();
  const hintId = useId();
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

  useEffect(() => {
    if (
      window.matchMedia('(pointer: fine)').matches &&
      document.activeElement === document.body
    )
      textarea.current?.focus({ preventScroll: true });
  }, []);

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

  const revealCaret = useCallback(() => {
    if (document.activeElement !== textarea.current) return;
    const cursor = reference.current?.querySelector<HTMLElement>(
      '[data-typing-cursor]'
    );
    if (!cursor) return;
    const bounds = cursor.getBoundingClientRect();
    const viewport = window.visualViewport;
    const top = viewport?.offsetTop ?? 0;
    const height = viewport?.height ?? window.innerHeight;
    if (bounds.top < top + 56 || bounds.bottom > top + height - 24)
      cursor.scrollIntoView({ block: 'center' });
  }, []);
  useEffect(() => {
    revealCaret();
  }, [selection.caret, revealCaret]);

  const update = (value: string, start = value.length, end = start) => {
    if (feedback.complete) return;
    mistakes.current += insertedMistakes(target.text, input, value);
    if (!clock.current && value) {
      clock.current = { start: performance.now(), previous: elapsed };
      setRunning(true);
    }
    setInput(value);
    setSelection({ start, end, caret: end });
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
    setSelection({ start: 0, end: 0, caret: 0 });
    setAssisted(false);
    setRevealed(false);
    mistakes.current = 0;
    textarea.current?.focus();
  };
  const errorCount = feedback.entered - feedback.correct;

  const hiddenReference = recall && !revealed && !feedback.complete;
  const expected = Array.from(target.text);
  const displayed = hiddenReference
    ? entered
    : [...expected, ...entered.slice(expected.length)];
  let offset = 0;
  let line = 1;
  let referenceOffset = 0;
  let tokenIndex = 0;

  return (
    <div data-typing-exercise className={`${styles.surface} min-w-0`}>
      <div className="flex min-h-[24px] flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="sr-only">{target.label}</span>
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
      {hiddenReference ? (
        <button
          type="button"
          className={styles.control}
          onClick={() => setRevealed(true)}
        >
          {target.kind === 'prose' ? 'Reveal passage' : 'Reveal code'}
        </button>
      ) : (
        <p id={referenceId} className="sr-only">
          Typing reference: {target.text}
        </p>
      )}
      <div
        data-typing-stage
        className={styles.stage}
        onClick={event => {
          if (event.button !== 0 || !textarea.current) return;
          const character = (event.target as HTMLElement).closest<HTMLElement>(
            '[data-offset]'
          );
          const position = Math.min(
            Number(character?.dataset.offset ?? input.length),
            input.length
          );
          textarea.current.focus({ preventScroll: true });
          textarea.current.setSelectionRange(position, position);
          setSelection({ start: position, end: position, caret: position });
        }}
      >
        <pre
          ref={reference}
          aria-hidden="true"
          data-typing-overlay
          className={`${styles.text} ${syntax ? styles.syntaxText : ''}`}
        >
          {displayed.map((character, index) => {
            while (syntax && tokenIndex < syntax.length && syntax[tokenIndex].end <= referenceOffset) tokenIndex += 1;
            const color = !hiddenReference && syntax?.[tokenIndex]?.colors[appearance?.index ?? 0];
            referenceOffset += character.length;
            const annotated = !hiddenReference && line === highlightedLine;
            if (character === '\n') line += 1;
            const start = offset;
            const typed = entered[index];
            offset += typed?.length ?? character.length;
            const wrong = typed !== undefined && typed !== expected[index];
            const current = selection.caret === start && !feedback.complete;
            const selected = start >= selection.start && start < selection.end;
            let visible = hiddenReference
              ? character
              : wrong
                ? typed === '\n'
                  ? '↵'
                  : typed === ' '
                    ? '·'
                    : (typed ?? character)
                : character;
            if (!hiddenReference && wrong && character === '\n')
              visible += '↵\n';
            return (
              <span
                key={index}
                data-offset={start}
                data-line-note={annotated ? '' : undefined}
                data-syntax-token={color ? '' : undefined}
                style={color ? { '--syntax-color': color } as CSSProperties : undefined}
                data-typing-cursor={current ? '' : undefined}
                data-typing-state={
                  wrong ? 'wrong' : typed === undefined ? 'pending' : 'correct'
                }
                className={[
                  styles.character,
                  color ? styles.syntaxCharacter : '',
                  annotated ? styles.inspected : '',
                  wrong
                    ? styles.wrong
                    : typed === undefined
                      ? ''
                      : styles.correct,
                  current ? styles.caret : '',
                  selected ? styles.selected : '',
                ].join(' ')}
              >
                {visible}
              </span>
            );
          })}
          {!feedback.complete && selection.caret === offset ? (
            <span
              data-offset={offset}
              data-typing-cursor
              className={`${styles.character} ${styles.caret}`}
            >
              {'\u200b'}
            </span>
          ) : null}
          {hiddenReference && !input ? (
            <span className="text-muted-foreground">Type from memory…</span>
          ) : null}
        </pre>
        <textarea
          ref={textarea}
          value={input}
          readOnly={feedback.complete}
          onChange={event =>
            update(
              event.target.value,
              event.target.selectionStart,
              event.target.selectionEnd
            )
          }
          onSelect={event =>
            setSelection({
              start: event.currentTarget.selectionStart,
              end: event.currentTarget.selectionEnd,
              caret:
                event.currentTarget.selectionDirection === 'backward'
                  ? event.currentTarget.selectionStart
                  : event.currentTarget.selectionEnd,
            })
          }
          onFocus={() => setFocused(true)}
          onBlur={() => {
            pause();
            setFocused(false);
          }}
          onPaste={() => setAssisted(true)}
          onDrop={() => setAssisted(true)}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              event.currentTarget.blur();
              return;
            }
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
            update(
              input.slice(0, start) + indent + input.slice(end),
              start + indent.length
            );
            requestAnimationFrame(() =>
              node.setSelectionRange(
                start + indent.length,
                start + indent.length
              )
            );
          }}
          aria-label="Typing input"
          aria-describedby={`${hintId}${hiddenReference ? '' : ` ${referenceId}`}`}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          className={styles.input}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-3">
        <div
          className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs tabular-nums text-muted-foreground"
          data-typing-stats
        >
          <span>
            {Math.min(feedback.entered, feedback.total)} / {feedback.total}
          </span>
          <span>{input ? `${feedback.match}%` : '—'} match</span>
          {errorCount ? (
            <span>
              {errorCount} {errorCount === 1 ? 'mismatch' : 'mismatches'}
            </span>
          ) : null}
          {elapsed >= 1000 && !assisted && !(recall && revealed) ? (
            <span>{spaceTypingWpm(feedback.correct, elapsed)} WPM</span>
          ) : null}
          {assisted ? <span>Pasted · untimed result</span> : null}
          {recall && revealed ? <span>Reference revealed</span> : null}
        </div>
        <button
          type="button"
          aria-label="Restart"
          title="Restart"
          onClick={restart}
          className={`${styles.control} inline-flex items-center gap-2`}
        >
          <RotateCcw size={16} aria-hidden="true" />
          <span>Restart</span>
        </button>
      </div>
      {feedback.first >= 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          First mismatch: line {feedback.line}, column {feedback.column}.{' '}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <p id={hintId} role="status">
          {feedback.complete
            ? 'Exact pass'
            : focused
              ? 'Esc to leave'
              : target.kind === 'prose'
                ? 'Click the passage to type'
                : 'Click the code to type'}
        </p>
        {target.kind === 'code' ? <label className="inline-flex min-h-[44px] items-center gap-2">
          <input
            type="checkbox"
            checked={indentTab}
            onChange={event => setIndentTab(event.target.checked)}
          />
          Tab indents
        </label> : null}
      </div>
    </div>
  );
}
