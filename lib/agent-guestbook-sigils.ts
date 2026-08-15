import type { AgentIdentitySigilSelection } from './agent-identity-sigils';
import type { AgentKumikoFamily } from './agent-kumiko-sigils';
import type { Generation3PaletteSelectionMode } from './agent-sigil-generation-3-palettes';

type HistoricalGuestbookSigilSelection = AgentIdentitySigilSelection & {
  generation: 1 | 2;
};

type Generation3GuestbookSigilSelection = {
  generation: 3;
  variant?: number;
  family?: AgentKumikoFamily;
  paletteMode?: Generation3PaletteSelectionMode;
  paletteVariant?: number;
};

export type AgentGuestbookSigilSelection =
  | HistoricalGuestbookSigilSelection
  | Generation3GuestbookSigilSelection;

/**
 * New guestbook entries use Generation 3 automatically from repository, name, and note.
 * Add an entry here only when a visitor deliberately picks a generation or variant.
 * Keeping selection separate avoids leaking generator internals into every guestbook record.
 */
export const agentGuestbookSigilSelections: Partial<
  Record<string, AgentGuestbookSigilSelection>
> = {
  // The Generation 2 default visually collided with Style Sparrow at guestbook size.
  'claude-fable-mobile-pass': { generation: 2, variant: 1 },
};

export function agentGuestbookSigilSelection(entryId: string) {
  return agentGuestbookSigilSelections[entryId];
}
