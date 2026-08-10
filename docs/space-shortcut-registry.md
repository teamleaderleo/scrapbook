# Space shortcut registry

Space keyboard commands are defined in `lib/space-shortcuts.ts` and dispatched by `SpaceShortcutProvider` in `components/space/space-shortcut-provider.tsx`.

The same typed definitions generate the visible `?` reference. A command cannot acquire a runtime key without also appearing in that reference unless it is an internal modal/sheet command marked `hiddenFromReference`.

## Adding a command

1. Add one definition to `SPACE_SHORTCUTS` with a stable ID, one or more key bindings, scope, category, description, priority, repeat policy, and editable-target policy.
2. Register its handler through `useSpaceShortcut`, or add a layout-owned registration in `SpaceShortcutProvider` for route-wide navigation and shell commands.
3. Supply `enabled: false` and a concise `disabledReason` when the command is visible but unavailable.
4. Add matcher coverage for any new modifier, composition, repeat, editable, or scope behaviour.
5. Add browser coverage when the command changes navigation, a modal or sheet, reader state, Trail position, or editor state.

Do not add another document or window `keydown` listener. Embedded editors that consume browser events may bridge their native command into `executeShortcut(id)`, but the registry remains the owner of command availability and execution.

## Matching conventions

- Modifier matching is exact. `Mod` means Command on Apple platforms and Control elsewhere. Pressing both does not match.
- AltGraph combinations are ignored so international text entry does not trigger `Mod+Alt` commands.
- Editable controls, contenteditable regions, textbox, searchbox, and combobox roles, and IME composition are ignored by default.
- A command may opt into editable targets only for a narrow documented reason. `Mod+K` is allowed so the search palette can close while its input owns focus. The editor toggle is limited to the Space editor scope and its Monaco command bridges into the registry.
- Repeat behaviour is explicit per command. Reader and Trail movement allow key repeat; toggles and navigation commands do not.
- A higher modal, sheet, or local scope wins before command priority. The mobile editor's hidden `editor.close` command therefore owns `Escape` ahead of reader exit while the sheet is open.
- The dispatcher respects `defaultPrevented` and calls `preventDefault()` only after an enabled command wins.
- The Space `Mod+B` handler stops propagation after toggling because the shared `SidebarProvider` retains a window-level fallback for non-Space consumers. This prevents a second toggle without changing other sidebar users.
- Mobile uses the same registry through a visible action rail: search, list/reader, editor, and add all call `executeShortcut` rather than maintaining a second interaction system.

## Current inventory

| Command | Keys | Scope | Repeat |
| --- | --- | --- | --- |
| Shortcut reference | `?` | Global | Ignore |
| Item search | `Mod+K` | Global | Ignore |
| Navigation sidebar | `Mod+B` | Global/shared-provider bridge | Ignore |
| Code editor | `Mod+I` | Global/editor bridge | Ignore |
| Mobile editor close | `Escape` | Sheet, hidden from reference | Ignore |
| Add item | `Mod+Alt+A` | Global | Ignore |
| List/reader switch | `Mod+E`, `Mod+Shift+E` | Global | Ignore |
| Next reader item | `→`, `J` | Local | Allow |
| Previous reader item | `←`, `K` | Local | Allow |
| Reader content | `Space` | Local | Ignore |
| Exit reader | `Escape` | Local | Ignore |
| Hovered list item | `Shift` | Local | Ignore |
| Next Trail recommendation | `J` | Local | Allow |
| Previous Trail recommendation | `K` | Local | Allow |
