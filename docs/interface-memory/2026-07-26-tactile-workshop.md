# Tactile Workshop Notes

_Date: 2026-07-26_

_Status: design memory and experiment map, not a fixed specification_

This note records the current direction for Scrapbook after the reliability and navigation work. It is intentionally historical: it should preserve what felt wrong, what felt promising, and why future changes take a particular shape.

## The larger direction

Scrapbook should feel less like a collection of polished web pages and more like a personal workshop with rooms, instruments, surfaces, residue, and objects that remember who handled them.

The interface can be fast, legible, and structurally conventional underneath while feeling tactile and slightly unruly on top. The goal is not gratuitous animation. The goal is material character.

The useful metaphor is interior design rather than website decoration:

- The homepage is an instrument panel and foyer.
- Space is a workbench and reference console.
- Time is a calibrated dial or cockpit instrument.
- The gallery is a pinboard, back room, or secret club that leaks into the public space.
- The agent journal is a wall of signed field notes, stickers, tickets, scraps, and provenance.

The site should have different materials with different physical behaviour instead of applying one generic spring to every component.

## Decisions already earned

### Natural scrolling only

Do not reintroduce viewport locking to force a composition above the fold.

A common desktop viewport should show the complete homepage without requiring a scroll, but normal document scrolling must remain available for zoom, short windows, large text, mobile browser chrome, and accessibility settings.

The composition should fit because it is dense and well arranged, not because the browser is prevented from behaving normally.

### Motion must communicate material

Every animation should imply something about the object:

- A keycap compresses and releases.
- A split flap rotates around a hinge.
- Tape lifts at an edge.
- A heavy panel settles more slowly than a light paper tag.
- Jelly deforms around the point of contact and carries momentum through its body.
- Smoked acrylic reveals depth through parallax, not blur-heavy unreadability.

Avoid generic floating, bouncing, or scaling that does not correspond to a material or action.

### Reliability remains the floor

Animation cannot reintroduce blank screens, delayed input, scroll traps, accidental pointer capture, inaccessible keyboard behaviour, or heavy always-running work.

When motion is removed through `prefers-reduced-motion`, the interface must still communicate state clearly.

## GitHub activity and API cadence

### Current state

There is not currently a durable counter that records how many upstream GitHub requests the homepage has made over time.

The homepage receives cached server data and the client refreshes the activity endpoint. The primary upstream source is GitHub's public contribution page. A REST events request exists as a fallback.

A one-minute client refresh can be acceptable, but only if it does not imply one upstream request per viewer per minute.

### Recommended cadence

Keep the visible UI refresh interval at approximately 60 seconds if the live quality is desirable, while enforcing the following underneath:

- Shared server or edge caching for the upstream result.
- A single in-flight request per server instance or cache key.
- No refresh while the page is hidden.
- A focus refresh only when the existing snapshot is stale.
- Stale data retained when GitHub is slow or unavailable.
- Exponential backoff after upstream failures.
- A longer upstream freshness window than the client display interval, likely 5 minutes.

This means the client can check every minute while usually receiving a cached response. It also prevents a busy page from multiplying GitHub traffic.

GitHub documents a primary limit of 60 unauthenticated REST requests per hour and 5,000 authenticated REST requests per hour. A literal one-per-minute uncached REST fallback would therefore sit directly on the unauthenticated ceiling. The public contribution HTML request is not the same REST bucket, but it should still be treated politely and cached.

### Lightweight usage visibility

Do not build a large analytics system solely for this widget. Add enough observability to answer whether it is behaving:

- `generatedAt` and `upstreamFetchedAt` timestamps.
- Response metadata for `cache: hit | miss | stale`.
- Upstream source: profile HTML, REST fallback, or retained stale snapshot.
- REST rate-limit headers when the fallback is used.
- A small rolling counter in logs or an existing health store for upstream fetches, failures, and cache hits.

A protected diagnostics view can show the last 24 hours of those counters. This is operational visibility, not a public scoreboard.

## Mechanical homepage scoreboard

The current scoreboard should become a real split-flap object rather than static digits with cursor parallax.

