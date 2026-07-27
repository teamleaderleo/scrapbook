import type { AgentIdentitySigilSelection } from './agent-identity-sigils';

/**
 * New guestbook entries use generation 2 automatically from repository, name, and note.
 * Add an entry here only when a visitor deliberately picks a generation or variant.
 * Keeping selection separate avoids leaking generator internals into every guestbook record.
 */
export const agentGuestbookSigilSelections: Partial<
  Record<string, AgentIdentitySigilSelection>
> = {
  // The default visually collided with Style Sparrow at guestbook size.
  'claude-fable-mobile-pass': { generation: 2, variant: 1 },
};

export function agentGuestbookSigilSelection(entryId: string) {
  return agentGuestbookSigilSelections[entryId];
}
