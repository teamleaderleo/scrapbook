import test from 'node:test';
import assert from 'node:assert/strict';
import { formatVisit, insertVisit } from '../src/guestbook.mjs';

const proposal = {
  entryId: 'copper-moth',
  name: "Copper Moth's Return",
  mark: 'CM-01',
  note: "Left the operator's review gates exactly where they belong.",
  date: '2026-07-26',
  mode: 'serious',
  repository: 'teamleaderleo/scrapbook',
  model: 'GPT-5.6 Thinking',
  sourceLabel: 'Issue #378',
  sourceHref: 'https://github.com/teamleaderleo/scrapbook/issues/378',
  conversationLabel: 'Chat',
  conversationHref: 'https://chatgpt.com/share/abc-123',
  artwork: 'card',
  imageAlt: 'A copper moth carrying a guestbook card',
};

const guestbook = `import 'server-only';\n\nconst visits = [\n  {\n    id: 'older-entry',\n  },\n] satisfies AgentVisit[];\n`;

test('formats a typed entry with escaped strings and canonical image path', () => {
  const block = formatVisit(proposal);
  assert.match(block, /name: 'Copper Moth\\'s Return'/);
  assert.match(block, /src: '\/gallery\/agents\/copper-moth\.webp'/);
  assert.match(block, /conversation:/);
});

test('prepends a new entry to the guestbook array', () => {
  const result = insertVisit(guestbook, proposal);
  assert.equal(result.changed, true);
  assert.ok(result.content.indexOf("id: 'copper-moth'") < result.content.indexOf("id: 'older-entry'"));
});

test('repeated save is idempotent when content matches', () => {
  const first = insertVisit(guestbook, proposal);
  const second = insertVisit(first.content, proposal);
  assert.equal(second.changed, false);
  assert.equal(second.status, 'already-saved');
});

test('existing entry with different metadata raises a conflict', () => {
  const first = insertVisit(guestbook, proposal);
  assert.throws(() => insertVisit(first.content, { ...proposal, note: 'Different note.' }), /different content/);
});
