import { describe, expect, it, vi } from 'vitest';
import {
  SPACE_SHORTCUTS,
  getSpaceShortcutReference,
  installSpaceShortcutListener,
  matchesSpaceShortcutBinding,
  resolveSpaceShortcut,
  type SpaceShortcutDefinition,
  type SpaceShortcutId,
  type SpaceShortcutRegistration,
} from './space-shortcuts';

type KeyboardOverrides = Partial<KeyboardEvent> & {
  target?: EventTarget | null;
};

function keyboardEvent(key: string, overrides: KeyboardOverrides = {}) {
  let prevented = false;
  return {
    key,
    code: overrides.code ?? '',
    ctrlKey: overrides.ctrlKey ?? false,
    metaKey: overrides.metaKey ?? false,
    altKey: overrides.altKey ?? false,
    shiftKey: overrides.shiftKey ?? false,
    repeat: overrides.repeat ?? false,
    isComposing: overrides.isComposing ?? false,
    keyCode: overrides.keyCode ?? 0,
    target: overrides.target ?? null,
    get defaultPrevented() {
      return prevented || Boolean(overrides.defaultPrevented);
    },
    preventDefault: vi.fn(() => {
      prevented = true;
    }),
    getModifierState: vi.fn(() => false),
  } as unknown as KeyboardEvent;
}

function registrations(
  entries: Partial<Record<SpaceShortcutId, SpaceShortcutRegistration>>
) {
  return new Map(
    Object.entries(entries) as [SpaceShortcutId, SpaceShortcutRegistration][]
  );
}

function fakeTarget(options: { editable?: boolean; editor?: boolean } = {}) {
  return {
    tagName: options.editable ? 'INPUT' : 'DIV',
    isContentEditable: false,
    getAttribute: () => null,
    closest: (selector: string) => {
      if (options.editable && selector.includes('input')) return {};
      if (
        options.editor &&
        selector.includes('data-space-shortcut-scope="editor"')
      ) {
        return {};
      }
      return null;
    },
  } as unknown as EventTarget;
}

