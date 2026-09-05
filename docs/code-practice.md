# Code practice

`/practice` is a small function picker over revision-pinned, owner-authorized
Scrapbook excerpts in `lib/code-practice.ts`. Source links retain repository,
commit, file, and line; the source drawer states that no repository license is
declared. The excerpt registry is teaching material, not a live source mirror.

The same `TypingExercise` component handles Type mode in Space reading sheets.
An attempt starts on the first edit, pauses on blur or a hidden document, and
finishes on an exact match. Restart clears its timer and returns focus. Attempts
are in memory: reloaded drafts cannot inflate a new timer. Existing Question,
Explain, Trace, Review, and Alter notes retain their browser-local drafts.

Match percentage and error categories describe the current text, not first-try
accuracy. Categories classify the expected character at each mismatched position;
this is positional comparison, not an edit-distance or syntax diff. WPM uses
correct current characters divided by five per active minute. Paste/drop removes
the speed result. Tab indentation is opt-in; Shift+Tab remains normal navigation.

The homepage now prioritizes dated changes, recently opened pages, practice,
machine health, and the study trail. GitHub contribution counts and polling are
removed from the homepage. The calendar API and its cache remain available for
existing consumers. Featured repository summaries live separately from that
upstream cache and wrap without truncation at mobile widths.

Useful next additions need more than speed: saved attempts for the same excerpt,
recall mode, and prompts to modify or test the function. There is currently no
code execution, adaptive difficulty, cross-device practice history, or assessment
of comprehension.
