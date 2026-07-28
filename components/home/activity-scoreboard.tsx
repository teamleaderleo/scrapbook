'use client';

import { ScrapbookPet } from '@/components/home/scrapbook-pet';
import {
  motion,
  useAnimate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from './activity-scoreboard.module.css';

function countdownToUtcMidnight() {
  const now = new Date();
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  const seconds = Math.max(0, Math.floor((midnight - now.getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder].map((part) => String(part).padStart(2, '0')).join(':');
}

function PaperFace({ digit, className = '' }: { digit: string; className?: string }) {
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
  const reduceMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState(digit);
  const [turn, setTurn] = useState<DigitTurn | null>(null);
  const sequence = useRef(0);
  const restingTilt = index % 2 === 0 ? -0.72 : 0.58;

  useEffect(() => {
    if (reduceMotion || document.visibilityState !== 'visible') {
      setDisplayed(digit);
      setTurn(null);
      return;
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
            initial={{ rotateX: 0, y: 0, opacity: 1, filter: 'blur(0px)' }}
            animate={{
              rotateX: [0, -24, -103],
              y: [0, -2, -12],
              opacity: [1, 1, 0],
              filter: ['blur(0px)', 'blur(0px)', 'blur(1.4px)'],
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
              initial={{ opacity: 0.35, scale: 1.2, filter: 'blur(2px)' }}
              animate={{ opacity: 1, scale: [1.2, 0.96, 1], filter: 'blur(0px)' }}
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

function ScoreDigits({ value }: { value: number }) {
  const digits = useMemo(
    () => String(Math.max(0, Math.floor(value))).slice(-4).padStart(4, '0').split(''),
    [value],
  );
  const reduceMotion = useReducedMotion();
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
        { duration: 0.72, times: [0, 0.32, 0.72, 1], ease: [0.2, 0.8, 0.2, 1] },
      ),
      animate(
        '[data-paper-counter-binding]',
        { scaleX: [1, 1.055, 0.985, 1] },
        { duration: 0.68, ease: [0.2, 0.8, 0.2, 1] },
      ),
      animate(
        '[data-paper-counter-shadow]',
        { scaleX: [1, 1.025, 0.99, 1], y: [0, 1, -0.5, 0] },
        { duration: 0.72, ease: [0.2, 0.8, 0.2, 1] },
      ),
    ];

    return () => controls.forEach((control) => control.stop());
  }, [animate, reduceMotion, scope, value]);

  return (
    <div
      ref={scope}
      className={`${styles.counter} flex min-w-0 gap-1.5 sm:gap-2`}
      aria-label={`${value} contributions today`}
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
          className={`${styles.digitSlot} relative aspect-[0.78] min-w-0 flex-1 font-mono text-[clamp(2rem,5vw,4.25rem)] font-semibold leading-none tabular-nums transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none ${index % 2 === 0 ? 'group-hover:-rotate-[0.7deg]' : 'group-hover:rotate-[0.7deg]'}`}
          style={{ transitionDelay: `${index * 24}ms` }}
        >
          <PaperDigit digit={digit} index={index} />
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <span
      className="grid min-h-[3.25rem] content-center gap-1 rounded-xl border border-border/65 bg-background/40 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] transition-[transform,border-color,background-color] duration-300 group-hover:translate-x-0.5 group-hover:border-border group-hover:bg-background/55 motion-reduce:transition-none"
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
  today,
  weekTotal,
  yearTotal,
  updating,
}: {
  today: number;
  weekTotal: number;
  yearTotal: number | null;
  updating: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [countdown, setCountdown] = useState('--:--:--');
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const lightOpacity = useMotionValue(0);
  const fibreX = useMotionValue(0);
  const fibreY = useMotionValue(0);
  const curlProgress = useMotionValue(0);
  const smoothPointerX = useSpring(pointerX, { stiffness: 240, damping: 30, mass: 0.55 });
  const smoothPointerY = useSpring(pointerY, { stiffness: 240, damping: 30, mass: 0.55 });
  const smoothLightOpacity = useSpring(lightOpacity, {
    stiffness: 240,
    damping: 30,
    mass: 0.5,
  });
  const smoothFibreX = useSpring(fibreX, { stiffness: 210, damping: 28, mass: 0.58 });
  const smoothFibreY = useSpring(fibreY, { stiffness: 210, damping: 28, mass: 0.58 });
  const smoothCurl = useSpring(curlProgress, { stiffness: 260, damping: 24, mass: 0.48 });
  const curlOpacity = useTransform(smoothCurl, [0, 0.12, 1], [0, 0.18, 0.96]);
  const curlScale = useTransform(smoothCurl, [0, 1], [0.74, 1.08]);
  const curlRotate = useTransform(smoothCurl, [0, 1], [-8, 5]);
  const curlX = useTransform(smoothCurl, [0, 1], [-8, 0]);
  const curlY = useTransform(smoothCurl, [0, 1], [8, -1]);

  useEffect(() => {
    const update = () => setCountdown(countdownToUtcMidnight());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const movePaperLight = (event: ReactPointerEvent<HTMLElement>) => {
    if (reduceMotion || event.pointerType === 'touch') return;

    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = Math.min(rect.width, Math.max(0, event.clientX - rect.left));
    const y = Math.min(rect.height, Math.max(0, event.clientY - rect.top));
    const horizontal = x / rect.width;
    const vertical = y / rect.height;
    const curlDistance = Math.hypot(horizontal, 1 - vertical);

    pointerX.set(x);
    pointerY.set(y);
    lightOpacity.set(1);
    fibreX.set((horizontal - 0.5) * 9);
    fibreY.set((vertical - 0.5) * 6);
    curlProgress.set(Math.max(0, 1 - curlDistance / 0.85));
  };

  const settlePaperLight = () => {
    lightOpacity.set(0);
    fibreX.set(0);
    fibreY.set(0);
    curlProgress.set(0);
  };

  return (
    <motion.section
      initial={false}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -5,
              rotateX: 0.7,
              rotateY: -0.65,
              scale: 1.008,
            }
      }
      transition={{ type: 'spring', stiffness: 260, damping: 22, mass: 0.72 }}
      style={{ transformPerspective: 1100, transformOrigin: '50% 55%' }}
      onPointerMove={movePaperLight}
      onPointerLeave={settlePaperLight}
      onPointerCancel={settlePaperLight}
      className={`${styles.scorecard} group relative flex h-full min-h-[15.5rem] flex-col overflow-hidden rounded-[1.25rem] border border-border/75 bg-card text-card-foreground shadow-[0_16px_38px_rgba(24,24,26,0.11)] transition-[border-color,box-shadow] duration-300 hover:border-border hover:shadow-[0_24px_52px_rgba(24,24,26,0.17)] dark:shadow-[0_16px_38px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_26px_58px_rgba(0,0,0,0.42)] [@media(max-height:780px)]:min-h-[14.5rem]`}
      data-activity-scoreboard
      data-paper-light-motion={reduceMotion ? 'reduced' : 'full'}
    >
      <motion.span
        aria-hidden="true"
        className={styles.rakingLightAnchor}
        style={{ x: smoothPointerX, y: smoothPointerY, opacity: smoothLightOpacity }}
        data-paper-raking-light
      >
        <span className={styles.rakingLight} />
      </motion.span>
      <motion.span
        aria-hidden="true"
        className={styles.fibreField}
        style={{ x: smoothFibreX, y: smoothFibreY }}
        data-paper-fibres
      />
      <motion.span
        aria-hidden="true"
        className={styles.paperCurl}
        style={{
          x: curlX,
          y: curlY,
          scale: curlScale,
          rotateZ: curlRotate,
          opacity: curlOpacity,
          transformPerspective: 620,
        }}
        data-paper-curl
      />

      <div className="relative z-10 border-b border-border/70 bg-muted/70 px-4 py-2.5 transition-colors duration-300 group-hover:bg-muted/85 [@media(max-height:780px)]:py-2">
        <div className="flex items-center justify-between gap-3 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <span>Today</span>
          <span className="tabular-nums">UTC reset {countdown}</span>
        </div>
      </div>

      <div className="relative z-10 grid flex-1 grid-cols-[minmax(0,1fr)_minmax(5.75rem,0.36fr)] items-center gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(6.75rem,0.34fr)] sm:gap-4 sm:p-5 [@media(max-height:780px)]:gap-2.5 [@media(max-height:780px)]:p-3.5">
        <ScoreDigits value={today} />
        <div className="grid content-center gap-2">
          <Metric label="7D" value={weekTotal.toLocaleString('en-GB')} />
          <Metric
            label="1Y"
            value={yearTotal?.toLocaleString('en-GB') ?? '—'}
            title="Rolling-year total reported by GitHub's contribution calendar"
          />
          <ScrapbookPet activity={today} updating={updating} />
        </div>
      </div>
    </motion.section>
  );
}
