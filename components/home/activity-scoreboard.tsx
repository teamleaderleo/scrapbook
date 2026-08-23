'use client';

import { motion, useAnimate } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './activity-scoreboard.module.css';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function useReducedMotionPreference(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return reduceMotion;
}

function countdownToUtcMidnight() {
  const now = new Date();
  const midnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
  const seconds = Math.max(0, Math.floor((midnight - now.getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder]
    .map(part => String(part).padStart(2, '0'))
    .join(':');
}

function PaperFace({
  digit,
  className = '',
}: {
  digit: string;
  className?: string;
}) {
  return (
    <span aria-hidden="true" className={`${styles.face} ${className}`}>
      <span className={styles.number}>{digit}</span>
    </span>
  );
}

type DigitTurn = {
  id: number;
  from: string;
  to: string;
  target: string;
  remaining: string[];
  direction: DigitDirection;
  step: number;
};

type DigitDirection = 1 | -1;

function digitSequence(from: string, to: string, direction: DigitDirection) {
  if (from === to) return [];

  const sequence: string[] = [];
  let current = Number(from);
  const target = Number(to);
  for (let step = 0; step < 9 && current !== target; step += 1) {
    current = (current + direction + 10) % 10;
    sequence.push(String(current));
  }
  return sequence;
}

function digitDirection(from: string, to: string): DigitDirection {
  const start = Number(from);
  const target = Number(to);
  const forward = (target - start + 10) % 10;
  const backward = (start - target + 10) % 10;
  return forward <= backward ? 1 : -1;
}

function scoreDigits(value: number) {
  return String(Math.max(0, Math.floor(value)))
    .slice(-4)
    .padStart(4, '0')
    .split('');
}

function PaperDigit({
  digit,
  index,
  reduceMotion,
}: {
  digit: string;
  index: number;
  reduceMotion: boolean;
}) {
  const [displayed, setDisplayed] = useState(digit);
  const [turn, setTurn] = useState<DigitTurn | null>(null);
  const sequence = useRef(0);
  const restingTilt = index % 2 === 0 ? -0.72 : 0.58;

  useEffect(() => {
    if (reduceMotion || document.visibilityState !== 'visible') {
      const frame = window.requestAnimationFrame(() => {
        setDisplayed(digit);
        setTurn(null);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (turn || digit === displayed) return;
    const direction = digitDirection(displayed, digit);
    const path = digitSequence(displayed, digit, direction);
    const [next, ...remaining] = path;
    if (!next) return;
    sequence.current += 1;
    setTurn({
      id: sequence.current,
      from: displayed,
      to: next,
      target: digit,
      remaining,
      direction,
      step: 0,
    });
  }, [digit, displayed, reduceMotion, turn]);

  const delay = turn?.step === 0 ? 0.018 + index * 0.014 : 0.012;
  const turnDirection = turn?.direction ?? 1;

  return (
    <motion.span
      className={styles.digit}
      data-paper-digit
      data-paper-digit-step={turn?.step}
      data-paper-digit-remaining={turn?.remaining.length}
      initial={
        reduceMotion
          ? false
          : {
              y: 13,
              rotateZ: restingTilt * 2.4,
              scale: 0.965,
            }
      }
      animate={{ y: 0, rotateZ: restingTilt, scale: 1 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              type: 'spring',
              stiffness: 280,
              damping: 22,
              mass: 0.72,
              delay: 0.08 + index * 0.055,
            }
      }
    >
      <span className={styles.binding} data-paper-counter-binding />
      <PaperFace digit={displayed} />

      {turn ? (
        <>
          <motion.span
            key={`depart-${turn.id}`}
            aria-hidden="true"
            className={`${styles.sheet} ${styles.departing}`}
            initial={{ rotateX: 0, y: 0, opacity: 1 }}
            animate={{
              rotateX: [0, turnDirection * -28, turnDirection * -102],
              y: [0, turnDirection * -1.5, turnDirection * -8],
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 0.15,
              delay,
              times: [0, 0.45, 1],
              ease: [0.55, 0.06, 0.68, 0.19],
            }}
          >
            <span className={styles.number}>{turn.from}</span>
          </motion.span>

          <motion.span
            key={`arrive-${turn.id}`}
            aria-hidden="true"
            className={`${styles.sheet} ${styles.arriving}`}
            initial={{
              rotateX: turnDirection * 88,
              y: `${turnDirection * 13}%`,
              opacity: 0.25,
              scale: 0.975,
            }}
            animate={{
              rotateX: [turnDirection * 88, turnDirection * -7, 0],
              y: [`${turnDirection * 13}%`, `${turnDirection * -1.5}%`, '0%'],
              opacity: [0.25, 1, 1],
              scale: [0.975, 1.008, 1],
            }}
            transition={{
              duration: 0.2,
              delay: delay + 0.07,
              times: [0, 0.72, 1],
              ease: [0.22, 1, 0.36, 1],
            }}
            onAnimationComplete={() => {
              setDisplayed(turn.to);
              if (digit !== turn.target || turn.remaining.length === 0) {
                setTurn(null);
                return;
              }

              const [next, ...remaining] = turn.remaining;
              sequence.current += 1;
              setTurn({
                ...turn,
                id: sequence.current,
                from: turn.to,
                to: next,
                remaining,
                step: turn.step + 1,
              });
            }}
          >
            <motion.span
              className={styles.number}
              initial={{ opacity: 0.45, scale: 1.045 }}
              animate={{
                opacity: 1,
                scale: [1.045, 0.985, 1],
              }}
              transition={{
                duration: 0.15,
                delay: delay + 0.09,
                times: [0, 0.7, 1],
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {turn.to}
            </motion.span>
          </motion.span>
        </>
      ) : null}
    </motion.span>
  );
}

function ScoreDigits({
  value,
  label,
  reduceMotion,
}: {
  value: number;
  label: string;
  reduceMotion: boolean;
}) {
  const digits = useMemo(() => scoreDigits(value), [value]);
  const previousValue = useRef(value);
  const [scope, animate] = useAnimate();

  useEffect(() => {
    const previous = previousValue.current;
    if (previous === value) return;
    const previousDigits = scoreDigits(previous);
    const changedColumns = digits.reduce(
      (total, digit, index) => total + Number(digit !== previousDigits[index]),
      0
    );
    const rackDirection = value > previous ? -1 : 1;
    const travel = 0.55 + changedColumns * 0.2;
    previousValue.current = value;
    if (reduceMotion || !scope.current) return;

    const controls = [
      animate(
        scope.current,
        {
          y: [0, rackDirection * travel, rackDirection * -0.2, 0],
          rotateZ: [
            0,
            rackDirection * changedColumns * 0.035,
            rackDirection * -0.04,
            0,
          ],
        },
        { duration: 0.38, times: [0, 0.3, 0.7, 1], ease: [0.2, 0.8, 0.2, 1] }
      ),
      animate(
        '[data-paper-counter-binding]',
        { scaleX: [1, 1.055, 0.985, 1] },
        { duration: 0.36, ease: [0.2, 0.8, 0.2, 1] }
      ),
      animate(
        '[data-paper-counter-shadow]',
        { scaleX: [1, 1.025, 0.99, 1], y: [0, 1, -0.5, 0] },
        { duration: 0.38, ease: [0.2, 0.8, 0.2, 1] }
      ),
    ];

    return () => controls.forEach(control => control.stop());
  }, [animate, digits, reduceMotion, scope, value]);

  return (
    <div
      ref={scope}
      className={`${styles.counter} flex min-w-0 gap-1.5 sm:gap-2`}
      aria-label={`${value} contributions on ${label}`}
      data-paper-counter
      data-reduced-motion={reduceMotion ? 'true' : 'false'}
      data-wind-scoreboard
    >
      <span
        aria-hidden="true"
        className={styles.counterShadow}
        data-paper-counter-shadow
      />
      {digits.map((digit, index) => (
        <div
          key={index}
          data-activity-digit
          className={`${styles.digitSlot} relative aspect-[0.78] min-w-0 flex-1 font-mono text-[clamp(2rem,5vw,4.25rem)] font-semibold leading-none tabular-nums`}
        >
          <PaperDigit digit={digit} index={index} reduceMotion={reduceMotion} />
        </div>
      ))}
    </div>
  );
}

function Metric({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <span
      className="grid min-h-[3.25rem] content-center gap-1 rounded-xl border border-border/65 bg-background/40 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]"
      title={title}
    >
      <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <strong className="font-mono text-base font-semibold leading-none tabular-nums text-foreground sm:text-lg">
        {value}
      </strong>
    </span>
  );
}

export function ActivityScoreboard({
  score,
  scoreDate,
  scoreLabel,
  weekTotal,
  yearTotal,
}: {
  score: number;
  scoreDate: string;
  scoreLabel: string;
  weekTotal: number;
  yearTotal: number | null;
}) {
  const reduceMotion = useReducedMotionPreference();
  const [countdown, setCountdown] = useState('--:--:--');

  useEffect(() => {
    const update = () => setCountdown(countdownToUtcMidnight());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section
      id="github-activity-scoreboard"
      className={`${styles.scorecard} relative flex h-full min-h-[24rem] flex-col overflow-hidden rounded-[1.25rem] border border-border/75 bg-card text-card-foreground shadow-[0_14px_32px_rgba(24,24,26,0.09)] dark:shadow-[0_16px_38px_rgba(0,0,0,0.28)]`}
      data-activity-scoreboard
      data-activity-score-date={scoreDate}
      data-activity-score-value={score}
      data-activity-scoreboard-ready={
        countdown === '--:--:--' ? 'false' : 'true'
      }
      data-activity-motion={reduceMotion ? 'reduced' : 'calm'}
    >
      <div className="relative z-10 border-b border-border/70 bg-muted/70 px-4 py-2.5">
        <div className="flex items-center justify-between gap-3 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <span className="truncate" aria-live="polite">
            {scoreLabel}
          </span>
          <span className="shrink-0 tabular-nums">UTC reset {countdown}</span>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 items-center p-4 sm:p-5 md:p-7">
        <div className="flex w-full min-w-0 flex-col justify-center gap-6">
          <div>
            <p className="mb-2 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Activity on the desk
            </p>
            <ScoreDigits
              value={score}
              label={scoreLabel}
              reduceMotion={reduceMotion}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="7D" value={weekTotal.toLocaleString('en-GB')} />
            <Metric
              label="1Y"
              value={yearTotal?.toLocaleString('en-GB') ?? '—'}
              title="Rolling-year total reported by GitHub's contribution calendar"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
