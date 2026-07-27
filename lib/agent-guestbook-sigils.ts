import type { AgentIdentitySigilSelection } from './agent-identity-sigils';

/**
 * New guestbook entries use generation 2 automatically from repository, name, and note.
 * Add an entry here only when a visitor deliberately picks a generation or variant.
 * Keeping selection separate avoids leaking generator internals into every guestbook record.
 */
export const agentGuestbookSigilSelections = {} satisfies Record<
  string,
  AgentIdentitySigilSelection
>;

export function agentGuestbookSigilSelection(entryId: string) {
  return agentGuestbookSigilSelections[entryId];
}
