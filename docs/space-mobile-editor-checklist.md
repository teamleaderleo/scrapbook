# Space mobile editor verification checklist

This checklist records follow-up device verification for the mobile Space action rail and editor sheet. The automated Chromium/WebKit matrix exercises the interaction contract, but this document does not claim a physical iPhone, iPad, or Android device run.

## iOS Safari

1. Open `/space` in portrait, scroll the item list, and open the editor from the bottom action rail.
2. Type a draft, select part of the text, dismiss with Escape from a connected hardware keyboard, and reopen. Confirm the draft and selection remain and the action trigger regains focus.
3. Repeat with the on-screen keyboard visible. Confirm the sheet tracks the visual viewport while Safari's top and bottom toolbars expand or collapse.
4. Close with the sheet button and with browser back. Confirm the URL and current list/review item remain unchanged and the saved scroll position returns without a late jump.
5. Rotate to reduced-height landscape and repeat typing, selection, Escape, close-button, and browser-back dismissal.
6. Confirm the bottom rail clears the home indicator and remains reachable with Larger Text enabled.
7. Enable Reduce Motion and confirm the rail and editor visibility changes do not animate.

## Android Chrome / embedded WebView

1. Repeat portrait and landscape open/close cycles with the software keyboard visible.
2. Use the system back gesture/button to dismiss the editor. Confirm the first back closes the sheet without leaving Space.
3. Confirm TalkBack announces the `Code editor` dialog, its description, and the close button.
4. Scroll the underlying list/review before opening. Confirm the same item, reveal state, focus target, and scroll position return after dismissal.

## General regression

1. On desktop, verify `Mod+I` retains the existing panel geometry and toggles once.
2. Confirm search, list/review, editor, and add actions use the shared shortcut registry and no duplicate keyboard dispatch occurs.
3. Confirm ordinary page scrolling resumes after the editor closes and no horizontal overflow appears at narrow widths.
