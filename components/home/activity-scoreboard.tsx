'use client';

import { ScrapbookPet } from '@/components/home/scrapbook-pet';
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
};

function PaperDigit({ digit, index }: { digit: string; index: number }) {
  const reduceMotion = useReducedMotionPreference();
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
    sequence.current += 1;
    setTurn({ id: sequence.current, from: displayed, to: digit });
  }, [digit, displayed, reduceMotion, turn]);

  const delay = (3 - index) * 0.055;

  return (
    <motion.span
      className={styles.digit}
      data-paper-digit
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
              rotateX: [0, -24, -103],
              y: [0, -2, -12],
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 0.46,
              delay,
              times: [0, 0.42, 1],
              ease: [0.55, 0.06, 0.68, 0.19],
            }}
          >
            <span className={styles.number}>{turn.from}</span>
          </motion.span>

          <motion.span
            key={`arrive-${turn.id}`}
            aria-hidden="true"
            className={`${styles.sheet} ${styles.arriving}`}
            initial={{ rotateX: 88, y: '20%', opacity: 0.2, scale: 0.955 }}
            animate={{
              rotateX: [88, -9, 2, 0],
              y: ['20%', '-2.5%', '0.7%', '0%'],
              opacity: [0.2, 1, 1, 1],
              scale: [0.955, 1.018, 0.997, 1],
            }}
            transition={{
              duration: 0.62,
              delay: delay + 0.16,
              times: [0, 0.58, 0.82, 1],
              ease: [0.22, 1, 0.36, 1],
            }}
            onAnimationComplete={() => {
              setDisplayed(turn.to);
              setTurn(null);
            }}
          >
            <motion.span
              className={styles.number}
              initial={{ opacity: 0.35, scale: 1.12 }}
              animate={{
                opacity: 1,
                scale: [1.12, 0.97, 1],
              }}
              transition={{
                duration: 0.34,
                delay: delay + 0.34,
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

function ScoreDigits({ value, label }: { value: number; label: string }) {
  const digits = useMemo(
    () =>
      String(Math.max(0, Math.floor(value)))
        .slice(-4)
        .padStart(4, '0')
        .split(''),
    [value]
  );
  const reduceMotion = useReducedMotionPreference();
  const previousValue = useRef(value);
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (previousValue.current === value) return;
    previousValue.current = value;
    if (reduceMotion || !scope.current) return;

    const controls = [
      animate(
        scope.current,
        {
          y: [0, -2.5, 1, 0],
          rotateZ: [0, -0.32, 0.14, 0],
        },
        { duration: 0.72, times: [0, 0.32, 0.72, 1], ease: [0.2, 0.8, 0.2, 1] }
      ),
      animate(
        '[data-paper-counter-binding]',
        { scaleX: [1, 1.055, 0.985, 1] },
        { duration: 0.68, ease: [0.2, 0.8, 0.2, 1] }
      ),
      animate(
        '[data-paper-counter-shadow]',
        { scaleX: [1, 1.025, 0.99, 1], y: [0, 1, -0.5, 0] },
        { duration: 0.72, ease: [0.2, 0.8, 0.2, 1] }
      ),
    ];

    return () => controls.forEach(control => control.stop());
  }, [animate, reduceMotion, scope, value]);

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
          <PaperDigit digit={digit} index={index} />
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
  scoreIsToday,
  todayActivity,
  weekTotal,
  yearTotal,
  updating,
}: {
  score: number;
  scoreDate: string;
  scoreLabel: string;
  scoreIsToday: boolean;
  todayActivity: number;
  weekTotal: number;
  yearTotal: number | null;
  updating: boolean;
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
          <span className="shrink-0 tabular-nums">
            {scoreIsToday ? `UTC reset ${countdown}` : 'UTC total'}
          </span>
        </div>
      </div>

      <div className="relative z-10 grid flex-1 gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_minmax(15rem,0.72fr)] md:items-stretch">
        <div className="flex min-w-0 flex-col justify-center gap-4">
          <div>
            <p className="mb-2 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Activity on the desk
            </p>
            <ScoreDigits value={score} label={scoreLabel} />
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
        <ScrapbookPet activity={todayActivity} updating={updating} />
      </div>
    </section>
  );
}
