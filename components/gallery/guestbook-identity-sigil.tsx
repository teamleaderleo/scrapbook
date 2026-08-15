import AgentGeneration3Sigil from '@/components/agent-generation-3-sigil';
import AgentIdentitySigil from '@/components/agent-identity-sigil';
import { agentGuestbookSigilSelection } from '@/lib/agent-guestbook-sigils';

export type GuestbookIdentitySigilProps = {
  entryId: string;
  scope: string;
  designation: string;
  description?: string;
  size?: number;
  className?: string;
  label?: string | null;
};

export function GuestbookIdentitySigil({
  entryId,
  scope,
  designation,
  description,
  size = 48,
  className,
  label,
}: GuestbookIdentitySigilProps) {
  const selection = agentGuestbookSigilSelection(entryId);

  if (selection?.generation === 1 || selection?.generation === 2) {
    return (
      <AgentIdentitySigil
        scope={scope}
        designation={designation}
        description={description}
        selection={selection}
        size={size}
        className={className}
        label={label}
      />
    );
  }

  return (
    <AgentGeneration3Sigil
      scope={scope}
      designation={designation}
      description={description}
      variant={selection?.variant}
      family={selection?.family}
      paletteMode={selection?.paletteMode}
      paletteVariant={selection?.paletteVariant}
      size={size}
      className={className}
      label={label}
    />
  );
}
