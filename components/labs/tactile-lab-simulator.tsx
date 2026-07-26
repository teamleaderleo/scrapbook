'use client';

import {
  FIXED_TIMESTEP_SECONDS,
  TACTILE_SEED,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  agitateTactileWorld,
  createTactileWorld,
  nudgeSelectedBody,
  resetTactileWorld,
  selectedBodyAnchor,
  setBlockPosition,
  setParticlePosition,
  stepTactileWorld,
  type SelectedBody,
  type TactileWorld,
  type Vec2,
} from '@/lib/tactile/physics';
import {
  createBrowserFrameScheduler,
  createFixedTimestepLoop,
  type LoopFrame,
} from '@/lib/tactile/loop';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const TACTILE_SIMULATION_CLIENT_MARKER = 'TACTILE_SIMULATION_CLIENT_v1';

const DEBUG_BODY_COUNT = 4;
const DEBUG_PARTICLE_COUNT = 10;
const DEBUG_CONSTRAINT_COUNT = 21;

type DragTarget =
  | { pointerId: number; kind: 'particle'; index: number }
  | { pointerId: number; kind: 'block'; id: string; offset: Vec2 };

type DebugRefs = {
  frame: HTMLSpanElement | null;
  frameTime: HTMLSpanElement | null;
  steps: HTMLSpanElement | null;
  dropped: HTMLSpanElement | null;
};

const EMPTY_FRAME: LoopFrame = {
  steps: 0,
  remainderMs: 0,
  droppedMs: 0,
  timestampMs: 0,
  elapsedMs: 0,
};

function worldPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number): Vec2 {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * WORLD_WIDTH,
    y: ((clientY - rect.top) / rect.height) * WORLD_HEIGHT,
  };
}

function drawWorld(
  canvas: HTMLCanvasElement,
  world: TactileWorld,
  selected: SelectedBody,
): void {
  const context = canvas.getContext('2d');
  if (!context) return;

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const targetWidth = Math.max(1, Math.round(rect.width * pixelRatio));
  const targetHeight = Math.max(1, Math.round(rect.height * pixelRatio));
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  context.setTransform(canvas.width / WORLD_WIDTH, 0, 0, canvas.height / WORLD_HEIGHT, 0, 0);
  context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  context.fillStyle = '#17191d';
  context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  context.strokeStyle = 'rgba(255,255,255,0.055)';
  context.lineWidth = 1;
  for (let x = 24; x < WORLD_WIDTH; x += 24) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, WORLD_HEIGHT);
    context.stroke();
  }
  for (let y = 24; y < WORLD_HEIGHT; y += 24) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(WORLD_WIDTH, y);
    context.stroke();
  }

  context.fillStyle = '#25282d';
  context.fillRect(0, WORLD_HEIGHT - 16, WORLD_WIDTH, 16);
  context.fillRect(0, 0, 10, WORLD_HEIGHT);
  context.fillRect(WORLD_WIDTH - 10, 0, 10, WORLD_HEIGHT);

  for (const block of world.blocks) {
    const left = block.x - block.width / 2;
    const top = block.y - block.height / 2;
    context.fillStyle = block.id === selected ? '#d8cfbd' : '#8f918d';
    context.strokeStyle = block.id === selected ? '#fff9e9' : '#b9bbb6';
    context.lineWidth = block.id === selected ? 4 : 2;
    context.beginPath();
    context.roundRect(left, top, block.width, block.height, 8);
    context.fill();
    context.stroke();
    context.fillStyle = 'rgba(20,22,25,0.55)';
    context.font = '600 10px ui-monospace, monospace';
    context.fillText(block.id.slice(-1).toUpperCase(), left + 8, top + 15);
  }

  const particles = world.particles;
  context.beginPath();
  context.moveTo(particles[0].x, particles[0].y);
  for (let index = 1; index < particles.length; index += 1) {
    context.lineTo(particles[index].x, particles[index].y);
  }
  context.closePath();
  context.fillStyle = selected === 'gel' ? 'rgba(207,183,224,0.78)' : 'rgba(159,132,180,0.68)';
  context.strokeStyle = selected === 'gel' ? '#f0ddff' : '#c4a9d5';
  context.lineWidth = selected === 'gel' ? 5 : 3;
  context.fill();
  context.stroke();

  for (const particle of particles) {
    context.beginPath();
    context.arc(particle.x, particle.y, selected === 'gel' ? 4.5 : 3.5, 0, Math.PI * 2);
    context.fillStyle = '#fff8ff';
    context.fill();
  }
}

function nearestParticle(world: TactileWorld, point: Vec2): number | null {
  let nearest: number | null = null;
  let nearestDistance = 34;
  world.particles.forEach((particle, index) => {
    const candidateDistance = Math.hypot(point.x - particle.x, point.y - particle.y);
    if (candidateDistance < nearestDistance) {
      nearestDistance = candidateDistance;
      nearest = index;
    }
  });
  return nearest;
}

