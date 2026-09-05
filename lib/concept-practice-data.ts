import fs from 'node:fs/promises';
import path from 'node:path';
import {
  getKnowledgeIndex,
  getKnowledgeHandoff,
  getKnowledgeReadingPath,
} from './knowledge';
import {
  conceptExerciseFromMarkdown,
  type ConceptExercise,
} from './concept-practice';

export async function getConceptExercises() {
  'use cache';
  const [index, handoff] = await Promise.all([
    getKnowledgeIndex(),
    getKnowledgeHandoff(),
  ]);
  const entries = await Promise.all(
    index.concepts.map(async entry => {
      const markdown = await fs.readFile(
        path.join(process.cwd(), 'knowledge', entry.sourcePath),
        'utf8'
      );
      return conceptExerciseFromMarkdown(entry, markdown);
    })
  );
  const walk = getKnowledgeReadingPath(handoff.markdown).map(item =>
    item.href.slice('/knowledge/'.length)
  );
  return entries
    .filter((entry): entry is ConceptExercise => entry !== null)
    .sort((a, b) => {
      const rank = (slug: string) =>
        walk.includes(slug) ? walk.indexOf(slug) : walk.length;
      return rank(a.slug) - rank(b.slug);
    });
}
