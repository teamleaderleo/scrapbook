import 'server-only';
import { createHighlighter } from 'shiki';
import { practicePassages } from './practice-passages';
import { practiceInsights } from './practice-insights';
import {
  practiceThemeChoices, practiceThemePreview, normalizeColor, readableColor,
  type PracticeAppearanceData, type PracticeToken,
} from './practice-appearance';

export async function getPracticeAppearance(): Promise<PracticeAppearanceData> {
  'use cache';
  const highlighter = await createHighlighter({
    themes: practiceThemeChoices.map(theme => theme.id),
    langs: ['typescript'],
  });
  try {
    const themes = practiceThemeChoices.map(choice => {
      const theme = highlighter.getTheme(choice.id);
      const colors = theme.colors ?? {};
      const functionColor = highlighter.codeToTokens('function read() {}', { lang: 'typescript', theme: choice.id }).tokens.flat().find(token => token.content === 'read')?.color;
      return {
        ...choice,
        background: normalizeColor(theme.bg!), foreground: normalizeColor(theme.fg!),
        accent: readableColor(functionColor || theme.fg!, theme.bg!, theme.fg!),
        error: readableColor(colors['editorError.foreground'] || colors.errorForeground || (choice.type === 'dark' ? '#f38ba8' : '#9f1239'), theme.bg!, theme.fg!),
      };
    });
    const sources = new Set([
      practiceThemePreview,
      ...practicePassages.filter(passage => passage.kind === 'code').map(passage => passage.text),
      ...Object.values(practiceInsights).flatMap(insights => insights.flatMap(insight => [
        insight.match.trim(), ...insight.changes.map(change => change.replacement.trim()).filter(Boolean),
      ])),
    ]);
    const syntax: PracticeAppearanceData['syntax'] = {};
    const themeMap = Object.fromEntries(practiceThemeChoices.map(theme => [theme.id, theme.id]));
    for (const text of sources) {
      const tokens = highlighter.codeToTokensWithThemes(text, { lang: 'typescript', themes: themeMap }).flat();
      const ranges: PracticeToken[] = [];
      let offset = 0;
      for (const token of tokens) {
        if (token.offset > offset) ranges.push({ start: offset, end: token.offset, colors: themes.map(theme => theme.foreground) });
        ranges.push({ start: token.offset, end: token.offset + token.content.length, colors: themes.map(theme => normalizeColor(token.variants[theme.id].color ?? theme.foreground)) });
        offset = token.offset + token.content.length;
      }
      if (offset < text.length) ranges.push({ start: offset, end: text.length, colors: themes.map(theme => theme.foreground) });
      syntax[text] = ranges;
    }
    return { themes, syntax };
  } finally {
    highlighter.dispose();
  }
}
