'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type PaperCreaturePose =
  | 'idle'
  | 'sniffing'
  | 'napping'
  | 'reading'
  | 'carrying'
  | 'archivist'
  | 'celebrating';

interface PaperCreatureProps {
  pose?: PaperCreaturePose;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  label?: string;
  animateKey?: string | number;
}

const sizeClasses = {
  sm: 'h-8 w-12',
  md: 'h-12 w-[4.5rem]',
  lg: 'h-20 w-[7.5rem]',
  hero: 'h-28 w-44 sm:h-36 sm:w-56',
} as const;

export function PaperCreature({
  pose = 'idle',
  size = 'md',
  className,
  label = 'Scraplet, a small paper dinosaur',
  animateKey,
}: PaperCreatureProps) {
  const reduceMotion = useReducedMotion();
  const busy = pose === 'sniffing' || pose === 'carrying';
  const sleeping = pose === 'napping';

  return (
    <motion.span
      key={animateKey}
      role="img"
      aria-label={label}
      initial={false}
      animate={
        reduceMotion
          ? undefined
          : pose === 'celebrating'
            ? { y: [0, -5, 0], rotate: [0, -2, 2, 0] }
            : sleeping
              ? { y: [0, 1, 0] }
              : { y: [0, -1.5, 0] }
      }
      transition={
        pose === 'celebrating'
          ? { duration: 0.42, ease: [0.2, 0.75, 0.2, 1] }
          : {
              duration: sleeping ? 3.6 : 2.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }
      }
      className={cn(
        'relative inline-block shrink-0',
        sizeClasses[size],
        className
      )}
      data-paper-creature
    >
      <svg
        viewBox="0 0 72 48"
        className="h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <motion.path
          d="M24 23 4 26l17 8 7-4Z"
          className="fill-[#b7adbf] stroke-[#4d4852] dark:fill-[#696270] dark:stroke-[#ded8e3]"
          strokeWidth="2"
          strokeLinejoin="round"
          data-paper-creature-tail
          animate={
            reduceMotion
              ? undefined
              : busy
                ? { rotate: [0, -8, 6, 0] }
                : sleeping
                  ? { rotate: [0, 1, 0] }
                  : { rotate: [0, -2, 0] }
          }
          transition={
            busy
              ? { duration: 0.7, repeat: Infinity, ease: 'easeInOut' }
              : {
                  duration: sleeping ? 3.8 : 2.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
          style={{ transformOrigin: '24px 30px' }}
        />
        <path
          d="m7 26 15 3"
          className="fill-none stroke-[#6b6470]/70 dark:stroke-[#c9c2d0]/70"
          strokeWidth="1.2"
          strokeLinecap="round"
          data-paper-creature-tail-fold
        />

        <path
          d="M22 17h25c9 0 15 6 15 14v2H20v-6c0-4 1-7 2-10Z"
          className="fill-[#cec4d6] stroke-[#4d4852] dark:fill-[#918a9b] dark:stroke-[#eeeaf2]"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M42 8h14c6 0 10 4 10 10v10H43l-5-7 4-13Z"
          className="fill-[#e4dce9] stroke-[#4d4852] dark:fill-[#c9c2d0] dark:stroke-[#eeeaf2]"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <g data-paper-creature-back-plates>
          <path
            d="m24 17 4.5-7 4.5 7Z"
            className="fill-[#f7f2e9] stroke-[#4d4852] dark:fill-[#ded8e3] dark:stroke-[#eeeaf2]"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="m32 17 4.5-9.5 4.5 9.5Z"
            className="fill-[#eee7f1] stroke-[#4d4852] dark:fill-[#c9c2d0] dark:stroke-[#eeeaf2]"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </g>

        {!sleeping ? (
          <path
            d="M28 32v8h8v-8M49 32v8h8v-8"
            className="stroke-[#4d4852] dark:stroke-[#eeeaf2]"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M27 34h11M48 34h11"
            className="stroke-[#4d4852] dark:stroke-[#eeeaf2]"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}

        {sleeping ? (
          <path
            d="M52 17c2 1 4 1 6 0"
            className="stroke-[#4d4852] dark:stroke-[#4d4852]"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        ) : (
          <circle cx="56" cy="17" r="2.2" className="fill-[#262329]" />
        )}
        <path
          d={sleeping ? 'M57 24c2 0 4 0 5-1' : 'M57 24c2 1 4 1 6-1'}
          className="stroke-[#4d4852]"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="51" cy="24" r="2.4" className="fill-[#d6a7ae] opacity-70" />

        {pose === 'reading' ? (
          <g>
            <path
              d="M34 25h18v15H34z"
              className="fill-[#f6efd9] stroke-[#6a6254] dark:fill-[#d8ccb3]"
              strokeWidth="1.5"
            />
            <path
              d="M43 26v13M37 30h4M45 30h4M37 34h4M45 34h4"
              className="stroke-[#9a816a]"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </g>
        ) : null}

        {pose === 'carrying' ? (
          <g transform="rotate(-8 40 31)">
            <path
              d="M22 29h35v5H22z"
              className="fill-[#d6a25f] stroke-[#66523d]"
              strokeWidth="1.5"
            />
            <path
              d="M57 29l7 2.5-7 2.5Z"
              className="fill-[#eee5cf] stroke-[#66523d]"
              strokeWidth="1.5"
            />
            <path
              d="M22 29h5v5h-5z"
              className="fill-[#c8878f] stroke-[#66523d]"
              strokeWidth="1.5"
            />
          </g>
        ) : null}

        {pose === 'archivist' ? (
          <g>
            <circle
              cx="52.5"
              cy="17"
              r="4"
              className="fill-none stroke-[#554f49]"
              strokeWidth="1.3"
            />
            <circle
              cx="61"
              cy="17"
              r="4"
              className="fill-none stroke-[#554f49]"
              strokeWidth="1.3"
            />
            <path
              d="M56.5 17h.5M47 16l-4-1"
              className="stroke-[#554f49]"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="M30 27h17v13H30z"
              className="fill-[#b58b76] stroke-[#5e4b42]"
              strokeWidth="1.4"
            />
            <path
              d="M34 30h9M34 33h7"
              className="stroke-[#f1dfcb]"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </g>
        ) : null}

        {pose === 'sniffing' ? (
          <g
            className="stroke-[#8f7b65]"
            strokeWidth="1.4"
            strokeLinecap="round"
          >
            <path d="M66 21h4" />
            <path d="M65 18l3-2" />
          </g>
        ) : null}

        {pose === 'napping' ? (
          <g className="fill-[#817568] font-mono text-[7px] font-bold">
            <text x="62" y="11">
              z
            </text>
            <text x="66" y="6">
              z
            </text>
          </g>
        ) : null}

        {pose === 'celebrating' ? (
          <g className="fill-[#d6a25f] stroke-[#6d5a41]" strokeWidth="0.8">
            <path d="m17 7 1.5 3 3.5.5-2.5 2.4.6 3.4-3.1-1.6-3.1 1.6.6-3.4-2.5-2.4 3.5-.5Z" />
            <path d="m66 4 1 2 2.3.3-1.7 1.6.4 2.2-2-1-2 1 .4-2.2-1.7-1.6 2.3-.3Z" />
          </g>
        ) : null}
      </svg>
    </motion.span>
  );
}
