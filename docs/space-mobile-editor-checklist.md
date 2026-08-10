# Space mobile actions and editor verification

Use this checklist when the Space mobile action rail or code editor sheet changes. The goal is continuity under real phone constraints, especially browser chrome and the software keyboard, while desktop keeps the existing floating editor geometry.

## Viewports

Test at minimum:

- portrait: `390 × 844`;
- reduced-height landscape: `740 × 390`;
- the same layouts with the visual viewport reduced by a software keyboard;
- one desktop width at `>= 1024px` to confirm the legacy floating editor remains intact.

## Mobile action rail

- Search, List/Reader, and Editor are visible 44px-or-larger touch targets on `/space` and `/space/review`.
- Add is visible but disabled for non-admin users and enabled only with the existing admin contract.
- Actions execute the central Space shortcut registry rather than duplicating command logic.
- The fixed rail respects `env(safe-area-inset-bottom)`.
- Space reserves enough bottom room that the final list/review controls are not hidden behind the rail.
- No horizontal page overflow appears in portrait or reduced-height landscape.
- The Next development diagnostics portal is outside product UI; CI may disable pointer events on `nextjs-portal` when it overlaps the rail.

## Editor opening and lifetime

- First open lazily initializes Monaco/Shiki.
- After first open, dismiss/reopen reuses the same Monaco instance for the current Space session.
- Unsaved text and selection survive Escape and close-button dismissal followed by reopen.
- A slow first Monaco import cannot steal focus after the sheet was already dismissed.
- Desktop still uses the existing breakpoint geometry and `CtrlCmd+I` registry bridge.

## Visual viewport and safe areas

While the mobile editor is open:

- the dialog top equals `visualViewport.offsetTop`;
- the dialog bottom equals `visualViewport.offsetTop + visualViewport.height`;
- delayed or oversized viewport readings are clamped to the layout viewport;
- safe-area top/bottom padding remains usable;
- orientation or visual-viewport resize relayouts Monaco without horizontal overflow.

## Modal boundary

- the editor is exposed as a named modal dialog;
- underlying Space content and the mobile rail are inert and `aria-hidden` while open;
- Escape is owned by the hidden sheet-scope `editor.close` command before reader Escape;
- Monaco bridges its own Escape keydown into that same registry command on mobile so editor focus cannot swallow dismissal;
- focus enters Monaco when ready, with the close control as the pre-initialization fallback;
- close restores the previously focused visible editor trigger;
- captured scroll regions restore to their exact previous positions;
- stale restoration is cancelled if the sheet reopens before the restore frame runs.

## Navigation boundary

The editor sheet stays history-neutral in this slice:

- opening and closing the editor do not mutate the Space URL, hash, or `history.state`;
- browser Back/Forward, canonical view state, and exact reading-position restoration remain owned by Space continuity work in #553;
- durable learning/review state never lives in editor UI state.

## Regression gate

Before merge, require:

- helper unit tests for viewport clamping and focus/scroll restoration;
- shortcut unit tests proving sheet Escape precedence;
- focused Chromium coverage for portrait and reduced-height landscape;
- full repository lint, typecheck, unit suite, production build, and Chromium regression job;
- a self-review confirming no Space data model, auth, review scheduling, ranking, navigation-history mechanism, or draft-storage schema was added accidentally.