describe('Space shortcut matching', () => {
  it('keeps stable unique registry IDs, including Trail and sheet commands', () => {
    const ids = SPACE_SHORTCUTS.map(shortcut => shortcut.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([
      'help.open',
      'help.close',
      'search.toggle',
      'sidebar.toggle',
      'editor.toggle',
      'editor.close',
      'navigation.add',
      'navigation.toggle-view',
      'review.next',
      'review.previous',
      'review.toggle-content',
      'review.exit',
      'list.toggle-hovered',
      'trail.next',
      'trail.previous',
    ]);
  });

  it('matches exact modifiers and rejects extra or doubled Mod keys', () => {
    const binding = SPACE_SHORTCUTS.find(
      shortcut => shortcut.id === 'search.toggle'
    )!.keys[0];

    expect(
      matchesSpaceShortcutBinding(
        keyboardEvent('k', { ctrlKey: true }),
        binding
      )
    ).toBe(true);
    expect(
      matchesSpaceShortcutBinding(
        keyboardEvent('k', { metaKey: true }),
        binding
      )
    ).toBe(true);
    expect(
      matchesSpaceShortcutBinding(
        keyboardEvent('k', { ctrlKey: true, shiftKey: true }),
        binding
      )
    ).toBe(false);
    expect(
      matchesSpaceShortcutBinding(
        keyboardEvent('k', { ctrlKey: true, metaKey: true }),
        binding
      )
    ).toBe(false);
  });

  it('uses code fallback without treating AltGraph as a command modifier', () => {
    const binding = SPACE_SHORTCUTS.find(
      shortcut => shortcut.id === 'navigation.add'
    )!.keys[0];
    const event = keyboardEvent('å', {
      code: 'KeyA',
      ctrlKey: true,
      altKey: true,
    });
    Object.defineProperty(event, 'getModifierState', {
      value: (name: string) => name === 'AltGraph',
    });

    expect(matchesSpaceShortcutBinding(event, binding)).toBe(false);
  });

  it('keeps typing protected while allowing explicit search and editor commands', () => {
    const commands = registrations({
      'search.toggle': { run: vi.fn() },
      'navigation.toggle-view': { run: vi.fn() },
      'editor.toggle': { run: vi.fn() },
    });
    const editable = fakeTarget({ editable: true });

    expect(
      resolveSpaceShortcut(
        keyboardEvent('k', { ctrlKey: true, target: editable }),
        commands
      )?.definition.id
    ).toBe('search.toggle');

    expect(
      resolveSpaceShortcut(
        keyboardEvent('e', { ctrlKey: true, target: editable }),
        commands
      )
    ).toBeNull();

    expect(
      resolveSpaceShortcut(
        keyboardEvent('i', {
          ctrlKey: true,
          target: fakeTarget({ editable: true, editor: true }),
        }),
        commands
      )?.definition.id
    ).toBe('editor.toggle');
  });

  it('ignores IME composition and keyCode 229', () => {
    const commands = registrations({ 'review.next': { run: vi.fn() } });

    expect(
      resolveSpaceShortcut(
        keyboardEvent('j', { isComposing: true }),
        commands
      )
    ).toBeNull();
    expect(
      resolveSpaceShortcut(keyboardEvent('j', { keyCode: 229 }), commands)
    ).toBeNull();
  });

  it('keeps repeated-key policy explicit for reader and Trail movement', () => {
    const commands = registrations({
      'review.next': { run: vi.fn() },
      'review.toggle-content': { run: vi.fn() },
      'trail.next': { run: vi.fn() },
    });

    expect(
      resolveSpaceShortcut(keyboardEvent('j', { repeat: true }), commands)
        ?.definition.id
    ).toBe('review.next');
    expect(
      resolveSpaceShortcut(
        keyboardEvent(' ', { code: 'Space', repeat: true }),
        commands
      )
    ).toBeNull();

    const trailOnly = registrations({ 'trail.next': { run: vi.fn() } });
    expect(
      resolveSpaceShortcut(keyboardEvent('j', { repeat: true }), trailOnly)
        ?.definition.id
    ).toBe('trail.next');
  });

  it('lets a disabled higher scope block a lower-priority handler', () => {
    const definitions: readonly SpaceShortcutDefinition[] = [
      {
        ...SPACE_SHORTCUTS.find(shortcut => shortcut.id === 'review.exit')!,
        scope: 'local',
      },
      {
        ...SPACE_SHORTCUTS.find(shortcut => shortcut.id === 'help.close')!,
        scope: 'modal',
      },
    ];
    const commands = registrations({
      'review.exit': { run: vi.fn(), enabled: true },
      'help.close': {
        run: vi.fn(),
        enabled: false,
        disabledReason: 'Modal is settling',
      },
    });

    const resolution = resolveSpaceShortcut(
      keyboardEvent('Escape'),
      commands,
      definitions
    );
    expect(resolution?.definition.id).toBe('help.close');
    expect(resolution?.enabled).toBe(false);
  });

  it('lets the mobile editor sheet own Escape ahead of reader exit', () => {
    const commands = registrations({
      'review.exit': { run: vi.fn() },
      'editor.close': { run: vi.fn() },
    });

    const resolution = resolveSpaceShortcut(
      keyboardEvent('Escape', {
        target: fakeTarget({ editable: true, editor: true }),
      }),
      commands
    );
    expect(resolution?.definition.id).toBe('editor.close');
    expect(resolution?.enabled).toBe(true);
  });

  it('respects events already owned by the browser or another widget', () => {
    const commands = registrations({ 'search.toggle': { run: vi.fn() } });
    expect(
      resolveSpaceShortcut(
        keyboardEvent('k', { ctrlKey: true, defaultPrevented: true }),
        commands
      )
    ).toBeNull();
  });

  it('returns disabled reasons from the generated reference and hides internal closes', () => {
    const reference = getSpaceShortcutReference(
      registrations({
        'help.open': { run: vi.fn() },
        'navigation.add': {
          run: vi.fn(),
          enabled: false,
          disabledReason: 'Admin access is required',
        },
      })
    );

    expect(
      reference.find(entry => entry.definition.id === 'help.open')?.available
    ).toBe(true);
    expect(
      reference.find(entry => entry.definition.id === 'navigation.add')
        ?.unavailableReason
    ).toBe('Admin access is required');
    expect(reference.some(entry => entry.definition.id === 'help.close')).toBe(
      false
    );
    expect(reference.some(entry => entry.definition.id === 'editor.close')).toBe(
      false
    );
  });
});

describe('Space shortcut listener lifecycle', () => {
  it('dispatches through one listener and removes it during cleanup', () => {
    let listener: ((event: KeyboardEvent) => void) | null = null;
    const target = {
      addEventListener: vi.fn(
        (_type: 'keydown', next: (event: KeyboardEvent) => void) => {
          listener = next;
        }
      ),
      removeEventListener: vi.fn(
        (_type: 'keydown', next: (event: KeyboardEvent) => void) => {
          if (listener === next) listener = null;
        }
      ),
    };
    const run = vi.fn();
    const cleanup = installSpaceShortcutListener(target, () =>
      registrations({ 'search.toggle': { run } })
    );

    const event = keyboardEvent('k', { ctrlKey: true });
    expect(listener).not.toBeNull();
    listener!(event);
    expect(run).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(target.addEventListener).toHaveBeenCalledTimes(1);

    cleanup();
    expect(listener).toBeNull();
    expect(target.removeEventListener).toHaveBeenCalledTimes(1);
  });

  it('does not prevent or dispatch a disabled command', () => {
    let listener: ((event: KeyboardEvent) => void) | null = null;
    const target = {
      addEventListener: (
        _type: 'keydown',
        next: (event: KeyboardEvent) => void
      ) => {
        listener = next;
      },
      removeEventListener: () => undefined,
    };
    const run = vi.fn();
    installSpaceShortcutListener(target, () =>
      registrations({ 'navigation.add': { run, enabled: false } })
    );

    const event = keyboardEvent('a', { ctrlKey: true, altKey: true });
    listener!(event);
    expect(run).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
