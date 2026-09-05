# Practice

`/practice` offers visible function choices over revision-pinned, owner-authorized
Scrapbook excerpts in `lib/code-practice.ts`. Source links retain repository,
commit, file, and line; the source drawer states that no repository license is
declared. The excerpt registry is teaching material, not a live source mirror.

Typing also includes original Patterns and Ideas in `lib/practice-passages.ts`:
cache expiry, counter rates, rolling windows, state transitions, memory headroom,
virtual machines, delayed feedback, and cache freshness. Code and prose use the
same inline typing surface. Optional questions sit under Think it through.
Original passages are labeled separately from repository excerpts; each has its
own revision so changed text cannot silently enter an old speed comparison.
Collection choices keep the passage list short. Existing excerpt history remains
under its original identifier and source revision.

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

Typing happens directly on the reference. A native textarea occupies the same
field as the painted code; it owns keyboard input, selection, clipboard, and
mobile keyboard focus. The visible layer paints entered characters, mistakes,
selection, and the caret. Clicking a character places the caret in the existing
input. Arrow keys, Enter, selection replacement, and backspace remain native.
Escape leaves the field. Desktop can focus an idle field on entry; touch devices
wait for a tap. Recall paints only entered text until the source is revealed.

Practice uses open page surfaces, text controls, and a searchable concept library
with full wrapping titles. It has no function or concept dropdowns. A small
botanical mark and larger margin drawing supply sage accents without sitting
behind the controls. There is no ambient animation; caret blinking respects
reduced motion. Space's shared practice dock uses the same inline typing field.

The homepage now prioritizes dated changes, recently opened pages, practice,
machine health, and the study trail. GitHub contribution counts and polling are
removed from the homepage. The calendar API and its cache remain available for
existing consumers. Featured repository summaries live separately from that
upstream cache and wrap without truncation at mobile widths.

Copy and Recall are separate code modes. Recall hides the source until revealed;
revealing it marks the attempt assisted. Completion records active time, WPM
when meaningful, and newly inserted mismatches that were subsequently corrected.
Deleting text does not add mistakes. Best/last WPM compares the same function,
source revision, and mode, excluding assisted attempts. Each function also has
an explanation question and a change prompt with local notes.

Concept practice is derived from Knowledge's existing Pressure questions and
Invariant sections (falling back to its summary). The current HANDOFF reading
path comes first. No separate concept registry or generated answer key exists.
The reference is an orientation for comparison, not a guaranteed answer to each
pressure question; the complete node remains one link away. Notes are optional;
Revisit and Recalled are explicit self-assessments. Revisit filtering uses the
latest retained assessment for each concept.

`scrapbook:practice-history:v1` stores at most 50 completed attempts or concept
self-checks in this browser. It contains titles, identifiers, dates, and result
metrics; answer text stays in separate local note keys. Recent practice shows
eight entries and offers Clear history. If writing storage fails, the session
remains usable and the UI labels history as session-only. History is not synced
or uploaded. The Code/Concepts material and selected concept are retained in the
URL. Eligible Knowledge nodes link directly to their own practice questions.

There is no code execution, automatic comprehension grading, adaptive difficulty,
or cross-device practice history.
