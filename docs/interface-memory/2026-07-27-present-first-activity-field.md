# Present-first activity field study

Date: 2026-07-27  
Issue: #383  
Route: `/activity-lab`

## Scope

This experiment compares three renderings of the same fixed 28-day activity series:

1. the current seven-column square control;
2. a present-first staggered honeycomb;
3. a stepped square pyramid.

The production homepage remains unchanged. The route exists as an isolated comparison surface until #389 settles the compact homepage footprint and Agent 1 reviews integration feasibility.

## Shared interaction contract

All candidates use the same buttons, labels, selected date, and activity scale.

- DOM and screen-reader order run chronologically from the oldest day to today.
- Visual coordinates may reverse or bend that sequence.
- Every day remains a native button with a 44 × 44 CSS px target.
- Arrow keys move one chronological day at a time; Home and End move to the oldest day and today.
- Enter or Space selects the focused day.
- Today uses a persistent pilot light.
- Selection uses a strong independent border.
- Keyboard focus uses a separate outer focus ring.
- Hover only lifts the cell briefly.
- Zero-count days retain a centre mark so they remain deliberate cells.
- One visible readout carries the selected date and contribution count across all candidates.

## Candidate paths

### Square control

Chronology proceeds in ordinary row-major order. The oldest day begins at the upper left and today ends at the lower right.

Field footprint: 320 × 182 px.

Strengths:

- immediate familiarity;
- efficient vertical footprint;
- straightforward week-like scanning.

Costs:

- today reads as the end of the display;
- the visual origin belongs to the oldest day;
- the field continues to resemble a GitHub contribution graph.

### Present-first honeycomb

Today begins at the upper-left origin. Recency then snakes through staggered rows containing six cells each. The second row runs back toward the left, the third runs right again, and so on.

Field footprint: 286 × 196 px.

Strengths:

- the present has a clear visual origin;
- the snake remains predictable after one glance;
- staggered cells feel cellular and instrument-like;
- the footprint is narrower than the square control and only slightly taller;
- six-column rows preserve 44 px targets on narrow mobile screens.

Costs:

- users need a small chronology explanation on first exposure;
- hexagonal fill reduces the apparent painted area inside each rectangular touch target;
- week boundaries become less literal.

### Stepped square pyramid

Today occupies the apex. Each older band adds one cell, producing rows of one through seven cells.

Field footprint: 320 × 320 px.

Strengths:

- the present-first idea is unmistakable;
- the widening historical field feels like accumulated sediment;
- the arrangement is memorable and useful as an experimental comparison.

Costs:

- it consumes substantially more vertical space;
- the diagonal scan is slower;
- chronology becomes harder to parse in the lower rows;
- the form competes with the scoreboard in a compact homepage instrument.

## Recommendation

Carry the present-first honeycomb into the later homepage reconciliation as the preferred candidate.

It provides the clearest change in meaning while preserving a compact field, comfortable targets, chronological accessibility order, and a repeatable keyboard model. Its 286 × 196 px field fits within the size envelope implied by #389 more readily than the square control and far more readily than the pyramid.

Keep the square grid as the control during integration review. Retain the pyramid only as experiment evidence or a future optional laboratory view.

The final homepage decision should wait for Agent 1 to compare the honeycomb against #389's settled scoreboard proportions, short-viewport tests, and side-by-side breakpoint behaviour. No production replacement belongs in this branch.

## Verification targets

The focused Playwright coverage checks:

- chronological DOM order for all three candidates;
- present-first honeycomb origin and the current square-grid endpoint;
- separation of today, selected, and keyboard-focus states;
- chronological arrow-key movement and keyboard selection;
- 44 px targets;
- zero horizontal overflow at mobile portrait, mobile landscape, tablet, and desktop sizes;
- stable desktop and mobile screenshots retained as CI artifacts.
