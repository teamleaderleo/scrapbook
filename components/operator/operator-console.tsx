'use client';

import {
  Check,
  Clipboard,
  ExternalLink,
  Link2,
  Search,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  operatorPhraseGroups,
  operatorPhrases,
  type OperatorPhrase,
  type OperatorPhraseGroupId,
} from '@/lib/operator-phrases';

const groupIcons: Record<OperatorPhraseGroupId, LucideIcon> = {
  do: Sparkles,
  review: Search,
  steer: WandSparkles,
  lazy: ShieldCheck,
};

const featuredPhrases = operatorPhrases.filter(phrase => phrase.featured);

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!copied) throw new Error('Clipboard copy failed');
}

function PhraseButton({
  phrase,
  showReference = false,
}: {
  phrase: OperatorPhrase;
  showReference?: boolean;
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle');

  const handleCopy = async () => {
    try {
      await copyText(phrase.text);
      setState('copied');
      window.setTimeout(() => setState('idle'), 1400);
    } catch {
      setState('error');
      window.setTimeout(() => setState('idle'), 1800);
    }
  };

  return (
    <div id={phrase.id} className="scroll-mt-8">
      <button
        type="button"
        onClick={handleCopy}
        data-operator-phrase={phrase.id}
        className="group relative flex min-h-36 w-full select-none flex-col justify-between overflow-hidden rounded-[1.35rem] border border-border/75 bg-card px-5 py-5 text-left text-card-foreground shadow-[0_8px_0_rgba(24,24,27,0.12),0_18px_34px_rgba(24,24,27,0.08)] transition-[transform,box-shadow,border-color,background-color] duration-100 hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-card/95 hover:shadow-[0_9px_0_rgba(24,24,27,0.14),0_22px_42px_rgba(24,24,27,0.11)] active:translate-y-1 active:shadow-[0_3px_0_rgba(24,24,27,0.14),0_8px_18px_rgba(24,24,27,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:shadow-[0_8px_0_rgba(0,0,0,0.35),0_18px_34px_rgba(0,0,0,0.24)] dark:hover:shadow-[0_9px_0_rgba(0,0,0,0.4),0_22px_42px_rgba(0,0,0,0.3)]"
      >
        <span className="flex items-start justify-between gap-4">
          <span className="text-xl font-black tracking-[-0.035em] sm:text-2xl">
            {phrase.label}
          </span>
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border/70 bg-background/65 transition-transform duration-100 group-active:scale-95"
            aria-hidden="true"
          >
            {state === 'copied' ? (
              <Check className="h-5 w-5" />
            ) : (
              <Clipboard className="h-5 w-5" />
            )}
          </span>
        </span>
        <span className="mt-8 flex items-end justify-between gap-4">
          <span className="max-w-[36rem] text-sm leading-5 text-muted-foreground">
            {phrase.note}
          </span>
          <span
            className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
            aria-live="polite"
          >
            {state === 'copied'
              ? 'Copied'
              : state === 'error'
                ? 'Copy failed'
                : 'Copy'}
          </span>
        </span>
      </button>

      {showReference ? (
        <a
          href={`/operator#${phrase.id}`}
          data-operator-reference={phrase.id}
          aria-label={`Link to ${phrase.label}`}
          className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] font-semibold tracking-[0.04em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Link2 className="h-3 w-3" aria-hidden="true" />
          #{phrase.id}
        </a>
      ) : null}
    </div>
  );
}

function FeaturedPhraseButton({ phrase }: { phrase: OperatorPhrase }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle');

  const handleCopy = async () => {
    try {
      await copyText(phrase.text);
      setState('copied');
      window.setTimeout(() => setState('idle'), 1400);
    } catch {
      setState('error');
      window.setTimeout(() => setState('idle'), 1800);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${phrase.label}`}
      data-operator-phrase={phrase.id}
      data-copy-state={state}
      className="group flex min-h-[4.5rem] w-full select-none items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/55 active:bg-muted/80 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:min-h-20 sm:px-4"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold tracking-[-0.015em] sm:text-[0.95rem]">
          {phrase.label}
        </span>
        <span className="mt-0.5 block text-xs leading-4 text-muted-foreground sm:line-clamp-1">
          {phrase.note}
        </span>
      </span>
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border/70 bg-background/65 text-muted-foreground transition-[color,transform,background-color] group-hover:bg-background group-hover:text-foreground group-active:scale-95"
        aria-hidden="true"
      >
        {state === 'copied' ? (
          <Check className="h-4 w-4" />
        ) : (
          <Clipboard className="h-4 w-4" />
        )}
      </span>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {state === 'copied'
          ? 'Copied'
          : state === 'error'
            ? 'Copy failed'
            : ''}
      </span>
    </button>
  );
}

export function OperatorConsole({
  mode = 'full',
}: {
  mode?: 'featured' | 'full';
}) {
  const [activeGroup, setActiveGroup] = useState<OperatorPhraseGroupId>('do');
  const activePhrases = operatorPhrases.filter(
    phrase => phrase.group === activeGroup
  );

  useEffect(() => {
    if (mode !== 'full') return;

    const syncPhraseHash = () => {
      const phraseId = window.location.hash.slice(1);
      const phrase = operatorPhrases.find(item => item.id === phraseId);
      if (!phrase) return;

      setActiveGroup(phrase.group);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document
            .getElementById(phrase.id)
            ?.scrollIntoView({ block: 'center' });
        });
      });
    };

    syncPhraseHash();
    window.addEventListener('hashchange', syncPhraseHash);
    return () => window.removeEventListener('hashchange', syncPhraseHash);
  }, [mode]);

  if (mode === 'featured') {
    return (
      <section aria-labelledby="operator-console-title" data-operator-console>
        <div className="overflow-hidden rounded-[1.4rem] border border-border/70 bg-card/80 shadow-[0_12px_30px_rgba(35,31,26,0.07)] backdrop-blur-sm dark:shadow-[0_14px_34px_rgba(0,0,0,0.22)]">
          <div className="flex min-h-14 items-center justify-between gap-4 border-b border-border/65 px-3.5 py-2.5 sm:px-4">
            <div className="min-w-0">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Copy into a chat
              </p>
              <h1
                id="operator-console-title"
                className="mt-0.5 truncate text-lg font-bold tracking-[-0.025em] sm:text-xl"
              >
                Operator phrases
              </h1>
            </div>
            <Link
              href="/operator"
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              All phrases
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid border-border/55 [&>*:nth-child(n+2)]:border-t sm:grid-cols-2 sm:[&>*:nth-child(2)]:border-l sm:[&>*:nth-child(2)]:border-t-0 sm:[&>*:nth-child(4)]:border-l">
            {featuredPhrases.map(phrase => (
              <FeaturedPhraseButton key={phrase.id} phrase={phrase} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const activeGroupInfo = operatorPhraseGroups.find(group => group.id === activeGroup)!;

  const selectGroup = (groupId: OperatorPhraseGroupId) => {
    setActiveGroup(groupId);
    if (window.location.hash) {
      window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${window.location.search}`
      );
    }
  };

  return (
    <section aria-labelledby="operator-phrasebook-title" data-operator-console>
      <div className="max-w-3xl">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Operator phrasebook
        </p>
        <h1
          id="operator-phrasebook-title"
          className="mt-1 text-4xl font-black tracking-[-0.05em] sm:text-5xl"
        >
          Copy the nudge. Keep moving.
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          These are reusable steering phrases, not a second standing instruction stack. Pick the one that fits the moment; current direct messages win. Every phrase has a stable link when you want to point someone at one exact section.
        </p>
      </div>

      <div
        className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4"
        role="tablist"
        aria-label="Operator phrase groups"
      >
        {operatorPhraseGroups.map(group => {
          const Icon = groupIcons[group.id];
          const selected = group.id === activeGroup;
          return (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => selectGroup(group.id)}
              className={`flex min-h-14 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition-[transform,background-color,border-color,box-shadow] active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                selected
                  ? 'border-foreground/30 bg-foreground text-background shadow-[0_4px_0_rgba(24,24,27,0.18)] dark:shadow-[0_4px_0_rgba(255,255,255,0.14)]'
                  : 'border-border/75 bg-card hover:border-foreground/25 hover:bg-muted/60'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {group.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight">{activeGroupInfo.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{activeGroupInfo.description}</p>
        </div>
        <a
          href="/operator.txt"
          className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Plain text
        </a>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-3">
        {activePhrases.map(phrase => (
          <PhraseButton key={phrase.id} phrase={phrase} showReference />
        ))}
      </div>
    </section>
  );
}
