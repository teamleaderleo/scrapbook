'use client';

import {
  applySpaceItemPracticeChoice,
  isInterviewSpaceItem,
  readSpaceItemPracticeChoice,
  setSpaceItemInterviewPrep,
  SPACE_ITEM_PRACTICE_CHOICES,
  type SpaceItemPracticeChoice,
} from '@/lib/space-item-intake';

export function ItemIntakeBar({
  tags,
  category,
  onChange,
}: {
  tags: string[];
  category: string | null;
  onChange: (next: { tags: string[]; category: string | null }) => void;
}) {
  const interview = isInterviewSpaceItem(tags);
  const practice = readSpaceItemPracticeChoice(tags);

  const setInterview = (enabled: boolean) => {
    onChange({
      category,
      tags: setSpaceItemInterviewPrep(tags, enabled),
    });
  };

  const setPractice = (choice: SpaceItemPracticeChoice) => {
    onChange(applySpaceItemPracticeChoice({ tags, category }, choice));
  };

  return (
    <section
      className="mb-4 rounded-xl border border-border/75 bg-card/45 p-3 shadow-sm"
      aria-labelledby="space-item-intake-title"
      data-space-item-intake
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p
            id="space-item-intake-title"
            className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground"
          >
            Quick intake
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Classify the study here. Markdown and code stay untouched.
          </p>
        </div>

        <div className="flex rounded-lg border border-border bg-background/65 p-1" role="group" aria-label="Study use">
          {[
            { label: 'General', value: false },
            { label: 'Interview', value: true },
          ].map(option => {
            const active = interview === option.value;
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={active}
                onClick={() => setInterview(option.value)}
                className={`min-h-9 rounded-md px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Practice
        </p>
        <div
          className="mt-1.5 flex flex-wrap gap-1.5"
          role="group"
          aria-label="Practice classification"
        >
          {SPACE_ITEM_PRACTICE_CHOICES.map(choice => {
            const active = practice === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                aria-pressed={active}
                onClick={() => setPractice(choice.id)}
                className={`min-h-9 rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? 'border-foreground/35 bg-foreground text-background'
                    : 'border-border bg-background/55 text-muted-foreground hover:border-foreground/25 hover:text-foreground'
                }`}
              >
                {choice.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-3 font-mono text-[9px] leading-4 text-muted-foreground">
        {interview ? 'prep:interview · ' : ''}mode:{practice} · category:{category ?? 'general'}
      </p>
    </section>
  );
}
