'use client';

import { RotateCcw, Smartphone } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type Flake = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
};

type PermissionState = 'idle' | 'requesting' | 'enabled' | 'denied' | 'unavailable';

type PermissionCapableConstructor = {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

function createFlakes(centreX: number, centreY: number, globeRadius: number, count: number) {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.sqrt(Math.random()) * globeRadius * 0.88;
    return {
      x: centreX + Math.cos(angle) * distance,
      y: centreY + Math.sin(angle) * distance,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: 1 + Math.random() * 2.4,
      opacity: 0.45 + Math.random() * 0.5,
    } satisfies Flake;
  });
}

export function SnowGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const shakeRef = useRef<() => void>(() => undefined);
  const permissionRef = useRef<PermissionState>('idle');
  const sensorEventSeenRef = useRef(false);
  const [permission, setPermission] = useState<PermissionState>('idle');

  const updatePermission = useCallback((next: PermissionState) => {
    permissionRef.current = next;
    setPermission(next);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !stage || !context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    let width = 1;
    let height = 1;
    let centreX = 0;
    let centreY = 0;
    let globeRadius = 1;
    let flakes: Flake[] = [];
    let frame = 0;
    let previousTime = performance.now();
    let gravityX = 0;
    let gravityY = 0.055;
    let targetGravityX = 0;
    let targetGravityY = 0.055;
    let dragging = false;
    let pointerX = 0;
    let pointerY = 0;
    let baselineBeta: number | null = null;
    let baselineGamma: number | null = null;
    let dark = document.documentElement.classList.contains('dark');

    const resize = () => {
      const bounds = stage.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      centreX = width / 2;
      centreY = height * 0.45;
      globeRadius = Math.min(width * 0.42, height * 0.36);
      flakes = createFlakes(
        centreX,
        centreY,
        globeRadius,
        Math.round(clamp((width * height) / 3000, 110, coarsePointer ? 180 : 260)),
      );
    };

    const addShake = (strength = 1) => {
      for (const flake of flakes) {
        flake.vx += (Math.random() - 0.5) * 3 * strength;
        flake.vy += (Math.random() - 0.8) * 4 * strength;
      }
    };
    shakeRef.current = () => addShake(1);

    const drawGlobe = () => {
      const glass = context.createRadialGradient(
        centreX - globeRadius * 0.35,
        centreY - globeRadius * 0.4,
        globeRadius * 0.08,
        centreX,
        centreY,
        globeRadius,
      );
      if (dark) {
        glass.addColorStop(0, 'rgba(125, 170, 255, 0.22)');
        glass.addColorStop(0.55, 'rgba(35, 45, 76, 0.42)');
        glass.addColorStop(1, 'rgba(8, 10, 20, 0.78)');
      } else {
        glass.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        glass.addColorStop(0.55, 'rgba(203, 225, 255, 0.52)');
        glass.addColorStop(1, 'rgba(113, 150, 207, 0.32)');
      }

      context.save();
      context.beginPath();
      context.arc(centreX, centreY, globeRadius, 0, Math.PI * 2);
      context.clip();
      context.fillStyle = glass;
      context.fillRect(centreX - globeRadius, centreY - globeRadius, globeRadius * 2, globeRadius * 2);

      const snowLine = centreY + globeRadius * 0.56;
      context.fillStyle = dark ? 'rgba(225, 235, 255, 0.92)' : 'rgba(255,255,255,0.97)';
      context.beginPath();
      context.moveTo(centreX - globeRadius, centreY + globeRadius);
      context.lineTo(centreX - globeRadius, snowLine);
      context.quadraticCurveTo(centreX, snowLine - globeRadius * 0.12, centreX + globeRadius, snowLine);
      context.lineTo(centreX + globeRadius, centreY + globeRadius);
      context.closePath();
      context.fill();

      const cabinX = centreX - globeRadius * 0.18;
      const cabinY = snowLine - globeRadius * 0.17;
      context.fillStyle = dark ? '#845c52' : '#9b6554';
      context.fillRect(cabinX, cabinY, globeRadius * 0.28, globeRadius * 0.2);
      context.fillStyle = dark ? '#d9e4ff' : '#f8fbff';
      context.beginPath();
      context.moveTo(cabinX - globeRadius * 0.04, cabinY);
      context.lineTo(cabinX + globeRadius * 0.14, cabinY - globeRadius * 0.15);
      context.lineTo(cabinX + globeRadius * 0.32, cabinY);
      context.closePath();
      context.fill();
      context.fillStyle = '#f5bf55';
      context.fillRect(cabinX + globeRadius * 0.07, cabinY + globeRadius * 0.06, globeRadius * 0.055, globeRadius * 0.06);

      const treeX = centreX + globeRadius * 0.27;
      const treeBase = snowLine;
      context.fillStyle = dark ? '#4f8b75' : '#397963';
      for (let level = 0; level < 3; level += 1) {
        const top = treeBase - globeRadius * (0.18 + level * 0.1);
        const spread = globeRadius * (0.17 - level * 0.028);
        context.beginPath();
        context.moveTo(treeX, top - globeRadius * 0.12);
        context.lineTo(treeX - spread, top + globeRadius * 0.12);
        context.lineTo(treeX + spread, top + globeRadius * 0.12);
        context.closePath();
        context.fill();
      }

      for (const flake of flakes) {
        context.globalAlpha = flake.opacity;
        context.fillStyle = '#ffffff';
        context.beginPath();
        context.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
      context.globalAlpha = 1;

      context.strokeStyle = dark ? 'rgba(215,226,255,0.62)' : 'rgba(255,255,255,0.96)';
      context.lineWidth = Math.max(2, globeRadius * 0.018);
      context.beginPath();
      context.arc(centreX, centreY, globeRadius, 0, Math.PI * 2);
      context.stroke();

      const baseWidth = globeRadius * 1.18;
      const baseY = centreY + globeRadius * 0.86;
      const baseHeight = globeRadius * 0.28;
      context.fillStyle = dark ? '#39323b' : '#66515a';
      context.beginPath();
      context.roundRect(centreX - baseWidth / 2, baseY, baseWidth, baseHeight, globeRadius * 0.08);
      context.fill();
    };

    const draw = (time: number) => {
      const elapsed = Math.min(34, Math.max(1, time - previousTime));
      const frameScale = elapsed / (1000 / 60);
      previousTime = time;

      gravityX += (targetGravityX - gravityX) * 0.08 * frameScale;
      gravityY += (targetGravityY - gravityY) * 0.08 * frameScale;

      if (!reducedMotion) {
        for (const flake of flakes) {
          flake.vx += gravityX * 0.32 * frameScale;
          flake.vy += gravityY * 0.32 * frameScale;
          flake.vx *= Math.pow(0.992, frameScale);
          flake.vy *= Math.pow(0.992, frameScale);
          flake.x += flake.vx * frameScale;
          flake.y += flake.vy * frameScale;

          const dx = flake.x - centreX;
          const dy = flake.y - centreY;
          const distance = Math.max(0.001, Math.hypot(dx, dy));
          const limit = globeRadius - flake.radius - 4;
          if (distance > limit) {
            const normalX = dx / distance;
            const normalY = dy / distance;
            flake.x = centreX + normalX * limit;
            flake.y = centreY + normalY * limit;
            const outward = flake.vx * normalX + flake.vy * normalY;
            if (outward > 0) {
              flake.vx -= normalX * outward * 1.45;
              flake.vy -= normalY * outward * 1.45;
            }
          }
        }
      }

      context.clearRect(0, 0, width, height);
      drawGlobe();
    };

    const animate = (time: number) => {
      draw(time);
      frame = window.requestAnimationFrame(animate);
    };

    const markSensorLive = () => {
      sensorEventSeenRef.current = true;
      if (permissionRef.current !== 'enabled') updatePermission('enabled');
    };

    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.gamma === null) return;
      markSensorLive();
      if (baselineBeta === null || baselineGamma === null) {
        baselineBeta = event.beta;
        baselineGamma = event.gamma;
      }
      targetGravityX = clamp((event.gamma - baselineGamma) / 240, -0.13, 0.13);
      targetGravityY = 0.055 + clamp((event.beta - baselineBeta) / 240, -0.13, 0.13);
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      pointerX = event.clientX;
      pointerY = event.clientY;
      stage.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - pointerX;
      const dy = event.clientY - pointerY;
      pointerX = event.clientX;
      pointerY = event.clientY;
      targetGravityX = clamp(dx / 45, -0.14, 0.14);
      targetGravityY = 0.055 + clamp(dy / 45, -0.14, 0.14);
      for (const flake of flakes) {
        flake.vx += dx * 0.012;
        flake.vy += dy * 0.012;
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      window.setTimeout(() => {
        if (!dragging && permissionRef.current !== 'enabled') {
          targetGravityX = 0;
          targetGravityY = 0.055;
        }
      }, 200);
    };

    const resizeObserver = new ResizeObserver(resize);
    const themeObserver = new MutationObserver(() => {
      dark = document.documentElement.classList.contains('dark');
    });
    resizeObserver.observe(stage);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('deviceorientation', onOrientation);
    resize();
    frame = window.requestAnimationFrame(animate);

    const orientation = (window as unknown as { DeviceOrientationEvent?: PermissionCapableConstructor }).DeviceOrientationEvent;
    if (!window.isSecureContext || !orientation) updatePermission('unavailable');

    return () => {
      shakeRef.current = () => undefined;
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', onPointerUp);
      stage.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('deviceorientation', onOrientation);
    };
  }, [updatePermission]);

  const enableTilt = async () => {
    if (!window.isSecureContext) {
      updatePermission('unavailable');
      return;
    }

    const orientation = (window as unknown as { DeviceOrientationEvent?: PermissionCapableConstructor }).DeviceOrientationEvent;
    if (!orientation) {
      updatePermission('unavailable');
      return;
    }

    sensorEventSeenRef.current = false;
    updatePermission('requesting');
    try {
      const result = orientation.requestPermission ? await orientation.requestPermission() : 'granted';
      if (result !== 'granted') {
        updatePermission('denied');
        return;
      }
      window.setTimeout(() => {
        if (permissionRef.current === 'requesting') {
          updatePermission(sensorEventSeenRef.current ? 'enabled' : 'unavailable');
        }
      }, 1500);
    } catch {
      updatePermission('denied');
    }
  };

  const status =
    permission === 'enabled'
      ? 'Tilt is live.'
      : permission === 'requesting'
        ? 'Waiting for motion…'
        : permission === 'denied'
          ? 'Use drag or the shake button.'
          : permission === 'unavailable'
            ? 'Use drag or the shake button.'
            : 'Drag, shake, or enable phone tilt.';

  return (
    <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-center">
      <div
        ref={stageRef}
        className="relative min-h-[27rem] touch-none overflow-hidden rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_50%_35%,hsl(var(--muted)/0.55),transparent_62%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] sm:min-h-[36rem]"
        data-snow-globe-stage
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Interactive snow globe with a cabin, tree, and simulated snow"
        >
          Interactive snow globe.
        </canvas>
      </div>

      <div className="space-y-3">
        <p className="rounded-2xl border border-border/70 bg-card p-4 text-sm text-muted-foreground" aria-live="polite">
          {status}
        </p>
        <button
          type="button"
          onClick={() => void enableTilt()}
          disabled={permission === 'requesting' || permission === 'enabled' || permission === 'unavailable'}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:cursor-default disabled:opacity-55"
        >
          <Smartphone className="h-4 w-4" aria-hidden="true" />
          {permission === 'enabled'
            ? 'Tilt enabled'
            : permission === 'requesting'
              ? 'Requesting access…'
              : 'Enable phone tilt'}
        </button>
        <button
          type="button"
          onClick={() => shakeRef.current()}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-2 text-sm font-semibold hover:bg-muted"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Shake
        </button>
      </div>
    </section>
  );
}
