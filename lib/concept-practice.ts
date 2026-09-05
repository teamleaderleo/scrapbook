export type ConceptExercise = {
  slug: string;
  title: string;
  topic: string;
  questions: string[];
  reference: string;
};

export function conceptExerciseFromMarkdown(
  entry: { slug: string; title: string; trunk?: string; summary?: string },
  markdown: string
): ConceptExercise | null {
  const section = (name: string) =>
    markdown
      .match(
        new RegExp(`^## ${name}\\s*\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'm')
      )?.[1]
      ?.trim() ?? '';
  const plain = (text: string) =>
    text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`]/g, '');
  const questions = section('Pressure questions')
    .split('\n')
    .filter(line => /^-\s+/.test(line))
    .map(line => plain(line.replace(/^-\s+/, '')));
  if (!questions.length) return null;
  const reference = plain(section('Invariant') || entry.summary || '');
  if (!reference) return null;
  return {
    slug: entry.slug,
    title: entry.title,
    topic: entry.trunk ?? 'concepts',
    questions,
    reference,
  };
}
