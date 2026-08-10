export type SpaceShortcutScope = 'global' | 'local' | 'sheet' | 'modal';
export type SpaceShortcutRepeatPolicy = 'allow' | 'ignore';
export type SpaceShortcutEditablePolicy = 'ignore' | 'allow' | 'editor';

export type SpaceShortcutId =
  | 'help.open'
  | 'help.close'
  | 'search.toggle'
  | 'sidebar.toggle'
  | 'editor.toggle'
  | 'editor.close'
  | 'navigation.add'
  | 'navigation.toggle-view'
  | 'review.next'
  | 'review.previous'
  | 'review.toggle-content'
  | 'review.exit'
  | 'list.toggle-hovered'
  | 'trail.next'
  | 'trail.previous';

export type SpaceShortcutBinding = {
  key: string;
  code?: string;
  keyLabel?: string;
  modifiers?: {
    mod?: boolean;
    alt?: boolean;
    shift?: boolean;
  };
};

export type SpaceShortcutCategory =
  | 'General'
  | 'Navigation'
  | 'Review'
  | 'Editor'
  | 'List'
  | 'Trail';

export type SpaceShortcutDefinition = {
  id: SpaceShortcutId;
  keys: readonly SpaceShortcutBinding[];
  scope: SpaceShortcutScope;
  category: SpaceShortcutCategory;
  description: string;
  priority: number;
  repeat: SpaceShortcutRepeatPolicy;
  editable: SpaceShortcutEditablePolicy;
  composition?: 'allow' | 'ignore';
  hiddenFromReference?: boolean;
};

export type SpaceShortcutRegistration = {
  run: (event?: KeyboardEvent) => void;
  active?: boolean;
  enabled?: boolean;
  disabledReason?: string;
};

export type SpaceShortcutRegistrations = ReadonlyMap<
  SpaceShortcutId,
  SpaceShortcutRegistration
>;

export type SpaceShortcutResolution = {
  definition: SpaceShortcutDefinition;
  registration: SpaceShortcutRegistration;
  enabled: boolean;
};

export type SpaceShortcutReferenceEntry = {
  definition: SpaceShortcutDefinition;
  available: boolean;
  unavailableReason?: string;
};

const SCOPE_PRIORITY: Record<SpaceShortcutScope, number> = {
  global: 0,
  local: 10_000,
  sheet: 20_000,
  modal: 30_000,
};

