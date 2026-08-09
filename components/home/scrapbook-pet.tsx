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

export function ScrapbookPet({
  activity,
  updating,
}: {
  activity: number;
  updating: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [pets, setPets] = useState(0);
  const status = updating ? 'sniffing' : activity > 0 ? 'awake' : 'napping';
  const message =
    pets === 0
      ? 'Keeping watch over the field desk.'
      : petMessages[(pets - 1) % petMessages.length];
  const pose = updating ? 'sniffing' : activity > 0 ? 'idle' : 'napping';

  return (
    <motion.button
      type="button"
      data-scrapbook-pet
      data-pets={pets}
      aria-label={`Pet Scraplet, the scrapbook dinosaur. Scraplet is ${status}.`}
      title={`Pet Scraplet · ${status}`}
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      onClick={() => setPets(count => count + 1)}
      className="group/pet relative flex min-h-56 w-full flex-col overflow-hidden rounded-[1.1rem] border border-border/70 bg-background/48 px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] transition-colors duration-150 hover:bg-background/68 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none sm:min-h-64"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(122deg,transparent_0_58%,hsl(var(--foreground)/0.035)_58.2%,transparent_58.6%),linear-gradient(24deg,transparent_0_74%,hsl(var(--foreground)/0.028)_74.2%,transparent_74.6%)]"
      />
      <span className="relative flex items-center justify-between gap-3 font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <span>Field companion</span>
        <span>{pets === 0 ? 'tap to pet' : `${pets} pets`}</span>
      </span>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[59%] h-2.5 w-32 -translate-x-1/2 rounded-full bg-foreground/10 shadow-[0_0_12px_hsl(var(--foreground)/0.08)] sm:w-40"
      />

      <motion.span
        key={pets}
        initial={false}
        animate={
          reduceMotion || pets === 0
            ? undefined
            : { y: [0, -4, 0], rotate: [0, -2, 2, 0] }
        }
        transition={{ duration: 0.38, ease: [0.2, 0.75, 0.2, 1] }}
        className="relative grid flex-1 place-items-center py-1"
        aria-hidden="true"
      >
        <PaperCreature pose={pose} size="hero" label="" />
      </motion.span>

      <span className="relative flex items-end justify-between gap-3 border-t border-dashed border-border/70 pt-2.5">
        <span className="min-w-0">
          <span className="block font-semibold tracking-tight">Scraplet</span>
          <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">
            {message}
          </span>
        </span>
        <span className="shrink-0 rounded-full border border-border/70 bg-card/75 px-2 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.12em]">
          {status}
        </span>
      </span>

      <span className="sr-only" aria-live="polite">
        {message}
      </span>
    </motion.button>
  );
}
