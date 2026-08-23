# Censor reveal

Scrapbook's public writing can keep the original language while giving the reader an explicit cover-and-reveal interaction.

The implementation is split on purpose:

- `lib/censor-reveal.ts` owns matching and segmentation. It has no React or Scrapbook styling dependency.
- `components/ui/censor-reveal.tsx` owns the site's hatched cover, hover/focus reveal, and accessibility treatment.

## Why this is its own primitive

Common profanity packages are mostly concerned with answering “does this string contain a listed term?” and replacing the match with another string. Scrapbook also needs a presentation concept: preserve the exact text, cover selected ranges, reveal them on intent, and allow the same mechanism to hide names, spoilers, sensitive labels, or arbitrary caller-supplied terms.

The core therefore accepts `CensorRule` values rather than hard-coding profanity as the only use case. `STRONG_PROFANITY_CENSOR_RULES` is merely the site's default rule set.

## Package seam

The matching core is intentionally small enough to extract into an npm package later. A package version should keep these exports framework-neutral:

```ts
segmentCensoredText(text, rules)
censorRuleFromWords(id, words, options)
STRONG_PROFANITY_CENSOR_RULES
```

A React adapter can be a separate export or companion package. Publishing should happen after the API survives some real Scrapbook use; the site is the dogfood first.

## Rendering rules

Visible Workbench titles and summaries use the reveal treatment. The underlying strings stay complete for authorship, source records, and caller-controlled uses. The component exposes the original text through its accessible label while the decorative matched fragments are hidden from the accessibility tree to avoid duplicate speech.
