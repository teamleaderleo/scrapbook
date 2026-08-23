import {
  segmentCensoredText,
  STRONG_PROFANITY_CENSOR_RULES,
  type CensorRule,
} from '@/lib/censor-reveal';

export function CensorReveal({
  text,
  rules = STRONG_PROFANITY_CENSOR_RULES,
  focusable = false,
  className = '',
  title = 'covered text · hover or focus to reveal',
}: {
  text: string;
  rules?: readonly CensorRule[];
  focusable?: boolean;
  className?: string;
  title?: string;
}) {
  const segments = segmentCensoredText(text, rules);
  const hasCensoredText = segments.some(segment => segment.censored);
  if (!hasCensoredText) return <>{text}</>;

  return (
    <span
      aria-label={text}
      className={className}
      data-censor-reveal
    >
      {segments.map((segment, index) =>
        segment.censored ? (
          <span
            key={`${segment.text}-${index}`}
            aria-hidden="true"
            data-censor-token
            data-censor-rules={segment.ruleIds.join(',')}
            tabIndex={focusable ? 0 : undefined}
            title={title}
            className="relative inline-block cursor-help rounded-[0.28em] border border-foreground/15 bg-[repeating-linear-gradient(135deg,hsl(var(--foreground)/0.14)_0_2px,transparent_2px_5px)] px-[0.12em] text-transparent [text-shadow:0_0_6px_hsl(var(--foreground)/0.52)] transition-[color,background-image,border-color,text-shadow] duration-150 hover:border-transparent hover:bg-none hover:text-inherit hover:[text-shadow:none] focus-visible:border-transparent focus-visible:bg-none focus-visible:text-inherit focus-visible:[text-shadow:none] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring group-focus-visible:border-transparent group-focus-visible:bg-none group-focus-visible:text-inherit group-focus-visible:[text-shadow:none] motion-reduce:transition-none"
          >
            {segment.text}
          </span>
        ) : (
          <span key={`${segment.text}-${index}`} aria-hidden="true">
            {segment.text}
          </span>
        )
      )}
    </span>
  );
}
