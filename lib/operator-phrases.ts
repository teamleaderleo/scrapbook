export const operatorPhraseGroups = [
  {
    id: 'do',
    label: 'Do',
    description: 'Open-ended execution and useful continuation.',
  },
  {
    id: 'review',
    label: 'Review',
    description: 'Get another pass without turning review into ceremony.',
  },
  {
    id: 'steer',
    label: 'Steer',
    description: 'Change the framing when the current groove is getting too comfortable.',
  },
  {
    id: 'lazy',
    label: "I'm tired",
    description: 'Shortcuts for when repeating the usual guidance sounds exhausting.',
  },
] as const;

export type OperatorPhraseGroupId = (typeof operatorPhraseGroups)[number]['id'];

export type OperatorPhrase = {
  id: string;
  group: OperatorPhraseGroupId;
  label: string;
  note: string;
  text: string;
  featured?: boolean;
};

export const operatorPhrases: readonly OperatorPhrase[] = [
  {
    id: 'go-do-stuff',
    group: 'do',
    label: 'Go do stuff',
    note: 'Own the outcome and keep moving through useful next steps.',
    featured: true,
    text: "Take this as an open-ended assignment. Inspect the relevant code, issues, history, related repositories, and outside sources when useful. Use your judgment, make useful changes where appropriate, test and review what you change, and keep going through natural next steps. Don't make me supervise every command.",
  },
  {
    id: 'snoop-around',
    group: 'do',
    label: 'Snoop around',
    note: 'Explore beyond the obvious task and follow grounded leads.',
    text: "Go snoop around. Look for contradictions, stale assumptions, duplicated machinery, awkward ergonomics, and useful opportunities I haven't explicitly named. Follow interesting leads when they're grounded, and use your judgment about what is worth changing versus merely noting.",
  },
  {
    id: 'finish-the-thing',
    group: 'do',
    label: 'Finish the thing',
    note: 'Implementation, checks, cleanup, and the boring last mile.',
    text: "Take this through the whole useful lifecycle rather than stopping after the first successful edit or command. Implement it, run the relevant checks, inspect the complete result, fix what you find, clean up stale carrier or coordination state when appropriate, and stop at a real natural boundary.",
  },
  {
    id: 'fresh-context-review',
    group: 'review',
    label: 'Fresh-context review',
    note: 'Another capable reviewer forms a view from the current artifacts.',
    featured: true,
    text: "Get a fresh-context review of the current issue, pull request, code, and evidence. Give the reviewer the exact current artifacts and let them form their own view before feeding them our existing conclusion. Then reconcile the disagreements instead of blindly averaging opinions.",
  },
  {
    id: 'perspective-pass',
    group: 'review',
    label: 'Perspective pass',
    note: 'Re-weight the problem, expose assumptions, then simplify before deciding.',
    text: "Take a fresh perspective pass before converging. Re-weight the problem from several useful angles rather than merely extending the current reasoning: simplify aggressively, check for missing constraints or consequences, reconsider whether we are solving X when the real goal is Y, make the strongest reasonable counterargument, and try a materially different emphasis. For important claims, distinguish what is observed, inferred, assumed, and speculative. Preserve real disagreement without manufacturing contrarianism. Then identify the unknowns that could actually change the decision, discard complexity that does not affect the outcome, and give the simplest recommendation that still accounts for the important evidence. Say what would cause that recommendation to change.",
  },
  {
    id: 'adversarial-review',
    group: 'review',
    label: 'Try to make it lose',
    note: 'Actively search for the strongest reason the current approach is wrong.',
    text: "Review this adversarially. Try to make the current approach lose: look for stale premises, hidden lifecycle states, false-positive tests, compatibility losses, authority mistakes, and simpler alternatives. If it survives, say why. If it doesn't, identify the smallest discriminator or repair that would settle it.",
  },
  {
    id: 'whole-artifact-review',
    group: 'review',
    label: 'Review the whole thing',
    note: 'Issue, PR, code, tests, evidence, and current state together.',
    text: "Review the issue, pull request, complete current diff, relevant source, tests, and evidence together. Check whether the story still matches the exact code and current head, whether anything important is missing, and whether the coordination state should change as a result.",
  },
  {
    id: 'think-sideways',
    group: 'steer',
    label: 'Think sideways',
    note: 'Reconsider the framing instead of polishing the same local optimum.',
    featured: true,
    text: "You may be locally optimizing the current approach. Reconsider the framing, inspect adjacent systems and alternative designs, and see whether we should be solving a different problem. Use outside research or my other repositories when they provide a useful comparison.",
  },
  {
    id: 'trim-the-bullshit',
    group: 'steer',
    label: 'Trim the bullshit',
    note: 'Keep the rigor; lose the ceremony and defensive filler.',
    text: "Keep the useful rigor and trim the bullshit. Remove repetitive caveats, defensive prose, unnecessary procedure, redundant instructions, and abstractions that aren't paying rent. Prefer one clear owner for a rule or fact instead of restating it everywhere.",
  },
  {
    id: 'use-my-taste',
    group: 'steer',
    label: 'Use my taste',
    note: 'Treat the operator preference as design input, not another checklist.',
    text: "Use the preferences and corrections I've been giving you as design input. Keep the technical competence, but don't default to model-ish ceremony, corporate voice, excessive qualification, or tidy taxonomy for its own sake. When taste is genuinely subjective, optimize for what I'd actually want to use.",
  },
  {
    id: 'read-operator-page',
    group: 'lazy',
    label: 'Bro, just read this',
    note: 'The one-link version of the usual operator steering.',
    featured: true,
    text: "Read https://teamleaderleo.com/operator and use the guidance there as context for this task. Treat the relevant parts as things I'd normally tell you myself. Use judgment rather than mechanically applying everything, and let my current messages override anything there. Then reconsider the current work and keep going.",
  },
  {
    id: 'raw-copy',
    group: 'lazy',
    label: 'Give me raw copy',
    note: 'Literal source when chat rendering gets in the way.',
    text: "Give me the literal raw text in a form I can copy without the chat interface interpreting Markdown or changing the source. If the interface will render it anyway, put the exact source in a plain .txt artifact and give me that instead.",
  },
  {
    id: 'upstream-greenlight',
    group: 'lazy',
    label: 'Upstream greenlight',
    note: 'Authorize the current upstream interaction already clear from context.',
    text: 'Upstream greenlight for the current upstream repository and interaction we are discussing. Use the surrounding conversation to resolve the scope; ask only if the repository or action is genuinely ambiguous or materially broader than what we have been talking about.',
  },
] as const;

export function renderOperatorPhrasebookText() {
  const lines = [
    'Leo operator phrasebook',
    '',
    'Use the relevant guidance as context rather than mechanically applying every entry. Current direct messages override this page.',
  ];

  for (const group of operatorPhraseGroups) {
    lines.push('', group.label.toUpperCase(), '');
    for (const phrase of operatorPhrases.filter(item => item.group === group.id)) {
      lines.push(
        `${phrase.label}:`,
        `Reference: https://teamleaderleo.com/operator#${phrase.id}`,
        phrase.text,
        ''
      );
    }
  }

  return `${lines.join('\n').trim()}\n`;
}