export const SPACE_SHORTCUTS: readonly SpaceShortcutDefinition[] = [
  {
    id: 'help.open',
    keys: [{ key: '?', code: 'Slash', keyLabel: '?', modifiers: { shift: true } }],
    scope: 'global',
    category: 'General',
    description: 'Open keyboard shortcut reference',
    priority: 100,
    repeat: 'ignore',
    editable: 'ignore',
  },
  {
    id: 'help.close',
    keys: [{ key: 'Escape', keyLabel: 'Esc' }],
    scope: 'modal',
    category: 'General',
    description: 'Close keyboard shortcut reference',
    priority: 1_000,
    repeat: 'ignore',
    editable: 'allow',
    hiddenFromReference: true,
  },
  {
    id: 'search.toggle',
    keys: [{ key: 'k', code: 'KeyK', keyLabel: 'K', modifiers: { mod: true } }],
    scope: 'global',
    category: 'General',
    description: 'Open or close item search',
    priority: 90,
    repeat: 'ignore',
    editable: 'allow',
  },
  {
    id: 'sidebar.toggle',
    keys: [{ key: 'b', code: 'KeyB', keyLabel: 'B', modifiers: { mod: true } }],
    scope: 'global',
    category: 'General',
    description: 'Open or close the navigation sidebar',
    priority: 85,
    repeat: 'ignore',
    editable: 'ignore',
  },
  {
    id: 'editor.toggle',
    keys: [{ key: 'i', code: 'KeyI', keyLabel: 'I', modifiers: { mod: true } }],
    scope: 'global',
    category: 'Editor',
    description: 'Open or close the code editor',
    priority: 80,
    repeat: 'ignore',
    editable: 'editor',
  },
  {
    id: 'editor.close',
    keys: [{ key: 'Escape', keyLabel: 'Esc' }],
    scope: 'sheet',
    category: 'Editor',
    description: 'Close the mobile code editor',
    priority: 1_000,
    repeat: 'ignore',
    editable: 'allow',
    hiddenFromReference: true,
  },
  {
    id: 'navigation.add',
    keys: [
      {
        key: 'a',
        code: 'KeyA',
        keyLabel: 'A',
        modifiers: { mod: true, alt: true },
      },
    ],
    scope: 'global',
    category: 'Navigation',
    description: 'Add a new item',
    priority: 70,
    repeat: 'ignore',
    editable: 'ignore',
  },
  {
    id: 'navigation.toggle-view',
    keys: [
      { key: 'e', code: 'KeyE', keyLabel: 'E', modifiers: { mod: true } },
      {
        key: 'e',
        code: 'KeyE',
        keyLabel: 'E',
        modifiers: { mod: true, shift: true },
      },
    ],
    scope: 'global',
    category: 'Navigation',
    description: 'Switch between list and reader views',
    priority: 70,
    repeat: 'ignore',
    editable: 'ignore',
  },
  {
    id: 'review.next',
    keys: [
      { key: 'ArrowRight', keyLabel: '→' },
      { key: 'j', code: 'KeyJ', keyLabel: 'J' },
    ],
    scope: 'local',
    category: 'Review',
    description: 'Move to the next reader item',
    priority: 90,
    repeat: 'allow',
    editable: 'ignore',
  },
  {
    id: 'review.previous',
    keys: [
      { key: 'ArrowLeft', keyLabel: '←' },
      { key: 'k', code: 'KeyK', keyLabel: 'K' },
    ],
    scope: 'local',
    category: 'Review',
    description: 'Move to the previous reader item',
    priority: 90,
    repeat: 'allow',
    editable: 'ignore',
  },
  {
    id: 'review.toggle-content',
    keys: [{ key: ' ', code: 'Space', keyLabel: 'Space' }],
    scope: 'local',
    category: 'Review',
    description: 'Show or hide reader content',
    priority: 80,
    repeat: 'ignore',
    editable: 'ignore',
  },
  {
    id: 'review.exit',
    keys: [{ key: 'Escape', keyLabel: 'Esc' }],
    scope: 'local',
    category: 'Review',
    description: 'Return to the item list',
    priority: 100,
    repeat: 'ignore',
    editable: 'ignore',
  },
  {
    id: 'list.toggle-hovered',
    keys: [{ key: 'Shift', keyLabel: 'Shift', modifiers: { shift: true } }],
    scope: 'local',
    category: 'List',
    description: 'Expand or collapse the hovered item',
    priority: 80,
    repeat: 'ignore',
    editable: 'ignore',
  },
  {
    id: 'trail.next',
    keys: [{ key: 'j', code: 'KeyJ', keyLabel: 'J' }],
    scope: 'local',
    category: 'Trail',
    description: 'Move to the next Trail recommendation',
    priority: 90,
    repeat: 'allow',
    editable: 'ignore',
  },
  {
    id: 'trail.previous',
    keys: [{ key: 'k', code: 'KeyK', keyLabel: 'K' }],
    scope: 'local',
    category: 'Trail',
    description: 'Move to the previous Trail recommendation',
    priority: 90,
    repeat: 'allow',
    editable: 'ignore',
  },
] as const;

function normaliseKey(key: string) {
  return key.length === 1 ? key.toLowerCase() : key;
}

function getTargetLike(target: EventTarget | null) {
  return target as
    | (EventTarget & {
        tagName?: string;
        isContentEditable?: boolean;
        getAttribute?: (name: string) => string | null;
        closest?: (selector: string) => unknown;
      })
    | null;
}

export function isEditableShortcutTarget(target: EventTarget | null) {
  const candidate = getTargetLike(target);
  if (!candidate) return false;

  const tagName = candidate.tagName?.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }
  if (candidate.isContentEditable) return true;

  const role = candidate.getAttribute?.('role');
  if (role === 'textbox' || role === 'searchbox' || role === 'combobox') {
    return true;
  }

  return Boolean(
    candidate.closest?.(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="searchbox"], [role="combobox"], [data-space-shortcut-editable]'
    )
  );
}

function editablePolicyAllows(
  definition: SpaceShortcutDefinition,
  target: EventTarget | null
) {
  if (!isEditableShortcutTarget(target)) return true;
  if (definition.editable === 'allow') return true;
  if (definition.editable === 'ignore') return false;

  return Boolean(
    getTargetLike(target)?.closest?.('[data-space-shortcut-scope="editor"]')
  );
}

