'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';

const petMessages = [
  'Scraplet rustles happily.',
  'Scraplet found a good paper scrap.',
  'Scraplet does a tiny victory stomp.',
  'Scraplet saves you a seat at the workbench.',
] as const;

export function ScrapbookPet({ activity, updating }: { activity: number; updating: boolean }) {
  const reduceMotion = useReducedMotion();
  const [pets, setPets] = useState(0);
  const status = updating ? 'sniffing' : activity > 0 ? 'awake' : 'napping';
  const message = pets === 0 ? 'Scraplet is keeping an eye on the activity feed.' : petMessages[(pets - 1) % petMessages.length];

  return (
    <motion.button
      type="button"
      data-scrapbook-pet
      data-pets={pets}
      aria-label={`Pet Scraplet, the scrapbook dinosaur. Scraplet is ${status}.`}
      title={`Pet Scraplet · ${status}`}
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      onClick={() => setPets((count) => count + 1)}
      className="group/pet relative grid min-h-[3.35rem] w-full grid-cols-[2.65rem_minmax(0,1fr)] items-center gap-1 overflow-hidden rounded-xl border border-border/65 bg-background/45 px-1.5 py-1 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] transition-[background-color,border-color,box-shadow] duration-150 hover:border-border hover:bg-background/70 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_5px_14px_rgba(35,31,26,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_16px_rgba(0,0,0,0.24)]"
    >
      <motion.span
        key={pets}
        initial={false}
        animate={
          reduceMotion || pets === 0
            ? undefined
            : { y: [0, -4, 0], rotate: [0, -2, 2, 0] }
        }
        transition={{ duration: 0.38, ease: [0.2, 0.75, 0.2, 1] }}
        className="relative block h-9 w-11"
        aria-hidden="true"
      >
        <svg viewBox="0 0 72 48" className="h-full w-full overflow-visible">
          <motion.path
            d="M23 28 5 20l12 15 10-1Z"
            className="fill-[#b7adbf] stroke-[#4d4852] dark:fill-[#696270] dark:stroke-[#ded8e3]"
            strokeWidth="2"
            strokeLinejoin="round"
            animate={
              reduceMotion
                ? undefined
                : updating
                  ? { rotate: [0, -7, 5, 0] }
                  : { rotate: [0, -2, 0] }
            }
            transition={
              updating
                ? { duration: 0.7, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
            }
            style={{ transformOrigin: '24px 30px' }}
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
          <path
            d="m29 17 4-8 5 8 5-8 4 8"
            className="fill-[#f7f2e9] stroke-[#4d4852] dark:fill-[#eeeaf2] dark:stroke-[#eeeaf2]"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M28 32v8h8v-8M49 32v8h8v-8"
            className="stroke-[#4d4852] dark:stroke-[#eeeaf2]"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="56" cy="17" r="2.2" className="fill-[#262329] dark:fill-[#262329]" />
          <path
            d="M57 24c2 1 4 1 6-1"
            className="stroke-[#4d4852] dark:stroke-[#4d4852]"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="51" cy="24" r="2.4" className="fill-[#d6a7ae] opacity-70" />
        </svg>
      </motion.span>

      <span className="min-w-0 leading-none">
        <span className="block truncate font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-foreground">
          Scraplet
        </span>
        <span className="mt-1 block truncate font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
          {status}
        </span>
      </span>

      <span className="sr-only" aria-live="polite">
        {message}
      </span>
    </motion.button>
  );
}
