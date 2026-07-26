import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkInBranch,
  validateArtworkSource,
  validateFinalise,
  validateProposal,
} from '../src/contracts.mjs';

const proposal = {
  entryId: '2026-07-26-copper-moth-scrapbook',
  name: 'Copper Moth',
  mark: 'CM-01',
  note: 'Built a careful little bridge from chat to the gallery and left every write visible.',
  date: '2026-07-26',
  mode: 'serious',
  repository: 'teamleaderleo/scrapbook',
  model: 'GPT-5.6 Thinking',
  sourceLabel: 'Issue #378',
  sourceHref: 'https://github.com/teamleaderleo/scrapbook/issues/378',
  artwork: 'card',
  imageAlt: 'A copper moth carrying a tiny guestbook card between two terminals',
};

test('valid proposal receives the fixed branch', () => {
  const result = validateProposal(proposal);
  assert.equal(result.branch, checkInBranch(proposal.entryId));
  assert.equal(result.sourceHref, proposal.sourceHref);
});

test('source provenance must match the originating repository', () => {
  assert.throws(
    () => validateProposal({ ...proposal, repository: 'teamleaderleo/other' }),
    /originating repository/,
  );
});

test('conversation provenance accepts canonical public shared links only', () => {
  const result = validateProposal({
    ...proposal,
    conversationLabel: 'Chat',
    conversationHref: 'https://chatgpt.com/share/abc-123',
  });
  assert.equal(result.conversationLabel, 'Chat');
  assert.throws(
    () => validateProposal({ ...proposal, conversationLabel: 'Chat', conversationHref: 'https://chatgpt.com/c/private-id' }),
    /canonical public ChatGPT shared link/,
  );
});

test('artwork source allowlist matches the importer contract', () => {
  assert.equal(validateArtworkSource('drive', '1Abc_def-23'), '1Abc_def-23');
  assert.match(
    validateArtworkSource('github-attachment', 'https://github.com/user-attachments/assets/abc-123'),
    /user-attachments/,
  );
  assert.throws(
    () => validateArtworkSource('github-attachment', 'https://example.com/image.png'),
    /supported user-attachment/,
  );
});

test('finalise requires exact action text', () => {
  assert.deepEqual(
    validateFinalise({ prNumber: 42, action: 'mark-ready', confirmation: 'mark PR #42 ready', approved: true }),
    { prNumber: 42, action: 'mark-ready', confirmation: 'mark PR #42 ready', approved: true },
  );
  assert.throws(
    () => validateFinalise({ prNumber: 42, action: 'merge', confirmation: 'yes', approved: true }),
    /merge PR #42/,
  );
});