export function matchesSpaceShortcutBinding(
  event: KeyboardEvent,
  binding: SpaceShortcutBinding
) {
  if (event.getModifierState?.('AltGraph')) return false;

  const expectedMod = binding.modifiers?.mod ?? false;
  const expectedAlt = binding.modifiers?.alt ?? false;
  const expectedShift = binding.modifiers?.shift ?? false;
  const pressedModKeys = Number(event.metaKey) + Number(event.ctrlKey);

  if (
    (expectedMod ? pressedModKeys !== 1 : pressedModKeys !== 0) ||
    event.altKey !== expectedAlt ||
    event.shiftKey !== expectedShift
  ) {
    return false;
  }

  const keyMatches = normaliseKey(event.key) === normaliseKey(binding.key);
  const codeMatches = binding.code ? event.code === binding.code : false;
  return keyMatches || codeMatches;
}

function definitionMatchesEvent(
  definition: SpaceShortcutDefinition,
  event: KeyboardEvent
) {
  if (event.repeat && definition.repeat === 'ignore') return false;
  if (
    definition.composition !== 'allow' &&
    (event.isComposing || event.keyCode === 229)
  ) {
    return false;
  }
  if (!editablePolicyAllows(definition, event.target)) return false;
  return definition.keys.some(binding =>
    matchesSpaceShortcutBinding(event, binding)
  );
}

export function resolveSpaceShortcut(
  event: KeyboardEvent,
  registrations: SpaceShortcutRegistrations,
  definitions: readonly SpaceShortcutDefinition[] = SPACE_SHORTCUTS
): SpaceShortcutResolution | null {
  if (event.defaultPrevented) return null;

  const candidates = definitions
    .map((definition, registryIndex) => {
      const registration = registrations.get(definition.id);
      if (
        !registration ||
        registration.active === false ||
        !definitionMatchesEvent(definition, event)
      ) {
        return null;
      }

      return {
        definition,
        registration,
        registryIndex,
        rank: SCOPE_PRIORITY[definition.scope] + definition.priority,
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> =>
      Boolean(candidate)
    )
    .sort(
      (left, right) =>
        right.rank - left.rank || left.registryIndex - right.registryIndex
    );

  const winner = candidates[0];
  if (!winner) return null;

  return {
    definition: winner.definition,
    registration: winner.registration,
    enabled: winner.registration.enabled !== false,
  };
}

export type SpaceShortcutListenerTarget = {
  addEventListener: (
    type: 'keydown',
    listener: (event: KeyboardEvent) => void
  ) => void;
  removeEventListener: (
    type: 'keydown',
    listener: (event: KeyboardEvent) => void
  ) => void;
};

export function installSpaceShortcutListener(
  target: SpaceShortcutListenerTarget,
  getRegistrations: () => SpaceShortcutRegistrations
) {
  const onKeyDown = (event: KeyboardEvent) => {
    const resolution = resolveSpaceShortcut(event, getRegistrations());
    if (!resolution || !resolution.enabled) return;

    event.preventDefault();
    resolution.registration.run(event);
  };

  target.addEventListener('keydown', onKeyDown);
  return () => target.removeEventListener('keydown', onKeyDown);
}

export function getSpaceShortcutReference(
  registrations: SpaceShortcutRegistrations
): SpaceShortcutReferenceEntry[] {
  return SPACE_SHORTCUTS.filter(
    definition => !definition.hiddenFromReference
  ).map(definition => {
    const registration = registrations.get(definition.id);
    const active = registration?.active !== false;
    const enabled = registration?.enabled !== false;
    const available = Boolean(registration && active && enabled);

    return {
      definition,
      available,
      unavailableReason: available
        ? undefined
        : registration?.disabledReason ?? 'Unavailable on this screen',
    };
  });
}

export function formatSpaceShortcutBinding(
  binding: SpaceShortcutBinding,
  isMac: boolean
) {
  const keyLabel = binding.keyLabel ?? binding.key;
  if (binding.key === '?' || binding.key === 'Shift') {
    return {
      visual: keyLabel,
      spoken: binding.key === '?' ? 'question mark' : 'Shift',
    };
  }

  const visualParts: string[] = [];
  const spokenParts: string[] = [];
  if (binding.modifiers?.mod) {
    visualParts.push(isMac ? '⌘' : 'Ctrl');
    spokenParts.push(isMac ? 'Command' : 'Control');
  }
  if (binding.modifiers?.alt) {
    visualParts.push(isMac ? '⌥' : 'Alt');
    spokenParts.push(isMac ? 'Option' : 'Alt');
  }
  if (binding.modifiers?.shift) {
    visualParts.push('Shift');
    spokenParts.push('Shift');
  }
  visualParts.push(keyLabel);
  spokenParts.push(keyLabel === 'Esc' ? 'Escape' : keyLabel);

  return {
    visual: visualParts.join(isMac ? '' : '+'),
    spoken: spokenParts.join(' plus '),
  };
}