Each digit should contain:

- A fixed upper half.
- A fixed lower half.
- A departing flap rotating down around a centre hinge.
- The incoming digit revealed underneath.
- A narrow hinge seam and internal shadow.
- A short weighted snap near the end of travel.
- At most a one-pixel rebound or chassis tremor after settling.

When the value changes:

- Animate only digits that changed.
- Change directly from the old digit to the new digit rather than counting every intermediate number.
- Stagger from right to left by roughly 30–45 ms.
- Keep the whole interaction under roughly 500 ms.
- Avoid animation when the tab is hidden.
- Under reduced motion, crossfade or replace the digit immediately.

The chassis may respond slightly to hover or touch pressure, but it should feel like a heavy enclosure. The digits should not wobble independently like soft material.

The period labels should read `7D` and `YTD`. The existing annual number is already calendar year-to-date, not a trailing 365-day total. A future detail view may expose `30D`, `YTD`, and trailing `365D`, but the homepage should remain compact.

## Compact contribution matrix

The contribution cells are currently too large for the homepage's role.

Recompose the last 28 days as a compact four-week matrix:

- Four week columns.
- Seven weekday rows.
- Visually small cells, approximately 9–12 px on desktop.
- Larger invisible hit areas where needed for touch accessibility.
- A thin selected-day readout rather than a large status box.
- A concise `28D` label or legend.

### Tooltip continuity

Dense neighbouring targets should behave as one continuous inspection surface.

The current tooltip flickers because leaving each individual cell immediately hides it. Clicking or focusing can also move it to the lower-right because pointer and focus placement compete.

Use one persistent tooltip controller for the entire matrix:

- Mount once and update its content.
- Do not hide while moving between cells.
- Add a 100–150 ms exit grace period for leaving the complete matrix.
- Cancel that exit as soon as another cell is entered.
- Pointer movement controls desktop placement.
- Keyboard focus uses an anchored placement independent of the pointer.
- A desktop click may pin selection but must not jump the tooltip.
- Touch uses a selected-day popover or readout rather than pointer-following behaviour.
- Clamp placement to the viewport without visibly teleporting between ordinary cells.

## A material vocabulary

The site should define a small material system. Each material has visual properties, motion properties, and permitted uses.

### Machined metal

Use for counters, toggles, hinges, calibrated controls, and system status.

- Hard edges or careful radii.
- Tight travel.
- Short weighted settling.
- Subtle specular movement.
- No elastic overshoot.

### Rubber and keycaps

Use for buttons, shortcuts, grading controls, and high-frequency actions.

- One- or two-pixel compression.
- Slight shadow collapse.
- Fast release.
- Optional differing switch profiles: linear, tactile, clicky.

The different profiles could become a playful preference or per-section identity without affecting semantics.

### Paper, tape, and card

Use for gallery entrances, agent notes, provenance, annotations, and temporary-looking material.

- Slight rotation and imperfect alignment.
- Lifted corners on hover.
- Fibrous or printed texture used sparingly.
- Soft, quick movement with little inertia.

### Smoked acrylic and glass

Use only where depth is useful and text contrast remains strong.

- Prefer translucent tint and edge reflection over broad backdrop blur.
- Text receives an opaque local backing when needed.
- Blur must never turn body text into mush.

### Jelly, gel, and slime

Reserve for explicit playful surfaces and the tactile lab.

- Local deformation around contact.
- Momentum propagates through neighbouring points.
- Different presets expose viscosity, density, elasticity, damping, and surface tension.
- The same geometry can feel like water gel, dense silicone, jelly, foam, or sticky slime.

Do not apply jelly behaviour to primary navigation, text, or controls whose location must remain predictable.

## The tactile physics lab

Create an isolated experimental route or package rather than placing a full physics engine into the homepage bundle.

Possible route names:

- `/gallery/lab`
- `/atelier/materials`
- `/workbench`

The first experiment is a tray containing several blocks with different material presets. The user can poke, drag, throw, compress, stir, and toggle agitation.

### Material presets

Each body should expose a serialisable definition:

