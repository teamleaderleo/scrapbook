'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { PaperCreature } from '@/components/paper-creature';

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
  const pose = updating ? 'sniffing' : activity > 0 ? 'idle' : 'napping';

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
        animate={reduceMotion || pets === 0 ? undefined : { y: [0, -4, 0], rotate: [0, -2, 2, 0] }}
        transition={{ duration: 0.38, ease: [0.2, 0.75, 0.2, 1] }}
        className="relative block"
        aria-hidden="true"
      >
        <PaperCreature pose={pose} size="sm" label="" />
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