function hitBlock(world: TactileWorld, point: Vec2) {
  return [...world.blocks].reverse().find(
    (block) =>
      point.x >= block.x - block.width / 2 &&
      point.x <= block.x + block.width / 2 &&
      point.y >= block.y - block.height / 2 &&
      point.y <= block.y + block.height / 2,
  );
}

export function TactileLabSimulator() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef(createTactileWorld(TACTILE_SEED));
  const loopRef = useRef<ReturnType<typeof createFixedTimestepLoop> | null>(null);
  const dragRef = useRef<DragTarget | null>(null);
  const selectedRef = useRef<SelectedBody>('gel');
  const lowPowerRef = useRef(false);
  const debugRefs = useRef<DebugRefs>({ frame: null, frameTime: null, steps: null, dropped: null });
  const [selected, setSelected] = useState<SelectedBody>('gel');
  const [manualPaused, setManualPaused] = useState(false);
  const [hiddenPaused, setHiddenPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [lowPower, setLowPower] = useState(false);
  const [continuousOverride, setContinuousOverride] = useState(false);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [announcement, setAnnouncement] = useState('Gel body selected.');

  const modePaused = (reducedMotion || lowPower) && !continuousOverride;
  const effectivePaused = manualPaused || modePaused;
  const running = !effectivePaused && !hiddenPaused;

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    lowPowerRef.current = lowPower;
  }, [lowPower]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setReducedMotion(media.matches);
      if (media.matches) setContinuousOverride(false);
    };
    update();
    media.addEventListener('change', update);
    setPreferencesReady(true);
    return () => media.removeEventListener('change', update);
  }, []);

  const updateDebug = useCallback((frame: LoopFrame) => {
    const world = worldRef.current;
    const anchor = selectedBodyAnchor(world, selectedRef.current);
    const root = rootRef.current;
    if (root) {
      root.dataset.frame = String(world.frame);
      root.dataset.selectedX = anchor.x.toFixed(2);
      root.dataset.selectedY = anchor.y.toFixed(2);
      root.dataset.lastSteps = String(frame.steps);
      root.dataset.droppedMs = frame.droppedMs.toFixed(2);
    }
    if (debugRefs.current.frame) debugRefs.current.frame.textContent = String(world.frame);
    if (debugRefs.current.frameTime) {
      debugRefs.current.frameTime.textContent = `${frame.elapsedMs.toFixed(1)} ms`;
    }
    if (debugRefs.current.steps) debugRefs.current.steps.textContent = String(frame.steps);
    if (debugRefs.current.dropped) {
      debugRefs.current.dropped.textContent = `${frame.droppedMs.toFixed(1)} ms`;
    }
  }, []);

  const renderScene = useCallback(
    (frame: LoopFrame = EMPTY_FRAME) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      drawWorld(canvas, worldRef.current, selectedRef.current);
      updateDebug(frame);
    },
    [updateDebug],
  );

  useEffect(() => {
    if (!preferencesReady) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => renderScene());
    resizeObserver.observe(canvas);
    const loop = createFixedTimestepLoop({
      scheduler: createBrowserFrameScheduler(),
      fixedStepMs: FIXED_TIMESTEP_SECONDS * 1000,
      maxCatchUpSteps: 5,
      step: (deltaSeconds) => {
        stepTactileWorld(worldRef.current, deltaSeconds, {
          solverIterations: lowPowerRef.current ? 3 : 6,
        });
      },
      render: renderScene,
      onVisibilityPause: setHiddenPaused,
    });
    loopRef.current = loop;
    renderScene();
    loop.start();

    return () => {
      loop.stop();
      resizeObserver.disconnect();
      const activeDrag = dragRef.current;
      if (activeDrag && canvas.hasPointerCapture(activeDrag.pointerId)) {
        canvas.releasePointerCapture(activeDrag.pointerId);
      }
      dragRef.current = null;
      loopRef.current = null;
    };
  }, [preferencesReady, renderScene]);

  useEffect(() => {
    const loop = loopRef.current;
    if (!loop) return;
    if (effectivePaused) loop.pause();
    else loop.resume();
  }, [effectivePaused]);

  useEffect(() => {
    renderScene();
  }, [renderScene, selected]);

  const releasePointer = useCallback((pointerId?: number) => {
    const canvas = canvasRef.current;
    const drag = dragRef.current;
    if (!canvas || !drag) return;
    if (pointerId !== undefined && drag.pointerId !== pointerId) return;
    if (canvas.hasPointerCapture(drag.pointerId)) canvas.releasePointerCapture(drag.pointerId);
    dragRef.current = null;
  }, []);

  const reset = useCallback(() => {
    worldRef.current = resetTactileWorld(worldRef.current);
    selectedRef.current = 'gel';
    setSelected('gel');
    setAnnouncement('Scene reset to deterministic seed 411.');
    renderScene();
  }, [renderScene]);

  const agitate = useCallback(() => {
    agitateTactileWorld(worldRef.current, lowPowerRef.current ? 72 : 120);
    setAnnouncement('Bounded agitation applied.');
    renderScene();
  }, [renderScene]);

  const singleStep = useCallback(() => {
    loopRef.current?.singleStep();
    setAnnouncement('Advanced one fixed timestep.');
  }, []);

  const toggleRunning = useCallback(() => {
    if (modePaused) {
      setContinuousOverride(true);
      setManualPaused(false);
      setAnnouncement('Continuous simulation explicitly enabled.');
      return;
    }
    setManualPaused((paused) => {
      setAnnouncement(paused ? 'Simulation resumed.' : 'Simulation paused.');
      return !paused;
    });
  }, [modePaused]);

  const selectBody = useCallback((next: SelectedBody) => {
    selectedRef.current = next;
    setSelected(next);
    setAnnouncement(next === 'gel' ? 'Gel body selected.' : `${next} selected.`);
  }, []);

  const keyboardInstructions = useMemo(
    () =>
      'Keys: 1–4 select a body, arrows nudge, Space pauses or runs, period steps, A agitates, R resets, Escape cancels drag.',
    [],
  );

  return (
    <div
      ref={rootRef}
      className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]"
      data-tactile-lab
      data-sim-ready={preferencesReady ? 'true' : undefined}
      data-sim-bundle={TACTILE_SIMULATION_CLIENT_MARKER}
      data-running={running ? 'true' : 'false'}
      data-hidden-paused={hiddenPaused ? 'true' : 'false'}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      data-low-power={lowPower ? 'true' : 'false'}
      data-selected={selected}
    >
      <section className="min-w-0 rounded-[1.4rem] border border-border/70 bg-card p-3 shadow-[0_18px_44px_rgba(35,31,26,0.1)] dark:shadow-[0_18px_44px_rgba(0,0,0,0.3)] sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-3">
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
              Deterministic scene · seed {TACTILE_SEED}
            </p>
            <p className="mt-1 text-sm font-semibold">Rigid blocks + constrained gel</p>
          </div>
          <span
            className="rounded-full border border-border/70 bg-background px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            data-sim-status
          >
            {hiddenPaused ? 'hidden-tab pause' : running ? 'running' : 'paused'}
          </span>
        </div>

        <canvas
          ref={canvasRef}
          className="block aspect-[12/7] w-full touch-pan-y rounded-[1rem] border border-white/10 bg-[#17191d] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          tabIndex={0}
          aria-label="Tactile simulation stage"
          aria-describedby="tactile-keyboard-instructions"
          aria-keyshortcuts="1 2 3 4 ArrowUp ArrowDown ArrowLeft ArrowRight Space Period A R Escape"
          data-tactile-canvas
          onPointerDown={(event) => {
            const canvas = event.currentTarget;
            const point = worldPoint(canvas, event.clientX, event.clientY);
            const block = hitBlock(worldRef.current, point);
            if (block) {
              selectBody(block.id);
              dragRef.current = {
                pointerId: event.pointerId,
                kind: 'block',
                id: block.id,
                offset: { x: point.x - block.x, y: point.y - block.y },
              };
            } else {
              const particleIndex = nearestParticle(worldRef.current, point);
              if (particleIndex === null) return;
              selectBody('gel');
              dragRef.current = { pointerId: event.pointerId, kind: 'particle', index: particleIndex };
            }
            canvas.setPointerCapture(event.pointerId);
            canvas.focus({ preventScroll: true });
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag || drag.pointerId !== event.pointerId) return;
            event.preventDefault();
            const point = worldPoint(event.currentTarget, event.clientX, event.clientY);
            if (drag.kind === 'particle') {
              setParticlePosition(worldRef.current, drag.index, point);
            } else {
              setBlockPosition(worldRef.current, drag.id, {
                x: point.x - drag.offset.x,
                y: point.y - drag.offset.y,
              });
            }
            renderScene();
          }}
          onPointerUp={(event) => releasePointer(event.pointerId)}
          onPointerCancel={(event) => releasePointer(event.pointerId)}
          onLostPointerCapture={() => {
            dragRef.current = null;
          }}
          onKeyDown={(event) => {
            const key = event.key.toLowerCase();
            const selectionKeys: Record<string, SelectedBody> = {
              '1': 'gel',
              '2': 'block-a',
              '3': 'block-b',
              '4': 'block-c',
            };
            if (selectionKeys[key]) {
              event.preventDefault();
              selectBody(selectionKeys[key]);
              return;
            }
            if (
              key === 'arrowleft' ||
              key === 'arrowright' ||
              key === 'arrowup' ||
              key === 'arrowdown'
            ) {
              event.preventDefault();
              const offset = {
                x: key === 'arrowleft' ? -8 : key === 'arrowright' ? 8 : 0,
                y: key === 'arrowup' ? -8 : key === 'arrowdown' ? 8 : 0,
              };
              nudgeSelectedBody(worldRef.current, selectedRef.current, offset);
              renderScene();
              setAnnouncement(`${selectedRef.current} nudged.`);
              return;
            }
            if (key === ' ') {
              event.preventDefault();
              toggleRunning();
            } else if (key === '.' || key === '>') {
              event.preventDefault();
              singleStep();
            } else if (key === 'a') {
              event.preventDefault();
              agitate();
            } else if (key === 'r') {
              event.preventDefault();
              reset();
            } else if (key === 'escape') {
              releasePointer();
            }
          }}
        />
        <p
          id="tactile-keyboard-instructions"
          className="mt-2 px-1 text-xs leading-relaxed text-muted-foreground"
        >
          {keyboardInstructions}
        </p>
      </section>

      <aside className="min-w-0 space-y-3">
        <section className="rounded-[1.2rem] border border-border/70 bg-card p-4">
          <h2 className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Controls
          </h2>
          <label className="mt-3 block text-xs font-medium" htmlFor="tactile-selection">
            Active body
          </label>
          <select
            id="tactile-selection"
            className="mt-1 min-h-11 w-full rounded-lg border-border bg-background text-sm"
            value={selected}
            data-tactile-selection
            onChange={(event) => selectBody(event.target.value)}
          >
            <option value="gel">Gel body</option>
            <option value="block-a">Block A</option>
            <option value="block-b">Block B</option>
            <option value="block-c">Block C</option>
          </select>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="min-h-11 rounded-lg border border-border bg-background px-3 text-xs font-semibold hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              data-tactile-pause
              onClick={toggleRunning}
            >
              {running ? 'Pause' : modePaused ? 'Run anyway' : 'Resume'}
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-border bg-background px-3 text-xs font-semibold hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              data-tactile-step
              onClick={singleStep}
            >
              Single step
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-border bg-background px-3 text-xs font-semibold hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              data-tactile-agitate
              onClick={agitate}
            >
              Agitate
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-border bg-background px-3 text-xs font-semibold hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              data-tactile-reset
              onClick={reset}
            >
              Reset
            </button>
          </div>

          <button
            type="button"
            className="mt-2 flex min-h-11 w-full items-center justify-between rounded-lg border border-border bg-background px-3 text-xs font-semibold hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-pressed={lowPower}
            data-tactile-low-power
            onClick={() => {
              setLowPower((enabled) => {
                const next = !enabled;
                if (next) setContinuousOverride(false);
                setAnnouncement(
                  next ? 'Low-power single-step mode enabled.' : 'Low-power mode disabled.',
                );
                return next;
              });
            }}
          >
            <span>Low-power mode</span>
            <span aria-hidden="true">{lowPower ? 'on' : 'off'}</span>
          </button>
        </section>

        <section
          className="rounded-[1.2rem] border border-border/70 bg-[#202328] p-4 text-[#f2eee6]"
          data-tactile-debug
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-white/65">
              Compact debug
            </h2>
            <span className="font-mono text-[9px] text-white/50">60 Hz · max 5 catch-up</span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-[10px]">
            <div>
              <dt className="text-white/50">frame</dt>
              <dd
                ref={(node) => {
                  debugRefs.current.frame = node;
                }}
                data-debug-frame
              >
                0
              </dd>
            </div>
            <div>
              <dt className="text-white/50">frame time</dt>
              <dd
                ref={(node) => {
                  debugRefs.current.frameTime = node;
                }}
              >
                0.0 ms
              </dd>
            </div>
            <div>
              <dt className="text-white/50">fixed steps</dt>
              <dd
                ref={(node) => {
                  debugRefs.current.steps = node;
                }}
              >
                0
              </dd>
            </div>
            <div>
              <dt className="text-white/50">dropped</dt>
              <dd
                ref={(node) => {
                  debugRefs.current.dropped = node;
                }}
              >
                0.0 ms
              </dd>
            </div>
            <div>
              <dt className="text-white/50">bodies</dt>
              <dd>{DEBUG_BODY_COUNT}</dd>
            </div>
            <div>
              <dt className="text-white/50">particles</dt>
              <dd>{DEBUG_PARTICLE_COUNT}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-white/50">constraints</dt>
              <dd>{DEBUG_CONSTRAINT_COUNT}</dd>
            </div>
          </dl>
        </section>

        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>
      </aside>
    </div>
  );
}