```ts
interface TactileMaterial {
  id: string;
  label: string;
  density: number;
  elasticity: number;
  damping: number;
  friction: number;
  viscosity: number;
  surfaceTension: number;
  shapeRetention: number;
  pointerCoupling: number;
  colourMode: 'solid' | 'gradient' | 'iridescent' | 'translucent';
}
```

Initial presets:

- Firm silicone.
- Dessert jelly.
- Dense slime.
- Memory foam.
- Rubber puck.
- Loose liquid gel.

A control can switch between manual interaction and a contained agitation mode that swirls or tumbles the bodies.

### Engine direction

Do not start by writing a general-purpose physics engine.

Use three layers:

1. **Interaction and animation layer** — pointer sampling, drag intent, reduced motion, rendering, and UI state.
2. **Rigid collision layer** — boundaries, obstacles, and broad collision response.
3. **Deformable material layer** — a deliberately small position-based or Verlet particle-and-constraint system for soft bodies.

Candidate rigid-body foundations:

- **Matter.js** for a straightforward JavaScript 2D experiment with a low integration cost.
- **p2-es** for a compact JavaScript 2D engine with springs and constraints.
- **Rapier 2D** when deterministic simulation, higher body counts, or a future shared 2D/3D foundation justifies the WASM and bundling cost.

Rapier is fast and provides official JavaScript/WASM packages, but its integration cost is unnecessary for the first jelly tray. Matter.js or p2-es is the more pragmatic first rigid layer.

The deformable body itself will probably still need a small custom solver. A useful first implementation is a grid or perimeter of particles connected by distance and area constraints, stepped at a fixed interval. This gives explicit control over squishiness without pretending to implement fluid dynamics.

### Performance rules

- Fixed simulation step, ideally 60 Hz, with a capped accumulator.
- Rendering may interpolate between physics states.
- Pause fully when hidden or outside the viewport.
- Avoid React state updates for every simulation frame.
- Render through Canvas 2D, WebGL, or direct transforms depending on body count.
- Keep physics state in a dedicated store or worker-friendly structure.
- Cap pointer samples and body counts.
- Use spatial partitioning once naive collision checks become measurable.
- Provide a low-power mode and a static reduced-motion representation.
- Dynamically import the lab so the normal homepage bundle pays nothing for it.

### Extensibility

The lab should support:

- New materials through data rather than component rewrites.
- Recorded interaction replays.
- Deterministic seeds where the chosen engine permits them.
- Screenshot and short-loop capture for gallery artifacts.
- Agent-authored material presets with provenance.
- A debug overlay for frame time, body count, constraint count, and simulation steps.

## Interior-design thinking by room

### Homepage: foyer and instrument panel

- Compact split-flap contribution counter.
- Compact activity matrix.
- Recent systems reduced to slim index cards.
- The gallery physically intrudes at an edge through tape, tabs, or stacked scraps.
- The complete normal composition fits a laptop viewport without disabling scroll.

### Gallery: back room and pinboard

- Allowed to overlap, rotate, accumulate, and retain traces.
- New agent notes can appear as stickers or pinned scraps.
- A taped entrance can appear to peel away from the navigation.
- Every whimsical artifact still has inspectable provenance.

### Space: workbench and console

- Sidebar and editor tools remain accessible while the central list scrolls.
- Desktop can use fixed left and right instruments around a scrolling centre.
- Mobile uses explicit sheets or a bottom action dock rather than shrinking the desktop arrangement.
- Shortcuts are generated from a central registry and exposed through `?` or the command menu.
- Review state and editor state persist while navigating through items.

### Theme control: skylight

The theme toggle can become a tiny aperture rather than an icon swap.

Dark state:

- A dark blue-black interior.
- A few static stars.
- One shooting star on hover, not continuously.
- A moon moving through the aperture during the toggle.

Light state:

- A warm interior.
- A sun disc with a restrained corona.
- Corona movement on hover or during transition only.

The control remains immediate, readable, keyboard accessible, and still works without animation.

## Agent journal and community layer

Treat agent contributions as structured, append-only field notes with a visual representation.

Each entry should include:

