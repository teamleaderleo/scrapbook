# The Editor Sheet That Tried to Become Navigation

There is an appealing shortcut when a mobile interface grows a full-screen sheet: make the browser Back button close it.

It feels native. The sheet covers the screen, Back means “go back,” and the History API is right there. Push a same-page entry when the sheet opens. Pop it when the sheet closes. Forward can reopen it. A few lines of browser state appear to buy a whole interaction model.

In Scrapbook’s mobile Space editor, that idea survived long enough to become the most complicated part of the feature.

The useful fix was deletion.

## The editor had one real continuity problem

Space already had a floating Monaco editor on desktop. The mobile work in issue [#414](https://github.com/teamleaderleo/scrapbook/issues/414) wanted a clearer phone experience: a bottom action rail, a full-screen editor sheet, software-keyboard-aware sizing, and continuity across dismissal.

The continuity requirement was simple in human terms:

- open the editor;
- type something unfinished;
- close it to look at the note underneath;
- open it again;
- keep the draft and selection exactly where they were.

That did not require durable storage. It did not even require serialization.

The cleanest state container was the editor instance itself.

PR [#574](https://github.com/teamleaderleo/scrapbook/pull/574) changed Monaco from “construct on open, destroy on close” to “construct lazily on first open, keep mounted for the Space session, show or hide the sheet.” Unsaved text and selection could survive because nothing had to reconstruct them.

That part became smaller as soon as state lifetime matched the user’s expectation.

Then we tried to make Back close the sheet.

## A history entry is shared territory

The first implementation pushed a same-URL history entry with an editor marker in `history.state`. The intended model looked tidy:

```text
/space                ordinary Space entry
/space + editor state editor sheet open
Back                  close editor
Forward               reopen editor
```

The browser regression told a stranger story. The dialog could be fully open, Monaco could be initialized, and the custom marker was already gone from `history.state`.

That observation was more important than guessing at an internal mechanism. Scrapbook is a Next.js application; the router also uses browser history state for navigation bookkeeping. Our sheet was treating the history entry like a private object when it was actually a shared protocol surface.

We tried narrowing the trick. Calling the browser’s native `History.prototype.pushState` directly avoided the patched method on the instance, yet it still failed to give the editor durable ownership of the entry. A transient hash entry was simpler to observe, but it made the editor part of URL semantics and started competing with real anchors and route continuity.

Each attempt added code for a promise the editor never needed to make.

The mobile sheet wanted dismissal. The router wanted navigation. Those are related gestures with different owners.

## The winning boundary was boring

The final #574 implementation removed browser-history behavior from the editor.

The sheet owns:

- whether it is visible;
- the retained Monaco instance;
- visual-viewport geometry while the software keyboard is present;
- modal `inert` / `aria-hidden` behavior for the background;
- Escape and close-button dismissal;
- restoration of a meaningful focus target;
- restoration of captured scroll regions.

The router owns the URL and browser navigation.

Monaco even gets a narrow Escape bridge into Space’s shared shortcut registry, because an embedded editor can consume keyboard events before a document-level handler sees them. That is command ownership, not navigation ownership.

Nothing is written to the URL. Nothing is pushed onto the history stack. Nothing about the unfinished draft enters local storage.

The draft survives because the component that owns it stays alive.

## History state became useful one feature later

Deleting editor history did not mean Scrapbook stopped using `history.state`.

The next continuity problem was different.

Space’s list is a real navigational place. A reader can be on page 2 of a filtered lane, have one clipping expanded, scroll down, open the reading Trail, then press Back. Returning to page 1 with every row collapsed is a broken navigation round-trip even though the URL path is technically correct.

PR [#583](https://github.com/teamleaderleo/scrapbook/pull/583) used browser history successfully because the ownership model was explicit.

The canonical URL identifies the durable browse state: lane and filter. The current history entry carries a small namespaced presentation snapshot:

```ts
{
  __scrapbookSpaceUi: {
    version: 2,
    viewKey: "list:archive:topic%3Acontinuity",
    page: 2,
    scrollTop: 412,
    expandedIds: ["item-21"]
  }
}
```

That state belongs to the current canonical entry. It does not create an extra history entry. It preserves the router’s existing fields. It is bounded, versioned, and disposable. A different lane or filter has a different `viewKey` and cannot consume the snapshot.

The browser test verifies the state before leaving Space, navigates to Trail, uses Back, and checks that page, expansion, and scroll return together.

This time browser history was solving a browser-history problem.

## Four places for four kinds of state

The debugging produced a decision rule that now helps with the rest of Space’s continuity work in issue [#553](https://github.com/teamleaderleo/scrapbook/issues/553).

### 1. URL: durable identity

Put state in the URL when someone should be able to reload it, share it, bookmark it, or arrive there from another session.

In Space that means things like lane, filter, and selected reader item.

A later reader fix follows this rule: when keyboard navigation changes the visible reader item, `?item=` should follow the visible item so reload does not open an older selection.

### 2. `history.state`: presentation attached to one navigation entry

Use namespaced history state for small, ephemeral details that belong to a specific canonical page but would make the URL noisy.

Page number, scroll position, and expanded rows fit here. They improve Back/Forward without pretending to be durable knowledge.

Preserve framework-owned fields. Version the payload. Bound it. Treat malformed or cross-view data as absent.

### 3. Component lifetime: transient working state

If state only needs to survive hiding and revealing a tool during the current session, keeping the owning component alive may be the entire persistence layer.

The Monaco draft is the clearest example. Serializing it would have created more synchronization work than the feature required.

### 4. Browser/server cache: reusable data, not navigation

Space also has a bounded public snapshot for archive outages and a separate public first-page cache under review for warm requests. Those caches answer “what data can we reuse safely?” They should not decide “where was the reader standing?”

Conflating cache state with navigation state is another way to create invisible coupling.

## Back is a scarce semantic gesture

The larger lesson is that browser Back is not a generic close button with special hardware support.

It is a promise about navigation history.

Interfaces can choose to put modal state into that history, and sometimes that is exactly right. The choice carries consequences: URL semantics, Forward behavior, framework router bookkeeping, page restoration, nested overlays, anchors, and mobile browser gestures all meet at the same boundary.

For the Space editor, those consequences bought very little. A local close action was clearer.

For the Space list, history state restored real navigational context and earned its complexity.

The difference was not the API. It was ownership.

## Provenance

This dispatch grew out of Scrapbook’s current Space continuity work:

- [#414 — mobile Space actions and editor sheet](https://github.com/teamleaderleo/scrapbook/issues/414)
- [#574 — Make mobile Space actions obvious and keep editor state across dismissal](https://github.com/teamleaderleo/scrapbook/pull/574)
- [#553 — Make Space navigation instant, URL-addressable, and resumable](https://github.com/teamleaderleo/scrapbook/issues/553)
- [#583 — Restore exact Space list state through browser Back](https://github.com/teamleaderleo/scrapbook/pull/583)

The account above describes behavior observed in Scrapbook’s browser regressions and the design decisions that followed. It does not claim an undocumented internal guarantee about how Next.js will manage browser history in every version.

## Revision 1

First public draft. Records the failed editor-history approaches, the history-neutral Monaco decision, and the later list-history pattern that clarified the ownership rule.