- Agent codename.
- Insignia, palette, or sticker style.
- Repository.
- Commit SHA, pull request, workflow run, or other source evidence.
- Exact timestamp.
- Model/runtime identity when available.
- Short account of the work and what was learned.
- Optional image, screenshot, drawing, or generated sticker.
- Publication mode: automatic, reviewed, or personally approved.

The human-facing page can look like a crowded board. The underlying record must remain machine-readable and provenance-first.

Potential surfaces:

- `/gallery/agents`
- `/api/agent-journal`
- `/.well-known/scrapbook-board.json`

Agents should receive narrow publication credentials or submit through signed GitHub workflows. They should not receive general database access. Entries can enter a review queue before becoming visible.

Over time, repositories and agents may develop recurring codenames, motifs, material preferences, and running conversations. The system should permit that emergence without fabricating identity or obscuring the originating model run and source code.

## Interaction grammar

Use a small number of motion families.

### Press

80–120 ms. Immediate acknowledgement of click, tap, or key activation.

### Reveal

180–260 ms. Menus, labels, details, and content appearing without delaying access.

### Mechanical

250–500 ms. Flaps, hinges, editor drawers, toggles, and instrument-like changes.

### Material simulation

Frame-driven only while the explicit experiment is active or directly manipulated.

### Ambient

Rare, slow, and confined to expressive surfaces. Ambient motion pauses when hidden and usually when not hovered.

## Near-term implementation sequence

### Phase 1 — homepage mechanics

1. Replace static scoreboard digits with split-flap digits.
2. Rename annual total to `YTD`.
3. Reduce contribution grid density and overall homepage height.
4. Replace per-cell tooltip lifecycle with one continuous controller.
5. Keep a 60-second visible refresh while adding shared caching, stale retention, and request deduplication.
6. Add lightweight upstream/cache diagnostics.
7. Add press feedback and a material-aware theme toggle.
8. Test Chromium, WebKit, touch, keyboard, and reduced motion.

### Phase 2 — interface memory and gallery intrusion

1. Add a concise current-design constitution derived from these historical notes.
2. Add the taped or secret-club gallery entrance.
3. Establish the gallery's paper/tape/sticker visual grammar.
4. Begin storing screenshots and commit links beside major design decisions.

### Phase 3 — tactile lab

1. Build the isolated tray with rigid rubber blocks.
2. Add one custom deformable body.
3. Add material presets and an agitation toggle.
4. Add debug/performance controls.
5. Evaluate Matter.js and p2-es before considering Rapier.
6. Keep the experiment dynamically imported and absent from normal page bundles.

### Phase 4 — agent journal

1. Define the append-only entry schema.
2. Add a repository-backed proof of concept.
3. Add visual stickers and provenance drawers.
4. Add a machine-readable feed.
5. Add narrow signed ingestion from selected repositories.

### Phase 5 — Space as an instrument

1. Central shortcut registry.
2. Persistent sidebar/editor state.
3. Desktop scrolling centre with accessible tools on both sides.
4. Mobile bottom actions and editor sheet.
5. Provenance-rich model-generated companion solutions.

## Questions worth leaving open

- Should the tactile lab become a gallery room, an atelier experiment, or its own workbench?
- Should material presets be global personal preferences or tied only to specific objects?
- How much of the agent journal should publish automatically?
- Should users be able to replay an agent's interaction with a material experiment?
- Does the homepage gallery intrusion change as new artifacts arrive?
- Should keyboard switch profiles affect only soundless motion, or also subtle optional audio later?
- Is the annual activity figure best kept as YTD, or should the panel allow a discreet period switch?

## Rejected shortcuts

- No viewport locking to force a no-scroll homepage.
- No full physics engine in the main application bundle.
- No random animation applied uniformly to every component.
- No broad backdrop blur behind important text.
- No pointer capture before drag intent is established.
- No agent mythology without visible provenance.
- No live activity polling that multiplies upstream requests by viewer count.

## Summary principle

Make the ordinary interface immediate and dependable. Give selected objects convincing material behaviour. Let the gallery and laboratory become strange. Preserve the evidence underneath everything.
